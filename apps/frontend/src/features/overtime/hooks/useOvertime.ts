import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchMyOvertimeRequests,
  fetchAllOvertimeForApproval,
  fetchPendingOvertimeApprovals,
  fetchOvertimeRequest,
  fetchOvertimeApprovals,
  createOvertimeRequest,
  approveOvertimeRequest,
  rejectOvertimeRequest,
  cancelOvertimeRequest,
} from '@/shared/lib/api-client/overtime'
import type {
  OvertimeRequestPayload,
  ApproveOvertimePayload,
  RejectOvertimePayload,
} from '@/shared/lib/api-client/overtime'
import { extractError } from '@/shared/lib/api-client/response-handler'

export const OVERTIME_QUERY_KEYS = {
  myRequests: (params?: Record<string, unknown>) => ['overtime', 'my', params ?? null] as const,
  allForApproval: (params?: Record<string, unknown>) => ['overtime', 'all', params ?? null] as const,
  pendingApprovals: () => ['overtime', 'pending-approvals'] as const,
  request: (id: number | null) => ['overtime', 'request', id] as const,
  approvals: (id: number | null) => ['overtime', 'approvals', id] as const,
}

export function useMyOvertimeRequests(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: OVERTIME_QUERY_KEYS.myRequests(filters),
    queryFn: () => fetchMyOvertimeRequests(filters),
  })
}

export function useAllOvertimeForApproval(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: OVERTIME_QUERY_KEYS.allForApproval(filters),
    queryFn: () => fetchAllOvertimeForApproval(filters),
  })
}

export function usePendingOvertimeApprovals() {
  return useQuery({
    queryKey: OVERTIME_QUERY_KEYS.pendingApprovals(),
    queryFn: fetchPendingOvertimeApprovals,
  })
}

export function useOvertimeRequest(id: number | null) {
  return useQuery({
    queryKey: OVERTIME_QUERY_KEYS.request(id),
    queryFn: () => fetchOvertimeRequest(id!),
    enabled: id != null,
  })
}

export function useOvertimeApprovals(id: number | null) {
  return useQuery({
    queryKey: OVERTIME_QUERY_KEYS.approvals(id),
    queryFn: () => fetchOvertimeApprovals(id!),
    enabled: id != null,
  })
}

export function useCreateOvertimeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: OvertimeRequestPayload) => createOvertimeRequest(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['overtime'] })
      toast.success('Overtime request submitted')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useApproveOvertime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApproveOvertimePayload }) =>
      approveOvertimeRequest(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['overtime'] })
      toast.success('Overtime request approved')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useRejectOvertime() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: RejectOvertimePayload }) =>
      rejectOvertimeRequest(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['overtime'] })
      toast.success('Overtime request rejected')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useCancelOvertimeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelOvertimeRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['overtime'] })
      toast.success('Overtime request cancelled')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}
