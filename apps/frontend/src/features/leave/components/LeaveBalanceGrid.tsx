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
    <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-5">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {balance.leaveTypeName}
          </p>

          {balance.entitled != null && balance.entitled > 0 ? (
            <>
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-bold text-foreground">{balance.remaining}</span>
                  <span className="text-xs text-muted-foreground">of {balance.entitled}</span>
                </div>
                <span className="text-xs text-muted-foreground block">days available</span>
              </div>

              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${usedPct}%`, backgroundColor: color }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{balance.used} used</span>
              </div>

              {balance.pending > 0 && (
                <div className="pt-1 px-2 py-1.5 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    ⏳ {balance.pending} day{balance.pending !== 1 ? "s" : ""} pending
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{balance.remaining} remaining</p>
              <p className="text-xs text-muted-foreground">
                {balance.entitled == null ? "Manually granted" : "No quota set"}
              </p>
            </div>
          )}
        </div>
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
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">Your leave balance</p>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {balances.map((balance, i) => (
          <BalanceCard
            key={balance.leaveTypeId}
            balance={balance}
            color={LEAVE_BALANCE_COLORS[i % LEAVE_BALANCE_COLORS.length]!}
          />
        ))}
      </div>
    </div>
  )
}
