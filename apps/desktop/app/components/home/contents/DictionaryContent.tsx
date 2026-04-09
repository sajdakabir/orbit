import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Trash, Plus, Check, X } from '@mynaui/icons-react'
import { Tooltip, TooltipTrigger, TooltipContent } from '../../ui/tooltip'
import { Switch } from '../../ui/switch'
import { StatusIndicator } from '../../ui/status-indicator'
import { useDictionaryStore } from '../../../store/useDictionaryStore'

export default function DictionaryContent() {
  const {
    entries,
    loadEntries,
    addEntry,
    addReplacement,
    updateEntry,
    deleteEntry,
  } = useDictionaryStore()
  const [showScrollToTop, setShowScrollToTop] = useState(false)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editFrom, setEditFrom] = useState('')
  const [editTo, setEditTo] = useState('')

  // Inline add state
  const [isAdding, setIsAdding] = useState(false)
  const [isReplacement, setIsReplacement] = useState(false)
  const [newEntryContent, setNewEntryContent] = useState('')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')

  const [statusIndicator, setStatusIndicator] = useState<
    'success' | 'error' | null
  >(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)
  const editFromRef = useRef<HTMLInputElement>(null)
  const addInputRef = useRef<HTMLInputElement>(null)
  const addFromRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setShowScrollToTop(containerRef.current.scrollTop > 200)
      }
    }
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      return () => container.removeEventListener('scroll', handleScroll)
    }
    return undefined
  }, [])

  const scrollToTop = () => {
    containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // --- Inline Edit ---
  const startEdit = (id: string) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    setEditingId(id)
    if (entry.type === 'normal') {
      setEditContent(entry.content)
      setEditFrom('')
      setEditTo('')
      setTimeout(() => editInputRef.current?.focus(), 50)
    } else {
      setEditFrom(entry.from)
      setEditTo(entry.to)
      setEditContent('')
      setTimeout(() => editFromRef.current?.focus(), 50)
    }
  }

  const saveEdit = async () => {
    if (!editingId) return
    const entry = entries.find(e => e.id === editingId)
    if (!entry) return

    try {
      if (entry.type === 'normal' && editContent.trim()) {
        await updateEntry(editingId, { type: 'normal', content: editContent.trim() } as any)
        setSuccessMessage(`"${editContent.trim()}" updated successfully`)
        setStatusIndicator('success')
      } else if (entry.type === 'replacement' && editFrom.trim() && editTo.trim()) {
        await updateEntry(editingId, { type: 'replacement', from: editFrom.trim(), to: editTo.trim() } as any)
        setSuccessMessage(`"${editFrom.trim()}" → "${editTo.trim()}" updated successfully`)
        setStatusIndicator('success')
      }
      cancelEdit()
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to update entry')
      setStatusIndicator('error')
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
    setEditFrom('')
    setEditTo('')
  }

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  // --- Inline Add ---
  const startAdd = () => {
    setIsAdding(true)
    setNewEntryContent('')
    setNewFrom('')
    setNewTo('')
    setIsReplacement(false)
    setTimeout(() => addInputRef.current?.focus(), 50)
  }

  const saveNew = async () => {
    try {
      if (isReplacement) {
        if (newFrom.trim() && newTo.trim()) {
          await addReplacement(newFrom.trim(), newTo.trim())
          setSuccessMessage(`"${newFrom.trim()}" → "${newTo.trim()}" added successfully`)
          setStatusIndicator('success')
        }
      } else {
        if (newEntryContent.trim()) {
          await addEntry(newEntryContent.trim())
          setSuccessMessage(`"${newEntryContent.trim()}" added successfully`)
          setStatusIndicator('success')
        }
      }
      cancelAdd()
    } catch (error: any) {
      setErrorMessage(error?.message || 'Failed to add entry')
      setStatusIndicator('error')
    }
  }

  const cancelAdd = () => {
    setIsAdding(false)
    setNewEntryContent('')
    setNewFrom('')
    setNewTo('')
    setIsReplacement(false)
  }

  const handleAddKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveNew()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      cancelAdd()
    }
  }

  const handleDelete = async (id: string) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    const text = entry.type === 'replacement' ? `${entry.from} → ${entry.to}` : entry.content
    try {
      await deleteEntry(id)
      setSuccessMessage(`"${text}" deleted successfully`)
      setStatusIndicator('success')
    } catch {
      setErrorMessage(`Failed to delete "${text}"`)
      setStatusIndicator('error')
    }
  }

  const noEntries = entries.length === 0

  return (
    <div
      ref={containerRef}
      className="w-full px-24 max-h-160 overflow-y-auto relative"
      style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}
    >
      <div className="flex items-center gap-2 mb-5">
        <h1 className="text-base font-medium text-[#979899]">Dictionary</h1>
      </div>

      {noEntries && !isAdding && (
        <div className="bg-[#2A2B2E] rounded-xl p-5 text-[#979899]">
          <p className="text-sm">No entries yet</p>
          <p className="text-xs mt-1">
            Dictionary entries make the transcription more accurate
          </p>
        </div>
      )}

      {(!noEntries || isAdding) && (
        <div className="bg-[#2A2B2E] rounded-xl p-5 space-y-0">
          {entries.map((entry, index) => {
            const isEditing = editingId === entry.id

            return (
              <div key={entry.id}>
                {index > 0 && <div className="h-px bg-[#3a3a3b] my-3" />}

                {isEditing ? (
                  /* Inline edit mode */
                  <div className="flex items-center gap-2">
                    {entry.type === 'normal' ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        className="flex-1 px-3 py-2 rounded-md bg-[#1C1E21] border border-[#3a3a3b] text-sm text-white focus:outline-none focus:border-[#505050]"
                        placeholder="Enter word..."
                      />
                    ) : (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          ref={editFromRef}
                          type="text"
                          value={editFrom}
                          onChange={e => setEditFrom(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          className="flex-1 px-3 py-2 rounded-md bg-[#1C1E21] border border-[#3a3a3b] text-sm text-white focus:outline-none focus:border-[#505050]"
                          placeholder="From"
                        />
                        <span className="text-[#979899] text-sm">→</span>
                        <input
                          type="text"
                          value={editTo}
                          onChange={e => setEditTo(e.target.value)}
                          onKeyDown={handleEditKeyDown}
                          className="flex-1 px-3 py-2 rounded-md bg-[#1C1E21] border border-[#3a3a3b] text-sm text-white focus:outline-none focus:border-[#505050]"
                          placeholder="To"
                        />
                      </div>
                    )}
                    <button
                      onClick={saveEdit}
                      className="p-1.5 hover:bg-[#3a3a3b] rounded transition-colors cursor-pointer"
                    >
                      <Check className="w-4 h-4 text-[#979899]" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-1.5 hover:bg-[#3a3a3b] rounded transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4 text-[#979899]" />
                    </button>
                  </div>
                ) : (
                  /* Display mode */
                  <div
                    className="flex items-center justify-between gap-10 group"
                    onMouseEnter={() => setHoveredRow(index)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <div
                      className="text-sm text-[#979899] flex-1 cursor-text rounded px-1 -mx-1 hover:text-white transition-colors"
                      onClick={() => startEdit(entry.id)}
                    >
                      {entry.type === 'replacement'
                        ? `${entry.from} → ${entry.to}`
                        : entry.content}
                    </div>

                    <div
                      className={`flex items-center gap-1 transition-opacity duration-200 ${
                        hoveredRow === index ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 hover:bg-red-900/20 rounded transition-colors cursor-pointer"
                          >
                            <Trash className="w-4 h-4 text-[#979899] hover:text-red-400" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={5}>
                          Delete
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {/* Inline add row */}
          {isAdding && (
            <>
              {entries.length > 0 && <div className="h-px bg-[#3a3a3b] my-3" />}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#979899]">Replacement</span>
                  <Switch
                    checked={isReplacement}
                    onCheckedChange={checked => {
                      setIsReplacement(checked)
                      setTimeout(() => {
                        if (checked) addFromRef.current?.focus()
                        else addInputRef.current?.focus()
                      }, 50)
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  {!isReplacement ? (
                    <input
                      ref={addInputRef}
                      type="text"
                      value={newEntryContent}
                      onChange={e => setNewEntryContent(e.target.value)}
                      onKeyDown={handleAddKeyDown}
                      className="flex-1 px-3 py-2 rounded-md bg-[#1C1E21] border border-[#3a3a3b] text-sm text-white focus:outline-none focus:border-[#505050]"
                      placeholder="Enter word..."
                    />
                  ) : (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        ref={addFromRef}
                        type="text"
                        value={newFrom}
                        onChange={e => setNewFrom(e.target.value)}
                        onKeyDown={handleAddKeyDown}
                        className="flex-1 px-3 py-2 rounded-md bg-[#1C1E21] border border-[#3a3a3b] text-sm text-white focus:outline-none focus:border-[#505050]"
                        placeholder="Misspelling"
                      />
                      <span className="text-[#979899] text-sm">→</span>
                      <input
                        type="text"
                        value={newTo}
                        onChange={e => setNewTo(e.target.value)}
                        onKeyDown={handleAddKeyDown}
                        className="flex-1 px-3 py-2 rounded-md bg-[#1C1E21] border border-[#3a3a3b] text-sm text-white focus:outline-none focus:border-[#505050]"
                        placeholder="Correct spelling"
                      />
                    </div>
                  )}
                  <button
                    onClick={saveNew}
                    className="p-1.5 hover:bg-[#3a3a3b] rounded transition-colors cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-[#979899]" />
                  </button>
                  <button
                    onClick={cancelAdd}
                    className="p-1.5 hover:bg-[#3a3a3b] rounded transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-[#979899]" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add New Button */}
      {!isAdding && (
        <div className="mt-6">
          <button
            onClick={startAdd}
            className="w-full bg-[#2A2B2E] hover:bg-[#3a3a3b] text-[#979899] px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 border border-[#3a3a3b]"
          >
            <Plus className="w-4 h-4" />
            Add new
          </button>
        </div>
      )}

      {/* Scroll to Top */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 bg-black text-white right-8 w-8 h-8 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center z-50 cursor-pointer"
        >
          <ArrowUp className="w-4 h-4 font-bold" />
        </button>
      )}

      <StatusIndicator
        status={statusIndicator}
        onHide={() => {
          setStatusIndicator(null)
          setErrorMessage('')
          setSuccessMessage('')
        }}
        successMessage={successMessage || 'Dictionary entry added successfully'}
        errorMessage={errorMessage || 'Failed to add dictionary entry'}
      />
    </div>
  )
}
