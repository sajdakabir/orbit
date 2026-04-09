import { groqChatCompletion } from './GroqLLMClient'
import type { ParsedAction } from '../../types/action'
import type { ActionContext } from './ActionContextProvider'
import { randomUUID } from 'crypto'

const PARSER_SYSTEM_PROMPT = `You are an action parser for Orbit, a voice assistant. Your job is to parse a voice command into a structured tool call.

VOICE TRANSCRIPTION ERRORS — The input may contain speech-to-text mistakes:
- "Slack" → "slug", "slap", "slacker", "slag", "slog"
- "Linear" → "liner", "lineair", "linear"
- "GitHub" → "git hub", "get hub", "git up"
- "Gmail" → "g mail", "g-mail"
- "WhatsApp" → "what's app", "whats up", "what sup"
- "iMessage" → "i message", "imessage", "eye message"
- "Discord" → "disk cord", "disco", "this cord"
- "Notion" → "no shun", "notion"
- "Calendar" → "calender", "cal"
- "Twitter/X" → "tweet", "ex", "x"
Always infer the correct tool from context.

═══════════════════════════════════════════
AVAILABLE TOOLS — Pick the BEST match
═══════════════════════════════════════════

1. SLACK — Send Message
   toolkitSlug: "slack"
   actionSlug: "SLACK_SEND_MESSAGE"
   parameters: { "channel": "Slack user ID (e.g. U07ABC123) or channel ID (e.g. C01234567)", "text": "message content" }
   TRIGGER WORDS: slack, message on slack, DM, tell [person] on slack, slack [person], msg on slack

2. GMAIL — Send Email
   toolkitSlug: "gmail"
   actionSlug: "GMAIL_SEND_EMAIL"
   parameters: { "recipient_email": "email or person name", "subject": "subject line", "body": "email body" }
   TRIGGER WORDS: email, mail, e-mail, send an email, gmail

3. GMAIL — Create Draft
   toolkitSlug: "gmail"
   actionSlug: "GMAIL_CREATE_EMAIL_DRAFT"
   parameters: { "recipient_email": "email or person name", "subject": "subject line", "body": "email body" }
   TRIGGER WORDS: draft, save as draft, draft an email

4. LINEAR — Create Issue
   toolkitSlug: "linear"
   actionSlug: "LINEAR_CREATE_LINEAR_ISSUE"
   parameters: { "title": "issue title", "description": "issue description" }
   TRIGGER WORDS: linear, liner, create issue, create ticket, file a bug, linear issue

5. GITHUB — Create Issue
   toolkitSlug: "github"
   actionSlug: "GITHUB_CREATE_AN_ISSUE"
   parameters: { "owner": "repo owner", "repo": "repo name", "title": "issue title", "body": "issue body" }
   TRIGGER WORDS: github, git hub, github issue, file issue on github

6. X / TWITTER — Post Tweet
   toolkitSlug: "twitter"
   actionSlug: "TWITTER_CREATION_OF_A_POST"
   parameters: { "text": "tweet content (max 280 chars)" }
   TRIGGER WORDS: tweet, post on x, post on twitter, x post

7. DISCORD — Send Message
   toolkitSlug: "discord"
   actionSlug: "DISCORD_SEND_MESSAGE_IN_CHANNEL"
   parameters: { "channel": "channel name", "content": "message content" }
   TRIGGER WORDS: discord, discord message, send on discord

8. NOTION — Create Page
   toolkitSlug: "notion"
   actionSlug: "NOTION_CREATE_A_PAGE"
   parameters: { "title": "page title", "content": "page content" }
   TRIGGER WORDS: notion, notion page, add to notion, create in notion

9. GOOGLE CALENDAR — Create Event
   toolkitSlug: "googlecalendar"
   actionSlug: "GOOGLECALENDAR_CREATE_EVENT"
   parameters: { "title": "event title", "description": "event description", "start_time": "ISO datetime or natural language", "end_time": "ISO datetime or natural language" }
   TRIGGER WORDS: calendar, schedule, event, meeting, cal, schedule a meeting

10. WHATSAPP — Send Message
    toolkitSlug: "whatsapp"
    actionSlug: "WHATSAPP_SEND_MESSAGE"
    parameters: { "to": "person name or phone number", "message": "message content" }
    TRIGGER WORDS: whatsapp, what's app, send on whatsapp, whatsapp [person]

11. iMESSAGE — Send Message
    toolkitSlug: "imessage"
    actionSlug: "IMESSAGE_SEND_MESSAGE"
    parameters: { "to": "person name or phone number", "message": "message content" }
    TRIGGER WORDS: imessage, i message, text, text [person], send a text, iMessage [person]

═══════════════════════════════════════════
RESPONSE FORMAT — JSON only
═══════════════════════════════════════════
{
  "toolkitSlug": "string",
  "actionSlug": "string",
  "displayName": "human-readable name (e.g. 'Slack Message', 'Send Email', 'Create Event')",
  "description": "brief summary of what will be done",
  "parameters": { ... },
  "confidence": 0.0-1.0,
  "contactsResolved": true/false
}

Set "contactsResolved": true ONLY when you matched a name to a real ID or email from the connected services context provided below. If no context is provided or you couldn't match, set it to false.

═══════════════════════════════════════════
CRITICAL RULES — Follow these strictly
═══════════════════════════════════════════
1. "message", "msg", "DM", "tell [person] on Slack" → ALWAYS use SLACK, never Gmail
2. "email", "mail", "e-mail" → use GMAIL
3. "text", "text [person]", "iMessage" → use iMESSAGE
4. "whatsapp [person]" → use WHATSAPP
5. Generic "send a message to [person]" with NO platform specified → use SLACK (default messaging)
6. "message on [platform]" → use that platform
7. For names without email addresses, put the name as-is in the recipient field
8. Set confidence lower (0.3-0.6) if key parameters are missing
9. If the user mentions a platform name, ALWAYS use that platform even if they also say "message" or "send"
10. NEVER invent or assume parameter values. If the user did NOT specify a recipient, channel, message body, or other parameter, set it to "" (empty string). Do NOT fill in placeholders like "#general", "Your message here", etc.
11. Only include values the user EXPLICITLY stated in their voice command`

