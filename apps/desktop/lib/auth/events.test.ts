import { describe, test, expect, mock, beforeEach } from 'bun:test'
import {
  shouldRefreshToken,
  isTokenExpired,
  handleLogin,
  handleLogout,
  ensureValidTokens,
} from './events'

// Mock jwt-decode for testing token expiration logic
const mockJwtDecode = mock()
mock.module('jwt-decode', () => ({
  jwtDecode: mockJwtDecode,
}))

// Mock store - used by handleLogin and other auth functions
const mockStore = {
  get: mock(),
  set: mock(),
  delete: mock(),
}
mock.module('../main/store', () => ({
  default: mockStore,
  store: mockStore,
  createNewAuthState: mock(() => ({
    state: 'test-state',
    codeVerifier: 'test-verifier',
  })),
}))

// Mock gRPC client
const mockGrpcClient = {
  setAuthToken: mock(),
}
mock.module('../clients/grpcClient', () => ({
  grpcClient: mockGrpcClient,
}))

// Mock sync service
const mockSyncService = {
  start: mock(),
  stop: mock(),
}
mock.module('../main/syncService', () => ({
  syncService: mockSyncService,
}))

// Mock main window for notifications
const mockMainWindow = {
  isDestroyed: mock().mockReturnValue(false),
  webContents: {
    send: mock(),
    session: {
      clearStorageData: mock(() => Promise.resolve()),
    },
  },
}
mock.module('../main/app', () => ({
  mainWindow: mockMainWindow,
}))

// Mock store keys
mock.module('../constants/store-keys', () => ({
  STORE_KEYS: {
    USER_PROFILE: 'userProfile',
    ID_TOKEN: 'idToken',
    ACCESS_TOKEN: 'accessToken',
    AUTH: 'auth',
  },
}))

// Mock SQLite models and repo for handleLogin's user metadata logic
mock.module('../main/sqlite/models', () => ({
  PaidStatus: { FREE: 'free' },
}))

const mockUserMetadataTable = {
  findByUserId: mock(() => Promise.resolve(null)),
  insert: mock(() => Promise.resolve()),
  update: mock(() => Promise.resolve()),
}
mock.module('../main/sqlite/repo', () => ({
  UserMetadataTable: mockUserMetadataTable,
}))

// Mock fetch for network calls
const mockFetch = mock()
global.fetch = mockFetch as any

