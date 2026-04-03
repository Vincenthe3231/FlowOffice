"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimDetailView } from "@/features/claims/components/ClaimDetailView";
import { RejectClaimDialog } from "@/features/claims/components/RejectClaimDialog";
import { RejectDiscIcon } from "@/features/claims/components/RejectDiscIcon";
import {
  useApproveRejectClaim,
  useClaimApprovals,
  useClaimById,
} from "@/features/claims/hooks/useClaims";
import type { ClaimApproval } from "@/features/claims/types";

export function ClaimDetailPageClient({ claimId }: { claimId: number }) {
  const { data: claim, isLoading, isError } = useClaimById(claimId);
  const { data: approvals } = useClaimApprovals(claimId);
  const rejectClaim = useApproveRejectClaim();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

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

  const canReject = claim.status === "Pending" || claim.status === "Approved";

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
        headerTrailingActions={
          canReject ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              className="h-10 gap-2.5 border-border/70 bg-card px-4 text-sm font-semibold text-destructive shadow-sm transition-all hover:border-destructive/40 hover:bg-destructive/[0.07] hover:shadow-md active:scale-[0.98]"
              onClick={() => setRejectDialogOpen(true)}
            >
              <RejectDiscIcon size="md" />
              Reject
            </Button>
          ) : null
        }
      />

      <RejectClaimDialog
        claim={
          rejectDialogOpen
            ? {
                id: claim.id,
                title: claim.title,
                amount: claim.amount,
                categoryLabel: claim.claimTypeLabel ?? claim.category,
                date: claim.date
                  ? (() => {
                      const d = new Date(claim.date);
                      return Number.isNaN(d.getTime())
                        ? claim.date
                        : d.toLocaleDateString();
                    })()
                  : undefined,
              }
            : null
        }
        onOpenChange={(open) => {
          if (!open) setRejectDialogOpen(false);
        }}
        isPending={rejectClaim.isPending}
        onReject={({ claimId: id, reason }) => {
          const pending = approvalsToShow.find((a) => a.status === "pending");
          const level = pending?.level ?? 1;
          rejectClaim.mutate(
            { claimId: id, level, action: "rejected", reason },
            { onSuccess: () => setRejectDialogOpen(false) }
          );
        }}
      />
    </div>
  );
}
