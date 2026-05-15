"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ApprovalChainBuilder } from "@/features/leave/components/ApprovalChainBuilder"
import type { LeaveType, LeaveTypeApprovalStep, LeaveApprovalStepKind } from "@/features/leave/types"
import type { CreateLeaveTypePayload } from "@/shared/lib/api-client/leave"

interface LeaveTypeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: LeaveType
  onSave: (payload: CreateLeaveTypePayload) => void
  isPending: boolean
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

const DEFAULT_CHAIN: LeaveTypeApprovalStep[] = [{ level: 1, role: "hod" }]

export function LeaveTypeFormDialog({
  open,
  onOpenChange,
  initialValues,
  onSave,
  isPending,
}: LeaveTypeFormDialogProps) {
  const [name, setName] = useState("")
  const [key, setKey] = useState("")
  const [keyTouched, setKeyTouched] = useState(false)
  const [description, setDescription] = useState("")
  const [annualQuota, setAnnualQuota] = useState<string>("")
  const [requiresAttachment, setRequiresAttachment] = useState(false)
  const [approvalChain, setApprovalChain] = useState<LeaveTypeApprovalStep[]>(DEFAULT_CHAIN)
  const [durationThreshold, setDurationThreshold] = useState<number | null>(null)
  const [durationThresholdRole, setDurationThresholdRole] = useState<LeaveApprovalStepKind | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    if (initialValues) {
      setName(initialValues.name)
      setKey(initialValues.key)
      setKeyTouched(true)
      setDescription(initialValues.description ?? "")
      setAnnualQuota(initialValues.annualQuota != null ? String(initialValues.annualQuota) : "")
      setRequiresAttachment(initialValues.requiresAttachment)
      setApprovalChain(initialValues.approvalChain.length > 0 ? initialValues.approvalChain : DEFAULT_CHAIN)
      setDurationThreshold(initialValues.durationThreshold)
      setDurationThresholdRole(initialValues.durationThresholdRole)
    } else {
      setName(""); setKey(""); setKeyTouched(false); setDescription("")
      setAnnualQuota(""); setRequiresAttachment(false)
      setApprovalChain(DEFAULT_CHAIN)
      setDurationThreshold(null); setDurationThresholdRole(null)
    }
    setSubmitted(false)
  }, [open, initialValues])

  useEffect(() => {
    if (!keyTouched && name) setKey(slugify(name))
  }, [name, keyTouched])

  const keyError =
    submitted && !/^[a-z0-9_]+$/.test(key) ? "Key must be lowercase letters, numbers, or underscores" : undefined
  const nameError = submitted && name.trim().length === 0 ? "Name is required" : undefined
  const chainError = submitted && approvalChain.length === 0 ? "At least one approval level is required" : undefined

  function handleSave() {
    setSubmitted(true)
    if (!name.trim() || !/^[a-z0-9_]+$/.test(key) || approvalChain.length === 0) return
    const quota = annualQuota === "" ? null : parseInt(annualQuota, 10)
    onSave({
      name: name.trim(),
      key,
      description: description.trim() || undefined,
      annualQuota: quota != null && !Number.isNaN(quota) ? quota : null,
      requiresAttachment,
      approvalChain,
      durationThreshold,
      durationThresholdRole,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialValues ? "Edit Leave Type" : "New Leave Type"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="lt-name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lt-name"
                placeholder="e.g. Annual Leave"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={nameError ? "border-destructive" : ""}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lt-key">
                Key <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lt-key"
                placeholder="e.g. annual_leave"
                value={key}
                onChange={(e) => { setKey(e.target.value); setKeyTouched(true) }}
                className={keyError ? "border-destructive" : ""}
              />
              {keyError && <p className="text-xs text-destructive">{keyError}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lt-desc">Description</Label>
            <Textarea
              id="lt-desc"
              placeholder="Brief description of this leave type"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 items-center">
            <div className="space-y-1.5">
              <Label htmlFor="lt-quota">Annual quota (days)</Label>
              <Input
                id="lt-quota"
                type="number"
                min={0}
                step={0.5}
                placeholder="Leave blank for unlimited / manual"
                value={annualQuota}
                onChange={(e) => setAnnualQuota(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Leave blank for OIL / manually granted types.</p>
            </div>
            <div className="flex items-center gap-3 pt-5">
              <Switch
                id="lt-requires-attachment"
                checked={requiresAttachment}
                onCheckedChange={setRequiresAttachment}
              />
              <Label htmlFor="lt-requires-attachment" className="cursor-pointer">
                Requires attachment
              </Label>
            </div>
          </div>

          <ApprovalChainBuilder
            value={approvalChain}
            onChange={setApprovalChain}
            durationThreshold={durationThreshold}
            durationThresholdRole={durationThresholdRole}
            onThresholdChange={(t, r) => { setDurationThreshold(t); setDurationThresholdRole(r) }}
            error={chainError}
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
