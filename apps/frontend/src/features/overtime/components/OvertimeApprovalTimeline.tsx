"use client"

import { Check, Clock, X, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { OvertimeApprovalApi } from "@/features/overtime/types"

interface OvertimeApprovalTimelineProps {
  approvals: OvertimeApprovalApi[]
  overtimeStatus: string
  submittedDate?: string
}

function formatTimestamp(value: string | undefined | null): string {
  if (value == null || String(value).trim() === "") return "—"
  const s = String(value).trim()
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function stepLabel(approval: OvertimeApprovalApi): string {
  const kindLabels: Record<string, string> = {
    hod: "Head of Department",
    hr_admin: "HR Admin",
    top_management: "Top Management",
  }
  return kindLabels[approval.stepKind] ?? `Level ${approval.level}`
}

function statusBg(status: string): string {
  if (status === "approved") return "bg-green-500"
  if (status === "rejected") return "bg-destructive"
  if (status === "pending") return "bg-amber-500"
  return "bg-muted-foreground/40"
}

function PendingSpinner() {
  return (
    <div
      className="h-[9px] w-[9px] box-border rounded-full border-[1.5px] border-dashed border-white/95 animate-spin motion-reduce:animate-none"
      style={{ animationDuration: "1.25s" }}
      aria-hidden
    />
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <Check className="h-3.5 w-3.5 text-primary-foreground" />
  if (status === "rejected") return <X className="h-3.5 w-3.5 text-primary-foreground" />
  if (status === "pending") return <PendingSpinner />
  return <Clock className="h-3.5 w-3.5 text-primary-foreground" />
}

function isTerminal(status: string): boolean {
  const s = String(status).toLowerCase()
  return s === "rejected" || s === "cancelled"
}

export function OvertimeApprovalTimeline({
  approvals,
  overtimeStatus,
  submittedDate,
}: OvertimeApprovalTimelineProps) {
  const sorted = [...approvals].sort((a, b) => a.level - b.level)
  const visibleSorted = isTerminal(overtimeStatus)
    ? sorted.filter((a) => a.status !== "pending")
    : sorted

  const lastDecision = [...sorted]
    .filter((a) => a.decidedAt && (a.status === "approved" || a.status === "rejected"))
    .sort((a, b) => new Date(b.decidedAt!).getTime() - new Date(a.decidedAt!).getTime())[0]

  return (
    <Card className="border-0 rounded-xl overflow-hidden shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Approval Pipeline
          </p>
        </div>

        <div className="relative ml-1 space-y-4">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-border/30" />

          <div className="flex items-start gap-3 relative z-10">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md">
              <Check className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Submitted</p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {formatTimestamp(submittedDate)}
              </p>
            </div>
          </div>

          {visibleSorted.map((approval) => (
            <div key={approval.id} className="flex items-start gap-3 relative z-10">
              <div
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md",
                  statusBg(approval.status),
                  approval.status === "pending" && "shadow-[0_0_10px_rgba(245,158,11,0.35)]"
                )}
                {...(approval.status === "pending"
                  ? { role: "status" as const, "aria-label": "Pending review" }
                  : {})}
              >
                <StatusIcon status={approval.status} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {stepLabel(approval)}
                </p>
                {approval.status === "pending" && approval.eligibleApprovers.length > 0 && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Eligible: {approval.eligibleApprovers.map((e) => e.name).join(", ")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground tabular-nums">
                  {approval.status === "pending"
                    ? `Awaiting review · ${formatTimestamp(submittedDate)}`
                    : approval.status === "approved"
                      ? `Approved · ${formatTimestamp(approval.decidedAt)}`
                      : `Rejected · ${formatTimestamp(approval.decidedAt)}`}
                </p>
                {approval.approver && approval.status !== "pending" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {approval.approver.name}
                  </p>
                )}
                {approval.rejectionReason && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    &quot;{approval.rejectionReason}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}

          {String(overtimeStatus).toLowerCase() === "approved" && (
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Fully Approved</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatTimestamp(lastDecision?.decidedAt ?? submittedDate)}
                </p>
              </div>
            </div>
          )}

          {isTerminal(overtimeStatus) && !sorted.some((a) => a.status === "rejected") && (
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md">
                <X className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">
                  {String(overtimeStatus).toLowerCase() === "cancelled"
                    ? "Overtime Cancelled"
                    : "Overtime Rejected"}
                </p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatTimestamp(lastDecision?.decidedAt ?? submittedDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
