import { laravelApi } from './axios'
import { API_ROUTES } from './constants'

const PROXY = API_ROUTES.PROXY_PREFIX

export interface AuditCauser {
  id: number
  name: string
  email: string
}

export interface AuditProperties {
  old: Record<string, unknown> | null
  attributes: Record<string, unknown> | null
  ip: string | null
}

export interface AuditLogEntry {
  id: number
  module: string
  event: string
  description: string
  causer: AuditCauser | null
  subjectType: string | null
  subjectId: number | null
  properties: AuditProperties
  createdAt: string
}

export interface AuditFilter {
  module?: string
  event?: string
  userId?: number
  from?: string
  to?: string
}

export interface AuditMeta {
  currentPage: number
  lastPage: number
  total: number
  perPage: number
}

export interface AuditListResponse {
  data: AuditLogEntry[]
  meta?: AuditMeta
}

export async function fetchAuditTrail(
  filters: AuditFilter = {},
  page = 1,
  perPage = 25,
): Promise<{ entries: AuditLogEntry[]; meta?: AuditMeta }> {
  const params: Record<string, string | number> = { page, per_page: perPage }
  if (filters.module) params.module = filters.module
  if (filters.event) params.event = filters.event
  if (filters.userId) params.user_id = filters.userId
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to

  const response = await laravelApi.get(`${PROXY}/admin/audit`, { params })
  const body = response.data as AuditListResponse

  return {
    entries: Array.isArray(body.data) ? body.data : [],
    meta: body.meta,
  }
}
