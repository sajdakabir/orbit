import { ChevronLeft, Github } from 'lucide-react'
import OrbitIcon from '../../icons/OrbitIcon'
import { useMainStore } from '@/app/store/useMainStore'

export default function AboutContent() {
  const { setCurrentPage } = useMainStore()

  const handleCreatorGitHubClick = () => {
    window.open('https://github.com/sajdakabir/orbit', '_blank')
  }

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
        <h1 className="text-base font-medium text-[#979899]">About</h1>
      </div>

      {/* About Section */}
      <div className="bg-[#2A2B2E] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-4 pb-4">
          <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
          <div>
            <h2 className="text-xl font-semibold text-white">Orbit</h2>
            <p className="text-sm text-[#979899] mt-0.5">
              Version {import.meta.env.VITE_ORBIT_VERSION}
            </p>
          </div>
        </div>

        <div className="h-px bg-[#3a3a3b]" />

        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <Github width={16} height={16} className="text-[#979899]" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">
              Built by{' '}
              <button
                onClick={handleCreatorGitHubClick}
                className="hover:text-white text-white/70 underline underline-offset-2 transition-colors cursor-pointer"
              >
                Sajda Kabir
              </button>
            </div>
            <button
              onClick={handleCreatorGitHubClick}
              className="text-xs text-[#979899] mt-1 hover:text-white transition-colors cursor-pointer"
            >
              github.com/sajdakabir/orbit
            </button>
          </div>
        </div>

        <div className="h-px bg-[#3a3a3b]" />

        <div className="text-xs text-[#979899] italic">
          Made with free internet from cafés around Bengaluru
        </div>
      </div>
    </div>
  )
}