describe('Authentication Events', () => {
  beforeEach(() => {
    mockJwtDecode.mockClear()
    mockStore.get.mockClear()
    mockStore.set.mockClear()
    mockStore.delete.mockClear()
    mockGrpcClient.setAuthToken.mockClear()
    mockSyncService.start.mockClear()
    mockSyncService.stop.mockClear()
    mockMainWindow.isDestroyed.mockClear()
    mockMainWindow.webContents.send.mockClear()
    mockFetch.mockClear()
    mockUserMetadataTable.findByUserId.mockClear()
    mockUserMetadataTable.insert.mockClear()
    mockUserMetadataTable.update.mockClear()

    // Defaults
    mockMainWindow.isDestroyed.mockReturnValue(false)
    mockUserMetadataTable.findByUserId.mockResolvedValue(null)
    mockUserMetadataTable.insert.mockResolvedValue(undefined)
    mockFetch.mockResolvedValue({ ok: false, status: 404 })
  })

  describe('shouldRefreshToken', () => {
    test('should return true when token expires within 5 minutes', () => {
      const fourMinutesFromNow = Date.now() + 4 * 60 * 1000

      expect(shouldRefreshToken(fourMinutesFromNow)).toBe(true)
    })

    test('should return false when token expires after 5 minutes', () => {
      const sixMinutesFromNow = Date.now() + 6 * 60 * 1000

      expect(shouldRefreshToken(sixMinutesFromNow)).toBe(false)
    })

    test('should return true for already expired tokens', () => {
      const oneHourAgo = Date.now() - 60 * 60 * 1000

      expect(shouldRefreshToken(oneHourAgo)).toBe(true)
    })

    test('should return true at exactly 5 minute boundary', () => {
      const exactlyFiveMinutes = Date.now() + 5 * 60 * 1000

      expect(shouldRefreshToken(exactlyFiveMinutes)).toBe(true)
    })

    test('should handle edge case at boundary', () => {
      const almostFiveMinutes = Date.now() + 5 * 60 * 1000 - 1

      expect(shouldRefreshToken(almostFiveMinutes)).toBe(true)
    })
  })

  describe('isTokenExpired', () => {
    beforeEach(() => {
      mockJwtDecode.mockClear()
    })

    test('should return false for valid non-expired JWT token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600 // 1 hour from now
      mockJwtDecode.mockReturnValue({ exp: futureExp })

      expect(isTokenExpired('valid.token.here')).toBe(false)
    })

    test('should return true for expired JWT token', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
      mockJwtDecode.mockReturnValue({ exp: pastExp })

      expect(isTokenExpired('expired.token.here')).toBe(true)
    })

    test('should return true for JWT token without exp field', () => {
      mockJwtDecode.mockReturnValue({ sub: 'user-123' }) // No exp field

      expect(isTokenExpired('token.without.exp')).toBe(true)
    })

    test('should return false when JWT decode fails (assumes Better Auth token)', () => {
      mockJwtDecode.mockImplementation(() => {
        throw new Error('Invalid JWT')
      })

      expect(isTokenExpired('malformed.token.here')).toBe(false)
    })

    test('should return false for non-JWT token (no dots)', () => {
      expect(isTokenExpired('better-auth-session-token')).toBe(false)
      expect(mockJwtDecode).not.toHaveBeenCalled()
    })

    test('should handle token at exact expiration boundary', () => {
      const currentTime = Math.floor(Date.now() / 1000)
      mockJwtDecode.mockReturnValue({ exp: currentTime })

      expect(isTokenExpired('boundary.token.here')).toBe(false)
    })
  })

  describe('handleLogin business logic', () => {
    const testProfile = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    }

    test('should always store user profile regardless of token presence', async () => {
      await handleLogin(testProfile, null, null)

      expect(mockStore.set).toHaveBeenCalledWith('userProfile', testProfile)
    })

    test('should store both tokens when both are provided', async () => {
      const idToken = 'id-token-123'
      const accessToken = 'access-token-123'

      await handleLogin(testProfile, idToken, accessToken)

      expect(mockStore.set).toHaveBeenCalledWith('userProfile', testProfile)
      expect(mockStore.set).toHaveBeenCalledWith('idToken', idToken)
      expect(mockStore.set).toHaveBeenCalledWith('accessToken', accessToken)
    })

    test('should only store ID token when access token is null', async () => {
      const idToken = 'id-token-123'

      await handleLogin(testProfile, idToken, null)

      expect(mockStore.set).toHaveBeenCalledWith('userProfile', testProfile)
      expect(mockStore.set).toHaveBeenCalledWith('idToken', idToken)
      expect(mockStore.set).not.toHaveBeenCalledWith(
        'accessToken',
        expect.anything(),
      )

      // Should not start services without access token
      expect(mockGrpcClient.setAuthToken).not.toHaveBeenCalled()
      expect(mockSyncService.start).not.toHaveBeenCalled()
    })

    test('should only store access token when ID token is null', async () => {
      const accessToken = 'access-token-123'

      await handleLogin(testProfile, null, accessToken)

      expect(mockStore.set).toHaveBeenCalledWith('userProfile', testProfile)
      expect(mockStore.set).not.toHaveBeenCalledWith(
        'idToken',
        expect.anything(),
      )
      expect(mockStore.set).toHaveBeenCalledWith('accessToken', accessToken)

      // Should start services with access token
      expect(mockGrpcClient.setAuthToken).toHaveBeenCalledWith(accessToken)
      expect(mockSyncService.start).toHaveBeenCalled()
    })

    test('should setup services only when access token is present', async () => {
      const accessToken = 'access-token-123'

      await handleLogin(testProfile, 'id-token', accessToken)

      // Services should be configured with access token
      expect(mockGrpcClient.setAuthToken).toHaveBeenCalledWith(accessToken)
      expect(mockSyncService.start).toHaveBeenCalled()
    })

    test('should not setup services when no access token provided', async () => {
      await handleLogin(testProfile, 'id-token', null)

      // Services should not be started
      expect(mockGrpcClient.setAuthToken).not.toHaveBeenCalled()
      expect(mockSyncService.start).not.toHaveBeenCalled()
    })

    test('should setup services in correct order when access token present', async () => {
      const accessToken = 'access-token-123'

      await handleLogin(testProfile, 'id-token', accessToken)

      // Verify order: store profile, store tokens, then setup services
      const calls = mockStore.set.mock.calls
      expect(calls[0]).toEqual(['userProfile', testProfile])
      expect(calls[1]).toEqual(['idToken', 'id-token'])
      expect(calls[2]).toEqual(['accessToken', accessToken])

      // Service setup should happen after token storage
      expect(mockGrpcClient.setAuthToken).toHaveBeenCalledWith(accessToken)
      expect(mockSyncService.start).toHaveBeenCalled()
    })
  })

  describe('handleLogout business logic', () => {
    test('should clear all auth data and stop services', async () => {
      await handleLogout()

      // Should delete all stored auth data
      expect(mockStore.delete).toHaveBeenCalledWith('userProfile')
      expect(mockStore.delete).toHaveBeenCalledWith('idToken')
      expect(mockStore.delete).toHaveBeenCalledWith('accessToken')

      // Should clear gRPC auth and stop sync service
      expect(mockGrpcClient.setAuthToken).toHaveBeenCalledWith(null)
      expect(mockSyncService.stop).toHaveBeenCalled()
    })
  })

  describe('ensureValidTokens business logic', () => {
    test('should return error when no stored auth exists', async () => {
      mockStore.get.mockReturnValue(null)

      const result = await ensureValidTokens()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No tokens available')
    })

    test('should return error when no tokens exist in stored auth', async () => {
      mockStore.get.mockReturnValue({ someOtherData: 'value' })

      const result = await ensureValidTokens()

      expect(result.success).toBe(false)
      expect(result.error).toBe('No tokens available')
    })

    test('should return existing tokens when not expired', async () => {
      const validTokens = {
        access_token: 'valid-access-token',
        expires_at: Date.now() + 10 * 60 * 1000, // 10 minutes from now
      }

      mockStore.get.mockReturnValue({
        tokens: validTokens,
        isAuthenticated: true,
      })

      const result: any = await ensureValidTokens()

      expect(result.success).toBe(true)
      expect(result.tokens).toBe(validTokens)
    })

    test('should logout and return error when tokens are expired', async () => {
      const expiredTokens = {
        access_token: 'expired-access-token',
        expires_at: Date.now() - 60 * 1000, // 1 minute ago
      }

      const storedAuth = {
        tokens: expiredTokens,
        isAuthenticated: true,
      }

      mockStore.get.mockReturnValue(storedAuth)

      const result = await ensureValidTokens()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Token expired')

      // Should clear auth store
      expect(mockStore.set).toHaveBeenCalledWith('auth', {
        ...storedAuth,
        tokens: null,
        isAuthenticated: false,
      })

      // Should notify renderer about expiration
      expect(mockMainWindow.webContents.send).toHaveBeenCalledWith(
        'auth-token-expired',
      )
    })

    test('should handle missing expires_at gracefully', async () => {
      const tokensWithoutExpiry = {
        access_token: 'access-token',
      }

      mockStore.get.mockReturnValue({
        tokens: tokensWithoutExpiry,
      })

      const result: any = await ensureValidTokens()

      expect(result.success).toBe(true)
      expect(result.tokens).toBe(tokensWithoutExpiry)
    })
  })
})
