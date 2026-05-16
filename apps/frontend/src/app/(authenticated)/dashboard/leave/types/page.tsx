import { PageHeader } from "@/components/shared/PageHeader";
import { LeaveTypeManager } from "@/features/leave/components/LeaveTypeManager"

export default function LeaveTypesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Types"
        subtitle="Configure leave categories and policies."
      />
      <LeaveTypeManager />
    </div>
  )
}
