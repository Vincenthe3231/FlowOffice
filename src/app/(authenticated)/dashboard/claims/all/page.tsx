"use client";

import { ClaimApprovalView } from "@/features/claims/components/ClaimApprovalView";

/**
 * Top Management — org-wide claim approvals (same experience as former Settings → Claim approvals tab).
 */
export default function AllClaimsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">All Claims</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Review submitted claims and process approvals. Updates appear as staff submit or move
          claims through the workflow.
        </p>
      </div>
      <ClaimApprovalView />
    </div>
  );
}
