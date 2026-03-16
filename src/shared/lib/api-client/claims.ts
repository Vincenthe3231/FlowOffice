import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'
import type { Claim, ClaimCategory, ClaimMonthlySpend } from '@/features/claims/types'

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

export interface ClaimApprovalApi {
  id: number
  claimId: number
  level: number
  status: 'pending' | 'approved' | 'rejected'
  reason?: string | null
  decidedAt?: string | null
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
}

// ---------------------------------------------------------------------------
// Map API response to frontend Claim type
// ---------------------------------------------------------------------------

function normalizeStatus(s: string): Claim['status'] {
  const map: Record<string, Claim['status']> = {
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid',
  }
  return map[s?.toLowerCase()] ?? (s as Claim['status'])
}

function mapClaimFromApi(row: ClaimApiResponse): Claim {
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

export async function updateClaim(
  id: number,
  payload: Partial<CreateClaimPayload>
): Promise<Claim> {
  const response = await laravelApi.put(`${PROXY}/${API_ROUTES.CLAIMS.UPDATE(id)}`, payload)
  const data = extractData<ClaimApiResponse>(response)
  return mapClaimFromApi(data)
}

export async function deleteClaim(id: number): Promise<void> {
  await laravelApi.delete(`${PROXY}/${API_ROUTES.CLAIMS.DELETE(id)}`)
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

export async function fetchAllClaimsForApproval(): Promise<ClaimWithApprovalsApi[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.LIST}`, {
    params: { for_approval: 1 },
  })
  const data = extractData<ClaimWithApprovalsApi[]>(response)
  return Array.isArray(data) ? data : []
}

export async function fetchPendingApprovals(): Promise<ClaimWithApprovalsApi[]> {
  const response = await laravelApi.get(`${PROXY}/${API_ROUTES.CLAIMS.LIST}`, {
    params: { status: 'pending_l1,pending_l2,pending_l3' },
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
// Submit claim (wizard: claim + approval rows)
// ---------------------------------------------------------------------------

export interface SubmitClaimPayload {
  claim: Record<string, unknown>
  approvalLevels: Record<string, unknown>[]
}

export async function submitClaim(payload: SubmitClaimPayload): Promise<Claim> {
  const response = await laravelApi.post(`${PROXY}/${API_ROUTES.CLAIMS.CREATE}`, payload)
  const data = extractData<ClaimApiResponse>(response)
  return mapClaimFromApi(data)
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
  await laravelApi.post(`${PROXY}/${path}`, {
    level: payload.level,
    reason: payload.reason ?? null,
  })
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
