import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'
import { keysToSnake } from './transform'
import type {
  Claim,
  ClaimApproval,
  ClaimCategory,
  ClaimMonthlySpend,
  CustomField,
} from '@/features/claims/types'

const PROXY = API_ROUTES.PROXY_PREFIX

// ---------------------------------------------------------------------------
// API response types (camelCase after axios transform)
// ---------------------------------------------------------------------------

export interface ClaimCategoryApi {
  id: number
  name: string
  budget: number
  spent: number
}

export interface ClaimMileageApi {
  fromLocation: string
  toLocation: string
  distanceKm: number
  ratePerKm?: number
}

export interface ClaimAttachmentApi {
  id: number
  path: string
  url?: string
  originalName?: string
  mimeType?: string
}

export interface ClaimTypeRef {
  id: string | number
  key: string
  label: string
  description?: string
  icon?: string
  color?: string
}

export interface SubclaimTypeRef {
  id: string | number
  claimTypeId: string
  key: string
  label: string
  rate?: number | null
  status?: string
  description?: string
}

/** Laravel / Spatie-style user JSON (camelCase after axios `keysToCamel`). */
export type ClaimSubmitterUserApi = {
  name?: string | null
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

export interface ClaimApiResponse {
  id: number
  title: string
  type: string
  category: ClaimCategoryApi
  amount: string | number
  claimDate: string
  status: string
  description: string | null
  merchant?: string | null
  mileage?: ClaimMileageApi | null
  attachments?: ClaimAttachmentApi[]
  createdAt?: string
  claimType?: ClaimTypeRef | null
  subclaimType?: SubclaimTypeRef | null
  /** GET response: custom fields from backend; fields only, value may be string or number */
  metadata?: {
    fields?: Array<{ label: string; type: string; value: string | number | null }>
  } | null
  /** Claim owner / submitter (often eager-loaded on GET `claims/{id}`). */
  user?: ClaimSubmitterUserApi | null
  employee?: ClaimSubmitterUserApi | null
  claimant?: ClaimSubmitterUserApi | null
}

export interface ClaimsListResponse {
  data: ClaimApiResponse[]
  meta?: {
    currentPage: number
    lastPage: number
    total: number
    perPage: number
  }
}

export interface ClaimStatsApi {
  totalAmount: number
  pendingCount: number
  approvedCount: number
  totalClaims: number
  sparkline?: number[]
}

export interface MileageRateApi {
  rate: number
}

// Wizard / approval API types (camelCase after transform)
export interface ClaimTypeApi {
  id: string | number
  key: string
  label: string
  description?: string
  icon?: string
  color?: string
}

export interface SubclaimTypeApi {
  id: string | number
  claimTypeId: string
  key: string
  label: string
  rate?: number | null
  status?: string
  description?: string
}

export interface ClaimApprovalEligibleApproverApi {
  id: number
  name: string | null
}

export interface ClaimApprovalApi {
  id: number
  claimId: number
  level: number
  status: 'pending' | 'approved' | 'rejected'
  reason?: string | null
  decidedAt?: string | null
  stepKind?: string | null
  eligibleApproverIds?: number[]
  eligibleApprovers?: ClaimApprovalEligibleApproverApi[]
  approverId?: number | null
  approverName?: string | null
  approverDepartment?: string | null
  rejectionReason?: string | null
}

const CLAIM_APPROVAL_STEP_KINDS = new Set([
  'dept_hod',
  'hr_hod',
  'top_management',
  'finance_hod',
])

export function mapClaimApprovalApiToClaimApproval(row: ClaimApprovalApi): ClaimApproval {
  const rawKind = row.stepKind != null ? String(row.stepKind).trim() : ''
  const stepKind =
    rawKind !== '' && CLAIM_APPROVAL_STEP_KINDS.has(rawKind)
      ? (rawKind as ClaimApproval['stepKind'])
      : null

  return {
    id: row.id,
    claimId: row.claimId,
    level: row.level,
    status: row.status,
    reason: row.reason ?? row.rejectionReason ?? null,
    decidedAt: row.decidedAt ?? null,
    stepKind,
    eligibleApprovers:
      Array.isArray(row.eligibleApprovers) && row.eligibleApprovers.length > 0
        ? row.eligibleApprovers.map((e) => ({
            id: Number(e.id),
            name: e.name ?? null,
          }))
        : undefined,
    approverId: row.approverId ?? null,
    approverName: row.approverName ?? null,
    approverDepartment: row.approverDepartment ?? null,
  }
}

export interface ApprovalThresholdApi {
  id?: number
  level1Max?: number
  level2Max?: number
  level3Min?: number
}

export interface ClaimWithApprovalsApi extends ClaimApiResponse {
  claimApprovals?: ClaimApprovalApi[]
  claimTypes?: { key: string; label: string }
  subclaimTypes?: { key: string; label: string; rate?: number }
  /** Submitter name (org-wide / approval list). */
  claimantName?: string | null
  submitter?: ClaimSubmitterUserApi | null
  creator?: ClaimSubmitterUserApi | null
}

function trimmedNonEmpty(value: unknown): string | null {
  if (value == null) return null
  const t = String(value).trim()
  return t.length > 0 ? t : null
}

/** Display string from a nested user/employee-style object. */
function displayNameFromUserLike(obj: unknown): string | null {
  if (obj == null) return null
  if (typeof obj !== 'object') return trimmedNonEmpty(obj)

  const o = obj as Record<string, unknown>
  // Laravel API resource wrapper: { data: { ... } }
  if (
    'data' in o &&
    o.data != null &&
    typeof o.data === 'object' &&
    Object.keys(o).length === 1
  ) {
    return displayNameFromUserLike(o.data)
  }

  const full =
    trimmedNonEmpty(o.fullName) ?? trimmedNonEmpty(o.displayName)
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

/**
 * Resolve display name for who submitted the claim.
 * Supports common Laravel shapes: `claimantName`, flat strings, `user` / `employee` / `claimant`, etc.
 */
export function getClaimSubmittedByDisplay(claim: ClaimApiResponse): string {
  const c = claim as unknown as Record<string, unknown>

  const flat =
    trimmedNonEmpty(c.claimantName) ??
    trimmedNonEmpty(c.submittedBy) ??
    trimmedNonEmpty(c.submitterName) ??
    trimmedNonEmpty(c.employeeName) ??
    trimmedNonEmpty(c.createdByName) ??
    trimmedNonEmpty(c.claimantDisplayName)
  if (flat) return flat

  const nestedKeys = [
    'user',
    'employee',
    'claimant',
    'submitter',
    'creator',
    'owner',
    'profile',
  ] as const
  for (const key of nestedKeys) {
    const name = displayNameFromUserLike(c[key])
    if (name) return name
  }

  return '—'
}

// ---------------------------------------------------------------------------
// Map API response to frontend Claim type
// ---------------------------------------------------------------------------

function normalizeStatus(s: string): Claim['status'] {
  const key = String(s ?? '').toLowerCase()
  if (key.startsWith('pending')) return 'Pending'
  const map: Record<string, Claim['status']> = {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
  }
  return map[key] ?? (s as Claim['status'])
}

function mapClaimFromApi(row: ClaimApiResponse): Claim {
  const customFields: CustomField[] = (row.metadata?.fields ?? []).map((f, i) => ({
    id: `field-${i}`,
    label: f.label,
    type: f.type as CustomField['type'],
    value: f.value != null ? String(f.value) : '',
  }))
  const attachments = (row.attachments ?? []).map((a) => ({
    id: a.id,
    url: a.url ?? a.path,
    originalName: a.originalName,
    mimeType: a.mimeType,
  }))
  const submittedByDisplay = getClaimSubmittedByDisplay(row)
  const base = {
    id: row.id,
    title: row.title,
    category: row.category?.name ?? '',
    amount: typeof row.amount === 'string' ? parseFloat(row.amount) : row.amount,
    date: row.claimDate ?? (row as unknown as { claim_date?: string }).claim_date ?? '',
    status: normalizeStatus(row.status),
    description: row.description ?? '',
    type: row.type as Claim['type'],
    merchant: row.merchant ?? undefined,
    claimTypeLabel: row.claimType?.label ?? undefined,
    subclaimTypeLabel: row.subclaimType?.label ?? undefined,
    customFields,
    attachments,
    submittedByDisplay,
  }
  if (row.type === 'mileage' && row.mileage) {
    return {
      ...base,
      type: 'mileage',
      fromLocation: row.mileage.fromLocation,
      toLocation: row.mileage.toLocation,
      distance: row.mileage.distanceKm,
    }
  }
  return {
    ...base,
    type: 'receipt',
    merchant: row.merchant ?? '',
  }
}

// ---------------------------------------------------------------------------
// Fetch functions
// ---------------------------------------------------------------------------

export interface FetchClaimsParams {
  status?: string
  page?: number
  perPage?: number
}

export async function fetchClaims(params?: FetchClaimsParams): Promise<{
  claims: Claim[]
  meta?: ClaimsListResponse['meta']
}> {
  const query: Record<string, string | number> = {}
  if (params?.status && params.status !== 'All') query.status = String(params.status).toLowerCase()
  if (params?.page != null) query.page = params.page
  if (params?.perPage != null) query.per_page = params.perPage

  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.LIST}`, { params: query })
  const body = response.data as ClaimsListResponse | ClaimApiResponse[]

  if (Array.isArray(body)) {
    return { claims: body.map(mapClaimFromApi) }
  }
  const list = body.data ?? (extractData<ClaimApiResponse[]>(response) as ClaimApiResponse[])
  const claims = Array.isArray(list) ? list : []
  return {
    claims: claims.map(mapClaimFromApi),
    meta: body.meta,
  }
}

export async function fetchClaimById(id: number): Promise<Claim> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.DETAIL(id)}`)
  const data = extractData<ClaimApiResponse>(response)
  return mapClaimFromApi(data)
}

