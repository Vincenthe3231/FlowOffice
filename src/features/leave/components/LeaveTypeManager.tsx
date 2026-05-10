"use client"

import { useState } from "react"
import { Pencil, Trash2, Loader2, Plus, Gift } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { LeaveTypeFormDialog } from "@/features/leave/components/LeaveTypeFormDialog"
import { OilGrantDialog } from "@/features/leave/components/OilGrantDialog"
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
} from "@/features/leave/hooks/useLeave"
import { LEAVE_STEP_KIND_LABELS } from "@/features/leave/data"
import type { LeaveType } from "@/features/leave/types"
import type { CreateLeaveTypePayload } from "@/shared/lib/api-client/leave"

export function LeaveTypeManager() {
  const { data: leaveTypes = [], isLoading } = useLeaveTypes()
  const createMutation = useCreateLeaveType()
  const updateMutation = useUpdateLeaveType()
  const deleteMutation = useDeleteLeaveType()

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<LeaveType | undefined>(undefined)
  const [deleteTarget, setDeleteTarget] = useState<LeaveType | null>(null)
  const [oilGrantOpen, setOilGrantOpen] = useState(false)

  function handleSave(payload: CreateLeaveTypePayload) {
    if (editTarget) {
      updateMutation.mutate(
        { id: editTarget.id, data: payload },
        { onSuccess: () => { setFormOpen(false); setEditTarget(undefined) } }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => setFormOpen(false),
      })
    }
  }

  function handleEdit(lt: LeaveType) {
    setEditTarget(lt)
    setFormOpen(true)
  }

  function handleDelete() {
    if (!deleteTarget) return
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Leave Types</h2>
          <p className="text-sm text-muted-foreground">
            Configure leave types, quotas, and approval chains.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setOilGrantOpen(true)}
          >
            <Gift className="h-4 w-4" />
            Grant OIL
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => { setEditTarget(undefined); setFormOpen(true) }}
          >
            <Plus className="h-4 w-4" />
            New type
          </Button>
        </div>
      </div>

      {leaveTypes.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No leave types configured yet.
        </p>
      ) : (
        <div className="rounded-lg border border-border divide-y divide-border">
          {leaveTypes.map((lt) => (
            <div key={lt.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <p className="font-medium text-foreground">{lt.name}</p>
                  {!lt.isActive && (
                    <Badge variant="outline" className="text-xs">Inactive</Badge>
                  )}
                  {lt.requiresAttachment && (
                    <Badge variant="secondary" className="text-xs">Attachment required</Badge>
                  )}
                </div>
                {lt.description && (
                  <p className="text-xs text-muted-foreground mb-1.5">{lt.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>
                    Quota:{" "}
                    <span className="font-medium text-foreground">
                      {lt.annualQuota != null ? `${lt.annualQuota} days/yr` : "Manual / unlimited"}
                    </span>
                  </span>
                  <span>
                    Approval chain:{" "}
                    <span className="font-medium text-foreground">
                      {lt.approvalChain
                        .map((s) => LEAVE_STEP_KIND_LABELS[s.role] ?? s.role)
                        .join(" → ")}
                    </span>
                  </span>
                  {lt.durationThreshold != null && lt.durationThresholdRole != null && (
                    <span>
                      Threshold:{" "}
                      <span className="font-medium text-foreground">
                        {lt.durationThreshold}+ days adds{" "}
                        {LEAVE_STEP_KIND_LABELS[lt.durationThresholdRole]}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleEdit(lt)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(lt)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <LeaveTypeFormDialog
        open={formOpen}
        onOpenChange={(o) => { setFormOpen(o); if (!o) setEditTarget(undefined) }}
        initialValues={editTarget}
        onSave={handleSave}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      <AlertDialog open={deleteTarget != null} onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete leave type?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting &quot;{deleteTarget?.name}&quot; may affect existing leave records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OilGrantDialog open={oilGrantOpen} onOpenChange={setOilGrantOpen} />
    </div>
  )
}
