import { Button } from '@/app/components/ui/button'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import EmailSignupContent from './EmailSignupContent'
import EmailLoginContent from './EmailLoginContent'
import CheckEmailContent from './CheckEmailContent'
import GitHubIcon from '../../icons/GitHubIcon'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useDictionaryStore } from '@/app/store/useDictionaryStore'
import { isValidEmail } from '@/app/utils/utils'
import OrbitIcon from '@/app/components/icons/OrbitIcon'

type Props = {
  onBackToSignIn?: () => void
}

export default function CreateAccountContent({ onBackToSignIn }: Props) {
  const { initializeOnboarding } = useOnboardingStore()
  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const isDictInitialized = useRef(false)
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [showEmailLogin, setShowEmailLogin] = useState(false)
  const [showCheckEmail, setShowCheckEmail] = useState(false)
  const [checkEmailDbUserId, setCheckEmailDbUserId] = useState<string | null>(
    null,
  )
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [checkError, setCheckError] = useState<string | null>(null)

  const { user, loginWithGitHub, signupWithEmail } = useAuth()
  const userName = user?.name

  const addEntry = useDictionaryStore(state => state.addEntry)

  // Note: We don't auto-increment onboarding step here anymore
  // The EmailSignupContent component handles the signup flow, and after successful
  // login, the WelcomeKit will automatically show the next onboarding step

  useEffect(() => {
    if (userName && !isDictInitialized.current) {
      try {
        addEntry(userName)
      } catch {
        // Already exists in dictionary — ignore
      }
      isDictInitialized.current = true
    }
  }, [userName, isDictInitialized, addEntry])

  useEffect(() => {
    initializeOnboarding()
  }, [initializeOnboarding])

  const handleSocialAuth = async (provider: string) => {
    try {
      if (provider === 'github') {
        await loginWithGitHub()
      } else {
        console.error('Unknown auth provider:', provider)
      }
    } catch (error) {
      console.error(`${provider} authentication failed:`, error)
    }
  }

  const handleContinueWithEmail = async () => {
    if (!emailOk) {
      setEmailTouched(true)
      return
    }
    // Go directly to signup - Better Auth will handle existing user detection
    setShowEmailPassword(true)
  }

  if (showEmailPassword) {
    return (
      <EmailSignupContent
        initialEmail={email}
        onBack={() => setShowEmailPassword(false)}
        onContinue={em => signupWithEmail(em)}
        onLoginRequired={() => {
          setShowEmailPassword(false)
          setShowEmailLogin(true)
        }}
      />
    )
  }

  if (showEmailLogin) {
    return (
      <EmailLoginContent
        initialEmail={email}
        onBack={() => setShowEmailLogin(false)}
        onContinue={() => {}}
      />
    )
  }

  if (showCheckEmail) {
    return (
      <CheckEmailContent
        email={email}
        dbUserId={checkEmailDbUserId}
        onUseAnotherEmail={() => setShowCheckEmail(false)}
        onRequireLogin={() => {
          setShowCheckEmail(false)
          setShowEmailLogin(true)
        }}
        password={null}
      />
    )
  }

  const emailOk = isValidEmail(email)

  return (
    <div className="flex h-full w-full bg-background items-center justify-center">
      {/* Centered signup form */}
      <div className="flex flex-col items-center justify-center px-12 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-4  rounded-md p-1 w-15 h-14 mx-auto flex items-center justify-center">
            <OrbitIcon width={141} height={130} style={{ color: '#FFFFFF' }} />
          </div>
          {/* Title and subtitle */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-semibold mb-4 text-foreground">
              Get started with Orbit
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Your second brain to get things done faster and smarter.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full h-12 flex items-center justify-center gap-3 text-sm font-medium"
              onClick={() => handleSocialAuth('github')}
            >
              <GitHubIcon className="size-5" />
              <span>Continue with GitHub</span>
            </Button>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Email sign up */}
          <div className="space-y-3 mb-6">
            <input
              type="email"
              placeholder="Email address"
              onChange={e => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleContinueWithEmail()
                }
              }}
              aria-invalid={emailTouched && !emailOk}
              aria-describedby={
                emailTouched && !emailOk ? 'signup-email-error' : undefined
              }
              className={`w-full h-12 px-3 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-muted ${
                emailTouched && !emailOk
                  ? 'border-destructive'
                  : 'border-border'
              }`}
            />
            {emailTouched && !emailOk && (
              <p id="signup-email-error" className="text-xs text-destructive">
                Please enter a valid email address
              </p>
            )}
            <Button
              className="w-full h-12 text-sm font-medium"
              disabled={!emailOk || isCheckingEmail}
              aria-busy={isCheckingEmail}
              onClick={handleContinueWithEmail}
            >
              {isCheckingEmail ? 'Checking…' : 'Continue with email'}
            </Button>
            {checkError && (
              <p className="text-xs text-destructive">{checkError}</p>
            )}
          </div>

          {/* Sign in link */}
          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button
              onClick={onBackToSignIn}
              className="text-foreground hover:underline font-medium"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
