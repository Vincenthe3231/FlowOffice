"use client"

import { Fragment } from "react"
import { Check, Clock, X, ShieldCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { LeaveApproval, LeaveApprovalStepKind } from "@/features/leave/types"
import { LEAVE_STEP_KIND_LABELS } from "@/features/leave/data"

interface LeaveApprovalTimelineProps {
  approvals: LeaveApproval[]
  leaveStatus: string
  submittedDate?: string
  variant?: "vertical" | "horizontal"
}

function approvalRowLabel(approval: LeaveApproval): string {
  if (approval.stepKind && LEAVE_STEP_KIND_LABELS[approval.stepKind as LeaveApprovalStepKind]) {
    return LEAVE_STEP_KIND_LABELS[approval.stepKind as LeaveApprovalStepKind]
  }
  return `Level ${approval.level}`
}

function isLeaveRejectedOrCancelled(status: string): boolean {
  const s = String(status).toLowerCase()
  return s === "rejected" || s === "cancelled"
}

function visibleApprovalsForPipeline(sorted: LeaveApproval[], leaveStatus: string): LeaveApproval[] {
  if (!isLeaveRejectedOrCancelled(leaveStatus)) return sorted
  return sorted.filter((a) => a.status !== "pending")
}

export function formatPipelineTimestamp(value: string | undefined | null): string {
  if (value == null || String(value).trim() === "") return "—"
  const s = String(value).trim()
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  const looksLikeDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(s)
  if (looksLikeDateOnly) {
    return d.toLocaleDateString(undefined, { dateStyle: "medium" })
  }
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })
}

