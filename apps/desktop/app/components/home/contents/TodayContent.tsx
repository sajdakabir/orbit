import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useTodayStore } from '../../../store/useTodayStore'
import { ChevronLeft, ChevronRight, Loader2, ListFilter } from 'lucide-react'
import { StatusIndicator } from '../../ui/status-indicator'
import Editor, { defaultEditorContent } from '../../editor/editor'
import type { JSONContent } from 'novel'
import debounce from 'lodash.debounce'
import { Calendar } from '../../ui/calendar'

export default function TodayContent() {
  const {
    currentEntry,
    createOrUpdateToday,
    getEntryByDate,
    entries,
    loadEntries,
  } = useTodayStore()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [content, setContent] = useState<JSONContent>(defaultEditorContent)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [statusIndicator, setStatusIndicator] = useState<
    'success' | 'error' | null
  >(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [lastSavedContent, setLastSavedContent] = useState<JSONContent | null>(
    null,
  )
  const [showCalendar, setShowCalendar] = useState(false)
  const calendarRef = useRef<HTMLDivElement>(null)

  // Load all entries on mount so we can show dots on dates with content
  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  // Derive dates that have content from the entries list (skip empty ones)
  const datesWithContent = useMemo(() => {
    return entries
      .filter(entry => {
        try {
          const parsed = JSON.parse(entry.content)
          const hasText = parsed?.content?.some(
            (node: { content?: { text?: string }[] }) =>
              node.content?.some((child: { text?: string }) =>
                child.text?.trim(),
              ),
          )
          return !!hasText
        } catch {
          // Plain text content — treat non-empty as having content
          return !!entry.content?.trim()
        }
      })
      .map(entry => new Date(entry.date + 'T00:00:00'))
  }, [entries])

  const toLocalDateStr = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  const loadEntryForDate = useCallback(
    async (date: Date) => {
      setLoading(true)
      try {
        const dateStr = toLocalDateStr(date)
        const entry = await getEntryByDate(dateStr)
        if (entry) {
          try {
            const parsedContent = JSON.parse(entry.content)
            setContent(parsedContent)
            setLastSavedContent(parsedContent)
          } catch {
            // If content is plain text, wrap it
            const textContent: JSONContent = {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: entry.content }],
                },
              ],
            }
            setContent(textContent)
            setLastSavedContent(textContent)
          }
        } else {
          setContent(defaultEditorContent)
          setLastSavedContent(defaultEditorContent)
        }
      } catch (error) {
        console.error('Failed to load entry:', error)
        setStatusMessage('Failed to load entry')
        setStatusIndicator('error')
      } finally {
        setLoading(false)
      }
    },
    [getEntryByDate],
  )

  useEffect(() => {
    loadEntryForDate(selectedDate)
  }, [selectedDate, loadEntryForDate])

  const handlePreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const isToday = () => {
    const today = new Date()
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    )
  }

  const handleSave = useCallback(
    async (contentToSave: JSONContent) => {
      // Skip if content hasn't changed
      if (JSON.stringify(contentToSave) === JSON.stringify(lastSavedContent)) {
        return
      }

      setSaving(true)
      try {
        const dateStr = toLocalDateStr(selectedDate)
        const jsonString = JSON.stringify(contentToSave)
        await createOrUpdateToday(jsonString, dateStr)
        setLastSavedContent(contentToSave)
        setStatusMessage('Saved')
        setStatusIndicator('success')
      } catch (error) {
        console.error('Failed to save entry:', error)
        setStatusMessage('Failed to save')
        setStatusIndicator('error')
      } finally {
        setSaving(false)
      }
    },
    [lastSavedContent, selectedDate, createOrUpdateToday],
  )

  const handleContentChange = (newContent: JSONContent) => {
    setContent(newContent)
    debouncedSave(newContent)
  }

  const debouncedSave = useMemo(
    () =>
      debounce((newContent: JSONContent) => {
        handleSave(newContent)
      }, 2000),
    [handleSave],
  )

  const formatFullDate = () => {
    return selectedDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDayNumber = () => {
    return selectedDate.getDate()
  }

  const handleDateClick = () => {
    setShowCalendar(!showCalendar)
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setShowCalendar(false)
    }
  }

  // Click outside to close calendar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(event.target as Node)
      ) {
        setShowCalendar(false)
      }
    }

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCalendar])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSave.cancel()
    }
  }, [debouncedSave])

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-24 flex items-center justify-center h-160">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#979899] animate-spin" />
          <p className="text-sm text-[#979899]">Loading today's entry...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-24 h-160 overflow-y-auto">
      {/* Status Indicator */}
      <StatusIndicator
        status={statusIndicator}
        successMessage={statusMessage}
        errorMessage={statusMessage}
        onHide={() => setStatusIndicator(null)}
      />

      {/* Top Navigation Header */}
      <div className="flex items-center max-w-6xl mx-auto py-4 mb-6">
        <button
          onClick={() => setSelectedDate(new Date())}
          className="p-1 hover:bg-white/10 rounded mr-4"
        >
          <ListFilter className="w-4 h-4 text-white/60" />
        </button>

        <div className="flex items-center gap-3 relative">
          <h1
            className="text-lg font-medium text-white/90 cursor-pointer hover:text-white transition-colors min-w-48"
            onClick={handleDateClick}
          >
            {formatFullDate()}
          </h1>

          <button
            onClick={handlePreviousDay}
            className="p-1 hover:bg-white/10 rounded"
          >
            <ChevronLeft className="w-4 h-4 text-white/60 hover:text-white" />
          </button>

          {!isToday() && (
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-1 py-0.5 text-xs font-medium text-white/80 hover:text-white  rounded transition-colors"
            >
              Today
            </button>
          )}

          <button
            onClick={handleNextDay}
            className="p-1 hover:bg-white/10 rounded"
          >
            <ChevronRight className="w-4 h-4 text-white/60 hover:text-white" />
          </button>

          {showCalendar && (
            <div
              ref={calendarRef}
              className="absolute top-full left-0 mt-2 shadow-2xl z-100"
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                datesWithContent={datesWithContent}
                className="rounded-lg border bg-[#1C1E21]"
                initialFocus
              />
            </div>
          )}
        </div>
      </div>

      {/* Rich Text Editor */}
      <div className="mb-4 min-h-112.5">
        <Editor
          initialValue={content}
          onChange={handleContentChange}
          placeholder="Type / for commands or start writing..."
        />
      </div>

      {/* Status Info */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-white/40">
          {currentEntry && (
            <span>
              Last updated:{' '}
              {new Date(currentEntry.updated_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            </span>
          )}
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-xs text-white/60">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </div>
        )}
      </div>
    </div>
  )
}
