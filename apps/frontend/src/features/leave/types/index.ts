export type LeaveStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"

export type LeaveFilter = "All" | "Pending" | "Approved" | "Rejected" | "Cancelled" | "Draft"

export type LeaveDayType = "full" | "am" | "pm"

/** Approval step role kinds stored per leave type in the backend. */
export type LeaveApprovalStepKind = "hod" | "hr_admin" | "top_management"

// ---------------------------------------------------------------------------
// Leave Type (admin-configured)
// ---------------------------------------------------------------------------

export interface LeaveTypeApprovalStep {
  level: number
  role: LeaveApprovalStepKind
}

export interface LeaveType {
  id: string
  name: string
  key: string
  description?: string
  /** Days entitled per year. null = unlimited / manually granted (e.g. OIL). */
  annualQuota: number | null
  requiresAttachment: boolean
  /** Ordered approval chain for this leave type. */
  approvalChain: LeaveTypeApprovalStep[]
  /** totalDays >= this value triggers an extra approver level. null = no threshold. */
  durationThreshold: number | null
  durationThresholdRole: LeaveApprovalStepKind | null
  isActive: boolean
}

// ---------------------------------------------------------------------------
// Leave Approval (single level decision record)
// ---------------------------------------------------------------------------

export interface LeaveApprovalEligibleApprover {
  id: number
  name: string | null
}

export interface LeaveApproval {
  id: number
  leaveRequestId: number
  level: number
  stepKind: LeaveApprovalStepKind | null
  status: "pending" | "approved" | "rejected"
  approverId: number | null
  approverName: string | null
  reason: string | null
  decidedAt: string | null
  eligibleApprovers?: LeaveApprovalEligibleApprover[]
}

// ---------------------------------------------------------------------------
// Leave Attachment
// ---------------------------------------------------------------------------

export interface LeaveAttachment {
  id: number
  url: string
  originalName?: string
  mimeType?: string
}

// ---------------------------------------------------------------------------
// Leave Request (frontend type)
// ---------------------------------------------------------------------------

export interface LeaveRequest {
  id: number
  leaveTypeId: string
  leaveTypeName: string
  startDate: string
  endDate: string
  dayType: LeaveDayType
  /** 0.5 for half-day, whole number for full days. */
  totalDays: number
  reason: string
  status: LeaveStatus
  approvals: LeaveApproval[]
  attachments: LeaveAttachment[]
  /** Resolved submitter display name (for approver views). */
  submittedByDisplay?: string
  submittedAt?: string
  cancelledAt?: string | null
  cancelledReason?: string | null
}

// ---------------------------------------------------------------------------
// Leave Balance (per leave type, per user — backend-managed)
// ---------------------------------------------------------------------------

export interface LeaveBalance {
  leaveTypeId: string
  leaveTypeName: string
  entitled: number
  used: number
  pending: number
  remaining: number
}

// ---------------------------------------------------------------------------
// API response shapes (camelCase after axios interceptor)
// ---------------------------------------------------------------------------

export interface LeaveTypeApi {
  id: string | number
  name: string
  key: string
  description?: string
  annualQuota: number | null
  requiresAttachment: boolean
  approvalChain: Array<{ level: number; role: string }>
  durationThreshold: number | null
  durationThresholdRole: string | null
  isActive: boolean
}

export interface LeaveAttachmentApi {
  id: number
  path: string
  url?: string
  originalName?: string
  mimeType?: string
}

export interface LeaveApprovalEligibleApproverApi {
  id: number
  name: string | null
}

export interface LeaveApprovalApi {
  id: number
  leaveRequestId: number
  level: number
  stepKind?: string | null
  status: "pending" | "approved" | "rejected"
  approverId?: number | null
  approverName?: string | null
  reason?: string | null
  rejectionReason?: string | null
  decidedAt?: string | null
  eligibleApprovers?: LeaveApprovalEligibleApproverApi[]
}

export type LeaveSubmitterUserApi = {
  name?: string | null
  fullName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

export interface LeaveRequestApi {
  id: number
  leaveTypeId?: string | number
  leaveType?: { id: string | number; name: string; key: string } | null
  startDate: string
  endDate: string
  dayType: string
  totalDays: number
  reason: string
  status: string
  leaveApprovals?: LeaveApprovalApi[]
  attachments?: LeaveAttachmentApi[]
  createdAt?: string
  cancelledAt?: string | null
  cancelledReason?: string | null
  user?: LeaveSubmitterUserApi | null
  employee?: LeaveSubmitterUserApi | null
}

export interface LeaveBalanceApi {
  leaveTypeId: string | number
  leaveTypeName: string
  entitled: number
  used: number
  pending: number
  remaining: number
}

export interface LeavesListResponse {
  data: LeaveRequestApi[]
  meta?: {
    currentPage: number
    lastPage: number
    total: number
    perPage: number
  }
}
