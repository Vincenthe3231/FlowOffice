"use client";

import { useState, useCallback } from "react";
import { Car } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollDatePicker } from "@/components/ui/ScrollDatePicker";
import { useHydration } from "@/shared/hooks/useHydration";
import { useCreateClaim } from "@/features/claims/hooks/useClaims";
import { calculateDistance } from "@/shared/lib/api-client/claims";
import { format } from "date-fns";
import { MileageClaimForm } from "@/features/claims/components/MileageClaimForm";

interface MileageClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mileageRate: number;
}

export function MileageClaimDialog({
  open,
  onOpenChange,
  mileageRate,
}: MileageClaimDialogProps) {
  const isHydrated = useHydration();
  const [tripDate, setTripDate] = useState<Date | undefined>();
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const createClaim = useCreateClaim();

  const updateField = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const runCalculateDistance = useCallback(() => {
    const from = String(formData.fromLocation ?? "").trim();
    const to = String(formData.toLocation ?? "").trim();
    if (!from || !to) return;
    setIsCalculatingDistance(true);
    calculateDistance(from, to)
      .then((km) => {
        if (km !== null) {
          setFormData((prev) => ({ ...prev, distance: String(Math.ceil(km)) }));
          const amount = (Math.ceil(km) * mileageRate).toFixed(2);
          setFormData((prev) => ({ ...prev, amount }));
        } else {
          toast.error(
            "Unable to calculate distance. You can enter the distance manually."
          );
        }
      })
      .catch(() => {
        toast.error(
          "Unable to calculate distance. You can enter the distance manually."
        );
      })
      .finally(() => setIsCalculatingDistance(false));
  }, [formData.fromLocation, formData.toLocation, mileageRate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = String(formData.title ?? "").trim();
    const fromLocation = String(formData.fromLocation ?? "").trim();
    const toLocation = String(formData.toLocation ?? "").trim();
    const distance = formData.distance;
    if (!title || !tripDate || !fromLocation || !toLocation || !distance) return;
    const numDistance = parseFloat(String(distance));
    if (Number.isNaN(numDistance) || numDistance <= 0) return;
    const distanceKm = Math.ceil(numDistance);
    const numAmount = parseFloat((distanceKm * mileageRate).toFixed(2));
    if (Number.isNaN(numAmount)) return;

    try {
      await createClaim.mutateAsync({
        type: "mileage",
        title,
        categoryId: 0,
        amount: numAmount,
        claimDate: format(tripDate, "yyyy-MM-dd"),
        description: String(formData.description ?? "").trim() || undefined,
        status: "pending",
        mileage: {
          fromLocation,
          toLocation,
          distanceKm,
          ratePerKm: mileageRate,
        },
      });
      onOpenChange(false);
      setTripDate(undefined);
      setFormData({});
    } catch {
      // toast in mutation
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        <DialogTitle className="sr-only">New Mileage Claim</DialogTitle>
        <DialogDescription className="sr-only">
          Enter trip details and distance.
        </DialogDescription>
        <div className="relative bg-gradient-to-r from-purple-500 to-violet-600 px-6 pt-6 pb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-lg backdrop-blur-sm">
              <Car className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Mileage Claim</h2>
              <p className="text-purple-100 text-xs mt-0.5">
                Enter trip details and distance
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="mc-date"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Trip Date
              </Label>
              {isHydrated ? (
                <ScrollDatePicker
                  value={tripDate}
                  onChange={setTripDate}
                  placeholder="Pick date"
                  className="w-full border-border/60 bg-muted/10 focus-visible:ring-purple-500/40"
                />
              ) : (
                <div
                  className="h-10 w-full rounded-xl border border-border/60 bg-muted/20 animate-pulse"
                  aria-hidden
                />
              )}
            </div>

            <MileageClaimForm
              mileageRate={mileageRate}
              formData={formData}
              onUpdate={updateField}
              onFromBlur={runCalculateDistance}
              onToBlur={runCalculateDistance}
            />
          </div>

          <DialogFooter className="gap-2 px-6 pb-5 pt-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-border/60">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={createClaim.isPending || isCalculatingDistance}
              className="border-0 bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:from-purple-600 hover:to-violet-700"
            >
              {createClaim.isPending ? "Submitting…" : "Submit Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
