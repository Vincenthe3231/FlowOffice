import {
  ROLE_HOD,
  ROLE_HR_ADMIN,
  ROLE_STAFF,
  isTopManagementSlug,
} from "@/shared/constants/roles";
import type {
  ClaimApproval,
  ClaimApprovalStepKind,
} from "@/features/claims/types";

/**
 * Ordered pipeline step kinds for the wizard preview, matching server
 * `ClaimApprovalChainResolver` by submitter primary role.
 */
export function previewStepKindsForSubmitterRole(
  role: string | undefined | null
): ClaimApprovalStepKind[] {
  const r = String(role ?? "")
    .trim()
    .toLowerCase();
  if (isTopManagementSlug(r)) return ["finance_hod"];
  if (r === ROLE_HR_ADMIN) return ["top_management", "finance_hod"];
  if (r === ROLE_HOD) return ["hr_hod", "top_management", "finance_hod"];
  if (r === ROLE_STAFF || r === "employee") {
    return ["dept_hod", "hr_hod", "top_management", "finance_hod"];
  }
  return ["dept_hod", "hr_hod", "top_management", "finance_hod"];
}

/** Synthetic rows for review-step timeline (negative ids = not persisted). */
export function previewClaimApprovalsFromStepKinds(
  claimId: number,
  kinds: ClaimApprovalStepKind[]
): ClaimApproval[] {
  return kinds.map((stepKind, i) => ({
    id: -(i + 1),
    claimId,
    level: i + 1,
    status: "pending" as const,
    reason: null,
    decidedAt: null,
    stepKind,
  }));
}
