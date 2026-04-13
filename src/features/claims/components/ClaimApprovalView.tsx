"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAllClaimsForApproval, useApproveRejectClaim } from "@/features/claims/hooks/useClaims";
import { ApprovalTimeline } from "@/features/claims/components/ApprovalTimeline";
import { RejectClaimDialog } from "@/features/claims/components/RejectClaimDialog";
import { ShieldCheck, Check, Eye } from "lucide-react";
import { RejectDiscIcon } from "@/features/claims/components/RejectDiscIcon";
import type { ClaimApproval } from "@/features/claims/types";
import type { ClaimWithApprovalsApi } from "@/shared/lib/api-client/claims";

type ApprovalFilter = "All" | "Pending" | "Approved" | "Rejected";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_l1: "L1 Pending (HOD)",
  pending_l2: "L2 Pending (Admin/HR)",
  pending_l3: "L3 Pending (Top Management)",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

const statusToFilter: Record<string, ApprovalFilter> = {
  pending_l1: "Pending",
  pending_l2: "Pending",
  pending_l3: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Approved",
};

function mapApprovals(approvals: unknown): ClaimApproval[] {
  if (!Array.isArray(approvals)) return [];
  return approvals.map((a: Record<string, unknown>) => ({
    id: Number(a.id),
    claimId: Number(a.claimId ?? a.claim_id),
    level: Number(a.level),
    status: String(a.status ?? "pending") as "pending" | "approved" | "rejected",
    reason: (a.reason as string) ?? null,
    decidedAt: (a.decidedAt ?? a.decided_at) as string | null,
  }));
}

