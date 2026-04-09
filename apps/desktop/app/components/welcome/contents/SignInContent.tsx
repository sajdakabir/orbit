import { Button } from '@/app/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/app/components/ui/tooltip'

import GitHubIcon from '../../icons/GitHubIcon'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { STORE_KEYS } from '../../../../lib/constants/store-keys'
import { isValidEmail, isStrongPassword } from '@/app/utils/utils'
import OrbitIcon from '@/app/components/icons/OrbitIcon'

// Auth provider configuration
const AUTH_PROVIDERS = {
  email: {
    key: 'email',
    label: 'Email',
    icon: null,
    variant: 'default' as const,
  },
  github: {
    key: 'github',
    label: 'GitHub',
    icon: GitHubIcon,
    variant: 'outline' as const,
  },
}

// Reusable AuthButton component
interface AuthButtonProps {
  provider: keyof typeof AUTH_PROVIDERS
  onClick: () => void
  className?: string
  children?: React.ReactNode
  disabled?: boolean
  title?: string
}

function AuthButton({
  provider,
  onClick,
  className = '',
  children,
  disabled = false,
  title,
}: AuthButtonProps) {
  const config = AUTH_PROVIDERS[provider]
  const IconComponent = config.icon

  const button = (
    <Button
      variant={config.variant}
      className={`h-12 flex items-center justify-center gap-3 text-sm font-medium ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {IconComponent && <IconComponent className="size-5" />}
      <span>{children || config.label}</span>
    </Button>
  )

  if (disabled && title) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="w-full">{button}</div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return button
}

type Props = {
  onCreateAccount?: () => void
}

export default function SignInContent({ onCreateAccount }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { user, isAuthenticated, loginWithGitHub, loginWithEmailPassword } =
    useAuth()

  // Don't manipulate onboarding state here - let useAuth hydration handle it
  // The MainApp component will route based on isAuthenticated and onboardingCompleted

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

  // Get stored user info for display
  const storedUser = window.electron?.store?.get(STORE_KEYS.AUTH)?.user
  const userEmail = storedUser?.email
  const userProvider = storedUser?.provider as keyof typeof AUTH_PROVIDERS

  // Prefill email if available
  useEffect(() => {
    if (typeof userEmail === 'string' && userEmail.length > 0) {
      setEmail(userEmail)
    }
  }, [userEmail])

  const emailOk = useMemo(() => isValidEmail(email || ''), [email])
  const isValid = useMemo(
    () => isStrongPassword(password) && emailOk,
    [password, emailOk],
  )

  const handleEmailPasswordLogin = async () => {
    if (!isValid) return
    try {
      setIsLoggingIn(true)
      setErrorMessage(null)
      await loginWithEmailPassword(email, password)
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Login failed.'
      setErrorMessage(msg)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Helper function to format provider names for display
  const formatProviderName = (provider?: string): string => {
    if (!provider) return 'Unknown'
    return (
      AUTH_PROVIDERS[provider as keyof typeof AUTH_PROVIDERS]?.label ||
      provider.charAt(0).toUpperCase() + provider.slice(1)
    )
  }

  // Render all auth options
  const renderAllAuthOptions = () => (
    <>
      <div className="space-y-3 mb-6">
        <AuthButton
          provider="github"
          onClick={() => handleSocialAuth('github')}
          className="w-full"
        >
          Continue with GitHub
        </AuthButton>
      </div>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-border"></div>
        <span className="px-4 text-xs text-muted-foreground">OR</span>
        <div className="flex-1 border-t border-border"></div>
      </div>

      {/* Email/password login form */}
      <div className="space-y-5">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-foreground">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-foreground">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleEmailPasswordLogin()
              }
            }}
            onChange={e => setPassword(e.target.value)}
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <Button
          className="h-10 w-full"
          disabled={!isValid || isLoggingIn}
          aria-busy={isLoggingIn}
          onClick={handleEmailPasswordLogin}
        >
          {isLoggingIn && (
            <span className="mr-2 inline-block size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          )}
          {isLoggingIn ? 'Logging in…' : 'Log In'}
        </Button>

        {errorMessage && (
          <p className="mt-2 text-sm text-destructive">{errorMessage}</p>
        )}
      </div>
    </>
  )

  // Always show all auth options (GitHub + email) so users can pick either method
  const renderAuthButton = () => {
    return renderAllAuthOptions()
  }

  return (
    <div className="flex h-full w-full bg-background items-center justify-center">
      {/* Centered Sign in form */}
      <div className="flex flex-col items-center justify-center px-12 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="">
            <div className="mb-4  rounded-md p-1 w-15 h-14 mx-auto flex items-center justify-center">
              <OrbitIcon
                width={141}
                height={130}
                style={{ color: '#FFFFFF' }}
              />
            </div>
          </div>

          {/* Title and subtitle */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-semibold mb-4 text-foreground">
              Welcome back!
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              {userEmail && userProvider
                ? `You last logged in with ${formatProviderName(userProvider)} (${userEmail})`
                : userEmail
                  ? `You last logged in with ${userEmail}`
                  : 'Your second brain to get things done faster and smarter.'}
            </p>
          </div>

          {/* Auth buttons - conditionally rendered based on previous provider */}
          {renderAuthButton()}

          {/* Link to create new account */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  if (onCreateAccount) {
                    onCreateAccount()
                  }
                }}
                className="text-foreground underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
