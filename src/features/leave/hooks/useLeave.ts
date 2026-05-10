import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  fetchMyLeaves,
  fetchLeaveById,
  fetchLeaveApprovals,
  fetchMyLeaveBalance,
  fetchUserLeaveBalance,
  fetchAllLeavesForApproval,
  fetchPendingLeaveApprovals,
  fetchLeaveTypes,
  fetchLeaveTypeById,
  createLeaveRequest,
  cancelLeaveRequest,
  uploadLeaveAttachment,
  deleteLeaveAttachment,
  approveRejectLeave,
  createLeaveType as createLeaveTypeApi,
  updateLeaveType as updateLeaveTypeApi,
  deleteLeaveType as deleteLeaveTypeApi,
  grantOilDays as grantOilDaysApi,
} from "@/shared/lib/api-client/leave"
import type {
  LeaveFilter,
  LeaveType,
} from "@/features/leave/types"
import type {
  CreateLeavePayload,
  ApproveRejectLeavePayload,
  CreateLeaveTypePayload,
  OilGrantPayload,
} from "@/shared/lib/api-client/leave"
import { extractError } from "@/shared/lib/api-client/response-handler"
import { IN_APP_NOTIFICATION_QUERY_KEYS } from "@/shared/lib/api-client/notifications"
import { useProfile } from "@/features/profile/hooks/useProfile"

export const LEAVE_QUERY_KEYS = {
  myLeaves: (filter?: string, page?: number) => ["leaves", "my", filter, page] as const,
  leave: (id: number | null) => ["leave", id] as const,
  leaveApprovals: (leaveId: number | null) => ["leave-approvals", leaveId] as const,
  myBalance: () => ["leave", "balance", "me"] as const,
  userBalance: (userId: number | null) => ["leave", "balance", userId] as const,
  allLeaves: () => ["leaves", "all"] as const,
  pendingApprovals: () => ["leaves", "pending-approvals"] as const,
  leaveTypes: () => ["leave-types"] as const,
  leaveType: (id: string | null) => ["leave-type", id] as const,
}

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

export function useMyLeaves(filter: LeaveFilter, page = 1, perPage = 50, enabled = true) {
  const statusParam = filter === "All" ? undefined : filter
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.myLeaves(statusParam, page),
    queryFn: () => fetchMyLeaves({ status: statusParam, page, perPage }),
    enabled,
  })
}

export function useLeaveById(id: number | null) {
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.leave(id),
    queryFn: () => fetchLeaveById(id!),
    enabled: id != null,
  })
}

export function useLeaveApprovals(leaveId: number | null) {
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.leaveApprovals(leaveId),
    queryFn: () => fetchLeaveApprovals(leaveId!),
    enabled: leaveId != null,
  })
}

export function useMyLeaveBalance() {
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.myBalance(),
    queryFn: fetchMyLeaveBalance,
  })
}

export function useUserLeaveBalance(userId: number | null) {
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.userBalance(userId),
    queryFn: () => fetchUserLeaveBalance(userId!),
    enabled: userId != null,
  })
}

export function useAllLeavesForApproval() {
  const { profile } = useProfile()
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.allLeaves(),
    queryFn: () => fetchAllLeavesForApproval(profile?.role),
  })
}

export function usePendingLeaveApprovals() {
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.pendingApprovals(),
    queryFn: fetchPendingLeaveApprovals,
  })
}

export function useLeaveTypes() {
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.leaveTypes(),
    queryFn: fetchLeaveTypes,
    staleTime: 1000 * 60 * 30,
  })
}

export function useLeaveTypeById(id: string | null) {
  return useQuery({
    queryKey: LEAVE_QUERY_KEYS.leaveType(id),
    queryFn: () => fetchLeaveTypeById(id!),
    enabled: id != null,
    staleTime: 1000 * 60 * 30,
  })
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

export function useCreateLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLeavePayload) => createLeaveRequest(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leaves", "my"] })
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.myBalance() })
      void qc.invalidateQueries({ queryKey: IN_APP_NOTIFICATION_QUERY_KEYS.list() })
      toast.success("Leave request submitted")
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => cancelLeaveRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leaves"] })
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.myBalance() })
      toast.success("Leave request cancelled")
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useUploadLeaveAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leaveId, file }: { leaveId: number; file: File }) =>
      uploadLeaveAttachment(leaveId, file),
    onSuccess: (_, { leaveId }) => {
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.leave(leaveId) })
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useDeleteLeaveAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ leaveId, attachmentId }: { leaveId: number; attachmentId: number }) =>
      deleteLeaveAttachment(leaveId, attachmentId),
    onSuccess: (_, { leaveId }) => {
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.leave(leaveId) })
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useApproveRejectLeave() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApproveRejectLeavePayload) => approveRejectLeave(payload),
    onSuccess: (_, { leaveId, action }) => {
      void qc.invalidateQueries({ queryKey: ["leaves"] })
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.leave(leaveId) })
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.leaveApprovals(leaveId) })
      void qc.invalidateQueries({ queryKey: IN_APP_NOTIFICATION_QUERY_KEYS.list() })
      toast.success(action === "approved" ? "Leave approved" : "Leave rejected")
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useCreateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateLeaveTypePayload) => createLeaveTypeApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.leaveTypes() })
      toast.success("Leave type created")
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useUpdateLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateLeaveTypePayload> }) =>
      updateLeaveTypeApi(id, data),
    onSuccess: (updated: LeaveType) => {
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.leaveTypes() })
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.leaveType(updated.id) })
      toast.success("Leave type updated")
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useDeleteLeaveType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLeaveTypeApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LEAVE_QUERY_KEYS.leaveTypes() })
      toast.success("Leave type deleted")
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useGrantOilDays() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: OilGrantPayload) => grantOilDaysApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["leave", "balance"] })
      toast.success("OIL days granted successfully")
    },
    onError: (err) => {
      toast.error(extractError(err).message)
    },
  })
}
