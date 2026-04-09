import { showActionPanel, hideActionPanel, sendActionStateToPanel } from '../app'
import { getCurrentUserId } from '../store'
import type { ActionState, ParsedAction } from '../../types/action'
import { parseActionCommand } from './ActionParser'
import { resolveContacts } from './ContactResolver'
import { actionContextProvider } from './ActionContextProvider'
import { findActiveConnection, executeComposioAction } from './composioApi'
import log from 'electron-log'

const SLACK_ID_RE = /^[UC][A-Z0-9]{8,}$/
const EMAIL_RE = /.+@.+\..+/

/**
 * Check if the parsed action still has unresolved contact parameters.
 * Returns true if the ContactResolver should run.
 */
function contactNeedsResolution(parsed: ParsedAction): boolean {
  if (parsed.toolkitSlug === 'slack') {
    const channel = parsed.parameters.channel
    if (channel && !SLACK_ID_RE.test(channel) && !channel.startsWith('#')) {
      log.info('[Action] Slack channel needs resolution:', channel)
      return true
    }
  }
  if (parsed.toolkitSlug === 'gmail') {
    const email = parsed.parameters.recipient_email
    if (email && !EMAIL_RE.test(email)) {
      log.info('[Action] Gmail recipient needs resolution:', email)
      return true
    }
  }
  return false
}

class ActionExecutionService {
  private currentAction: ParsedAction | null = null

  /**
   * Entry point: called from orbitSessionManager when user triggers Ctrl+Fn (action mode).
   * Always treats the transcript as an action command — shows panel immediately.
   */
  async handleTranscript(transcript: string): Promise<void> {
    try {
      log.info('[Action] ── handleTranscript START ──')
      log.info('[Action] Transcript:', transcript.slice(0, 100))

      // 1. Show the panel and wait for renderer to be ready
      await showActionPanel()
      log.info('[Action] Panel shown and renderer ready')

      // 2. Broadcast "parsing" state
      this.broadcast({ phase: 'parsing', action: null, disambiguation: null, error: null, result: null, toolkitSlug: null })

      // 3. Fetch context (connected services, contacts) + parse in sequence
      log.info('[Action] Fetching action context...')
      let context
      try {
        context = await actionContextProvider.getContext()
        log.info('[Action] Context ready — connected:', context.connectedToolkits.join(', '))
      } catch (ctxError) {
        log.warn('[Action] Context fetch failed, parsing without context:', ctxError)
      }

      // 4. Parse the voice command into a structured action (with context if available)
      log.info('[Action] Calling LLM to parse action...')
      const parsed = await parseActionCommand(transcript, context)
      this.currentAction = parsed
      log.info('[Action] Parsed:', parsed.displayName, '→', parsed.actionSlug, '| toolkit:', parsed.toolkitSlug)
      log.info('[Action] Parameters:', JSON.stringify(parsed.parameters))
      log.info('[Action] Contacts resolved by parser:', parsed.contactsResolved)

      // 5. Check if the required tool is connected
      this.broadcast({ phase: 'checking_connection', action: parsed, disambiguation: null, error: null, result: null, toolkitSlug: parsed.toolkitSlug })

      // Use cached connection from context if available, otherwise look up
      const userId = getCurrentUserId() || 'default'
      let connectionId = context?.connections.get(parsed.toolkitSlug)
      if (!connectionId) {
        const connection = await findActiveConnection(parsed.toolkitSlug, userId)
        connectionId = connection?.id
      }
      log.info('[Action] Connection lookup result:', connectionId ? `found (${connectionId})` : 'NOT FOUND')

      if (!connectionId) {
        this.broadcast({ phase: 'needs_connection', action: parsed, disambiguation: null, error: null, result: null, toolkitSlug: parsed.toolkitSlug })
        return
      }

      // 6. Resolve contacts — always validate even if parser claims contactsResolved
      //    The LLM may set contactsResolved=true but still output a raw name instead of a real ID.
      const needsResolution = contactNeedsResolution(parsed)
      if (needsResolution) {
        try {
          this.broadcast({ phase: 'resolving_contacts', action: parsed, disambiguation: null, error: null, result: null, toolkitSlug: parsed.toolkitSlug })

          log.info('[Action] Resolving contacts for userId:', userId)
          const resolution = await resolveContacts(parsed, connectionId, userId, context)

          parsed.parameters = resolution.updatedParameters
          this.currentAction = parsed
          log.info('[Action] Contact resolution done. Resolved:', resolution.resolved, '| Updated params:', JSON.stringify(parsed.parameters))

          if (!resolution.resolved && resolution.disambiguation) {
            log.info('[Action] Disambiguation needed:', resolution.disambiguation.question)
            this.broadcast({ phase: 'disambiguating', action: parsed, disambiguation: resolution.disambiguation, error: null, result: null, toolkitSlug: parsed.toolkitSlug })
            return
          }
        } catch (resolveError) {
          log.warn('[Action] Contact resolution failed, proceeding with raw values:', resolveError)
        }
      } else {
        log.info('[Action] Contacts already valid (Slack ID or email), skipping resolver')
      }

      // 7. Show confirmation UI
      log.info('[Action] Showing confirmation UI')
      this.broadcast({ phase: 'confirming', action: parsed, disambiguation: null, error: null, result: null, toolkitSlug: parsed.toolkitSlug })
      log.info('[Action] ── handleTranscript DONE ──')
    } catch (error) {
      log.error('[Action] handleTranscript FAILED:', error)
      this.broadcast({
        phase: 'error',
        action: null,
        disambiguation: null,
        error: error instanceof Error ? error.message : 'Failed to process command',
        result: null,
        toolkitSlug: null,
      })
    }
  }

