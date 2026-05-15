"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Clock, CheckCircle2, XCircle, Trash2, FileText } from "lucide-react"
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

const FILTER_ICONS: Record<LeaveFilter, React.ComponentType<{ className?: string }>> = {
  All: FileText,
  Pending: Clock,
  Approved: CheckCircle2,
  Rejected: XCircle,
  Cancelled: Trash2,
  Draft: FileText,
}

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
  // Defensive client-side filter: ensures correct rows even if API ignores status param
  const filteredLeaves = filter === "All"
    ? leaves
    : leaves.filter((l) => l.status === filter.toLowerCase())

  function handleCancel() {
    if (!cancelTarget) return
    cancelMutation.mutate(cancelTarget.id, {
      onSuccess: () => setCancelTarget(null),
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Filter requests</p>
        <div className="w-full overflow-x-auto pb-1">
        <div className="inline-flex rounded-lg border border-border/40 bg-muted/30 p-1 gap-1 min-w-max">
          {LEAVE_FILTERS.map((f) => {
            const Icon = FILTER_ICONS[f]
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                  filter === f
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{f}</span>
              </button>
            )
          })}
        </div>
        </div>
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
            ) : filteredLeaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground text-sm">
                  {filter === "All" ? "No leave requests found." : `No ${filter.toLowerCase()} requests.`}
                </TableCell>
              </TableRow>
            ) : (
              filteredLeaves.map((leave) => (
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
