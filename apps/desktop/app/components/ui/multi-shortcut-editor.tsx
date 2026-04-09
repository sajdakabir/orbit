import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import KeyboardKey from '@/app/components/ui/keyboard-key'
import { ShortcutError } from '@/app/utils/keyboard'
import { keyNameMap } from '@/lib/types/keyboard'
import { OrbitMode } from '@/app/generated/orbit_pb'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import { Check, Pencil } from '@mynaui/icons-react'
import { cx } from 'class-variance-authority'
import { KeyName } from '@/lib/types/keyboard'
import { useShortcutEditingStore } from '@/app/store/useShortcutEditingStore'

export interface KeyboardShortcutConfig {
  id: string
  keys: KeyName[]
  mode: OrbitMode
}

type Props = {
  shortcuts: KeyboardShortcutConfig[] // persisted rows
  mode: OrbitMode
  className?: string
  keySize?: number
  maxShortcutsPerMode?: number
}

const MAX_KEYS_PER_SHORTCUT = 5

export default function MultiShortcutEditor({
  shortcuts,
  mode,
  className = '',
  maxShortcutsPerMode = 5,
}: Props) {
  const {
    createKeyboardShortcut,
    removeKeyboardShortcut,
    updateKeyboardShortcut,
  } = useSettingsStore()

  // global editing lock
  const editorKey = useMemo(() => `multi-shortcut-editor:${mode}`, [mode])
  const { start, stop, activeEditor } = useShortcutEditingStore()

  const rows = useMemo(
    () => (mode == null ? shortcuts : shortcuts.filter(s => s.mode === mode)),
    [shortcuts, mode],
  )
  const isAtLimit = rows.length >= maxShortcutsPerMode
  const isMinimum = rows.length <= 1

  // editing state
  const [editingId, setEditingId] = useState<string | null>(null) // existing row id or "__new__"
  const [draftKeys, setDraftKeys] = useState<KeyName[]>([])
  const [error, setError] = useState<string>('')
  const [temporaryError, setTemporaryError] = useState<string>('')

  const cleanupRef = useRef<(() => void) | null>(null)
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const beginEditExisting = (row: KeyboardShortcutConfig) => {
    if (!start(editorKey)) {
      setError('Finish editing the other shortcut set first.')
      return
    }
    setEditingId(row.id)
    setDraftKeys([])
    setError('')
    setTemporaryError('')

    window.api.send(
      'electron-store-set',
      'settings.isShortcutGloballyEnabled',
      false,
    )
  }

  const getErrorMessage = (error: ShortcutError, message?: string) => {
    switch (error) {
      case 'duplicate-key-same-mode':
        return 'This key combination is already in use for this mode.'
      case 'duplicate-key-diff-mode':
        return 'This key combination is already in use for a different mode.'
      case 'not-found':
        return 'The specified shortcut was not found.'
      case 'reserved-combination':
        return message || 'This key combination is reserved and cannot be used.'
      default:
        return 'An unknown error occurred.'
    }
  }

  const addNew = () => {
    const result = createKeyboardShortcut(mode)
    if (!result.success && result.error) {
      setError(getErrorMessage(result.error, result.errorMessage))
      return
    }
  }

  const stopEdit = () => {
    setEditingId(null)
    setDraftKeys([])
    setError('')
    setTemporaryError('')

    // Clear any pending error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
      errorTimeoutRef.current = null
    }

    window.api.send(
      'electron-store-set',
      'settings.isShortcutGloballyEnabled',
      true,
    )
    stop(editorKey)
  }

  const saveEdit = async (original: KeyboardShortcutConfig) => {
    if (!draftKeys.length) return

    // update existing
    const result = await updateKeyboardShortcut(original.id, draftKeys)
    if (!result.success && result.error) {
      setError(getErrorMessage(result.error, result.errorMessage))
      return
    }

    stopEdit()
  }

  // capture keys (no normalization/cleanup here by request)
  const handleKeyEvent = useCallback(
    (event: any) => {
      if (!editingId || event.type !== 'keydown') return
      const key = keyNameMap[event.key] || event.key.toLowerCase()
      setDraftKeys(prev => {
        // If key exists, remove it
        if (prev.includes(key)) {
          return prev.filter(k => k !== key)
        }

        // If at max keys, show temporary error and don't add
        if (prev.length >= MAX_KEYS_PER_SHORTCUT) {
          // Clear any existing timeout
          if (errorTimeoutRef.current) {
            clearTimeout(errorTimeoutRef.current)
          }

          // Show temporary error
          setTemporaryError(`Maximum ${MAX_KEYS_PER_SHORTCUT} keys allowed`)

          // Clear temporary error after 2 seconds
          errorTimeoutRef.current = setTimeout(() => {
            setTemporaryError('')
            errorTimeoutRef.current = null
          }, 2000)

          return prev
        }

        // Add the new key and clear any errors
        setError('')
        setTemporaryError('')
        return [...prev, key]
      })
    },
    [editingId],
  )

  useEffect(() => {
    if (!editingId) return

    cleanupRef.current = window.api.onKeyEvent(handleKeyEvent)

    return () => {
      cleanupRef.current?.()
    }
  }, [handleKeyEvent, editingId])

  // Ensure lock is released and global shortcuts re-enabled on unmount
  useEffect(() => {
    return () => {
      if (editingId) {
        window.api.send(
          'electron-store-set',
          'settings.isShortcutGloballyEnabled',
          true,
        )
        stop(editorKey)
      }
      // Clean up any pending error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [editingId, stop, editorKey])

  // Click outside to cancel edit
  useEffect(() => {
    if (!editingId) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        stopEdit()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [editingId])

  const base =
    'inline-flex items-center justify-center rounded-xl ' +
    'px-3 py-1.5 text-[#979899] h-9 min-w-[48px] cursor-pointer'

  const isLockedByOther = activeEditor !== null && activeEditor !== editorKey

  return (
    <div className={cx('w-82', className)} ref={containerRef}>
      {rows.map(row => {
        const isEditing = editingId === row.id
        const displayKeys = isEditing ? draftKeys : row.keys

        return (
          <div
            key={row.id}
            className="mb-1 rounded-lg border-[1px] border-[#3a3a3b] px-3 py-1.5 min-h-[44px]"
          >
            <div
              className={`flex items-center justify-between h-full ${!isEditing ? 'cursor-pointer' : ''}`}
              onClick={() =>
                !isEditing && !isLockedByOther && beginEditExisting(row)
              }
            >
              <div className="flex items-center justify-between gap-1">
                {displayKeys.length ? (
                  <>
                    {displayKeys.map((k, idx) => (
                      <KeyboardKey key={idx} keyboardKey={k} variant="inline" />
                    ))}
                    {isEditing &&
                      displayKeys.length < MAX_KEYS_PER_SHORTCUT && (
                        <span className="text-xs text-[#6B6C6F] ml-2">
                          ({MAX_KEYS_PER_SHORTCUT - displayKeys.length} more
                          allowed)
                        </span>
                      )}
                  </>
                ) : (
                  <span className="text-[#6B6C6F]">
                    {isEditing
                      ? `Press keys to add (max ${MAX_KEYS_PER_SHORTCUT})`
                      : `No keys set`}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={e => {
                  e.stopPropagation()
                  saveEdit(row)
                }}
                className={`${base} ${editingId === row.id ? 'visible' : 'invisible'}`}
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
            {editingId === row.id && (error || temporaryError) && (
              <div className="mt-1 text-xs text-red-500">
                {temporaryError || error}
              </div>
            )}
          </div>
        )
      })}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            const lastRow = rows.at(-1)
            if (lastRow) {
              removeKeyboardShortcut(lastRow.id)
            }
          }}
          hidden={isMinimum}
          className="ml-auto text-[#DC2626] hover:text-[#B91C1C] text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          disabled={isLockedByOther}
        >
          Delete
        </button>
      </div>

      {/* Add new */}
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            if (isLockedByOther) return
            addNew()
          }}
          hidden={isAtLimit}
          className="rounded-md border border-[#3a3a3b]  py-1 px-2 text-md text-[#979899] disabled:opacity-50 hover:border-[#5a5a5b] disabled:cursor-not-allowed cursor-pointer"
          disabled={isLockedByOther}
        >
          Add another
        </button>
      </div>
    </div>
  )
}
