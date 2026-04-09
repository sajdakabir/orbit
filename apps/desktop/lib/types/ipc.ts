import { OrbitMode } from '@/app/generated/orbit_pb'

// IPC Event Constants
export const IPC_EVENTS = {
  RECORDING_STATE_UPDATE: 'recording-state-update',
  PROCESSING_STATE_UPDATE: 'processing-state-update',
  VOLUME_UPDATE: 'volume-update',
  FORCE_DEVICE_LIST_RELOAD: 'force-device-list-reload',
  SETTINGS_UPDATE: 'settings-update',
  ONBOARDING_UPDATE: 'onboarding-update',
  USER_AUTH_UPDATE: 'user-auth-update',
  ACTION_STATE_UPDATE: 'action-state-update',
  ACTION_CONFIRM: 'action-confirm',
  ACTION_CANCEL: 'action-cancel',
  ACTION_DISAMBIGUATE: 'action-disambiguate',
  ACTION_CONNECT_TOOL: 'action-connect-tool',
} as const

// IPC Payload Types
export interface RecordingStatePayload {
  isRecording: boolean
  mode?: OrbitMode
}

export interface ProcessingStatePayload {
  isProcessing: boolean
  mode?: OrbitMode
}

export interface VolumeUpdatePayload {
  volume: number
}

// Generic IPC Response Types
export type IpcResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorType?: string }

export type IpcResponse<T> = Promise<IpcResult<T>>