  async confirmAction(actionId: string, editedParameters?: Record<string, any>): Promise<void> {
    if (!this.currentAction || this.currentAction.id !== actionId) {
      log.warn('[Action] confirmAction: no matching action for id', actionId)
      return
    }

    // Apply any user-edited parameters
    if (editedParameters) {
      this.currentAction.parameters = { ...this.currentAction.parameters, ...editedParameters }
      log.info('[Action] Applied edited parameters:', JSON.stringify(editedParameters))
    }

    log.info('[Action] Confirming action:', this.currentAction.displayName)
    this.broadcast({ phase: 'executing', action: this.currentAction, disambiguation: null, error: null, result: null, toolkitSlug: this.currentAction.toolkitSlug })

    try {
      const userId = getCurrentUserId() || 'default'
      const connection = await findActiveConnection(this.currentAction.toolkitSlug, userId)

      if (!connection) {
        this.broadcast({ phase: 'needs_connection', action: this.currentAction, disambiguation: null, error: null, result: null, toolkitSlug: this.currentAction.toolkitSlug })
        return
      }

      log.info('[Action] Executing via Composio:', this.currentAction.actionSlug)
      log.info('[Action] Final args:', JSON.stringify(this.currentAction.parameters))
      const result = await executeComposioAction(
        this.currentAction.actionSlug,
        connection.id,
        userId,
        this.currentAction.parameters,
      )

      log.info('[Action] Execution SUCCESS')
      this.broadcast({ phase: 'success', action: this.currentAction, disambiguation: null, error: null, result, toolkitSlug: this.currentAction.toolkitSlug })
    } catch (error) {
      log.error('[Action] Execution FAILED:', error)
      this.broadcast({
        phase: 'error',
        action: this.currentAction,
        disambiguation: null,
        error: error instanceof Error ? error.message : 'Action execution failed',
        result: null,
        toolkitSlug: this.currentAction?.toolkitSlug || null,
      })
    }
  }

  async handleDisambiguation(actionId: string, field: string, value: string): Promise<void> {
    if (!this.currentAction || this.currentAction.id !== actionId) return

    log.info('[Action] Disambiguation resolved:', field, '=', value)
    this.currentAction.parameters[field] = value
    this.broadcast({ phase: 'confirming', action: this.currentAction, disambiguation: null, error: null, result: null, toolkitSlug: this.currentAction.toolkitSlug })
  }

  /**
   * Called when a Composio OAuth connection completes (deep link callback).
   * If there's a pending action waiting for a connection, resume the flow.
   */
  async retryAfterConnection(): Promise<void> {
    if (!this.currentAction) {
      log.info('[Action] retryAfterConnection: no pending action, ignoring')
      return
    }

    // Invalidate context cache since a new connection was just added
    actionContextProvider.invalidateCache()

    const parsed = this.currentAction
    log.info('[Action] retryAfterConnection: resuming action', parsed.displayName, 'for toolkit', parsed.toolkitSlug)

    try {
      // Re-check connection
      this.broadcast({ phase: 'checking_connection', action: parsed, disambiguation: null, error: null, result: null, toolkitSlug: parsed.toolkitSlug })

      const userId = getCurrentUserId() || 'default'
      const connection = await findActiveConnection(parsed.toolkitSlug, userId)
      if (!connection) {
        log.warn('[Action] retryAfterConnection: still no connection found')
        this.broadcast({ phase: 'needs_connection', action: parsed, disambiguation: null, error: null, result: null, toolkitSlug: parsed.toolkitSlug })
        return
      }

      log.info('[Action] retryAfterConnection: connection found!', connection.id)

      // Resolve contacts — fetch fresh context for member list
      let retryContext
      try {
        retryContext = await actionContextProvider.getContext()
      } catch { /* proceed without context */ }

      try {
        this.broadcast({ phase: 'resolving_contacts', action: parsed, disambiguation: null, error: null, result: null, toolkitSlug: parsed.toolkitSlug })

        const resolution = await resolveContacts(parsed, connection.id, userId, retryContext)

        parsed.parameters = resolution.updatedParameters
        this.currentAction = parsed

        if (!resolution.resolved && resolution.disambiguation) {
          this.broadcast({ phase: 'disambiguating', action: parsed, disambiguation: resolution.disambiguation, error: null, result: null, toolkitSlug: parsed.toolkitSlug })
          return
        }
      } catch (resolveError) {
        log.warn('[Action] retryAfterConnection: contact resolution failed, proceeding:', resolveError)
      }

      // Show confirmation
      this.broadcast({ phase: 'confirming', action: parsed, disambiguation: null, error: null, result: null, toolkitSlug: parsed.toolkitSlug })
    } catch (error) {
      log.error('[Action] retryAfterConnection FAILED:', error)
      this.broadcast({
        phase: 'error',
        action: parsed,
        disambiguation: null,
        error: error instanceof Error ? error.message : 'Failed to resume after connection',
        result: null,
        toolkitSlug: parsed.toolkitSlug,
      })
    }
  }

  cancelAction(actionId: string): void {
    log.info('[Action] Cancelling action:', actionId)
    if (this.currentAction?.id === actionId) {
      this.currentAction = null
    }
    hideActionPanel()
  }

  /**
   * Send state to the action panel renderer via the queued IPC channel in app.ts.
   * This ensures messages are never lost even if the renderer isn't ready yet.
   */
  private broadcast(state: ActionState): void {
    log.info('[Action] Broadcasting state:', state.phase)
    sendActionStateToPanel(state)
  }
}

export const actionExecutionService = new ActionExecutionService()