// ---------------------------------------------------------------------------
// Create / update payloads (send snake_case via transform)
// ---------------------------------------------------------------------------

export interface CreateReceiptClaimPayload {
  title: string
  type: 'receipt'
  categoryId: number
  amount: number
  claimDate: string
  merchant?: string
  description?: string
  status?: 'draft' | 'pending'
}

export interface CreateMileageClaimPayload {
  title: string
  type: 'mileage'
  categoryId: number
  amount: number
  claimDate: string
  description?: string
  status?: 'draft' | 'pending'
  mileage: {
    fromLocation: string
    toLocation: string
    distanceKm: number
    ratePerKm?: number
  }
}

export type CreateClaimPayload = CreateReceiptClaimPayload | CreateMileageClaimPayload

export async function createClaim(payload: CreateClaimPayload): Promise<Claim> {
  const response = await laravelApi.post(`${PROXY}/${API_ROUTES.CLAIMS.CREATE}`, payload)
  const data = extractData<ClaimApiResponse>(response)
  return mapClaimFromApi(data)
}

export type UpdateClaimPayload = Partial<CreateClaimPayload> & {
  metadata?: {
    fields: Array<{ label: string; type: string; value: string | number | null }>
  } | null
}

export async function updateClaim(
  id: number,
  payload: UpdateClaimPayload
): Promise<Claim> {
  const response = await laravelApi.put(`${PROXY}/${API_ROUTES.CLAIMS.UPDATE(id)}`, payload)
  const data = extractData<ClaimApiResponse>(response)
  return mapClaimFromApi(data)
}

