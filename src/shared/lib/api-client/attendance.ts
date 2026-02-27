import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

export interface Office {
  id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  radiusMeters: number
  isActive?: boolean
  timezone?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceLog {
  id: string
  type: 'clock_in' | 'clock_out'
  status: 'valid' | 'invalid_location' | 'pending_review' | string
  timestamp: string
  latitude: number | null
  longitude: number | null
  distanceMeters: number | null
  photoUrl: string | null
  notes: string | null
  officeId: string | null
}

export interface AdminAttendanceLog {
  id: string
  userId: string
  type: 'clock_in' | 'clock_out'
  timestamp: string
  officeId: string | null
  photoUrl: string | null
  distanceMeters: number | null
  notes: string | null
  status: string
}

export interface AdminProfile {
  id: string
  userId: string
  fullName: string | null
  email: string | null
  avatarUrl: string | null
  department: string | null
}

const PROXY = API_ROUTES.PROXY_PREFIX

export async function fetchActiveOffices(): Promise<Office[]> {
  const response = await laravelApi.get(`${PROXY}/offices`, {
    params: { is_active: true },
  })
  return extractData<Office[]>(response)
}

export async function fetchTodayUserLogs(): Promise<AttendanceLog[]> {
  const response = await laravelApi.get(`${PROXY}/attendance/my-today`)
  return extractData<AttendanceLog[]>(response)
}

export interface ClockPayload {
  type: 'clock_in' | 'clock_out'
  officeId: string
  latitude: number
  longitude: number
  photoUrl?: string
  notes?: string
}

export interface ClockResponse {
  log: AttendanceLog
  distanceMeters: number
}

export async function clockInOrOut(payload: ClockPayload): Promise<ClockResponse> {
  const response = await laravelApi.post(`${PROXY}/attendance/logs`, payload)
  return extractData<ClockResponse>(response)
}

export async function adminFetchTodayLogs(): Promise<AdminAttendanceLog[]> {
  const response = await laravelApi.get(`${PROXY}/admin/attendance/today`)
  return extractData<AdminAttendanceLog[]>(response)
}

export async function adminFetchAllProfiles(): Promise<AdminProfile[]> {
  const response = await laravelApi.get(`${PROXY}/admin/profiles`)
  return extractData<AdminProfile[]>(response)
}

export async function adminFetchActiveOffices(): Promise<Office[]> {
  const response = await laravelApi.get(`${PROXY}/offices`, {
    params: { is_active: true },
  })
  return extractData<Office[]>(response)
}