function PendingInnerSpinner({ size }: { size: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-[14px] w-[14px] border-2" : "h-[9px] w-[9px] border-[1.5px]"
  return (
    <div
      className={cn(
        "box-border rounded-full border-dashed border-white/95 animate-spin motion-reduce:animate-none",
        dim
      )}
      style={{ animationDuration: "1.25s" }}
      aria-hidden
    />
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === "approved") return <Check className="h-3.5 w-3.5 text-primary-foreground" />
  if (status === "rejected") return <X className="h-3.5 w-3.5 text-primary-foreground" />
  if (status === "pending") return <PendingInnerSpinner size="sm" />
  return <Clock className="h-3.5 w-3.5 text-primary-foreground" />
}

function statusBg(status: string) {
  if (status === "approved") return "bg-green-500"
  if (status === "rejected") return "bg-destructive"
  if (status === "pending") return "bg-amber-500"
  return "bg-muted-foreground/40"
}

function timestampForApprovalStep(
  approval: LeaveApproval,
  sorted: LeaveApproval[],
  submittedDate?: string
): string {
  if (approval.status === "approved" || approval.status === "rejected") {
    return formatPipelineTimestamp(approval.decidedAt ?? submittedDate)
  }
  if (approval.level <= 1) return formatPipelineTimestamp(submittedDate)
  const prev = sorted.find((a) => a.level === approval.level - 1)
  if (prev?.decidedAt) return formatPipelineTimestamp(prev.decidedAt)
  return formatPipelineTimestamp(submittedDate)
}

type StepTone = "done" | "pending" | "awaiting" | "rejected"

interface PipelineStep {
  id: string
  label: string
  badge: string
  tone: StepTone
  timestamp: string
}

function buildPipelineSteps(
  sorted: LeaveApproval[],
  leaveStatus: string,
  submittedDate: string | undefined,
  lastDecisionAt: string | null | undefined
): PipelineStep[] {
  const rowsForSteps = visibleApprovalsForPipeline(sorted, leaveStatus)
  const steps: PipelineStep[] = [
    {
      id: "submitted",
      label: "Submitted",
      badge: "Completed",
      tone: "done",
      timestamp: formatPipelineTimestamp(submittedDate),
    },
  ]

  for (const approval of rowsForSteps) {
    let badge = "Awaiting"
    let tone: StepTone = "awaiting"
    if (approval.status === "approved") { badge = "Completed"; tone = "done" }
    else if (approval.status === "pending") { badge = "Pending"; tone = "pending" }
    else if (approval.status === "rejected") { badge = "Rejected"; tone = "rejected" }
    steps.push({
      id: `level-${approval.id}`,
      label: approvalRowLabel(approval),
      badge,
      tone,
      timestamp: timestampForApprovalStep(approval, sorted, submittedDate),
    })
  }

  const statusLower = String(leaveStatus).toLowerCase()
  if (statusLower === "approved") {
    steps.push({
      id: "terminal-approved",
      label: "Fully Approved",
      badge: "Approved",
      tone: "done",
      timestamp: formatPipelineTimestamp(lastDecisionAt ?? submittedDate),
    })
  } else if (statusLower === "cancelled") {
    steps.push({
      id: "terminal-cancelled",
      label: "Leave Cancelled",
      badge: "Cancelled",
      tone: "rejected",
      timestamp: formatPipelineTimestamp(lastDecisionAt ?? submittedDate),
    })
  }

  return steps
}

function badgeClass(tone: StepTone) {
  switch (tone) {
    case "done":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    case "pending":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/35"
    case "rejected":
      return "bg-rose-500/15 text-rose-800 dark:text-rose-200 border-rose-500/35"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function connectorClass(leftTone: StepTone) {
  if (leftTone === "done") return "bg-emerald-500/60"
  if (leftTone === "pending") return "bg-amber-500/50"
  if (leftTone === "rejected") return "bg-rose-500/50"
  return "bg-border"
}

function HorizontalPipeline({ steps }: { steps: PipelineStep[] }) {
  if (steps.length === 0) return null
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-min w-full max-w-full items-start justify-center px-0.5">
        {steps.map((step, index) => (
          <Fragment key={step.id}>
            {index > 0 ? (
              <div
                className={cn(
                  "mt-[13px] h-0.5 min-w-[20px] flex-1 max-w-[100px] shrink",
                  connectorClass(steps[index - 1]!.tone)
                )}
                aria-hidden
              />
            ) : null}
            <div className="flex w-[92px] shrink-0 flex-col items-center sm:w-[108px]">
              {step.tone === "pending" ? (
                <div
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-amber-500 bg-amber-500 shadow-[0_0_14px_rgba(245,158,11,0.4)] ring-2 ring-background"
                  role="status"
                  aria-label="Pending review"
                >
                  <PendingInnerSpinner size="lg" />
                </div>
              ) : (
                <div
                  className={cn(
                    "flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 shadow-md ring-2 ring-background",
                    step.tone === "done" && "border-emerald-500 bg-emerald-500 text-white",
                    step.tone === "rejected" && "border-rose-600 bg-rose-600 text-white",
                    step.tone === "awaiting" && "border-muted-foreground/40 bg-muted text-muted-foreground"
                  )}
                >
                  {step.tone === "done" ? (
                    <Check className="h-3 w-3" strokeWidth={3} />
                  ) : step.tone === "rejected" ? (
                    <X className="h-3 w-3" strokeWidth={3} />
                  ) : (
                    <Clock className="h-3 w-3 opacity-60" />
                  )}
                </div>
              )}
              <p className="mt-2 text-center text-[11px] font-semibold leading-tight text-foreground sm:text-xs">
                {step.label}
              </p>
              <span
                className={cn(
                  "mt-1 inline-flex min-h-[26px] min-w-[4.75rem] max-w-[min(100%,7.5rem)] items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-center text-[9px] font-bold uppercase leading-none tracking-wide",
                  badgeClass(step.tone)
                )}
              >
                {step.badge}
              </span>
              <p className="mt-1.5 max-w-[100px] text-center text-[10px] leading-tight text-muted-foreground tabular-nums">
                {step.timestamp}
              </p>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

export function LeaveApprovalTimeline({
  approvals,
  leaveStatus,
  submittedDate,
  variant = "vertical",
}: LeaveApprovalTimelineProps) {
  const sorted = [...approvals].sort((a, b) => a.level - b.level)
  const visibleSorted = visibleApprovalsForPipeline(sorted, leaveStatus)

  const lastDecision = [...sorted]
    .filter((a) => a.decidedAt && (a.status === "approved" || a.status === "rejected"))
    .sort((a, b) => new Date(b.decidedAt!).getTime() - new Date(a.decidedAt!).getTime())[0]

  const rejectedApproval = sorted.find((a) => a.status === "rejected")

  const steps = buildPipelineSteps(
    sorted,
    leaveStatus,
    submittedDate,
    lastDecision?.decidedAt ?? null
  )

  if (variant === "horizontal") {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <CardContent className="p-4 sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Approval pipeline
            </p>
          </div>
          <HorizontalPipeline steps={steps} />
        </CardContent>
      </Card>
    )
  }

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
                {formatPipelineTimestamp(submittedDate)}
              </p>
            </div>
          </div>

          {visibleSorted.map((approval) => (
            <div key={approval.id} className="flex items-start gap-3 relative z-10">
              <div
                className={`w-4 h-4 rounded-full ${statusBg(approval.status)} flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md ${approval.status === "pending" ? "shadow-[0_0_10px_rgba(245,158,11,0.35)]" : ""}`}
                {...(approval.status === "pending"
                  ? { role: "status" as const, "aria-label": "Pending review" }
                  : {})}
              >
                <StatusIcon status={approval.status} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {approvalRowLabel(approval)}
                </p>
                {approval.status === "pending" &&
                  approval.stepKind === "top_management" &&
                  (approval.eligibleApprovers?.length ?? 0) > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Eligible:{" "}
                      {approval.eligibleApprovers?.map((e) => e.name ?? `#${e.id}`).join(", ")}
                    </p>
                  )}
                <p className="text-xs text-muted-foreground tabular-nums">
                  {approval.status === "pending"
                    ? `Awaiting review · ${timestampForApprovalStep(approval, sorted, submittedDate)}`
                    : approval.status === "approved"
                      ? `Approved · ${timestampForApprovalStep(approval, sorted, submittedDate)}`
                      : `Rejected · ${timestampForApprovalStep(approval, sorted, submittedDate)}`}
                </p>
                {approval.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    &quot;{approval.reason}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}

          {String(leaveStatus).toLowerCase() === "approved" && (
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Fully Approved</p>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {formatPipelineTimestamp(lastDecision?.decidedAt ?? submittedDate)}
                </p>
              </div>
            </div>
          )}

          {isLeaveRejectedOrCancelled(leaveStatus) &&
            !sorted.some((a) => a.status === "rejected") && (
              <div className="flex items-start gap-3 relative z-10">
                <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md">
                  <X className="h-2.5 w-2.5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {String(leaveStatus).toLowerCase() === "cancelled"
                      ? "Leave Cancelled"
                      : "Leave Rejected"}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {formatPipelineTimestamp(rejectedApproval?.decidedAt ?? submittedDate)}
                  </p>
                </div>
              </div>
            )}
        </div>
      </CardContent>
    </Card>
  )
}
