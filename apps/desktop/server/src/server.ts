import { fastify } from 'fastify'
import { fastifyConnectPlugin } from '@connectrpc/connect-fastify'
import { createContextValues } from '@connectrpc/connect'
import orbitServiceRoutes from './services/orbit/orbitService.js'
import timingServiceRoutes from './services/orbit/timingService.js'
import { kUser } from './auth/userContext.js'
import { errorInterceptor } from './services/errorInterceptor.js'
import { loggingInterceptor } from './services/loggingInterceptor.js'
import { createValidationInterceptor } from './services/validationInterceptor.js'
import {
  renderCallbackPage,
  renderComposioCallbackPage,
} from './utils/renderCallback.js'
import dotenv from 'dotenv'
import { registerLoggingRoutes } from './services/logging.js'
import { registerAuthRoutes } from './routes/auth.js'
import { IpLinkRepository } from './db/repo.js'
import { registerTrialRoutes } from './services/trial.js'
import {
  registerBillingRoutes,
  registerBillingPublicRoutes,
} from './services/billing.js'
import { registerUserRoutes } from './services/user.js'
import { registerStripeWebhook } from './services/stripeWebhook.js'
import { requireAuthHook } from './auth/betterAuthPlugin.js'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'

dotenv.config()

// Create the main server function
export const startServer = async () => {
  console.log('\nStarting Orbit Server...')
  console.log('================================================')

  const connectRpcServer = fastify({
    logger: process.env.SHOW_ALL_REQUEST_LOGS === 'true',
    trustProxy: true,
  })

  // Register cookie support - REQUIRED for Better Auth sessions
  await connectRpcServer.register(cookie, {
    secret: process.env.BETTER_AUTH_SECRET || process.env.SECRET_KEY,
    parseOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      // For Electron apps (undefined origin), use 'lax' instead of 'none'
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    },
  })
  console.log('Cookie parser registered')

  // Build CORS origin list including production CLIENT_URL
  const corsOrigins: (string | RegExp)[] = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://localhost:5173', // HTTPS localhost for development
    'app://.', // Electron app protocol
    /^app:\/\//, // Electron app protocol regex
    'file://', // Local file protocol
    /^file:\/\//, // File protocol regex
    'orbit://', // Custom orbit protocol
    /^orbit:\/\//, // Custom orbit protocol regex
  ]

  // Add environment-specific URLs
  if (process.env.CLIENT_URL) {
    corsOrigins.push(process.env.CLIENT_URL)
  }
  if (process.env.BETTER_AUTH_URL) {
    corsOrigins.push(process.env.BETTER_AUTH_URL)
  }

  await connectRpcServer.register(cors, {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Electron, etc.)
      if (!origin) return callback(null, true)

      // Check if origin matches any of our allowed patterns
      const isAllowed = corsOrigins.some(allowedOrigin => {
        if (typeof allowedOrigin === 'string') {
          return allowedOrigin === origin
        } else if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin)
        }
        return false
      })

      if (isAllowed) {
        callback(null, true)
      } else {
        console.log('CORS blocked origin:', origin)
        callback(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
  })
  console.log(
    'CORS enabled for origins:',
    corsOrigins.filter(o => typeof o === 'string').join(', '),
    'and regex patterns for Electron/file protocols',
  )

  const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true'
  const CLIENT_LOG_GROUP_NAME = process.env.CLIENT_LOG_GROUP_NAME

  // Register Better Auth routes
  console.log('\nBetter Auth Configuration:')
  console.log(
    `   Base URL: ${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}`,
  )
  console.log(
    `   Secret: ${process.env.BETTER_AUTH_SECRET ? 'Configured' : 'Missing'}`,
  )
  console.log(
    `   Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`,
  )
  console.log(
    `   GitHub OAuth: ${process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET ? 'Configured' : 'Not configured'}`,
  )
  console.log(
    `   Google OAuth: ${process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? 'Configured' : 'Not configured'}`,
  )
  await registerAuthRoutes(connectRpcServer)
  console.log('Better Auth routes registered at /api/auth/*')

  // Public billing routes (no auth)
  await registerBillingPublicRoutes(connectRpcServer)

  // Stripe webhook (public)
  await registerStripeWebhook(connectRpcServer)

  // Register IP correlation candidate (from website click)
  connectRpcServer.post('/link/register-ip', async (request, reply) => {
    try {
      const { websiteDistinctId } = (request.body ?? {}) as {
        websiteDistinctId?: string
      }
      if (!websiteDistinctId || typeof websiteDistinctId !== 'string') {
        reply.code(400).send({ error: 'Missing websiteDistinctId' })
        return
      }

      // Hash IP with a server-side salt to avoid storing raw IP
      const ip = (request.ip || '').trim()
      const salt = process.env.IP_SALT || 'orbit-default-salt'
      const hash = await import('crypto').then(({ createHash }) =>
        createHash('sha256').update(`${salt}:${ip}`).digest('hex'),
      )

      await IpLinkRepository.registerCandidate(hash, websiteDistinctId)
      reply.send({ success: true })
    } catch (error: any) {
      connectRpcServer.log.error({ error }, 'Failed to register IP candidate')
      reply.code(500).send({ error: 'Internal error' })
    }
  })

  connectRpcServer.get('/link/resolve', async (request, reply) => {
    try {
      const ip = (request.ip || '').trim()
      const salt = process.env.IP_SALT || 'orbit-default-salt'
      const hash = await import('crypto').then(({ createHash }) =>
        createHash('sha256').update(`${salt}:${ip}`).digest('hex'),
      )
      const websiteDistinctId = await IpLinkRepository.consumeLatestForIp(hash)
      reply.send({ websiteDistinctId: websiteDistinctId ?? null })
      return
    } catch (e) {
      connectRpcServer.log.debug({ error: e }, 'IP correlation failed')
      reply.send({ websiteDistinctId: null })
      return
    }
  })

  // Register Connect RPC plugin in a context that conditionally applies authentication
  await connectRpcServer.register(async function (fastify) {
    console.log('\nAuthentication Configuration:')
    // Apply Better Auth authentication to all routes if REQUIRE_AUTH is true
    if (REQUIRE_AUTH) {
      console.log('   Status: ENABLED')
      console.log('   Provider: Better Auth')
      fastify.addHook('preHandler', requireAuthHook)
    } else {
      console.log('   Status: DISABLED')
    }

    console.log('\nLogging Configuration:')
    if (process.env.SHOW_CLIENT_LOGS === 'true') {
      console.log('   Client Logs: ENABLED')
    } else {
      console.log('   Client Logs: DISABLED')
    }

    if (process.env.SHOW_ALL_REQUEST_LOGS === 'true') {
      console.log('   Request Logs: ENABLED')
    } else {
      console.log('   Request Logs: DISABLED')
    }
    console.log('================================================\n')

    // Register the Connect RPC plugin with our service routes and interceptors
    await fastify.register(fastifyConnectPlugin, {
      routes: router => {
        orbitServiceRoutes(router)
        timingServiceRoutes(router)
      },
      // Order matters: logging -> validation -> error handling
      interceptors: [
        loggingInterceptor,
        createValidationInterceptor(),
        errorInterceptor,
      ],
      contextValues: request => {
        // Pass Better Auth user info from Fastify request to Connect RPC context
        if (REQUIRE_AUTH && request.user && request.user.sub) {
          return createContextValues().set(kUser, request.user)
        }
        return createContextValues()
      },
    })

    await registerLoggingRoutes(fastify, {
      requireAuth: REQUIRE_AUTH,
      clientLogGroupName: CLIENT_LOG_GROUP_NAME,
      showClientLogs: process.env.SHOW_CLIENT_LOGS === 'true',
    })

    await registerTrialRoutes(fastify, { requireAuth: REQUIRE_AUTH })
    await registerBillingRoutes(fastify, { requireAuth: REQUIRE_AUTH })
    await registerUserRoutes(fastify, { requireAuth: REQUIRE_AUTH })
  })

  // Error handling - this handles Fastify-level errors, not RPC errors
  connectRpcServer.setErrorHandler((error, _, reply) => {
    connectRpcServer.log.error(error)
    reply.status(500).send({
      error: 'Internal Server Error',
      message: error.message,
    })
  })

  // Basic REST route for health check
  connectRpcServer.get('/', async (_, reply) => {
    reply.type('text/plain')
    reply.send('Welcome to the Orbit Connect RPC server!')
  })

  // Callback endpoint (alternative route for same functionality)
  connectRpcServer.get('/callback', async (request, reply) => {
    const { code, state } = request.query as {
      code: string
      state: string
    }

    const html = renderCallbackPage({ code, state })

    reply.type('text/html')
    reply.send(html)
  })

  // Composio OAuth callback — shows "You're all done!" + Open App button
  connectRpcServer.get('/composio/callback', async (request, reply) => {
    const { status, connected_account_id } = request.query as {
      status: string
      connected_account_id: string
    }

    const html = renderComposioCallbackPage({
      status: status || 'unknown',
      connectedAccountId: connected_account_id || '',
    })

    reply.type('text/html')
    reply.send(html)
  })

  // Start the server
  const rpcPort = 3000
  const host = '0.0.0.0'

  try {
    await Promise.all([connectRpcServer.listen({ port: rpcPort, host })])
    console.log('\nServer started successfully!')
    console.log('================================================')
    console.log(`Connect RPC server: http://${host}:${rpcPort}`)
    console.log(`Better Auth API: http://${host}:${rpcPort}/api/auth/*`)
    console.log('================================================\n')
  } catch (err) {
    connectRpcServer.log.error(err)
    process.exit(1)
  }
}
