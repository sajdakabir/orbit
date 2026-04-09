import log from 'electron-log'

const COMPOSIO_API_V3 = 'https://backend.composio.dev/api/v3'

export function getComposioApiKey(): string {
  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) throw new Error('COMPOSIO_API_KEY not configured')
  return apiKey
}

export function composioHeaders(apiKey: string) {
  return {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  }
}

/**
 * Execute a Composio tool action (e.g. send message, fetch emails, list members).
 * Shared by ActionExecutionService, ContactResolver, and ActionContextProvider.
 */
export async function executeComposioAction(
  actionSlug: string,
  connectedAccountId: string,
  userId: string,
  args: Record<string, any>,
): Promise<any> {
  const apiKey = getComposioApiKey()

  log.info('[ComposioApi] POST /tools/execute/', actionSlug)

  const response = await fetch(
    `${COMPOSIO_API_V3}/tools/execute/${encodeURIComponent(actionSlug)}`,
    {
      method: 'POST',
      headers: composioHeaders(apiKey),
      body: JSON.stringify({
        connected_account_id: connectedAccountId,
        user_id: userId,
        arguments: args,
      }),
    },
  )

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Composio action failed: ${response.status} ${errText.slice(0, 200)}`)
  }

  return response.json()
}

/**
 * Find an active Composio connection for a given toolkit and user.
 */
export async function findActiveConnection(
  toolkitSlug: string,
  userId: string,
): Promise<{ id: string } | null> {
  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) {
    log.error('[ComposioApi] COMPOSIO_API_KEY not set')
    return null
  }

  try {
    const response = await fetch(
      `${COMPOSIO_API_V3}/connected_accounts?limit=100`,
      { headers: composioHeaders(apiKey) },
    )

    if (!response.ok) {
      log.error('[ComposioApi] findActiveConnection API error:', response.status)
      return null
    }

    const data = await response.json()
    const items = data.items || []

    const match = items.find(
      (conn: any) =>
        conn.toolkit?.slug === toolkitSlug &&
        conn.status === 'ACTIVE' &&
        (userId === 'default' || conn.user_id === userId),
    )

    return match ? { id: match.id } : null
  } catch (error) {
    log.error('[ComposioApi] findActiveConnection network error:', error)
    return null
  }
}

/**
 * Fetch all active connected accounts for a user.
 * Returns array of { id, toolkitSlug }.
 */
export async function fetchActiveConnections(
  userId: string,
): Promise<{ id: string; toolkitSlug: string }[]> {
  const apiKey = process.env.COMPOSIO_API_KEY
  if (!apiKey) {
    log.error('[ComposioApi] COMPOSIO_API_KEY not set')
    return []
  }

  try {
    const response = await fetch(
      `${COMPOSIO_API_V3}/connected_accounts?limit=100`,
      { headers: composioHeaders(apiKey) },
    )

    if (!response.ok) {
      log.error('[ComposioApi] fetchActiveConnections API error:', response.status)
      return []
    }

    const data = await response.json()
    const items = data.items || []

    return items
      .filter(
        (conn: any) =>
          conn.status === 'ACTIVE' &&
          (userId === 'default' || conn.user_id === userId),
      )
      .map((conn: any) => ({
        id: conn.id,
        toolkitSlug: conn.toolkit?.slug || '',
      }))
  } catch (error) {
    log.error('[ComposioApi] fetchActiveConnections network error:', error)
    return []
  }
}
