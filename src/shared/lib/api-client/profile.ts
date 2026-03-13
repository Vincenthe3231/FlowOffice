import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

export interface OfficeSummary {
  id: string
  name: string
  address: string | null
}

export type ProfileRole = "super_admin" | "hr_admin" | "manager" | "employee"

export interface Profile {
  id: string
  userId: string
  fullName: string | null
  email: string | null
  phone: string | null
  department: string | null
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

export async function fetchMyProfile(): Promise<Profile> {
  const response = await laravelApi.get(`${PROXY}/profile/me`)
  return extractData<Profile>(response)
}

export async function updateMyProfile(updates: ProfileUpdateInput): Promise<Profile> {
  const response = await laravelApi.put(`${PROXY}/profile/me`, updates)
  return extractData<Profile>(response)
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

