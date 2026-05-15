"use client"

import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { LeaveTypeApprovalStep, LeaveApprovalStepKind } from "@/features/leave/types"
import { LEAVE_STEP_KIND_LABELS } from "@/features/leave/data"

const ROLE_OPTIONS: { value: LeaveApprovalStepKind; label: string }[] = [
  { value: "hod", label: LEAVE_STEP_KIND_LABELS.hod },
  { value: "hr_admin", label: LEAVE_STEP_KIND_LABELS.hr_admin },
  { value: "top_management", label: LEAVE_STEP_KIND_LABELS.top_management },
]

interface ApprovalChainBuilderProps {
  value: LeaveTypeApprovalStep[]
  onChange: (steps: LeaveTypeApprovalStep[]) => void
  durationThreshold: number | null
  durationThresholdRole: LeaveApprovalStepKind | null
  onThresholdChange: (threshold: number | null, role: LeaveApprovalStepKind | null) => void
  error?: string
}

export function ApprovalChainBuilder({
  value,
  onChange,
  durationThreshold,
  durationThresholdRole,
  onThresholdChange,
  error,
}: ApprovalChainBuilderProps) {
  function addLevel() {
    const nextLevel = value.length + 1
    onChange([...value, { level: nextLevel, role: "hod" }])
  }

  function removeLevel(index: number) {
    const updated = value
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, level: i + 1 }))
    onChange(updated)
  }

  function changeRole(index: number, role: LeaveApprovalStepKind) {
    const updated = value.map((step, i) => (i === index ? { ...step, role } : step))
    onChange(updated)
  }

  function handleThresholdDays(raw: string) {
    const n = parseInt(raw, 10)
    if (raw === "" || raw === "0") {
      onThresholdChange(null, null)
    } else if (!Number.isNaN(n) && n > 0) {
      onThresholdChange(n, durationThresholdRole)
    }
  }

  function handleThresholdRole(role: LeaveApprovalStepKind) {
    onThresholdChange(durationThreshold, role)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Approval levels</Label>
        {value.length === 0 && (
          <p className="text-xs text-muted-foreground">Add at least one approval level.</p>
        )}
        {value.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground">
              {index + 1}
            </span>
            <Select
              value={step.role}
              onValueChange={(v) => changeRole(index, v as LeaveApprovalStepKind)}
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => removeLevel(index)}
              disabled={value.length <= 1}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {error && (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={addLevel}
          disabled={value.length >= 3}
        >
          <Plus className="h-3.5 w-3.5" />
          Add level
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Duration threshold (optional)
          </Label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Adds an extra approver when leave duration reaches the threshold.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">If duration ≥</Label>
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                className="w-20 h-8 text-sm"
                placeholder="—"
                value={durationThreshold ?? ""}
                onChange={(e) => handleThresholdDays(e.target.value)}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>
          <div className="space-y-1 flex-1 min-w-[160px]">
            <Label className="text-xs">Require also</Label>
            <Select
              value={durationThresholdRole ?? "none"}
              onValueChange={(v) =>
                handleThresholdRole(
                  v === "none" ? ("hod" as LeaveApprovalStepKind) : (v as LeaveApprovalStepKind)
                )
              }
              disabled={durationThreshold == null}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
