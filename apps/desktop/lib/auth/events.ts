import store, { AuthState, createNewAuthState } from '../main/store'
import { STORE_KEYS } from '../constants/store-keys'
import mainStore from '../main/store'
import { grpcClient } from '../clients/grpcClient'
import { syncService } from '../main/syncService'
import { mainWindow } from '../main/app'
import { jwtDecode } from 'jwt-decode'
import { UserMetadataTable } from '../main/sqlite/repo'
import { PaidStatus } from '../main/sqlite/models'

// Define TypeScript interfaces for JWT payloads
interface JwtPayload {
  exp?: number
  iat?: number
  sub?: string
  email?: string
  name?: string
  picture?: string
  iss?: string
  aud?: string | string[]
  [key: string]: any
}

// Utility function to check if a JWT token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    // Better Auth uses session tokens, not JWTs - they don't decode
    // Check if this looks like a JWT (has two dots)
    if (!token.includes('.')) {
      // Not a JWT, assume it's a Better Auth session token
      // These tokens are validated by the server, not client-side
      console.log('Non-JWT token detected (Better Auth session token)')
      return false // Let the server validate it
    }

    const payload = jwtDecode<JwtPayload>(token)

    // Check if token has expired
    const currentTime = Math.floor(Date.now() / 1000)
    return payload.exp ? payload.exp < currentTime : true
  } catch (error) {
    console.warn('Failed to decode token for expiration check:', error)
    // If we can't decode the token, assume it's a Better Auth token
    // and let the server validate it
    return false
  }
}

// Check and validate stored tokens on startup
export const validateStoredTokens = async () => {
  try {
    const storedAuth = store.get(STORE_KEYS.AUTH)
    const storedTokens = storedAuth?.tokens
    const mainStoreAccessToken = mainStore.get(STORE_KEYS.ACCESS_TOKEN) as
      | string
      | undefined

    // Check if we have tokens to validate
    const hasTokens = storedTokens?.access_token || mainStoreAccessToken

    if (hasTokens) {
      console.log('Checking stored access tokens for expiration...')

      // Check both token sources
      const authStoreTokenExpired = storedTokens?.access_token
        ? isTokenExpired(storedTokens.access_token)
        : false
      const mainStoreTokenExpired = mainStoreAccessToken
        ? isTokenExpired(mainStoreAccessToken)
        : false

      if (authStoreTokenExpired || mainStoreTokenExpired) {
        console.log('Stored access tokens are expired, clearing auth data')

        // Clear expired tokens from auth store
        if (storedAuth) {
          store.set(STORE_KEYS.AUTH, {
            ...storedAuth,
            tokens: null,
          })
        }

        // Clear gRPC client token
        grpcClient.setAuthToken(null)

        // Stop sync service
        syncService.stop()

        // Clear main process store
        mainStore.delete(STORE_KEYS.USER_PROFILE)
        mainStore.delete(STORE_KEYS.ID_TOKEN)
        mainStore.delete(STORE_KEYS.ACCESS_TOKEN)

        // Notify renderer process about token expiration
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('auth-token-expired')
        }

        return false // Tokens were invalid
      } else {
        console.log('Stored access tokens are valid')

        // Ensure both stores are in sync
        if (storedTokens?.access_token && !mainStoreAccessToken) {
          mainStore.set(STORE_KEYS.ACCESS_TOKEN, storedTokens.access_token)
        } else if (mainStoreAccessToken && !storedTokens?.access_token) {
          if (storedAuth) {
            store.set(STORE_KEYS.AUTH, {
              ...storedAuth,
              tokens: {
                ...storedAuth.tokens,
                access_token: mainStoreAccessToken,
              },
            })
          }
        }

        return true // Tokens are valid
      }
    }

    return true // No tokens to validate
  } catch (error) {
    console.error('Error validating stored tokens:', error)
    return false // Assume invalid on error
  }
}

export const generateNewAuthState = (): AuthState => {
  const newAuthState = createNewAuthState()

  // Update the auth state in the store
  const currentAuth = store.get(STORE_KEYS.AUTH)
  store.set(STORE_KEYS.AUTH, {
    ...currentAuth,
    state: newAuthState,
  })

  return newAuthState
}


// Helper function to fetch onboarding status from server
async function fetchOnboardingStatusFromServer(
  accessToken: string,
): Promise<{ onboarding_completed: boolean; onboarding_step: number } | null> {
  try {
    const baseUrl =
      import.meta.env?.VITE_GRPC_BASE_URL ||
      process.env.VITE_GRPC_BASE_URL ||
      'http://localhost:3000'

    const response = await fetch(`${baseUrl}/user/onboarding`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      console.warn(
        `[fetchOnboardingStatusFromServer] Failed to fetch onboarding status: ${response.status}`,
      )
      return null
    }

    const data = await response.json()
    if (data.success) {
      return {
        onboarding_completed: data.onboarding_completed ?? false,
        onboarding_step: data.onboarding_step ?? 0,
      }
    }
    return null
  } catch (error) {
    console.warn('[fetchOnboardingStatusFromServer] Error:', error)
    return null
  }
}

