import { useEffect, useState, useRef } from 'react'
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Link,
  Send,
  FileText,
  Calendar,
} from 'lucide-react'
import type {
  ActionState,
  ActionPhase,
  ParsedAction,
  DisambiguationRequest,
} from '@/lib/types/action'
import SlackIcon from '../icons/SlackIcon'
import GmailIcon from '../icons/GmailIcon'
import LinearIcon from '../icons/LinearIcon'
import GitHubIcon from '../icons/GitHubIcon'
import XIcon from '../icons/XIcon'
import DiscordIcon from '../icons/DiscordIcon'
import NotionIcon from '../icons/NotionIcon'
import IMessageIcon from '../icons/IMessageIcon'

const SOURCE_LABELS: Record<string, string> = {
  gmail: 'Gmail',
  slack: 'Slack',
  linear: 'Linear',
  github: 'GitHub',
  twitter: 'X',
  discord: 'Discord',
  notion: 'Notion',
  googlecalendar: 'Calendar',
  whatsapp: 'WhatsApp',
  imessage: 'iMessage',
}

const PARAM_LABELS: Record<string, string> = {
  channel: 'To',
  text: 'Message',
  recipient_email: 'To',
  subject: 'Subject',
  body: 'Message',
  title: 'Title',
  description: 'Description',
  owner: 'Owner',
  repo: 'Repository',
  content: 'Content',
  to: 'To',
  message: 'Message',
  start_time: 'Start',
  end_time: 'End',
}

