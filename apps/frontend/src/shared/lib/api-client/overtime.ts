import { laravelApi } from './axios'

const PROXY = '/api/proxy'

export interface OvertimeRequestPayload {
  date: string
  startTime: string
  endTime: string
  reason: string
  isUrgent: boolean
  urgencyReason?: string
}

export interface ApproveOvertimePayload {
  comments?: string
}

export interface RejectOvertimePayload {
  rejectionReason: string
}

export async function fetchMyOvertimeRequests(params?: Record<string, unknown>) {
  const res = await laravelApi.get(`${PROXY}/overtime`, { params })
  return res.data
}

export async function fetchAllOvertimeForApproval(params?: Record<string, unknown>) {
  const res = await laravelApi.get(`${PROXY}/overtime/all`, { params })
  return res.data
}

export async function fetchPendingOvertimeApprovals() {
  const res = await laravelApi.get(`${PROXY}/overtime/pending-approvals`)
  return res.data
}

export async function fetchOvertimeRequest(id: number) {
  const res = await laravelApi.get(`${PROXY}/overtime/${id}`)
  return res.data
}

export async function fetchOvertimeApprovals(id: number) {
  const res = await laravelApi.get(`${PROXY}/overtime/${id}/approvals`)
  return res.data
}

export async function createOvertimeRequest(data: OvertimeRequestPayload) {
  const res = await laravelApi.post(`${PROXY}/overtime`, data)
  return res.data
}

export async function approveOvertimeRequest(id: number, data: ApproveOvertimePayload) {
  const res = await laravelApi.patch(`${PROXY}/overtime/${id}/approve`, data)
  return res.data
}

export async function rejectOvertimeRequest(id: number, data: RejectOvertimePayload) {
  const res = await laravelApi.post(`${PROXY}/overtime/${id}/reject`, data)
  return res.data
}

export async function cancelOvertimeRequest(id: number) {
  const res = await laravelApi.patch(`${PROXY}/overtime/${id}/cancel`)
  return res.data
}
