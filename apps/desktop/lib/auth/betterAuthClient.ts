import { createAuthClient } from 'better-auth/react'
import { STORE_KEYS } from '../constants/store-keys'

/**
 * In-memory session token cache.
 *
 * Electron apps (dev on http://localhost:5173, packaged on app://) cannot send
 * cross-origin cookies to the production API server. Better Auth normally
 * relies on cookies, so we manually forward the session token via the
 * Authorization header instead.
 *
 * Timing matters: after signIn.email() returns, better-auth immediately
 * re-fetches /api/auth/get-session via its internal $sessionSignal. Storing
 * the token async through IPC (electron-store) is too slow — it isn't
 * available yet when get-session fires. The onSuccess callback captures
 * the token synchronously so it's ready for the next request.
 */
let _cachedSessionToken: string | null = null

/** Manually set the session token (e.g. from handleLogin). */
export function setCachedSessionToken(token: string | null) {
  _cachedSessionToken = token
}

/** Read token: memory cache first, then electron-store fallback. */
function getSessionToken(): string | null {
  if (_cachedSessionToken) return _cachedSessionToken

  try {
    const accessToken = window.electron?.store?.get(STORE_KEYS.ACCESS_TOKEN)
    if (accessToken && typeof accessToken === 'string') {
      _cachedSessionToken = accessToken
      return accessToken
    }

    const auth = window.electron?.store?.get(STORE_KEYS.AUTH) as any
    const token = auth?.tokens?.access_token || null
    if (token) _cachedSessionToken = token
    return token
  } catch {
    return null
  }
}

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  fetchOptions: {
    // Capture the session token from sign-in / sign-up responses so it's
    // available synchronously for the immediate get-session refetch.
    onSuccess(context: any) {
      try {
        const data = context?.data
        if (data?.session?.token) {
          _cachedSessionToken = data.session.token
        } else if (data?.token && typeof data.token === 'string') {
          _cachedSessionToken = data.token
        }
      } catch {
        // Ignore – non-auth responses won't have token fields
      }
    },

    // Inject the token as Authorization header on every request.
    onRequest(context: any) {
      const token = getSessionToken()
      if (token) {
        if (!context.headers) {
          context.headers = new Headers()
        }
        // Normalise to Headers object if it's a plain object
        if (!(context.headers instanceof Headers)) {
          context.headers = new Headers(context.headers)
        }
        if (!context.headers.has('authorization')) {
          context.headers.set('Authorization', `Bearer ${token}`)
        }
      }
    },
  },
})

export const { signIn, signUp, signOut, useSession } = authClient
