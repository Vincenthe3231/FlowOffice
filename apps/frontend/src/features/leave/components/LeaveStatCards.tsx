"use client"

import { Clock, CheckCircle2, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface LeaveStatCardsProps {
  pendingCount: number
  approvedCount: number
  totalRequests: number
}

export function LeaveStatCards({ pendingCount, approvedCount, totalRequests }: LeaveStatCardsProps) {
  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
      <Card className="border-border/60">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{pendingCount}</p>
            <p className="text-xs text-muted-foreground">Pending approval</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{approvedCount}</p>
            <p className="text-xs text-muted-foreground">Approved this month</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tabular-nums">{totalRequests}</p>
            <p className="text-xs text-muted-foreground">Total requests</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
