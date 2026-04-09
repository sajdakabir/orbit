import { useSettingsStore } from '@/app/store/useSettingsStore'
import { OrbitMode } from '@/app/generated/orbit_pb'
import MultiShortcutEditor from '@/app/components/ui/multi-shortcut-editor'
import { ChevronLeft } from 'lucide-react'
import { useMainStore } from '@/app/store/useMainStore'

export default function KeyboardSettingsContent() {
  const { getOrbitModeShortcuts } = useSettingsStore()
  const { setCurrentPage } = useMainStore()
  const transcribeShortcuts = getOrbitModeShortcuts(OrbitMode.TRANSCRIBE)
  const editShortcuts = getOrbitModeShortcuts(OrbitMode.EDIT)

  return (
    <div className="p-8 space-y-4 min-h-full max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setCurrentPage('today')}
          className="text-[#979899] hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-medium text-[#979899]">Keyboard</h1>
      </div>

      {/* Settings Group */}
      <div className="bg-[#2A2B2E] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">
              Keyboard Shortcut
            </div>
            <div className="text-xs text-[#979899] mt-1">
              Set the keyboard shortcut to activate Orbit. Press the keys you
              want to use for your shortcut.
            </div>
          </div>
          <MultiShortcutEditor
            shortcuts={transcribeShortcuts}
            mode={OrbitMode.TRANSCRIBE}
          />
        </div>

        <div className="h-px bg-[#3a3a3b]" />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">
              Intelligent Mode Shortcut
            </div>
            <div className="text-xs text-[#979899] mt-1">
              Set the shortcut to activate Intelligent Mode. Press your hotkey,
              speak to Orbit, and the LLM's output is pasted into your text box.
            </div>
          </div>
          <MultiShortcutEditor shortcuts={editShortcuts} mode={OrbitMode.EDIT} />
        </div>
      </div>
    </div>
  )
}
