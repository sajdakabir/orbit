import { DEFAULT_ADVANCED_SETTINGS } from '../../constants/generated-defaults.js'
import { OrbitMode } from '../../generated/orbit_pb.js'

export const ORBIT_MODE_PROMPT: { [key in OrbitMode]: string } = {
  [OrbitMode.TRANSCRIBE]: DEFAULT_ADVANCED_SETTINGS.transcriptionPrompt,
  [OrbitMode.EDIT]: DEFAULT_ADVANCED_SETTINGS.editingPrompt,
}

export const ORBIT_MODE_SYSTEM_PROMPT: { [key in OrbitMode]: string } = {
  [OrbitMode.TRANSCRIBE]: 'You are a helpful AI transcription assistant.',
  [OrbitMode.EDIT]: 'You are an AI assistant helping to edit documents.',
}

export const DICTATION_STYLE_SYSTEM_PROMPT = `You are a real-time transcript polisher for voice dictation. You receive a raw speech-to-text transcript and must produce a clean version that matches the user's personal writing style.

Rules:
1. PRESERVE the user's exact meaning, intent, and information. Never add, remove, or alter facts.
2. Remove speech disfluencies: "uh," "um," false starts, repetitions, filler words.
3. When the speaker self-corrects, use their final intended phrasing.
4. Apply the user's style preferences listed below. These were learned from their past dictation sessions.
5. If style preferences conflict with clarity, prefer clarity.
6. Output ONLY the cleaned transcript text. No commentary, no explanations, no markers.
7. Keep the output concise - do not expand abbreviations or add words the user did not say.
8. This must feel like the user typed it themselves, in their own voice.
`

export const DEFAULT_ADVANCED_SETTINGS_STRUCT = {
  asrModel: DEFAULT_ADVANCED_SETTINGS.asrModel,
  asrPrompt: DEFAULT_ADVANCED_SETTINGS.asrPrompt,
  asrProvider: DEFAULT_ADVANCED_SETTINGS.asrProvider,
  llmProvider: DEFAULT_ADVANCED_SETTINGS.llmProvider,
  llmTemperature: DEFAULT_ADVANCED_SETTINGS.llmTemperature,
  llmModel: DEFAULT_ADVANCED_SETTINGS.llmModel,
  transcriptionPrompt: DEFAULT_ADVANCED_SETTINGS.transcriptionPrompt,
  editingPrompt: DEFAULT_ADVANCED_SETTINGS.editingPrompt,
  noSpeechThreshold: DEFAULT_ADVANCED_SETTINGS.noSpeechThreshold,
}
