/**
 * Composio API Client (v3)
 * Handles interaction with Composio API for tool connections
 */

const COMPOSIO_API_BASE = 'https://backend.composio.dev/api/v3'

export interface ComposioTool {
  name: string
  key: string
  description: string
  logo: string
  enabled: boolean
  appId: string
  categories: string[]
}

export interface ComposioConnection {
  id: string
  toolkitSlug: string
  userId: string
  status: 'INITIALIZING' | 'ACTIVE' | 'EXPIRED' | 'FAILED' | 'INITIATED' | 'INACTIVE'
  createdAt: string
  updatedAt: string
}

export interface AuthConfig {
  id: string
  toolkitSlug: string
  authScheme: string
  isComposioManaged: boolean
  status: string
}

export class ComposioClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  private headers() {
    return {
      'x-api-key': this.apiKey,
      'Content-Type': 'application/json',
    }
  }

  /**
   * Get available toolkits
   */
  async getToolkits(): Promise<ComposioTool[]> {
    try {
      const response = await fetch(`${COMPOSIO_API_BASE}/toolkits?limit=100`, {
        headers: this.headers(),
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch toolkits: ${response.statusText}`)
      }

      const data = await response.json()
      return (data.items || []).map((tk: any) => ({
        name: tk.name || tk.slug,
        key: tk.slug,
        description: tk.meta?.description || `Connect with ${tk.name || tk.slug}`,
        logo: tk.meta?.logo || '',
        enabled: !tk.no_auth || tk.composio_managed_auth_schemes?.length > 0,
        appId: tk.slug,
        categories: (tk.meta?.categories || []).map((c: any) => c.name || c.id),
      }))
    } catch (error) {
      console.error('Error fetching Composio toolkits:', error)
      return []
    }
  }

  /**
   * Get user's connected accounts
   */
  async getConnections(): Promise<ComposioConnection[]> {
    try {
      const response = await fetch(
        `${COMPOSIO_API_BASE}/connected_accounts?limit=100`,
        { headers: this.headers() },
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch connections: ${response.statusText}`)
      }

      const data = await response.json()
      return (data.items || []).map((conn: any) => ({
        id: conn.id,
        toolkitSlug: conn.toolkit?.slug || '',
        userId: conn.user_id || '',
        status: conn.status,
        createdAt: conn.created_at,
        updatedAt: conn.updated_at,
      }))
    } catch (error) {
      console.error('Error fetching Composio connections:', error)
      return []
    }
  }

  /**
   * Get or create an auth config for a toolkit
   */
  async getOrCreateAuthConfig(toolkitSlug: string): Promise<string> {
    // Try to find an existing auth config
    const listRes = await fetch(
      `${COMPOSIO_API_BASE}/auth_configs?toolkit_slug=${encodeURIComponent(toolkitSlug)}`,
      { headers: this.headers() },
    )

    if (listRes.ok) {
      const listData = await listRes.json()
      const existing = (listData.items || []).find(
        (ac: any) => ac.status === 'ENABLED',
      )
      if (existing) return existing.id
    }

    // Create a new auth config using Composio managed auth
    const createRes = await fetch(`${COMPOSIO_API_BASE}/auth_configs`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ toolkit: { slug: toolkitSlug } }),
    })

    if (!createRes.ok) {
      throw new Error(`Failed to create auth config: ${createRes.statusText}`)
    }

    const createData = await createRes.json()
    return createData.auth_config?.id
  }

  /**
   * Initiate connection to a toolkit via Connect Link
   */
  async initiateConnection(
    toolkitSlug: string,
    callbackUrl?: string,
    userId?: string,
  ): Promise<string> {
    const authConfigId = await this.getOrCreateAuthConfig(toolkitSlug)

    const response = await fetch(
      `${COMPOSIO_API_BASE}/connected_accounts/link`,
      {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({
          auth_config_id: authConfigId,
          user_id: userId || 'default',
          callback_url: callbackUrl || process.env.VITE_GRPC_BASE_URL || 'http://localhost:3000',
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`Failed to initiate connection: ${response.statusText}`)
    }

    const data = await response.json()
    return data.redirect_url || ''
  }

  /**
   * Disconnect a connected account
   */
  async disconnect(connectionId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${COMPOSIO_API_BASE}/connected_accounts/${connectionId}`,
        {
          method: 'DELETE',
          headers: this.headers(),
        },
      )

      return response.ok
    } catch (error) {
      console.error('Error disconnecting Composio tool:', error)
      return false
    }
  }
}

// Singleton instance
let composioClient: ComposioClient | null = null

export const getComposioClient = (apiKey?: string): ComposioClient => {
  if (!composioClient && apiKey) {
    composioClient = new ComposioClient(apiKey)
  }

  if (!composioClient) {
    throw new Error('Composio client not initialized. API key required.')
  }

  return composioClient
}
