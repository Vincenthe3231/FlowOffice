import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'
import {
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
  ROLE_HR_ADMIN,
  ROLE_HOD,
} from '@/shared/constants/roles'
import type {
  LeaveRequest,
  LeaveType,
  LeaveBalance,
  LeaveApproval,
  LeaveAttachment,
  LeaveTypeApi,
  LeaveApprovalApi,
  LeaveRequestApi,
  LeaveBalanceApi,
  LeavesListResponse,
  LeaveApprovalStepKind,
  LeaveAttachmentApi,
} from '@/features/leave/types'

const PROXY = API_ROUTES.PROXY_PREFIX

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

const LEAVE_APPROVAL_STEP_KINDS = new Set<string>([
  ROLE_HOD,
  ROLE_HR_ADMIN,
  ROLE_TOP_MANAGEMENT,
])

function trimmedNonEmpty(value: unknown): string | null {
  if (value == null) return null
  const t = String(value).trim()
  return t.length > 0 ? t : null
}

function displayNameFromUserLike(obj: unknown): string | null {
  if (obj == null) return null
  if (typeof obj !== 'object') return trimmedNonEmpty(obj)
  const o = obj as Record<string, unknown>
  if ('data' in o && o.data != null && typeof o.data === 'object' && Object.keys(o).length === 1) {
    return displayNameFromUserLike(o.data)
  }
  const full = trimmedNonEmpty(o.fullName) ?? trimmedNonEmpty(o.displayName)
  if (full) return full
  const single = trimmedNonEmpty(o.name) ?? trimmedNonEmpty(o.username)
  if (single) return single
  const fn = trimmedNonEmpty(o.firstName)
  const ln = trimmedNonEmpty(o.lastName)
  if (fn && ln) return `${fn} ${ln}`
  if (fn) return fn
  if (ln) return ln
  return trimmedNonEmpty(o.email)
}

export function getLeaveSubmittedByDisplay(row: LeaveRequestApi): string {
  const r = row as unknown as Record<string, unknown>
  const flat =
    trimmedNonEmpty(r.submittedBy) ??
    trimmedNonEmpty(r.submitterName) ??
    trimmedNonEmpty(r.employeeName) ??
    trimmedNonEmpty(r.userName)
  if (flat) return flat
  for (const key of ['user', 'employee', 'submitter', 'owner'] as const) {
    const name = displayNameFromUserLike(r[key])
    if (name) return name
  }
  return '—'
}

export function mapLeaveApprovalApiToLeaveApproval(row: LeaveApprovalApi): LeaveApproval {
  const rawKind = row.stepKind != null ? String(row.stepKind).trim() : ''
  const stepKind =
    rawKind !== '' && LEAVE_APPROVAL_STEP_KINDS.has(rawKind)
      ? (rawKind as LeaveApprovalStepKind)
      : null
  return {
    id: row.id,
    leaveRequestId: row.leaveRequestId,
    level: row.level,
    stepKind,
    status: row.status,
    approverId: row.approverId ?? null,
    approverName: row.approverName ?? null,
    reason: row.reason ?? row.rejectionReason ?? null,
    decidedAt: row.decidedAt ?? null,
    eligibleApprovers:
      Array.isArray(row.eligibleApprovers) && row.eligibleApprovers.length > 0
        ? row.eligibleApprovers.map((e) => ({ id: Number(e.id), name: e.name ?? null }))
        : undefined,
  }
}

export function mapLeaveTypeApiToLeaveType(row: LeaveTypeApi): LeaveType {
  const chain = (Array.isArray(row.approvalChain) ? row.approvalChain : [])
    .filter((s) => LEAVE_APPROVAL_STEP_KINDS.has(String(s.role)))
    .map((s) => ({ level: Number(s.level), role: s.role as LeaveApprovalStepKind }))

  const rawThresholdRole = row.durationThresholdRole
  const durationThresholdRole =
    rawThresholdRole != null && LEAVE_APPROVAL_STEP_KINDS.has(String(rawThresholdRole))
      ? (String(rawThresholdRole) as LeaveApprovalStepKind)
      : null

  return {
    id: String(row.id),
    name: row.name,
    key: row.key,
    description: row.description,
    annualQuota: row.annualQuota ?? null,
    requiresAttachment: Boolean(row.requiresAttachment),
    approvalChain: chain,
    durationThreshold: row.durationThreshold ?? null,
    durationThresholdRole,
    isActive: Boolean(row.isActive),
  }
}

function normalizeLeaveStatus(s: string): LeaveRequest['status'] {
  const key = String(s ?? '').toLowerCase()
  const map: Record<string, LeaveRequest['status']> = {
    draft: 'draft',
    pending: 'pending',
    approved: 'approved',
    rejected: 'rejected',
    cancelled: 'cancelled',
  }
  return map[key] ?? (s as LeaveRequest['status'])
}

