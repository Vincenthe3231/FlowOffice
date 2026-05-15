"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { useMyLeaves, useCancelLeaveRequest } from "@/features/leave/hooks/useLeave"
import { LEAVE_FILTERS, LEAVE_DAY_TYPE_LABELS } from "@/features/leave/data"
import type { LeaveFilter, LeaveRequest } from "@/features/leave/types"
import { cn } from "@/lib/utils"

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved": return "default"
    case "pending": return "secondary"
    case "rejected":
    case "cancelled": return "destructive"
    default: return "outline"
  }
}

interface MyLeavesTableProps {
  initialFilter?: LeaveFilter
}

export function MyLeavesTable({ initialFilter = "All" }: MyLeavesTableProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<LeaveFilter>(initialFilter)
  const [cancelTarget, setCancelTarget] = useState<LeaveRequest | null>(null)
  const { data, isLoading } = useMyLeaves(filter)
  const cancelMutation = useCancelLeaveRequest()

  const leaves = data?.leaves ?? []

  function handleCancel() {
    if (!cancelTarget) return
    cancelMutation.mutate(cancelTarget.id, {
      onSuccess: () => setCancelTarget(null),
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {LEAVE_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              leaves.map((leave) => (
                <TableRow
                  key={leave.id}
                  className="cursor-pointer hover:bg-muted/60"
                  onClick={() => router.push(`/dashboard/leave/${leave.id}`)}
                >
                  <TableCell className="font-medium">{leave.leaveTypeName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {leave.startDate}
                    {leave.startDate !== leave.endDate ? ` – ${leave.endDate}` : ""}
                    <span className="ml-1.5 text-xs">
                      ({LEAVE_DAY_TYPE_LABELS[leave.dayType] ?? leave.dayType})
                    </span>
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">
                    {leave.totalDays} day{leave.totalDays !== 1 ? "s" : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(leave.status)} className="capitalize">
                      {leave.status}
                    </Badge>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    {leave.status === "pending" && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        onClick={() => setCancelTarget(leave)}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={cancelTarget != null} onOpenChange={(o) => { if (!o) setCancelTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel leave request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your {cancelTarget?.leaveTypeName} request from{" "}
              {cancelTarget?.startDate}
              {cancelTarget?.startDate !== cancelTarget?.endDate ? ` to ${cancelTarget?.endDate}` : ""}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelMutation.isPending}>Keep request</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
