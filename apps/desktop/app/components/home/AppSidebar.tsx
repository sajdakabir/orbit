import {
  Home,
  BookOpen,
  FileText,
  Library,
  Settings as SettingsIcon,
  User,
  Bell,
  ChevronLeft,
  Keyboard,
  Mic,
  CreditCard,
  SlidersHorizontal,
  SlidersVertical,
  Info,
  Calendar,
  Inbox,
  Heart,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/app/components/ui/sidebar'
import { useMainStore } from '@/app/store/useMainStore'
import { DateIcon } from '@/app/components/icons/DateIcon'
import DiscordIcon from '@/app/components/icons/DiscordIcon'
import { EXTERNAL_LINKS } from '@/lib/constants/external-links'

type PageType =
  | 'home'
  | 'today'
  | 'inbox'
  | 'dictionary'
  | 'notes'
  | 'library'
  | 'settings'
  | 'about'

interface AppSidebarProps {
  currentPage: PageType
  onPageChange: (page: PageType) => void
  isPro?: boolean
  navExpanded: boolean
}

const menuItems: Array<{ title: string; page: PageType; icon: typeof Home }> = [
  {
    title: 'Home',
    page: 'home',
    icon: Home,
  },
  {
    title: 'Today',
    page: 'today',
    icon: Calendar,
  },
  {
    title: 'Inbox',
    page: 'inbox',
    icon: Inbox,
  },
  {
    title: 'Dictionary',
    page: 'dictionary',
    icon: BookOpen,
  },
  {
    title: 'Notes',
    page: 'notes',
    icon: FileText,
  },
  {
    title: 'Library',
    page: 'library',
    icon: Library,
  },
]

const bottomMenuItems: Array<{
  title: string
  page: PageType
  icon: typeof SettingsIcon
}> = [
  {
    title: 'Settings',
    page: 'settings',
    icon: SettingsIcon,
  },
]

const settingsMenuItems = [
  { id: 'general', label: 'General', icon: SlidersVertical },
  { id: 'account', label: 'Account', icon: User },
  { id: 'notification', label: 'Notification', icon: Bell },
  { id: 'keyboard', label: 'Keyboard', icon: Keyboard },
  { id: 'audio', label: 'Audio & Mic', icon: Mic },
  // { id: 'pricing-billing', label: 'Pricing & Billing', icon: CreditCard },
  { id: 'advanced', label: 'Advanced', icon: SlidersHorizontal },
  { id: 'about', label: 'About', icon: Info },
]

export function AppSidebar({
  currentPage,
  onPageChange,
  isPro,
  navExpanded,
}: AppSidebarProps) {
  const { settingsPage, setSettingsPage } = useMainStore()

  // Show settings menu when on settings page
  if (currentPage === 'settings') {
    return (
      <Sidebar
        className={`border-r border-[#232324] transition-all duration-100 ease-in-out ${navExpanded ? 'w-56' : 'w-16'}`}
      >
        <SidebarContent className="flex flex-col">
          {/* Settings Menu */}
          <SidebarGroup className="pt-4">
            {navExpanded && (
              <div className="px-4 mb-2 text-xs text-gray-500 uppercase tracking-wider">
                My account
              </div>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {settingsMenuItems.map(item => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={settingsPage === item.id}
                        onClick={() => setSettingsPage(item.id as any)}
                      >
                        {Icon ? (
                          <Icon className="w-4 h-4" />
                        ) : (
                          <div className="w-4 h-4" />
                        )}
                        {navExpanded && <span>{item.label}</span>}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Back Button */}
          <SidebarGroup className="pb-4">
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => onPageChange('home')}>
                    <ChevronLeft className="w-4 h-4" />
                    {navExpanded && <span>Back</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    )
  }

  // Show normal menu for other pages
  return (
    <Sidebar
      className={`border-r border-[#232324] transition-all duration-100 ease-in-out ${navExpanded ? 'w-56' : 'w-16'}`}
    >
      <SidebarContent className="flex flex-col">
        {/* Main Navigation Menu */}
        <SidebarGroup className="pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => onPageChange(item.page)}
                  >
                    {item.page === 'today' ? (
                      <DateIcon className="w-4 h-4" />
                    ) : (
                      <item.icon className="w-4 h-4" />
                    )}
                    {navExpanded && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer to push bottom items down */}
        <div className="flex-1" />

        {/* External Links */}
        <SidebarGroup className="pb-0">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() =>
                    window.api?.invoke('web-open-url', EXTERNAL_LINKS.DISCORD)
                  }
                >
                  <DiscordIcon className="w-4 h-4" />
                  {navExpanded && <span>Join Discord</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() =>
                    window.api?.invoke(
                      'web-open-url',
                      EXTERNAL_LINKS.SUPPORT_US,
                    )
                  }
                >
                  <Heart className="w-4 h-4" />
                  {navExpanded && <span>Support Orbit</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation Menu */}
        <SidebarGroup className="pb-4">
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomMenuItems.map(item => (
                <SidebarMenuItem key={item.page}>
                  <SidebarMenuButton
                    isActive={currentPage === item.page}
                    onClick={() => onPageChange(item.page)}
                  >
                    <item.icon className="w-4 h-4" />
                    {navExpanded && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
