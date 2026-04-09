import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useNotesStore } from '../../../store/useNotesStore'
import { useSettingsStore } from '../../../store/useSettingsStore'
import Masonry from '@mui/lab/Masonry'
import { AudioIcon } from '../../icons/AudioIcon'
import { ArrowUp, Grid, Rows, Search, X } from '@mynaui/icons-react'
import { Save, Loader2 } from 'lucide-react'
import { Note } from '../../ui/note'
import { StatusIndicator } from '../../ui/status-indicator'
import { OrbitMode } from '@/app/generated/orbit_pb'
import { getKeyDisplayInfo } from '@/lib/types/keyboard'
import { usePlatform } from '@/app/hooks/usePlatform'
import debounce from 'lodash.debounce'
import Editor, { defaultEditorContent } from '../../editor/editor'
import type { JSONContent } from 'novel'

export default function NotesContent() {
  const { notes, loadNotes, addNote, deleteNote, updateNote } = useNotesStore()
  const { getOrbitModeShortcuts } = useSettingsStore()
  const keyboardShortcut = getOrbitModeShortcuts(OrbitMode.TRANSCRIBE)[0].keys
  const [creatingNote, setCreatingNote] = useState(false)
  const [showAddNoteButton, setShowAddNoteButton] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [containerHeight, setContainerHeight] = useState(128) // 128px = h-32
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState<number | null>(null)
  const [statusIndicator, setStatusIndicator] = useState<
    'success' | 'error' | null
  >(null)
  const [statusMessage, setStatusMessage] = useState<string>('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingNote, setEditingNote] = useState<{
    id: string
    content: string
  } | null>(null)
  const [editContent, setEditContent] =
    useState<JSONContent>(defaultEditorContent)
  const [isEditMode, setIsEditMode] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [lastSavedContent, setLastSavedContent] = useState('')
  const platform = usePlatform()

  useEffect(() => {
    loadNotes()
  }, [loadNotes, addNote, notes.length])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) {
      return content
    }
    return content.slice(0, maxLength) + '...'
  }

  const handleBlur = () => {
    // If the note isn't empty, don't close the input
    setTimeout(() => {
      if (textareaRef.current?.value.trim() === '') {
        setCreatingNote(false)
      }
    }, 200)
  }

  const updateNoteContent = (content: string) => {
    setNoteContent(content)
    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
      hour12: false,
    })

    const timestamp = fmt.format(new Date())
    console.log(`${timestamp}: Pasted content: ${content}`)
    if (content.trim() !== '') {
      setShowAddNoteButton(true)
    } else {
      setShowAddNoteButton(false)
    }

    // Auto-resize textarea and container
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${scrollHeight}px`

      // Calculate container height: textarea height + padding + button space
      const minHeight = 192 // min-h-48 = 192px
      const paddingAndButton = 48 + 40 // 48px padding + 40px for button space
      const newContainerHeight = Math.max(
        minHeight,
        scrollHeight + paddingAndButton,
      )
      setContainerHeight(newContainerHeight)
    }
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid')
  }

  const openSearch = () => {
    setShowSearch(true)
    // Focus the search input after the component updates
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 100)
  }

  const closeSearch = () => {
    setShowSearch(false)
    setSearchQuery('')
  }

  // Filter notes based on search query
  const filteredNotes =
    searchQuery.trim() === ''
      ? notes
      : notes.filter(note =>
          note.content.toLowerCase().includes(searchQuery.toLowerCase()),
        )

  const handleAddNote = async () => {
    if (noteContent.trim() !== '') {
      try {
        await addNote(noteContent.trim())
        setNoteContent('')
        setCreatingNote(false)
        setShowAddNoteButton(false)
        setStatusMessage('Note saved')
        setStatusIndicator('success')
      } catch (error) {
        console.error('Failed to add note:', error)
        setStatusMessage('Failed to save note')
        setStatusIndicator('error')
      }
    }
  }

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setShowDropdown(null)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId)
      setShowDropdown(null)
      setStatusMessage('Deleted note')
      setStatusIndicator('success')
    } catch (error) {
      console.error('Failed to delete note:', error)
      setStatusMessage('Failed to delete note')
      setStatusIndicator('error')
    }
  }

  const handleEditNote = (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note) {
      setEditingNote({ id: noteId, content: note.content })
      // Try to parse content as JSON, fall back to plain text if it fails
      try {
        const parsedContent = JSON.parse(note.content)
        setEditContent(parsedContent)
      } catch {
        // If content is plain text, wrap it in editor format
        setEditContent({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: note.content }],
            },
          ],
        })
      }
      setLastSavedContent(note.content)
      setIsEditMode(true)
      setShowDropdown(null)
    }
  }

  const handleSaveEdit = useCallback(
    async (content: JSONContent) => {
      const contentString = JSON.stringify(content)
      if (
        editingNote &&
        contentString.trim() !== '' &&
        contentString !== lastSavedContent
      ) {
        setSavingEdit(true)
        try {
          await updateNote(editingNote.id, contentString)
          setLastSavedContent(contentString)
          setStatusMessage('Saved')
          setStatusIndicator('success')
        } catch (error) {
          console.error('Failed to update note:', error)
          setStatusMessage('Failed to save')
          setStatusIndicator('error')
        } finally {
          setSavingEdit(false)
        }
      }
    },
    [editingNote, lastSavedContent, updateNote],
  )

  // Create debounced version of handleSaveEdit (2 seconds delay)
  const debouncedSaveEdit = useMemo(
    () => debounce((content: JSONContent) => handleSaveEdit(content), 2000),
    [handleSaveEdit],
  )

  const handleCancelEdit = useCallback(() => {
    // Flush any pending debounced saves and save immediately if needed
    debouncedSaveEdit.cancel()
    const contentString = JSON.stringify(editContent)
    if (contentString !== lastSavedContent && contentString.trim() !== '') {
      handleSaveEdit(editContent)
    }
    setEditingNote(null)
    setEditContent(defaultEditorContent)
    setIsEditMode(false)
  }, [editContent, lastSavedContent, handleSaveEdit, debouncedSaveEdit])

  const toggleDropdown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDropdown(showDropdown === index ? null : index)
  }

  // Auto-resize on mount and when creatingNote changes
  useEffect(() => {
    if (creatingNote && textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      textareaRef.current.style.height = `${scrollHeight}px`

      // Set container height for creating state
      const minHeight = 192 // min-h-48 = 192px
      const paddingAndButton = 48 // 48px padding for button space
      const newContainerHeight = Math.max(
        minHeight,
        scrollHeight + paddingAndButton,
      )
      setContainerHeight(newContainerHeight)
    } else if (!creatingNote) {
      // Reset to default height when not creating
      setContainerHeight(128) // h-32 = 128px
      if (textareaRef.current) {
        textareaRef.current.style.height = ''
      }
    }
  }, [creatingNote])

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop
        setShowScrollToTop(scrollTop > 200) // Show button after scrolling 200px
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }

    return () => {}
  }, [])

  // Handle escape key for closing search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSearch) {
        closeSearch()
      }
      if (event.key === 'Escape' && isEditMode) {
        handleCancelEdit()
      }
    }

    if (showSearch || isEditMode) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }

    return () => {}
  }, [showSearch, isEditMode, handleCancelEdit])

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(null)
    }

    if (showDropdown !== null) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }

    return () => {}
  }, [showDropdown])

  // Auto-save with lodash.debounce: Only saves after user stops typing for 2 seconds
  // This prevents unnecessary API calls while the user is actively typing
  useEffect(() => {
    const contentString = JSON.stringify(editContent)
    if (isEditMode && contentString !== lastSavedContent) {
      debouncedSaveEdit(editContent)
    }

    // Cleanup: Cancel pending debounced calls on unmount
    return () => {
      debouncedSaveEdit.cancel()
    }
  }, [editContent, isEditMode, lastSavedContent, debouncedSaveEdit])

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }

  // If in edit mode, show full-page editor
  if (isEditMode && editingNote) {
    const note = notes.find(n => n.id === editingNote.id)

    return (
      <div className="w-full max-w-6xl mx-auto px-4 md:px-24 h-160 overflow-y-auto relative">
        {/* Status Indicator */}
        {statusIndicator && (
          <StatusIndicator
            status={statusIndicator}
            successMessage={statusMessage}
            errorMessage={statusMessage}
            onHide={() => setStatusIndicator(null)}
          />
        )}

        {/* Back Button - Top Right */}
        <button
          onClick={handleCancelEdit}
          className="absolute top-4 right-4 md:right-0 p-2 hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2 text-white/60 hover:text-white text-sm"
          title="Back to notes"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Full-page Editor */}
        <div className="relative mb-4 pt-4">
          <Editor
            initialValue={editContent}
            onChange={content => setEditContent(content)}
            placeholder="Start writing..."
          />
        </div>

        {/* Auto-save Status */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/40">
            {note && (
              <span>
                Created:{' '}
                {new Date(note.created_at).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-white/40">
            {savingEdit ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Saving...</span>
              </>
            ) : JSON.stringify(editContent) !== lastSavedContent ? (
              <span>Unsaved changes</span>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>Saved</span>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default notes list view
  return (
    <div
      ref={containerRef}
      className="w-full max-w-6xl mx-auto px-24 h-200 overflow-y-auto relative"
      style={{
        height: '640px',
        msOverflowStyle: 'none' /* Internet Explorer 10+ */,
        scrollbarWidth: 'none' /* Firefox */,
      }}
    >
      {/* Header */}
      {showSearch ? (
        <div className="flex items-center gap-4 mb-5 px-4 py-2 bg-[#2A2B2E] border border-[#3a3a3b] rounded-lg">
          <Search className="w-5 h-5 text-[#979899] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search your notes"
            className="flex-1 text-sm outline-none placeholder-[#979899] bg-transparent text-[#979899]"
          />
          <button
            onClick={closeSearch}
            className="p-1 hover:bg-[#3a3a3b] rounded transition-colors shrink-0"
            title="Close search"
          >
            <X className="w-5 h-5 text-[#979899]" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-5">
          <h1 className="text-base font-medium text-[#979899]">Notes</h1>
        </div>
      )}

      {/* Text Input Area - Only show when not searching */}
      {!showSearch && (
        <div
          className="rounded-xl mb-8 border border-[#3a3a3b] bg-[#2A2B2E] w-3/5 mx-auto transition-all duration-200 ease-in-out relative"
          style={{ height: `${containerHeight}px` }}
        >
          {!creatingNote && (
            <div className="absolute top-6 left-6 flex items-center gap-1 text-[#979899] pointer-events-none">
              <AudioIcon />
              <span>Take a quick note with your voice</span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            className={`w-full pt-6 px-6 focus:outline-none resize-none overflow-hidden bg-transparent text-[#979899] ${creatingNote ? 'cursor-text' : 'cursor-pointer'}`}
            value={noteContent}
            onChange={e => updateNoteContent(e.target.value)}
            onClick={() => setCreatingNote(true)}
            onBlur={handleBlur}
            placeholder={`${creatingNote ? `Press and hold ${keyboardShortcut.map(k => getKeyDisplayInfo(k, platform).label).join(' + ')} and start speaking` : ''}`}
          />
          {showAddNoteButton && (
            <div className="absolute bottom-3 right-3">
              <button
                onClick={handleAddNote}
                className="bg-[#1C1E21] border border-[#3a3a3b] px-4 py-2 rounded-md font-semibold hover:bg-[#3a3a3b] cursor-pointer text-[#979899]"
              >
                Add note
              </button>
            </div>
          )}
        </div>
      )}
      <div
        className={`${viewMode === 'grid' || showSearch ? '' : 'm-auto w-3/5'}`}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="text-xs text-[#979899] font-medium uppercase tracking-wide">
            {showSearch
              ? `Search Results (${filteredNotes.length})`
              : `Notes (${notes.length})`}
          </div>
          <div className="flex items-center gap-1">
            <button
              className="p-2 hover:bg-[#2A2B2E] rounded-lg transition-colors cursor-pointer"
              title="Search"
              onClick={openSearch}
            >
              <Search className="w-5 h-5 text-[#979899]" />
            </button>
            <button
              className="p-2 hover:bg-[#2A2B2E] rounded-lg transition-colors cursor-pointer"
              title="List view"
              onClick={toggleViewMode}
            >
              {viewMode === 'grid' ? (
                <Rows className="w-5 h-5 text-[#979899]" />
              ) : (
                <Grid className="w-5 h-5 text-[#979899]" />
              )}
            </button>
          </div>
        </div>
        <div className="w-full h-px bg-[#3a3a3b] mb-4"></div>
        {/* Notes Masonry Layout */}
        {(showSearch ? filteredNotes.length === 0 : notes.length === 0) ? (
          <div className="py-4 text-[#979899]">
            {showSearch ? (
              <>
                <p className="text-sm">No notes found</p>
                <p className="text-xs mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="text-sm">No notes yet</p>
              </>
            )}
          </div>
        ) : (
          <div className="py-4">
            {viewMode === 'grid' && (
              <Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
                {(showSearch ? filteredNotes : notes).map((note, index) => (
                  <Note
                    key={note.id}
                    note={note}
                    index={index}
                    showDropdown={showDropdown}
                    onEdit={handleEditNote}
                    onToggleDropdown={toggleDropdown}
                    onCopyToClipboard={handleCopyToClipboard}
                    onDeleteNote={handleDeleteNote}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    truncateContent={truncateContent}
                    searchQuery={showSearch ? searchQuery : undefined}
                  />
                ))}
              </Masonry>
            )}
            {viewMode === 'list' && (
              <div className="flex flex-col gap-4">
                {(showSearch ? filteredNotes : notes).map((note, index) => (
                  <Note
                    key={note.id}
                    note={note}
                    index={index}
                    showDropdown={showDropdown}
                    onEdit={handleEditNote}
                    onToggleDropdown={toggleDropdown}
                    onCopyToClipboard={handleCopyToClipboard}
                    onDeleteNote={handleDeleteNote}
                    formatDate={formatDate}
                    formatTime={formatTime}
                    truncateContent={truncateContent}
                    searchQuery={showSearch ? searchQuery : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 bg-[#1C1E21] border border-[#3a3a3b] text-white right-8 w-8 h-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center group z-50 cursor-pointer"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4 font-bold" />
        </button>
      )}

      {/* Status Indicator */}
      <StatusIndicator
        status={statusIndicator}
        onHide={() => {
          setStatusIndicator(null)
          setStatusMessage('')
        }}
        successMessage={statusMessage}
        errorMessage={statusMessage}
      />
    </div>
  )
}
