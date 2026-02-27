import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

export interface OfficeSummary {
  id: string
  name: string
  address: string | null
}

export interface Profile {
  id: string
  userId: string
  fullName: string | null
  email: string | null
  phone: string | null
  department: string | null
  employeeId: string | null
  avatarUrl: string | null
  facePhotoUrl: string | null
  officeId: string | null
  managerId: string | null
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
  facePhotoUrl?: string
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

export async function uploadFacePhoto(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('face_photo', file)

  const response = await laravelApi.post(`${PROXY}/profile/face-photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return extractData<string>(response)
}