export async function deleteClaim(id: number): Promise<void> {
  await laravelApi.delete(`${PROXY}/${API_ROUTES.CLAIMS.DELETE(id)}`)
}

/**
 * Activates the approval pipeline: builds `claim_approvals` from the submitter’s role
 * and moves the claim to `pending_l1` (or legacy `pending`). Expects claim status `draft`.
 */
export async function submitDraftClaim(claimId: number): Promise<Claim> {
  const response = await laravelApi.patch(
    `${PROXY}/${API_ROUTES.CLAIMS.SUBMIT(claimId)}`
  )
  const data = extractData<ClaimApiResponse>(response)
  return mapClaimFromApi(data)
}

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export async function uploadClaimAttachment(claimId: number, file: File): Promise<ClaimAttachmentApi> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await laravelApi.post(
    `${PROXY}/${API_ROUTES.CLAIMS.ATTACHMENTS(claimId)}`,
    formData
  )
  return extractData<ClaimAttachmentApi>(response)
}

export async function deleteClaimAttachment(
  claimId: number,
  attachmentId: number
): Promise<void> {
  await laravelApi.delete(
    `${PROXY}/${API_ROUTES.CLAIMS.ATTACHMENT(claimId, attachmentId)}`
  )
}

// ---------------------------------------------------------------------------
// Categories & stats
// ---------------------------------------------------------------------------

