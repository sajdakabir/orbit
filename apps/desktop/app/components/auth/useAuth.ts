import { useCallback, useEffect, useMemo } from 'react'
import {
  authClient,
  useSession,
  setCachedSessionToken,
} from '../../../lib/auth/betterAuthClient'
import { useAuthStore } from '../../store/useAuthStore'
import { type AuthUser, type AuthTokens } from '../../../lib/main/store'
import { useMainStore } from '@/app/store/useMainStore'
import { analytics, ANALYTICS_EVENTS } from '../analytics'
import { STORE_KEYS } from '../../../lib/constants/store-keys'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'

export const useAuth = () => {
  // Get Better Auth session
  const {
    data: betterAuthSession,
    isPending: isLoading,
    error: sessionError,
  } = useSession()

  // Get auth state from our store
  const {
    isAuthenticated: storeIsAuthenticated,
    user: storeUser,
    tokens,
    isLoading: storeIsLoading,
    error: storeError,
    clearAuth,
    setSelfHostedMode,
  } = useAuthStore()

  // Combine Better Auth and store state
  const isAuthenticated = storeIsAuthenticated || !!betterAuthSession
  const error = storeError || (sessionError ? String(sessionError) : null)

  // Convert Better Auth user to our user interface
  const betterAuthUser: AuthUser | null = useMemo(() => {
    if (!betterAuthSession?.user) return null
    return {
      id: betterAuthSession.user.id,
      email: betterAuthSession.user.email,
      name: betterAuthSession.user.name || '',
      picture: betterAuthSession.user.image,
      provider: 'email', // Will be set by the provider used
      lastSignInAt: new Date().toISOString(),
    }
  }, [betterAuthSession])

  // Prioritize store user over Better Auth user
  const authUser = storeUser || betterAuthUser

  // Hydrate per-user onboarding state from SQLite database
  async function hydrateOnboardingState(context?: string): Promise<void> {
    try {
      const onboarding = useOnboardingStore.getState()
      await onboarding.hydrateFromDatabase()
    } catch (e) {
      const suffix = context ? ` (${context})` : ''
      console.warn(`[useAuth] Failed to hydrate onboarding state${suffix}:`, e)
    }
  }

  // Check for token expiration on startup
  useEffect(() => {
    const storedAuth = window.electron?.store?.get(STORE_KEYS.AUTH)
    const hasStoredTokens = storedAuth?.tokens?.access_token
    const hasMainStoreToken = window.electron?.store?.get(
      STORE_KEYS.ACCESS_TOKEN,
    )

    if ((hasStoredTokens || hasMainStoreToken) && !isAuthenticated) {
      clearAuth(true)

      const currentUser = authUser
      if (currentUser) {
        analytics.trackAuth(ANALYTICS_EVENTS.AUTH_LOGOUT, {
          provider: currentUser.provider || 'unknown',
          is_returning_user: true,
          user_id: currentUser.id,
          complete_signout: false,
          session_duration_ms: analytics.getSessionDuration(),
          reason: 'token_expired_startup',
        })
      }
    }
  }, [isAuthenticated, authUser, clearAuth])

  useEffect(() => {
    if (authUser) {
      analytics.identifyUser(
        authUser.id,
        {
          user_id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          provider: authUser.provider,
          created_at: authUser.lastSignInAt,
        },
        authUser.provider,
      )

      if (window.api?.notifyUserAuthUpdate) {
        window.api.notifyUserAuthUpdate({
          id: authUser.id,
          email: authUser.email,
          name: authUser.name,
          provider: authUser.provider,
        })
      }
    } else {
      if (window.api?.notifyUserAuthUpdate) {
        window.api.notifyUserAuthUpdate(null)
      }
    }
  }, [authUser])

  // Sync Better Auth session to our store
  useEffect(() => {
    if (betterAuthSession?.user) {
      const syncSession = async () => {
        const user: AuthUser = {
          id: betterAuthSession.user.id,
          email: betterAuthSession.user.email,
          name: betterAuthSession.user.name || '',
          picture: betterAuthSession.user.image || undefined,
          provider: 'email',
          lastSignInAt: new Date().toISOString(),
        }

        // Create minimal tokens object from session
        const sessionTokens: AuthTokens = {
          access_token: betterAuthSession.session.token,
          expires_at: new Date(betterAuthSession.session.expiresAt).getTime(),
        }

        useAuthStore.getState().setAuthData(sessionTokens, user, 'email')

        // Notify main process for gRPC authentication and sync service
        // Wait for this to complete so onboarding data is synced from server to local SQLite
        if (window.api?.notifyLoginSuccess) {
          await window.api.notifyLoginSuccess(
            user,
            null, // Better Auth doesn't use separate ID tokens
            betterAuthSession.session.token, // Access token for gRPC
          )
        }

        // Hydrate onboarding state from database for this user (after main process has synced it)
        await hydrateOnboardingState('session-restored')
      }

      syncSession()
    }
  }, [betterAuthSession])

  // GitHub OAuth login - opens in system browser for better UX
  const loginWithGitHub = useCallback(async () => {
    try {
      analytics.trackAuth(ANALYTICS_EVENTS.AUTH_SIGNIN_STARTED, {
        provider: 'github',
        is_returning_user: false,
        auth_method: 'oauth',
      })

      const baseURL =
        import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

      // Generate a nonce for polling-based token exchange
      const nonce = crypto.randomUUID()
      const callbackURL = encodeURIComponent(
        `${baseURL}/auth/desktop-callback?nonce=${nonce}`,
      )
      const authUrl = `${baseURL}/auth/github?callbackURL=${callbackURL}`

      // Race: custom protocol handler (instant) vs. polling fallback (works in dev mode)
      const tokenPromise = new Promise<string>((resolve, reject) => {
        let resolved = false
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true
            cleanupProtocol()
            reject(new Error('GitHub login timed out'))
          }
        }, 120000) // 2 min timeout

        // Method 1: Listen for token via custom protocol (orbit-dev://auth/session)
        const cleanupProtocol = window.api.on(
          'better-auth-session-token',
          (token: string) => {
            if (!resolved) {
              resolved = true
              clearTimeout(timeout)
              clearInterval(pollInterval)
              cleanupProtocol()
              resolve(token)
            }
          },
        )

        // Method 2: Poll the server for token exchange (fallback)
        // Try both the nonce key and "latest" key in case nonce gets lost in redirect chain
        const pollInterval = setInterval(async () => {
          if (resolved) {
            clearInterval(pollInterval)
            return
          }
          for (const key of [nonce, 'latest']) {
            if (resolved) break
            try {
              const res = await fetch(
                `${baseURL}/auth/token-exchange?nonce=${key}`,
              )
              if (res.ok) {
                const data = await res.json()
                if (data.token && !resolved) {
                  resolved = true
                  clearTimeout(timeout)
                  clearInterval(pollInterval)
                  cleanupProtocol()
                  resolve(data.token)
                  return
                }
              }
            } catch {
              // Network error, keep polling
            }
          }
        }, 2000)
      })

      // Open the OAuth URL in the system browser
      await window.api.invoke('web-open-url', authUrl)

      // Wait for the session token (from protocol handler or polling)
      const sessionToken = await tokenPromise

      // Cache the token for Better Auth client
      setCachedSessionToken(sessionToken)

      // Persist to electron store
      window.electron?.store?.set(STORE_KEYS.ACCESS_TOKEN, sessionToken)

      // Fetch the full session data using the token
      const sessionResponse = await fetch(
        `${baseURL}/api/auth/get-session`,
        {
          headers: { Authorization: `Bearer ${sessionToken}` },
        },
      )

      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch session after GitHub login')
      }

      const sessionData = await sessionResponse.json()
      if (!sessionData?.user) {
        throw new Error('No user data in session response')
      }

      const user: AuthUser = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name || '',
        picture: sessionData.user.image || undefined,
        provider: 'github',
        lastSignInAt: new Date().toISOString(),
      }

      const sessionTokens: AuthTokens = {
        access_token: sessionToken,
        expires_at: new Date(sessionData.session.expiresAt).getTime(),
      }

      useAuthStore.getState().setAuthData(sessionTokens, user, 'github')

      if (window.api?.notifyLoginSuccess) {
        await window.api.notifyLoginSuccess(user, null, sessionToken)
      }

      await hydrateOnboardingState('github-oauth')

      analytics.trackAuth(ANALYTICS_EVENTS.AUTH_SIGNIN_COMPLETED, {
        provider: 'github',
        is_returning_user: false,
        user_id: user.id,
      })
    } catch (error) {
      console.error('GitHub auth failed:', error)
      analytics.track(ANALYTICS_EVENTS.AUTH_METHOD_FAILED, {
        provider: 'github',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        auth_method: 'oauth',
      })
      throw error
    }
  }, [])

  // Email/password login
  const loginWithEmailPassword = useCallback(
    async (
      email: string,
      password: string,
      options?: { skipNavigate?: boolean },
    ) => {
      try {
        analytics.trackAuth(ANALYTICS_EVENTS.AUTH_SIGNIN_STARTED, {
          provider: 'email',
          is_returning_user: false,
          auth_method: 'password',
        })

        const result = await authClient.signIn.email({
          email,
          password,
        })

        if (!result.data) {
          throw new Error('Login failed')
        }

        analytics.trackAuth(ANALYTICS_EVENTS.AUTH_SIGNIN_COMPLETED, {
          provider: 'email',
          is_returning_user: false,
          user_id: result.data.user.id,
        })

        if (!options?.skipNavigate) {
          useMainStore.getState().setCurrentPage('today')
        }

        // Don't hydrate here - the useEffect watching betterAuthSession will handle it
        // after properly waiting for notifyLoginSuccess to sync from server
      } catch (error) {
        console.error('Email/password login failed:', error)
        analytics.track(ANALYTICS_EVENTS.AUTH_METHOD_FAILED, {
          provider: 'email',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          auth_method: 'password',
        })
        throw error
      }
    },
    [],
  )

  // Create new user with email/password
  const createDatabaseUser = useCallback(
    async (email: string, password: string, name: string) => {
      try {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        })

        if (!result.data) {
          // Check if error indicates user already exists
          if (result.error) {
            const errorMessage = result.error.message || String(result.error)
            if (
              errorMessage.toLowerCase().includes('already exists') ||
              errorMessage.toLowerCase().includes('duplicate') ||
              errorMessage.toLowerCase().includes('unique constraint')
            ) {
              throw new Error(
                'An account with this email already exists. Please sign in instead.',
              )
            }
            throw new Error(errorMessage)
          }
          throw new Error('Signup failed')
        }

        return result.data
      } catch (error) {
        console.error('User creation failed:', error)
        // Re-throw with better error message if available
        if (error instanceof Error) {
          throw error
        }
        throw new Error('Failed to create account. Please try again.')
      }
    },
    [],
  )

  // Email signup (redirect to signup page)
  const signupWithEmail = useCallback(async (email?: string) => {
    try {
      // Redirect to signup page or show signup UI
      // Redirect to signup page or show signup UI
    } catch (error) {
      console.error('Email signup failed:', error)
      throw error
    }
  }, [])

  // For backward compatibility - deprecated social providers
  const loginWithGoogle = useCallback(async () => {
    console.warn('Google login not configured')
    throw new Error('Google OAuth not configured in Better Auth')
  }, [])

  const loginWithMicrosoft = useCallback(async () => {
    console.warn('Microsoft login not configured')
    throw new Error('Microsoft OAuth not configured in Better Auth')
  }, [])

  const loginWithApple = useCallback(async () => {
    console.warn('Apple login not configured')
    throw new Error('Apple OAuth not configured in Better Auth')
  }, [])

  const loginWithEmail = useCallback(async (email?: string) => {
    // Redirect to email login with hint
  }, [])

  // Self-hosted authentication - bypasses all external auth
  const loginWithSelfHosted = useCallback(async () => {
    try {
      analytics.trackAuth(ANALYTICS_EVENTS.AUTH_SIGNIN_STARTED, {
        provider: 'self-hosted',
        is_returning_user: false,
        auth_method: 'self_hosted',
      })

      setSelfHostedMode()

      const selfHostedProfile = {
        id: 'self-hosted',
        provider: 'self-hosted',
        lastSignInAt: new Date().toISOString(),
      }

      await window.api.notifyLoginSuccess(selfHostedProfile, null, null)
      await hydrateOnboardingState('self-hosted')

      analytics.trackAuth(ANALYTICS_EVENTS.AUTH_SIGNIN_COMPLETED, {
        provider: 'self-hosted',
        is_returning_user: false,
        user_id: 'self-hosted',
        auth_method: 'self_hosted',
      })
    } catch (error) {
      console.error('Self-hosted mode activation error:', error)
      analytics.track(ANALYTICS_EVENTS.AUTH_SIGNIN_FAILED, {
        provider: 'self-hosted',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        auth_method: 'self_hosted',
      })
      throw error
    }
  }, [setSelfHostedMode])

  // Get access token for API calls
  const getAccessToken = useCallback(async () => {
    if (tokens?.access_token) {
      return tokens.access_token
    }
    if (betterAuthSession?.session.token) {
      return betterAuthSession.session.token
    }
    throw new Error('No access token available')
  }, [tokens, betterAuthSession])

  // Get ID token claims (for backward compatibility)
  const getIdTokenClaims = useCallback(async () => {
    return null // Better Auth doesn't use ID tokens the same way
  }, [])

  // Manual token refresh
  const refreshTokens = useCallback(async () => {
    try {
      // Better Auth handles session refresh automatically
      return { success: true }
    } catch (error) {
      console.error('Error during session refresh:', error)
      throw error
    }
  }, [])

  // Logout
  const logoutUser = useCallback(
    async (completelySignOut: boolean = false) => {
      try {
        const currentUser = authUser
        analytics.trackAuth(ANALYTICS_EVENTS.AUTH_LOGOUT, {
          provider: currentUser?.provider || 'unknown',
          is_returning_user: true,
          user_id: currentUser?.id,
          complete_signout: completelySignOut,
          session_duration_ms: analytics.getSessionDuration(),
        })

        await window.api.logout()
        clearAuth(!completelySignOut)

        // Don't reset onboarding state - it will be loaded from database on next login
        // This prevents showing the signup page with progress bar when user logs out

        // Sign out from Better Auth
        if (betterAuthSession) {
          await authClient.signOut()
        }
      } catch (error) {
        console.error('Error during logout:', error)
        analytics.track(ANALYTICS_EVENTS.AUTH_LOGOUT_FAILED, {
          provider: authUser?.provider || 'unknown',
          error_message:
            error instanceof Error ? error.message : 'Unknown error',
          complete_signout: completelySignOut,
        })
        clearAuth(!completelySignOut)
      }
    },
    [clearAuth, authUser, betterAuthSession],
  )

  return {
    // Auth state
    user: authUser,
    isAuthenticated,
    isLoading: isLoading || storeIsLoading,
    error,

    // Authentication methods
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    loginWithGitHub,
    loginWithEmail,
    loginWithEmailPassword,
    signupWithEmail,
    createDatabaseUser,
    loginWithSelfHosted,
    logoutUser,

    // Utilities
    getAccessToken,
    getIdTokenClaims,
    refreshTokens,
  }
}
