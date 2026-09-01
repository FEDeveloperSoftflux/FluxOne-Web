import { useState } from 'react'
import { ProfileCard } from '@/components/feature/profile/ProfileCard'
import { ProfileEditDialog } from '@/components/feature/profile/ProfileEditDialog'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { getAdminSession, setAdminSession } from '@/config/adminAuth.config'
import { toastSuccess } from '@/lib/toast'

export function AdminProfilePage() {
  const session = getAdminSession() || {
    name: 'Asad',
    email: 'admin@fluxone.b2b',
    role: 'b2b_admin',
    loginExpires: '01 Sept 2026, 12:11 pm',
  }

  const [name, setName] = useState(session.name || 'Asad')
  const [loginId, setLoginId] = useState(session.loginId || session.email || 'INV-Wah01')
  const [editOpen, setEditOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSave(fields) {
    setSaving(true)
    try {
      const updated = {
        ...session,
        name: fields.name,
        loginId: fields.id || fields.loginId || session.loginId || 'INV-Wah01',
        email: fields.id || session.email,
      }
      setAdminSession(updated)
      setName(fields.name)
      setLoginId(fields.id || fields.loginId || 'INV-Wah01')
      toastSuccess('Profile updated successfully')
      setEditOpen(false)
      return { success: true }
    } catch {
      return { success: false, error: 'Failed to update profile' }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-0 pb-8 pt-4 sm:gap-6 sm:pb-12 sm:pt-6">
      <MotionHeader className="w-full text-center">
        <p className="text-sm text-slate-400">Signed-in admin details.</p>
      </MotionHeader>

      <MotionReveal className="flex w-full justify-center px-0">
        <ProfileCard
          name={name}
          loginId={loginId}
          role="b2b_admin"
          loginExpires={session.loginExpires || '01 Sept 2026, 12:11 pm'}
          onEdit={() => setEditOpen(true)}
        />
      </MotionReveal>

      <ProfileEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialName={name}
        initialLoginId={loginId}
        loading={saving}
        onSubmit={handleSave}
      />
    </div>
  )
}

export default AdminProfilePage
