import { OrbitMode } from '@/app/generated/orbit_pb'
import { voiceInputService } from './voiceInputService'
import { recordingStateNotifier } from './recordingStateNotifier'
import { orbitStreamController } from './orbitStreamController'
import { TextInserter } from './text/TextInserter'
import { interactionManager } from './interactions/InteractionManager'
import { contextGrabber } from './context/ContextGrabber'
import { GrammarRulesService } from './grammar/GrammarRulesService'
import { getAdvancedSettings } from './store'
import log from 'electron-log'
import { timingCollector, TimingEventName } from './timing/TimingCollector'
import { actionExecutionService } from './action/ActionExecutionService'

export class OrbitSessionManager {
  private readonly MINIMUM_AUDIO_DURATION_MS = 100
  private textInserter = new TextInserter()
  private streamResponsePromise: Promise<{
    response: any
    audioBuffer: Buffer
    sampleRate: number
  }> | null = null
  private grammarRulesService = new GrammarRulesService('')
  private sessionUsedEditMode = false

  public async startSession(mode: OrbitMode) {
    log.info('[orbitSessionManager] ── startSession ── mode:', mode, '| EDIT?', mode === OrbitMode.EDIT)
    this.sessionUsedEditMode = mode === OrbitMode.EDIT

    // Reuse existing global interaction ID if present, otherwise create a new one
    let interactionId = interactionManager.getCurrentInteractionId()
    if (interactionId) {
      console.log(
        '[orbitSessionManager] Reusing existing interaction ID:',
        interactionId,
      )
      interactionManager.adoptInteractionId(interactionId)
    } else {
      interactionId = interactionManager.initialize()
    }

    // Initialize all necessary components
    const started = await orbitStreamController.initialize(mode)
    if (!started) {
      log.error('[orbitSessionManager] Failed to initialize orbitStreamController')
      return
    }

    // Begin gRPC stream immediately (note, no audio is flowing yet)
    this.streamResponsePromise = orbitStreamController.startGrpcStream()

    // Begin recording audio (audio bytes will now flow into the gRPC stream)
    voiceInputService.startAudioRecording()

    // Send initial mode to the stream
    orbitStreamController.setMode(mode)

    // Update UI state
    recordingStateNotifier.notifyRecordingStarted(mode)

    // Fetch and send context in the background (non-blocking)
    this.fetchAndSendContext().catch(error => {
      log.error('[orbitSessionManager] Failed to fetch/send context:', error)
    })

    // Start timing the interaction
    timingCollector.startInteraction()
    timingCollector.startTiming(TimingEventName.INTERACTION_ACTIVE)

    return interactionId
  }

  private async fetchAndSendContext() {
    console.log('[orbitSessionManager] Gathering context...')

    // Gather all context data (window, app, selected text, vocabulary, settings)
    const context = await contextGrabber.gatherContext(
      orbitStreamController.getCurrentMode(),
    )

    // Send the gathered context to the stream controller
    await orbitStreamController.scheduleConfigUpdate(context)

    // Fetch cursor context for grammar rules only if grammar service is enabled
    const { grammarServiceEnabled } = getAdvancedSettings()
    if (grammarServiceEnabled) {
      const cursorContext = await timingCollector.timeAsync(
        TimingEventName.GRAMMAR_SERVICE,
        async () => await contextGrabber.getCursorContextForGrammar(),
      )
      this.grammarRulesService = new GrammarRulesService(cursorContext)
    }
  }

  public setMode(mode: OrbitMode) {
    log.info('[orbitSessionManager] setMode:', mode, '| was EDIT?', this.sessionUsedEditMode)
    if (mode === OrbitMode.EDIT) {
      this.sessionUsedEditMode = true
    }
    log.info('[orbitSessionManager] sessionUsedEditMode is now:', this.sessionUsedEditMode)

    // Send mode change to grpc stream (will also update windows via recordingStateNotifier)
    orbitStreamController.setMode(mode)

    // Update UI to show the new mode
    recordingStateNotifier.notifyRecordingStarted(mode)
  }

  public async cancelSession() {
    // Capture the promise in a local variable immediately so new sessions can start
    const responsePromise = this.streamResponsePromise
    this.streamResponsePromise = null

    // Clear timing for the interaction on cancel
    timingCollector.clearInteraction()

    // Cancel the transcription (will not create interaction)
    orbitStreamController.cancelTranscription()
    interactionManager.clearCurrentInteraction()

    // Stop audio recording
    await voiceInputService.stopAudioRecording()

    // Update UI state
    recordingStateNotifier.notifyRecordingStopped()

    // Wait for the stream promise to reject with cancellation error
    if (responsePromise) {
      try {
        await responsePromise
      } catch (error) {
        // Expected cancellation error, log and ignore
        console.log('[orbitSessionManager] Stream cancelled as expected:', error)
      }
    }
  }