export function mapLeaveRequestApiToLeaveRequest(row: LeaveRequestApi): LeaveRequest {
  const attachments: LeaveAttachment[] = (row.attachments ?? []).map((a) => ({
    id: a.id,
    url: a.url ?? a.path,
    originalName: a.originalName,
    mimeType: a.mimeType,
  }))
  const approvals: LeaveApproval[] = (row.leaveApprovals ?? []).map(
    mapLeaveApprovalApiToLeaveApproval
  )
  const leaveTypeId = row.leaveType?.id != null ? String(row.leaveType.id) : String(row.leaveTypeId ?? '')
  const leaveTypeName = row.leaveType?.name ?? '—'

  return {
    id: row.id,
    leaveTypeId,
    leaveTypeName,
    startDate: row.startDate,
    endDate: row.endDate,
    dayType: (row.dayType as LeaveRequest['dayType']) ?? 'full',
    totalDays: Number(row.totalDays ?? 0),
    reason: row.reason ?? '',
    status: normalizeLeaveStatus(row.status),
    approvals,
    attachments,
    submittedByDisplay: getLeaveSubmittedByDisplay(row),
    submittedAt: row.createdAt,
    cancelledAt: row.cancelledAt ?? null,
    cancelledReason: row.cancelledReason ?? null,
  }
}

// ---------------------------------------------------------------------------
// Fetch: my leave requests
// ---------------------------------------------------------------------------

export interface FetchLeavesParams {
  status?: string
  leaveTypeId?: string
  page?: number
  perPage?: number
}

export async function fetchMyLeaves(params?: FetchLeavesParams): Promise<{
  leaves: LeaveRequest[]
  meta?: LeavesListResponse['meta']
}> {
  const query: Record<string, string | number> = {}
  if (params?.status && params.status !== 'All') query.status = String(params.status).toLowerCase()
  if (params?.leaveTypeId) query.leave_type_id = params.leaveTypeId
  if (params?.page != null) query.page = params.page
  if (params?.perPage != null) query.per_page = params.perPage

  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.LEAVE.LIST}`, { params: query })
  const body = response.data as LeavesListResponse | LeaveRequestApi[]

  if (Array.isArray(body)) {
    return { leaves: body.map(mapLeaveRequestApiToLeaveRequest) }
  }
  const list = body.data ?? (extractData<LeaveRequestApi[]>(response) as LeaveRequestApi[])
  return {
    leaves: Array.isArray(list) ? list.map(mapLeaveRequestApiToLeaveRequest) : [],
    meta: (body as LeavesListResponse).meta,
  }
}

export async function fetchLeaveById(id: number): Promise<LeaveRequest> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.LEAVE.DETAIL(id)}`)
  const data = extractData<LeaveRequestApi>(response)
  return mapLeaveRequestApiToLeaveRequest(data)
}

export async function fetchLeaveApprovals(leaveId: number): Promise<LeaveApproval[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.LEAVE.APPROVALS(leaveId)}`)
  const data = extractData<LeaveApprovalApi[]>(response)
  return Array.isArray(data) ? data.map(mapLeaveApprovalApiToLeaveApproval) : []
}

// ---------------------------------------------------------------------------
// Fetch: balances
// ---------------------------------------------------------------------------

function mapLeaveBalance(b: LeaveBalanceApi): LeaveBalance {
  // Laravel may return leave type as nested { leaveType: { id, name } }
  // after axios camelCase transform, rather than flat leaveTypeName
  const raw = b as unknown as Record<string, unknown>
  const nestedType = raw.leaveType as Record<string, unknown> | undefined
  return {
    leaveTypeId: String(b.leaveTypeId),
    leaveTypeName: String(nestedType?.name ?? b.leaveTypeName ?? ''),
    entitled: Number(b.entitled ?? 0),
    used: Number(b.used ?? 0),
    pending: Number(b.pending ?? 0),
    remaining: Number(b.remaining ?? 0),
  }
}

export async function fetchMyLeaveBalance(): Promise<LeaveBalance[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.LEAVE.BALANCE_ME}`)
  const data = extractData<LeaveBalanceApi[]>(response)
  return Array.isArray(data) ? data.map(mapLeaveBalance) : []
}

export async function fetchUserLeaveBalance(userId: number): Promise<LeaveBalance[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.LEAVE.BALANCE_USER(userId)}`)
  const data = extractData<LeaveBalanceApi[]>(response)
  return Array.isArray(data) ? data.map(mapLeaveBalance) : []
}

// ---------------------------------------------------------------------------
// Fetch: org-wide (approver views)
// ---------------------------------------------------------------------------

const LEAVE_ALL_VIEWER_ROLES = new Set([
  ROLE_HOD,
  ROLE_HR_ADMIN,
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
])

export async function fetchAllLeavesForApproval(
  viewerRole?: string | null
): Promise<LeaveRequest[]> {
  const useOrgWide = viewerRole != null && LEAVE_ALL_VIEWER_ROLES.has(viewerRole as LeaveApprovalStepKind)
  const path = `${PROXY}/${useOrgWide ? API_ROUTES.LEAVE.ALL : API_ROUTES.LEAVE.LIST}`
  const response = await laravelApi.get(path, { params: { per_page: 200 } })
  const body = response.data as LeavesListResponse | LeaveRequestApi[]
  if (Array.isArray(body)) return body.map(mapLeaveRequestApiToLeaveRequest)
  const list = (body as LeavesListResponse).data ?? (extractData<LeaveRequestApi[]>(response) as LeaveRequestApi[])
  return Array.isArray(list) ? list.map(mapLeaveRequestApiToLeaveRequest) : []
}

export async function fetchPendingLeaveApprovals(): Promise<LeaveRequest[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.LEAVE.PENDING_APPROVALS}`)
  const data = extractData<LeaveRequestApi[]>(response)
  return Array.isArray(data) ? data.map(mapLeaveRequestApiToLeaveRequest) : []
}

