"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import { Check, Eye, Car, FileText } from "lucide-react";
import { RejectDiscIcon } from "@/features/claims/components/RejectDiscIcon";
import type { ClaimApproval, ClaimFilter } from "@/features/claims/types";
import {
  type ClaimWithApprovalsApi,
  getClaimSubmittedByDisplay,
} from "@/shared/lib/api-client/claims";
import { buildClaimDetailHrefFromOrgAll } from "@/features/claims/lib/claimUrlParams";
import { StatusBadge } from "@/features/attendance";
import { CLAIM_FILTERS } from "@/features/claims/data";

const statusLabel: Record<string, string> = {
  draft: "Draft",
  pending_l1: "L1 Pending (HOD)",
  pending_l2: "L2 Pending (Admin/HR)",
  pending_l3: "L3 Pending (Top Management)",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Paid",
};

/** Map API claim status to the same filter buckets as the personal All Claims table. */
function apiStatusToClaimFilter(status: string): ClaimFilter | null {
  const s = String(status).toLowerCase();
  if (s.startsWith("pending")) return "Pending";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  if (s === "paid") return "Paid";
  if (s === "draft") return "Draft";
  return null;
}

function mapApprovalStatusToBadgeString(status: string): string {
  const s = String(status).toLowerCase();
  if (s.startsWith("pending")) return "Pending";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  if (s === "paid") return "Paid";
  if (s === "draft") return "Draft";
  return statusLabel[status] ?? status;
}

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

function categoryLabel(claim: ClaimWithApprovalsApi): string {
  return (
    claim.claimTypes?.label ??
    claim.claimType?.label ??
    claim.category?.name ??
    claim.type ??
    "—"
  );
}

