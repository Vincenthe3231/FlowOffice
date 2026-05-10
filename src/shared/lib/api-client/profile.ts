import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'
import {
  ROLE_TOP_MANAGEMENT,
  ROLE_SUPER_ADMIN_LEGACY,
  ROLE_HR_ADMIN,
  ROLE_HOD,
  ROLE_STAFF,
} from '@/shared/constants/roles'

export interface OfficeSummary {
  id: string
  name: string
  address: string | null
}

export type ProfileRole =
  | typeof ROLE_TOP_MANAGEMENT
  /** @deprecated Renamed server-side; may still appear briefly on cached sessions */
  | typeof ROLE_SUPER_ADMIN_LEGACY
  | typeof ROLE_HR_ADMIN
  | typeof ROLE_HOD
  | typeof ROLE_STAFF
  | "manager"
  | "employee"

export interface Profile {
  id: string
  userId: string
  fullName: string | null
  email: string | null
  phone: string | null
  department: string | null
  /** Laravel `employee_id` (camelCase after axios). Populate server-side (e.g. from Supabase sync). */
  employeeId: string | null
  avatarUrl: string | null
  faceFrontUrl: string | null
  faceLeftUrl: string | null
  faceRightUrl: string | null
  officeId: string | null
  managerId: string | null
  role?: ProfileRole | null
  createdAt: string
  updatedAt: string
  office?: OfficeSummary | null
}

export interface ProfileUpdateInput {
  fullName?: string
  phone?: string
  department?: string
  employeeId?: string
  avatarUrl?: string
  faceFrontUrl?: string
  faceLeftUrl?: string
  faceRightUrl?: string
}

const PROXY = API_ROUTES.PROXY_PREFIX

/**
 * Laravel may return `{ data: Profile }` or `{ data: { profile: Profile } }`.
 * Response body is already camelCase from the axios interceptor.
 */
function unwrapProfileMePayload(raw: unknown): Profile {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid profile response')
  }
  const r = raw as Record<string, unknown>
  if (r.profile && typeof r.profile === 'object') {
    return r.profile as Profile
  }
  return raw as Profile
}

export async function fetchMyProfile(): Promise<Profile> {
  const response = await laravelApi.get(`${PROXY}/profile/me`)
  const raw = extractData<unknown>(response)
  return unwrapProfileMePayload(raw)
}

export async function updateMyProfile(updates: ProfileUpdateInput): Promise<Profile> {
  const response = await laravelApi.put(`${PROXY}/profile/me`, updates)
  const raw = extractData<unknown>(response)
  return unwrapProfileMePayload(raw)
}

export async function uploadAvatar(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await laravelApi.post(`${PROXY}/profile/avatar`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return extractData<string>(response)
}

export type FacePosition = 'front' | 'left' | 'right'

export async function uploadFacePhoto(file: File, position: FacePosition): Promise<string> {
  const formData = new FormData()
  formData.append('face_photo', file)
  formData.append('position', position)

  const response = await laravelApi.post(`${PROXY}/profile/face-photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return extractData<string>(response)
}

