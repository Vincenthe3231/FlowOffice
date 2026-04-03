"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** Minimal claim shape for the reject confirmation dialog */
export interface RejectClaimSummary {
  id: number;
  title: string;
  amount: number;
  categoryLabel?: string;
  date?: string;
}

interface RejectClaimDialogProps {
  claim: RejectClaimSummary | null;
  onOpenChange: (open: boolean) => void;
  isPending?: boolean;
  onReject: (params: { claimId: number; reason: string }) => void;
}

export function RejectClaimDialog({
  claim,
  onOpenChange,
  isPending = false,
  onReject,
}: RejectClaimDialogProps) {
  const [reason, setReason] = useState("");

  const claimId = claim?.id;
  useEffect(() => {
    setReason("");
  }, [claimId]);

  const open = claim != null;

  function handleClose() {
    setReason("");
    onOpenChange(false);
  }

  function handleConfirm() {
    if (!claim || !reason.trim()) return;
    onReject({ claimId: claim.id, reason: reason.trim() });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md premium-shadow border-0">
        <DialogHeader>
          <DialogTitle>Reject Claim</DialogTitle>
        </DialogHeader>
        {claim && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-lg border border-border/50 p-3">
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground">Title</span>
                <span className="text-right text-sm font-medium">{claim.title}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-xs text-muted-foreground">Amount</span>
                <span className="text-sm font-bold">RM {Number(claim.amount).toFixed(2)}</span>
              </div>
              {claim.categoryLabel && (
                <div className="flex justify-between gap-2 border-t border-border/40 pt-2">
                  <span className="text-xs text-muted-foreground">Category</span>
                  <span className="text-sm font-medium">{claim.categoryLabel}</span>
                </div>
              )}
              {claim.date && (
                <div className="flex justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Date</span>
                  <span className="text-sm text-muted-foreground">{claim.date}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleConfirm}
                disabled={isPending || !reason.trim()}
              >
                {isPending ? "Processing..." : "Confirm Reject"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