export function ClaimApprovalView() {
  const { data: claims, isLoading } = useAllClaimsForApproval();
  const approveReject = useApproveRejectClaim();
  const [approveTarget, setApproveTarget] = useState<ClaimWithApprovalsApi | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ClaimWithApprovalsApi | null>(null);
  const [approveReason, setApproveReason] = useState("");
  const [detailClaim, setDetailClaim] = useState<ClaimWithApprovalsApi | null>(null);
  const [filter, setFilter] = useState<ApprovalFilter>("All");

  const filteredClaims = useMemo(() => {
    if (!claims) return [];
    if (filter === "All") return claims;
    return claims.filter(
      (c: ClaimWithApprovalsApi) =>
        statusToFilter[String(c.status)] === filter
    );
  }, [claims, filter]);

  const isPending = (status: string) => String(status).startsWith("pending_");

  const handleApproveConfirm = async () => {
    if (!approveTarget) return;
    const status = String(approveTarget.status);
    const currentLevel =
      status === "pending_l1" ? 1 : status === "pending_l2" ? 2 : 3;

    try {
      await approveReject.mutateAsync({
        claimId: Number(approveTarget.id),
        level: currentLevel,
        action: "approved",
        reason: approveReason.trim() || undefined,
      });
      setApproveTarget(null);
      setApproveReason("");
    } catch {
      // toast in mutation
    }
  };

  const detailApprovals = detailClaim?.claimApprovals
    ? mapApprovals(detailClaim.claimApprovals)
    : [];
  const approveTargetApprovals = approveTarget?.claimApprovals
    ? mapApprovals(approveTarget.claimApprovals)
    : [];

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-primary p-6 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary-foreground">
              Claim Approvals
            </h1>
            <p className="text-sm text-primary-foreground/70 mt-0.5">
              Review and process claims
            </p>
          </div>
        </div>
      </div>

      <Card className="premium-shadow border-0">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-base font-semibold">
              Claims ({filteredClaims?.length ?? 0})
            </CardTitle>
            <Tabs value={filter} onValueChange={(v) => setFilter(v as ApprovalFilter)}>
              <TabsList className="h-8">
                {(["All", "Pending", "Approved", "Rejected"] as ApprovalFilter[]).map(
                  (f) => (
                    <TabsTrigger key={f} value={f} className="text-xs px-2.5 h-6">
                      {f}
                    </TabsTrigger>
                  )
                )}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            {isLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : !filteredClaims?.length ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No claims found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClaims.map((claim: ClaimWithApprovalsApi) => (
                    <TableRow
                      key={claim.id}
                      className="hover:bg-primary/5 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{claim.title}</p>
                          {(claim as unknown as Record<string, string>).claimantName != null && (
                            <p className="text-xs text-muted-foreground">
                              ({(claim as unknown as Record<string, string>).claimantName})
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold">
                        RM {Number(claim.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium">
                          {statusLabel[String(claim.status)] ?? String(claim.status)}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {claim.createdAt
                          ? new Date(claim.createdAt).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1.5 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1 hover:bg-primary/10"
                            onClick={() => setDetailClaim(claim)}
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          {isPending(String(claim.status)) && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 text-emerald-600 border-emerald-200/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                onClick={() => setApproveTarget(claim)}
                              >
                                <Check className="h-3 w-3" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 gap-2 px-3 text-sm font-medium text-destructive border-border/70 shadow-sm transition-all hover:border-destructive/40 hover:bg-destructive/[0.07] hover:shadow active:scale-[0.98]"
                                onClick={() => setRejectTarget(claim)}
                              >
                                <RejectDiscIcon size="sm" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      <Dialog open={!!detailClaim} onOpenChange={() => setDetailClaim(null)}>
        <DialogContent className="sm:max-w-lg premium-shadow border-0">
          <DialogHeader>
            <DialogTitle>Claim Details</DialogTitle>
          </DialogHeader>
          {detailClaim && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {detailClaim.title}
                  </p>
                  {(detailClaim as unknown as Record<string, string>).claimantName && (
                    <p className="text-xs text-muted-foreground">
                      by {(detailClaim as unknown as Record<string, string>).claimantName}
                    </p>
                  )}
                </div>
                <div className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  RM {Number(detailClaim.amount).toFixed(2)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Type
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {detailClaim.claimTypes?.label ?? detailClaim.type ?? "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Status
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {statusLabel[String(detailClaim.status)]}
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Submitted
                  </p>
                  <p className="text-sm font-medium text-foreground mt-0.5">
                    {detailClaim.createdAt
                      ? new Date(detailClaim.createdAt).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {detailClaim.description && (
                <div className="p-3 rounded-lg border border-border/50">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                    Description
                  </p>
                  <p className="text-sm text-foreground">
                    {detailClaim.description}
                  </p>
                </div>
              )}

              {detailApprovals.length > 0 && (
                <ApprovalTimeline
                  approvals={detailApprovals}
                  claimStatus={String(detailClaim.status)}
                  submittedDate={
                    detailClaim.createdAt
                      ? new Date(detailClaim.createdAt).toLocaleDateString()
                      : undefined
                  }
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!approveTarget}
        onOpenChange={() => {
          setApproveTarget(null);
          setApproveReason("");
        }}
      >
        <DialogContent className="sm:max-w-md premium-shadow border-0">
          <DialogHeader>
            <DialogTitle>Approve Claim</DialogTitle>
          </DialogHeader>
          {approveTarget && (
            <div className="space-y-4">
              <div className="space-y-2 rounded-lg border border-border/50 p-3">
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Title</span>
                  <span className="text-sm font-medium">{approveTarget.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Amount</span>
                  <span className="text-sm font-bold">
                    RM {Number(approveTarget.amount).toFixed(2)}
                  </span>
                </div>
              </div>

              {approveTargetApprovals.length > 0 && (
                <ApprovalTimeline
                  approvals={approveTargetApprovals}
                  claimStatus={String(approveTarget.status)}
                  submittedDate={
                    approveTarget.createdAt
                      ? new Date(approveTarget.createdAt).toLocaleDateString()
                      : undefined
                  }
                />
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Comment
                </label>
                <Textarea
                  value={approveReason}
                  onChange={(e) => setApproveReason(e.target.value)}
                  placeholder="Optional comment..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setApproveTarget(null);
                    setApproveReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={() => void handleApproveConfirm()}
                  disabled={approveReject.isPending}
                >
                  {approveReject.isPending ? "Processing..." : "Confirm Approve"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <RejectClaimDialog
        claim={
          rejectTarget
            ? {
                id: Number(rejectTarget.id),
                title: rejectTarget.title,
                amount: Number(rejectTarget.amount),
                categoryLabel: rejectTarget.claimTypes?.label ?? rejectTarget.type,
                date: rejectTarget.createdAt
                  ? new Date(rejectTarget.createdAt).toLocaleDateString()
                  : rejectTarget.claimDate
                    ? new Date(rejectTarget.claimDate).toLocaleDateString()
                    : undefined,
              }
            : null
        }
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        isPending={approveReject.isPending}
        onReject={({ claimId, reason }) => {
          const c = rejectTarget;
          if (!c) return;
          const status = String(c.status);
          const level =
            status === "pending_l1" ? 1 : status === "pending_l2" ? 2 : 3;
          approveReject.mutate(
            { claimId, level, action: "rejected", reason },
            { onSuccess: () => setRejectTarget(null) }
          );
        }}
      />
    </div>
  );
}
