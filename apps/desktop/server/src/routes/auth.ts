import { auth } from '../auth/auth.js'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import pool from '../db.js'

// In-memory store for pending OAuth token exchanges (nonce → session token)
// Entries auto-expire after 5 minutes
const pendingTokenExchanges = new Map<
  string,
  { token: string; expiresAt: number }
>()

/**
 * For Electron clients that send Bearer tokens instead of cookies,
 * resolve the session by querying the DB directly. Returns the response
 * in the same shape Better Auth's get-session endpoint returns.
 */
async function resolveSessionFromBearer(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<boolean> {
  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false

  const token = authHeader.substring(7)
  if (!token) return false

  // Better Auth cookies use format "token.hmac" — the DB stores only the token part
  const dbToken = token.includes('.') ? token.split('.')[0] : token

  try {
    const result = await pool.query(
      `SELECT s.*, u.id as user_id, u.email, u.name, u.image,
              u."emailVerified", u."createdAt" as user_created, u."updatedAt" as user_updated
       FROM session s
       JOIN "user" u ON s."userId" = u.id
       WHERE s.token = $1
       AND s."expiresAt" > NOW()`,
      [dbToken],
    )

    if (result.rows.length === 0) {
      setCorsHeaders(request, reply)
      reply.code(200).header('content-type', 'application/json').send('null')
      return true
    }

    const row = result.rows[0]

    // Return in the shape Better Auth's client expects
    const body = {
      session: {
        id: row.id,
        token: row.token,
        userId: row.userId,
        expiresAt: row.expiresAt,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
      },
      user: {
        id: row.user_id,
        name: row.name,
        email: row.email,
        emailVerified: row.emailVerified ?? false,
        image: row.image,
        createdAt: row.user_created,
        updatedAt: row.user_updated,
      },
    }

    setCorsHeaders(request, reply)
    reply
      .code(200)
      .header('content-type', 'application/json')
      .send(JSON.stringify(body))
    return true
  } catch (error) {
    console.error('[Auth Route] Bearer session lookup failed')
    return false
  }
}

/** Set CORS headers for Electron/localhost origins */
function setCorsHeaders(request: FastifyRequest, reply: FastifyReply) {
  const requestOrigin = request.headers.origin
  if (requestOrigin) {
    const allowed =
      requestOrigin.startsWith('http://localhost') ||
      requestOrigin.startsWith('https://localhost') ||
      requestOrigin.startsWith('app://') ||
      requestOrigin.startsWith('file://') ||
      requestOrigin.startsWith('orbit://') ||
      requestOrigin === process.env.CLIENT_URL ||
      requestOrigin === process.env.BETTER_AUTH_URL ||
      requestOrigin === (process.env.VITE_GRPC_BASE_URL || 'http://localhost:3000')

    if (allowed) {
      reply.header('Access-Control-Allow-Origin', requestOrigin)
      reply.header('Access-Control-Allow-Credentials', 'true')
    }
  } else {
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('Access-Control-Allow-Credentials', 'true')
  }
}

/**
 * Determine the correct custom protocol for the Electron app.
 * In prod: orbit://, in dev: orbit-dev://
 */
function getDesktopProtocol(): string {
  if (process.env.APP_PROTOCOL) return process.env.APP_PROTOCOL
  const env = process.env.ORBIT_ENV || 'prod'
  return env === 'prod' ? 'orbit' : 'orbit-dev'
}

export async function registerAuthRoutes(fastify: FastifyInstance) {
  // GitHub OAuth initiation - GET endpoint that the system browser can open directly.
  // Internally creates a POST request to Better Auth's social sign-in handler,
  // which returns a redirect to GitHub's OAuth authorization page.
  fastify.get(
    '/auth/github',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const baseURL =
          process.env.BETTER_AUTH_URL || 'http://localhost:3000'
        const query = request.query as Record<string, string>
        const nonce = query.nonce || ''
        const desktopCallback = `${baseURL}/auth/desktop-callback${nonce ? `?nonce=${encodeURIComponent(nonce)}` : ''}`
        const callbackURL = query.callbackURL || desktopCallback

        // Better Auth's sign-in/social is a POST endpoint — construct the request internally
        const betterAuthRequest = new Request(
          `${baseURL}/api/auth/sign-in/social`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Origin: baseURL,
            },
            body: JSON.stringify({
              provider: 'github',
              callbackURL,
            }),
          },
        )

        const response = await auth.handler(betterAuthRequest)
        const responseBody = await response.text()

        // Better Auth returns { url, redirect: true } as JSON instead of a
        // real 302 redirect. Parse it and redirect the browser ourselves.
        try {
          const json = JSON.parse(responseBody)
          if (json?.url && json?.redirect) {
            // Forward any cookies Better Auth set (e.g. state/PKCE)
            response.headers.forEach((value, key) => {
              if (key.toLowerCase() === 'set-cookie') {
                reply.header(key, value)
              }
            })
            return reply.redirect(json.url)
          }
        } catch {
          // Not JSON — fall through to forward as-is
        }

        // Fallback: forward the response as-is
        response.headers.forEach((value, key) => {
          reply.header(key, value)
        })
        reply.code(response.status)
        return reply.send(responseBody)
      } catch (error: any) {
        console.error('[Auth] GitHub OAuth initiation error:', error)
        return reply
          .code(500)
          .type('text/html')
          .send(
            '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Something went wrong</h2><p>Could not start GitHub login. Please try again from the Orbit app.</p></body></html>',
          )
      }
    },
  )

  // Desktop OAuth callback - reads session cookie and redirects to custom protocol
  // This endpoint is the callbackURL for Better Auth social login when opened in the system browser
  fastify.get(
    '/auth/desktop-callback',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Better Auth sets the session token as a cookie during the OAuth flow
        const cookies = request.headers.cookie || ''
        console.log('[desktop-callback] Hit! Query:', JSON.stringify(request.query))
        console.log('[desktop-callback] Cookies present:', !!cookies, 'Cookie keys:', cookies.split(';').map(c => c.trim().split('=')[0]).filter(Boolean).join(', '))

        const tokenMatch = cookies.match(
          /better-auth\.session_token=([^;]+)/,
        )
        const sessionToken = tokenMatch
          ? decodeURIComponent(tokenMatch[1])
          : null

        console.log('[desktop-callback] Session token found:', !!sessionToken)

        if (sessionToken) {
          const protocol = getDesktopProtocol()
          const redirectUrl = `${protocol}://auth/session?token=${encodeURIComponent(sessionToken)}`

          // Store token for polling-based exchange (fallback when custom protocol doesn't work)
          const query = request.query as Record<string, string>
          const nonce = query.nonce
          const expiry = { token: sessionToken, expiresAt: Date.now() + 5 * 60 * 1000 }
          if (nonce) {
            console.log('[desktop-callback] Storing token with nonce:', nonce)
            pendingTokenExchanges.set(nonce, expiry)
          }
          // Always store under "latest" as a fallback (safe for single-user desktop app)
          pendingTokenExchanges.set('latest', expiry)
          console.log('[desktop-callback] Token stored. Map size:', pendingTokenExchanges.size)

          // Show a success page that auto-redirects to the Electron app via custom protocol
          return reply
            .code(200)
            .type('text/html')
            .send(
              `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Login Successful - Orbit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fafafa; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { text-align: center; padding: 48px; max-width: 400px; }
    .check { width: 64px; height: 64px; margin: 0 auto 24px; border-radius: 50%; background: #22c55e; display: flex; align-items: center; justify-content: center; }
    .check svg { width: 32px; height: 32px; }
    h2 { font-size: 24px; font-weight: 600; margin: 0 0 12px; }
    p { color: #a1a1aa; font-size: 15px; margin: 0 0 24px; line-height: 1.5; }
    .link { color: #3b82f6; text-decoration: underline; cursor: pointer; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="check">
      <svg fill="none" stroke="white" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
    </div>
    <h2>Login successful!</h2>
    <p>You're all set. Redirecting you back to Orbit...</p>
    <a class="link" href="${redirectUrl}">Click here if you're not redirected</a>
  </div>
  <script>
    setTimeout(function() { window.location.href = ${JSON.stringify(redirectUrl)}; }, 1000);
  </script>
</body>
</html>`,
            )
        }

        // No session token found - show error page
        return reply
          .code(400)
          .type('text/html')
          .send(
            '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Authentication failed</h2><p>No session token found. Please try again from the Orbit app.</p></body></html>',
          )
      } catch (error: any) {
        console.error('[Auth] Desktop callback error:', error)
        return reply
          .code(500)
          .type('text/html')
          .send(
            '<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>Something went wrong</h2><p>Please try again from the Orbit app.</p></body></html>',
          )
      }
    },
  )

  // Token exchange endpoint - Electron app polls this to get the session token
  // after GitHub OAuth completes in the browser (fallback for when custom protocol doesn't work)
  fastify.get(
    '/auth/token-exchange',
    async (request: FastifyRequest, reply: FastifyReply) => {
      setCorsHeaders(request, reply)
      const query = request.query as Record<string, string>
      const nonce = query.nonce
      if (!nonce) {
        return reply.code(400).send({ error: 'Missing nonce' })
      }

      const entry = pendingTokenExchanges.get(nonce)
      if (!entry) {
        // Not ready yet — client should keep polling
        return reply.code(202).send({ status: 'pending' })
      }

      // Check expiry
      if (Date.now() > entry.expiresAt) {
        pendingTokenExchanges.delete(nonce)
        return reply.code(410).send({ error: 'Token expired' })
      }

      // Return the token and remove from map (one-time use)
      pendingTokenExchanges.delete(nonce)
      return reply.code(200).send({ token: entry.token })
    },
  )

  // Better Auth requires a full URL, not just a path
  fastify.all(
    '/api/auth/*',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // For get-session with Bearer token: bypass auth.handler() entirely.
        // Better Auth's handler expects signed cookies (token.hmac), but Electron
        // apps send raw tokens via Authorization header. We resolve the session
        // by querying the DB directly instead.
        const isGetSession =
          request.method === 'GET' && request.url.includes('/get-session')
        if (
          isGetSession &&
          request.headers.authorization?.startsWith('Bearer ')
        ) {
          const handled = await resolveSessionFromBearer(request, reply)
          if (handled) return
        }

        // Construct the full URL from the request
        const protocol = request.protocol
        const host = request.hostname
        const url = `${protocol}://${host}${request.url}`

        // Add headers, ensuring Origin is present
        const headers = new Headers()
        Object.entries(request.headers).forEach(([key, value]) => {
          if (value) {
            headers.set(key, Array.isArray(value) ? value[0] : value)
          }
        })
        if (!headers.has('origin')) {
          headers.set('origin', `${protocol}://${host}`)
        }

        // Create a new request with the full URL
        const betterAuthRequest = new Request(url, {
          method: request.method,
          headers,
          body:
            request.method !== 'GET' && request.method !== 'HEAD'
              ? JSON.stringify(request.body)
              : undefined,
        })

        const response = await auth.handler(betterAuthRequest)

        // Copy response headers and status, but preserve CORS headers if they exist
        response.headers.forEach((value, key) => {
          // Don't override CORS headers that Fastify might have set
          if (key.toLowerCase().startsWith('access-control-')) {
            // Only set if Fastify hasn't already set this header
            if (!reply.getHeaders()[key.toLowerCase()]) {
              reply.header(key, value)
            }
          } else {
            reply.header(key, value)
          }
        })

        // Ensure CORS headers are properly set for Electron apps
        setCorsHeaders(request, reply)

        reply.code(response.status)

        // Return the response body
        const responseBody = await response.text()
        return reply.send(responseBody)
      } catch (error: any) {
        console.error('Auth route error')
        return reply
          .code(500)
          .send({ error: 'Authentication error', details: error.message })
      }
    },
  )
}
