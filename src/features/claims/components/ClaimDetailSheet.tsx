import { Car, FileText, Receipt, Store } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/features/attendance";
import type { Claim } from "@/features/claims/types";

interface ClaimDetailSheetProps {
  claim: Claim | null;
  onOpenChange: (open: boolean) => void;
}

export function ClaimDetailSheet({ claim, onOpenChange }: ClaimDetailSheetProps) {
  return (
    <Sheet open={!!claim} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="left-1/2 right-auto max-h-[82vh] w-[calc(100%-0.75rem)] max-w-[430px] -translate-x-1/2 overflow-hidden rounded-t-[28px] border-x border-t border-border/70 bg-background p-0 shadow-2xl"
      >
        {claim && (
          <>
            <div className="px-4 pt-3">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/20" />
            </div>
            <SheetHeader className="border-b border-border/60 px-4 pb-4 pt-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetDescription className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Claim #{claim.id}
                  </SheetDescription>
                  <SheetTitle className="mt-1 truncate text-base">{claim.title}</SheetTitle>
                </div>
                <StatusBadge status={claim.status} className="px-2 py-0.5 text-[9px]" />
              </div>
            </SheetHeader>
            <div className="max-h-[calc(82vh-92px)] space-y-4 overflow-y-auto px-4 pb-5 pt-4">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
                  <p className="text-[11px] text-muted-foreground">Amount</p>
                  <p className="mt-1 text-base font-bold text-foreground">${claim.amount.toFixed(2)}</p>
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
                    <span className="text-xs font-medium text-foreground">{claim.category}</span>
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
                      <span className="text-xs font-medium text-foreground">{claim.fromLocation}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">To</span>
                      <span className="text-xs font-medium text-foreground">{claim.toLocation}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">Distance</span>
                      <span className="text-xs font-medium text-foreground">{claim.distance} km</span>
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
                      <p className="text-[11px] text-muted-foreground">No receipt uploaded</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-3.5">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Approval Timeline
                </span>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Submitted</p>
                      <p className="text-[11px] text-muted-foreground">{claim.date}</p>
                    </div>
                  </div>
                  {(claim.status === "Approved" || claim.status === "Paid") && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-success" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Approved by HR Manager</p>
                        <p className="text-[11px] text-muted-foreground">1 day after submission</p>
                      </div>
                    </div>
                  )}
                  {claim.status === "Paid" && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-info" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Payment processed</p>
                        <p className="text-[11px] text-muted-foreground">2 days after approval</p>
                      </div>
                    </div>
                  )}
                  {claim.status === "Rejected" && (
                    <div className="flex items-start gap-3">
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-destructive" />
                      <div>
                        <p className="text-xs font-medium text-foreground">Rejected</p>
                        <p className="text-[11px] text-muted-foreground">Exceeded per-head limit</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
