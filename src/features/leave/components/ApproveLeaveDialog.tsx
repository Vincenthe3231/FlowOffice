"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { LeaveApprovalTimeline } from "@/features/leave/components/LeaveApprovalTimeline"
import { LEAVE_DAY_TYPE_LABELS } from "@/features/leave/data"
import type { LeaveRequest } from "@/features/leave/types"

interface ApproveLeaveDialogProps {
  leaveRequest: LeaveRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onApprove: (params: { leaveId: number; level: number; reason?: string }) => void
}

export function ApproveLeaveDialog({
  leaveRequest,
  open,
  onOpenChange,
  isPending,
  onApprove,
}: ApproveLeaveDialogProps) {
  const [comment, setComment] = useState("")

  if (!leaveRequest) return null

  const nextPendingApproval = [...leaveRequest.approvals]
    .sort((a, b) => a.level - b.level)
    .find((a) => a.status === "pending")

  function handleApprove() {
    if (!leaveRequest || !nextPendingApproval) return
    onApprove({
      leaveId: leaveRequest.id,
      level: nextPendingApproval.level,
      reason: comment.trim() || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Approve Leave Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
            <p>
              <span className="text-muted-foreground">Employee: </span>
              <span className="font-medium">{leaveRequest.submittedByDisplay ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Type: </span>
              <span className="font-medium">{leaveRequest.leaveTypeName}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Dates: </span>
              <span className="font-medium">
                {leaveRequest.startDate}
                {leaveRequest.startDate !== leaveRequest.endDate
                  ? ` – ${leaveRequest.endDate}`
                  : ""}
              </span>
              <span className="ml-2 text-muted-foreground">
                ({LEAVE_DAY_TYPE_LABELS[leaveRequest.dayType] ?? leaveRequest.dayType})
              </span>
            </p>
            <p>
              <span className="text-muted-foreground">Duration: </span>
              <span className="font-medium">
                {leaveRequest.totalDays} day{leaveRequest.totalDays !== 1 ? "s" : ""}
              </span>
            </p>
            {leaveRequest.reason && (
              <p>
                <span className="text-muted-foreground">Reason: </span>
                <span>{leaveRequest.reason}</span>
              </p>
            )}
          </div>

          {leaveRequest.approvals.length > 0 && (
            <LeaveApprovalTimeline
              approvals={leaveRequest.approvals}
              leaveStatus={leaveRequest.status}
              submittedDate={leaveRequest.submittedAt}
              variant="horizontal"
            />
          )}

          <div className="space-y-1.5">
            <Label htmlFor="approve-comment">Comment (optional)</Label>
            <Textarea
              id="approve-comment"
              placeholder="Add a note…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isPending || !nextPendingApproval}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
