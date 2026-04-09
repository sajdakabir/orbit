import { Button } from '@/app/components/ui/button'
import { InfoCircle } from '@mynaui/icons-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/app/components/ui/tooltip'
import { useState, useEffect, useRef } from 'react'
import { Spinner } from '@/app/components/ui/spinner'
import { AnimatedCheck } from '@/app/components/ui/animated-checkmark'
import { Lock } from '@mynaui/icons-react'
import { usePermissionsStore } from '@/app/store/usePermissionsStore'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import accessibilityVideo from '@/app/assets/accesssibility.webm'
import microphoneVideo from '@/app/assets/microphone.webm'
import OrbitIcon from '../../icons/OrbitIcon'

export default function PermissionsContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()

  const {
    isAccessibilityEnabled,
    isMicrophoneEnabled,
    setAccessibilityEnabled,
    setMicrophoneEnabled,
  } = usePermissionsStore()

  const [checkingAccessibility, setCheckingAccessibility] = useState(false)
  const [checkingMicrophone, setCheckingMicrophone] = useState(false)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const microphonePollingRef = useRef<NodeJS.Timeout | null>(null)
  const [accessibilityCheckTrigger, setAccessibilityCheckTrigger] =
    useState(false)
  const [microphoneCheckTrigger, setMicrophoneCheckTrigger] = useState(false)

  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
      if (microphonePollingRef.current) {
        clearInterval(microphonePollingRef.current)
      }
    }
  }, [])

  useEffect(() => {
    console.log('[PermissionsContent] Mounted, checking permissions...')
    window.api
      .invoke('check-accessibility-permission', false)
      .then((enabled: boolean) => {
        console.log('[PermissionsContent] Accessibility permission:', enabled)
        setAccessibilityEnabled(enabled)
      })

    window.api
      .invoke('check-microphone-permission', false)
      .then((enabled: boolean) => {
        console.log('[PermissionsContent] Microphone permission:', enabled)
        setMicrophoneEnabled(enabled)
      })
  }, [setAccessibilityEnabled, setMicrophoneEnabled])

  useEffect(() => {
    if (isAccessibilityEnabled) {
      console.log(
        'Accessibility permission granted. Starting key listener service...',
      )
      window.api.invoke('start-key-listener-service')
      setAccessibilityCheckTrigger(false)
      setTimeout(() => setAccessibilityCheckTrigger(true), 100)
    }
  }, [isAccessibilityEnabled])

  useEffect(() => {
    if (isMicrophoneEnabled) {
      setMicrophoneCheckTrigger(false)
      setTimeout(() => setMicrophoneCheckTrigger(true), 100)
    }
  }, [isMicrophoneEnabled])

  const pollAccessibility = () => {
    pollingRef.current = setInterval(() => {
      window.api
        .invoke('check-accessibility-permission', false)
        .then((enabled: boolean) => {
          if (enabled) {
            setAccessibilityEnabled(true)
            setCheckingAccessibility(false)
            if (pollingRef.current) {
              clearInterval(pollingRef.current)
              pollingRef.current = null
            }
          }
        })
    }, 2000)
  }

  const pollMicrophone = () => {
    microphonePollingRef.current = setInterval(() => {
      window.api
        .invoke('check-microphone-permission', false)
        .then((enabled: boolean) => {
          if (enabled) {
            setMicrophoneEnabled(true)
            setCheckingMicrophone(false)
            if (microphonePollingRef.current) {
              clearInterval(microphonePollingRef.current)
              microphonePollingRef.current = null
            }
          }
        })
    }, 2000)
  }

  const handleAllowAccessibility = () => {
    setCheckingAccessibility(true)
    window.api
      .invoke('check-accessibility-permission', true)
      .then((enabled: boolean) => {
        setAccessibilityEnabled(enabled)
        if (!enabled) {
          pollAccessibility()
        } else {
          setCheckingAccessibility(false)
        }
      })
  }

  const handleAllowMicrophone = () => {
    setCheckingMicrophone(true)
    window.api
      .invoke('check-microphone-permission', true)
      .then((enabled: boolean) => {
        setMicrophoneEnabled(enabled)
        if (!enabled) {
          pollMicrophone()
        } else {
          setCheckingMicrophone(false)
        }
      })
  }

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      <div className="flex flex-col items-center max-w-xl w-full px-8">
        {/* Logo and app name at top */}
        <div className="absolute top-6 left-8 flex items-center gap-3">
          <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
          <span className="text-xl font-semibold">Orbit</span>
        </div>

        <h1 className="text-3xl mb-6 text-center">
          {isAccessibilityEnabled && isMicrophoneEnabled
            ? 'Permissions already granted!'
            : 'Grant permissions to get started'}
        </h1>
        {isAccessibilityEnabled && isMicrophoneEnabled && (
          <p className="text-sm text-muted-foreground mb-6 text-center">
            Great! Orbit already has the permissions it needs. Click Continue to
            proceed.
          </p>
        )}
        <div className="flex flex-col gap-4 mb-6 w-full">
          <div className="border rounded-lg p-4 flex flex-col gap-2 bg-background border-border border-2 transition-all duration-200 hover:bg-white/5">
            <div
              className={`flex items-center gap-2 ${isAccessibilityEnabled ? '' : 'mb-2'}`}
            >
              {isAccessibilityEnabled && (
                <AnimatedCheck trigger={accessibilityCheckTrigger} />
              )}
              <div className="font-medium text-base flex">
                {isAccessibilityEnabled
                  ? 'Orbit can insert and edit text.'
                  : 'Allow Orbit to insert spoken words.'}
              </div>
            </div>
            {!isAccessibilityEnabled && (
              <>
                <div className="text-sm text-muted-foreground mb-2">
                  This lets Orbit put your spoken words in the right textbox and
                  edit text according to your commands
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      className="w-24"
                      type="button"
                      onClick={handleAllowAccessibility}
                    >
                      Allow
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center">
                          <InfoCircle style={{ width: 20, height: 20 }} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="start">
                        <p>
                          Orbit uses this to gather context based on the
                          application you&apos;re using, <br /> and to access
                          your clipboard temporarily to paste text.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {checkingAccessibility && (
                    <div className="text-sm text-muted-foreground">
                      <Spinner size="medium" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="border rounded-lg p-4 flex flex-col gap-2 bg-background border-border border-2 transition-all duration-200 hover:bg-white/5">
            <div
              className={`flex items-center gap-2 ${isMicrophoneEnabled ? '' : 'mb-2'}`}
            >
              {isMicrophoneEnabled && (
                <AnimatedCheck trigger={microphoneCheckTrigger} />
              )}
              <div className="font-medium text-base flex">
                {isMicrophoneEnabled
                  ? 'Orbit can use your microphone.'
                  : 'Allow Orbit to use your microphone.'}
              </div>
            </div>
            {isAccessibilityEnabled && !isMicrophoneEnabled && (
              <>
                <div className="text-sm text-muted-foreground mb-2">
                  This lets Orbit hear your voice and transcribe your speech
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mt-1">
                    <Button
                      className="w-24"
                      type="button"
                      onClick={handleAllowMicrophone}
                    >
                      Allow
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center">
                          <InfoCircle style={{ width: 20, height: 20 }} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="right" align="start">
                        <p>
                          Orbit will show an animation when the mic is active{' '}
                          <br /> and only listen when you activate it
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {checkingMicrophone && (
                    <div className="text-sm text-muted-foreground">
                      <Spinner size="medium" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {isAccessibilityEnabled && isMicrophoneEnabled && (
          <div className="flex gap-3 items-center">
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
        )}
      </div>
    </div>
  )
}
