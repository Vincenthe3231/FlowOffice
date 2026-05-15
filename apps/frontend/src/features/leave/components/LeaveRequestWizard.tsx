"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { LeaveTypePickCard } from "@/features/leave/components/LeaveTypePickCard"
import { LeaveAttachmentZone } from "@/features/leave/components/LeaveAttachmentZone"
import { LeaveApprovalTimeline } from "@/features/leave/components/LeaveApprovalTimeline"
import { useLeaveDraftStore } from "@/features/leave/stores/useLeaveDraftStore"
import { useLeaveTypes, useMyLeaveBalance, useCreateLeaveRequest, useUploadLeaveAttachment } from "@/features/leave/hooks/useLeave"
import { previewLeaveApprovalsFromChain } from "@/features/leave/lib/approval-chain-preview"
import type { LeaveDayType } from "@/features/leave/types"

const STEPS = ["Leave type", "Dates", "Details", "Review"]

function calcTotalDays(
  startDate: string,
  endDate: string,
  dayType: LeaveDayType
): number {
  if (!startDate || !endDate) return 0
  if (dayType === "am" || dayType === "pm") return 0.5
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (end < start) return 0
  const diffMs = end.getTime() - start.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1
}

export function LeaveRequestWizard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLeaveTypeId = searchParams.get("leaveTypeId")

  const {
    currentStep,
    selectedLeaveTypeId,
    startDate,
    endDate,
    dayType,
    reason,
    attachmentFiles,
    setStep,
    setLeaveType,
    setDates,
    setDayType,
    setReason,
    addAttachmentFile,
    removeAttachmentFile,
    clearDraft,
  } = useLeaveDraftStore()

  const { data: leaveTypes = [], isLoading: typesLoading } = useLeaveTypes()
  const { data: balances = [] } = useMyLeaveBalance()
  const createLeave = useCreateLeaveRequest()
  const uploadAttachment = useUploadLeaveAttachment()

  const [attachmentError, setAttachmentError] = useState<string | undefined>()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (initialLeaveTypeId && !selectedLeaveTypeId) {
      setLeaveType(initialLeaveTypeId)
    }
  }, [initialLeaveTypeId, selectedLeaveTypeId, setLeaveType])

  const selectedType = useMemo(
    () => leaveTypes.find((t) => t.id === selectedLeaveTypeId) ?? null,
    [leaveTypes, selectedLeaveTypeId]
  )

  const totalDays = useMemo(
    () => calcTotalDays(startDate, endDate, dayType),
    [startDate, endDate, dayType]
  )

  const previewApprovals = useMemo(() => {
    if (!selectedType) return []
    return previewLeaveApprovalsFromChain(-1, selectedType, totalDays)
  }, [selectedType, totalDays])

  const balanceMap = useMemo(
    () => new Map(balances.map((b) => [b.leaveTypeId, b])),
    [balances]
  )

  function validateStep(step: number): string | null {
    if (step === 1 && !selectedLeaveTypeId) return "Please select a leave type."
    if (step === 2) {
      if (!startDate || !endDate) return "Please select start and end dates."
      if (new Date(endDate) < new Date(startDate)) return "End date must be on or after start date."
      if ((dayType === "am" || dayType === "pm") && startDate !== endDate) {
        return "Half-day leave must start and end on the same day."
      }
    }
    if (step === 3) {
      if (reason.trim().length < 5) return "Please provide a reason (minimum 5 characters)."
      if (
        selectedType?.requiresAttachment &&
        attachmentFiles.length === 0
      ) {
        setAttachmentError("Please upload a supporting document.")
        return "Please upload a supporting document."
      }
    }
    return null
  }

  function handleNext() {
    const err = validateStep(currentStep)
    if (err) { setAttachmentError(selectedType?.requiresAttachment && attachmentFiles.length === 0 ? err : undefined); return }
    setAttachmentError(undefined)
    setStep(currentStep + 1)
  }

  async function handleSubmit() {
    const err = validateStep(3)
    if (err) return
    if (!selectedLeaveTypeId) return
    setIsSubmitting(true)
    try {
      const created = await createLeave.mutateAsync({
        leaveTypeId: selectedLeaveTypeId,
        startDate,
        endDate,
        dayType,
        reason,
      })
      for (const file of attachmentFiles) {
        await uploadAttachment.mutateAsync({ leaveId: created.id, file })
      }
      clearDraft()
      router.push("/dashboard/leave")
    } finally {
      setIsSubmitting(false)
    }
  }

  const stepTitles = STEPS
  const stepIndex = currentStep - 1

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentStep ? "bg-primary" : "bg-muted"
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Step {currentStep} of {STEPS.length} — {stepTitles[stepIndex]}
        </p>
      </div>

      {currentStep === 1 && (
        <div className="space-y-3">
          <h2 className="text-base font-semibold">Select leave type</h2>
          {typesLoading ? (
            <div className="flex h-20 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-2">
              {leaveTypes.map((lt) => (
                <LeaveTypePickCard
                  key={lt.id}
                  leaveType={lt}
                  balance={balanceMap.get(lt.id)}
                  isSelected={selectedLeaveTypeId === lt.id}
                  onSelect={() => setLeaveType(lt.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Select dates</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start-date">Start date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setDates(e.target.value, endDate || e.target.value)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end-date">End date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setDates(startDate, e.target.value)}
                disabled={dayType !== "full"}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Day type</Label>
            <RadioGroup
              value={dayType}
              onValueChange={(v) => {
                const d = v as LeaveDayType
                setDayType(d)
                if (d !== "full") setDates(startDate, startDate)
              }}
              className="flex gap-4"
            >
              {[
                { value: "full", label: "Full day" },
                { value: "am", label: "AM only" },
                { value: "pm", label: "PM only" },
              ].map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <RadioGroupItem value={opt.value} id={`daytype-${opt.value}`} />
                  <Label htmlFor={`daytype-${opt.value}`} className="cursor-pointer font-normal">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {totalDays > 0 && (
            <p className="text-sm text-muted-foreground">
              Total:{" "}
              <span className="font-semibold text-foreground">
                {totalDays} day{totalDays !== 1 ? "s" : ""}
              </span>
            </p>
          )}
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Reason & documents</h2>
          <div className="space-y-1.5">
            <Label htmlFor="leave-reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="leave-reason"
              placeholder="Brief reason for leave request…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <LeaveAttachmentZone
            files={attachmentFiles}
            onAdd={addAttachmentFile}
            onRemove={removeAttachmentFile}
            required={selectedType?.requiresAttachment ?? false}
            error={attachmentError}
          />
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Review & submit</h2>
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Leave type</span>
              <span className="font-medium">{selectedType?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dates</span>
              <span className="font-medium">
                {startDate}
                {startDate !== endDate ? ` – ${endDate}` : ""}
                {" "}({dayType === "full" ? "Full day" : dayType === "am" ? "AM only" : "PM only"})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{totalDays} day{totalDays !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground shrink-0">Reason</span>
              <span className="font-medium text-right">{reason}</span>
            </div>
            {attachmentFiles.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attachments</span>
                <span className="font-medium">{attachmentFiles.length} file{attachmentFiles.length !== 1 ? "s" : ""}</span>
              </div>
            )}
          </div>

          {previewApprovals.length > 0 && (
            <LeaveApprovalTimeline
              approvals={previewApprovals}
              leaveStatus="pending"
              variant="horizontal"
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (currentStep === 1) router.back()
            else setStep(currentStep - 1)
          }}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 1 ? "Back" : "Previous"}
        </Button>

        {currentStep < STEPS.length ? (
          <Button type="button" onClick={handleNext} className="gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
