import type { ParsedAction, DisambiguationRequest } from '../../types/action'
import type { ActionContext, SlackMember } from './ActionContextProvider'
import { executeComposioAction } from './composioApi'
import log from 'electron-log'

interface ResolvedResult {
  resolved: boolean
  disambiguation: DisambiguationRequest | null
  updatedParameters: Record<string, any>
}

interface Candidate {
  label: string
  value: string
}

/**
 * Resolve ambiguous parameters (names → emails, Slack IDs) by looking up
 * connected services via Composio. Uses cached context for fuzzy matching
 * and falls back to API search.
 */
export async function resolveContacts(
  parsed: ParsedAction,
  connectedAccountId: string,
  userId: string,
  context?: ActionContext,
): Promise<ResolvedResult> {
  const updatedParams = { ...parsed.parameters }

  if (parsed.toolkitSlug === 'gmail') {
    const email = updatedParams.recipient_email
    if (email && !String(email).includes('@')) {
      const result = await resolveGmailContact(email, connectedAccountId, userId)
      if (result.disambiguation) {
        return { resolved: false, disambiguation: result.disambiguation, updatedParameters: updatedParams }
      }
      if (result.resolvedValue) {
        updatedParams.recipient_email = result.resolvedValue
      }
    }
  }

  if (parsed.toolkitSlug === 'slack') {
    const channel = updatedParams.channel
    if (channel && !/^[UC][A-Z0-9]{8,}$/.test(channel)) {
      const result = await resolveSlackUser(channel, connectedAccountId, userId, context)
      if (result.disambiguation) {
        return { resolved: false, disambiguation: result.disambiguation, updatedParameters: updatedParams }
      }
      if (result.resolvedValue) {
        updatedParams.channel = result.resolvedValue
      }
    }
  }

  return { resolved: true, disambiguation: null, updatedParameters: updatedParams }
}

async function resolveGmailContact(
  name: string,
  connectedAccountId: string,
  userId: string,
): Promise<{ resolvedValue: string | null; disambiguation: DisambiguationRequest | null }> {
  log.info('[ContactResolver] Resolving Gmail contact for:', name)

  const response = await executeComposioAction(
    'GMAIL_FETCH_EMAILS',
    connectedAccountId,
    userId,
    { query: `from:${name} OR to:${name}`, max_results: 10 },
  )

  // Unwrap Composio response — may be double-nested as data.data.messages
  let data = response
  while (data && typeof data === 'object' && data.data !== undefined) {
    data = data.data
    if (typeof data === 'string') { try { data = JSON.parse(data) } catch { data = {} } }
  }
  if (data?.response_data !== undefined) {
    data = data.response_data
    if (typeof data === 'string') { try { data = JSON.parse(data) } catch { data = {} } }
  }

  const messages = data?.messages || (Array.isArray(data) ? data : [])

  // Extract unique email addresses from from/to fields
  const emailMap = new Map<string, string>() // email → display label
  const needle = name.toLowerCase()

  for (const msg of messages) {
    const fields = [msg.from, ...(msg.to || '').split(',')]
    for (const field of fields) {
      if (!field) continue
      const parsed = parseEmailField(field)
      if (!parsed) continue

      // Only include emails where the name portion matches what the user said
      if (parsed.name.toLowerCase().includes(needle) || needle.includes(parsed.name.toLowerCase().split(' ')[0])) {
        if (!emailMap.has(parsed.email.toLowerCase())) {
          emailMap.set(parsed.email.toLowerCase(), `${parsed.name} (${parsed.email})`)
        }
      }
    }
  }

  const candidates: Candidate[] = Array.from(emailMap.entries()).map(([email, label]) => ({
    label,
    value: email,
  }))

  log.info('[ContactResolver] Gmail candidates:', candidates.length)

  if (candidates.length === 0) {
    return { resolvedValue: null, disambiguation: null }
  }

  if (candidates.length === 1) {
    return { resolvedValue: candidates[0].value, disambiguation: null }
  }

  return {
    resolvedValue: null,
    disambiguation: {
      field: 'recipient_email',
      question: `Multiple email addresses found for "${name}". Which one?`,
      options: candidates.slice(0, 5),
    },
  }
}

/**
 * Resolve a name to a Slack user ID.
 *
 * Strategy:
 * 1. Fuzzy-match against cached member list (handles speech-to-text variations)
 * 2. Fall back to SLACK_FIND_USERS API (handles exact/prefix matches)
 * 3. Try individual words from multi-word names
 */
