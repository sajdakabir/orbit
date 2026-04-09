import { Button } from '@/app/components/ui/button'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { CheckCircle } from '@mynaui/icons-react'
import { ArrowRight } from 'lucide-react'
import KeyboardShortcutEditor from '../../ui/keyboard-shortcut-editor'
import { OrbitMode } from '@/app/generated/orbit_pb'
import { Tip } from '../../ui/tip'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import OrbitIcon from '../../icons/OrbitIcon'

export default function IntroducingIntelligentMode() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()

  const { getOrbitModeShortcuts, updateKeyboardShortcut } = useSettingsStore()
  const keyboardShortcut = getOrbitModeShortcuts(OrbitMode.EDIT)[0]

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      {/* Logo and app name at top */}
      <div className="absolute top-6 left-8 flex items-center gap-3">
        <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
        <span className="text-xl font-semibold">Orbit</span>
      </div>

      <div className="flex flex-col justify-center items-center max-w-2xl px-8">
        <div className="flex flex-col min-h-[400px] justify-between py-12 w-full">
          <div className="mt-8">
            <div className="text-2xl mb-1 font-medium text-center">
              Introducing Orbit Intelligent Mode
            </div>
            <div className="mb-4 text-lg font-light text-center">
              What you ask gets written.
            </div>
            <div className="mb-6">
              {[
                'Press Hotkey -> Speak to Orbit',
                'Orbit send your speech to LLM',
                'Pastes LLM output into text box',
              ].map((step, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-base font-light mb-1"
                >
                  <CheckCircle />
                  {step}
                </div>
              ))}
            </div>

            <div className="mb-6 flex flex-col items-center">
              <KeyboardShortcutEditor
                shortcut={keyboardShortcut}
                onShortcutChange={updateKeyboardShortcut}
                keySize={80}
                editButtonText="Change Shortcut"
                showConfirmButton={true}
                onConfirm={incrementOnboardingStep}
                editModeTitle="Press a key to add it to the shortcut, press it again to remove it"
                viewModeTitle="Default Hotkey to activate Intelligent Mode"
                minHeight={112}
                editButtonClassName="w-56 cursor-pointer"
                confirmButtonClassName="hidden"
                className="flex flex-col items-center bg-transparent"
                mode={OrbitMode.EDIT}
              />
            </div>

            <div className="text-lg font-semibold mt-6 mb-1">Examples</div>
            {[
              'Generate a README for an open-source project.',
              'Create a detailed image prompt for Calcutta road traffic at sunset.',
            ].map((step, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-base font-light mb-1 italic"
              >
                <ArrowRight className="h-5 w-5 shrink-0 text-white" />
                {step}
              </div>
            ))}
            <Tip
              tipText="You can also trigger Intelligent Mode by saying 'Hey Orbit' when using the regular dictation hotkey."
              className="mt-3"
            />
          </div>

          <div className="flex gap-3 items-center justify-center mt-8">
            <Button
              variant="outline"
              className="w-32"
              onClick={decrementOnboardingStep}
            >
              Back
            </Button>
            <Button className="w-32" onClick={incrementOnboardingStep}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
