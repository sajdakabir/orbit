import { betterAuth } from 'better-auth'
import { Pool } from 'pg'

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not configured in .env file')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Add connection timeout and retry settings
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
})

// Test database connection on startup
pool.on('error', err => {
  console.error('Unexpected database error:', err)
})

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET || process.env.SECRET_KEY,
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Set to true if you want email verification
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days (increased from default 7 days)
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  trustedOrigins: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    process.env.BETTER_AUTH_URL || 'http://localhost:3000',
    'app://.', // For Electron apps
    'file://', // For local file protocol
    'orbit://', // Custom protocol
    'http://localhost',
    'https://localhost',
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.VITE_GRPC_BASE_URL || 'http://localhost:3000', // Production domain via env var
  ],
})
