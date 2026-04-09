import { HeaderValidator } from '../../validation/HeaderValidator.js'
import { OrbitContext } from './types.js'
import { ORBIT_MODE_PROMPT } from './constants.js'
import { DEFAULT_ADVANCED_SETTINGS } from '../../constants/generated-defaults.js'
import { OrbitMode } from '../../generated/orbit_pb.js'
import {
  END_APP_NAME_MARKER,
  END_CONTEXT_MARKER,
  END_USER_COMMAND_MARKER,
  END_WINDOW_TITLE_MARKER,
  START_APP_NAME_MARKER,
  START_CONTEXT_MARKER,
  START_USER_COMMAND_MARKER,
  START_WINDOW_TITLE_MARKER,
} from '../../constants/markers.js'

export function createUserPromptWithContext(
  transcript: string,
  context?: OrbitContext,
): string {
  let contextPrompt = ''
  if (context) {
    if (context.windowTitle) {
      contextPrompt += `\n${START_WINDOW_TITLE_MARKER}\n${context.windowTitle}\n${END_WINDOW_TITLE_MARKER}`
    }
    if (context.appName) {
      contextPrompt += `\n${START_APP_NAME_MARKER}\n${context.appName}\n${END_APP_NAME_MARKER}`
    }
  }
  const userPrompt = `
    ${contextPrompt}${context?.contextText ? '\n' : ''}
    ${START_CONTEXT_MARKER}
    ${context?.contextText || ''}
    ${END_CONTEXT_MARKER}
    ${START_USER_COMMAND_MARKER}
    ${transcript}
    ${END_USER_COMMAND_MARKER}
  `
  return userPrompt
}

function validateAndTransformHeaderValue<T>(
  headers: Headers,
  headerName: string,
  defaultValue: T,
  validator: (value: T) => T,
  logName: string,
): T {
  const headerValue = headers.get(headerName)
  let valueToValidate = (headerValue || defaultValue) as T
  if (typeof defaultValue === 'number') {
    valueToValidate = Number(valueToValidate) as T
  }
  const validatedValue = validator(valueToValidate)
  console.log(
    `[Transcription] Using validated ${logName}: ${typeof validatedValue === 'string' ? validatedValue.slice(0, 50) + '...' : validatedValue} (source: ${headerValue ? 'header' : 'default'})`,
  )
  return validatedValue
}

export function getAdvancedSettingsHeaders(headers: Headers) {
  const asrModel = validateAndTransformHeaderValue(
    headers,
    'asr-model',
    DEFAULT_ADVANCED_SETTINGS.asrModel,
    HeaderValidator.validateAsrModel,
    'ASR model',
  )

  const asrProvider = validateAndTransformHeaderValue(
    headers,
    'asr-provider',
    DEFAULT_ADVANCED_SETTINGS.asrProvider,
    HeaderValidator.validateAsrProvider,
    'ASR Provider',
  )

  const asrPrompt = validateAndTransformHeaderValue(
    headers,
    'asr-prompt',
    DEFAULT_ADVANCED_SETTINGS.asrPrompt,
    HeaderValidator.validateAsrPrompt,
    'ASR prompt',
  )

  const llmProvider = validateAndTransformHeaderValue(
    headers,
    'llm-provider',
    DEFAULT_ADVANCED_SETTINGS.llmProvider,
    HeaderValidator.validateLlmProvider,
    'LLM Provider',
  )

  const llmModel = validateAndTransformHeaderValue(
    headers,
    'llm-model',
    DEFAULT_ADVANCED_SETTINGS.llmModel,
    HeaderValidator.validateLlmModel,
    'LLM model',
  )

  const llmTemperature = validateAndTransformHeaderValue(
    headers,
    'llm-temperature',
    DEFAULT_ADVANCED_SETTINGS.llmTemperature,
    HeaderValidator.validateLlmTemperature,
    'LLM temperature',
  )

  const transcriptionPrompt = validateAndTransformHeaderValue(
    headers,
    'transcription-prompt',
    DEFAULT_ADVANCED_SETTINGS.transcriptionPrompt,
    HeaderValidator.validateTranscriptionPrompt,
    'Transcription prompt',
  )

  const editingPrompt = validateAndTransformHeaderValue(
    headers,
    'editing-prompt',
    DEFAULT_ADVANCED_SETTINGS.editingPrompt,
    HeaderValidator.validateEditingPrompt,
    'Editing prompt',
  )

  const noSpeechThreshold = validateAndTransformHeaderValue(
    headers,
    'no-speech-threshold',
    DEFAULT_ADVANCED_SETTINGS.noSpeechThreshold,
    HeaderValidator.validateNoSpeechThreshold,
    'No speech threshold',
  )

  return {
    asrModel,
    asrProvider,
    asrPrompt,
    llmProvider,
    llmModel,
    llmTemperature,
    transcriptionPrompt,
    editingPrompt,
    noSpeechThreshold,
  }
}

export function getOrbitMode(input: unknown): OrbitMode | undefined {
  try {
    const inputNumber = Number(input)
    if (isNaN(inputNumber) || !Number.isFinite(inputNumber)) {
      return undefined
    }

    return inputNumber as OrbitMode
  } catch (error) {
    console.error('Error parsing Orbit mode:', error)
    return undefined
  }
}

export function detectOrbitMode(transcript: string): OrbitMode {
  const words = transcript.trim().split(/\s+/)
  const firstFiveWords = words.slice(0, 5).join(' ').toLowerCase()

  return firstFiveWords.includes('hey orbit')
    ? OrbitMode.EDIT
    : OrbitMode.TRANSCRIBE
}

export function getPromptForMode(
  mode: OrbitMode,
  advancedSettingsHeaders: ReturnType<typeof getAdvancedSettingsHeaders>,
): string {
  switch (mode) {
    case OrbitMode.EDIT:
      return (
        // TODO: Figure out how to version advanced settings such that we can overwrite user settings when a significant change is made
        // advancedSettingsHeaders.editingPrompt || ORBIT_MODE_PROMPT[OrbitMode.EDIT]
        ORBIT_MODE_PROMPT[OrbitMode.EDIT]
      )
    case OrbitMode.TRANSCRIBE:
      return (
        advancedSettingsHeaders.transcriptionPrompt ||
        ORBIT_MODE_PROMPT[OrbitMode.TRANSCRIBE]
      )
    default:
      return ORBIT_MODE_PROMPT[OrbitMode.TRANSCRIBE]
  }
}
