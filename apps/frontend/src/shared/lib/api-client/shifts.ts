import { laravelApi } from './axios'

const PROXY = '/api/proxy'

export interface ShiftPayload {
  name: string
  code: string
  startTime: string
  endTime: string
  color?: string
  status?: 'active' | 'inactive'
}

export interface ShiftAssignmentPayload {
  userId: number
  effectiveDate: string
  endDate?: string
  notes?: string
}

export async function fetchShifts(params?: Record<string, unknown>) {
  const res = await laravelApi.get(`${PROXY}/shifts`, { params })
  return res.data
}

export async function fetchShift(id: number) {
  const res = await laravelApi.get(`${PROXY}/shifts/${id}`)
  return res.data
}

export async function fetchMyShift() {
  const res = await laravelApi.get(`${PROXY}/shifts/my`)
  return res.data
}

export async function createShift(data: ShiftPayload) {
  const res = await laravelApi.post(`${PROXY}/shifts`, data)
  return res.data
}

export async function updateShift(id: number, data: Partial<ShiftPayload>) {
  const res = await laravelApi.patch(`${PROXY}/shifts/${id}`, data)
  return res.data
}

export async function deleteShift(id: number) {
  const res = await laravelApi.delete(`${PROXY}/shifts/${id}`)
  return res.data
}

export async function fetchShiftAssignments(shiftId: number, params?: Record<string, unknown>) {
  const res = await laravelApi.get(`${PROXY}/shifts/${shiftId}/assignments`, { params })
  return res.data
}

export async function assignUserToShift(shiftId: number, data: ShiftAssignmentPayload) {
  const res = await laravelApi.post(`${PROXY}/shifts/${shiftId}/assignments`, data)
  return res.data
}

export async function removeShiftAssignment(assignmentId: number) {
  const res = await laravelApi.delete(`${PROXY}/shifts/assignments/${assignmentId}`)
  return res.data
}