const FEW_SHOT_EXAMPLES = [
  {
    role: 'user' as const,
    content: 'send a message to John on Slack saying the deploy is done',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      toolkitSlug: 'slack',
      actionSlug: 'SLACK_SEND_MESSAGE',
      displayName: 'Slack Message',
      description: 'Send a Slack message to John about the deploy',
      parameters: { channel: 'John', text: 'The deploy is done' },
      confidence: 0.95,
    }),
  },
  {
    role: 'user' as const,
    content: 'email Sarah about the meeting tomorrow',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      toolkitSlug: 'gmail',
      actionSlug: 'GMAIL_SEND_EMAIL',
      displayName: 'Send Email',
      description: 'Send an email to Sarah about tomorrow\'s meeting',
      parameters: {
        recipient_email: 'Sarah',
        subject: 'Meeting Tomorrow',
        body: 'Hi Sarah, just wanted to reach out about the meeting tomorrow.',
      },
      confidence: 0.9,
    }),
  },
  {
    role: 'user' as const,
    content: 'message the team on slug that the release is delayed',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      toolkitSlug: 'slack',
      actionSlug: 'SLACK_SEND_MESSAGE',
      displayName: 'Slack Message',
      description: 'Send a Slack message to the team about the release delay',
      parameters: { channel: 'team', text: 'The release is delayed' },
      confidence: 0.9,
    }),
  },
  {
    role: 'user' as const,
    content: 'text mom that I\'ll be late for dinner',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      toolkitSlug: 'imessage',
      actionSlug: 'IMESSAGE_SEND_MESSAGE',
      displayName: 'iMessage',
      description: 'Send an iMessage to mom about being late for dinner',
      parameters: { to: 'mom', message: "I'll be late for dinner" },
      confidence: 0.9,
    }),
  },
  {
    role: 'user' as const,
    content: 'schedule a meeting with the design team tomorrow at 2 PM',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      toolkitSlug: 'googlecalendar',
      actionSlug: 'GOOGLECALENDAR_CREATE_EVENT',
      displayName: 'Create Event',
      description: 'Schedule a meeting with the design team tomorrow at 2 PM',
      parameters: {
        title: 'Meeting with Design Team',
        description: 'Meeting with the design team',
        start_time: 'tomorrow at 2 PM',
        end_time: 'tomorrow at 3 PM',
      },
      confidence: 0.85,
    }),
  },
  {
    role: 'user' as const,
    content: 'send a message on Slack',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      toolkitSlug: 'slack',
      actionSlug: 'SLACK_SEND_MESSAGE',
      displayName: 'Slack Message',
      description: 'Send a Slack message',
      parameters: { channel: '', text: '' },
      confidence: 0.4,
    }),
  },
  {
    role: 'user' as const,
    content: 'send an email',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      toolkitSlug: 'gmail',
      actionSlug: 'GMAIL_SEND_EMAIL',
      displayName: 'Send Email',
      description: 'Send an email',
      parameters: { recipient_email: '', subject: '', body: '' },
      confidence: 0.3,
      contactsResolved: false,
    }),
  },
]

