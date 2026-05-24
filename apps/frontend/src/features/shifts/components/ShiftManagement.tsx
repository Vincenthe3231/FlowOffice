"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react"
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
import { PageHeader } from "@/components/shared/PageHeader"
import { ShiftFormDialog } from "@/features/shifts/components/ShiftFormDialog"
import { ShiftAssignmentPanel } from "@/features/shifts/components/ShiftAssignmentPanel"
import { MyShiftCard } from "@/features/shifts/components/MyShiftCard"
import { useShifts, useDeleteShift } from "@/features/shifts/hooks/useShifts"
import type { ShiftApi } from "@/features/shifts/types"
import { useAuth } from "@/shared/hooks/useAuth"
import { useProfile } from "@/features/profile/hooks/useProfile"
import {
  ROLE_HR_ADMIN,
  ROLE_HOD,
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
} from "@/shared/constants/roles"
import { cn } from "@/lib/utils"

function isHod(role?: string | null, roles?: string[] | null): boolean {
  if (role === ROLE_HOD) return true
  if (roles?.includes(ROLE_HOD)) return true
  return false
}

function isStaff(role?: string | null, roles?: string[] | null): boolean {
  const nonStaff = [
    ROLE_HR_ADMIN,
    ROLE_HOD,
    ROLE_TOP_MANAGEMENT,
    ROLE_SUPER_ADMIN_LEGACY,
  ] as string[]
  if (role && nonStaff.includes(role)) return false
  if (roles?.some((r) => nonStaff.includes(r))) return false
  return true
}

function statusBadgeClass(status: string): string {
  return status === "active"
    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    : "bg-muted text-muted-foreground border-border"
}

export function ShiftManagement() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const role = profile?.role
  const roles = user?.roles

  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ShiftApi | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ShiftApi | null>(null)
  const [assignmentPanel, setAssignmentPanel] = useState<{ id: number; name: string } | null>(null)

  const { data: shifts = [], isLoading } = useShifts()
  const deleteMutation = useDeleteShift()

  // Staff: show only personal shift card
  if (isStaff(role, roles)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Shift Schedule"
          subtitle="View your current shift assignment"
        />
        <MyShiftCard />
      </div>
    )
  }

  // HOD: read-only view of shifts (for reference); no CRUD
  if (isHod(role, roles)) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Shift Schedules"
          subtitle="View shift schedules for your department"
        />
        <ShiftTable
          shifts={shifts as ShiftApi[]}
          isLoading={isLoading}
          readOnly
          onAssignments={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
        />
      </div>
    )
  }

  // HR Admin / Top Management: full CRUD
  return (
    <div className="space-y-6">
      <PageHeader
        title="Shift Management"
        subtitle="Create and manage shift schedules for your organisation"
        action={
          <Button
            className="gap-1.5"
            onClick={() => {
              setEditTarget(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            Add Shift
          </Button>
        }
      />

      <ShiftTable
        shifts={shifts as ShiftApi[]}
        isLoading={isLoading}
        readOnly={false}
        onAssignments={(shift) => setAssignmentPanel({ id: shift.id, name: shift.name })}
        onEdit={(shift) => {
          setEditTarget(shift)
          setFormOpen(true)
        }}
        onDelete={(shift) => setDeleteTarget(shift)}
      />

      <ShiftFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o)
          if (!o) setEditTarget(null)
        }}
        editShift={editTarget}
      />

      {assignmentPanel && (
        <ShiftAssignmentPanel
          shiftId={assignmentPanel.id}
          shiftName={assignmentPanel.name}
          open={assignmentPanel != null}
          onOpenChange={(o) => { if (!o) setAssignmentPanel(null) }}
        />
      )}

      <AlertDialog
        open={deleteTarget != null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete shift &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              This shift will be permanently deleted. Existing assignments may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return
                deleteMutation.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                })
              }}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ShiftTable({
  shifts,
  isLoading,
  readOnly,
  onEdit,
  onDelete,
  onAssignments,
}: {
  shifts: ShiftApi[]
  isLoading: boolean
  readOnly: boolean
  onEdit: (shift: ShiftApi) => void
  onDelete: (shift: ShiftApi) => void
  onAssignments: (shift: ShiftApi) => void
}) {
  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (shifts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No shifts defined yet.{!readOnly && " Click \"Add Shift\" to create the first one."}
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
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>End</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Status</TableHead>
                {!readOnly && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell className="font-mono text-xs">{shift.code}</TableCell>
                  <TableCell className="whitespace-nowrap">{shift.startTime}</TableCell>
                  <TableCell className="whitespace-nowrap">{shift.endTime}</TableCell>
                  <TableCell>
                    {shift.color ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="h-5 w-5 rounded-full border border-border"
                          style={{ backgroundColor: shift.color }}
                        />
                        <span className="font-mono text-xs text-muted-foreground">
                          {shift.color}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold capitalize",
                        statusBadgeClass(shift.status)
                      )}
                    >
                      {shift.status}
                    </span>
                  </TableCell>
                  {!readOnly && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="View assignments"
                          onClick={() => onAssignments(shift)}
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit shift"
                          onClick={() => onEdit(shift)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          title="Delete shift"
                          onClick={() => onDelete(shift)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
