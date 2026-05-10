"use client"

import { Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { LeaveBalance } from "@/features/leave/types"
import { LEAVE_BALANCE_COLORS } from "@/features/leave/data"

interface LeaveBalanceGridProps {
  balances: LeaveBalance[]
  isLoading: boolean
}

function BalanceCard({ balance, color }: { balance: LeaveBalance; color: string }) {
  const usedPct =
    balance.entitled > 0
      ? Math.min(100, Math.round((balance.used / balance.entitled) * 100))
      : 0

  return (
    <Card className="overflow-hidden border-border/60">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {balance.leaveTypeName}
          </p>
          {balance.entitled != null ? (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {balance.remaining} left
            </span>
          ) : null}
        </div>

        {balance.entitled != null && balance.entitled > 0 ? (
          <>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${usedPct}%`, backgroundColor: color }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{balance.used} used</span>
              <span>{balance.entitled} entitled</span>
            </div>
            {balance.pending > 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {balance.pending} day{balance.pending !== 1 ? "s" : ""} pending approval
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            {balance.entitled == null ? "Manually granted" : "No quota set"}
            {balance.remaining > 0 && ` · ${balance.remaining} remaining`}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export function LeaveBalanceGrid({ balances, isLoading }: LeaveBalanceGridProps) {
  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (balances.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-6">
        No leave balance information available.
      </p>
    )
  }

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
      {balances.map((balance, i) => (
        <BalanceCard
          key={balance.leaveTypeId}
          balance={balance}
          color={LEAVE_BALANCE_COLORS[i % LEAVE_BALANCE_COLORS.length]!}
        />
      ))}
    </div>
  )
}
