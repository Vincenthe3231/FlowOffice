'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts'
import { Users, UserCheck, UserX, Clock, FileText, Download } from 'lucide-react'
import { useAuth } from '@/shared/hooks/useAuth'
import { useProfile } from '@/features/profile/hooks/useProfile'
import { isTopManagement } from '@/shared/lib/role-utils'
import { ROLE_HR_ADMIN } from '@/shared/constants/roles'
import { fetchDepartments, DEPARTMENTS_LIST_QUERY_KEY } from '@/shared/lib/api-client/departments'
import { BudgetUtilization } from '@/features/claims/components/BudgetUtilization'
import { CHART_COLORS, CHART_GRID, CHART_AXIS } from '@/shared/constants/chart-colors'
import { STATUS_COLORS, getStatusColor } from '@/shared/constants/status-colors'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { DeptPeriodFilter } from '@/features/analytics/components/DeptPeriodFilter'
import { DeptBreakdownTable } from '@/features/analytics/components/DeptBreakdownTable'
import { useAnalyticsOverview } from '@/features/analytics/hooks/useAnalyticsOverview'
import { useAnalyticsAttendance } from '@/features/analytics/hooks/useAnalyticsAttendance'
import { useAnalyticsLeave } from '@/features/analytics/hooks/useAnalyticsLeave'
import { useAnalyticsClaims } from '@/features/analytics/hooks/useAnalyticsClaims'
import type { AnalyticsPeriod } from '@/features/analytics/components/DeptPeriodFilter'