const PARAM_PLACEHOLDERS: Record<string, string> = {
  channel: 'Person or #channel',
  text: 'Enter message...',
  recipient_email: 'Name or email address',
  subject: 'Email subject',
  body: 'Email body...',
  title: 'Enter title...',
  description: 'Enter description...',
  owner: 'Repository owner',
  repo: 'Repository name',
  content: 'Enter content...',
  to: 'Name or number',
  message: 'Enter message...',
  start_time: 'e.g. tomorrow at 2 PM',
  end_time: 'e.g. tomorrow at 3 PM',
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

function ToolIcon({ slug }: { slug: string }) {
  switch (slug) {
    case 'gmail':
      return <div className="w-5 h-5"><GmailIcon /></div>
    case 'slack':
      return <div className="w-5 h-5"><SlackIcon /></div>
    case 'linear':
      return <div className="w-5 h-5"><LinearIcon /></div>
    case 'github':
      return <GitHubIcon className="w-5 h-5" />
    case 'twitter':
      return <XIcon className="w-5 h-5" />
    case 'discord':
      return <DiscordIcon className="w-5 h-5" />
    case 'notion':
      return <div className="w-5 h-5"><NotionIcon /></div>
    case 'googlecalendar':
      return <Calendar className="w-5 h-5" />
    case 'whatsapp':
      return <WhatsAppIcon className="w-5 h-5" />
    case 'imessage':
      return <IMessageIcon className="w-5 h-5" />
    default:
      return <FileText className="w-5 h-5" />
  }
}

const SLACK_ID_PATTERN = /^[UC][A-Z0-9]{8,}$/
const EMAIL_PATTERN = /.+@.+\..+/

/**
 * Check if a parameter value looks unresolved (raw name instead of ID/email).
 * Returns a warning message or null.
 */
function getUnresolvedWarning(key: string, value: string, toolkitSlug?: string): string | null {
  if (!value) return null

  if (toolkitSlug === 'slack' && (key === 'channel')) {
    if (!SLACK_ID_PATTERN.test(value) && !value.startsWith('#')) {
      return `"${value}" may not be a valid Slack ID. Use a user ID (e.g. U07...) or #channel.`
    }
  }

  if (toolkitSlug === 'gmail' && key === 'recipient_email') {
    if (!EMAIL_PATTERN.test(value)) {
      return `"${value}" is not a valid email address.`
    }
  }

  return null
}

export default function ActionPanelWindow() {
  const [phase, setPhase] = useState<ActionPhase | null>(null)
  const [action, setAction] = useState<ParsedAction | null>(null)
  const [disambiguation, setDisambiguation] =
    useState<DisambiguationRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toolkitSlug, setToolkitSlug] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [editedParams, setEditedParams] = useState<Record<string, string>>({})

  // Sync editedParams when action changes (new action received)
  useEffect(() => {
    if (action?.parameters) {
      const initial: Record<string, string> = {}
      for (const [key, value] of Object.entries(action.parameters)) {
        initial[key] = value != null ? String(value) : ''
      }
      setEditedParams(initial)
    }
  }, [action?.id])

  useEffect(() => {
    const unsub = window.api.on(
      'action-state-update',
      (state: ActionState) => {
        console.log('[ActionPanel Renderer] Received state:', state.phase)
        setPhase(state.phase)
        setAction(state.action)
        setDisambiguation(state.disambiguation)
        setError(state.error)
        setToolkitSlug(state.toolkitSlug)
      },
    )

    console.log('[ActionPanel Renderer] Sending action-panel-ready signal')
    window.api.send('action-panel-ready')

    return () => {
      unsub?.()
    }
  }, [])

  useEffect(() => {
    if (phase === 'success') {
      const timer = setTimeout(() => {
        window.api.action.cancel(action?.id || '')
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [phase, action?.id])

  const handleConfirm = () => {
    if (action) window.api.action.confirm(action.id, editedParams)
  }

  const handleCancel = () => {
    if (action) window.api.action.cancel(action.id)
  }

  const handleDisambiguate = (field: string, value: string) => {
    if (action) window.api.action.disambiguate(action.id, field, value)
  }

  const handleConnectTool = () => {
    const slug = toolkitSlug || action?.toolkitSlug
    console.log('[ActionPanel] Connect tool clicked, toolkitSlug:', slug)
    if (slug) {
      setConnecting(true)
      window.api.action.connectTool(slug)
    }
  }

  const handleDismiss = () => {
    if (action) window.api.action.cancel(action.id)
  }

  // Derive effective toolkit slug — use action's slug as fallback
  const effectiveSlug = toolkitSlug || action?.toolkitSlug || ''

  const renderContent = () => {
    switch (phase) {
      case 'detecting':
      case 'parsing':
      case 'checking_connection':
        return (
          <div className="flex flex-col items-center py-10 text-center">
            <Loader2 className="w-6 h-6 text-[#979899] animate-spin mb-3" />
            <p className="text-sm text-[#F4F5F8]">
              {phase === 'detecting' ? 'Processing your command...' : 'Analyzing your command...'}
            </p>
            {action && (
              <p className="text-xs text-[#979899] mt-1">
                {action.originalTranscript}
              </p>
            )}
          </div>
        )

      case 'resolving_contacts':
        return (
          <div className="flex flex-col items-center py-10 text-center">
            <Loader2 className="w-6 h-6 text-[#979899] animate-spin mb-3" />
            <p className="text-sm text-[#F4F5F8]">Looking up contacts...</p>
            {action && (
              <p className="text-xs text-[#979899] mt-1">
                Searching {SOURCE_LABELS[action.toolkitSlug] || action.toolkitSlug} for matching contacts
              </p>
            )}
          </div>
        )

      case 'needs_connection':
        return (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#2A2B2E] flex items-center justify-center mb-4 text-[#979899]">
              <ToolIcon slug={effectiveSlug} />
            </div>
            <p className="text-sm text-[#F4F5F8] mb-2">
              {SOURCE_LABELS[effectiveSlug] || effectiveSlug} is not connected
            </p>
            <p className="text-xs text-[#979899] mb-4 px-4">
              {connecting
                ? 'Opening browser to connect...'
                : `Connect ${SOURCE_LABELS[effectiveSlug] || effectiveSlug} to execute this action.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-[#2A2B2E] text-[#979899] rounded-lg text-xs hover:bg-[#3a3a3b] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConnectTool}
                disabled={connecting}
                className={`px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  connecting
                    ? 'bg-[#F4F5F8]/5 text-[#979899]'
                    : 'bg-[#F4F5F8]/10 text-[#F4F5F8] hover:bg-[#F4F5F8]/20'
                }`}
              >
                {connecting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Link className="w-3 h-3" />
                )}
                {connecting
                  ? 'Connecting...'
                  : `Connect ${SOURCE_LABELS[effectiveSlug] || effectiveSlug}`}
              </button>
            </div>
          </div>
        )

      case 'confirming': {
        const paramKeys = action?.parameters ? Object.keys(action.parameters) : []
        const hasEmptyParams = paramKeys.some(k => !editedParams[k])
        return (
          <div className="space-y-4">
            <div className="bg-[#2A2B2E] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="text-[#979899]">
                  <ToolIcon slug={action?.toolkitSlug || ''} />
                </div>
                <p className="text-sm text-[#F4F5F8] font-medium">
                  {action?.displayName}
                </p>
              </div>
              <p className="text-xs text-[#979899]">{action?.description}</p>
            </div>

            {paramKeys.length > 0 && (
              <div className="space-y-3">
                {paramKeys.map(key => {
                  const warning = getUnresolvedWarning(key, editedParams[key] || '', action?.toolkitSlug)
                  return (
                    <div key={key}>
                      <label className="text-[10px] font-medium text-[#979899]/60 tracking-wider uppercase block mb-1">
                        {PARAM_LABELS[key] || key}
                      </label>
                      {key === 'body' || key === 'description' || key === 'content' ? (
                        <textarea
                          value={editedParams[key] || ''}
                          onChange={e => setEditedParams(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={PARAM_PLACEHOLDERS[key] || `Enter ${key}...`}
                          rows={3}
                          className="w-full bg-[#2A2B2E] text-xs text-[#F4F5F8] rounded-lg px-3 py-2 outline-none border border-[#3a3a3b] focus:border-[#979899] transition-colors resize-none placeholder:text-[#979899]/40"
                        />
                      ) : (
                        <input
                          type="text"
                          value={editedParams[key] || ''}
                          onChange={e => setEditedParams(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={PARAM_PLACEHOLDERS[key] || `Enter ${key}...`}
                          className={`w-full bg-[#2A2B2E] text-xs text-[#F4F5F8] rounded-lg px-3 py-2 outline-none border transition-colors placeholder:text-[#979899]/40 ${
                            warning ? 'border-yellow-500/50' : 'border-[#3a3a3b] focus:border-[#979899]'
                          }`}
                        />
                      )}
                      {warning && (
                        <div className="flex items-start gap-1.5 mt-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-yellow-500/80">{warning}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2.5 bg-[#2A2B2E] text-[#979899] rounded-lg text-xs hover:bg-[#3a3a3b] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={hasEmptyParams}
                className={`flex-1 px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  hasEmptyParams
                    ? 'bg-[#F4F5F8]/5 text-[#979899]/50 cursor-not-allowed'
                    : 'bg-[#F4F5F8]/10 text-[#F4F5F8] hover:bg-[#F4F5F8]/20'
                }`}
              >
                <Send className="w-3 h-3" />
                Confirm
              </button>
            </div>
          </div>
        )
      }

      case 'disambiguating':
        return (
          <div className="space-y-4">
            <p className="text-sm text-[#F4F5F8]">
              {disambiguation?.question}
            </p>
            <div className="space-y-2">
              {disambiguation?.options.map(option => (
                <button
                  key={option.value}
                  onClick={() =>
                    handleDisambiguate(disambiguation!.field, option.value)
                  }
                  className="w-full px-4 py-3 bg-[#2A2B2E] text-[#F4F5F8] rounded-lg text-xs hover:bg-[#3a3a3b] transition-colors cursor-pointer text-left"
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleCancel}
              className="w-full px-3 py-2 text-[#979899] text-xs hover:text-[#F4F5F8] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )

      case 'executing':
        return (
          <div className="flex flex-col items-center py-10 text-center">
            <Loader2 className="w-6 h-6 text-[#979899] animate-spin mb-3" />
            <p className="text-sm text-[#F4F5F8]">Executing action...</p>
            <p className="text-xs text-[#979899] mt-1">
              {action?.displayName}
            </p>
          </div>
        )

      case 'success':
        return (
          <div className="flex flex-col items-center py-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-3" />
            <p className="text-sm text-[#F4F5F8] mb-1">Action completed</p>
            <p className="text-xs text-[#979899]">{action?.description}</p>
          </div>
        )

      case 'error':
        return (
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
            <p className="text-sm text-[#F4F5F8] mb-1">Action failed</p>
            <p className="text-xs text-red-400/80 mb-4 px-2">{error}</p>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-[#2A2B2E] text-[#979899] rounded-lg text-xs hover:bg-[#3a3a3b] transition-colors cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="w-full h-full bg-transparent select-none">
      <div className="bg-[#1C1E21] rounded-xl border border-[#2A2B2E] overflow-hidden shadow-2xl">
        {/* Header — draggable */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-[#2A2B2E]"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <h2 className="text-sm font-medium text-[#F4F5F8]">Orbit Action</h2>
          <button
            onClick={
              phase === 'success' || phase === 'error'
                ? handleDismiss
                : handleCancel
            }
            className="p-1 hover:bg-[#2A2B2E] rounded transition-colors cursor-pointer outline-none border-none bg-transparent"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <X className="w-4 h-4 text-[#979899]" />
          </button>
        </div>

        {/* Content */}
        <div
          className="px-4 py-4 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 48px)' }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