export const handleLogin = async (
  profile: any,
  idToken: string | null,
  accessToken: string | null,
) => {
  mainStore.set(STORE_KEYS.USER_PROFILE, profile)

  if (idToken) {
    mainStore.set(STORE_KEYS.ID_TOKEN, idToken)
  }

  if (accessToken) {
    mainStore.set(STORE_KEYS.ACCESS_TOKEN, accessToken)
    grpcClient.setAuthToken(accessToken)
    syncService.start()
  }

  // Ensure user_metadata exists for this user
  if (profile?.id) {
    try {
      // Fetch onboarding status from server (Postgres) since Better Auth doesn't include custom fields
      let onboardingCompleted = profile.onboarding_completed ?? false
      let onboardingStep = profile.onboarding_step ?? 0

      // If we have an access token, fetch the actual onboarding status from the server
      if (accessToken) {
        const serverOnboarding =
          await fetchOnboardingStatusFromServer(accessToken)
        if (serverOnboarding) {
          onboardingCompleted = serverOnboarding.onboarding_completed
          onboardingStep = serverOnboarding.onboarding_step
          console.log(
            `[handleLogin] User ${profile.id} onboarding status from server API: completed=${onboardingCompleted}, step=${onboardingStep}`,
          )
        } else {
          console.log(
            `[handleLogin] Could not fetch onboarding from server, using profile defaults: completed=${onboardingCompleted}, step=${onboardingStep}`,
          )
        }
      } else {
        console.log(
          `[handleLogin] No access token, using profile onboarding status: completed=${onboardingCompleted}, step=${onboardingStep}`,
        )
      }

      const existingMetadata = await UserMetadataTable.findByUserId(profile.id)
      if (!existingMetadata) {
        // Create new user metadata synced with Postgres onboarding status
        try {
          await UserMetadataTable.insert({
            user_id: profile.id,
            paid_status: PaidStatus.FREE,
            free_words_remaining: null,
            pro_trial_start_date: null,
            pro_trial_end_date: null,
            pro_subscription_start_date: null,
            pro_subscription_end_date: null,
            // Use onboarding status from Postgres (persists across devices)
            onboarding_completed: onboardingCompleted,
            onboarding_step: onboardingStep,
          })
          console.log(
            `[handleLogin] Created user_metadata for user ${profile.id} (onboarding: ${onboardingCompleted})`,
          )
        } catch (insertError: any) {
          // If UNIQUE constraint error, it means metadata already exists (race condition)
          // This is safe to ignore
          if (!insertError?.message?.includes('UNIQUE constraint')) {
            throw insertError
          }
          console.log(
            '[handleLogin] User_metadata already exists for:',
            profile.id,
          )
        }
      } else {
        // Sync onboarding status from Postgres if different
        if (
          existingMetadata.onboarding_completed !== onboardingCompleted ||
          existingMetadata.onboarding_step !== onboardingStep
        ) {
          console.log(
            `[handleLogin] Syncing onboarding status from server for user ${profile.id}`,
          )
          await UserMetadataTable.update(profile.id, {
            onboarding_completed: onboardingCompleted,
            onboarding_step: onboardingStep,
          })
        } else {
          console.log(
            `[handleLogin] User_metadata already in sync for user ${profile.id}`,
          )
        }
      }
    } catch (error) {
      console.error(
        '[handleLogin] Failed to ensure user_metadata exists:',
        error,
      )
    }
  }
}

export const handleLogout = async () => {
  // Clear local storage first
  mainStore.delete(STORE_KEYS.USER_PROFILE)
  mainStore.delete(STORE_KEYS.ID_TOKEN)
  mainStore.delete(STORE_KEYS.ACCESS_TOKEN)
  grpcClient.setAuthToken(null)
  syncService.stop()

  // Clear all cookies and storage from the Electron session
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      const session = mainWindow.webContents.session
      await session.clearStorageData({
        storages: ['cookies', 'localstorage'],
      })
      console.log('[handleLogout] Cleared all cookies and local storage')
    } catch (error) {
      console.error('[handleLogout] Failed to clear cookies:', error)
    }

    // Notify renderer to clear Better Auth session and reload
    mainWindow.webContents.send('clear-better-auth-session')
  }
}

// Check if token needs refresh (refresh 5 minutes before expiry)
export const shouldRefreshToken = (expiresAt: number): boolean => {
  const fiveMinutes = 5 * 60 * 1000 // 5 minutes in milliseconds
  return Date.now() >= expiresAt - fiveMinutes
}

// Check if tokens are still valid, log out if expired
export const ensureValidTokens = async () => {
  const storedAuth = store.get(STORE_KEYS.AUTH)
  const tokens = storedAuth?.tokens

  if (!tokens) {
    return { success: false, error: 'No tokens available' }
  }

  // Check if token has expired
  if (tokens.expires_at && Date.now() >= tokens.expires_at) {
    console.log('Token expired, user needs to re-authenticate')
    handleLogout()

    store.set(STORE_KEYS.AUTH, {
      ...storedAuth,
      tokens: null,
      isAuthenticated: false,
    })

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('auth-token-expired')
    }

    return { success: false, error: 'Token expired' }
  }

  return { success: true, tokens }
}
