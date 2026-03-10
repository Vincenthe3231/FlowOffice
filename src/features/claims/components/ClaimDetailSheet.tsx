"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Car, FileText, Receipt, Store, X } from "lucide-react";
import { useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/features/attendance";
import type { Claim } from "@/features/claims/types";

interface ClaimDetailSheetProps {
  claims: Claim[];
  selectedIndex: number | null;
  onClose: () => void;
}

function TimelineStep({
  label,
  sublabel,
  variant = "default",
}: {
  label: string;
  sublabel: string;
  variant?: "default" | "success" | "destructive" | "info";
}) {
  const dotClass =
    variant === "success"
      ? "bg-success"
      : variant === "destructive"
        ? "bg-destructive"
        : variant === "info"
          ? "bg-info"
          : "bg-muted-foreground/40";
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      <div>
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sublabel}</p>
      </div>
    </div>
  );
}

function statusGradient(status: Claim["status"]): string {
  switch (status) {
    case "Approved":
    case "Paid":
      return "from-success/80 to-success";
    case "Rejected":
      return "from-destructive/80 to-destructive";
    case "Pending":
      return "from-amber-500/80 to-amber-600";
    case "Draft":
      return "from-muted-foreground/50 to-muted-foreground/70";
    default:
      return "from-muted-foreground/40 to-muted-foreground/60";
  }
}

export function ClaimDetailSheet({
  claims,
  selectedIndex,
  onClose,
}: ClaimDetailSheetProps) {
  const isOpen = selectedIndex !== null && claims.length > 0;

  const initialSlide = selectedIndex ?? 0;

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        aria-hidden
        onClick={handleBackdropClick}
      />
      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 400 }}
        className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-hidden rounded-t-[28px] border-x border-t border-border/70 bg-background shadow-2xl"
      >
        <div className="flex flex-col h-full max-h-[85vh]">
          <div className="flex shrink-0 items-center justify-center gap-2 px-4 pt-3 pb-2">
            <div className="h-1 w-10 rounded-full bg-muted-foreground/20" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 top-3 h-8 w-8 rounded-full"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            <Swiper
              initialSlide={Math.min(initialSlide, Math.max(0, claims.length - 1))}
              spaceBetween={0}
              slidesPerView={1}
              modules={[Pagination]}
              pagination={{ clickable: true }}
              className="h-full [--swiper-pagination-bottom:0.5rem]"
            >
              {claims.map((claim) => (
                <SwiperSlide key={claim.id}>
                  <div className="overflow-y-auto max-h-[calc(85vh-80px)] px-4 pb-8 pt-2">
                    <div
                      className={`h-1.5 w-full rounded-t-lg bg-gradient-to-r ${statusGradient(claim.status)}`}
                    />
                    <div className="rounded-b-2xl border border-t-0 border-border/60 bg-card">
                      <div className="border-b border-border/60 px-4 pb-4 pt-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          Claim #{claim.id}
                        </p>
                        <p className="mt-1 text-base font-semibold text-foreground">{claim.title}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <p className="text-lg font-bold text-foreground">
                            RM {claim.amount.toFixed(2)}
                          </p>
                          <StatusBadge status={claim.status} className="px-2 py-0.5 text-[9px]" />
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                            <p className="text-[11px] text-muted-foreground">Amount</p>
                            <p className="mt-1 text-base font-bold text-foreground">
                              RM {claim.amount.toFixed(2)}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                            <p className="text-[11px] text-muted-foreground">Date</p>
                            <p className="mt-1 text-sm font-semibold text-foreground">{claim.date}</p>
                          </div>
                        </div>

                        <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Claim Details
                          </p>
                          <div className="grid gap-2.5">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-muted-foreground">Category</span>
                              <span className="text-xs font-medium text-foreground">
                                {claim.category}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-xs text-muted-foreground">Type</span>
                              <span className="inline-flex items-center gap-1.5 text-xs capitalize text-foreground">
                                {claim.type === "mileage" ? (
                                  <Car className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                                {claim.type}
                              </span>
                            </div>
                            {claim.merchant && (
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">Merchant</span>
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                                  <Store className="h-3.5 w-3.5 text-muted-foreground" />
                                  {claim.merchant}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {claim.type === "mileage" && (
                          <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3.5">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Mileage Route
                            </p>
                            <div className="grid gap-2.5">
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">From</span>
                                <span className="text-xs font-medium text-foreground">
                                  {claim.fromLocation}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">To</span>
                                <span className="text-xs font-medium text-foreground">
                                  {claim.toLocation}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs text-muted-foreground">Distance</span>
                                <span className="text-xs font-medium text-foreground">
                                  {claim.distance} km
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3.5">
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Description
                          </span>
                          <p className="rounded-xl bg-muted/40 p-3 text-xs leading-5 text-foreground sm:text-sm">
                            {claim.description}
                          </p>
                        </div>

                        {claim.type === "receipt" && (
                          <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-3.5">
                            <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Receipt
                            </span>
                            <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border bg-muted/30">
                              <div className="flex flex-col items-center gap-2 text-center">
                                <Receipt className="h-4 w-4 text-muted-foreground" />
                                <p className="text-[11px] text-muted-foreground">
                                  No receipt uploaded
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-3.5">
                          <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Approval Timeline
                          </span>
                          <div className="space-y-3">
                            <TimelineStep label="Submitted" sublabel={claim.date} variant="success" />
                            {(claim.status === "Approved" || claim.status === "Paid") && (
                              <TimelineStep
                                label="Approved by HR Manager"
                                sublabel="1 day after submission"
                                variant="success"
                              />
                            )}
                            {claim.status === "Paid" && (
                              <TimelineStep
                                label="Payment processed"
                                sublabel="2 days after approval"
                                variant="info"
                              />
                            )}
                            {claim.status === "Rejected" && (
                              <TimelineStep
                                label="Rejected"
                                sublabel="Exceeded per-head limit"
                                variant="destructive"
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
