"use client";

import { useState } from "react";
import { Car, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollDatePicker } from "@/components/ui/ScrollDatePicker";
import { Textarea } from "@/components/ui/textarea";
import { useHydration } from "@/shared/hooks/useHydration";
import { useCreateClaim } from "@/features/claims/hooks/useClaims";
import { calculateDistance } from "@/shared/lib/api-client/claims";
import { format } from "date-fns";

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
  const [title, setTitle] = useState("");
  const [tripDate, setTripDate] = useState<Date | undefined>();
  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [distance, setDistance] = useState("");
  const [description, setDescription] = useState("");
  const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

  const createClaim = useCreateClaim();

  const distanceNum = distance ? parseFloat(distance) : NaN;
  const distanceCeiled = !Number.isNaN(distanceNum) && distanceNum > 0 ? Math.ceil(distanceNum) : 0;
  const calculatedAmount =
    distanceCeiled > 0 ? (distanceCeiled * mileageRate).toFixed(2) : "0.00";

  async function calculateRouteDistance(from: string, to: string) {
    if (!from.trim() || !to.trim()) return;
    setIsCalculatingDistance(true);
    try {
      const km = await calculateDistance(from, to);
      if (km !== null) {
        setDistance(String(Math.ceil(km)));
      } else {
        toast.error("Unable to calculate distance. You can enter the distance manually.");
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err && err.response && typeof (err.response as { data?: { message?: string } }).data?.message === "string"
          ? (err.response as { data: { message: string } }).data.message
          : "Unable to calculate distance. You can enter the distance manually.";
      toast.error(message);
    } finally {
      setIsCalculatingDistance(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !tripDate || !fromLocation.trim() || !toLocation.trim() || !distance) return;
    const numDistance = parseFloat(distance);
    if (Number.isNaN(numDistance) || numDistance <= 0) return;
    const distanceKm = Math.ceil(numDistance);
    const numAmount = parseFloat((distanceKm * mileageRate).toFixed(2));
    if (Number.isNaN(numAmount)) return;

    try {
      await createClaim.mutateAsync({
        type: "mileage",
        title: title.trim(),
        categoryId: 0,
        amount: numAmount,
        claimDate: format(tripDate, "yyyy-MM-dd"),
        description: description.trim() || undefined,
        status: "pending",
        mileage: {
          fromLocation: fromLocation.trim(),
          toLocation: toLocation.trim(),
          distanceKm,
          ratePerKm: mileageRate,
        },
      });
      onOpenChange(false);
      setTitle("");
      setTripDate(undefined);
      setFromLocation("");
      setToLocation("");
      setDistance("");
      setDescription("");
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
              <p className="text-purple-100 text-xs mt-0.5">Enter trip details and distance</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="px-6 py-5 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label
                htmlFor="mc-title"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Title
              </Label>
              <Input
                id="mc-title"
                placeholder="e.g. Site visit"
                maxLength={100}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 border-border/60 focus-visible:ring-purple-500/40"
                required
              />
            </div>

            {/* Trip Date — full width */}
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
                <div className="h-10 w-full rounded-xl border border-border/60 bg-muted/20 animate-pulse" aria-hidden />
              )}
            </div>

            {/* Route — FROM / TO with backend distance calculation (Google Maps) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Route
              </Label>
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-violet-500/5 border border-purple-200/30 dark:border-purple-800/30">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-3">
                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-purple-400 to-violet-500 shadow-sm ring-2 ring-purple-200/50" />
                    <div
                      className="my-1 w-px flex-1 bg-gradient-to-b from-purple-400/60 to-violet-500/60"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, transparent, transparent 3px, hsl(var(--border)) 3px, hsl(var(--border)) 6px)",
                      }}
                    />
                    <div className="relative">
                      <Car className="mb-1 h-3.5 w-3.5 text-purple-500" />
                    </div>
                    <div
                      className="my-1 w-px flex-1 bg-gradient-to-b from-violet-500/60 to-indigo-500/60"
                      style={{
                        backgroundImage:
                          "repeating-linear-gradient(to bottom, transparent, transparent 3px, hsl(var(--border)) 3px, hsl(var(--border)) 6px)",
                      }}
                    />
                    <div className="h-3 w-3 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 shadow-sm ring-2 ring-violet-200/50" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="mb-1 text-[10px] font-medium text-muted-foreground">FROM</p>
                      <Input
                        id="mc-from"
                        placeholder="Start point"
                        maxLength={500}
                        value={fromLocation}
                        onChange={(e) => setFromLocation(e.target.value)}
                        onBlur={() => {
                          if (toLocation.trim()) calculateRouteDistance(fromLocation, toLocation);
                        }}
                        className="h-9 border-border/60 text-sm focus-visible:ring-purple-500/40"
                        required
                      />
                    </div>
                    <div>
                      <p className="mb-1 text-[10px] font-medium text-muted-foreground">TO</p>
                      <Input
                        id="mc-to"
                        placeholder="End point"
                        maxLength={500}
                        value={toLocation}
                        onChange={(e) => setToLocation(e.target.value)}
                        onBlur={() => calculateRouteDistance(fromLocation, toLocation)}
                        className="h-9 border-border/60 text-sm focus-visible:ring-purple-500/40"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Distance / Rate / Amount */}
            <div className="p-4 rounded-xl border border-border/40 bg-muted/20">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="mc-distance"
                    className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Distance
                  </Label>
                  <div className="relative">
                    <Input
                      id="mc-distance"
                      type="number"
                      placeholder="0"
                      min={0}
                      step="any"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      onBlur={() => {
                        const n = parseFloat(distance);
                        if (!Number.isNaN(n) && n > 0) {
                          setDistance(String(Math.ceil(n)));
                        }
                      }}
                      disabled={isCalculatingDistance}
                      className="h-10 border-border/60 pr-8 focus-visible:ring-purple-500/40 disabled:cursor-wait"
                    />
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2">
                      {isCalculatingDistance ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                      ) : (
                        <span className="text-xs font-medium text-muted-foreground">km</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Rate
                  </Label>
                  <div className="flex h-10 items-center rounded-md border border-border/40 bg-muted/50 px-3 text-sm font-medium text-muted-foreground">
                    RM {mileageRate}/km
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Amount
                  </Label>
                  <div className="flex h-10 items-center rounded-md bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-200/40 dark:border-purple-800/30 px-3 text-sm font-bold text-foreground">
                    RM {calculatedAmount}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="mc-desc"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Description (optional)
              </Label>
              <Textarea
                id="mc-desc"
                placeholder="Trip purpose..."
                className="resize-none border-border/60 focus-visible:ring-purple-500/40"
                rows={2}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
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