  public async completeSession() {
    // Capture the promise in a local variable immediately so new sessions can start
    const responsePromise = this.streamResponsePromise
    this.streamResponsePromise = null

    // End timing for the interaction
    timingCollector.endTiming(TimingEventName.INTERACTION_ACTIVE)

    // Stop audio recording and wait for drain
    await voiceInputService.stopAudioRecording()

    // Check actual audio duration (keyboard duration can be misleading due to latency)
    const audioDurationMs = orbitStreamController.getAudioDurationMs()

    if (audioDurationMs < this.MINIMUM_AUDIO_DURATION_MS) {
      console.log(
        `[orbitSessionManager] Audio too short (${audioDurationMs}ms < ${this.MINIMUM_AUDIO_DURATION_MS}ms), cancelling`,
      )
      orbitStreamController.cancelTranscription()
      recordingStateNotifier.notifyRecordingStopped()

      // Wait for the stream promise to reject with cancellation error
      if (responsePromise) {
        try {
          await responsePromise
        } catch (error) {
          // Expected cancellation error, log and ignore
          console.log(
            '[orbitSessionManager] Stream cancelled as expected:',
            error,
          )
        }
      }
      return
    }

    // End the interaction (this will complete the gRPC stream)
    orbitStreamController.endInteraction()

    // Update UI state
    recordingStateNotifier.notifyRecordingStopped()

    // Notify processing started
    recordingStateNotifier.notifyProcessingStarted()

    // Wait for the stream response and handle it
    if (responsePromise) {
      console.log(
        '[orbitSessionManager] Waiting for stream response from server...',
      )
      try {
        const result = await responsePromise
        console.log('[orbitSessionManager] Received stream response:', {
          hasTranscript: !!result.response?.transcript,
          transcriptLength: result.response?.transcript?.length || 0,
          hasError: !!result.response?.error,
          audioBufferSize: result.audioBuffer.length,
        })
        await this.handleTranscriptionResponse(result)
      } catch (error) {
        console.error(
          '[orbitSessionManager] Error waiting for stream response:',
          error,
        )
        await this.handleTranscriptionError(error)
      } finally {
        // Always notify processing stopped after handling response
        recordingStateNotifier.notifyProcessingStopped()
      }
    } else {
      console.warn('[orbitSessionManager] No stream response promise to wait for')
      recordingStateNotifier.notifyProcessingStopped()
    }
  }

  private async handleTranscriptionResponse(result: {
    response: any
    audioBuffer: Buffer
    sampleRate: number
  }) {
    const { response, audioBuffer, sampleRate } = result

    const errorMessage = response.error ? response.error.message : undefined

    // Handle any transcription error
    if (response.error) {
      await interactionManager.createInteraction(
        response.transcript || '',
        audioBuffer,
        sampleRate,
        errorMessage,
      )
      timingCollector.clearInteraction()
      interactionManager.clearCurrentInteraction()
    } else {
      if (response.transcript && !response.error) {
        log.info('[orbitSessionManager] ── handleTranscriptionResponse ──')
        log.info('[orbitSessionManager] Transcript:', response.transcript.slice(0, 100))
        log.info('[orbitSessionManager] sessionUsedEditMode:', this.sessionUsedEditMode)

        if (this.sessionUsedEditMode) {
          // Ctrl+Fn was used during this session — action/tool-calling mode
          log.info('[orbitSessionManager] → Routing to ActionExecutionService')
          await actionExecutionService.handleTranscript(response.transcript)
        } else {
          // Fn: dictation mode — always insert text
          log.info('[orbitSessionManager] Inserting text (dictation mode)')
          let textToInsert = response.transcript

          const { grammarServiceEnabled } = getAdvancedSettings()
          if (grammarServiceEnabled) {
            textToInsert =
              this.grammarRulesService.setCaseFirstWord(textToInsert)
            textToInsert =
              this.grammarRulesService.addLeadingSpaceIfNeeded(textToInsert)
          }

          this.textInserter.insertText(textToInsert)
        }

        // Create interaction in database in background (don't block text insertion)
        interactionManager.createInteraction(
          response.transcript,
          audioBuffer,
          sampleRate,
          errorMessage,
        ).catch(err => log.error('[orbitSessionManager] Failed to save interaction:', err))
      } else {
        log.warn('[orbitSessionManager] Skipping text insertion:', {
          hasTranscript: !!response.transcript,
          transcriptLength: response.transcript?.length || 0,
          hasError: !!response.error,
        })
      }
      timingCollector.finalizeInteraction()
      interactionManager.clearCurrentInteraction()
      orbitStreamController.clearInteractionAudio()
    }
  }

  private async handleTranscriptionError(error: any) {
    log.error(
      '[orbitSessionManager] An unexpected error occurred during transcription:',
      error,
    )
    // Clear timing for the interaction on error
    timingCollector.clearInteraction()

    // Clear current interaction on error
    interactionManager.clearCurrentInteraction()
  }
}

export const orbitSessionManager = new OrbitSessionManager()
