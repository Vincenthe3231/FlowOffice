"use client"

import { useState } from "react"
import { Loader2, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApproveLeaveDialog } from "@/features/leave/components/ApproveLeaveDialog"
import { RejectLeaveDialog } from "@/features/leave/components/RejectLeaveDialog"
import { useAllLeavesForApproval, useApproveRejectLeave } from "@/features/leave/hooks/useLeave"
import { LEAVE_DAY_TYPE_LABELS } from "@/features/leave/data"
import type { LeaveRequest } from "@/features/leave/types"

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved": return "default"
    case "pending": return "secondary"
    case "rejected":
    case "cancelled": return "destructive"
    default: return "outline"
  }
}

export function LeaveApprovalQueue() {
  const [search, setSearch] = useState("")
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null)
  const { data: leaves = [], isLoading } = useAllLeavesForApproval()
  const approveReject = useApproveRejectLeave()

  const filtered = search.trim()
    ? leaves.filter((l) =>
        (l.submittedByDisplay ?? "").toLowerCase().includes(search.toLowerCase()) ||
        l.leaveTypeName.toLowerCase().includes(search.toLowerCase())
      )
    : leaves

  function handleApprove(params: { leaveId: number; level: number; reason?: string }) {
    approveReject.mutate(
      { leaveId: params.leaveId, level: params.level, action: "approved", reason: params.reason },
      { onSuccess: () => setApproveTarget(null) }
    )
  }

  function handleReject(params: { leaveId: number; level: number; reason: string }) {
    approveReject.mutate(
      { leaveId: params.leaveId, level: params.level, action: "rejected", reason: params.reason },
      { onSuccess: () => setRejectTarget(null) }
    )
  }

  const canAct = (leave: LeaveRequest) =>
    leave.status === "pending" &&
    leave.approvals.some((a) => a.status === "pending")

  return (
    <div className="space-y-3">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by employee or type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[160px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-sm">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.submittedByDisplay ?? "—"}</TableCell>
                  <TableCell>{leave.leaveTypeName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {leave.startDate}
                    {leave.startDate !== leave.endDate ? ` – ${leave.endDate}` : ""}
                    <span className="ml-1 text-xs">
                      ({LEAVE_DAY_TYPE_LABELS[leave.dayType] ?? leave.dayType})
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">
                    {leave.totalDays}d
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(leave.status)} className="capitalize">
                      {leave.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {canAct(leave) && (
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setApproveTarget(leave)}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setRejectTarget(leave)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ApproveLeaveDialog
        leaveRequest={approveTarget}
        open={approveTarget != null}
        onOpenChange={(o) => { if (!o) setApproveTarget(null) }}
        isPending={approveReject.isPending}
        onApprove={handleApprove}
      />
      <RejectLeaveDialog
        leaveRequest={rejectTarget}
        open={rejectTarget != null}
        onOpenChange={(o) => { if (!o) setRejectTarget(null) }}
        isPending={approveReject.isPending}
        onReject={handleReject}
      />
    </div>
  )
}
