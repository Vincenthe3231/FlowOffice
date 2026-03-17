"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  AlignLeft,
  Car,
  Calendar,
  FileText,
  Paperclip,
  X,
  MapPin,
  Navigation,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ApprovalTimeline } from "@/features/claims/components/ApprovalTimeline";
import { useClaimApprovals } from "@/features/claims/hooks/useClaims";
import type { Claim, ClaimApproval } from "@/features/claims/types";

interface ClaimDetailSheetProps {
  claim: Claim | null;
  onClose: () => void;
}

const DEFAULT_STATUS_COLOR = {
  bg: "bg-slate-100",
  text: "text-slate-500",
  dot: "bg-slate-400",
} as const;

const statusColors: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  Pending: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-500" },
  Approved: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    dot: "bg-emerald-500",
  },
  Rejected: { bg: "bg-rose-50", text: "text-rose-600", dot: "bg-rose-500" },
  Paid: { bg: "bg-blue-50", text: "text-blue-600", dot: "bg-blue-500" },
  Draft: { bg: "bg-slate-100", text: "text-slate-500", dot: "bg-slate-400" },
};

export function ClaimDetailSheet({ claim, onClose }: ClaimDetailSheetProps) {
  const isOpen = claim !== null;
  const [mounted, setMounted] = useState(false);

  const { data: approvals } = useClaimApprovals(claim?.id ?? null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!claim) return null;

  const amountStr = claim.amount.toFixed(2);
  const [amountInt, amountDec] = amountStr.split(".");
  const sc = statusColors[claim.status] ?? DEFAULT_STATUS_COLOR;
  const claimIndex = String(claim.id).slice(0, 8).toUpperCase();

  // Fallback timeline steps when API returns no approvals (UI-only until Lark integration)
  const fallbackApprovals: ClaimApproval[] = [
    { id: -1, claimId: claim.id, level: 1, status: "pending" },
    { id: -2, claimId: claim.id, level: 2, status: "pending" },
  ];
  const approvalsToShow: ClaimApproval[] =
    approvals && approvals.length > 0 ? approvals : fallbackApprovals;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            aria-hidden
            onClick={handleBackdropClick}
          />

          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.95, x: "-50%", y: "-50%" }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] md:w-full max-w-3xl max-h-[90vh] bg-[#F4F6F9] shadow-2xl rounded-2xl flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="claim-detail-title"
          >
            {/* HEADER */}
            <div className="bg-gradient-to-br from-white via-white to-blue-50/50 px-8 pt-8 pb-6 border-b border-slate-200 shrink-0 relative rounded-t-2xl">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200/60">
                  CLAIM #{claimIndex}
                </span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-black uppercase tracking-widest ${sc.text} ${sc.bg} px-3 py-1.5 rounded-md border border-slate-200/60`}
                >
                  {claim.status === "Pending" && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`}
                    />
                  )}
                  {claim.status}
                </span>
              </div>

              <h2
                id="claim-detail-title"
                className="text-2xl font-bold text-slate-800 mb-2"
              >
                {claim.title}
              </h2>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-400">RM</span>
                <span className="text-6xl font-black text-slate-800 tracking-tighter tabular-nums drop-shadow-sm">
                  {amountInt}
                  <span className="text-4xl text-slate-500">.{amountDec}</span>
                </span>
              </div>
            </div>

            {/* BODY */}
            <div className="flex-1 min-w-0 overflow-y-auto p-6 sm:p-8 space-y-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Bento Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Calendar size={12} className="text-blue-500" /> Date
                  </p>
                  <p className="font-bold text-slate-800">{claim.date}</p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <FileText size={12} className="text-blue-500" /> Category
                  </p>
                  <p className="font-bold text-slate-800">
                    {claim.claimTypeLabel ?? claim.category ?? "—"}
                  </p>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Car size={12} className="text-blue-500" /> Type
                  </p>
                  <p className="font-bold text-slate-800 capitalize">
                    {claim.subclaimTypeLabel ?? claim.type ?? "—"}
                  </p>
                </div>
              </div>

              {/* Mileage Route */}
              {claim.type === "mileage" &&
                claim.fromLocation &&
                claim.toLocation && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 opacity-60" />
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                      <MapPin size={16} className="text-blue-600" /> Mileage
                      Route
                    </h3>
                    <div className="relative pl-8 space-y-8 mb-6">
                      <div className="absolute top-2 bottom-2 left-[11px] w-[2px] bg-slate-100" />
                      <div className="relative z-10">
                        <div className="absolute -left-[37px] top-1 w-5 h-5 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Origin
                        </p>
                        <p className="font-semibold text-slate-800 text-sm leading-relaxed pr-4">
                          {claim.fromLocation}
                        </p>
                      </div>
                      <div className="relative z-10">
                        <div className="absolute -left-[37px] top-1 w-5 h-5 bg-white border-2 border-slate-200 rounded-full flex items-center justify-center shadow-sm">
                          <div className="w-2 h-2 bg-rose-500 rounded-full" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                          Destination
                        </p>
                        <p className="font-semibold text-slate-800 text-sm leading-relaxed pr-4">
                          {claim.toLocation}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-4 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2 text-slate-500 font-semibold text-sm">
                        <Navigation size={16} /> Total Distance
                      </div>
                      <div className="font-black text-blue-600 text-xl tabular-nums">
                        {claim.distance} km
                      </div>
                    </div>
                  </div>
                )}

              {/* Merchant */}
              {claim.merchant && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" /> Merchant
                  </h3>
                  <p className="text-slate-700 font-medium text-sm">
                    {claim.merchant}
                  </p>
                </div>
              )}

              {/* Description */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <AlignLeft size={16} className="text-blue-600" /> Description
                </h3>
                <p className="text-slate-700 font-medium text-sm leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {claim.description || "No description provided"}
                </p>
              </div>

              {/* Custom fields (from metadata.fields) */}
              {(claim.customFields ?? []).length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" /> Custom
                    Fields
                  </h3>
                  {claim.customFields!.map((f) => (
                    <div key={f.id}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        {f.label}
                      </p>
                      <p className="text-slate-700 font-medium text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                        {f.value || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Attachments (from API) — show image inline, link for non-images */}
              {(claim.attachments ?? []).length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Paperclip size={16} className="text-blue-600" />{" "}
                    Attachments
                  </h3>
                  <ul className="space-y-4">
                    {claim.attachments!.map((a) => {
                      const isImage =
                        (a.mimeType?.startsWith("image/") ?? false) ||
                        /\.(png|jpe?g|gif|webp)$/i.test(
                          a.originalName ?? ""
                        );
                      return (
                        <li key={a.id}>
                          {isImage ? (
                            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                              <img
                                src={a.url}
                                alt={a.originalName ?? "Attachment"}
                                className="w-full max-h-80 object-contain"
                              />
                              <p className="text-xs text-slate-500 px-3 py-2 border-t border-slate-100">
                                {a.originalName ?? "Attachment"}
                              </p>
                            </div>
                          ) : (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-700 font-medium text-sm"
                            >
                              <FileText size={16} className="text-slate-500 shrink-0" />
                              <span className="truncate flex-1 min-w-0">
                                {a.originalName ?? "Attachment"}
                              </span>
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Approval Timeline — real data when available, else fallback for complete UI */}
              <ApprovalTimeline
                approvals={approvalsToShow}
                claimStatus={claim.status.toLowerCase()}
                submittedDate={claim.date}
              />

              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
