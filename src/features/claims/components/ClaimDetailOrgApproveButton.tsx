"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApprovalTimeline } from "@/features/claims/components/ApprovalTimeline";
import { useApproveRejectClaim } from "@/features/claims/hooks/useClaims";
import type { Claim, ClaimApproval } from "@/features/claims/types";

type ClaimDetailOrgApproveButtonProps = {
  claim: Claim;
  approvalsToShow: ClaimApproval[];
};

/**
 * Approve action for viewers coming from org-wide All Claims (`?from=all`).
 * Level is taken from the first approval row still in `pending` status.
 */
export function ClaimDetailOrgApproveButton({
  claim,
  approvalsToShow,
}: ClaimDetailOrgApproveButtonProps) {
  const approveReject = useApproveRejectClaim();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  const hasPendingStep = approvalsToShow.some((a) => a.status === "pending");
  if (claim.status !== "Pending" || !hasPendingStep) return null;

  const pending = approvalsToShow.find((a) => a.status === "pending");
  const level = pending?.level ?? 1;

  const handleConfirm = async () => {
    try {
      await approveReject.mutateAsync({
        claimId: claim.id,
        level,
        action: "approved",
        reason: reason.trim() || undefined,
      });
      setOpen(false);
      setReason("");
    } catch {
      // toast in mutation
    }
  };

  return (
    <>
      <Button
        type="button"
        className="h-10 gap-2 bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        onClick={() => setOpen(true)}
      >
        <Check className="h-4 w-4" />
        Approve
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setReason("");
          setOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-md premium-shadow border-0">
          <DialogHeader>
            <DialogTitle>Approve Claim</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-border/50 p-3">
              <div className="flex justify-between gap-4">
                <span className="text-xs text-muted-foreground">Title</span>
                <span className="text-sm font-medium text-right">{claim.title}</span>
              </div>
              {claim.submittedByDisplay != null && claim.submittedByDisplay !== "—" && (
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Submitted by</span>
                  <span className="text-sm font-medium">{claim.submittedByDisplay}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="text-sm font-bold">RM {claim.amount.toFixed(2)}</span>
              </div>
            </div>

            {approvalsToShow.length > 0 && (
              <ApprovalTimeline
                approvals={approvalsToShow}
                claimStatus={claim.status.toLowerCase()}
                submittedDate={
                  claim.date
                    ? (() => {
                        const d = new Date(claim.date);
                        return Number.isNaN(d.getTime())
                          ? claim.date
                          : d.toLocaleDateString();
                      })()
                    : undefined
                }
              />
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Comment
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional comment…"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => void handleConfirm()}
                disabled={approveReject.isPending}
              >
                {approveReject.isPending ? "Processing…" : "Confirm Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
