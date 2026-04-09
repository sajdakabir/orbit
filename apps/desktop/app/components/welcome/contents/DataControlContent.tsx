import { Button } from '@/app/components/ui/button'
import { CheckCircle, Lock } from '@mynaui/icons-react'
import { EXTERNAL_LINKS } from '@/lib/constants/external-links'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import OrbitIcon from '../../icons/OrbitIcon'

export default function DataControlContent() {
  const { incrementOnboardingStep, decrementOnboardingStep } =
    useOnboardingStore()
  const { shareAnalytics, setShareAnalytics } = useSettingsStore()

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      <div className="flex flex-col items-center max-w-lg w-full px-8">
        {/* Logo and app name at top */}
        <div className="absolute top-6 left-8 flex items-center gap-3">
          <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
          <span className="text-2xl font-semibold">Orbit</span>
        </div>

        {/* <div className="mb-6">
          <Lock style={{ width: 180, height: 180, color: '#ffffff' }} />
        </div> */}
        <h1 className="text-3xl mb-6 text-center">You control your data.</h1>
        <div className="flex flex-col gap-4 mb-6 w-full">
          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${shareAnalytics ? 'border-green-400 bg-green-950/20 border-2 hover:border-green-300' : 'border-border border-2 bg-background hover:border-white/40'}`}
            onClick={() => setShareAnalytics(true)}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="font-medium text-foreground">
                Help improve Orbit
              </div>
              {shareAnalytics && (
                <div>
                  <CheckCircle
                    style={{ color: '#34d399', width: 18, height: 18 }}
                  />
                </div>
              )}
            </div>
            <div
              className={`text-sm mt-1 ${shareAnalytics ? 'text-green-200' : 'text-muted-foreground'}`}
            >
              To make Orbit better, this option lets us collect your audio,
              transcript, and edits to evaluate, train and improve Orbit's
              features and AI models.
            </div>
          </div>
          <div
            className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${!shareAnalytics ? 'border-blue-400 bg-blue-950/20 border-2 hover:border-blue-300' : 'border-border border-2 bg-background hover:border-white/40'}`}
            onClick={() => setShareAnalytics(false)}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div className="font-medium text-foreground">Privacy Mode</div>
              {!shareAnalytics && (
                <div>
                  <Lock style={{ color: '#60a5fa', width: 18, height: 18 }} />
                </div>
              )}
            </div>
            <div
              className={`text-sm mt-1 ${!shareAnalytics ? 'text-blue-200' : 'text-muted-foreground'}`}
            >
              If you enable Privacy Mode, none of your dictation data will be
              stored or used for model training by us or any third party.
            </div>
          </div>
        </div>
        <div className="text-sm text-muted-foreground text-center mb-6">
          You can always change this later in settings.{' '}
          <button
            onClick={() =>
              window.api?.invoke('web-open-url', EXTERNAL_LINKS.PRIVACY_POLICY)
            }
            className="underline hover:text-foreground cursor-pointer"
          >
            Read more here.
          </button>
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
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
