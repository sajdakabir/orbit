import { useCallback, useEffect, useMemo } from 'react'
import { authClient, useSession } from '../../../lib/auth/betterAuthClient'
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
      const user: AuthUser = {
        id: betterAuthSession.user.id,
        email: betterAuthSession.user.email,
        name: betterAuthSession.user.name || '',
        picture: betterAuthSession.user.image,
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
      if (window.api?.notifyLoginSuccess) {
        window.api.notifyLoginSuccess(
          user,
          null, // Better Auth doesn't use separate ID tokens
          betterAuthSession.session.token, // Access token for gRPC
        )
      }
    }
  }, [betterAuthSession])

  // GitHub OAuth login
  const loginWithGitHub = useCallback(async () => {
    try {
      analytics.trackAuth(ANALYTICS_EVENTS.AUTH_SIGNIN_STARTED, {
        provider: 'github',
        is_returning_user: false,
        auth_method: 'oauth',
      })

      await authClient.signIn.social({
        provider: 'github',
        callbackURL: window.location.origin + '/auth-callback',
      })

      analytics.trackAuth(ANALYTICS_EVENTS.AUTH_SIGNIN_COMPLETED, {
        provider: 'github',
        is_returning_user: false,
      })

      await hydrateOnboardingState('github')
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
          useMainStore.getState().setCurrentPage('home')
        }

        await hydrateOnboardingState('email/password')
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
          throw new Error('Signup failed')
        }

        return result.data
      } catch (error) {
        console.error('User creation failed:', error)
        throw error
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

        // Reset onboarding state locally (without saving to database)
        useOnboardingStore.getState().resetOnboardingLocal()

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

        // Reset onboarding state locally even on error
        useOnboardingStore.getState().resetOnboardingLocal()
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
