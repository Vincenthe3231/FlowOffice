"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useCreateShift, useUpdateShift } from "@/features/shifts/hooks/useShifts"
import type { ShiftApi } from "@/features/shifts/types"

function slugify(name: string): string {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20)
}

interface ShiftFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editShift?: ShiftApi | null
}

export function ShiftFormDialog({ open, onOpenChange, editShift }: ShiftFormDialogProps) {
  const isEdit = editShift != null

  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [color, setColor] = useState("#6366f1")
  const [isActive, setIsActive] = useState(true)

  useEffect(() => {
    if (editShift) {
      setName(editShift.name)
      setCode(editShift.code)
      setStartTime(editShift.startTime)
      setEndTime(editShift.endTime)
      setColor(editShift.color ?? "#6366f1")
      setIsActive(editShift.status === "active")
    } else {
      setName("")
      setCode("")
      setStartTime("")
      setEndTime("")
      setColor("#6366f1")
      setIsActive(true)
    }
  }, [editShift, open])

  // Auto-generate code from name when not editing
  useEffect(() => {
    if (!isEdit) {
      setCode(slugify(name))
    }
  }, [name, isEdit])

  const createMutation = useCreateShift()
  const updateMutation = useUpdateShift()

  const isPending = createMutation.isPending || updateMutation.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: name.trim(),
      code: code.trim(),
      startTime,
      endTime,
      color,
      status: (isActive ? "active" : "inactive") as "active" | "inactive",
    }

    if (isEdit && editShift) {
      updateMutation.mutate(
        { id: editShift.id, data: payload },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Shift" : "Add Shift"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="shift-name">Name</Label>
            <Input
              id="shift-name"
              placeholder="e.g. Morning Shift"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift-code">Code</Label>
            <Input
              id="shift-code"
              placeholder="e.g. MORNING"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shift-start">Start Time</Label>
              <Input
                id="shift-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shift-end">End Time</Label>
              <Input
                id="shift-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift-color">Color</Label>
            <div className="flex items-center gap-3">
              <input
                id="shift-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent p-0.5"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#6366f1"
                className="flex-1 font-mono text-sm"
                maxLength={7}
              />
            </div>
          </div>

          {isEdit && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">Inactive shifts cannot be assigned</p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                aria-label="Shift active status"
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEdit ? "Saving…" : "Creating…"}
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                "Create Shift"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
