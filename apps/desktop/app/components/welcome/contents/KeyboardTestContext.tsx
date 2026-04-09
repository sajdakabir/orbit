import { Button } from '@/app/components/ui/button'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import KeyboardShortcutEditor from '../../ui/keyboard-shortcut-editor'
import { OrbitMode } from '@/app/generated/orbit_pb'
import { getOrbitModeShortcutDefaults } from '@/lib/constants/keyboard-defaults'
import { usePlatform } from '@/app/hooks/usePlatform'
import { getKeyDisplay } from '@/app/utils/keyboard'
import { KeyName } from '@/lib/types/keyboard'
import React from 'react'
import OrbitIcon from '../../icons/OrbitIcon'

export default function KeyboardTestContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()
  const { getOrbitModeShortcuts, updateKeyboardShortcut } = useSettingsStore()
  const keyboardShortcut = getOrbitModeShortcuts(OrbitMode.TRANSCRIBE)[0]
  const platform = usePlatform()
  const defaultKeys = getOrbitModeShortcutDefaults(platform)[OrbitMode.TRANSCRIBE]

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      <div className="flex flex-col items-center max-w-2xl w-full px-8">
        {/* Logo and app name at top */}
        <div className="absolute top-6 left-8 flex items-center gap-3">
          <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
          <span className="text-xl font-semibold">Orbit</span>
        </div>

        <h1 className="text-3xl font-semibold mb-3 text-center">
          Test your keyboard shortcut
        </h1>
        <p className="text-base text-muted-foreground mb-8 text-center max-w-xl">
          Press and hold the shortcut to activate Orbit's dictation
        </p>

        <div className="text-sm text-muted-foreground mb-8 text-center">
          <span>We recommend </span>
          {defaultKeys.map((key, index) => (
            <React.Fragment key={index}>
              <span className="inline-flex items-center px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded-md text-sm font-mono mx-1 text-white">
                {getKeyDisplay(key as KeyName, platform, {
                  showDirectionalText: false,
                  format: 'label',
                })}
              </span>
              {index < defaultKeys.length - 1 && <span> + </span>}
            </React.Fragment>
          ))}
        </div>

        <div className="mb-6 w-full max-w-md">
          <KeyboardShortcutEditor
            shortcut={keyboardShortcut}
            onShortcutChange={updateKeyboardShortcut}
            keySize={90}
            editButtonText="Change Shortcut"
            confirmButtonText="Yes"
            showConfirmButton={false}
            onConfirm={incrementOnboardingStep}
            editModeTitle="Press a key to add it to the shortcut, press it again to remove it"
            viewModeTitle="Does the key turn white when you press it?"
            minHeight={120}
            editButtonClassName="w-56 cursor-pointer"
            confirmButtonClassName="w-20"
            className="flex flex-col items-center bg-transparent"
            mode={OrbitMode.TRANSCRIBE}
          />
        </div>

        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            className="w-32"
            onClick={decrementOnboardingStep}
          >
            Back
          </Button>
          <Button className="w-32" onClick={incrementOnboardingStep}>
            Yes
          </Button>
        </div>
      </div>
    </div>
  )
}