async function resolveSlackUser(
  name: string,
  connectedAccountId: string,
  userId: string,
  context?: ActionContext,
): Promise<{ resolvedValue: string | null; disambiguation: DisambiguationRequest | null }> {
  log.info('[ContactResolver] Resolving Slack user for:', name)

  const allCandidates = new Map<string, Candidate>() // id → candidate (dedup)

  // Strategy 1: Fuzzy match against cached member list
  if (context?.slack?.members.length) {
    log.info('[ContactResolver] Fuzzy matching against', context.slack.members.length, 'cached members')
    const fuzzyMatches = fuzzyMatchMembers(name, context.slack.members)
    for (const m of fuzzyMatches) {
      allCandidates.set(m.value, m)
    }
    log.info('[ContactResolver] Fuzzy match candidates:', fuzzyMatches.length)
  }

  // Strategy 2: SLACK_FIND_USERS API search (if no fuzzy matches found)
  if (allCandidates.size === 0) {
    const words = name.trim().split(/\s+/).filter(w => w.length > 2)
    const searchQueries = [name.trim(), ...words]
    const uniqueQueries = [...new Set(searchQueries.map(q => q.toLowerCase()))]

    log.info('[ContactResolver] No fuzzy matches, trying API search:', uniqueQueries.join(', '))

    for (const query of uniqueQueries) {
      try {
        const response = await executeComposioAction(
          'SLACK_FIND_USERS',
          connectedAccountId,
          userId,
          { search_query: query },
        )

        let data = response
        while (data && typeof data === 'object' && data.data !== undefined) {
          data = data.data
          if (typeof data === 'string') { try { data = JSON.parse(data) } catch { data = {} } }
        }
        if (data?.response_data !== undefined) {
          data = data.response_data
          if (typeof data === 'string') { try { data = JSON.parse(data) } catch { data = {} } }
        }

        const users = data?.users || (Array.isArray(data) ? data : [])
        log.info(`[ContactResolver] SLACK_FIND_USERS("${query}") returned ${users.length} results`)

        for (const u of users) {
          if (!allCandidates.has(u.id)) {
            allCandidates.set(u.id, {
              label: `${u.real_name || u.name} (@${u.name})`,
              value: u.id,
            })
          }
        }
      } catch (err) {
        log.warn(`[ContactResolver] SLACK_FIND_USERS("${query}") failed:`, err)
      }
    }
  }

  const candidates = Array.from(allCandidates.values())
  log.info('[ContactResolver] Total Slack candidates:', candidates.length)

  if (candidates.length === 0) {
    return { resolvedValue: null, disambiguation: null }
  }

  if (candidates.length === 1) {
    log.info('[ContactResolver] Resolved to:', candidates[0].label, candidates[0].value)
    return { resolvedValue: candidates[0].value, disambiguation: null }
  }

  return {
    resolvedValue: null,
    disambiguation: {
      field: 'channel',
      question: `Multiple Slack users match "${name}". Who did you mean?`,
      options: candidates.slice(0, 5),
    },
  }
}

/**
 * Fuzzy match a spoken name against the cached Slack member list.
 * Handles speech-to-text variations like "Shahin" for "Sahin",
 * "Allure" for "Oliur", etc.
 */
function fuzzyMatchMembers(spokenName: string, members: SlackMember[]): Candidate[] {
  const needle = spokenName.toLowerCase().trim()
  const needleWords = needle.split(/\s+/).filter(w => w.length > 1)

  const scored: { member: SlackMember; score: number }[] = []

  for (const m of members) {
    const realName = (m.name || '').toLowerCase()
    const username = (m.username || '').toLowerCase()
    const realNameWords = realName.split(/\s+/)

    let score = 0

    // Exact match on username or real_name
    if (username === needle || realName === needle) {
      score = 100
    }
    // Username contains needle or vice versa
    else if (username.includes(needle) || needle.includes(username)) {
      score = 80
    }
    // Real name contains needle or vice versa
    else if (realName.includes(needle) || needle.includes(realName)) {
      score = 75
    }
    // Word-level matching: any word in the spoken name matches any word in the real name
    else {
      for (const nw of needleWords) {
        for (const rw of realNameWords) {
          if (rw === nw) {
            score = Math.max(score, 70)
          } else if (rw.includes(nw) || nw.includes(rw)) {
            score = Math.max(score, 60)
          }
          // Phonetic-ish fuzzy: check edit distance for speech-to-text variations
          // e.g. "shahin" vs "sahin" (dist=1), "shaheen" vs "sahin" (dist=3)
          else if (nw.length >= 3 && rw.length >= 3) {
            const dist = levenshtein(nw, rw)
            const maxLen = Math.max(nw.length, rw.length)
            const similarity = 1 - dist / maxLen
            if (similarity >= 0.5) {
              score = Math.max(score, Math.round(similarity * 55))
            }
          }
        }
      }
      // Also check username against each spoken word
      for (const nw of needleWords) {
        if (username === nw) {
          score = Math.max(score, 80)
        } else if (username.includes(nw) || nw.includes(username)) {
          score = Math.max(score, 65)
        } else if (nw.length >= 3 && username.length >= 3) {
          const dist = levenshtein(nw, username)
          const maxLen = Math.max(nw.length, username.length)
          const similarity = 1 - dist / maxLen
          if (similarity >= 0.5) {
            score = Math.max(score, Math.round(similarity * 55))
          }
        }
      }
    }

    if (score >= 30) {
      scored.push({ member: m, score })
    }
  }

  // Sort by score descending, take top matches
  scored.sort((a, b) => b.score - a.score)

  log.info('[ContactResolver] Fuzzy scores:', scored.slice(0, 5).map(s => `${s.member.name}(${s.score})`).join(', '))

  // If top score is much higher than second, return just the top
  if (scored.length >= 2 && scored[0].score - scored[1].score >= 15) {
    return [{
      label: `${scored[0].member.name} (@${scored[0].member.username})`,
      value: scored[0].member.id,
    }]
  }

  // Return all candidates with reasonable scores
  return scored
    .filter(s => s.score >= 30)
    .slice(0, 5)
    .map(s => ({
      label: `${s.member.name} (@${s.member.username})`,
      value: s.member.id,
    }))
}

/** Simple Levenshtein distance for fuzzy string matching */
function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

/** Parse "John Doe <john@example.com>" into { name, email } */
function parseEmailField(field: string): { name: string; email: string } | null {
  const bracketMatch = field.match(/^(.+?)\s*<([^>]+)>/)
  if (bracketMatch) {
    const name = bracketMatch[1].replace(/"/g, '').trim()
    const email = bracketMatch[2].trim()
    if (email.includes('@')) {
      return { name: name || email, email }
    }
  }
  // Plain email address
  const plain = field.trim()
  if (plain.includes('@')) {
    return { name: plain.split('@')[0], email: plain }
  }
  return null
}
