"use client";

import { Check, Clock, X, ShieldCheck } from "lucide-react";
import type { ClaimApproval } from "@/features/claims/types";
import { Card, CardContent } from "@/components/ui/card";

interface ApprovalTimelineProps {
  approvals: ClaimApproval[];
  claimStatus: string;
  submittedDate?: string;
}

const levelLabels: Record<number, string> = {
  1: "HOD Review",
  2: "Admin/HR Review",
  3: "Superadmin Review",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "approved")
    return <Check className="h-3.5 w-3.5 text-primary-foreground" />;
  if (status === "rejected")
    return <X className="h-3.5 w-3.5 text-primary-foreground" />;
  return <Clock className="h-3.5 w-3.5 text-primary-foreground" />;
}

function statusBg(status: string) {
  if (status === "approved") return "bg-green-500";
  if (status === "rejected") return "bg-destructive";
  return "bg-muted-foreground/40";
}

export function ApprovalTimeline({
  approvals,
  claimStatus,
  submittedDate,
}: ApprovalTimelineProps) {
  const sorted = [...approvals].sort((a, b) => a.level - b.level);

  return (
    <Card className="premium-shadow border-0 rounded-xl overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="h-6 w-6 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Approval Pipeline
          </p>
        </div>

        <div className="relative ml-1 space-y-4">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/40 via-primary/20 to-border/30" />

          <div className="flex items-start gap-3 relative z-10">
            <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md">
              <Check className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Submitted</p>
              <p className="text-xs text-muted-foreground">
                {submittedDate || "Just now"}
              </p>
            </div>
          </div>

          {sorted.map((approval) => (
            <div key={approval.id} className="flex items-start gap-3 relative z-10">
              <div
                className={`w-4 h-4 rounded-full ${statusBg(approval.status)} flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md ${approval.status === "pending" ? "animate-pulse" : ""}`}
              >
                <StatusIcon status={approval.status} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {levelLabels[approval.level] || `Level ${approval.level}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {approval.status === "pending"
                    ? "Awaiting review"
                    : approval.status === "approved"
                      ? `Approved${approval.decidedAt ? ` • ${new Date(approval.decidedAt).toLocaleDateString()}` : ""}`
                      : `Rejected${approval.decidedAt ? ` • ${new Date(approval.decidedAt).toLocaleDateString()}` : ""}`}
                </p>
                {approval.reason && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    &quot;{approval.reason}&quot;
                  </p>
                )}
              </div>
            </div>
          ))}

          {(claimStatus === "approved" || claimStatus === "paid") && (
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {claimStatus === "paid"
                    ? "Payment Processed"
                    : "Fully Approved"}
                </p>
              </div>
            </div>
          )}

          {claimStatus === "rejected" && (
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center mt-0.5 shrink-0 ring-2 ring-background shadow-md">
                <X className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">
                  Claim Rejected
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