// ---------------------------------------------------------------------------
// Create / cancel
// ---------------------------------------------------------------------------

export interface CreateLeavePayload {
  leaveTypeId: string
  startDate: string
  endDate: string
  dayType: string
  reason: string
}

export async function createLeaveRequest(payload: CreateLeavePayload): Promise<LeaveRequest> {
  const response = await laravelApi.post(`${PROXY}/${API_ROUTES.LEAVE.LIST}`, payload)
  const data = extractData<LeaveRequestApi>(response)
  return mapLeaveRequestApiToLeaveRequest(data)
}

export async function cancelLeaveRequest(id: number): Promise<void> {
  await laravelApi.patch(`${PROXY}/${API_ROUTES.LEAVE.CANCEL(id)}`)
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export async function uploadLeaveAttachment(
  leaveId: number,
  file: File
): Promise<LeaveAttachmentApi> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await laravelApi.post(
    `${PROXY}/${API_ROUTES.LEAVE.ATTACHMENTS(leaveId)}`,
    formData
  )
  return extractData<LeaveAttachmentApi>(response)
}

export async function deleteLeaveAttachment(
  leaveId: number,
  attachmentId: number
): Promise<void> {
  await laravelApi.delete(`${PROXY}/${API_ROUTES.LEAVE.ATTACHMENT(leaveId, attachmentId)}`)
}

// ---------------------------------------------------------------------------
// Approve / reject
// ---------------------------------------------------------------------------

export interface ApproveRejectLeavePayload {
  leaveId: number
  level: number
  action: 'approved' | 'rejected'
  reason?: string
}

export async function approveRejectLeave(payload: ApproveRejectLeavePayload): Promise<void> {
  const body = { level: payload.level, reason: payload.reason ?? null }
  if (payload.action === 'approved') {
    await laravelApi.patch(`${PROXY}/${API_ROUTES.LEAVE.APPROVE(payload.leaveId)}`, body)
  } else {
    await laravelApi.post(`${PROXY}/${API_ROUTES.LEAVE.REJECT(payload.leaveId)}`, body)
  }
}

// ---------------------------------------------------------------------------
// Leave types CRUD
// ---------------------------------------------------------------------------

export async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.LEAVE_TYPES.LIST}`)
  const data = extractData<LeaveTypeApi[]>(response)
  return Array.isArray(data) ? data.map(mapLeaveTypeApiToLeaveType) : []
}

export async function fetchLeaveTypeById(id: string | number): Promise<LeaveType> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.LEAVE_TYPES.DETAIL(id)}`)
  const data = extractData<LeaveTypeApi>(response)
  return mapLeaveTypeApiToLeaveType(data)
}

export interface CreateLeaveTypePayload {
  name: string
  key: string
  description?: string
  annualQuota: number | null
  requiresAttachment: boolean
  approvalChain: Array<{ level: number; role: string }>
  durationThreshold: number | null
  durationThresholdRole: string | null
}

export async function createLeaveType(payload: CreateLeaveTypePayload): Promise<LeaveType> {
  const response = await laravelApi.post(`${PROXY}/${API_ROUTES.LEAVE_TYPES.LIST}`, payload)
  const data = extractData<LeaveTypeApi>(response)
  return mapLeaveTypeApiToLeaveType(data)
}

export async function updateLeaveType(
  id: string | number,
  payload: Partial<CreateLeaveTypePayload>
): Promise<LeaveType> {
  const response = await laravelApi.patch(
    `${PROXY}/${API_ROUTES.LEAVE_TYPES.DETAIL(id)}`,
    payload
  )
  const data = extractData<LeaveTypeApi>(response)
  return mapLeaveTypeApiToLeaveType(data)
}

export async function deleteLeaveType(id: string | number): Promise<void> {
  await laravelApi.delete(`${PROXY}/${API_ROUTES.LEAVE_TYPES.DETAIL(id)}`)
}

// ---------------------------------------------------------------------------
// OIL grant
// ---------------------------------------------------------------------------

export interface OilGrantPayload {
  userId: number
  days: number
  reason: string
}

export async function grantOilDays(payload: OilGrantPayload): Promise<void> {
  await laravelApi.post(`${PROXY}/${API_ROUTES.LEAVE.OIL_GRANT}`, payload)
}
