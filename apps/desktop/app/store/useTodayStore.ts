import { create } from 'zustand'
import { useAuthStore } from './useAuthStore'

export type TodayEntry = {
  id: string
  date: string // YYYY-MM-DD format
  content: string // Markdown content
  user_id: string
  created_at: string
  updated_at: string
}

interface TodayStore {
  entries: TodayEntry[]
  currentEntry: TodayEntry | null
  loadEntries: () => Promise<void>
  getTodayEntry: () => Promise<TodayEntry | null>
  getEntryByDate: (date: string) => Promise<TodayEntry | null>
  createOrUpdateToday: (content: string, date?: string) => Promise<void>
  deleteEntry: (id: string) => Promise<void>
}

export const useTodayStore = create<TodayStore>((set, get) => ({
  entries: [],
  currentEntry: null,

  loadEntries: async () => {
    try {
      const entries = await window.api.today.getAll()
      set({ entries })
    } catch (error) {
      console.error('Failed to load today entries from database:', error)
    }
  },

  getTodayEntry: async () => {
    const { user } = useAuthStore.getState()
    if (!user) {
      console.error('Cannot get today entry without a logged-in user.')
      return null
    }

    try {
      const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const entry = await window.api.today.getByDate(today, user.id)
      set({ currentEntry: entry })
      return entry
    } catch (error) {
      console.error('Failed to get today entry:', error)
      return null
    }
  },

  getEntryByDate: async (date: string) => {
    const { user } = useAuthStore.getState()
    if (!user) {
      console.error('Cannot get entry without a logged-in user.')
      return null
    }

    try {
      const entry = await window.api.today.getByDate(date, user.id)
      set({ currentEntry: entry })
      return entry
    } catch (error) {
      console.error('Failed to get entry by date:', error)
      return null
    }
  },

  createOrUpdateToday: async (content: string, date?: string) => {
    const { user } = useAuthStore.getState()
    if (!user) {
      console.error(
        'Cannot create/update today entry without a logged-in user.',
      )
      return
    }

    try {
      const targetDate = date || new Date().toISOString().split('T')[0] // YYYY-MM-DD
      const entry = await window.api.today.createOrUpdate({
        date: targetDate,
        content: content.trim(),
        user_id: user.id,
      })
      set({ currentEntry: entry })
      // Reload all entries to update the list
      get().loadEntries()
    } catch (error) {
      console.error('Failed to create/update today entry:', error)
    }
  },

  deleteEntry: async (id: string) => {
    try {
      await window.api.today.delete(id)
      set(state => ({
        entries: state.entries.filter(entry => entry.id !== id),
        currentEntry: state.currentEntry?.id === id ? null : state.currentEntry,
      }))
    } catch (error) {
      console.error('Failed to delete today entry:', error)
    }
  },
}))
