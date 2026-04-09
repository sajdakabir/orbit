import { useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  Inbox,
  RefreshCw,
  ExternalLink,
  Loader2,
  ChevronRight,
  Github,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
} from 'lucide-react'
import { useMainStore } from '../../../store/useMainStore'
import { useInboxStore, type InboxItem } from '../../../store/useInboxStore'
import LinearIcon from '../../icons/LinearIcon'

const SOURCE_LABELS: Record<string, string> = {
  linear: 'Linear',
  gmail: 'Gmail',
  github: 'GitHub',
  slack: 'Slack',
  googlecalendar: 'Calendar',
  notion: 'Notion',
}

const SOURCE_ICONS: Record<string, ReactNode> = {
  github: <Github className="w-4 h-4" />,
  gmail: <Mail className="w-4 h-4" />,
  slack: <MessageSquare className="w-4 h-4" />,
  googlecalendar: <Calendar className="w-4 h-4" />,
  notion: <FileText className="w-4 h-4" />,
}

function SourceIcon({ source }: { source: string }) {
  const icon = SOURCE_ICONS[source]
  if (source === 'linear') {
    return (
      <div className="w-5 h-5 flex items-center justify-center text-[#5E6AD2] shrink-0">
        <LinearIcon />
      </div>
    )
  }
  if (icon) {
    return <div className="w-5 h-5 flex items-center justify-center text-[#979899] shrink-0">{icon}</div>
  }
  return (
    <div className="w-5 h-5 rounded shrink-0 bg-[#3a3a3b] flex items-center justify-center text-[10px] font-bold text-[#979899]">
      {(SOURCE_LABELS[source] || source).charAt(0).toUpperCase()}
    </div>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'TODAY'
  if (date.toDateString() === yesterday.toDateString()) return 'YESTERDAY'

  return date
    .toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
    .toUpperCase()
}

function timeAgo(dateString: string): string {
  const now = Date.now()
  const then = new Date(dateString).getTime()
  const diffMs = now - then

  if (isNaN(then) || diffMs < 0) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }) || ''
  }

  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`

  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function groupItemsByDate(items: InboxItem[]): Record<string, InboxItem[]> {
  const groups: Record<string, InboxItem[]> = {}
  for (const item of items) {
    const key = formatDate(item.timestamp)
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

export default function InboxContent() {
  const { setCurrentPage } = useMainStore()
  const {
    items,
    sources,
    loading,
    refreshing,
    error,
    fetchInbox,
    refreshInbox,
  } = useInboxStore()
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchInbox()
  }, [fetchInbox])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => refreshInbox(), 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshInbox])

  const filteredItems = activeFilter
    ? items.filter(item => item.source === activeFilter)
    : items

  const grouped = groupItemsByDate(filteredItems)
  const hasConnections = sources.length > 0
  const hasItems = items.length > 0
  const failedSources = sources.filter(s => s.error)

  const handleOpenExternal = useCallback((url?: string) => {
    if (url) {
      window.api['web-open-url'](url)
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div
        className="w-full px-24 max-h-160 overflow-y-auto relative"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <h1 className="text-base font-medium text-[#979899]">Inbox</h1>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 text-[#979899] animate-spin" />
        </div>
      </div>
    )
  }

  // No connections state
  if (!hasConnections && !error) {
    return (
      <div
        className="w-full px-24 max-h-160 overflow-y-auto relative"
        style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
      >
        <div className="flex items-center gap-2 mb-5">
          <h1 className="text-base font-medium text-[#979899]">Inbox</h1>
        </div>
        <div className="bg-[#2A2B2E] rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#3a3a3b] flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-[#979899]" />
          </div>
          <p className="text-sm text-[#979899] mb-1">No items yet</p>
          <p className="text-xs text-[#979899]/60 mb-4 max-w-xs">
            Connect your tools in the Library to see updates from Gmail, GitHub,
            Linear, and more right here.
          </p>
          <button
            onClick={() => setCurrentPage('library')}
            className="text-xs text-[#F4F5F8]/80 hover:text-[#F4F5F8] underline underline-offset-2 transition-colors cursor-pointer"
          >
            Go to Library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="w-full px-24 max-h-160 overflow-y-auto relative"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-base font-medium text-[#979899]">Inbox</h1>
        <button
          onClick={refreshInbox}
          disabled={refreshing}
          className="p-1.5 hover:bg-[#3a3a3b] rounded transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 text-[#979899] ${refreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Source filter pills */}
      {sources.length > 1 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              activeFilter === null
                ? 'bg-[#F4F5F8]/10 text-[#F4F5F8]'
                : 'bg-[#2A2B2E] text-[#979899] hover:bg-[#3a3a3b]'
            }`}
          >
            All
          </button>
          {sources
            .filter(s => !s.error)
            .map(s => (
              <button
                key={s.source}
                onClick={() =>
                  setActiveFilter(
                    activeFilter === s.source ? null : s.source,
                  )
                }
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeFilter === s.source
                    ? 'bg-[#F4F5F8]/10 text-[#F4F5F8]'
                    : 'bg-[#2A2B2E] text-[#979899] hover:bg-[#3a3a3b]'
                }`}
              >
                <SourceIcon source={s.source} />
                {SOURCE_LABELS[s.source] || s.source}
                <span className="text-[#979899]/60">{s.itemCount}</span>
              </button>
            ))}
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-red-400">{error}</p>
          <button
            onClick={fetchInbox}
            className="text-xs text-red-300 underline mt-1 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Partial failure banner */}
      {failedSources.length > 0 && hasItems && (
        <div className="bg-yellow-900/10 border border-yellow-800/20 rounded-lg px-4 py-2.5 mb-4">
          <p className="text-xs text-yellow-500/80">
            Could not load data from{' '}
            {failedSources
              .map(s => SOURCE_LABELS[s.source] || s.source)
              .join(', ')}
          </p>
        </div>
      )}

      {/* Empty items state */}
      {!hasItems && !error && (
        <div className="bg-[#2A2B2E] rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#3a3a3b] flex items-center justify-center mb-4">
            <Inbox className="w-6 h-6 text-[#979899]" />
          </div>
          <p className="text-sm text-[#979899] mb-1">All caught up</p>
          <p className="text-xs text-[#979899]/60 max-w-xs">
            No new items from your connected tools.
          </p>
        </div>
      )}

      {/* Items timeline */}
      {hasItems && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([dateLabel, dateItems]) => (
            <div key={dateLabel}>
              <p className="text-[11px] font-medium text-[#979899]/60 tracking-wider mb-2">
                {dateLabel}
              </p>
              <div className="bg-[#2A2B2E] rounded-xl overflow-hidden">
                {dateItems.map((item, idx) => {
                  const isExpanded = expandedId === item.id

                  return (
                    <div key={item.id}>
                      {idx > 0 && <div className="h-px bg-[#3a3a3b]" />}

                      {/* Collapsed row — icon + title + time */}
                      <div
                        className="px-4 py-3 flex items-center gap-3 hover:bg-[#333436] cursor-pointer transition-colors"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : item.id)
                        }
                      >
                        <SourceIcon source={item.source} />
                        <p className="flex-1 text-sm text-[#F4F5F8] truncate">
                          {item.title}
                        </p>
                        <span className="text-[11px] text-[#979899]/60 flex-shrink-0">
                          {timeAgo(item.timestamp)}
                        </span>
                        <ChevronRight
                          className={`w-3.5 h-3.5 text-[#979899]/40 flex-shrink-0 transition-transform duration-150 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="px-4 pb-4 pt-0">
                          <div className="ml-8 bg-[#1C1E21] rounded-lg p-4 space-y-3">
                            {/* Description */}
                            {item.description && (
                              <p className="text-xs text-[#979899] leading-relaxed whitespace-pre-wrap">
                                {item.description}
                              </p>
                            )}

                            {/* Metadata tags */}
                            {item.metadata &&
                              Object.keys(item.metadata).length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {Object.entries(item.metadata)
                                    .filter(([, v]) => v != null && v !== '')
                                    .map(([key, value]) => (
                                      <span
                                        key={key}
                                        className="px-2 py-0.5 rounded bg-[#2A2B2E] text-[10px] text-[#979899]"
                                      >
                                        {key}: {String(value)}
                                      </span>
                                    ))}
                                </div>
                              )}

                            {/* Open in app button */}
                            {item.url && (
                              <button
                                onClick={e => {
                                  e.stopPropagation()
                                  handleOpenExternal(item.url)
                                }}
                                className="flex items-center gap-1.5 text-xs text-[#F4F5F8]/70 hover:text-[#F4F5F8] transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3 h-3" />
                                Open in{' '}
                                {SOURCE_LABELS[item.source] || item.source}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