export async function fetchClaimCategories(): Promise<ClaimCategory[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIM_CATEGORIES}`)
  const data = extractData<ClaimCategoryApi[]>(response)
  return data.map((c) => ({
    id: String(c.id),
    name: c.name,
    budget: c.budget,
    spent: c.spent,
  }))
}

export async function fetchClaimsStats(): Promise<ClaimStatsApi> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.STATS}`)
  return extractData<ClaimStatsApi>(response)
}

export async function fetchMonthlySpend(): Promise<ClaimMonthlySpend[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.MONTHLY}`)
  return extractData<ClaimMonthlySpend[]>(response)
}

export async function fetchMileageRate(): Promise<number> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.MILEAGE_RATE}`)
  const data = extractData<MileageRateApi>(response)
  return data?.rate ?? 0.8
}

// ---------------------------------------------------------------------------
// Distance (Google Maps via backend)
// ---------------------------------------------------------------------------

export interface CalculateDistanceResponse {
  distanceKm: number | null
  message?: string
}

export async function calculateDistance(from: string, to: string): Promise<number | null> {
  const response = await laravelApi.post<CalculateDistanceResponse>(
    `${PROXY}/${API_ROUTES.CLAIMS.CALCULATE_DISTANCE}`,
    { from: from.trim(), to: to.trim() }
  )
  const data = extractData<CalculateDistanceResponse>(response)
  if (data?.distanceKm != null && typeof data.distanceKm === 'number') {
    return Number(Number(data.distanceKm).toFixed(2))
  }
  return null
}

// ---------------------------------------------------------------------------
// Claim types & subclaim types (wizard)
// ---------------------------------------------------------------------------

export async function fetchClaimTypes(): Promise<ClaimTypeApi[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.TYPES}`)
  const data = extractData<ClaimTypeApi[]>(response)
  return Array.isArray(data) ? data : []
}

export async function fetchSubclaimTypes(claimTypeId: string): Promise<SubclaimTypeApi[]> {
  const response = await laravelApi.get(
    `${PROXY}/${API_ROUTES.CLAIMS.TYPE_SUBCLAIMS(claimTypeId)}`
  )
  const data = extractData<SubclaimTypeApi[]>(response)
  return Array.isArray(data) ? data : []
}

export interface CreateClaimTypePayload {
  key: string
  label: string
  description?: string
  icon?: string
  color?: string
}

export async function createClaimType(data: CreateClaimTypePayload): Promise<ClaimTypeApi> {
  const response = await laravelApi.post(`${PROXY}/${API_ROUTES.CLAIMS.TYPES}`, data)
  return extractData<ClaimTypeApi>(response)
}

export async function deleteClaimType(id: string | number): Promise<void> {
  await laravelApi.delete(`${PROXY}/${API_ROUTES.CLAIMS.TYPE_DETAIL(id)}`)
}

// ---------------------------------------------------------------------------
// Claim approvals & threshold
// ---------------------------------------------------------------------------

export async function fetchClaimApprovals(claimId: number): Promise<ClaimApprovalApi[]> {
  const response = await laravelApi.get(
    `${PROXY}/${API_ROUTES.CLAIMS.CLAIM_APPROVALS(claimId)}`
  )
  const data = extractData<ClaimApprovalApi[]>(response)
  return Array.isArray(data) ? data : []
}

/** Roles allowed to call Laravel `GET /api/claims/all` (org-wide). */
const CLAIMS_ALL_VIEWER_ROLES = new Set([
  'hod',
  'hr_admin',
  'top_management',
  'super_admin',
])

/**
 * Approval dashboard (Manage Claims hub + `/claims/approval`).
 * - `hod` / `hr_admin` / `top_management`: `GET .../claims/all` (all org claims).
 * - Others: `GET .../claims` (scoped to auth user on backend).
 */
export async function fetchAllClaimsForApproval(
  viewerRole?: string | null,
): Promise<ClaimWithApprovalsApi[]> {
  const params: Record<string, string | number> = { per_page: 200 }
  const useOrgWide =
    viewerRole != null && CLAIMS_ALL_VIEWER_ROLES.has(viewerRole)
  const path = `${PROXY}/${
    useOrgWide ? API_ROUTES.CLAIMS.ALL : API_ROUTES.CLAIMS.LIST
  }`

  const response = await laravelApi.get(path, {
    params,
  })
  const body = response.data as ClaimsListResponse | ClaimWithApprovalsApi[]

  if (Array.isArray(body)) {
    return body
  }
  const list = body.data ?? (extractData<ClaimWithApprovalsApi[]>(response) as ClaimWithApprovalsApi[])
  return Array.isArray(list) ? list : []
}

export async function fetchPendingApprovals(): Promise<ClaimWithApprovalsApi[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.LIST}`, {
    params: { status: 'pending_l1,pending_l2,pending_l3,pending_l4' },
  })
  const data = extractData<ClaimWithApprovalsApi[]>(response)
  return Array.isArray(data) ? data : []
}

