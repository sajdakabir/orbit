import React, { useState } from 'react'
import { useNotesStore } from '../../../../store/useNotesStore'
import { useDictionaryStore } from '../../../../store/useDictionaryStore'
import { useOnboardingStore } from '../../../../store/useOnboardingStore'
import { Button } from '../../../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog'
import { useAuthStore } from '@/app/store/useAuthStore'
import { useAuth } from '@/app/components/auth/useAuth'
import { ChevronLeft } from 'lucide-react'
import { useMainStore } from '@/app/store/useMainStore'

export default function AccountSettingsContent() {
  const { user, setName, clearAuth } = useAuthStore()
  const { logoutUser } = useAuth()
  const { loadNotes } = useNotesStore()
  const { loadEntries } = useDictionaryStore()
  const { resetOnboarding } = useOnboardingStore()
  const { setCurrentPage } = useMainStore()

  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSignOut = async () => {
    try {
      await logoutUser()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      // Delete user data from both local and server databases
      // Server now extracts userId from authenticated user's token
      await window.api.deleteUserData()

      // Clear KV-backed app state
      window.electron.store.set('settings', {})
      window.electron.store.set('main', {})
      window.electron.store.set('onboarding', {})
      window.electron.store.set('auth', {})

      // Clear auth state
      clearAuth(false)

      // Reset all stores to their initial state
      resetOnboarding()
      loadNotes()
      loadEntries()

      // Close the dialog
      setShowDeleteDialog(false)

      // Note: The app will automatically navigate to onboarding since user is no longer authenticated
    } catch (error) {
      console.error('Failed to delete account data:', error)
      // Still proceed with local cleanup even if server deletion fails
      // Clear KV-backed app state
      window.electron.store.set('settings', {})
      window.electron.store.set('main', {})
      window.electron.store.set('onboarding', {})
      window.electron.store.set('auth', {})

      // Clear auth state
      clearAuth(false)

      // Reset all stores to their initial state
      resetOnboarding()
      loadNotes()
      loadEntries()

      // Close the dialog
      setShowDeleteDialog(false)
    }
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
        <h1 className="text-base font-medium text-[#979899]">Account</h1>
      </div>

      {/* Settings Group */}
      <div className="bg-[#2A2B2E] rounded-xl p-5 space-y-4">
        {/* Name */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-[#979899]">Name</div>
              <div className="text-xs text-[#979899] mt-1">Display name</div>
            </div>
            <input
              type="text"
              value={user?.name}
              onChange={e => setName(e.target.value)}
              className="w-96 bg-[#2A2B2E] border border-[#3a3a3b] rounded-lg px-4 py-3 text-sm text-[#979899] focus:outline-none focus:border-[#3a3a3b]"
            />
          </div>
        </div>

        <div className="h-px bg-[#3a3a3b]" />

        {/* Email */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-[#979899]">Email</div>
            </div>
            <div className="w-96 text-sm text-[#979899] px-4 py-3">
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="bg-[#2A2B2E] rounded-xl p-5 flex items-center justify-between">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleSignOut}
          className="px-6 py-3 text-[#E84C88] hover:text-[#E84C88] hover:bg-transparent cursor-pointer"
        >
          Logout
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setShowDeleteDialog(true)}
          className="px-6 py-3 text-[#DC2626] hover:text-[#B91C1C] hover:bg-transparent cursor-pointer"
        >
          Delete account
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you absolutely sure you want to delete your account? This
              action cannot be undone and will permanently remove:
              <br />
              <br />
              • All your personal information
              <br />
              • All saved notes
              <br />
              • All dictionary entries
              <br />
              • All app settings and preferences
              <br />
              <br />
              This will reset Orbit to its initial state.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount}>
              Yes, delete everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
