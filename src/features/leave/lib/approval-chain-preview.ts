import type { LeaveApproval, LeaveType, LeaveTypeApprovalStep } from "@/features/leave/types"

/**
 * Generates synthetic pending LeaveApproval rows (negative IDs) for the wizard review step.
 * Applies durationThreshold logic: if totalDays >= threshold, appends an extra level.
 */
export function previewLeaveApprovalsFromChain(
  leaveRequestId: number,
  leaveType: LeaveType,
  totalDays: number
): LeaveApproval[] {
  const baseChain: LeaveTypeApprovalStep[] = leaveType.approvalChain ?? []

  const extraStep: LeaveTypeApprovalStep | null =
    leaveType.durationThreshold != null &&
    leaveType.durationThresholdRole != null &&
    totalDays >= leaveType.durationThreshold
      ? {
          level: baseChain.length + 1,
          role: leaveType.durationThresholdRole,
        }
      : null

  const chain = extraStep != null ? [...baseChain, extraStep] : baseChain

  return chain.map((step, i) => ({
    id: -(i + 1),
    leaveRequestId,
    level: step.level,
    stepKind: step.role,
    status: "pending",
    approverId: null,
    approverName: null,
    reason: null,
    decidedAt: null,
  }))
}
