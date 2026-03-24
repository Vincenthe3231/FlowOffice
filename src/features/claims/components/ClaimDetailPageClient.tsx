"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimDetailView } from "@/features/claims/components/ClaimDetailView";
import { useClaimApprovals, useClaimById } from "@/features/claims/hooks/useClaims";
import type { ClaimApproval } from "@/features/claims/types";

export function ClaimDetailPageClient({ claimId }: { claimId: number }) {
  const { data: claim, isLoading, isError } = useClaimById(claimId);
  const { data: approvals } = useClaimApprovals(claimId);

  const fallbackApprovals: ClaimApproval[] =
    claim != null
      ? [
          { id: -1, claimId: claim.id, level: 1, status: "pending" },
          { id: -2, claimId: claim.id, level: 2, status: "pending" },
        ]
      : [];

  const approvalsToShow: ClaimApproval[] =
    approvals && approvals.length > 0 ? approvals : fallbackApprovals;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading claim…
      </div>
    );
  }

  if (isError || !claim) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-foreground">Claim not found</p>
        <p className="text-sm text-muted-foreground">
          This claim may have been removed or you don&apos;t have access.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/claims">Back to Claims</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-8">
      <ClaimDetailView
        claim={claim}
        approvalsToShow={approvalsToShow}
        leadingAction={
          <Button variant="ghost" size="icon" className="shrink-0 -ml-2" asChild>
            <Link href="/dashboard/claims" aria-label="Back to claims">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        }
      />
    </div>
  );
}
