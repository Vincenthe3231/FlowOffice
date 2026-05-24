"use client"

import { useState } from "react"
import { UserPlus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import {
  useShiftAssignments,
  useAssignUserToShift,
  useRemoveShiftAssignment,
} from "@/features/shifts/hooks/useShifts"
import type { UserShiftApi } from "@/features/shifts/types"

interface AssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shiftId: number
}

function AssignEmployeeDialog({ open, onOpenChange, shiftId }: AssignDialogProps) {
  const [userId, setUserId] = useState("")
  const [effectiveDate, setEffectiveDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const assignMutation = useAssignUserToShift()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numericUserId = parseInt(userId, 10)
    if (isNaN(numericUserId) || !effectiveDate) return
    assignMutation.mutate(
      {
        shiftId,
        data: {
          userId: numericUserId,
          effectiveDate,
          endDate: endDate || undefined,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          setUserId("")
          setEffectiveDate("")
          setEndDate("")
          setNotes("")
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Assign Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="assign-user-id">User ID</Label>
            <Input
              id="assign-user-id"
              type="number"
              placeholder="Enter employee user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assign-effective-date">Effective Date</Label>
            <Input
              id="assign-effective-date"
              type="date"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assign-end-date">
              End Date{" "}
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="assign-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assign-notes">
              Notes{" "}
              <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="assign-notes"
              placeholder="Any notes for this assignment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assignMutation.isPending}>
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Assigning…
                </>
              ) : (
                "Assign"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface ShiftAssignmentPanelProps {
  shiftId: number
  shiftName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ShiftAssignmentPanel({
  shiftId,
  shiftName,
  open,
  onOpenChange,
}: ShiftAssignmentPanelProps) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<number | null>(null)

  const { data: assignments = [], isLoading } = useShiftAssignments(shiftId)
  const removeMutation = useRemoveShiftAssignment()

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Assignments — {shiftName}</SheetTitle>
          </SheetHeader>

          <Button
            className="mb-4 gap-2"
            size="sm"
            onClick={() => setAssignDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Assign Employee
          </Button>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : assignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No employees assigned to this shift yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Effective</TableHead>
                    <TableHead>End</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(assignments as UserShiftApi[]).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{a.user.name}</p>
                          <p className="text-xs text-muted-foreground">{a.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(a.effectiveDate).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {a.endDate
                          ? new Date(a.endDate).toLocaleDateString(undefined, {
                              dateStyle: "medium",
                            })
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground">
                        {a.notes ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setRemoveTarget(a.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AssignEmployeeDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        shiftId={shiftId}
      />

      <AlertDialog
        open={removeTarget != null}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove assignment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the employee from this shift assignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removeMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={removeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget == null) return
                removeMutation.mutate(removeTarget, {
                  onSuccess: () => setRemoveTarget(null),
                })
              }}
            >
              {removeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Remove"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
