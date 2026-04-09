import { Switch } from '@/app/components/ui/switch'
import { MicrophoneSelector } from '@/app/components/ui/microphone-selector'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import { ChevronLeft } from 'lucide-react'
import { useMainStore } from '@/app/store/useMainStore'

export default function AudioSettingsContent() {
  const { setCurrentPage } = useMainStore()
  const {
    microphoneDeviceId,
    microphoneName,
    // interactionSounds,
    muteAudioWhenDictating,
    setMicrophoneDeviceId,
    // setInteractionSounds,
    setMuteAudioWhenDictating,
  } = useSettingsStore()

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
        <h1 className="text-base font-medium text-[#979899]">Audio & Mic</h1>
      </div>

      {/* Settings Group */}
      <div className="bg-[#2A2B2E] rounded-xl p-5 space-y-4">
        {/* <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">Interaction Sounds</div>
            <div className="text-xs text-[#979899] mt-1">
              Play a sound when Orbit starts and stops recording.
            </div>
          </div>
          <Switch
            checked={interactionSounds}
            onCheckedChange={setInteractionSounds}
          />
        </div> */}

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">
              Mute audio when dictating
            </div>
            <div className="text-xs text-[#979899] mt-1">
              Automatically silence other active audio during dictation.
            </div>
          </div>
          <Switch
            checked={muteAudioWhenDictating}
            onCheckedChange={setMuteAudioWhenDictating}
          />
        </div>

        <div className="h-px bg-[#3a3a3b]" />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">
              Select default microphone
            </div>
            <div className="text-xs text-[#979899] mt-1">
              Select the microphone Orbit will use by default for audio input.
            </div>
          </div>
          <MicrophoneSelector
            selectedDeviceId={microphoneDeviceId}
            selectedMicrophoneName={microphoneName}
            onSelectionChange={setMicrophoneDeviceId}
            triggerButtonVariant="outline"
            triggerButtonClassName=""
          />
        </div>
      </div>
    </div>
  )
}
