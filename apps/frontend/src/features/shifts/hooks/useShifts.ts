import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchShifts,
  fetchShift,
  fetchMyShift,
  createShift,
  updateShift,
  deleteShift,
  fetchShiftAssignments,
  assignUserToShift,
  removeShiftAssignment,
} from '@/shared/lib/api-client/shifts'
import type { ShiftPayload, ShiftAssignmentPayload } from '@/shared/lib/api-client/shifts'
import { extractError } from '@/shared/lib/api-client/response-handler'

export const SHIFT_QUERY_KEYS = {
  shifts: (params?: Record<string, unknown>) => ['shifts', params ?? null] as const,
  shift: (id: number | null) => ['shifts', 'detail', id] as const,
  myShift: () => ['shifts', 'my'] as const,
  assignments: (shiftId: number | null) => ['shifts', 'assignments', shiftId] as const,
}

export function useShifts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: SHIFT_QUERY_KEYS.shifts(params),
    queryFn: () => fetchShifts(params),
  })
}

export function useShift(id: number | null) {
  return useQuery({
    queryKey: SHIFT_QUERY_KEYS.shift(id),
    queryFn: () => fetchShift(id!),
    enabled: id != null,
  })
}

export function useMyShift() {
  return useQuery({
    queryKey: SHIFT_QUERY_KEYS.myShift(),
    queryFn: fetchMyShift,
  })
}

export function useCreateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ShiftPayload) => createShift(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Shift created')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useUpdateShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ShiftPayload> }) =>
      updateShift(id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Shift updated')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useDeleteShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteShift(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Shift deleted')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useShiftAssignments(shiftId: number | null) {
  return useQuery({
    queryKey: SHIFT_QUERY_KEYS.assignments(shiftId),
    queryFn: () => fetchShiftAssignments(shiftId!),
    enabled: shiftId != null,
  })
}

export function useAssignUserToShift() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: number; data: ShiftAssignmentPayload }) =>
      assignUserToShift(shiftId, data),
    onSuccess: (_, { shiftId }) => {
      void qc.invalidateQueries({ queryKey: SHIFT_QUERY_KEYS.assignments(shiftId) })
      void qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Employee assigned to shift')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useRemoveShiftAssignment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (assignmentId: number) => removeShiftAssignment(assignmentId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shifts'] })
      toast.success('Assignment removed')
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}
