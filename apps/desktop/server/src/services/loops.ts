const LOOPS_API_BASE = 'https://app.loops.so/api/v1'

function getApiKey(): string | undefined {
  return process.env.LOOPS_API_KEY
}

interface LoopsContact {
  email: string
  firstName?: string
  lastName?: string
  source?: string
  userId?: string
  userGroup?: string
}

/**
 * Create or update a contact in Loops.
 */
export async function createContact(contact: LoopsContact): Promise<void> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn('[loops] LOOPS_API_KEY not set, skipping contact creation')
    return
  }

  try {
    const res = await fetch(`${LOOPS_API_BASE}/contacts/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: contact.email,
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        source: contact.source || 'app-signup',
        userId: contact.userId,
        userGroup: contact.userGroup || 'users',
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[loops] Failed to create contact: ${res.status} ${body}`)
      return
    }

    console.log(`[loops] Contact created: ${contact.email}`)
  } catch (err) {
    console.error('[loops] Error creating contact:', err)
  }
}

/**
 * Send a transactional email via Loops.
 */
export async function sendEvent(
  email: string,
  eventName: string,
  eventProperties?: Record<string, string | number | boolean>,
): Promise<void> {
  const apiKey = getApiKey()
  if (!apiKey) {
    console.warn('[loops] LOOPS_API_KEY not set, skipping event')
    return
  }

  try {
    const res = await fetch(`${LOOPS_API_BASE}/events/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        eventName,
        eventProperties,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[loops] Failed to send event: ${res.status} ${body}`)
      return
    }

    console.log(`[loops] Event '${eventName}' sent to ${email}`)
  } catch (err) {
    console.error('[loops] Error sending event:', err)
  }
}
