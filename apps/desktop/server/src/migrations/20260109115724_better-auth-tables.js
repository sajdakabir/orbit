/**
 * Migration: Better Auth Tables
 * Creates tables required for Better Auth:
 * - user: Stores user information
 * - session: Manages user sessions
 * - account: Links users with OAuth providers
 * - verification: Stores email verification tokens
 */

export async function up(pgm) {
  // Users table
  pgm.createTable('user', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
    },
    email: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    emailVerified: {
      type: 'boolean',
      notNull: true,
      default: false,
    },
    image: {
      type: 'text',
    },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updatedAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  })

  // Sessions table
  pgm.createTable('session', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    expiresAt: {
      type: 'timestamp',
      notNull: true,
    },
    token: {
      type: 'text',
      notNull: true,
      unique: true,
    },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updatedAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    ipAddress: {
      type: 'text',
    },
    userAgent: {
      type: 'text',
    },
    userId: {
      type: 'text',
      notNull: true,
      references: 'user',
      onDelete: 'CASCADE',
    },
  })

  // Accounts table (for OAuth providers)
  pgm.createTable('account', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    accountId: {
      type: 'text',
      notNull: true,
    },
    providerId: {
      type: 'text',
      notNull: true,
    },
    userId: {
      type: 'text',
      notNull: true,
      references: 'user',
      onDelete: 'CASCADE',
    },
    accessToken: {
      type: 'text',
    },
    refreshToken: {
      type: 'text',
    },
    idToken: {
      type: 'text',
    },
    accessTokenExpiresAt: {
      type: 'timestamp',
    },
    refreshTokenExpiresAt: {
      type: 'timestamp',
    },
    scope: {
      type: 'text',
    },
    password: {
      type: 'text',
    },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updatedAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  })

  // Verification table (for email verification)
  pgm.createTable('verification', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    identifier: {
      type: 'text',
      notNull: true,
    },
    value: {
      type: 'text',
      notNull: true,
    },
    expiresAt: {
      type: 'timestamp',
      notNull: true,
    },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updatedAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  })

  // Create indexes for better performance
  pgm.createIndex('session', 'userId')
  pgm.createIndex('session', 'token')
  pgm.createIndex('account', 'userId')
  pgm.createIndex('account', ['providerId', 'accountId'], { unique: true })
  pgm.createIndex('verification', 'identifier')

  console.log('✅ Better Auth tables created successfully')
}

export async function down(pgm) {
  pgm.dropTable('verification')
  pgm.dropTable('account')
  pgm.dropTable('session')
  pgm.dropTable('user')
  
  console.log('✅ Better Auth tables dropped successfully')
}
