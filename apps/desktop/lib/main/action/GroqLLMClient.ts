const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface GroqOptions {
  model?: string
  temperature?: number
  responseFormat?: { type: 'json_object' }
}

export async function groqChatCompletion(
  messages: ChatMessage[],
  options?: GroqOptions,
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const body: Record<string, any> = {
    model: options?.model || 'llama-3.3-70b-versatile',
    messages,
    temperature: options?.temperature ?? 0.3,
  }

  if (options?.responseFormat) {
    body.response_format = options.responseFormat
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Groq API error: ${response.status} ${errText.slice(0, 200)}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}
