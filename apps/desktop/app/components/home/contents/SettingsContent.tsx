import { useMainStore } from '@/app/store/useMainStore'
import GeneralSettingsContent from './settings/GeneralSettingsContent'
import AudioSettingsContent from './settings/AudioSettingsContent'
import AccountSettingsContent from './settings/AccountSettingsContent'
import KeyboardSettingsContent from './settings/KeyboardSettingsContent'
import AdvancedSettingsContent from './settings/AdvancedSettingsContent'
import PricingBillingSettingsContent from './settings/PricingBillingSettingsContent'
import AboutContent from './AboutContent'

export default function SettingsContent() {
  const { settingsPage } = useMainStore()

  const renderSettingsContent = () => {
    switch (settingsPage) {
      case 'general':
        return <GeneralSettingsContent />
      case 'keyboard':
        return <KeyboardSettingsContent />
      case 'audio':
        return <AudioSettingsContent />
      case 'pricing-billing':
        return <PricingBillingSettingsContent />
      case 'account':
        return <AccountSettingsContent />
      case 'notification':
        return (
          <div className="p-8 text-white">
            Notification settings coming soon...
          </div>
        )
      case 'advanced':
        return <AdvancedSettingsContent />
      case 'about':
        return <AboutContent />
      default:
        return <GeneralSettingsContent />
    }
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-[#1C1E21]">
      {renderSettingsContent()}
    </div>
  )
}
