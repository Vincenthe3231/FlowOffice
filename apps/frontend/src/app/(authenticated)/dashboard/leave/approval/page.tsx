import { LeaveApprovalQueue } from "@/features/leave/components/LeaveApprovalQueue"

export default function LeaveApprovalPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leave Approval Queue</h1>
        <p className="text-sm text-muted-foreground">Review and action pending leave requests.</p>
      </div>
      <LeaveApprovalQueue />
    </div>
  )
}
