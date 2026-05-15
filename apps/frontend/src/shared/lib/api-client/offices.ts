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
  isActive: boolean
  timezone?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface OfficeFormData {
  name: string
  address: string
  latitude: number
  longitude: number
  radiusMeters: number
  isActive: boolean
}

const PROXY = API_ROUTES.PROXY_PREFIX

export async function fetchAllOffices(): Promise<Office[]> {
  const response = await laravelApi.get(`${PROXY}/offices`)
  return extractData<Office[]>(response)
}

export async function createOffice(form: OfficeFormData): Promise<void> {
  await laravelApi.post(`${PROXY}/offices`, form)
}

export async function updateOffice(id: string, form: OfficeFormData): Promise<void> {
  await laravelApi.put(`${PROXY}/offices/${id}`, form)
}

export async function toggleOfficeActive(id: string, isActive: boolean): Promise<void> {
  await laravelApi.patch(`${PROXY}/offices/${id}`, { isActive })
}

