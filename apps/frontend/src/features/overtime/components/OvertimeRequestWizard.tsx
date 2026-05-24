"use client"

import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollDatePicker } from "@/components/ui/ScrollDatePicker"
import { useCreateOvertimeRequest } from "@/features/overtime/hooks/useOvertime"

interface OvertimeRequestWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OvertimeRequestWizard({ open, onOpenChange }: OvertimeRequestWizardProps) {
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [reason, setReason] = useState("")
  const [isUrgent, setIsUrgent] = useState(false)
  const [urgencyReason, setUrgencyReason] = useState("")

  const createMutation = useCreateOvertimeRequest()

  function resetForm() {
    setDate(undefined)
    setStartTime("")
    setEndTime("")
    setReason("")
    setIsUrgent(false)
    setUrgencyReason("")
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!date || !startTime || !endTime || !reason.trim()) return
    if (isUrgent && !urgencyReason.trim()) return

    const isoDate = date.toISOString().split("T")[0]!

    createMutation.mutate(
      {
        date: isoDate,
        startTime,
        endTime,
        reason: reason.trim(),
        isUrgent,
        urgencyReason: isUrgent ? urgencyReason.trim() : undefined,
      },
      {
        onSuccess: () => {
          resetForm()
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>New Overtime Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label>Date</Label>
            <ScrollDatePicker
              value={date}
              onChange={(d) => setDate(d)}
              placeholder="Select date"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ot-start-time">Start Time</Label>
              <Input
                id="ot-start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ot-end-time">End Time</Label>
              <Input
                id="ot-end-time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ot-reason">Reason</Label>
            <Textarea
              id="ot-reason"
              placeholder="Describe the reason for overtime..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Mark as Urgent</p>
              <p className="text-xs text-muted-foreground">Flag this request as time-sensitive</p>
            </div>
            <Switch
              checked={isUrgent}
              onCheckedChange={setIsUrgent}
              aria-label="Mark as urgent"
            />
          </div>

          {isUrgent && (
            <div className="space-y-2">
              <Label htmlFor="ot-urgency-reason">
                Urgency Reason{" "}
                <span className="text-xs text-muted-foreground font-normal">
                  (Required for urgent requests)
                </span>
              </Label>
              <Textarea
                id="ot-urgency-reason"
                placeholder="Explain why this overtime is urgent..."
                value={urgencyReason}
                onChange={(e) => setUrgencyReason(e.target.value)}
                rows={2}
                required={isUrgent}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createMutation.isPending ||
                !date ||
                !startTime ||
                !endTime ||
                !reason.trim() ||
                (isUrgent && !urgencyReason.trim())
              }
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting…
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
