"use client"

import { Loader2, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OvertimeApprovalTimeline } from "@/features/overtime/components/OvertimeApprovalTimeline"
import { useOvertimeRequest, useCancelOvertimeRequest } from "@/features/overtime/hooks/useOvertime"
import { isOvertimePending } from "@/features/overtime/types"
import { extractError } from "@/shared/lib/api-client/response-handler"
import { cn } from "@/lib/utils"
import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

function statusColorClass(status: string): string {
  switch (status) {
    case "approved": return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    case "pending_l1":
    case "pending_l2": return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/35"
    case "rejected": return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
    case "cancelled": return "bg-muted text-muted-foreground border-border"
    default: return "bg-muted text-muted-foreground border-border"
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending_l1": return "Pending L1"
    case "pending_l2": return "Pending L2"
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5 border-b border-border/60 last:border-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
        {label}
      </p>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

interface OvertimeDetailViewProps {
  overtimeId: number
  onBack?: () => void
}

export function OvertimeDetailView({ overtimeId, onBack }: OvertimeDetailViewProps) {
  const { data: request, isLoading, isError, error, refetch } = useOvertimeRequest(overtimeId)
  const cancelMutation = useCancelOvertimeRequest()
  const [cancelOpen, setCancelOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !request) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">
          {isError ? extractError(error).message : "Could not load overtime request."}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
        {onBack && (
          <Button variant="link" className="mt-2 block px-0" onClick={onBack}>
            Back
          </Button>
        )}
      </div>
    )
  }

  const canCancel = isOvertimePending(request.status)

  return (
    <div className="space-y-6">
      {onBack && (
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={onBack}>
          Back
        </Button>
      )}

      <div className="rounded-xl border border-border bg-card/50 p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Overtime Request</h2>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold capitalize w-fit",
              statusColorClass(request.status)
            )}
          >
            {statusLabel(request.status)}
          </span>
        </div>

        <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-8">
          <div>
            <DetailRow label="Date" value={request.date} />
            <DetailRow
              label="Time"
              value={`${request.startTime} – ${request.endTime}`}
            />
            <DetailRow
              label="Duration"
              value={`${request.durationHours} hour${request.durationHours !== 1 ? "s" : ""}`}
            />
            <DetailRow label="Reason" value={request.reason || "—"} />
          </div>
          <div>
            {request.user && (
              <DetailRow label="Employee" value={request.user.name} />
            )}
            <DetailRow
              label="Urgent"
              value={
                request.isUrgent ? (
                  <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Yes
                  </span>
                ) : (
                  "No"
                )
              }
            />
            {request.isUrgent && request.urgencyReason && (
              <DetailRow label="Urgency Reason" value={request.urgencyReason} />
            )}
            <DetailRow
              label="Submitted"
              value={new Date(request.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            />
          </div>
        </div>
      </div>

      {(request.overtimeApprovals?.length ?? 0) > 0 && (
        <OvertimeApprovalTimeline
          approvals={request.overtimeApprovals!}
          overtimeStatus={request.status}
          submittedDate={request.createdAt}
        />
      )}

      {canCancel && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setCancelOpen(true)}
          >
            Cancel request
          </Button>
        </div>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this overtime request?</AlertDialogTitle>
            <AlertDialogDescription>
              Your overtime request will be cancelled. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Keep request</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                cancelMutation.mutate(request.id, {
                  onSuccess: () => {
                    setCancelOpen(false)
                    onBack?.()
                  },
                })
              }
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Cancel request"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
