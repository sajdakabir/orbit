import { create } from 'zustand'
import type {
  ActionPhase,
  ActionState,
  ParsedAction,
  DisambiguationRequest,
} from '@/lib/types/action'

interface ActionStore {
  visible: boolean
  phase: ActionPhase | null
  action: ParsedAction | null
  disambiguation: DisambiguationRequest | null
  error: string | null
  result: any | null
  toolkitSlug: string | null

  updateFromIPC: (state: ActionState) => void
  confirm: (editedParameters?: Record<string, any>) => void
  cancel: () => void
  disambiguate: (field: string, value: string) => void
  connectTool: () => void
  dismiss: () => void
}

export const useActionStore = create<ActionStore>((set, get) => ({
  visible: false,
  phase: null,
  action: null,
  disambiguation: null,
  error: null,
  result: null,
  toolkitSlug: null,

  updateFromIPC: (state: ActionState) => {
    // Only show the panel for meaningful phases (not the brief 'detecting' flash)
    const showPanel =
      state.phase !== 'detecting' ||
      (state.phase === 'detecting' && state.action !== null)

    set({
      visible:
        state.phase === 'parsing' ||
        state.phase === 'checking_connection' ||
        state.phase === 'needs_connection' ||
        state.phase === 'resolving_contacts' ||
        state.phase === 'confirming' ||
        state.phase === 'disambiguating' ||
        state.phase === 'executing' ||
        state.phase === 'success' ||
        state.phase === 'error',
      phase: state.phase,
      action: state.action,
      disambiguation: state.disambiguation,
      error: state.error,
      result: state.result,
      toolkitSlug: state.toolkitSlug,
    })
  },

  confirm: (editedParameters?: Record<string, any>) => {
    const { action } = get()
    if (action) {
      window.api.action.confirm(action.id, editedParameters)
    }
  },

  cancel: () => {
    const { action } = get()
    if (action) {
      window.api.action.cancel(action.id)
    }
    set({ visible: false, phase: null, action: null })
  },

  disambiguate: (field: string, value: string) => {
    const { action } = get()
    if (action) {
      window.api.action.disambiguate(action.id, field, value)
    }
  },

  connectTool: () => {
    const { toolkitSlug } = get()
    if (toolkitSlug) {
      window.api.action.connectTool(toolkitSlug)
    }
  },

  dismiss: () => {
    set({
      visible: false,
      phase: null,
      action: null,
      disambiguation: null,
      error: null,
      result: null,
      toolkitSlug: null,
    })
  },
}))
