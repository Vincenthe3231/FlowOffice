"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { useHydration } from "@/shared/hooks/useHydration";
import { useCreateClaim, useUploadClaimAttachment } from "@/features/claims/hooks/useClaims";
import type { ClaimCategory } from "@/features/claims/types";
import { format } from "date-fns";
import { ReceiptClaimForm } from "@/features/claims/components/ReceiptClaimForm";

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
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [file, setFile] = useState<File | null>(null);

  const createClaim = useCreateClaim();
  const uploadAttachment = useUploadClaimAttachment();

  const updateField = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const title = String(formData.title ?? "").trim();
    const categoryId = formData.category;
    const amount = formData.amount;
    const receiptDate = formData.receiptDate;
    if (!title || !categoryId || !amount || !receiptDate) return;
    const numAmount = parseFloat(String(amount));
    if (Number.isNaN(numAmount) || numAmount <= 0) return;

    try {
      const claim = await createClaim.mutateAsync({
        type: "receipt",
        title,
        categoryId: Number(categoryId),
        amount: numAmount,
        claimDate:
          typeof receiptDate === "string"
            ? receiptDate.slice(0, 10)
            : format(new Date(receiptDate as string), "yyyy-MM-dd"),
        merchant: String(formData.merchant ?? "").trim() || undefined,
        description: String(formData.description ?? "").trim() || undefined,
        status: "pending",
      });
      if (file) {
        await uploadAttachment.mutateAsync({ claimId: claim.id, file });
      }
      onOpenChange(false);
      setFormData({});
      setFile(null);
    } catch {
      // toast handled in mutation
    }
  }

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
              <p className="text-blue-100 text-xs mt-0.5">
                Upload receipt and fill in the details
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="contents">
          <div className="px-6 py-5 space-y-4">
            {isHydrated ? (
              <ReceiptClaimForm
                categories={categories}
                formData={formData}
                onUpdate={updateField}
                onFileChange={setFile}
              />
            ) : (
              <div className="h-64 rounded-xl border border-border/60 bg-muted/20 animate-pulse" aria-hidden />
            )}
          </div>

          <DialogFooter className="gap-2 px-6 pb-5 pt-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-border/60">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={
                createClaim.isPending ||
                uploadAttachment.isPending ||
                !formData.title ||
                !formData.category ||
                !formData.amount ||
                !formData.receiptDate
              }
              className="border-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:from-blue-600 hover:to-indigo-700"
            >
              {createClaim.isPending || uploadAttachment.isPending
                ? "Submitting…"
                : "Submit Claim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