// Few-shot example showing context-aware resolution
const CONTEXT_AWARE_EXAMPLES = [
  {
    role: 'user' as const,
    content: 'send a message to shaheen on slack saying hi',
  },
  {
    role: 'assistant' as const,
    content: JSON.stringify({
      toolkitSlug: 'slack',
      actionSlug: 'SLACK_SEND_MESSAGE',
      displayName: 'Slack Message',
      description: 'Send a Slack message to Shaheen saying hi',
      parameters: { channel: 'U07EXAMPLE1', text: 'hi' },
      confidence: 0.98,
      contactsResolved: true,
    }),
  },
]

/**
 * Build a dynamic context block to inject into the system prompt.
 * Lists connected services, Slack members/channels, Gmail contacts
 * so the LLM can resolve names to real IDs/emails.
 */
function buildContextBlock(context: ActionContext): string {
  const lines: string[] = [
    '',
    '═══════════════════════════════════════════',
    'CONTACT RESOLUTION — READ THIS CAREFULLY',
    '═══════════════════════════════════════════',
    '',
    'The user will say names like "Sahin", "John", "Shaheen", etc.',
    'You MUST resolve these to the actual Slack user ID or email address.',
    'Speech-to-text may mangle names: "Shaheen" = "Sahin", "Allure" = "Oliur".',
    'Match the CLOSEST name from the lists below even if spelling differs.',
    '',
    `Connected services: ${context.connectedToolkits.join(', ') || 'none'}`,
  ]

  if (context.slack?.members.length) {
    lines.push('')
    lines.push('SLACK MEMBER DIRECTORY:')
    lines.push('When the user mentions a person for Slack, find the best match below')
    lines.push('and put the ID (starting with U) in the "channel" field. NEVER put a name.')
    lines.push('')
    for (const m of context.slack.members) {
      lines.push(`  ${m.name} | username: ${m.username} | ID: ${m.id}`)
    }
  }

  if (context.slack?.channels.length) {
    lines.push('')
    lines.push('SLACK CHANNELS:')
    lines.push('When the user mentions a channel, put the ID (starting with C) in the "channel" field.')
    lines.push('')
    for (const ch of context.slack.channels) {
      lines.push(`  #${ch.name} | ID: ${ch.id}`)
    }
  }

  if (context.gmail?.contacts.length) {
    lines.push('')
    lines.push('GMAIL CONTACTS:')
    lines.push('Use the email address in the "recipient_email" field, NOT the name.')
    lines.push('')
    for (const c of context.gmail.contacts) {
      lines.push(`  ${c.name} | email: ${c.email}`)
    }
  }

  lines.push('')
  lines.push('RULES:')
  lines.push('1. For Slack: "channel" MUST be a Slack ID like U095WT9CE8H or C01234567. NEVER a name.')
  lines.push('2. For Gmail: "recipient_email" MUST be an email address. NEVER a name.')
  lines.push('3. If you matched a name to an ID/email above, set "contactsResolved": true.')
  lines.push('4. If you cannot find a match, put the spoken name and set "contactsResolved": false.')

  return lines.join('\n')
}

export async function parseActionCommand(
  transcript: string,
  context?: ActionContext,
): Promise<ParsedAction> {
  // Build system prompt — append context if available
  let systemPrompt = PARSER_SYSTEM_PROMPT
  if (context && context.connectedToolkits.length > 0) {
    systemPrompt += buildContextBlock(context)
  }

  // Use context-aware few-shot examples when context is available
  const examples = context?.connectedToolkits.length
    ? [...FEW_SHOT_EXAMPLES, ...CONTEXT_AWARE_EXAMPLES]
    : FEW_SHOT_EXAMPLES

  const result = await groqChatCompletion(
    [
      { role: 'system', content: systemPrompt },
      ...examples,
      { role: 'user', content: transcript },
    ],
    {
      temperature: 0.1,
      responseFormat: { type: 'json_object' },
    },
  )

  const parsed = JSON.parse(result)

  return {
    id: randomUUID(),
    toolkitSlug: parsed.toolkitSlug || '',
    actionSlug: parsed.actionSlug || '',
    displayName: parsed.displayName || 'Unknown Action',
    description: parsed.description || '',
    parameters: parsed.parameters || {},
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.5,
    originalTranscript: transcript,
    contactsResolved: parsed.contactsResolved === true,
  }
}
