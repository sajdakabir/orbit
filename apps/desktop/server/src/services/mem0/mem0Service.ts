import { MemoryClient, type Memory } from 'mem0ai'
import * as dotenv from 'dotenv'

dotenv.config()

export type Mem0SearchResult = Memory

export interface StyleMemoryContext {
  memories: Mem0SearchResult[]
  formattedContext: string
}

class Mem0Service {
  private readonly _client: InstanceType<typeof MemoryClient> | null
  private readonly _isAvailable: boolean

  constructor() {
    const apiKey = process.env.MEM0_API_KEY
    if (!apiKey) {
      console.log('[Mem0Service] MEM0_API_KEY not set - style memory disabled')
      this._client = null
      this._isAvailable = false
      return
    }

    try {
      this._client = new MemoryClient({ apiKey })
      this._isAvailable = true
      console.log('[Mem0Service] Initialized successfully')
    } catch (error) {
      console.error('[Mem0Service] Failed to initialize:', error)
      this._client = null
      this._isAvailable = false
    }
  }

  get isAvailable(): boolean {
    return this._isAvailable
  }

  /**
   * Search for user's style-related memories.
   * Returns pre-formatted context for LLM prompt injection.
   * Times out after a configurable duration to avoid blocking the pipeline.
   */
  async searchUserStyle(
    userId: string,
    transcript: string,
    timeoutMs: number = 1500,
  ): Promise<StyleMemoryContext> {
    const emptyResult: StyleMemoryContext = {
      memories: [],
      formattedContext: '',
    }

    if (!this._client || !this._isAvailable) {
      return emptyResult
    }

    try {
      const searchPromise = this._client.search(transcript, {
        filters: {
          AND: [{ user_id: userId }],
        },
        top_k: 5,
      })

      const results = await Promise.race([
        searchPromise,
        new Promise<null>((resolve) =>
          setTimeout(() => resolve(null), timeoutMs),
        ),
      ])

      if (!results || !Array.isArray(results)) {
        return emptyResult
      }

      const memories = results
      const formattedContext = this.formatMemoriesForPrompt(memories)

      console.log(
        `[Mem0Service] Found ${memories.length} style memories for user ${userId}`,
      )

      return { memories, formattedContext }
    } catch (error) {
      console.error('[Mem0Service] Search failed:', error)
      return emptyResult
    }
  }

  /**
   * Store a transcription interaction in mem0 to build the user's style profile.
   * This should be called as fire-and-forget (don't await in the response path).
   */
  async storeTranscriptionInteraction(
    userId: string,
    rawTranscript: string,
    adjustedTranscript: string,
    context?: { appName?: string; windowTitle?: string },
  ): Promise<void> {
    if (!this._client || !this._isAvailable) {
      return
    }

    try {
      const messages = [
        {
          role: 'user' as const,
          content: `I dictated the following (raw speech-to-text): "${rawTranscript}"`,
        },
        {
          role: 'assistant' as const,
          content: `Here is the polished version matching your style: "${adjustedTranscript}"`,
        },
      ]

      const metadata: Record<string, string> = {
        source: 'dictation_pipeline',
        type: 'style_learning',
      }
      if (context?.appName) metadata.app = context.appName
      if (context?.windowTitle) metadata.window = context.windowTitle

      await this._client.add(messages, {
        user_id: userId,
        metadata,
      })

      console.log(
        `[Mem0Service] Stored style interaction for user ${userId}`,
      )
    } catch (error) {
      console.error('[Mem0Service] Failed to store interaction:', error)
    }
  }

  private formatMemoriesForPrompt(memories: Mem0SearchResult[]): string {
    if (memories.length === 0) return ''

    const lines = memories
      .filter((m) => m.memory && (m.score ?? 0) > 0.3)
      .map((m) => `- ${m.memory}`)
      .join('\n')

    if (!lines) return ''

    return `\n## User Style Preferences (learned from past interactions):\n${lines}\n`
  }
}

export const mem0Service = new Mem0Service()
