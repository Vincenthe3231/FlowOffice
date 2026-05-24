"use client"

import { useState } from "react"
import { Plus, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/shared/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OvertimeRequestWizard } from "@/features/overtime/components/OvertimeRequestWizard"
import { OvertimeDetailView } from "@/features/overtime/components/OvertimeDetailView"
import {
  useMyOvertimeRequests,
  useAllOvertimeForApproval,
  useApproveOvertime,
  useRejectOvertime,
} from "@/features/overtime/hooks/useOvertime"
import {
  isOvertimePending,
  isEligibleForOvertimeApproval,
} from "@/features/overtime/types"
import type { OvertimeRequestApi } from "@/features/overtime/types"
import { useAuth } from "@/shared/hooks/useAuth"
import { useProfile } from "@/features/profile/hooks/useProfile"
import {
  ROLE_HOD,
  ROLE_HR_ADMIN,
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
} from "@/shared/constants/roles"
import { cn } from "@/lib/utils"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const APPROVER_ROLES = [
  ROLE_HOD,
  ROLE_HR_ADMIN,
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
] as const

function isApproverRole(role?: string | null, roles?: string[] | null): boolean {
  const arr = APPROVER_ROLES as readonly string[]
  if (role && arr.includes(role)) return true
  if (roles?.some((r) => arr.includes(r))) return true
  return false
}

function statusColorClass(status: string): string {
  switch (status) {
    case "approved":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    case "pending_l1":
    case "pending_l2":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/35"
    case "rejected":
      return "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30"
    case "cancelled":
      return "bg-muted text-muted-foreground border-border"
    default:
      return "bg-muted text-muted-foreground border-border"
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "pending_l1":
      return "Pending L1"
    case "pending_l2":
      return "Pending L2"
    default:
      return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        statusColorClass(status)
      )}
    >
      {statusLabel(status)}
    </span>
  )
}

interface RejectDialogState {
  id: number
  reason: string
}

export function OvertimeManagement() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [rejectState, setRejectState] = useState<RejectDialogState | null>(null)
  const [approveTargetId, setApproveTargetId] = useState<number | null>(null)

  const { user } = useAuth()
  const { profile } = useProfile()

  const canApprove = isApproverRole(profile?.role, user?.roles)
  const currentUserId = user?.id as number | undefined

  const { data: myRequests = [], isLoading: myLoading } = useMyOvertimeRequests()
  const { data: allRequests = [], isLoading: allLoading } = useAllOvertimeForApproval(
    undefined
  )

  const approveMutation = useApproveOvertime()
  const rejectMutation = useRejectOvertime()

  if (detailId != null) {
    return (
      <OvertimeDetailView
        overtimeId={detailId}
        onBack={() => setDetailId(null)}
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overtime Management"
        subtitle="Submit and manage overtime requests"
        action={
          <Button onClick={() => setWizardOpen(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New OT Request
          </Button>
        }
      />

      <OvertimeRequestWizard open={wizardOpen} onOpenChange={setWizardOpen} />

      {canApprove ? (
        <Tabs defaultValue="my-requests">
          <TabsList>
            <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            <TabsTrigger value="approvals">Pending Approvals</TabsTrigger>
          </TabsList>

          <TabsContent value="my-requests" className="mt-4">
            <MyRequestsTable
              requests={myRequests}
              isLoading={myLoading}
              onViewDetail={setDetailId}
            />
          </TabsContent>

          <TabsContent value="approvals" className="mt-4">
            <ApprovalQueueTable
              requests={allRequests}
              isLoading={allLoading}
              currentUserId={currentUserId}
              onViewDetail={setDetailId}
              onApprove={setApproveTargetId}
              onReject={(id) => setRejectState({ id, reason: "" })}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <MyRequestsTable
          requests={myRequests}
          isLoading={myLoading}
          onViewDetail={setDetailId}
        />
      )}

      {/* Approve confirm dialog */}
      <AlertDialog
        open={approveTargetId != null}
        onOpenChange={(o) => { if (!o) setApproveTargetId(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve overtime request?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will approve the selected overtime request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={approveMutation.isPending}
              onClick={() => {
                if (approveTargetId == null) return
                approveMutation.mutate(
                  { id: approveTargetId, data: {} },
                  { onSuccess: () => setApproveTargetId(null) }
                )
              }}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Approve"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog
        open={rejectState != null}
        onOpenChange={(o) => { if (!o) setRejectState(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject overtime request?</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 pb-2 space-y-2">
            <Label htmlFor="ot-reject-reason">Rejection Reason</Label>
            <Input
              id="ot-reject-reason"
              placeholder="Enter reason..."
              value={rejectState?.reason ?? ""}
              onChange={(e) =>
                setRejectState((s) => s ? { ...s, reason: e.target.value } : null)
              }
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={rejectMutation.isPending || !rejectState?.reason?.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!rejectState?.reason?.trim()) return
                rejectMutation.mutate(
                  {
                    id: rejectState.id,
                    data: { rejectionReason: rejectState.reason.trim() },
                  },
                  { onSuccess: () => setRejectState(null) }
                )
              }}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function MyRequestsTable({
  requests,
  isLoading,
  onViewDetail,
}: {
  requests: OvertimeRequestApi[]
  isLoading: boolean
  onViewDetail: (id: number) => void
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No overtime requests yet. Click &quot;New OT Request&quot; to get started.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Urgent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.startTime}</TableCell>
                  <TableCell className="whitespace-nowrap">{r.endTime}</TableCell>
                  <TableCell>{r.durationHours}h</TableCell>
                  <TableCell className="max-w-[180px] truncate">{r.reason}</TableCell>
                  <TableCell>
                    {r.isUrgent ? (
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Urgent
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetail(r.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function ApprovalQueueTable({
  requests,
  isLoading,
  currentUserId,
  onViewDetail,
  onApprove,
  onReject,
}: {
  requests: OvertimeRequestApi[]
  isLoading: boolean
  currentUserId: number | undefined
  onViewDetail: (id: number) => void
  onApprove: (id: number) => void
  onReject: (id: number) => void
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No overtime requests pending approval.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Urgent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((r) => {
                const canAct = isEligibleForOvertimeApproval(r, currentUserId)
                return (
                  <TableRow key={r.id}>
                    <TableCell>{r.user?.name ?? `User #${r.userId}`}</TableCell>
                    <TableCell className="whitespace-nowrap">{r.date}</TableCell>
                    <TableCell>{r.durationHours}h</TableCell>
                    <TableCell>
                      {r.isUrgent ? (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-xs font-medium">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Urgent
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail(r.id)}
                        >
                          View
                        </Button>
                        {canAct && isOvertimePending(r.status) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              onClick={() => onApprove(r.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => onReject(r.id)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
