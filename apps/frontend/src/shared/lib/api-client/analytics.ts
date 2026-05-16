import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

const PROXY = API_ROUTES.PROXY_PREFIX

export type AnalyticsPeriod = '30d' | '90d' | '6m' | 'ytd' | '12m'

export interface AnalyticsParams {
  departmentId?: number | null
  period?: AnalyticsPeriod
}

// Overview
export interface AnalyticsOverview {
  headcount: number
  presentToday: number
  onLeaveToday: number
  pendingLeave: number
  pendingClaims: number
  attendanceRate: number
}

export async function fetchAnalyticsOverview(params?: AnalyticsParams): Promise<AnalyticsOverview> {
  const response = await laravelApi.get(`${PROXY}/admin/analytics/overview`, {
    params: { department_id: params?.departmentId ?? undefined },
  })
  return extractData<AnalyticsOverview>(response)
}

// Attendance
export interface DailyTrendPoint {
  date: string
  count: number
  rate: number
}

export interface DeptAttendanceRow {
  departmentId: number
  departmentName: string
  colorScheme: string | null
  headcount: number
  present: number
  rate: number
}

export interface LateByDeptRow {
  departmentId: number
  departmentName: string
  lateCount: number
}

export interface AnalyticsAttendance {
  dailyTrend: DailyTrendPoint[]
  deptBreakdown: DeptAttendanceRow[]
  lateByDept: LateByDeptRow[]
  period: string
}

export async function fetchAnalyticsAttendance(params?: AnalyticsParams): Promise<AnalyticsAttendance> {
  const response = await laravelApi.get(`${PROXY}/admin/analytics/attendance`, {
    params: { department_id: params?.departmentId ?? undefined, period: params?.period ?? '30d' },
  })
  return extractData<AnalyticsAttendance>(response)
}

// Leave
export interface LeaveUtilizationRow {
  departmentId: number
  departmentName: string
  colorScheme: string | null
  quota: number
  used: number
  utilizationPct: number
}

export interface LeaveTypeBreakdownRow {
  leaveTypeId: number
  leaveTypeName: string
  count: number
}

export interface AnalyticsLeave {
  statusBreakdown: Record<string, number>
  utilizationByDept: LeaveUtilizationRow[]
  typeBreakdown: LeaveTypeBreakdownRow[]
  monthlyTrend: Record<string, number>
  period: string
}

export async function fetchAnalyticsLeave(params?: AnalyticsParams): Promise<AnalyticsLeave> {
  const response = await laravelApi.get(`${PROXY}/admin/analytics/leave`, {
    params: { department_id: params?.departmentId ?? undefined, period: params?.period ?? 'ytd' },
  })
  return extractData<AnalyticsLeave>(response)
}

// Claims
export interface BudgetVsActualRow {
  id: number
  name: string
  budget: number
  spent: number
  pct: number
}

export interface SpendByDeptRow {
  departmentId: number
  departmentName: string
  colorScheme: string | null
  total: number
}

export interface ClaimTypeBreakdownRow {
  type: string
  count: number
  total: number
}

export interface AnalyticsClaims {
  totalYtd: number
  pendingPaymentAmount: number
  budgetVsActual: BudgetVsActualRow[]
  spendByDept: SpendByDeptRow[]
  monthlyTrend: Record<string, number>
  typeBreakdown: ClaimTypeBreakdownRow[]
  period: string
}

export async function fetchAnalyticsClaims(params?: AnalyticsParams): Promise<AnalyticsClaims> {
  const response = await laravelApi.get(`${PROXY}/admin/analytics/claims`, {
    params: { department_id: params?.departmentId ?? undefined, period: params?.period ?? 'ytd' },
  })
  return extractData<AnalyticsClaims>(response)
}
