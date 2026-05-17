"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimDetailView } from "@/features/claims/components/ClaimDetailView";
import { ClaimDetailOrgApproveButton } from "@/features/claims/components/ClaimDetailOrgApproveButton";
import { RejectClaimDialog } from "@/features/claims/components/RejectClaimDialog";
import { RejectDiscIcon } from "@/features/claims/components/RejectDiscIcon";
import {
  CLAIM_QUERY_KEYS,
  useApproveRejectClaim,
  useClaimApprovals,
  useClaimById,
} from "@/features/claims/hooks/useClaims";
import type { Claim, ClaimApproval } from "@/features/claims/types";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { useAuth } from "@/shared/hooks/useAuth";
import { canRejectClaimFromMyClaimsList } from "@/shared/lib/role-utils";
import {
  fetchAllClaimsForApproval,
  getClaimSubmittedByDisplay,
} from "@/shared/lib/api-client/claims";

/** Reject control + dialog; mounted only for HOD / HR / top_management on pending/approved claims. */
function ClaimDetailRejectControls({
  claim,
  approvalsToShow,
}: {
  claim: Claim;
  approvalsToShow: ClaimApproval[];
}) {
  const rejectClaim = useApproveRejectClaim();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  if (!(claim.status === "Pending" || claim.status === "Approved")) {
    return null;
  }

  return (
    <>
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
    </>
  );
}

export function ClaimDetailPageClient({
  claimId,
  fromOrgAll = false,
}: {
  claimId: number;
  /** Opened from org-wide All Claims (`?from=all`) — back link + submitter line + approve. */
  fromOrgAll?: boolean;
}) {
  const { data: claim, isLoading, isError } = useClaimById(claimId);
  const { data: approvals, isPending: approvalsLoading } = useClaimApprovals(claimId);
  const { user } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  /** Same cache key as All Claims list — fills submitter when detail API omits it. */
  const { data: orgClaims } = useQuery({
    queryKey: [...CLAIM_QUERY_KEYS.allClaimsApproval(), profile?.role] as const,
    queryFn: () => fetchAllClaimsForApproval(profile!.role),
    enabled:
      fromOrgAll &&
      !profileLoading &&
      profile?.role != null &&
      String(profile.role).trim() !== "",
    staleTime: 30_000,
  });

  const orgListRow = useMemo(
    () => (fromOrgAll ? orgClaims?.find((c) => Number(c.id) === claimId) : undefined),
    [fromOrgAll, orgClaims, claimId],
  );

  const approvalsToShow: ClaimApproval[] =
    approvalsLoading ? [] : (approvals ?? []);

  const isEligibleForStep = useMemo(() => {
    if (!user?.id) return false;
    const pendingStep = approvalsToShow.find((a) => a.status === "pending");
    if (!pendingStep) return false;
    return (
      pendingStep.eligibleApprovers?.some(
        (a) => String(a.id) === String(user.id),
      ) ?? false
    );
  }, [approvalsToShow, user?.id]);

  const backHref = fromOrgAll ? "/dashboard/claims/all" : "/dashboard/claims";

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
          <Link href={backHref}>Back to Claims</Link>
        </Button>
      </div>
    );
  }

  const showRejectUi = canRejectClaimFromMyClaimsList(profile?.role, user?.roles);

  const submittedByLine = fromOrgAll
    ? (() => {
        const fromDetail = claim.submittedByDisplay?.trim();
        if (fromDetail && fromDetail !== "—") return fromDetail;
        const fromList = orgListRow ? getClaimSubmittedByDisplay(orgListRow).trim() : "";
        if (fromList && fromList !== "—") return fromList;
        return claim.submittedByDisplay ?? "—";
      })()
    : undefined;

  const claimForOrgActions =
    fromOrgAll && submittedByLine != null && submittedByLine !== "—"
      ? { ...claim, submittedByDisplay: submittedByLine }
      : claim;

  const headerTrailingActions =
    showRejectUi && fromOrgAll && isEligibleForStep ? (
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <ClaimDetailOrgApproveButton
          claim={claimForOrgActions}
          approvalsToShow={approvalsToShow}
        />
        <ClaimDetailRejectControls claim={claim} approvalsToShow={approvalsToShow} />
      </div>
    ) : null;

  return (
    <div className="w-full space-y-8 pb-8">
      <ClaimDetailView
        claim={claim}
        approvalsToShow={approvalsToShow}
        submittedByLine={submittedByLine}
        leadingAction={
          <Button variant="ghost" size="icon" className="shrink-0 -ml-2" asChild>
            <Link href={backHref} aria-label="Back to claims">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
        }
        headerTrailingActions={headerTrailingActions}
      />
    </div>
  );
}
