import { motion } from "framer-motion";
import { Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { MILEAGE_RATE } from "@/features/claims/data";

interface MileageClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mileageDistance: string;
  onMileageDistanceChange: (value: string) => void;
  mileageAmount: string;
}

export function MileageClaimDialog({
  open,
  onOpenChange,
  mileageDistance,
  onMileageDistanceChange,
  mileageAmount,
}: MileageClaimDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <motion.button
                type="button"
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.985 }}
                className="block w-full text-left"
              >
                <Card className="premium-shadow group flex min-h-36 cursor-pointer flex-col justify-between rounded-3xl border-0 p-5 transition-shadow hover:premium-shadow-lg">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 transition-transform group-hover:scale-105">
                    <Car className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Submit Mileage Claim</p>
                </Card>
              </motion.button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Enter trip details and distance</TooltipContent>
        </Tooltip>
      </TooltipProvider>

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

        <div className="px-6 py-5 space-y-4">
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
              className="h-10 border-border/60 focus-visible:ring-purple-500/40"
            />
          </div>

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
                      maxLength={100}
                      className="h-9 border-border/60 text-sm focus-visible:ring-purple-500/40"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[10px] font-medium text-muted-foreground">TO</p>
                    <Input
                      id="mc-to"
                      placeholder="End point"
                      maxLength={100}
                      className="h-9 border-border/60 text-sm focus-visible:ring-purple-500/40"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                    value={mileageDistance}
                    onChange={(event) => onMileageDistanceChange(event.target.value)}
                    className="h-10 border-border/60 pr-8 focus-visible:ring-purple-500/40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    km
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Rate
                </Label>
                <div className="flex h-10 items-center rounded-md border border-border/40 bg-muted/50 px-3 text-sm font-medium text-muted-foreground">
                  ${MILEAGE_RATE}/km
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Amount
                </Label>
                <div className="flex h-10 items-center rounded-md bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-200/40 dark:border-purple-800/30 px-3 text-sm font-bold text-foreground">
                  ${mileageAmount}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="mc-desc"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="mc-desc"
              placeholder="Trip purpose..."
              className="resize-none border-border/60 focus-visible:ring-purple-500/40"
              rows={2}
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 pb-5 pt-0">
          <DialogClose asChild>
            <Button variant="outline" className="border-border/60">
              Cancel
            </Button>
          </DialogClose>
          <Button className="border-0 bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 hover:from-purple-600 hover:to-violet-700">
            Submit Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
