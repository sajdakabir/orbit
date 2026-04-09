import { describe, test, expect } from 'bun:test'
import { Auth0Config } from './config'

describe('Auth Configuration', () => {
  test('Auth0Config exists as a legacy stub with empty values', () => {
    expect(Auth0Config).toBeDefined()
    expect(Auth0Config.domain).toBe('')
    expect(Auth0Config.clientId).toBe('')
  })
})
