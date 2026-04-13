import { z } from 'zod'
import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

const PROXY = API_ROUTES.PROXY_PREFIX

export type AdminUserDirectoryRole =
  | 'top_management'
  | 'hr_admin'
  | 'hod'
  | 'staff'

export type AdminUserDirectoryStatus =
  | 'active'
  | 'verifying'
  | 'rejected'
  | 'deactivated'

export interface AdminUsersQuery {
  page?: number
  perPage?: number
  search?: string
  departmentId?: string | number
  role?: AdminUserDirectoryRole
  status?: AdminUserDirectoryStatus
}

const departmentSummarySchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string(),
    shortCode: z.string().nullable().optional(),
  })
  .passthrough()

export const adminUserRowSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    /** Laravel `users.uuid` — preferred URL segment for admin user routes. */
    uuid: z.string().nullable().optional(),
    name: z.string().nullable().optional(),
    fullName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    role: z.string().nullable(),
    status: z.string(),
    department: departmentSummarySchema.nullable().optional(),
    /** Laravel `AdminUserManagementResource` — prefer over legacy `avatar`. */
    avatarUrl: z.string().nullable().optional(),
    avatar: z.string().nullable().optional(),
    larkUserId: z.string().nullable().optional(),
    larkOpenId: z.string().nullable().optional(),
    /** ISO-8601 from Laravel `AdminUserManagementResource` (preferred). */
    lastLoginAt: z.string().nullable().optional(),
    /** Legacy alias if API sent only `last_login` / `lastLogin`. */
    lastLogin: z.string().nullable().optional(),
    createdAt: z.string(),
  })
  .passthrough()

export type AdminUserRow = z.infer<typeof adminUserRowSchema>

/** Prefer `lastLoginAt` (Laravel resource); fall back to `lastLogin`. */
export function getAdminUserLastLoginIso(row: AdminUserRow): string | null | undefined {
  return row.lastLoginAt ?? row.lastLogin ?? null
}

export interface AdminUsersMeta {
  currentPage: number
  perPage: number
  total: number
  lastPage: number
}

export interface AdminUsersPage {
  rows: AdminUserRow[]
  meta: AdminUsersMeta
}

const metaSchema = z.object({
  currentPage: z.number().optional(),
  perPage: z.number().optional(),
  total: z.number().optional(),
  lastPage: z.number().optional(),
})

/**
 * Parse Laravel paginated resource or a plain array (tests / legacy).
 */
export function parseAdminUsersPage(raw: unknown): AdminUsersPage {
  if (Array.isArray(raw)) {
    const rows = z.array(adminUserRowSchema).safeParse(raw)
    const list = rows.success ? rows.data : []
    const n = list.length
    return {
      rows: list,
      meta: {
        currentPage: 1,
        perPage: Math.max(n, 1),
        total: n,
        lastPage: 1,
      },
    }
  }

  if (!raw || typeof raw !== 'object') {
    return {
      rows: [],
      meta: { currentPage: 1, perPage: 25, total: 0, lastPage: 1 },
    }
  }

  const obj = raw as Record<string, unknown>
  const innerData = obj.data

  let rowsRaw: unknown = innerData
  let metaRaw: unknown = obj.meta

  if (innerData && typeof innerData === 'object' && !Array.isArray(innerData)) {
    const inner = innerData as Record<string, unknown>
    if (Array.isArray(inner.data)) {
      rowsRaw = inner.data
      metaRaw = inner.meta ?? obj.meta
    }
  }

  const rowList = Array.isArray(rowsRaw) ? rowsRaw : []
  const parsedRows = z.array(adminUserRowSchema).safeParse(rowList)
  const rows = parsedRows.success ? parsedRows.data : []

  if (
    metaRaw == null &&
    Array.isArray(rowsRaw) &&
    (obj.currentPage != null ||
      obj.perPage != null ||
      obj.total != null ||
      obj.lastPage != null)
  ) {
    metaRaw = {
      currentPage: obj.currentPage,
      perPage: obj.perPage,
      total: obj.total,
      lastPage: obj.lastPage,
    }
  }

  const metaParsed = metaSchema.safeParse(metaRaw ?? {})
  const m = metaParsed.success ? metaParsed.data : {}
  const total = m.total ?? rows.length
  const perPage = m.perPage ?? 25
  const lastPage = m.lastPage ?? Math.max(1, Math.ceil(total / Math.max(perPage, 1)))
  const currentPage = m.currentPage ?? 1

  return {
    rows,
    meta: {
      currentPage,
      perPage,
      total,
      lastPage,
    },
  }
}

