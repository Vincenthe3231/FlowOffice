"use client";

import {
  AlignLeft,
  Car,
  Calendar,
  FileText,
  Paperclip,
  MapPin,
  Navigation,
} from "lucide-react";
import type { ReactNode } from "react";
import { ApprovalTimeline } from "@/features/claims/components/ApprovalTimeline";
import type { Claim, ClaimApproval } from "@/features/claims/types";

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
  /** e.g. back button — shown before claim id / status row */
  leadingAction?: ReactNode;
}

export function ClaimDetailView({ claim, approvalsToShow, leadingAction }: ClaimDetailViewProps) {
  const amountStr = claim.amount.toFixed(2);
  const [amountInt, amountDec] = amountStr.split(".");
  const sc = statusColors[claim.status] ?? DEFAULT_STATUS_COLOR;
  const claimIndex = String(claim.id).slice(0, 8).toUpperCase();

  return (
    <div className="w-full space-y-8">
      {/* Top bar — same pattern as AttendanceLogDetailView (full width, not a modal card) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {leadingAction}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-md border border-border bg-muted px-3 py-1.5 text-xs font-black uppercase tracking-widest text-muted-foreground">
                CLAIM #{claimIndex}
              </span>
              <span
                className={`flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-black uppercase tracking-widest ${sc.text} ${sc.bg}`}
              >
                {claim.status === "Pending" && (
                  <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} animate-pulse`} />
                )}
                {claim.status}
              </span>
            </div>
            <h1
              id="claim-detail-title"
              className="text-xl font-bold text-foreground sm:text-2xl"
            >
              {claim.title}
            </h1>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-bold text-muted-foreground sm:text-2xl">RM</span>
              <span className="text-4xl font-black tracking-tighter text-foreground tabular-nums sm:text-5xl md:text-6xl">
                {amountInt}
                <span className="text-2xl text-muted-foreground sm:text-3xl md:text-4xl">
                  .{amountDec}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex flex-col justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Calendar size={12} className="text-primary" /> Date
            </p>
            <p className="font-bold text-foreground">{claim.date}</p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <FileText size={12} className="text-primary" /> Category
            </p>
            <p className="font-bold text-foreground">
              {claim.claimTypeLabel ?? claim.category ?? "—"}
            </p>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <Car size={12} className="text-primary" /> Type
            </p>
            <p className="font-bold capitalize text-foreground">
              {claim.subclaimTypeLabel ?? claim.type ?? "—"}
            </p>
          </div>
        </div>

        {claim.type === "mileage" && claim.fromLocation && claim.toLocation && (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl opacity-70" />
            <h3 className="relative z-10 mb-6 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <MapPin size={16} className="text-primary" /> Mileage Route
            </h3>
            <div className="relative mb-6 space-y-8 pl-8">
              <div className="absolute bottom-2 left-[11px] top-2 w-[2px] bg-border" />
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
                <Navigation size={16} /> Total Distance
              </div>
              <div className="text-xl font-black tabular-nums text-primary">{claim.distance} km</div>
            </div>
          </div>
        )}

        {claim.merchant && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <FileText size={16} className="text-primary" /> Merchant
            </h3>
            <p className="text-sm font-medium text-foreground">{claim.merchant}</p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            <AlignLeft size={16} className="text-primary" /> Description
          </h3>
          <p className="rounded-xl border border-border bg-muted/50 p-4 text-sm font-medium leading-relaxed text-foreground">
            {claim.description || "No description provided"}
          </p>
        </div>

        {(claim.customFields ?? []).length > 0 && (
          <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <FileText size={16} className="text-primary" /> Custom Fields
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

        {(claim.attachments ?? []).length > 0 && (
          <div className="space-y-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
              <Paperclip size={16} className="text-primary" /> Attachments
            </h3>
            <ul className="space-y-4">
              {claim.attachments!.map((a) => {
                const isImage =
                  (a.mimeType?.startsWith("image/") ?? false) ||
                  /\.(png|jpe?g|gif|webp)$/i.test(a.originalName ?? "");
                return (
                  <li key={a.id}>
                    {isImage ? (
                      <div className="overflow-hidden rounded-xl border border-border bg-muted/50">
                        <img
                          src={a.url}
                          alt={a.originalName ?? "Attachment"}
                          className="max-h-80 w-full object-contain"
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
          </div>
        )}

        <ApprovalTimeline
          approvals={approvalsToShow}
          claimStatus={claim.status.toLowerCase()}
          submittedDate={claim.date}
        />
    </div>
  );
}
