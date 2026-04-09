import { useState } from 'react'
import { Switch } from '@/app/components/ui/switch'
import { Button } from '@/app/components/ui/button'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import { useWindowContext } from '@/app/components/window/WindowContext'
import { ChevronLeft } from 'lucide-react'
import { useMainStore } from '@/app/store/useMainStore'

export default function GeneralSettingsContent() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const { setSettingsPage, setCurrentPage } = useMainStore()
  const {
    shareAnalytics,
    launchAtLogin,
    showOrbitBarAlways,
    showAppInDock,
    setShareAnalytics,
    setLaunchAtLogin,
    setShowOrbitBarAlways,
    setShowAppInDock,
  } = useSettingsStore()

  const windowContext = useWindowContext()

  const handleDownloadLogs = async () => {
    setIsDownloading(true)
    try {
      const result = await window.api.logs.download()
      if (result.success) {
        console.log('Logs downloaded successfully to:', result.path)
      } else {
        if (result.error !== 'Download cancelled') {
          console.error('Failed to download logs:', result.error)
          alert(`Failed to download logs: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Error downloading logs:', error)
      alert('An unexpected error occurred while downloading logs')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleClearLogs = async () => {
    const confirmed = confirm(
      'Are you sure you want to clear all logs? This action cannot be undone.',
    )
    if (!confirmed) return

    setIsClearing(true)
    try {
      const result = await window.api.logs.clear()
      if (result.success) {
        console.log('Logs cleared successfully')
        alert('Logs cleared successfully')
      } else {
        console.error('Failed to clear logs:', result.error)
        alert(`Failed to clear logs: ${result.error}`)
      }
    } catch (error) {
      console.error('Error clearing logs:', error)
      alert('An unexpected error occurred while clearing logs')
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="p-8 space-y-4 min-h-full max-w-5xl ">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => setCurrentPage('today')}
          className="text-[#979899] hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-medium text-[#979899]">General</h1>
      </div>

      {/* Settings Group */}
      <div className="bg-[#2A2B2E] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">
              Share analytics
            </div>
            <div className="text-xs text-[#979899] mt-1">
              Share anonymous usage data to help us improve Orbit.
            </div>
          </div>
          <Switch
            checked={shareAnalytics}
            onCheckedChange={setShareAnalytics}
          />
        </div>

        <div className="h-px bg-[#3a3a3b]" />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">
              Launch at Login
            </div>
            <div className="text-xs text-[#979899] mt-1">
              Open Orbit automatically when your computer starts.
            </div>
          </div>
          <Switch checked={launchAtLogin} onCheckedChange={setLaunchAtLogin} />
        </div>

        <div className="h-px bg-[#3a3a3b]" />

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-[#979899]">
              Show Orbit bar at all times
            </div>
            <div className="text-xs text-[#979899] mt-1">
              Show the Orbit bar at all times.
            </div>
          </div>
          <Switch
            checked={showOrbitBarAlways}
            onCheckedChange={setShowOrbitBarAlways}
          />
        </div>

        {windowContext?.window?.platform === 'darwin' && (
          <>
            <div className="h-px bg-[#3a3a3b]" />
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-[#979899]">
                  Show app in dock
                </div>
                <div className="text-xs text-[#979899] mt-1">
                  Show the Orbit app in the dock for quick access.
                </div>
              </div>
              <Switch
                checked={showAppInDock}
                onCheckedChange={setShowAppInDock}
              />
            </div>
          </>
        )}
      </div>

      {/* Log Management Section */}
      <div>
        <h2 className="text-base font-medium text-[#979899] mb-3">
          Log Management
        </h2>

        <div className="bg-[#2A2B2E] rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-[#979899]">
                Download Logs
              </div>
              <div className="text-xs text-[#979899] mt-1">
                Export your local logs to a file for troubleshooting.
              </div>
            </div>
            <button
              onClick={handleDownloadLogs}
              disabled={isDownloading}
              className="text-sm font-medium text-[#979899] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDownloading ? 'Downloading...' : 'Download'}
            </button>
          </div>

          <div className="h-px bg-[#3a3a3b]" />

          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-[#979899]">
                Clear Logs
              </div>
              <div className="text-xs text-[#979899] mt-1">
                Permanently delete all local logs from your device.
              </div>
            </div>
            <button
              onClick={handleClearLogs}
              disabled={isClearing}
              className="text-sm font-medium text-[#DC2626] hover:text-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClearing ? 'Clearing...' : 'Clear'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
