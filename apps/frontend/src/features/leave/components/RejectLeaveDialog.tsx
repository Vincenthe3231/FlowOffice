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
import type { LeaveRequest } from "@/features/leave/types"

interface RejectLeaveDialogProps {
  leaveRequest: LeaveRequest | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isPending: boolean
  onReject: (params: { leaveId: number; level: number; reason: string }) => void
}

export function RejectLeaveDialog({
  leaveRequest,
  open,
  onOpenChange,
  isPending,
  onReject,
}: RejectLeaveDialogProps) {
  const [reason, setReason] = useState("")
  const [touched, setTouched] = useState(false)
  const reasonError = touched && reason.trim().length < 5 ? "Reason must be at least 5 characters." : undefined

  if (!leaveRequest) return null

  const nextPendingApproval = [...leaveRequest.approvals]
    .sort((a, b) => a.level - b.level)
    .find((a) => a.status === "pending")

  function handleReject() {
    setTouched(true)
    if (reason.trim().length < 5 || !leaveRequest || !nextPendingApproval) return
    onReject({
      leaveId: leaveRequest.id,
      level: nextPendingApproval.level,
      reason: reason.trim(),
    })
  }

  function handleOpenChange(o: boolean) {
    if (!o) { setReason(""); setTouched(false) }
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Leave Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">Employee: </span>
              <span className="font-medium">{leaveRequest.submittedByDisplay ?? "—"}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Type: </span>
              <span className="font-medium">{leaveRequest.leaveTypeName}</span>
            </p>
            <p>
              <span className="text-muted-foreground">Duration: </span>
              <span className="font-medium">
                {leaveRequest.totalDays} day{leaveRequest.totalDays !== 1 ? "s" : ""}
              </span>
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reject-reason">
              Rejection reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Provide a reason for rejection…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              rows={3}
              className={reasonError ? "border-destructive" : ""}
            />
            {reasonError && (
              <p className="text-xs text-destructive" role="alert">
                {reasonError}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={isPending || !nextPendingApproval}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
