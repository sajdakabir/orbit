import { groqChatCompletion } from './GroqLLMClient'
import log from 'electron-log'

const DETECTION_SYSTEM_PROMPT = `You are a classifier for Orbit, a voice assistant. Determine if the user wants Orbit to PERFORM AN ACTION or is just DICTATING TEXT.

ACTION COMMAND (isAction: true) — User wants Orbit to do something on their behalf:
- Email: "send an email to John", "email Sarah about the meeting", "draft a mail to the team"
- Slack: "message the team on Slack", "send a Slack message to #general", "tell John on Slack"
- Linear: "create a Linear issue", "make a Linear ticket", "file a bug on Linear"
- GitHub: "create a GitHub issue", "file a bug on GitHub"
- Twitter/X: "post a tweet", "tweet this", "post on X"
- Discord: "send a message on Discord", "discord the team"
- Notion: "add a page in Notion", "create a Notion doc"
- Calendar: "schedule a meeting", "create an event", "add to my calendar"
- WhatsApp: "send a WhatsApp to mom", "whatsapp John"
- iMessage/Text: "text mom", "send an iMessage to John", "text John that I'm running late"
- Any request prefixed with "Hey Orbit" or "Orbit" is very likely an action command
- Action verbs directed at a service: send, email, message, create, post, notify, draft, file, tell, text, tweet, schedule, DM

VOICE TRANSCRIPTION ERRORS — These words may be misrecognized:
- "Slack" → "slug", "slap", "slacker"
- "Linear" → "liner", "lineair"
- "GitHub" → "git hub", "get hub"
- "WhatsApp" → "what's app", "whats up"
- "iMessage" → "i message", "eye message"
- "Discord" → "disk cord", "this cord"
- "Notion" → "no shun"

PLAIN DICTATION (isAction: false) — User is dictating text to type:
- Normal sentences, notes, conversational text
- No intent to use an external service
- Just describing things without commanding action

Respond with JSON only: {"isAction": true, "confidence": 0.95} or {"isAction": false, "confidence": 0.95}

When in doubt and the transcript mentions ANY tool name + an action verb, classify as ACTION COMMAND.`

export async function detectAction(
  transcript: string,
): Promise<{ isAction: boolean; confidence: number }> {
  try {
    log.info('[ActionDetector] Detecting action for transcript:', transcript)

    const result = await groqChatCompletion(
      [
        { role: 'system', content: DETECTION_SYSTEM_PROMPT },
        { role: 'user', content: transcript },
      ],
      {
        temperature: 0.1,
        responseFormat: { type: 'json_object' },
      },
    )

    log.info('[ActionDetector] Raw LLM response:', result)

    const parsed = JSON.parse(result)
    return {
      isAction: !!parsed.isAction,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
    }
  } catch (error) {
    log.error('[ActionDetector] Detection failed:', error)
    throw error
  }
}
