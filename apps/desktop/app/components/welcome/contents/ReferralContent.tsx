import { Button } from '@/app/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../ui/dropdown-menu'
import OrbitIcon from '../../icons/OrbitIcon'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useAuthStore } from '@/app/store/useAuthStore'

const sources = [
  'Twitter',
  'TikTok',
  'Instagram',
  'Discord',
  'YouTube',
  'Reddit',
  'Friend',
  'Google Search',
  'Product Hunt',
  'Other',
]

export default function ReferralContent() {
  const {
    incrementOnboardingStep,
    decrementOnboardingStep,
    referralSource,
    setReferralSource,
  } = useOnboardingStore()
  const { user } = useAuthStore()
  const firstName = user?.name?.split(' ')[0]

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      <div className="flex flex-col items-center max-w-md w-full px-8">
        {/* Logo and app name at top */}
        <div className="absolute top-6 left-8 flex items-center gap-3">
          <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
          <span className="text-2xl font-semibold">Orbit</span>
        </div>

        <h1 className="text-3xl mb-4 text-center">
          Welcome{firstName ? `, ${firstName}!` : '!'}
        </h1>
        <p className="mb-6 text-base text-muted-foreground text-center">
          Where did you hear about us?
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mb-8 w-64 px-4 py-2 border border-border rounded-md bg-background text-base focus:outline-none text-left flex items-center justify-between">
              {referralSource ? (
                <span className="text-sm">{referralSource}</span>
              ) : (
                <span className="text-muted-foreground text-sm">
                  Select a source
                </span>
              )}
              <svg
                className="ml-2 h-4 w-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 text-sm border-border">
            {sources.map(s => (
              <DropdownMenuItem key={s} onSelect={() => setReferralSource(s)}>
                {s}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex gap-3 items-center">
          <Button
            className="w-32"
            onClick={incrementOnboardingStep}
            disabled={!referralSource}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  )
}
