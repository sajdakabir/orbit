import { create } from 'zustand'
import { analytics, ANALYTICS_EVENTS } from '../components/analytics'
import { STORE_KEYS } from '../../lib/constants/store-keys'

// Onboarding category constants
export const ONBOARDING_CATEGORIES = {
  SIGN_UP: 'sign-up',
  PERMISSIONS: 'permissions',
  SET_UP: 'set-up',
  TRY_IT: 'try-it',
} as const

// Export the type so it can be used in other files
export type OnboardingCategory =
  (typeof ONBOARDING_CATEGORIES)[keyof typeof ONBOARDING_CATEGORIES]

interface OnboardingState {
  onboardingStep: number
  totalOnboardingSteps: number
  onboardingCompleted: boolean
  onboardingCategory: OnboardingCategory
  referralSource: string | null
  incrementOnboardingStep: () => void
  decrementOnboardingStep: () => void
  setOnboardingStep: (step: number) => void
  setReferralSource: (source: string) => void
  setOnboardingCompleted: () => void
  resetOnboarding: () => void
  resetOnboardingLocal: () => void
  initializeOnboarding: () => void
  hydrateFromDatabase: () => Promise<void>
}

// Step name constants (authentication is separate from onboarding)
export const STEP_NAMES = {
  REFERRAL_SOURCE: 'referral_source',
  DATA_CONTROL: 'data_control',
  PERMISSIONS: 'permissions',
  MICROPHONE_TEST: 'microphone_test',
  KEYBOARD_TEST: 'keyboard_test',
  GOOD_TO_GO: 'good_to_go',
  INTRODUCING_INTELLIGENT_MODE: 'introducing_intelligent_mode',
  ANY_APP: 'any_app',
  TRY_IT_OUT: 'try_it_out',
}

// Order here matters for onboarding flow (starts after authentication)
export const STEP_NAMES_ARRAY = [
  STEP_NAMES.REFERRAL_SOURCE,
  STEP_NAMES.DATA_CONTROL,
  STEP_NAMES.PERMISSIONS,
  STEP_NAMES.MICROPHONE_TEST,
  STEP_NAMES.KEYBOARD_TEST,
  STEP_NAMES.GOOD_TO_GO,
  STEP_NAMES.INTRODUCING_INTELLIGENT_MODE,
  STEP_NAMES.ANY_APP,
  STEP_NAMES.TRY_IT_OUT,
]

const getOnboardingCategory = (onboardingStep: number): OnboardingCategory => {
  // Step 0-1: Referral, Data Control (sign-up category for analytics)
  if (onboardingStep < 2) return ONBOARDING_CATEGORIES.SIGN_UP
  // Step 2: Permissions
  if (onboardingStep < 3) return ONBOARDING_CATEGORIES.PERMISSIONS
  // Step 3-5: Microphone, Keyboard, Good to go (set-up)
  if (onboardingStep < 6) return ONBOARDING_CATEGORIES.SET_UP
  // Step 6-8: Intelligent mode, Any app, Try it out
  return ONBOARDING_CATEGORIES.TRY_IT
}

export const getOnboardingCategoryIndex = (
  onboardingCategory: OnboardingCategory,
): number => {
  if (onboardingCategory === ONBOARDING_CATEGORIES.SIGN_UP) return 0
  if (onboardingCategory === ONBOARDING_CATEGORIES.PERMISSIONS) return 1
  if (onboardingCategory === ONBOARDING_CATEGORIES.SET_UP) return 2
  return 3
}

const getStepName = (step: number): string => {
  return STEP_NAMES_ARRAY[step] || 'unknown'
}

// Initialize with default values - will be hydrated from SQLite per-user after auth
const getInitialState = () => {
  return {
    onboardingStep: 0,
    onboardingCompleted: false,
  }
}

// Sync to SQLite database (per-user) via IPC
const syncToStore = (state: Partial<OnboardingState>) => {
  if ('onboardingStep' in state || 'onboardingCompleted' in state) {
    // FIRST: Save to electron-store synchronously (instant persistence)
    const currentOnboarding = window.api.electronStoreGet('onboarding') || {}
    window.api.electronStoreSet('onboarding', {
      ...currentOnboarding,
      onboardingCompleted: state.onboardingCompleted,
      onboardingStep: state.onboardingStep,
    })

    // THEN: Notify main process to save to SQLite (per-user, async background sync)
    window.api.notifyOnboardingUpdate(state)
  }
}

