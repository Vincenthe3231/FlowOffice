import type { LeaveFilter, LeaveApprovalStepKind } from "@/features/leave/types"

export const LEAVE_FILTERS: LeaveFilter[] = [
  "All",
  "Pending",
  "Approved",
  "Rejected",
  "Cancelled",
  "Draft",
]

export const LEAVE_STEP_KIND_LABELS: Record<LeaveApprovalStepKind, string> = {
  hod: "Department HOD",
  hr_admin: "HR Review",
  top_management: "Top Management",
}

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
}

export const LEAVE_DAY_TYPE_LABELS: Record<string, string> = {
  full: "Full day",
  am: "AM only",
  pm: "PM only",
}

/** Default leave type keys seeded on fresh installs. */
export const DEFAULT_LEAVE_TYPE_KEYS = [
  "annual_leave",
  "medical_leave",
  "compassionate_leave",
  "disaster_leave",
  "marriage_leave",
  "unpaid_leave",
  "hospitalization_leave",
  "off_in_lieu",
] as const

/** Leave types that require attachment by default. HR can override per type. */
export const DEFAULT_REQUIRES_ATTACHMENT_KEYS = new Set<string>([
  "medical_leave",
  "hospitalization_leave",
  "compassionate_leave",
])

export const LEAVE_BALANCE_COLORS = [
  "hsl(215, 80%, 55%)",
  "hsl(145, 60%, 40%)",
  "hsl(30, 80%, 50%)",
  "hsl(270, 60%, 55%)",
  "hsl(340, 65%, 55%)",
  "hsl(195, 70%, 50%)",
  "hsl(48, 90%, 50%)",
  "hsl(10, 70%, 55%)",
]

export const LEAVE_DRAFT_MAX_ATTACHMENT_FILES = 5
