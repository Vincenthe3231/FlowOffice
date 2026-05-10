"use client"

import { Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { LeaveType, LeaveBalance } from "@/features/leave/types"

interface LeaveTypePickCardProps {
  leaveType: LeaveType
  balance?: LeaveBalance
  isSelected: boolean
  onSelect: () => void
}

export function LeaveTypePickCard({
  leaveType,
  balance,
  isSelected,
  onSelect,
}: LeaveTypePickCardProps) {
  const remaining = balance?.remaining ?? null
  const entitled = balance?.entitled ?? null

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full text-left rounded-xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{leaveType.name}</p>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {remaining !== null && (
            <Badge
              variant={remaining <= 0 ? "destructive" : "secondary"}
              className="text-xs tabular-nums"
            >
              {remaining} left
            </Badge>
          )}
          {leaveType.requiresAttachment && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <Paperclip className="h-2.5 w-2.5" />
              Doc required
            </span>
          )}
        </div>
      </div>

      {leaveType.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
          {leaveType.description}
        </p>
      )}

      {entitled !== null && entitled > 0 && (
        <div className="mt-2">
          <div className="h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary/60 transition-all"
              style={{
                width: `${Math.min(100, Math.round(((entitled - (remaining ?? 0)) / entitled) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </button>
  )
}
