import React from 'react'
import { Copy, Trash, Dots } from '@mynaui/icons-react'
import type { Note } from '../../store/useNotesStore'
import type { JSONContent } from 'novel'

// Function to extract plain text from JSON content
function extractTextFromJSON(content: string): string {
  try {
    const jsonContent: JSONContent = JSON.parse(content)

    function extractTextFromNode(node: JSONContent): string {
      if (node.type === 'text') {
        return node.text || ''
      }

      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractTextFromNode).join(' ')
      }

      return ''
    }

    return extractTextFromNode(jsonContent).trim()
  } catch {
    // If it's not valid JSON, return the content as-is (plain text)
    return content
  }
}

interface NoteProps {
  note: Note
  index: number
  showDropdown: number | null
  onEdit: (noteId: string) => void
  onToggleDropdown: (index: number, e: React.MouseEvent) => void
  onCopyToClipboard: (content: string) => void
  onDeleteNote: (noteId: string) => void
  formatDate: (date: Date) => string
  formatTime: (date: Date) => string
  truncateContent: (content: string, maxLength?: number) => string
  searchQuery?: string
}

// Function to highlight matching text
function highlightText(text: string, searchQuery: string): React.ReactElement {
  if (!searchQuery.trim()) {
    return <>{text}</>
  }

  const regex = new RegExp(
    `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
    'gi',
  )
  const parts = text.split(regex)

  return (
    <>
      {parts.map((part, index) => {
        if (regex.test(part)) {
          return (
            <span key={index} className="bg-yellow-200 font-medium">
              {part}
            </span>
          )
        }
        return part
      })}
    </>
  )
}

export function Note({
  note,
  index,
  showDropdown,
  onEdit,
  onToggleDropdown,
  onCopyToClipboard,
  onDeleteNote,
  formatDate,
  formatTime,
  truncateContent,
  searchQuery,
}: NoteProps) {
  // Extract normalized text content from JSON
  const normalizedContent = extractTextFromJSON(note.content)

  // Determine what content to display
  const displayContent = searchQuery
    ? normalizedContent
    : truncateContent(normalizedContent)

  return (
    <div
      key={note.id}
      className="bg-[#2A2B2E] rounded-lg border border-[#3a3a3b] p-4 shadow-sm hover:shadow-md group relative cursor-pointer"
      onClick={() => onEdit(note.id)}
    >
      {/* Hover Icons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:shadow-sm group-hover:opacity-100 transition-opacity duration-200 flex items-center rounded-md">
        <div className="relative">
          <button
            onClick={e => onToggleDropdown(index, e)}
            className="p-1.5 hover:bg-[#3a3a3b] transition-colors rounded-md cursor-pointer"
          >
            <Dots className="w-4 h-4 text-[#979899]" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown === index && (
            <div className="absolute top-full right-0 mt-1 w-48 bg-[#1C1E21] border border-[#3a3a3b] rounded-lg shadow-lg z-10">
              <button
                onClick={e => {
                  e.stopPropagation()
                  onCopyToClipboard(normalizedContent)
                }}
                className="w-full px-4 py-2 text-left text-sm text-[#979899] hover:bg-[#2A2B2E] flex items-center gap-2 rounded-t-lg cursor-pointer"
              >
                <Copy className="w-4 h-4" />
                Copy to clipboard
              </button>
              <button
                onClick={e => {
                  e.stopPropagation()
                  onDeleteNote(note.id)
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg cursor-pointer"
              >
                <Trash className="w-4 h-4" />
                Delete note
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="mb-4 pr-16">
          <div className="text-[#979899] font-normal text-sm leading-relaxed break-all">
            {searchQuery
              ? highlightText(displayContent, searchQuery)
              : displayContent}
          </div>
        </div>
        <div className="flex items-center justify-between text-[#6b6b6b] text-xs mt-auto">
          <span>{formatDate(new Date(note.created_at))}</span>
          <span>{formatTime(new Date(note.created_at))}</span>
        </div>
      </div>
    </div>
  )
}
