import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/shared/PageHeader'
import { MotionHeader, MotionReveal } from '@/components/shared/MotionReveal'
import { StaffLeavesTab } from '@/components/feature/branch/staff/StaffLeavesTab'
import { apiClient } from '@/api/api'
import { endpoints } from '@/api/endpoints'

export function LeavesPage() {
  const [designations, setDesignations] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const [resDesig, resStaff] = await Promise.all([
      apiClient.get(endpoints.branch.designations.list, { limit: 100 }),
      apiClient.get(endpoints.branch.staff.list, { limit: 100, status: 'active' }),
    ])
    setLoading(false)

    if (resDesig.success) {
      setDesignations(resDesig.data.items || resDesig.data || [])
    }
    if (resStaff.success) {
      setStaff(resStaff.data.items || resStaff.data || [])
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  return (
    <div className="space-y-6 pb-8">
      <MotionHeader>
        <PageHeader
          eyebrow="Roster Operations"
          title="Leave Management"
          description="Approve and record leave requests for single or multiple employees."
        />
      </MotionHeader>

      <MotionReveal>
        {loading ? (
          <p className="text-center py-8 text-slate-400">Loading leave roster...</p>
        ) : (
          <StaffLeavesTab designations={designations} staff={staff} />
        )}
      </MotionReveal>
    </div>
  )
}
export default LeavesPage