function KpiCard({
  title,
  value,
  icon: Icon,
  sub,
  isLoading,
}: {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  sub?: string
  isLoading?: boolean
}) {
  return (
    <Card className="premium-shadow border-0">
      <CardContent className="pt-5 pb-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs text-muted-foreground font-medium mb-1">{title}</p>
              <p className="text-2xl font-bold tabular-nums">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
            <div className="rounded-lg bg-primary/10 p-2 shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground/70 mb-3">
      {children}
    </h2>
  )
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { profile } = useProfile()

  const canAccess =
    isTopManagement(profile?.role, user?.roles) ||
    profile?.role === ROLE_HR_ADMIN ||
    (user?.roles ?? []).includes(ROLE_HR_ADMIN)

  useEffect(() => {
    if (profile && !canAccess) {
      router.replace('/dashboard')
    }
  }, [profile, canAccess, router])

  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [period, setPeriod] = useState<AnalyticsPeriod>('ytd')
  const [attendancePeriod, setAttendancePeriod] = useState<AnalyticsPeriod>('30d')

  const params = { departmentId, period }
  const attendanceParams = { departmentId, period: attendancePeriod }

  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: DEPARTMENTS_LIST_QUERY_KEY,
    queryFn: fetchDepartments,
  })

  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview({ departmentId })
  const { data: attendance, isLoading: attendanceLoading } = useAnalyticsAttendance(attendanceParams)
  const { data: leave, isLoading: leaveLoading } = useAnalyticsLeave(params)
  const { data: claims, isLoading: claimsLoading } = useAnalyticsClaims(params)

  // Convert dept colorScheme slug → CSS color string for filter
  const deptOptions = departments.map((d) => ({
    id: d.id,
    name: d.name,
    colorScheme: d.colorScheme ?? null,
  }))

  // Attendance daily trend chart data
  const attendanceTrend = (attendance?.dailyTrend ?? []).map((p) => ({
    date: p.date.slice(5), // MM-DD
    rate: p.rate,
    count: p.count,
  }))

  // Leave status pie data
  const leaveStatusPie = Object.entries(leave?.statusBreakdown ?? {}).map(([status, count]) => ({
    name: status.replace(/_/g, ' '),
    value: count,
    color: getStatusColor(status),
  }))

  // Leave monthly trend
  const leaveMonthly = Object.entries(leave?.monthlyTrend ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month: month.slice(5), count }))

  // Claims monthly trend
  const claimsMonthly = Object.entries(claims?.monthlyTrend ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month: month.slice(5), total }))

  // Dept breakdown rows — attendance
  const attendanceDeptRows = (attendance?.deptBreakdown ?? []).map((r) => ({
    departmentName: r.departmentName,
    colorScheme: r.colorScheme,
    primaryValue: `${r.rate}%`,
    secondaryValue: `${r.present}/${r.headcount}`,
    progressPct: r.rate,
  }))

  // Dept breakdown rows — leave utilization
  const leaveDeptRows = (leave?.utilizationByDept ?? []).map((r) => ({
    departmentName: r.departmentName,
    colorScheme: r.colorScheme,
    primaryValue: `${r.utilizationPct}%`,
    secondaryValue: `${r.used}d used`,
    progressPct: r.utilizationPct,
  }))

  // Dept breakdown rows — claims spend
  const claimsDeptRows = (claims?.spendByDept ?? []).map((r) => ({
    departmentName: r.departmentName,
    colorScheme: r.colorScheme,
    primaryValue: `RM ${r.total.toLocaleString('en-MY', { maximumFractionDigits: 0 })}`,
  }))

  // Budget vs actual — map to ClaimCategory shape
  const budgetCategories = (claims?.budgetVsActual ?? []).map((c) => ({
    id: String(c.id),
    name: c.name,
    budget: c.budget,
    spent: c.spent,
  }))

  if (!canAccess && profile) return null

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        subtitle="Org-wide metrics across attendance, leave, and claims."
        action={
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        }
      />

      {/* Global filters (dept + period) */}
      <DeptPeriodFilter
        departments={deptOptions}
        departmentId={departmentId}
        period={period}
        onDepartmentChange={setDepartmentId}
        onPeriodChange={setPeriod}
        isLoading={deptsLoading}
      />

      {/* ── OVERVIEW ────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Workforce Pulse</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
          <KpiCard
            title="Total Headcount"
            value={overview?.headcount ?? '—'}
            icon={Users}
            isLoading={overviewLoading}
          />
          <KpiCard
            title="Present Today"
            value={overview ? `${overview.presentToday} (${overview.attendanceRate}%)` : '—'}
            icon={UserCheck}
            isLoading={overviewLoading}
          />
          <KpiCard
            title="On Leave Today"
            value={overview?.onLeaveToday ?? '—'}
            icon={UserX}
            isLoading={overviewLoading}
          />
          <KpiCard
            title="Pending Leave"
            value={overview?.pendingLeave ?? '—'}
            icon={Clock}
            sub="Awaiting approval"
            isLoading={overviewLoading}
          />
          <KpiCard
            title="Pending Claims"
            value={overview?.pendingClaims ?? '—'}
            icon={FileText}
            sub="Awaiting approval"
            isLoading={overviewLoading}
          />
        </div>
      </section>

      {/* ── ATTENDANCE ───────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Attendance</SectionTitle>
          <DeptPeriodFilter
            departments={deptOptions}
            departmentId={departmentId}
            period={attendancePeriod}
            onDepartmentChange={setDepartmentId}
            onPeriodChange={setAttendancePeriod}
            isLoading={deptsLoading}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Daily trend chart */}
          <Card className="premium-shadow border-0 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Daily Attendance Rate</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">% of headcount present per day</p>
            </CardHeader>
            <CardContent>
              {attendanceLoading ? (
                <Skeleton className="h-56 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={attendanceTrend}>
                    <defs>
                      <linearGradient id="gradAttend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS.success} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={CHART_COLORS.success} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke={CHART_AXIS} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke={CHART_AXIS} unit="%" />
                    <RechartsTooltip
                      formatter={(v: number) => [`${v}%`, 'Rate']}
                      contentStyle={{ fontSize: 12 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rate"
                      stroke={CHART_COLORS.success}
                      strokeWidth={2}
                      fill="url(#gradAttend)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Dept breakdown */}
          <Card className="premium-shadow border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">By Department (Today)</CardTitle>
            </CardHeader>
            <CardContent>
              <DeptBreakdownTable
                rows={attendanceDeptRows}
                primaryLabel="Rate"
                secondaryLabel="Present"
                isLoading={attendanceLoading}
                emptyMessage="No attendance data today."
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── LEAVE ────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Leave</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Status pie */}
          <Card className="premium-shadow border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Requests in period</p>
            </CardHeader>
            <CardContent>
              {leaveLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : leaveStatusPie.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No data.</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={leaveStatusPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {leaveStatusPie.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(v: number, name: string) => [v, name]}
                      contentStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Monthly trend */}
          <Card className="premium-shadow border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Monthly Requests</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
            </CardHeader>
            <CardContent>
              {leaveLoading ? (
                <Skeleton className="h-48 w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={leaveMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={CHART_AXIS} />
                    <YAxis tick={{ fontSize: 10 }} stroke={CHART_AXIS} allowDecimals={false} />
                    <RechartsTooltip formatter={(v: number) => [v, 'Requests']} contentStyle={{ fontSize: 12 }} />
                    <Bar dataKey="count" fill={CHART_COLORS.purple} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Dept utilization */}
          <Card className="premium-shadow border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Utilization by Dept</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Used / quota (YTD)</p>
            </CardHeader>
            <CardContent>
              <DeptBreakdownTable
                rows={leaveDeptRows}
                primaryLabel="Used"
                secondaryLabel="Days"
                isLoading={leaveLoading}
                emptyMessage="No leave balance data."
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── CLAIMS ───────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Claims & Expenses</SectionTitle>
        {/* Summary KPIs */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <KpiCard
            title="Total Paid (Period)"
            value={claims ? `RM ${claims.totalYtd.toLocaleString('en-MY', { maximumFractionDigits: 0 })}` : '—'}
            icon={FileText}
            isLoading={claimsLoading}
          />
          <KpiCard
            title="Pending Payment"
            value={claims ? `RM ${claims.pendingPaymentAmount.toLocaleString('en-MY', { maximumFractionDigits: 0 })}` : '—'}
            icon={Clock}
            sub="Approved, awaiting payment"
            isLoading={claimsLoading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Budget utilization */}
          <div className="lg:col-span-2">
            {claimsLoading ? (
              <Card className="premium-shadow border-0">
                <CardContent className="pt-5">
                  <Skeleton className="h-48 w-full" />
                </CardContent>
              </Card>
            ) : (
              <BudgetUtilization categories={budgetCategories} />
            )}
          </div>

          {/* Dept spend */}
          <Card className="premium-shadow border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Spend by Department</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Paid claims in period</p>
            </CardHeader>
            <CardContent>
              <DeptBreakdownTable
                rows={claimsDeptRows}
                primaryLabel="Total Spend"
                isLoading={claimsLoading}
                emptyMessage="No paid claims in period."
              />
            </CardContent>
          </Card>
        </div>

        {/* Monthly claims trend */}
        <Card className="premium-shadow border-0 mt-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Monthly Spend Trend</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Paid claims per month (last 12m)</p>
          </CardHeader>
          <CardContent>
            {claimsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={claimsMonthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke={CHART_AXIS} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    stroke={CHART_AXIS}
                    tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`}
                  />
                  <RechartsTooltip
                    formatter={(v: number) => [`RM ${v.toLocaleString('en-MY')}`, 'Paid']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="total" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
