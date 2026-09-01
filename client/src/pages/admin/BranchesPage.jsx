import { useState } from 'react'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NativeSelect } from '@/components/ui/select'
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
import { INITIAL_BRANCHES_DATA } from '@/data/adminBranchesMock'
import {
  Plus,
  Search,
  Building2,
  MapPin,
  Mail,
  Phone,
  User,
  ShieldAlert,
  ShieldCheck,
  Edit2,
  Ban,
  CheckCircle,
  Users,
  Store,
  SlidersHorizontal,
} from 'lucide-react'

export function BranchesPage() {
  const [branches, setBranches] = useState(INITIAL_BRANCHES_DATA)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'open' | 'blocked'
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)

  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)
  const [targetBranch, setTargetBranch] = useState(null)

  // Form State for Add / Edit Branch
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    image: '',
    managerName: '',
    managerEmail: '',
    managerContact: '',
    managerOtherContact: '',
    managerGender: 'Male',
    managerAddress: '',
  })

  // Open Add Modal
  function handleOpenAdd() {
    const nextId = `BR-00${branches.length + 1}`
    setFormData({
      name: '',
      location: '',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60',
      managerName: '',
      managerEmail: '',
      managerContact: '',
      managerOtherContact: '',
      managerGender: 'Male',
      managerAddress: '',
    })
    setEditingBranch(null)
    setAddDialogOpen(true)
  }

  // Open Edit Modal
  function handleOpenEdit(b) {
    setEditingBranch(b)
    setFormData({
      name: b.name,
      location: b.location,
      image: b.image || '',
      managerName: b.manager.name,
      managerEmail: b.manager.email,
      managerContact: b.manager.contact,
      managerOtherContact: b.manager.otherContact || '',
      managerGender: b.manager.gender || 'Male',
      managerAddress: b.manager.address || '',
    })
    setAddDialogOpen(true)
  }

  // Open Prompt for Branch Block / Open Status
  function handlePromptToggleStatus(branch) {
    setTargetBranch(branch)
    setConfirmStatusOpen(true)
  }

  // Confirm Branch Block / Open Status
  function handleConfirmToggleStatus() {
    if (!targetBranch) return
    const isCurrentlyOpen = targetBranch.status === 'open'
    const nextStatus = isCurrentlyOpen ? 'blocked' : 'open'

    setBranches((prev) =>
      prev.map((b) => {
        if (b.id === targetBranch.id) {
          return {
            ...b,
            status: nextStatus,
            monthlySales: nextStatus === 'blocked' ? 'Rs. 0 (Blocked)' : 'Rs. 3.20 M',
          }
        }
        return b
      }),
    )

    toastSuccess(
      `Branch ${targetBranch.name} is now ${nextStatus === 'blocked' ? 'BLOCKED' : 'OPEN & Active'}`,
    )
    setTargetBranch(null)
    setConfirmStatusOpen(false)
  }

  // Submit Add / Edit Form
  function handleSubmitBranch(e) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.location.trim()) {
      toastError('Please fill in Branch Name and Location')
      return
    }
    if (!formData.managerName.trim() || !formData.managerEmail.trim()) {
      toastError('Please fill in Branch Manager Name and Email')
      return
    }

    if (editingBranch) {
      // Edit existing
      setBranches((prev) =>
        prev.map((b) => {
          if (b.id === editingBranch.id) {
            return {
              ...b,
              name: formData.name.trim(),
              location: formData.location.trim(),
              image: formData.image || b.image,
              manager: {
                ...b.manager,
                name: formData.managerName.trim(),
                email: formData.managerEmail.trim(),
                contact: formData.managerContact.trim(),
                otherContact: formData.managerOtherContact.trim(),
                gender: formData.managerGender,
                address: formData.managerAddress.trim(),
              },
            }
          }
          return b
        }),
      )
      toastSuccess('Branch updated successfully')
    } else {
      // Add new branch
      const now = new Date()
      const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      const newId = `BR-00${branches.length + 1}`

      const newBranch = {
        id: newId,
        name: formData.name.trim(),
        location: formData.location.trim(),
        createdAt: formattedDate,
        status: 'open',
        image: formData.image || 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500&auto=format&fit=crop&q=60',
        manager: {
          name: formData.managerName.trim(),
          email: formData.managerEmail.trim(),
          contact: formData.managerContact.trim() || '+92 300 0000000',
          otherContact: formData.managerOtherContact.trim(),
          gender: formData.managerGender,
          address: formData.managerAddress.trim(),
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        },
        totalStaff: 10,
        activeTerminals: 2,
        monthlySales: 'Rs. 0 (New)',
      }

      setBranches((prev) => [newBranch, ...prev])
      toastSuccess(
        `New branch created! Login credentials & online login details sent to ${formData.managerEmail.trim()}`,
      )
    }

    setAddDialogOpen(false)
  }

  // Filtered branches
  const filteredBranches = branches.filter((b) => {
    const matchesSearch =
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.manager.name.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ? true : b.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 pb-8">
      <MotionHeader>
        <PageHeader
          eyebrow="Network Infrastructure"
          title="Manage Branches"
          description="Consolidated branch network, branch manager assignments, locations & access statuses"
          actions={
            <Button
              type="button"
              onClick={handleOpenAdd}
              className="text-white shadow-xs cursor-pointer font-semibold"
              style={{ background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.deep})` }}
            >
              <Plus className="mr-1.5 size-4" />
              Add New Branch
            </Button>
          }
        />
      </MotionHeader>

      {/* Filter & Search Bar */}
      <MotionReveal delay={0.05}>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Branch Name, ID, Location, or Manager..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-slate-50/70 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-purple-300 focus:bg-white focus:ring-1 focus:ring-purple-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Status:</span>
            <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-white text-purple-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({branches.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('open')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'open'
                    ? 'bg-white text-purple-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Open ({branches.filter((b) => b.status === 'open').length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('blocked')}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'blocked'
                    ? 'bg-white text-purple-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Blocked ({branches.filter((b) => b.status === 'blocked').length})
              </button>
            </div>
          </div>
        </div>
      </MotionReveal>

      {/* List of Branches */}
      <MotionReveal delay={0.1}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredBranches.map((b) => {
            const isOpen = b.status === 'open'

            return (
              <div
                key={b.id}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-xs hover:border-purple-200 transition-all flex flex-col justify-between"
              >
                {/* Card Header & Branch Info */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img
                        src={b.image}
                        alt={b.name}
                        className="size-14 shrink-0 rounded-xl object-cover border border-slate-100 shadow-2xs"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                            {b.id}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              isOpen
                                ? 'bg-purple-50 text-purple-900 border-purple-200 font-bold'
                                : 'bg-slate-100 text-slate-700 border-slate-300 font-bold'
                            }
                          >
                            {isOpen ? (
                              <CheckCircle className="mr-1 size-3 text-purple-700" />
                            ) : (
                              <Ban className="mr-1 size-3 text-slate-500" />
                            )}
                            {isOpen ? 'Open & Active' : 'Blocked'}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base mt-1">{b.name}</h4>
                        <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin className="size-3.5 text-slate-400 shrink-0" />
                          <span>{b.location}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Branch Manager Details Block */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-slate-200/70 pb-2">
                      <span className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">
                        Branch Manager Details
                      </span>
                      <span className="text-slate-400 text-[11px]">Est. {b.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={b.manager.image}
                        alt={b.manager.name}
                        className="size-10 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {b.manager.name}
                          </p>
                          <span className="text-[10px] bg-slate-200/80 text-slate-700 px-1.5 py-0.2 rounded font-medium">
                            {b.manager.gender}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Mail className="size-3 text-slate-400" />
                          <span>{b.manager.email}</span>
                        </p>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                          <Phone className="size-3 text-slate-400" />
                          <span>{b.manager.contact}</span>
                          {b.manager.otherContact && (
                            <span className="text-slate-400">/ {b.manager.otherContact}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {b.manager.address && (
                      <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/50 truncate">
                        <strong>Address:</strong> {b.manager.address}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 sm:px-5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <Users className="size-3.5 text-slate-400" />
                    <span>{b.totalStaff} Staff</span>
                    <span className="text-slate-300">·</span>
                    <span>{b.activeTerminals} POS</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(b)}
                      className="h-8 text-xs cursor-pointer border-purple-200 text-purple-900 hover:bg-purple-50"
                    >
                      <Edit2 className="mr-1 size-3.5" />
                      Edit
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handlePromptToggleStatus(b)}
                      className="h-8 text-xs font-semibold cursor-pointer text-white shadow-xs"
                      style={{ background: isOpen ? BRAND.deep : BRAND.purple }}
                    >
                      {isOpen ? (
                        <>
                          <Ban className="mr-1 size-3.5" />
                          Block Branch
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-1 size-3.5" />
                          Open Branch
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </MotionReveal>

      {/* Add / Edit Branch Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBranch ? 'Edit Branch Details' : 'Add New Branch'}
            </DialogTitle>
            <DialogDescription>
              {editingBranch
                ? 'Update branch location, manager contacts and details.'
                : 'Register a new branch. The manager will automatically receive their login credentials via email.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBranch} className="space-y-4 pt-2">
            {/* Branch Details Section */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-slate-100 pb-1">
                1. Branch Information
              </h5>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="branchName" className="text-xs">Branch Name *</Label>
                  <Input
                    id="branchName"
                    placeholder="e.g. Abbottabad Supply Branch"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="branchLocation" className="text-xs">Location / City *</Label>
                  <Input
                    id="branchLocation"
                    placeholder="e.g. Mansehra Road, Abbottabad"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Manager Details Section */}
            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-slate-100 pb-1">
                2. Branch Manager Assignment
              </h5>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="mgrName" className="text-xs">Manager Name *</Label>
                  <Input
                    id="mgrName"
                    placeholder="e.g. Farhan Ali"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mgrEmail" className="text-xs">Manager Email * (Login Details will be emailed)</Label>
                  <Input
                    id="mgrEmail"
                    type="email"
                    placeholder="e.g. farhan.ali@fluxone.b2b"
                    value={formData.managerEmail}
                    onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mgrContact" className="text-xs">Primary Contact Number *</Label>
                  <Input
                    id="mgrContact"
                    placeholder="+92 300 1234567"
                    value={formData.managerContact}
                    onChange={(e) => setFormData({ ...formData, managerContact: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mgrOtherContact" className="text-xs">Other Contact Number (Optional)</Label>
                  <Input
                    id="mgrOtherContact"
                    placeholder="+92 321 7654321"
                    value={formData.managerOtherContact}
                    onChange={(e) => setFormData({ ...formData, managerOtherContact: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="mgrGender" className="text-xs">Gender</Label>
                  <NativeSelect
                    id="mgrGender"
                    value={formData.managerGender}
                    onChange={(e) => setFormData({ ...formData, managerGender: e.target.value })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </NativeSelect>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="mgrAddress" className="text-xs">Manager Residential Address</Label>
                  <Input
                    id="mgrAddress"
                    placeholder="e.g. House 12, Sector C, Abbottabad"
                    value={formData.managerAddress}
                    onChange={(e) => setFormData({ ...formData, managerAddress: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white"
                style={{ background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.deep})` }}
              >
                {editingBranch ? 'Save Changes' : 'Save & Send Login Details'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Branch Status Confirmation Modal */}
      <Dialog open={confirmStatusOpen} onOpenChange={setConfirmStatusOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-950 flex items-center gap-2">
              {targetBranch?.status === 'open' ? (
                <>
                  <Ban className="size-5 text-purple-700" />
                  Block Branch Access
                </>
              ) : (
                <>
                  <CheckCircle className="size-5 text-purple-700" />
                  Open & Activate Branch
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              {targetBranch?.status === 'open' ? (
                <>
                  Are you sure you want to block <strong>&quot;{targetBranch?.name}&quot;</strong> ({targetBranch?.id})?
                  <br />
                  All POS terminals, cashier checkouts, and staff logins for this branch will immediately be disabled.
                </>
              ) : (
                <>
                  Are you sure you want to open and activate <strong>&quot;{targetBranch?.name}&quot;</strong> ({targetBranch?.id})?
                  <br />
                  This branch will be re-enabled and POS terminals will resume transaction processing.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmStatusOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmToggleStatus}
              className="text-white font-semibold cursor-pointer shadow-sm"
              style={{ background: targetBranch?.status === 'open' ? BRAND.deep : BRAND.purple }}
            >
              {targetBranch?.status === 'open' ? 'Yes, Block Branch' : 'Yes, Open Branch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BranchesPage
