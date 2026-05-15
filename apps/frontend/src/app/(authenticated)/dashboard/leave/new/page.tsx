import { Suspense } from "react"
import { LeaveRequestWizard } from "@/features/leave/components/LeaveRequestWizard"
import { Loader2 } from "lucide-react"

export default function NewLeavePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Request Leave</h1>
        <p className="text-sm text-muted-foreground">Complete all steps to submit your leave request.</p>
      </div>
      <Suspense fallback={<div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
        <LeaveRequestWizard />
      </Suspense>
    </div>
  )
}
