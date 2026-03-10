"use client";

import { useState } from "react";
import { Receipt, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollDatePicker } from "@/components/ui/ScrollDatePicker";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useHydration } from "@/shared/hooks/useHydration";
import type { ClaimCategory } from "@/features/claims/types";

interface ReceiptClaimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ClaimCategory[];
}

export function ReceiptClaimDialog({
  open,
  onOpenChange,
  categories,
}: ReceiptClaimDialogProps) {
  const isHydrated = useHydration();
  const [receiptDate, setReceiptDate] = useState<Date | undefined>();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl">
        <DialogTitle className="sr-only">New Receipt Claim</DialogTitle>
        <DialogDescription className="sr-only">
          Upload receipt and fill in the details.
        </DialogDescription>
        <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 px-6 pt-6 pb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-lg backdrop-blur-sm">
              <Receipt className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Receipt Claim</h2>
              <p className="text-blue-100 text-xs mt-0.5">Upload receipt and fill in the details</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="rc-title"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Title
            </Label>
            <Input
              id="rc-title"
              placeholder="e.g. Client lunch"
              maxLength={100}
              className="h-10 border-border/60 focus-visible:ring-blue-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="rc-category"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Category
              </Label>
              <Select>
                <SelectTrigger id="rc-category" className="h-10 border-border/60 focus:ring-blue-500/40">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="rc-amount"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Amount (RM)
              </Label>
              <Input
                id="rc-amount"
                type="number"
                placeholder="0.00"
                min={0}
                step={0.01}
                className="h-10 border-border/60 focus-visible:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="rc-date"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Receipt Date
              </Label>
              {isHydrated ? (
                <ScrollDatePicker
                  value={receiptDate}
                  onChange={setReceiptDate}
                  placeholder="Pick date"
                  className="border-border/60 bg-muted/10 focus-visible:ring-blue-500/40"
                />
              ) : (
                <div className="h-10 rounded-xl border border-border/60 bg-muted/20 animate-pulse" aria-hidden />
              )}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="rc-merchant"
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                Merchant (optional)
              </Label>
              <Input
                id="rc-merchant"
                placeholder="Merchant name"
                maxLength={100}
                className="h-10 border-border/60 focus-visible:ring-blue-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="rc-desc"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Description (optional)
            </Label>
            <Textarea
              id="rc-desc"
              placeholder="Brief description..."
              className="resize-none border-border/60 focus-visible:ring-blue-500/40"
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Receipt Photo
            </Label>
            <label
              htmlFor="rc-file"
              className="group flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 cursor-pointer transition-all hover:border-blue-400/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors mb-2">
                <Upload className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-blue-500">Click to upload</span> or drag and drop
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">PNG, JPG up to 10MB</p>
              <input id="rc-file" type="file" accept="image/*" className="sr-only" />
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 px-6 pb-5 pt-0">
          <DialogClose asChild>
            <Button variant="outline" className="border-border/60">
              Cancel
            </Button>
          </DialogClose>
          <Button className="border-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700">
            Submit Claim
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
