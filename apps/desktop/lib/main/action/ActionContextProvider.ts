import { getCurrentUserId } from '../store'
import { executeComposioAction, fetchActiveConnections } from './composioApi'
import log from 'electron-log'

export interface SlackMember {
  name: string
  id: string
  username: string
}

export interface SlackChannel {
  name: string
  id: string
}

export interface GmailContact {
  name: string
  email: string
}

export interface ActionContext {
  connectedToolkits: string[]
  connections: Map<string, string> // toolkitSlug → connectionId
  slack?: {
    members: SlackMember[]
    channels: SlackChannel[]
  }
  gmail?: {
    contacts: GmailContact[]
  }
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Composio wraps tool execution results in various nested formats.
 * This helper recursively unwraps .data and .response_data until
 * we reach the actual payload object.
 *
 * Observed structures from the v3 API:
 *   { data: { data: { members: [...] } }, successful: true }   // double-nested .data
 *   { data: { response_data: { members: [...] } } }
 *   { data: "{ \"members\": [...] }" }   // JSON string
 *   { members: [...] }  // direct
 */
function unwrapComposioResponse(raw: any): any {
  if (!raw) return {}

  log.info('[ActionContext] Raw response top-level keys:', Object.keys(raw))

  let data = raw

  // Keep unwrapping .data until we stop finding it (handles double-nested data.data.data...)
  let depth = 0
  while (data && typeof data === 'object' && data.data !== undefined && depth < 5) {
    log.info(`[ActionContext] Unwrapping .data at depth ${depth} (type: ${typeof data.data})`)
    data = data.data
    depth++
    // Handle JSON string
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
        log.info('[ActionContext] Parsed JSON string in .data')
      } catch {
        log.warn('[ActionContext] .data is a string but not valid JSON:', data.slice(0, 200))
        return {}
      }
    }
  }

  // Unwrap .response_data if present
  if (data && typeof data === 'object' && data.response_data !== undefined) {
    log.info('[ActionContext] Unwrapping .response_data (type:', typeof data.response_data, ')')
    data = data.response_data
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data)
        log.info('[ActionContext] Parsed JSON string in .response_data')
      } catch {
        log.warn('[ActionContext] .response_data is a string but not valid JSON:', data.slice(0, 200))
        return {}
      }
    }
  }

  log.info('[ActionContext] Unwrapped data keys:', Object.keys(data || {}))
  return data || {}
}

class ActionContextProvider {
  private cache: ActionContext | null = null
  private cacheTimestamp = 0
  private fetchPromise: Promise<ActionContext> | null = null

  /**
   * Returns cached context or fetches fresh if expired.
   * Deduplicates concurrent calls via shared promise.
   */
  async getContext(): Promise<ActionContext> {
    if (this.cache && Date.now() - this.cacheTimestamp < CACHE_TTL_MS) {
      log.info('[ActionContext] Returning cached context (age:', Math.round((Date.now() - this.cacheTimestamp) / 1000), 's)')
      return this.cache
    }

    // Deduplicate concurrent fetches
    if (this.fetchPromise) {
      log.info('[ActionContext] Joining in-flight fetch')
      return this.fetchPromise
    }

    this.fetchPromise = this.fetchFresh()
    try {
      const context = await this.fetchPromise
      this.cache = context
      this.cacheTimestamp = Date.now()
      return context
    } finally {
      this.fetchPromise = null
    }
  }

  invalidateCache(): void {
    log.info('[ActionContext] Cache invalidated')
    this.cache = null
    this.cacheTimestamp = 0
  }

  private async fetchFresh(): Promise<ActionContext> {
    log.info('[ActionContext] Fetching fresh context...')

    const userId = getCurrentUserId() || 'default'
    const activeConnections = await fetchActiveConnections(userId)

    const connectedToolkits = activeConnections.map(c => c.toolkitSlug).filter(Boolean)
    const connections = new Map<string, string>()
    for (const conn of activeConnections) {
      if (conn.toolkitSlug) {
        connections.set(conn.toolkitSlug, conn.id)
      }
    }

    log.info('[ActionContext] Connected toolkits:', connectedToolkits.join(', ') || 'none')

    const context: ActionContext = { connectedToolkits, connections }

    // Fetch toolkit-specific context in parallel
    const fetchTasks: Promise<void>[] = []

    const slackConnectionId = connections.get('slack')
    if (slackConnectionId) {
      log.info('[ActionContext] Fetching Slack context with connectionId:', slackConnectionId)
      fetchTasks.push(this.fetchSlackContext(slackConnectionId, userId, context))
    }

    const gmailConnectionId = connections.get('gmail')
    if (gmailConnectionId) {
      log.info('[ActionContext] Fetching Gmail context with connectionId:', gmailConnectionId)
      fetchTasks.push(this.fetchGmailContext(gmailConnectionId, userId, context))
    }

    const results = await Promise.allSettled(fetchTasks)
    for (const r of results) {
      if (r.status === 'rejected') {
        log.warn('[ActionContext] Partial context fetch failed:', r.reason)
      }
    }

    log.info(
      '[ActionContext] Context ready — Slack members:',
      context.slack?.members.length ?? 0,
      '| Slack channels:',
      context.slack?.channels.length ?? 0,
      '| Gmail contacts:',
      context.gmail?.contacts.length ?? 0,
    )

    // Log first few member names for debugging
    if (context.slack?.members.length) {
      const sample = context.slack.members.slice(0, 5).map(m => `${m.name} (${m.id})`).join(', ')
      log.info('[ActionContext] Sample Slack members:', sample)
    }

    return context
  }

