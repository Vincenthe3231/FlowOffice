import { z } from 'zod'
import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'
import {
  colorSchemeSchema,
  departmentSchema,
} from '@/features/onboarding/schemas/onboarding.schemas'

const PROXY = API_ROUTES.PROXY_PREFIX

export const DEPARTMENTS_LIST_QUERY_KEY = ['departments', 'list'] as const

type Department = z.infer<typeof departmentSchema>

/**
 * Laravel may return numeric ids as strings; POST/PATCH bodies may omit timestamps.
 * Unwrap nested `{ department: {...} }` when present after extractData.
 */
const departmentResponseBodySchema = z
  .object({
    id: z.coerce.number(),
    name: z.string(),
    shortCode: z.string(),
    colorScheme: z.string().transform((s) => {
      const p = colorSchemeSchema.safeParse(s)
      return p.success ? p.data : ('slate' as z.infer<typeof colorSchemeSchema>)
    }),
    status: z.coerce.boolean(),
    createdAt: z.string().optional().nullable(),
    updatedAt: z.string().optional().nullable(),
  })
  .passthrough()

function normalizeSingleDepartmentPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const o = raw as Record<string, unknown>
  if (o.department && typeof o.department === 'object') {
    return o.department
  }
  return raw
}

export function parseDepartmentFromApi(raw: unknown): Department {
  const normalized = normalizeSingleDepartmentPayload(raw)
  const parsed = departmentResponseBodySchema.safeParse(normalized)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join('; ')
    throw new Error(`Invalid department response: ${msg}`)
  }
  const d = parsed.data
  const now = new Date().toISOString()
  return {
    id: d.id,
    name: d.name,
    shortCode: d.shortCode,
    colorScheme: d.colorScheme,
    status: d.status,
    createdAt: d.createdAt ?? now,
    updatedAt: d.updatedAt ?? now,
  }
}

function normalizeListPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw
  if (raw && typeof raw === 'object' && 'data' in raw) {
    const inner = (raw as { data: unknown }).data
    if (Array.isArray(inner)) return inner
  }
  return []
}

export async function fetchDepartments(): Promise<Department[]> {
  const res = await laravelApi.get(`${PROXY}/departments`)
  const raw = extractData<unknown>(res)
  const list = normalizeListPayload(raw)
  if (!Array.isArray(list)) return []
  return list.map((item, index) => {
    try {
      return parseDepartmentFromApi(item)
    } catch (e) {
      const hint = e instanceof Error ? e.message : String(e)
      throw new Error(`Department at index ${index}: ${hint}`)
    }
  })
}

export async function fetchDepartment(id: number): Promise<Department> {
  const res = await laravelApi.get(`${PROXY}/departments/${id}`)
  const raw = extractData<unknown>(res)
  return parseDepartmentFromApi(raw)
}

export interface CreateDepartmentInput {
  name: string
  shortCode: string
  colorScheme: z.infer<typeof colorSchemeSchema>
  status?: boolean
}

export type UpdateDepartmentInput = Partial<CreateDepartmentInput> & {
  status?: boolean
}

export async function createDepartment(payload: CreateDepartmentInput): Promise<Department> {
  const res = await laravelApi.post(`${PROXY}/departments`, payload)
  const raw = extractData<unknown>(res)
  return parseDepartmentFromApi(raw)
}

export async function updateDepartment(
  id: number,
  payload: UpdateDepartmentInput,
): Promise<Department> {
  const res = await laravelApi.patch(`${PROXY}/departments/${id}`, payload)
  const raw = extractData<unknown>(res)
  return parseDepartmentFromApi(raw)
}
