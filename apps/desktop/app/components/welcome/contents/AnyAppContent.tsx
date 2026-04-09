import { Button } from '@/app/components/ui/button'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import OrbitIcon from '../../icons/OrbitIcon'

export default function AnyAppContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      <div className="flex flex-col items-center max-w-lg w-full px-8">
        {/* Logo and app name at top */}
        <div className="absolute top-6 left-8 flex items-center gap-3">
          <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
          <span className="text-xl font-semibold">Orbit</span>
        </div>

        <h1 className="text-3xl mb-6 text-center">Orbit works in any app.</h1>
        <p className="text-base text-muted-foreground mb-8 text-center">
          From emails to chats to documents—Orbit works in any textbox on your
          computer.
        </p>
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
      </div>
    </div>
  )
}