  private async fetchSlackContext(
    connectionId: string,
    userId: string,
    context: ActionContext,
  ): Promise<void> {
    // Fetch members and channels in parallel
    const [membersResult, channelsResult] = await Promise.allSettled([
      executeComposioAction(
        'SLACK_LIST_ALL_USERS',
        connectionId,
        userId,
        { limit: 200 },
      ),
      executeComposioAction(
        'SLACK_LIST_ALL_CHANNELS',
        connectionId,
        userId,
        { limit: 50 },
      ),
    ])

    const members: SlackMember[] = []
    const channels: SlackChannel[] = []

    // Parse members
    if (membersResult.status === 'fulfilled') {
      log.info('[ActionContext] === Parsing Slack members response ===')
      const data = unwrapComposioResponse(membersResult.value)
      const memberList = data?.members || (Array.isArray(data) ? data : [])

      log.info('[ActionContext] Member list length:', memberList.length)

      // If still empty, try to find members array anywhere in the response
      if (memberList.length === 0) {
        log.warn('[ActionContext] No members found in expected locations. Full response (truncated):',
          JSON.stringify(membersResult.value).slice(0, 500))
      }

      for (const m of memberList) {
        if (m.deleted || m.is_bot || m.id === 'USLACKBOT') continue
        members.push({
          name: m.real_name || m.profile?.real_name || m.name || '',
          id: m.id,
          username: m.name || '',
        })
      }
    } else {
      log.warn('[ActionContext] Failed to fetch Slack members:', membersResult.reason)
    }

    // Parse channels
    if (channelsResult.status === 'fulfilled') {
      log.info('[ActionContext] === Parsing Slack channels response ===')
      const data = unwrapComposioResponse(channelsResult.value)
      const channelList = data?.channels || (Array.isArray(data) ? data : [])

      if (channelList.length === 0) {
        log.warn('[ActionContext] No channels found. Full response (truncated):',
          JSON.stringify(channelsResult.value).slice(0, 500))
      }

      for (const ch of channelList) {
        if (ch.is_archived) continue
        channels.push({
          name: ch.name || '',
          id: ch.id,
        })
      }
    } else {
      log.warn('[ActionContext] Failed to fetch Slack channels:', channelsResult.reason)
    }

    context.slack = { members: members.slice(0, 50), channels: channels.slice(0, 30) }
  }

  private async fetchGmailContext(
    connectionId: string,
    userId: string,
    context: ActionContext,
  ): Promise<void> {
    const raw = await executeComposioAction(
      'GMAIL_FETCH_EMAILS',
      connectionId,
      userId,
      { max_results: 20 },
    )

    const data = unwrapComposioResponse(raw)
    const messages = data?.messages || (Array.isArray(data) ? data : [])
    const contactMap = new Map<string, string>() // email → name

    for (const msg of messages) {
      const fields = [msg.from, ...(msg.to || '').split(',')]
      for (const field of fields) {
        if (!field) continue
        const parsed = parseEmailField(field)
        if (parsed && !contactMap.has(parsed.email.toLowerCase())) {
          contactMap.set(parsed.email.toLowerCase(), parsed.name)
        }
      }
    }

    const contacts: GmailContact[] = Array.from(contactMap.entries())
      .map(([email, name]) => ({ name, email }))
      .slice(0, 30)

    context.gmail = { contacts }
  }
}

function parseEmailField(field: string): { name: string; email: string } | null {
  const bracketMatch = field.match(/^(.+?)\s*<([^>]+)>/)
  if (bracketMatch) {
    const name = bracketMatch[1].replace(/"/g, '').trim()
    const email = bracketMatch[2].trim()
    if (email.includes('@')) {
      return { name: name || email, email }
    }
  }
  const plain = field.trim()
  if (plain.includes('@')) {
    return { name: plain.split('@')[0], email: plain }
  }
  return null
}

export const actionContextProvider = new ActionContextProvider()