export const useOnboardingStore = create<OnboardingState>(set => {
  const initialState = getInitialState()
  const totalOnboardingSteps = STEP_NAMES_ARRAY.length

  return {
    onboardingStep: initialState.onboardingStep,
    totalOnboardingSteps,
    onboardingCompleted: initialState.onboardingCompleted,
    onboardingCategory: getOnboardingCategory(initialState.onboardingStep),
    referralSource: null,
    incrementOnboardingStep: () =>
      set(state => {
        const onboardingStep = Math.min(
          state.onboardingStep + 1,
          state.totalOnboardingSteps,
        )
        const onboardingCategory = getOnboardingCategory(onboardingStep)
        const newState = {
          onboardingStep,
          onboardingCategory,
        }
        // Track onboarding step completion
        analytics.trackOnboarding(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
          step: state.onboardingStep, // The step that was just completed
          step_name: getStepName(state.onboardingStep),
          category: state.onboardingCategory,
          total_steps: state.totalOnboardingSteps,
          referral_source: state.referralSource || undefined,
        })

        // Track viewing of new step
        if (onboardingStep < state.totalOnboardingSteps) {
          analytics.trackOnboarding(ANALYTICS_EVENTS.ONBOARDING_STEP_VIEWED, {
            step: onboardingStep,
            step_name: getStepName(onboardingStep),
            category: onboardingCategory,
            total_steps: state.totalOnboardingSteps,
            referral_source: state.referralSource || undefined,
          })
        }

        syncToStore(newState)
        return newState
      }),
    decrementOnboardingStep: () =>
      set(state => {
        const onboardingStep = Math.max(state.onboardingStep - 1, 0)
        const onboardingCategory = getOnboardingCategory(onboardingStep)
        const newState = {
          onboardingStep,
          onboardingCategory,
        }
        // Track viewing of previous step
        analytics.trackOnboarding(ANALYTICS_EVENTS.ONBOARDING_STEP_VIEWED, {
          step: onboardingStep,
          step_name: getStepName(onboardingStep),
          category: onboardingCategory,
          total_steps: state.totalOnboardingSteps,
          referral_source: state.referralSource || undefined,
        })

        syncToStore(newState)
        return newState
      }),
    setOnboardingStep: (step: number) =>
      set(state => {
        const onboardingStep = Math.min(Math.max(step, 0), state.totalOnboardingSteps)
        const onboardingCategory = getOnboardingCategory(onboardingStep)
        const newState = {
          onboardingStep,
          onboardingCategory,
        }
        syncToStore(newState)
        return newState
      }),
    setOnboardingCompleted: () =>
      set(state => {
        const step = state.totalOnboardingSteps - 1
        analytics.trackOnboarding(ANALYTICS_EVENTS.ONBOARDING_STEP_COMPLETED, {
          step: state.totalOnboardingSteps,
          step_name: getStepName(step),
          category: getOnboardingCategory(step),
          total_steps: state.totalOnboardingSteps,
        })

        analytics.trackOnboarding(ANALYTICS_EVENTS.ONBOARDING_COMPLETED, {
          step: state.totalOnboardingSteps,
          step_name: 'completed',
          category: ONBOARDING_CATEGORIES.TRY_IT,
          total_steps: state.totalOnboardingSteps,
        })

        // Update user properties to mark onboarding as completed
        analytics.updateUserProperties({
          onboarding_completed: true,
          referral_source: state.referralSource || undefined,
        })

        const newState = { onboardingCompleted: true }
        syncToStore(newState)
        return newState
      }),
    resetOnboarding: () =>
      set(_state => {
        const newState = { onboardingStep: 0, onboardingCompleted: false }
        analytics.updateUserProperties({
          onboarding_completed: false,
        })
        // Clear electron-store cache
        window.api.electronStoreSet('onboarding', {
          onboardingCompleted: false,
          onboardingStep: 0,
        })
        syncToStore(newState)
        return newState
      }),
    resetOnboardingLocal: () =>
      set(_state => {
        // Reset locally without syncing to database
        // Used when logging out to clear the UI state without affecting user's saved progress
        // Clear electron-store cache
        window.api.electronStoreSet('onboarding', {
          onboardingCompleted: false,
          onboardingStep: 0,
        })
        return {
          onboardingStep: 0,
          onboardingCompleted: false,
          onboardingCategory: getOnboardingCategory(0),
        }
      }),
    setReferralSource: (source: string) =>
      set(_state => {
        const newState = { referralSource: source }
        analytics.updateUserProperties({
          referral_source: source,
        })
        syncToStore(newState)
        return newState
      }),
    initializeOnboarding: () => {
      const step = 0
      const onboardingCategory = getOnboardingCategory(step)
      analytics.trackOnboarding(ANALYTICS_EVENTS.ONBOARDING_STEP_VIEWED, {
        step,
        step_name: getStepName(0),
        category: onboardingCategory,
        total_steps: totalOnboardingSteps,
      })
    },
    hydrateFromDatabase: async () => {
      try {
        // Safety check: Don't re-hydrate if already completed in current state
        const currentState = useOnboardingStore.getState()
        if (currentState.onboardingCompleted) {
          console.log('[useOnboardingStore] Onboarding already completed, skipping hydration')
          return
        }

        // FIRST: Check electron-store (synchronous cache) for immediate persistence
        const cachedOnboarding = window.api.electronStoreGet('onboarding')
        if (cachedOnboarding?.onboardingCompleted) {
          console.log('[useOnboardingStore] Found completed onboarding in electron-store cache')
          set({ onboardingCompleted: true })
          return
        }

        // THEN: Check SQLite database (per-user, cross-device sync)
        const saved = await window.api.getOnboardingState?.()
        if (saved?.onboardingCompleted) {
          // User has completed onboarding previously
          console.log('[useOnboardingStore] Found completed onboarding in database')
          set({ onboardingCompleted: true })
          // Update cache for next time
          window.api.electronStoreSet('onboarding', { onboardingCompleted: true })
        } else if (saved?.onboardingStep !== undefined && saved.onboardingStep > 0) {
          // Existing user with partial onboarding - restore their progress
          console.log('[useOnboardingStore] Restoring partial onboarding progress:', saved.onboardingStep)
          const onboardingCategory = getOnboardingCategory(saved.onboardingStep)
          set({
            onboardingStep: saved.onboardingStep,
            onboardingCategory,
            onboardingCompleted: false,
          })
        } else {
          // New user - start from step 0
          console.log('[useOnboardingStore] Starting new onboarding')
          set({
            onboardingStep: 0,
            onboardingCategory: getOnboardingCategory(0),
            onboardingCompleted: false,
          })
        }
      } catch (error) {
        console.error('[useOnboardingStore] Failed to hydrate from database:', error)
      }
    },
  }
})
