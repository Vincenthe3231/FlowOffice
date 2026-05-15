"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useGrantOilDays } from "@/features/leave/hooks/useLeave"

interface OilGrantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OilGrantDialog({ open, onOpenChange }: OilGrantDialogProps) {
  const [userId, setUserId] = useState("")
  const [days, setDays] = useState("")
  const [reason, setReason] = useState("")
  const [touched, setTouched] = useState(false)
  const grantOil = useGrantOilDays()

  const userIdNum = parseInt(userId, 10)
  const daysNum = parseFloat(days)
  const errors = {
    userId: touched && (userId === "" || Number.isNaN(userIdNum)) ? "User ID is required" : undefined,
    days: touched && (days === "" || Number.isNaN(daysNum) || daysNum < 0.5) ? "Minimum 0.5 days" : undefined,
    reason: touched && reason.trim().length < 1 ? "Reason is required" : undefined,
  }
  const hasErrors = Object.values(errors).some(Boolean)

  function handleSubmit() {
    setTouched(true)
    if (hasErrors || Number.isNaN(userIdNum) || Number.isNaN(daysNum)) return
    grantOil.mutate(
      { userId: userIdNum, days: daysNum, reason: reason.trim() },
      {
        onSuccess: () => {
          setUserId(""); setDays(""); setReason(""); setTouched(false)
          onOpenChange(false)
        },
      }
    )
  }

  function handleOpenChange(o: boolean) {
    if (!o) { setUserId(""); setDays(""); setReason(""); setTouched(false) }
    onOpenChange(o)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Grant OFF-IN-LIEU Days</DialogTitle>
          <DialogDescription>
            Manually credit OIL days to an employee&apos;s balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="oil-user-id">User ID</Label>
            <Input
              id="oil-user-id"
              type="number"
              min={1}
              placeholder="Employee user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={errors.userId ? "border-destructive" : ""}
            />
            {errors.userId && (
              <p className="text-xs text-destructive" role="alert">
                {errors.userId}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oil-days">Days to grant</Label>
            <Input
              id="oil-days"
              type="number"
              min={0.5}
              step={0.5}
              placeholder="e.g. 1 or 0.5"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={errors.days ? "border-destructive" : ""}
            />
            {errors.days && (
              <p className="text-xs text-destructive" role="alert">
                {errors.days}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oil-reason">Reason</Label>
            <Textarea
              id="oil-reason"
              placeholder="Why are OIL days being granted?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className={errors.reason ? "border-destructive" : ""}
            />
            {errors.reason && (
              <p className="text-xs text-destructive" role="alert">
                {errors.reason}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={grantOil.isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={grantOil.isPending}>
            {grantOil.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Grant OIL Days"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
