"use client";

import {
  AlignLeft,
  Car,
  Calendar,
  ExternalLink,
  FileText,
  MapPin,
  Navigation,
  Paperclip,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ApprovalTimeline,
  formatPipelineTimestamp,
} from "@/features/claims/components/ApprovalTimeline";
import type { Claim, ClaimApproval } from "@/features/claims/types";
import { cn } from "@/lib/utils";

const DEFAULT_STATUS_COLOR = {
  bg: "bg-muted",
  text: "text-muted-foreground",
  dot: "bg-muted-foreground",
} as const;

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  Pending: {
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  Approved: {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  Rejected: {
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-800 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  Paid: {
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    text: "text-blue-800 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  Draft: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
};

export interface ClaimDetailViewProps {
  claim: Claim;
  approvalsToShow: ClaimApproval[];
  leadingAction?: ReactNode;
  headerTrailingActions?: ReactNode;
  /** When set (e.g. org All Claims), show “Submitted by …” under the title. */
  submittedByLine?: string | null;
}

export function ClaimDetailView({
  claim,
  approvalsToShow,
  leadingAction,
  headerTrailingActions,
  submittedByLine,
}: ClaimDetailViewProps) {
  const amountStr = claim.amount.toFixed(2);
  const [amountInt, amountDec] = amountStr.split(".");
  const sc = statusColors[claim.status] ?? DEFAULT_STATUS_COLOR;
  const claimIndex = String(claim.id).slice(0, 8).toUpperCase();
  const attachments = claim.attachments ?? [];
  const hasAttachments = attachments.length > 0;
  const firstImageAttachment = attachments.find(
    (a) =>
      (a.mimeType?.startsWith("image/") ?? false) ||
      /\.(png|jpe?g|gif|webp)$/i.test(a.originalName ?? "")
  );

  const transactionDateDisplay = formatPipelineTimestamp(claim.date);

  return (
    <div className="w-full max-w-6xl space-y-6 lg:space-y-8">
      {/* Header — Stitch-style: title + status left; total reimbursement right */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {leadingAction}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
                Claim #{claimIndex}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-black uppercase tracking-widest",
                  sc.text,
                  sc.bg
                )}
              >
                {claim.status === "Pending" && (
                  <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", sc.dot)} />
                )}
                {claim.status}
              </span>
            </div>
            <h1
              id="claim-detail-title"
              className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              {claim.title}
            </h1>
            {submittedByLine != null && submittedByLine !== "" && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                Submitted by{" "}
                <span className="font-medium text-foreground">{submittedByLine}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:flex-col lg:items-end">
          <div className="text-left sm:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Total reimbursement
            </p>
            <p className="mt-0.5 text-3xl font-black tabular-nums tracking-tight text-foreground sm:text-4xl">
              <span className="text-xl font-bold text-foreground sm:text-2xl">RM</span>{" "}
              {amountInt}
              <span className="text-xl text-foreground sm:text-2xl">.{amountDec}</span>
            </p>
          </div>
          {headerTrailingActions ? (
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">{headerTrailingActions}</div>
          ) : null}
        </div>
      </div>

      {/* Metadata row — label + value left, large icon right */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Transaction date
              </p>
              <p className="mt-1.5 text-base font-bold text-foreground">{transactionDateDisplay}</p>
            </div>
            <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/70">
              <Calendar className="h-10 w-10 text-sky-400" strokeWidth={1.5} aria-hidden />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Category
              </p>
              <p className="mt-1.5 text-base font-bold text-foreground">
                {claim.claimTypeLabel ?? claim.category ?? "—"}
              </p>
            </div>
            <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/70">
              <FileText className="h-10 w-10 text-amber-400" strokeWidth={1.5} aria-hidden />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Claim type
              </p>
              <p className="mt-1.5 text-base font-bold capitalize text-foreground">
                {claim.subclaimTypeLabel ?? claim.type ?? "—"}
              </p>
            </div>
            <div className="flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center rounded-xl border border-border/80 bg-muted/70">
              <Car className="h-10 w-10 text-cyan-300" strokeWidth={1.5} aria-hidden />
            </div>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid gap-6 lg:items-start",
          hasAttachments ? "lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)] lg:gap-8" : "lg:grid-cols-1"
        )}
      >
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          {claim.type === "mileage" && claim.fromLocation && claim.toLocation && (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/10 blur-3xl opacity-70" />
              <h3 className="relative z-10 mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <MapPin size={16} className="text-cyan-500/90" /> Mileage route
              </h3>
              <div className="relative mb-6 space-y-8 pl-8">
                <div className="absolute bottom-2 left-[11px] top-2 w-px bg-border" />
                <div className="relative z-10">
                  <div className="absolute -left-[37px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  </div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Origin
                  </p>
                  <p className="pr-4 text-sm font-semibold leading-relaxed text-foreground">
                    {claim.fromLocation}
                  </p>
                </div>
                <div className="relative z-10">
                  <div className="absolute -left-[37px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-card shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-rose-500" />
                  </div>
                  <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Destination
                  </p>
                  <p className="pr-4 text-sm font-semibold leading-relaxed text-foreground">
                    {claim.toLocation}
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-center justify-between rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                  <Navigation size={16} /> Total distance
                </div>
                <div className="text-xl font-black tabular-nums text-cyan-500/90">{claim.distance} km</div>
              </div>
            </div>
          )}

          <ApprovalTimeline
            variant="horizontal"
            approvals={approvalsToShow}
            claimStatus={claim.status.toLowerCase()}
            submittedDate={claim.date}
          />

          {(claim.customFields ?? []).length > 0 && (
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                <FileText size={16} className="text-cyan-500/90" /> Custom fields
              </h3>
              {claim.customFields!.map((f) => (
                <div key={f.id}>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {f.label}
                  </p>
                  <p className="rounded-xl border border-border bg-muted/50 p-3 text-sm font-medium text-foreground">
                    {f.value || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <AlignLeft size={16} className="text-cyan-500/90" /> Description / remarks
            </h3>
            <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm font-medium leading-relaxed text-foreground">
              {claim.description || "No description provided"}
            </p>
          </div>
        </div>

        {/* Right column — receipt / attachments only when present */}
        {hasAttachments ? (
          <div className="min-w-0 space-y-4 lg:sticky lg:top-24">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  <Paperclip size={16} className="text-cyan-500/90" /> Receipt preview
                </h3>
              </div>
              <ul className="space-y-4">
                {attachments.map((a) => {
                  const isImage =
                    (a.mimeType?.startsWith("image/") ?? false) ||
                    /\.(png|jpe?g|gif|webp)$/i.test(a.originalName ?? "");
                  return (
                    <li key={a.id}>
                      {isImage ? (
                        <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
                          <img
                            src={a.url}
                            alt={a.originalName ?? "Attachment"}
                            className="max-h-[min(70vh,420px)] w-full object-contain bg-black/20"
                          />
                          <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
                            {a.originalName ?? "Attachment"}
                          </p>
                        </div>
                      ) : (
                        <a
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 p-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          <FileText size={16} className="shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1 truncate">{a.originalName ?? "Attachment"}</span>
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
              {firstImageAttachment ? (
                <a
                  href={firstImageAttachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
                >
                  View full receipt
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