export async function fetchApprovalThreshold(): Promise<ApprovalThresholdApi | null> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.APPROVAL_THRESHOLD}`)
  const data = extractData<ApprovalThresholdApi | null>(response)
  return data ?? null
}

// ---------------------------------------------------------------------------
// Submit claim (wizard: create as draft, then PATCH submit — chain is server-side)
// ---------------------------------------------------------------------------

export interface SubmitClaimPayload {
  claim: Record<string, unknown>
}

export async function submitClaim(payload: SubmitClaimPayload): Promise<Claim> {
  const { claim } = payload
  const rawFiles = (claim as Record<string, unknown>)._attachmentFiles
  const attachmentFiles: File[] = Array.isArray(rawFiles)
    ? rawFiles.filter((f): f is File => f instanceof File)
    : []

  let created: ClaimApiResponse

  if (attachmentFiles.length > 0) {
    const claimPayload = { ...claim }
    delete (claimPayload as Record<string, unknown>)._attachmentFiles
    const formData = new FormData()
    formData.append('claim', JSON.stringify(keysToSnake(claimPayload as Record<string, unknown>)))
    attachmentFiles.forEach((f) => formData.append('attachments[]', f))
    const response = await laravelApi.post(`${PROXY}/${API_ROUTES.CLAIMS.CREATE}`, formData)
    created = extractData<ClaimApiResponse>(response)
  } else {
    const jsonClaim = { ...claim }
    delete (jsonClaim as Record<string, unknown>)._attachmentFiles

    const response = await laravelApi.post(`${PROXY}/${API_ROUTES.CLAIMS.CREATE}`, {
      claim: jsonClaim,
    })
    created = extractData<ClaimApiResponse>(response)
  }

  const id = Number(created.id)
  if (!Number.isFinite(id)) {
    throw new Error('Invalid claim id from create response')
  }

  return submitDraftClaim(id)
}

// ---------------------------------------------------------------------------
// Approve / reject (HR)
// ---------------------------------------------------------------------------

export interface ApproveRejectPayload {
  claimId: number
  level: number
  action: 'approved' | 'rejected'
  reason?: string
}

export async function approveRejectClaim(payload: ApproveRejectPayload): Promise<void> {
  const path =
    payload.action === 'approved'
      ? API_ROUTES.CLAIMS.APPROVE(payload.claimId)
      : API_ROUTES.CLAIMS.REJECT(payload.claimId)
  const body = {
    level: payload.level,
    reason: payload.reason ?? null,
  }
  if (payload.action === 'approved') {
    await laravelApi.patch(`${PROXY}/${path}`, body)
  } else {
    await laravelApi.post(`${PROXY}/${path}`, body)
  }
}

// ---------------------------------------------------------------------------
// Create custom subclaim type
// ---------------------------------------------------------------------------

export interface CreateSubclaimPayload {
  claimTypeId: string
  label: string
  key?: string
  description?: string
  rate?: number
}

export async function createSubclaimType(
  claimTypeId: string,
  data: Omit<CreateSubclaimPayload, 'claimTypeId'>
): Promise<SubclaimTypeApi> {
  const response = await laravelApi.post(
    `${PROXY}/${API_ROUTES.CLAIMS.TYPE_SUBCLAIMS(claimTypeId)}`,
    data
  )
  return extractData<SubclaimTypeApi>(response)
}

export async function deleteSubclaimType(
  claimTypeId: string,
  subclaimTypeId: string
): Promise<void> {
  await laravelApi.delete(
    `${PROXY}/${API_ROUTES.CLAIMS.TYPE_SUBCLAIM_DETAIL(claimTypeId, subclaimTypeId)}`
  )
}
