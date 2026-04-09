import { Button } from '@/app/components/ui/button'
import { useOnboardingStore } from '@/app/store/useOnboardingStore'
import { useSettingsStore } from '@/app/store/useSettingsStore'
import SlackIcon from '../../icons/SlackIcon'
import GmailIcon from '../../icons/GmailIcon'
import LinearIcon from '../../icons/LinearIcon'
import NotionIcon from '../../icons/NotionIcon'
import CursorIcon from '../../icons/CursorIcon'
import OrbitIcon from '../../icons/OrbitIcon'
import { useState } from 'react'
import { ArrowUp } from '@mynaui/icons-react'
import React from 'react'
import { OrbitMode } from '@/app/generated/orbit_pb'
import { getKeyDisplay } from '@/app/utils/keyboard'
import { usePlatform } from '@/app/hooks/usePlatform'
import { KeyName } from '@/lib/types/keyboard'

export default function TryItOut() {
  const { decrementOnboardingStep, setOnboardingCompleted } =
    useOnboardingStore()
  const { getOrbitModeShortcuts } = useSettingsStore()
  const keyboardShortcut = getOrbitModeShortcuts(OrbitMode.TRANSCRIBE)[0].keys
  const platform = usePlatform()
  const [selectedApp, setSelectedApp] = useState<
    'slack' | 'gmail' | 'cursor' | 'linear' | 'notion'
  >('cursor')

  function renderDemo() {
    if (selectedApp === 'slack') {
      return (
        <div className="w-[475px] rounded-2xl bg-[#23272e] shadow-lg flex flex-col gap-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2  bg-[#23272e] py-4 px-4 rounded-t-2xl border-b border-white/10">
            <div
              className="bg-white rounded-md p-1"
              style={{ width: 24, height: 24 }}
            >
              <SlackIcon />
            </div>
            <span className="text-base font-medium text-white">Slack</span>
          </div>
          <div className="flex items-center gap-2 px-4 mt-24">
            <div className="w-10 h-10 rounded-md bg-yellow-200 flex items-center justify-center text-lg font-bold text-black">
              K
            </div>
            <div>
              <div className="font-medium text-white">kabir</div>
              <div className="text-sm text-gray-300">
                Hey sajda, is Orbit working for you?
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 pb-4 rounded-b-2xl">
            <input
              type="text"
              placeholder={`Hold down on the hotkey(s) and start speaking...`}
              className="w-full h-12 border border-neutral-700 bg-[#23272e] text-white rounded-md px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-0"
            />
          </div>
        </div>
      )
    }
    if (selectedApp === 'gmail') {
      return (
        <div className="w-[475px] rounded-2xl  bg-[#23272e] shadow-lg flex flex-col gap-4 border border-white/10">
          <div className="flex items-center gap-2 mb-2 py-4 px-4 rounded-t-2xl border-b border-white/10  bg-[#23272e]">
            <div
              className="bg-white rounded-md p-1"
              style={{ width: 24, height: 24 }}
            >
              <GmailIcon />
            </div>
            <span className="text-base font-medium text-white">Gmail</span>
          </div>
          <div className="flex flex-col gap-2 px-6 pb-6">
            <div className="text-sm text-gray-400">
              Subject:{' '}
              <span className="font-medium text-white">Quick update</span>
            </div>
            <div className="border-t border-white/10 my-2" />
            <textarea
              placeholder={`Try saying:\n\n"Hi Kabir, wonderful meeting with you today. Do you have any time Monday to follow up on the project? Thanks, Sajda"`}
              className="w-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-white placeholder:text-gray-500"
              rows={6}
            />
          </div>
        </div>
      )
    }
    if (selectedApp === 'notion') {
      return (
        <div
          className="w-[475px] rounded-2xl  bg-[#23272e] shadow-lg flex flex-col border border-white/10"
          style={{ minHeight: 280 }}
        >
          <div className="flex items-center gap-2 mb-2 py-4 px-4 rounded-t-2xl border-b border-white/10 bg-[#23272e]">
            <div
              className="bg-white rounded-md p-1"
              style={{ width: 24, height: 24 }}
            >
              <NotionIcon />
            </div>
            <span className="text-base font-medium text-white">Notion</span>
          </div>
          <div className="flex flex-col items-start w-full px-4 py-3">
            <span className="text-2xl font-bold text-white">New Note</span>
            <textarea
              placeholder={`Try saying: "Project tasks: Kabir will draft the proposal, Sajda will review and finalize by Friday."`}
              className="w-full mt-4 resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-white placeholder:text-gray-500"
              rows={4}
            />
          </div>
        </div>
      )
    }
    if (selectedApp === 'linear') {
      return (
        <div
          className="w-[475px] rounded-2xl bg-[#23272e] shadow-lg flex flex-col border border-white/10"
          style={{ minHeight: 280 }}
        >
          <div className="flex items-center gap-2 mb-2 py-4 px-4 rounded-t-2xl border-b border-[#3a3f4b]  bg-[#23272e]">
            <div
              className="bg-white rounded-md p-1"
              style={{ width: 24, height: 24 }}
            >
              <LinearIcon />
            </div>
            <span className="text-base font-medium text-white">Linear</span>
          </div>
          <div className="flex-1 flex flex-col justify-end px-4 py-4 gap-2">
            <div className="flex flex-col gap-3">
              <div className="text-sm text-gray-400">Create new issue</div>
              <input
                type="text"
                placeholder="Issue title"
                className="w-full px-3 py-2 bg-transparent border-b border-[#3a3f4b] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#5E6AD2]"
              />
              <textarea
                placeholder="Add description..."
                className="w-full px-3 py-2 bg-transparent border border-[#3a3f4b] rounded-md text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-[#5E6AD2] resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      )
    }
    if (selectedApp === 'cursor') {
      return (
        <div
          className="w-[475px] rounded-2xl bg-[#23272e] shadow-lg flex flex-col justify-between"
          style={{ minHeight: 320 }}
        >
          <div className="flex flex-col gap-2 p-4 h-full justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4 rounded-t-2xl">
                <div
                  className="bg-neutral-100 rounded-md p-1"
                  style={{ width: 24, height: 24 }}
                >
                  <CursorIcon />
                </div>
                <span className="text-base font-medium text-white">Cursor</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-[#23272e] border border-[#3a3f4b] text-xs text-white px-2 py-0.5 rounded font-mono flex items-center gap-1">
                  <span className="text-[#7dd3fc]">@</span> TryItOut.tsx
                </span>
              </div>
              <textarea
                placeholder="Plan, search, build anything"
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 resize-none text-base text-muted-foreground placeholder:text-muted-foreground mt-2"
                rows={3}
              />
            </div>
            <div className="flex justify-between gap-2 mt-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#23272e] border border-[#3a3f4b] text-xs text-white px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="text-[#a78bfa]">∞</span> Agent{' '}
                  <span className="text-[#a3a3a3]">⌘I</span>
                </span>
                <span className="bg-[#23272e] border border-[#3a3f4b] text-xs text-white px-2 py-0.5 rounded ml-2">
                  Auto <span className="text-[#a3a3a3]">▾</span>
                </span>
              </div>
              <div className="flex">
                <span className="text-[#23272e] p-1 text-lg cursor-pointer rounded-full bg-[#a3a3a3]">
                  <ArrowUp size={16} />
                </span>
              </div>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  const apps = [
    { key: 'cursor', icon: <CursorIcon /> },
    { key: 'slack', icon: <SlackIcon /> },
    { key: 'gmail', icon: <GmailIcon /> },
    { key: 'linear', icon: <LinearIcon /> },
    { key: 'notion', icon: <NotionIcon /> },
  ]

  return (
    <div className="flex flex-col h-full w-full bg-background items-center justify-center">
      {/* Logo and app name at top */}
      <div className="absolute top-6 left-8 flex items-center gap-3">
        <OrbitIcon width={40} height={40} style={{ color: '#FFFFFF' }} />
        <span className="text-xl font-semibold">Orbit</span>
      </div>

      <div className="flex flex-col items-center max-w-2xl w-full px-8 py-12">
        <h1 className="text-3xl mb-4 text-center">
          Use Orbit with the keyboard shortcut.
        </h1>

        <p className="text-base text-muted-foreground mb-8 text-center">
          Hold down on the{' '}
          {keyboardShortcut.map((key, idx) => (
            <React.Fragment key={`keyboard-shortcut-${idx}`}>
              <span className="inline-flex items-center px-2.5 py-1 bg-neutral-800 border border-neutral-700 rounded-md text-sm font-mono mx-1 text-white">
                {getKeyDisplay(key, platform, {
                  showDirectionalText: false,
                  format: 'label',
                })}
              </span>
              {idx < keyboardShortcut.length - 1 && (
                <span className="text-muted-foreground"> + </span>
              )}
            </React.Fragment>
          ))}{' '}
          key{keyboardShortcut.length > 1 ? 's' : ''}, speak, and let go to
          insert spoken text.
        </p>

        <div className="flex flex-col items-center gap-6 mb-8">
          {renderDemo()}

          <div className="flex flex-col items-center">
            <div className="flex flex-row gap-2 px-4 pt-3 pb-5 rounded-2xl bg-neutral-800/50 border border-white/10">
              {apps.map(app => (
                <div
                  key={app.key}
                  className="relative bg-white p-2 rounded-md shadow-md cursor-pointer flex items-center justify-center hover:scale-105 transition-transform"
                  style={{ width: 48, height: 48 }}
                  onClick={() => setSelectedApp(app.key as typeof selectedApp)}
                >
                  {app.icon}
                  {selectedApp === app.key && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-2 h-2 rounded-full bg-white shadow" />
                  )}
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground mt-2 text-center">
              Or select any of the apps above
            </div>
          </div>
        </div>

        <div className="flex gap-3 items-center">
          <Button
            variant="outline"
            className="w-32"
            onClick={decrementOnboardingStep}
          >
            Back
          </Button>
          <Button className="w-32" onClick={setOnboardingCompleted}>
            Finish
          </Button>
        </div>
      </div>
    </div>
  )
}
