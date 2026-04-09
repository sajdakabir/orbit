import { createAuthClient } from 'better-auth/react'
import { STORE_KEYS } from '../constants/store-keys'

let _cachedSessionToken: string | null = null

export function setCachedSessionToken(token: string | null) {
  _cachedSessionToken = token
}

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
  baseURL: import.meta.env.VITE_GRPC_BASE_URL || 'http://localhost:3000',
  fetchOptions: {
    onSuccess(context: any) {
      try {
        const data = context?.data
        if (data?.session?.token) {
          _cachedSessionToken = data.session.token
        } else if (data?.token && typeof data.token === 'string') {
          _cachedSessionToken = data.token
        }
      } catch {
        // ignore non-auth responses
      }
    },
    onRequest(context: any) {
      const token = getSessionToken()
      if (token) {
        if (!context.headers) context.headers = new Headers()
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
