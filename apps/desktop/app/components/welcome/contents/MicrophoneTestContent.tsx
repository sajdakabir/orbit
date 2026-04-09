import { Button } from '@/app/components/ui/button'
import { useEffect, useState } from 'react'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import { MicrophoneSelector } from '@/app/components/ui/microphone-selector'
import OrbitIcon from '../../icons/OrbitIcon'

function MicrophoneBars({ volume }: { volume: number }) {
  const [time, setTime] = useState(0)
  const minHeight = 0.15
  const bars = 50

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const levels = Array(bars)
    .fill(0)
    .map((_, i) => {
      // Create a wave pattern that responds to volume with animation
      const center = bars / 2
      const distance = Math.abs(i - center)
      const waveIntensity = 1 - distance / center
      const normalizedVolume = Math.min(volume * 10, 1)

      // Add wave motion animation
      const waveOffset = Math.sin(i * 0.3 + time * 0.15) * 0.15
      const randomVariation = Math.sin(i * 1.2 + time * 0.2) * 0.08

      const height =
        minHeight +
        normalizedVolume * waveIntensity * 0.85 +
        (normalizedVolume > 0.05 ? waveOffset + randomVariation : 0)
      return Math.max(minHeight, Math.min(height, 1))
    })

  return (
    <div
      className="flex gap-[2px] py-6 px-6 items-center justify-center "
      style={{ height: 140, width: '100%', maxWidth: 600 }}
    >
      {levels.map((level, i) => {
        const intensity = level > minHeight + 0.1
        const color = intensity ? 'bg-white' : 'bg-neutral-600'
        return (
          <div
            key={i}
            className={`${color} rounded-full`}
            style={{
              width: 4,
              height: `${level * 100}%`,
              transition: 'height 0.1s ease-out',
            }}
          />
        )
      })}
    </div>
  )
}

export default function MicrophoneTestContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()
  const { microphoneDeviceId, microphoneName, setMicrophoneDeviceId } =
    useSettingsStore()

  const [volume, setVolume] = useState(0)
  const [smoothedVolume, setSmoothedVolume] = useState(0)

  // This effect listens for volume updates from the main process
  useEffect(() => {
    const unsubscribe = window.api.on('volume-update', (newVolume: number) => {
      setVolume(newVolume)
    })

    // Cleanup the listener when the component unmounts
    return () => {
      unsubscribe()
    }
  }, []) // Runs only once on mount

  // This effect manages the "test" recording lifecycle.
  // It starts recording when a device is selected and stops when the component unmounts.
  useEffect(() => {
    if (microphoneDeviceId) {
      console.log(`Starting test recording on device: ${microphoneDeviceId}`)
      window.api.send('start-native-recording-test')
    }

    // Cleanup function: stop recording when the component unmounts or device changes
    return () => {
      console.log('Stopping test recording.')
      // Use the test-specific stop handler that only stops audio recording
      window.api.send('stop-native-recording-test')
    }
  }, [microphoneDeviceId]) // Re-runs whenever the selected microphone changes

  // Smooth the volume updates to reduce flicker
  useEffect(() => {
    const smoothing = 0.4 // Lower = smoother, higher = more responsive
    setSmoothedVolume(prev => prev * (1 - smoothing) + volume * smoothing)
  }, [volume])

  // Handles changing the microphone
  const handleMicrophoneChange = async (deviceId: string, name: string) => {
    // The useEffect hook above will automatically handle stopping the old
    // stream and starting the new one when the deviceId changes.
    setMicrophoneDeviceId(deviceId, name)
  }

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      {/* Logo and app name at top */}
      <div className="absolute top-6 left-8 flex items-center gap-3">
        <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
        <span className="text-xl font-semibold">Orbit</span>
      </div>

      <div className="flex flex-col items-center max-w-xl w-full px-8">
        <h1 className="text-3xl mb-4 text-center">
          Speak to test your microphone.
        </h1>
        <div className="text-base text-muted-foreground mb-8 text-center">
          Your computer's built-in mic will ensure accurate transcription with
          minimal latency.
        </div>
        <div className="text-lg font-medium  text-center">
          Do you see the waveform moving while you speak?
        </div>
        <MicrophoneBars volume={smoothedVolume} />
        <div className="flex gap-2  w-full justify-center">
          <MicrophoneSelector
            selectedDeviceId={microphoneDeviceId}
            selectedMicrophoneName={microphoneName}
            onSelectionChange={handleMicrophoneChange}
            triggerButtonText="No, change microphone"
            triggerButtonVariant="outline"
            triggerButtonClassName="w-52"
          />
        </div>
        <div className="flex gap-3 items-center mt-6">
          <Button
            variant="outline"
            className="w-32"
            onClick={decrementOnboardingStep}
          >
            Back
          </Button>
          <Button
            className="w-20"
            type="button"
            onClick={incrementOnboardingStep}
          >
            Yes
          </Button>
        </div>
      </div>
    </div>
  )
}
