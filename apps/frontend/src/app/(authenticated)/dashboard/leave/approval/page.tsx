import { LeaveApprovalQueue } from "@/features/leave/components/LeaveApprovalQueue"
import { PageHeader } from "@/components/shared/PageHeader"

export default function LeaveApprovalPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Approval Queue"
        subtitle="Review and action pending leave requests."
      />
      <LeaveApprovalQueue />
    </div>
  )
}
