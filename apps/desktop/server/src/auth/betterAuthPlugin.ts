import { FastifyReply, FastifyRequest } from 'fastify'
import pool from '../db.js'

/**
 * Better Auth session verification middleware
 * Note: Route registration has been moved to /routes/auth.ts
 * This file only contains session verification middleware
 */

/**
 * Middleware to verify Better Auth session from Bearer token and attach user to request
 * Note: Better Auth uses cookie-based sessions, but for gRPC we need Bearer tokens.
 * We query the session table directly using the token as the session ID.
 */
export async function verifyBetterAuthSession(request: FastifyRequest) {
  try {
    let token: string | null = null

    // First, try to get the session token from cookies (Better Auth default)
    const cookies = request.cookies || {}

    const sessionCookie =
      cookies['__Secure-better-auth.session_token'] ||
      cookies['better-auth.session_token'] ||
      cookies['session_token']

    if (sessionCookie) {
      token = sessionCookie
    } else {
      // Fallback: Extract token from Authorization header (for Electron clients)
      const authHeader = request.headers.authorization
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return null
    }

    // Better Auth cookies use format "token.hmac" — the DB stores only the token part
    const dbToken = token.includes('.') ? token.split('.')[0] : token

    // Query the session and user from the database directly
    // The token is the session ID/token stored in Better Auth's session table
    const result = await pool.query(
      `SELECT s.*, u.id as user_id, u.email, u.name, u.image, u.onboarding_completed, u.onboarding_step
       FROM session s
       JOIN "user" u ON s."userId" = u.id
       WHERE s.token = $1
       AND s."expiresAt" > NOW()`,
      [dbToken],
    )

    if (result.rows.length === 0) {
      return null
    }

    const session = result.rows[0]

    // Attach user to request in Auth0-compatible format
    ;(request as any).user = {
      sub: session.user_id,
      email: session.email,
      name: session.name,
      picture: session.image,
    }

    return {
      user: {
        id: session.user_id,
        email: session.email,
        name: session.name,
        image: session.image,
        onboarding_completed: session.onboarding_completed ?? false,
        onboarding_step: session.onboarding_step ?? 0,
      },
      session: {
        token: session.token,
        expiresAt: session.expiresAt,
      },
    }
  } catch (error) {
    console.error('Session verification error')
    return null
  }
}

/**
 * Legacy function for backward compatibility - delegates to verifyBetterAuthSession
 */
export async function verifySession(request: FastifyRequest) {
  return verifyBetterAuthSession(request)
}

/**
 * Hook to require Better Auth authentication
 */
export async function requireAuthHook(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Verify Better Auth session
  const session = await verifyBetterAuthSession(request)

  if (!session) {
    reply.code(401).send({ error: 'Unauthorized' })
    return
  }
}
