import { useState } from 'react'
import { SurfaceCard } from '@/components/shared/SurfaceCard'
import { PageHeader } from '@/components/shared/PageHeader'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import {
  INITIAL_COMPANY_DETAILS,
  INITIAL_POLICIES_DATA,
} from '@/data/adminCompanyMock'
import {
  Building2,
  Phone,
  Globe,
  Share2,
  MessageCircle,
  FileCheck,
  ShieldAlert,
  Plus,
  Search,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  FileText,
} from 'lucide-react'

export function CompanyPage() {
  const [activeTab, setActiveTab] = useState('details') // 'details' | 'policies'

  // Company Details Form State
  const [companyDetails, setCompanyDetails] = useState(INITIAL_COMPANY_DETAILS)

  // Policies State
  const [policies, setPolicies] = useState(INITIAL_POLICIES_DATA)
  const [policySearch, setPolicySearch] = useState('')
  const [policyDialogOpen, setPolicyDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState(null)
  const [policyForm, setPolicyForm] = useState({ name: '', detail: '', category: 'General' })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetPolicy, setDeleteTargetPolicy] = useState(null)

  // Save Company Details
  function handleSaveCompanyDetails(e) {
    e.preventDefault()
    toastSuccess('Company details and registration credentials saved successfully!')
  }

  // Open Add Policy Modal
  function handleOpenAddPolicy() {
    setEditingPolicy(null)
    setPolicyForm({ name: '', detail: '', category: 'Retail Operations' })
    setPolicyDialogOpen(true)
  }

  // Open Edit Policy Modal
  function handleOpenEditPolicy(policy) {
    setEditingPolicy(policy)
    setPolicyForm({
      name: policy.name,
      detail: policy.detail,
      category: policy.category || 'Retail Operations',
    })
    setPolicyDialogOpen(true)
  }

  // Trigger Delete Confirmation Prompt
  function handlePromptDelete(policy) {
    setDeleteTargetPolicy(policy)
    setDeleteConfirmOpen(true)
  }

  // Confirm Delete
  function handleConfirmDelete() {
    if (!deleteTargetPolicy) return
    setPolicies((prev) => prev.filter((p) => p.id !== deleteTargetPolicy.id))
    toastSuccess(`Policy "${deleteTargetPolicy.name}" deleted successfully`)
    setDeleteTargetPolicy(null)
    setDeleteConfirmOpen(false)
  }

  // Submit Policy Form
  function handleSubmitPolicy(e) {
    e.preventDefault()
    if (!policyForm.name.trim() || !policyForm.detail.trim()) {
      toastError('Please provide a policy name and description')
      return
    }

    if (editingPolicy) {
      setPolicies((prev) =>
        prev.map((p) =>
          p.id === editingPolicy.id
            ? {
                ...p,
                name: policyForm.name.trim(),
                detail: policyForm.detail.trim(),
                category: policyForm.category,
              }
            : p,
        ),
      )
      toastSuccess('Policy updated successfully')
    } else {
      const now = new Date()
      const formattedDate = `${now.toISOString().split('T')[0]} ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      const newPolicy = {
        id: `POL-0${policies.length + 1}`,
        name: policyForm.name.trim(),
        detail: policyForm.detail.trim(),
        category: policyForm.category,
        createdAt: formattedDate,
        isActive: true,
      }
      setPolicies((prev) => [newPolicy, ...prev])
      toastSuccess('New policy created and published to all branches')
    }

    setPolicyDialogOpen(false)
  }

  // Filtered Policies
  const filteredPolicies = policies.filter((p) =>
    p.name.toLowerCase().includes(policySearch.toLowerCase()) ||
    p.detail.toLowerCase().includes(policySearch.toLowerCase()),
  )

  return (
    <div className="space-y-6 pb-8">
      <MotionHeader>
        <PageHeader
          eyebrow="Corporate Identity & Governance"
          title="Company Details & Policies"
          description="Manage corporate entity profiles, social presence, tax registrations, and store policy handbooks"
        />
      </MotionHeader>

      {/* Main Tab Toggle */}
      <MotionReveal delay={0.05}>
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'details'
                ? 'bg-white text-purple-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="size-4" />
            Company Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('policies')}
            className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'policies'
                ? 'bg-white text-purple-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="size-4" />
            Policies & Governance ({policies.length})
          </button>
        </div>
      </MotionReveal>

      {/* TAB 1: COMPANY DETAILS */}
      {activeTab === 'details' && (
        <MotionReveal delay={0.1}>
          <SurfaceCard
            title="Company Information & Contact Channels"
            description="Official corporate registration details and customer service links displayed across invoices and receipts"
          >
            <form onSubmit={handleSaveCompanyDetails} className="space-y-5">
              {/* Logo & Name Section */}
              <div className="flex flex-col sm:flex-row items-start gap-4 pb-4 border-b border-slate-100">
                <img
                  src={companyDetails.logoUrl}
                  alt="Company Logo"
                  className="size-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor="companyName" className="text-xs font-semibold">
                    Registered Company Name *
                  </Label>
                  <Input
                    id="companyName"
                    value={companyDetails.name}
                    onChange={(e) =>
                      setCompanyDetails({ ...companyDetails, name: e.target.value })
                    }
                    placeholder="e.g. FluxOne Enterprise Solutions Ltd."
                    required
                  />
                  <p className="text-[11px] text-slate-400">
                    This name appears on wholesale supplier bills, tax invoices, and branch headers.
                  </p>
                </div>
              </div>

              {/* Contacts & Channels Grid */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contacts" className="text-xs font-semibold flex items-center gap-1.5">
                    <Phone className="size-3.5 text-purple-600" />
                    Official Contact Numbers *
                  </Label>
                  <Input
                    id="contacts"
                    value={companyDetails.contactNumbers}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        contactNumbers: e.target.value,
                      })
                    }
                    placeholder="+92 51 2223344, +92 300 1234567"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="whatsapp" className="text-xs font-semibold flex items-center gap-1.5">
                    <MessageCircle className="size-3.5 text-emerald-600" />
                    WhatsApp Customer Care (Optional)
                  </Label>
                  <Input
                    id="whatsapp"
                    value={companyDetails.whatsappNumber}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        whatsappNumber: e.target.value,
                      })
                    }
                    placeholder="+92 300 1234567"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="facebook" className="text-xs font-semibold flex items-center gap-1.5">
                    <Globe className="size-3.5 text-blue-600" />
                    Facebook Page Link (Optional URL)
                  </Label>
                  <Input
                    id="facebook"
                    type="url"
                    value={companyDetails.facebookUrl}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        facebookUrl: e.target.value,
                      })
                    }
                    placeholder="https://facebook.com/your-business"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="instagram" className="text-xs font-semibold flex items-center gap-1.5">
                    <Share2 className="size-3.5 text-pink-600" />
                    Instagram Page Link (Optional URL)
                  </Label>
                  <Input
                    id="instagram"
                    type="url"
                    value={companyDetails.instagramUrl}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        instagramUrl: e.target.value,
                      })
                    }
                    placeholder="https://instagram.com/your-business"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="taxReg" className="text-xs font-semibold flex items-center gap-1.5">
                    <FileCheck className="size-3.5 text-slate-700" />
                    Company Registration / NTN / Tax Identification Number (Optional)
                  </Label>
                  <Input
                    id="taxReg"
                    value={companyDetails.registrationTaxId}
                    onChange={(e) =>
                      setCompanyDetails({
                        ...companyDetails,
                        registrationTaxId: e.target.value,
                      })
                    }
                    placeholder="e.g. NTN-8923410-7 (FBR Registered)"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button
                  type="submit"
                  className="text-white font-semibold cursor-pointer gap-1.5 shadow-sm"
                  style={{ background: `linear-gradient(90deg, ${BRAND.purple}, ${BRAND.deep})` }}
                >
                  <Save className="size-4" />
                  Save Company Details
                </Button>
              </div>
            </form>
          </SurfaceCard>
        </MotionReveal>
      )}

      {/* TAB 2: POLICIES */}
      {activeTab === 'policies' && (
        <MotionReveal delay={0.1}>
          <div className="space-y-4">
            {/* Action & Search Bar */}
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search policies by name or keywords (e.g. Return, Credit, Expiry)..."
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50/70 py-2 pl-9 pr-4 text-xs sm:text-sm text-slate-900 outline-none focus:border-purple-300 focus:bg-white focus:ring-1 focus:ring-purple-300"
                />
              </div>

              <Button
                type="button"
                onClick={handleOpenAddPolicy}
                className="text-white font-semibold cursor-pointer"
                style={{ background: BRAND.purple }}
              >
                <Plus className="mr-1.5 size-4" />
                Add Policy
              </Button>
            </div>

            {/* List of Policies */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredPolicies.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-border bg-white p-5 shadow-xs hover:border-purple-200 transition-all flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {p.id}
                        </span>
                        <Badge variant="outline" className="text-[10px] text-slate-500 bg-slate-50 font-semibold">
                          {p.category}
                        </Badge>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {p.createdAt}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base mt-2">
                      {p.name}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed mt-1.5 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                      {p.detail}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditPolicy(p)}
                      className="h-8 text-xs cursor-pointer border-purple-200 text-purple-900 hover:bg-purple-50"
                    >
                      <Edit2 className="mr-1 size-3.5" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePromptDelete(p)}
                      className="h-8 text-xs text-purple-700 hover:bg-purple-50 hover:text-purple-950 cursor-pointer"
                    >
                      <Trash2 className="mr-1 size-3.5 text-purple-600" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </MotionReveal>
      )}

      {/* Delete Policy Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-purple-950 flex items-center gap-2">
              <Trash2 className="size-5 text-purple-700" />
              Delete Corporate Policy
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-1">
              Are you sure you want to delete <strong>&quot;{deleteTargetPolicy?.name}&quot;</strong> ({deleteTargetPolicy?.id})?
              <br />
              This action cannot be undone and will immediately unpublish this policy across all branch portals.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              className="text-white font-semibold cursor-pointer shadow-sm"
              style={{ background: BRAND.purple }}
            >
              Delete Policy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Policy Dialog */}
      <Dialog open={policyDialogOpen} onOpenChange={setPolicyDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPolicy ? 'Edit Policy' : 'Add New Corporate Policy'}
            </DialogTitle>
            <DialogDescription>
              Define customer return policies, wholesale terms, or branch compliance guidelines
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitPolicy} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="polName" className="text-xs font-semibold">
                Policy Name *
              </Label>
              <Input
                id="polName"
                placeholder="e.g. 7-Day Return & Replacement Policy"
                value={policyForm.name}
                onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="polCat" className="text-xs font-semibold">
                Category
              </Label>
              <Input
                id="polCat"
                placeholder="e.g. Retail Operations / Returns"
                value={policyForm.category}
                onChange={(e) => setPolicyForm({ ...policyForm, category: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="polDetail" className="text-xs font-semibold">
                Policy Details & Rules *
              </Label>
              <Textarea
                id="polDetail"
                rows={4}
                placeholder="Describe the conditions, timeframe, receipts required, and branch handling procedures..."
                value={policyForm.detail}
                onChange={(e) => setPolicyForm({ ...policyForm, detail: e.target.value })}
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPolicyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-white font-semibold"
                style={{ background: BRAND.purple }}
              >
                {editingPolicy ? 'Update Policy' : 'Save & Publish Policy'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default CompanyPage
