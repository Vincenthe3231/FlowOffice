"use client"

import { useRouter } from "next/navigation"
import { Loader2, Clock, CheckCircle2, FileText, Users, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { LeaveRequest } from "@/features/leave/types"
import { LEAVE_BALANCE_COLORS, LEAVE_DAY_TYPE_LABELS } from "@/features/leave/data"

interface LeaveOrgOverviewProps {
  allLeaves: LeaveRequest[]
  isLoading: boolean
}

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "approved": return "default"
    case "pending": return "secondary"
    case "rejected":
    case "cancelled": return "destructive"
    default: return "outline"
  }
}

function isOnLeaveToday(leave: LeaveRequest): boolean {
  if (leave.status !== "approved") return false
  const today = new Date().toISOString().slice(0, 10)
  return leave.startDate <= today && today <= leave.endDate
}

function isThisMonth(dateStr: string): boolean {
  const now = new Date()
  const d = new Date(dateStr)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

interface OrgStatCardProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  color: "amber" | "emerald" | "blue" | "purple"
}

function OrgStatCard({ icon: Icon, label, value, color }: OrgStatCardProps) {
  const colorMap = {
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    purple: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  }
  return (
    <Card className="border-border/60">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

interface PieTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}

function PieTooltipContent({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{payload[0]?.name}</p>
      <p className="text-muted-foreground">
        {payload[0]?.value} request{payload[0]?.value !== 1 ? "s" : ""}
      </p>
    </div>
  )
}

export function LeaveOrgOverview({ allLeaves, isLoading }: LeaveOrgOverviewProps) {
  const router = useRouter()

  const pendingCount = allLeaves.filter(
    (l) => l.status === "pending" && l.approvals.some((a) => a.status === "pending")
  ).length

  const onLeaveTodayCount = allLeaves.filter(isOnLeaveToday).length

  const approvedThisMonth = allLeaves.filter(
    (l) => l.status === "approved" && l.startDate && isThisMonth(l.startDate)
  ).length

  const totalThisYear = allLeaves.filter((l) => {
    const year = new Date().getFullYear()
    return l.startDate?.startsWith(String(year))
  }).length

  // Pie chart data: group by leave type
  const typeCountMap = allLeaves.reduce<Record<string, number>>((acc, l) => {
    acc[l.leaveTypeName] = (acc[l.leaveTypeName] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(typeCountMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Top 5 pending requests
  const pendingRequests = allLeaves
    .filter((l) => l.status === "pending" && l.approvals.some((a) => a.status === "pending"))
    .slice(0, 5)

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest font-semibold text-muted-foreground">
          Organisation overview
        </p>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          <OrgStatCard icon={Clock} label="Pending approval" value={pendingCount} color="amber" />
          <OrgStatCard icon={Users} label="On leave today" value={onLeaveTodayCount} color="purple" />
          <OrgStatCard icon={CheckCircle2} label="Approved this month" value={approvedThisMonth} color="emerald" />
          <OrgStatCard icon={FileText} label="Total this year" value={totalThisYear} color="blue" />
        </div>
      </div>

      {/* Charts row */}
      {pieData.length > 0 && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          {/* Leave type distribution */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Leave type distribution</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      strokeWidth={2}
                      stroke="var(--background)"
                    >
                      {pieData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={LEAVE_BALANCE_COLORS[i % LEAVE_BALANCE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltipContent />} />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pending requests snapshot */}
          <Card className="border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Pending requests</CardTitle>
              {pendingCount > 5 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => router.push("/dashboard/leave/approval")}
                >
                  View all <ArrowRight className="h-3 w-3" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {pendingRequests.length === 0 ? (
                <div className="flex h-40 items-center justify-center">
                  <div className="text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-sm text-muted-foreground">No pending requests</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Employee</TableHead>
                        <TableHead className="text-xs">Type</TableHead>
                        <TableHead className="text-xs">Days</TableHead>
                        <TableHead className="text-xs">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell className="text-sm font-medium py-2">
                            {leave.submittedByDisplay ?? "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground py-2">
                            {leave.leaveTypeName}
                          </TableCell>
                          <TableCell className="text-xs tabular-nums py-2">
                            {leave.totalDays}d
                            <span className="ml-1 text-muted-foreground">
                              ({LEAVE_DAY_TYPE_LABELS[leave.dayType] ?? leave.dayType})
                            </span>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant={statusVariant(leave.status)} className="capitalize text-xs">
                              {leave.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* CTA → approval queue */}
      {pendingCount > 0 && (
        <Card className="border-amber-200/60 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {pendingCount} request{pendingCount !== 1 ? "s" : ""} awaiting your action
                </p>
                <p className="text-xs text-muted-foreground">Review and approve or reject from the approval queue</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dashboard/leave/approval")}
              className="shrink-0 gap-1.5"
            >
              Go to approval queue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
