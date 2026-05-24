export type OvertimeRequestStatus =
  | 'pending_l1'
  | 'pending_l2'
  | 'approved'
  | 'rejected'
  | 'cancelled'

export type OvertimeApprovalStatus = 'pending' | 'approved' | 'rejected'

export interface OvertimeApprovalApi {
  id: number
  level: number
  stepKind: string
  status: OvertimeApprovalStatus
  approver: { id: number; name: string } | null
  rejectionReason: string | null
  decidedAt: string | null
  eligibleApprovers: { id: number; name: string }[]
}

export interface OvertimeRequestApi {
  id: number
  userId: number
  user: { id: number; name: string; email: string } | null
  date: string
  startTime: string
  endTime: string
  reason: string
  isUrgent: boolean
  urgencyReason: string | null
  status: OvertimeRequestStatus
  metadata: Record<string, unknown> | null
  durationHours: number
  overtimeApprovals: OvertimeApprovalApi[] | null
  createdAt: string
  updatedAt: string
}

export function isOvertimePending(status: OvertimeRequestStatus): boolean {
  return status === 'pending_l1' || status === 'pending_l2'
}

export function isEligibleForOvertimeApproval(
  request: OvertimeRequestApi,
  currentUserId: number | undefined
): boolean {
  if (!currentUserId) return false
  if (!isOvertimePending(request.status)) return false
  const approvals = request.overtimeApprovals ?? []
  const pendingStep = approvals.find((a) => a.status === 'pending')
  if (!pendingStep) return false
  return pendingStep.eligibleApprovers.some(
    (a) => String(a.id) === String(currentUserId)
  )
}
