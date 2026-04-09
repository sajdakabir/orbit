import { create } from 'zustand'

export interface InboxItem {
  id: string
  title: string
  description: string
  source: string
  sourceId: string
  timestamp: string
  url?: string
  sourceLogo?: string
  metadata?: Record<string, any>
}

export interface InboxSourceStatus {
  source: string
  toolkitSlug: string
  logo: string
  itemCount: number
  error?: string
}

interface InboxStore {
  items: InboxItem[]
  sources: InboxSourceStatus[]
  loading: boolean
  refreshing: boolean
  error: string | null
  lastFetchedAt: string | null

  fetchInbox: () => Promise<void>
  refreshInbox: () => Promise<void>
  clearInbox: () => void
}

export const useInboxStore = create<InboxStore>((set, get) => ({
  items: [],
  sources: [],
  loading: false,
  refreshing: false,
  error: null,
  lastFetchedAt: null,

  fetchInbox: async () => {
    set({ loading: true, error: null })
    try {
      const result = await window.api.composio.fetchInbox()
      if (result.success) {
        set({
          items: result.items,
          sources: result.sources,
          lastFetchedAt: new Date().toISOString(),
        })
      } else {
        set({ error: result.error || 'Failed to fetch inbox' })
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch inbox',
      })
    } finally {
      set({ loading: false })
    }
  },

  refreshInbox: async () => {
    set({ refreshing: true, error: null })
    try {
      const result = await window.api.composio.fetchInbox()
      if (result.success) {
        set({
          items: result.items,
          sources: result.sources,
          lastFetchedAt: new Date().toISOString(),
        })
      } else {
        set({ error: result.error || 'Failed to refresh inbox' })
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to refresh inbox',
      })
    } finally {
      set({ refreshing: false })
    }
  },

  clearInbox: () => {
    set({ items: [], sources: [], error: null, lastFetchedAt: null })
  },
}))
