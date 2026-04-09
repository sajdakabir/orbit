import { HashRouter, Routes, Route } from 'react-router-dom'
import appIcon from '@/resources/build/orbit.png'
import HomeKit from '@/app/components/home/HomeKit'
import WelcomeKit from '@/app/components/welcome/WelcomeKit'
import Pill from '@/app/components/pill/Pill'
import ActionPanelWindow from '@/app/components/action-panel/ActionPanelWindow'
import {
  STEP_NAMES,
  STEP_NAMES_ARRAY,
  useOnboardingStore,
} from '@/app/store/useOnboardingStore'
import { useAuth } from '@/app/components/auth/useAuth'
import { WindowContextProvider } from '@/lib/window'
import { Auth0Provider } from '@/app/components/auth/Auth0Provider'
import { TooltipProvider } from '@/app/components/ui/tooltip'
import { useDeviceChangeListener } from './hooks/useDeviceChangeListener'
import { verifyStoredMicrophone } from './media/microphone'
import { useEffect } from 'react'
import { authClient } from '@/lib/auth/betterAuthClient'

const MainApp = () => {
  const { onboardingCompleted, onboardingStep, setOnboardingCompleted } =
    useOnboardingStore()
  const { isAuthenticated } = useAuth()
  useDeviceChangeListener()

  useEffect(() => {
    verifyStoredMicrophone()

    // Listen for logout event from main process and clear Better Auth session
    const handleClearBetterAuth = async () => {
      console.log('[MainApp] Clearing Better Auth session')
      try {
        await authClient.signOut()
        console.log('[MainApp] Better Auth session cleared successfully')
        // Reload the page to reset all state
        window.location.reload()
      } catch (error) {
        console.error('[MainApp] Failed to clear Better Auth session:', error)
      }
    }

    window.electron?.ipcRenderer?.on(
      'clear-better-auth-session',
      handleClearBetterAuth,
    )

    return () => {
      window.electron?.ipcRenderer?.removeListener(
        'clear-better-auth-session',
        handleClearBetterAuth,
      )
    }
  }, [])

  const onboardingSetupCompleted =
    onboardingStep >= STEP_NAMES_ARRAY.indexOf(STEP_NAMES.TRY_IT_OUT)

  const shouldEnableShortcutGlobally =
    onboardingCompleted || onboardingSetupCompleted

  // If authenticated and onboarding completed, show main app
  if (isAuthenticated && onboardingCompleted) {
    window.api.send(
      'electron-store-set',
      'settings.isShortcutGloballyEnabled',
      shouldEnableShortcutGlobally,
    )
    return <HomeKit />
  }

  // If authenticated but onboarding not completed, continue onboarding
  window.api.send(
    'electron-store-set',
    'settings.isShortcutGloballyEnabled',
    shouldEnableShortcutGlobally,
  )
  return <WelcomeKit />
}

export default function App() {
  return (
    <Auth0Provider>
      <TooltipProvider delayDuration={0}>
        <HashRouter>
          <Routes>
            {/* Route for the pill window */}
            <Route
              path="/pill"
              element={
                <>
                  <Pill />
                </>
              }
            />

            {/* Route for the action panel floating window */}
            <Route
              path="/action-panel"
              element={<ActionPanelWindow />}
            />

            {/* Default route for the main application window */}
            <Route
              path="/"
              element={
                <>
                  <WindowContextProvider
                    titlebar={{ title: 'Orbit', icon: appIcon }}
                  >
                    <MainApp />
                  </WindowContextProvider>
                </>
              }
            />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </Auth0Provider>
  )
}
