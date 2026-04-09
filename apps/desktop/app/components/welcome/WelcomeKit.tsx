import CreateAccountContent from './contents/CreateAccountContent'
import SignInContent from './contents/SignInContent'
import ReferralContent from './contents/ReferralContent'
import DataControlContent from './contents/DataControlContent'
import PermissionsContent from './contents/PermissionsContent'
import MicrophoneTestContent from './contents/MicrophoneTestContent'
import KeyboardTestContext from './contents/KeyboardTestContext'
import GoodToGoContent from './contents/GoodToGoContent'
import AnyAppContent from './contents/AnyAppContent'
import TryItOutContent from './contents/TryItOutContent'
import { useEffect, useState } from 'react'
import './styles.css'
import { usePermissionsStore } from '../../store/usePermissionsStore'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useAuth } from '@/app/components/auth/useAuth'
import IntroducingIntelligentModeContent from './contents/IntroducingIntelligentModeContent'

export default function WelcomeKit() {
  const { onboardingStep } = useOnboardingStore()
  const { isAuthenticated, isLoading } = useAuth()
  const [showSignup, setShowSignup] = useState(false)

  // Onboarding steps (authentication is handled separately above)
  const onboardingStepOrder = [
    ReferralContent, // Step 0
    DataControlContent, // Step 1
    PermissionsContent, // Step 2
    MicrophoneTestContent, // Step 3
    KeyboardTestContext, // Step 4
    GoodToGoContent, // Step 5
    IntroducingIntelligentModeContent, // Step 6
    AnyAppContent, // Step 7
    TryItOutContent, // Step 8
  ]

  const { setAccessibilityEnabled, setMicrophoneEnabled } =
    usePermissionsStore()

  useEffect(() => {
    window.api
      .invoke('check-accessibility-permission', false)
      .then((enabled: boolean) => {
        setAccessibilityEnabled(enabled)
      })

    window.api
      .invoke('check-microphone-permission', false)
      .then((enabled: boolean) => {
        setMicrophoneEnabled(enabled)
      })
  }, []) // Empty dependency array to run only once on mount

  // Show loading spinner while auth session is being checked
  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-background">
        <span className="inline-block size-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
      </div>
    )
  }

  // Show signin/signup based on whether user is authenticated
  if (!isAuthenticated) {
    // Toggle between login and signup
    if (showSignup) {
      return (
        <div className="relative w-full h-full">
          <CreateAccountContent onBackToSignIn={() => setShowSignup(false)} />
        </div>
      )
    }
    return (
      <div className="relative w-full h-full">
        <SignInContent onCreateAccount={() => setShowSignup(true)} />
      </div>
    )
  }

  const CurrentComponent = onboardingStepOrder[onboardingStep]

  return (
    <div className="w-full h-full bg-background">
      {CurrentComponent ? <CurrentComponent /> : null}
    </div>
  )
}