/** Laravel list endpoint expects snake_case query keys (not transformed by axios). */
function compactParams(q: AdminUsersQuery): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  if (q.page != null) out.page = q.page
  if (q.perPage != null) out.per_page = q.perPage
  if (q.search != null && q.search.trim() !== '') out.search = q.search.trim()
  if (q.departmentId != null && String(q.departmentId) !== '')
    out.department_id = q.departmentId
  if (q.role) out.role = q.role
  if (q.status) out.status = q.status
  return out
}

export async function fetchAdminUsers(query: AdminUsersQuery = {}): Promise<AdminUsersPage> {
  const response = await laravelApi.get(`${PROXY}/admin/users`, {
    params: compactParams(query),
  })
  const body = response.data
  // Laravel paginated envelope: { message?, data: User[], meta, links } — keep meta (extractData would drop it).
  if (
    body &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    'data' in body &&
    Array.isArray((body as Record<string, unknown>).data)
  ) {
    return parseAdminUsersPage(body)
  }
  const raw = extractData<unknown>(response)
  return parseAdminUsersPage(raw)
}

/** Avatar URL from API (`avatarUrl` preferred; legacy `avatar`). */
export function getAdminUserAvatarUrl(row: AdminUserRow): string | null | undefined {
  const u = row.avatarUrl ?? row.avatar
  if (u == null || String(u).trim() === '') return null
  return u
}

export function getAdminUserDisplayName(row: AdminUserRow): string {
  const fromFull = row.fullName?.trim()
  if (fromFull) return fromFull
  const fromName = row.name?.trim()
  if (fromName) return fromName
  return row.email?.trim() || '—'
}

/** Path segment for detail/update routes: UUID when present, else numeric `id` (legacy). */
export function adminUserRouteSegment(row: AdminUserRow): string {
  const u = row.uuid?.trim()
  if (u) return u
  return String(row.id)
}

/** GET /api/admin/users/{user:uuid} — same resource shape as directory rows. */
export async function fetchAdminUser(
  userSegment: string | number,
): Promise<AdminUserRow> {
  const response = await laravelApi.get(`${PROXY}/admin/users/${userSegment}`)
  const raw = extractData<unknown>(response)
  const parsed = adminUserRowSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `Invalid user response: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
    )
  }
  return parsed.data
}

/**
 * PATCH /api/admin/users/{user:uuid} — body `{ departmentId }` (camelCase; proxied as `department_id`).
 * Pass `null` to clear department. Top Management only (403 otherwise). Returns updated user row.
 */
export async function patchAdminUserDepartment(
  userSegment: string | number,
  departmentId: number | null,
): Promise<AdminUserRow> {
  const response = await laravelApi.patch(`${PROXY}/admin/users/${userSegment}`, {
    departmentId,
  })
  const raw = extractData<unknown>(response)
  const parsed = adminUserRowSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `Invalid user response: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
    )
  }
  return parsed.data
}

/**
 * PATCH /api/admin/users/{user:uuid}/role — body `{ role }`. Top Management only.
 * 422 may return `errors.role` (validation or last Top Management user rule).
 */
export async function patchAdminUserRole(
  userSegment: string | number,
  role: AdminUserDirectoryRole,
): Promise<AdminUserRow> {
  const response = await laravelApi.patch(`${PROXY}/admin/users/${userSegment}/role`, {
    role,
  })
  const raw = extractData<unknown>(response)
  const parsed = adminUserRowSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(
      `Invalid user response: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
    )
  }
  return parsed.data
}

export function formatAdminUserDepartmentLabel(row: AdminUserRow): string {
  const d = row.department
  if (!d) return '—'
  const code =
    typeof d.shortCode === 'string' && d.shortCode
      ? ` (${d.shortCode})`
      : ''
  return `${d.name}${code}`
}