function dateDisplay(claim: ClaimWithApprovalsApi): string {
  if (claim.claimDate) return claim.claimDate.slice(0, 10);
  if (claim.createdAt) {
    const d = new Date(claim.createdAt);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return "—";
}

export function ClaimApprovalView() {
  const router = useRouter();
  const { data: claims, isLoading } = useAllClaimsForApproval();
  const approveReject = useApproveRejectClaim();
  const [approveTarget, setApproveTarget] = useState<ClaimWithApprovalsApi | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ClaimWithApprovalsApi | null>(null);
  const [approveReason, setApproveReason] = useState("");
  const [filter, setFilter] = useState<ClaimFilter>("All");

  const filteredClaims = useMemo(() => {
    if (!claims?.length) return [];
    if (filter === "All") return claims;
    return claims.filter((c) => {
      const mapped = apiStatusToClaimFilter(String(c.status));
      return mapped === filter;
    });
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

  const approveTargetApprovals = approveTarget?.claimApprovals
    ? mapApprovals(approveTarget.claimApprovals)
    : [];

  const handleFilterSelect = (value: ClaimFilter) => {
    if (value !== filter) setFilter(value);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">All Claims</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Review submitted claims and process approvals. Updates appear as staff submit or move
          claims through the workflow.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={filter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          <Card className="premium-shadow border-0">
            <CardHeader className="px-4 pb-2 pt-4 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold sm:text-base">All Claims</CardTitle>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {filteredClaims.length} records
                  </p>
                </div>
                <div className="w-full sm:max-w-[420px]">
                  <div className="flex flex-nowrap items-center gap-1 rounded-full bg-muted/40 p-1">
                    {CLAIM_FILTERS.map((claimFilter) => {
                      const isActive = filter === claimFilter;
                      return (
                        <motion.div key={claimFilter} whileTap={{ scale: 0.97 }}>
                          <button
                            type="button"
                            onClick={() => handleFilterSelect(claimFilter)}
                            className="relative h-6 shrink-0 whitespace-nowrap rounded-full border border-transparent bg-muted/60 px-2 text-[10px] text-muted-foreground transition-colors hover:bg-muted sm:h-7 sm:px-2.5 sm:text-[11px]"
                            aria-pressed={isActive}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="org-claims-active-tab"
                                className="pointer-events-none absolute inset-0 rounded-full bg-primary"
                                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                              />
                            )}
                            <span
                              className={`relative z-10 transition-colors ${
                                isActive ? "text-primary-foreground" : "text-muted-foreground"
                              }`}
                            >
                              {claimFilter}
                            </span>
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                {isLoading ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
                ) : !filteredClaims.length ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">No claims found</div>
                ) : (
                  <Table className="text-xs sm:text-sm">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-9 px-3 text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                          Title
                        </TableHead>
                        <TableHead className="h-9 px-3 text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                          Submitted by
                        </TableHead>
                        <TableHead className="hidden h-9 px-3 text-[10px] uppercase tracking-wide sm:table-cell sm:h-10 sm:px-4">
                          Category
                        </TableHead>
                        <TableHead className="h-9 px-3 text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                          Amount
                        </TableHead>
                        <TableHead className="hidden h-9 px-3 text-[10px] uppercase tracking-wide md:table-cell md:h-10 md:px-4">
                          Date
                        </TableHead>
                        <TableHead className="h-9 px-3 text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                          Status
                        </TableHead>
                        <TableHead className="h-9 w-[140px] px-3 text-right text-[10px] uppercase tracking-wide sm:h-10 sm:px-4">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClaims.map((claim: ClaimWithApprovalsApi) => (
                        <TableRow
                          key={claim.id}
                          className="cursor-pointer transition-colors duration-200 hover:bg-muted/50"
                          onClick={() =>
                            router.push(buildClaimDetailHrefFromOrgAll(claim.id))
                          }
                        >
                          <TableCell className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <motion.div
                              className="flex items-start gap-2"
                              whileHover={{ x: 2 }}
                              transition={{ duration: 0.18 }}
                            >
                              {claim.type === "mileage" ? (
                                <Car className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                              ) : (
                                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground sm:h-4 sm:w-4" />
                              )}
                              <div className="min-w-0">
                                <span className="block truncate text-xs font-medium sm:text-sm">
                                  {claim.title}
                                </span>
                                <span className="mt-0.5 block text-[10px] text-muted-foreground sm:hidden">
                                  {categoryLabel(claim)} • {dateDisplay(claim)}
                                </span>
                              </div>
                            </motion.div>
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-xs text-foreground sm:px-4 sm:py-3 sm:text-sm">
                            <span className="font-medium">
                              {getClaimSubmittedByDisplay(claim)}
                            </span>
                          </TableCell>
                          <TableCell className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell sm:px-4 sm:py-3 sm:text-sm">
                            {categoryLabel(claim)}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-xs font-semibold sm:px-4 sm:py-3 sm:text-sm">
                            RM {Number(claim.amount).toFixed(2)}
                          </TableCell>
                          <TableCell className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell md:px-4 md:py-3 md:text-sm">
                            {dateDisplay(claim)}
                          </TableCell>
                          <TableCell className="px-3 py-2.5 sm:px-4 sm:py-3">
                            <StatusBadge
                              status={mapApprovalStatusToBadgeString(String(claim.status))}
                              className="px-2 py-0.5 text-[9px] sm:text-[10px]"
                            />
                          </TableCell>
                          <TableCell className="px-3 py-2.5 text-right sm:px-4 sm:py-3">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 gap-1 text-[10px] sm:text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(buildClaimDetailHrefFromOrgAll(claim.id));
                                }}
                              >
                                <Eye className="h-3 w-3" /> View
                              </Button>
                              {isPending(String(claim.status)) && (
                                <>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 gap-1 border-emerald-200/50 text-[10px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 sm:text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setApproveTarget(claim);
                                    }}
                                  >
                                    <Check className="h-3 w-3" /> Approve
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-9 gap-2 px-3 text-sm font-medium text-destructive border-border/70 shadow-sm transition-all hover:border-destructive/40 hover:bg-destructive/[0.07] hover:shadow active:scale-[0.98]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setRejectTarget(claim);
                                    }}
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
        </motion.div>
      </AnimatePresence>

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
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-muted-foreground">Title</span>
                  <span className="text-sm font-medium text-right">{approveTarget.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted-foreground">Submitted by</span>
                  <span className="text-sm font-medium">
                    {getClaimSubmittedByDisplay(approveTarget)}
                  </span>
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
                  placeholder="Optional comment…"
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex justify-end gap-2">
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
                  {approveReject.isPending ? "Processing…" : "Confirm Approve"}
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
