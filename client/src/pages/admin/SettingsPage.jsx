import { useState } from 'react'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { BRAND } from '@/lib/constants'
import { toastSuccess, toastError } from '@/lib/toast'
import { INITIAL_SYSTEM_ACCESS_DATA } from '@/data/adminSettingsMock'
import {
  KeyRound,
  Shield,
  Monitor,
  Ban,
  CheckCircle2,
  HardDrive,
  Cpu,
  Laptop,
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  Radio,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState('security') // 'security' | 'systems'

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true)

  // System Access State
  const [systems, setSystems] = useState(INITIAL_SYSTEM_ACCESS_DATA)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [targetSystem, setTargetSystem] = useState(null)

  // Submit Password Change
  function handleChangePassword(e) {
    e.preventDefault()
    if (!currentPassword) {
      toastError('Please enter your current password')
      return
    }
    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toastError('New password and confirmation do not match')
      return
    }

    toastSuccess('Password updated successfully! All other sessions verified.')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  // Open confirmation modal for block / unblock
  function handlePromptBlockSystem(sys) {
    setTargetSystem(sys)
    setConfirmDialogOpen(true)
  }

  // Confirm Block / Unblock action
  function handleConfirmToggleBlock() {
    if (!targetSystem) return
    const isCurrentlyActive = targetSystem.status === 'active'
    const nextStatus = isCurrentlyActive ? 'blocked' : 'active'

    setSystems((prev) =>
      prev.map((s) => (s.id === targetSystem.id ? { ...s, status: nextStatus } : s)),
    )

    toastSuccess(
      `${targetSystem.deviceName} is now ${
        nextStatus === 'blocked' ? 'BLOCKED from accessing the system' : 'ACTIVE & Authorized'
      }`,
    )

    setTargetSystem(null)
    setConfirmDialogOpen(false)
  }

  const activeCount = systems.filter((s) => s.status === 'active').length
  const blockedCount = systems.filter((s) => s.status === 'blocked').length

  return (
    <div className="space-y-6 pb-8">
      <MotionHeader>
        <PageHeader
          eyebrow="System Configuration & Security"
          title="Admin Settings"
          description="Security testing, administrator credential updates, and hardware signature system access controls"
        />
      </MotionHeader>

      {/* Navigation Tabs */}
      <MotionReveal delay={0.05}>
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'security'
                ? 'bg-white text-purple-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="size-4" />
            Security & Password Change
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('systems')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'systems'
                ? 'bg-white text-purple-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Monitor className="size-4" />
            All System Access ({systems.length})
          </button>
        </div>
      </MotionReveal>

      {/* TAB 1: SECURITY & PASSWORD CHANGE */}
      {activeTab === 'security' && (
        <MotionReveal delay={0.1}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Change Password Form */}
            <div className="lg:col-span-7">
              <SurfaceCard
                title="Change Admin Password"
                description="Update your B2B master account password and manage authentication security"
              >
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="currPass" className="text-xs font-semibold">
                      Current Password *
                    </Label>
                    <div className="relative">
                      <Input
                        id="currPass"
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password (e.g. password123)"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="newPass" className="text-xs font-semibold">
                        New Password *
                      </Label>
                      <Input
                        id="newPass"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confPass" className="text-xs font-semibold">
                        Confirm New Password *
                      </Label>
                      <Input
                        id="confPass"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        required
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 border border-slate-100 flex items-center gap-2">
                    <Lock className="size-4 text-purple-700 shrink-0" />
                    <span>
                      Changing your password will automatically re-verify hardware signatures on all branch POS terminals.
                    </span>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="submit"
                      className="text-white font-semibold cursor-pointer shadow-sm"
                      style={{ background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.deep})` }}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </SurfaceCard>
            </div>

            {/* 2FA & Security Testing Overview */}
            <div className="lg:col-span-5 space-y-4">
              <SurfaceCard
                title="Security Protocol & 2FA"
                description="Enhanced authentication safeguards"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-slate-900">
                        Two-Factor Authentication (2FA)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        SMS & Email OTP for critical price changes
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTwoFactorEnabled(!twoFactorEnabled)
                        toastSuccess(
                          `2FA ${!twoFactorEnabled ? 'Enabled' : 'Disabled'}`,
                        )
                      }}
                      className={`h-7 text-xs font-bold ${
                        twoFactorEnabled
                          ? 'bg-purple-50 text-purple-900 border-purple-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-slate-900">
                        Session Timeout Auto-Lock
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Lock POS after 15 minutes of idle time
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                      15 mins
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70">
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-slate-900">
                        Hardware Signature Binding
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Only verified MAC & UUID devices allowed
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                      Enforced
                    </Badge>
                  </div>
                </div>
              </SurfaceCard>
            </div>
          </div>
        </MotionReveal>
      )}

      {/* TAB 2: ALL SYSTEM ACCESS (HARDWARE TERMINALS) */}
      {activeTab === 'systems' && (
        <MotionReveal delay={0.1}>
          <div className="space-y-4">
            {/* Systems Status Header Chips */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl bg-white border border-border px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs">
                <Monitor className="size-4 text-purple-600" />
                <span>Total Registered Systems: <strong>{systems.length}</strong></span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-2 text-xs font-semibold text-emerald-900">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Active & Authorized: <strong>{activeCount}</strong></span>
              </div>
              {blockedCount > 0 && (
                <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 px-3.5 py-2 text-xs font-semibold text-rose-900">
                  <Ban className="size-4 text-rose-600" />
                  <span>Blocked Systems: <strong>{blockedCount}</strong></span>
                </div>
              )}
            </div>

            {/* List of System Devices */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {systems.map((sys) => {
                const isActive = sys.status === 'active'

                return (
                  <div
                    key={sys.id}
                    className={`rounded-2xl border bg-white p-5 shadow-xs transition-all flex flex-col justify-between space-y-3.5 ${
                      isActive ? 'border-border hover:border-purple-200' : 'border-rose-200 bg-rose-50/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex size-9 items-center justify-center rounded-xl text-white ${
                              isActive ? 'bg-purple-900' : 'bg-rose-600'
                            }`}
                          >
                            <Cpu className="size-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{sys.deviceName}</h4>
                            <span className="text-[11px] text-slate-500 font-medium">
                              Branch: {sys.branch}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant="outline"
                          className={
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold text-[11px]'
                              : 'bg-rose-50 text-rose-700 border-rose-200 font-bold text-[11px]'
                          }
                        >
                          {isActive ? 'Active' : 'Blocked'}
                        </Badge>
                      </div>

                      {/* Hardware Signature Details */}
                      <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">
                            Hardware Signature (UUID)
                          </span>
                          <span className="font-mono text-purple-950 font-bold text-[11px]">
                            {sys.hardwareSignature}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span><strong>User ID / Name:</strong></span>
                          <span>{sys.userName}</span>
                        </div>

                        <div className="flex items-center justify-between text-slate-600 text-[11px]">
                          <span><strong>IP & MAC Address:</strong></span>
                          <span className="font-mono text-slate-800">
                            {sys.ipAddress} · {sys.macAddress}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-400 text-[10px] pt-1 border-t border-slate-200/50">
                          <span>Last Activity:</span>
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            <Clock className="size-3" />
                            {sys.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Block Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[11px] text-slate-400">
                        {isActive ? 'Authorized workstation terminal' : 'Terminal access revoked'}
                      </span>

                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handlePromptBlockSystem(sys)}
                        className="h-8 text-xs font-semibold cursor-pointer text-white shadow-xs"
                        style={{ background: isActive ? BRAND.deep : BRAND.purple }}
                      >
                        {isActive ? (
                          <>
                            <Ban className="mr-1 size-3.5" />
                            Block System
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-1 size-3.5" />
                            Unblock & Authorize
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </MotionReveal>
      )}

      {/* Confirmation Modal for Block / Unblock */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={targetSystem?.status === 'active' ? 'text-purple-950 flex items-center gap-2' : 'text-purple-900 flex items-center gap-2'}>
              {targetSystem?.status === 'active' ? (
                <>
                  <Ban className="size-5 text-purple-700" />
                  Block System Access
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-5 text-purple-700" />
                  Authorize System Access
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              {targetSystem?.status === 'active' ? (
                <>
                  Are you sure you want to block <strong>&quot;{targetSystem?.deviceName}&quot;</strong>?
                  <br />
                  <span className="font-mono text-[11px] text-slate-500 mt-1 block">UUID: {targetSystem?.hardwareSignature}</span>
                  This workstation terminal will immediately be disconnected and blocked from accessing the system.
                </>
              ) : (
                <>
                  Are you sure you want to unblock and authorize <strong>&quot;{targetSystem?.deviceName}&quot;</strong>?
                  <br />
                  <span className="font-mono text-[11px] text-slate-500 mt-1 block">UUID: {targetSystem?.hardwareSignature}</span>
                  This workstation terminal will regain full POS and dashboard operational access.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmToggleBlock}
              className="text-white font-semibold cursor-pointer shadow-sm"
              style={{ background: targetSystem?.status === 'active' ? BRAND.deep : BRAND.purple }}
            >
              {targetSystem?.status === 'active' ? 'Yes, Block System' : 'Yes, Authorize System'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SettingsPage
