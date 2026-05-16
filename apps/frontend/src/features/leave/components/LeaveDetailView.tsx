"use client"

import Link from "next/link"
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LeaveApprovalTimeline } from "@/features/leave/components/LeaveApprovalTimeline"
import { useLeaveById, useCancelLeaveRequest } from "@/features/leave/hooks/useLeave"
import { LEAVE_DAY_TYPE_LABELS } from "@/features/leave/data"
import { getStatusColorConfig } from "@/shared/lib/status-colors-utils"
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

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved": return "default"
    case "pending": return "secondary"
    case "rejected":
    case "cancelled": return "destructive"
    default: return "outline"
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

interface LeaveDetailViewProps {
  leaveId: number
}

export function LeaveDetailView({ leaveId }: LeaveDetailViewProps) {
  const { data: leave, isLoading, isError, error, refetch } = useLeaveById(leaveId)
  const cancelMutation = useCancelLeaveRequest()
  const [cancelOpen, setCancelOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !leave) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-medium text-destructive">
          {isError ? extractError(error).message : "Could not load leave request."}
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
          Retry
        </Button>
        <Button variant="link" className="mt-2 block px-0" asChild>
          <Link href="/dashboard/leave">Back to Leave</Link>
        </Button>
      </div>
    )
  }

  const canCancel = leave.status === "pending"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" asChild>
          <Link href="/dashboard/leave">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card/50 p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{leave.leaveTypeName}</h2>
            {leave.submittedByDisplay && (
              <p className="text-sm text-muted-foreground">{leave.submittedByDisplay}</p>
            )}
          </div>
          {(() => {
            const colorConfig = getStatusColorConfig(leave.status)
            return (
              <span className={cn(
                "inline-flex items-center rounded-md border border-border px-2.5 py-0.5 text-xs font-semibold capitalize w-fit",
                colorConfig.text,
                colorConfig.bg
              )}>
                {leave.status}
              </span>
            )
          })()}
        </div>

        <div className="grid gap-0 sm:grid-cols-2 sm:gap-x-8">
          <div>
            <DetailRow
              label="Dates"
              value={
                <>
                  {leave.startDate}
                  {leave.startDate !== leave.endDate ? ` – ${leave.endDate}` : ""}
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({LEAVE_DAY_TYPE_LABELS[leave.dayType] ?? leave.dayType})
                  </span>
                </>
              }
            />
            <DetailRow
              label="Duration"
              value={`${leave.totalDays} day${leave.totalDays !== 1 ? "s" : ""}`}
            />
            <DetailRow label="Reason" value={leave.reason || "—"} />
            <DetailRow
              label="Submitted"
              value={
                leave.submittedAt
                  ? new Date(leave.submittedAt).toLocaleDateString(undefined, { dateStyle: "medium" })
                  : "—"
              }
            />
          </div>

          <div>
            {leave.attachments.length > 0 && (
              <div className="py-2.5 border-b border-border/60">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                  Attachments
                </p>
                <div className="space-y-1">
                  {leave.attachments.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      {a.originalName ?? `Attachment ${a.id}`}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {leave.approvals.length > 0 && (
        <LeaveApprovalTimeline
          approvals={leave.approvals}
          leaveStatus={leave.status}
          submittedDate={leave.submittedAt}
          variant="vertical"
        />
      )}

      <div className="flex flex-wrap gap-2">
        {canCancel && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setCancelOpen(true)}
          >
            Cancel request
          </Button>
        )}
        {leave.status === "rejected" && (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={`/dashboard/leave/new?leaveTypeId=${leave.leaveTypeId}`}>
              Re-apply
            </Link>
          </Button>
        )}
      </div>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this leave request?</AlertDialogTitle>
            <AlertDialogDescription>
              Your {leave.leaveTypeName} request will be cancelled. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Keep request</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                cancelMutation.mutate(leave.id, { onSuccess: () => setCancelOpen(false) })
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
