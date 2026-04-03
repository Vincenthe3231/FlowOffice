"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollDatePicker } from "@/components/ui/ScrollDatePicker";
import { cn } from "@/lib/utils";

interface ReceiptClaimFormProps {
  formData?: Record<string, unknown>;
  onUpdate?: (key: string, value: unknown) => void;
  /** Shown under Title / Amount when parent validates the details step */
  titleError?: string;
  amountError?: string;
}

export function ReceiptClaimForm({
  formData = {},
  onUpdate,
  titleError,
  amountError,
}: ReceiptClaimFormProps) {
  const [localDate, setLocalDate] = useState<Date | undefined>(
    formData.receiptDate
      ? new Date(formData.receiptDate as string)
      : undefined
  );

  const update = (key: string, value: unknown) => onUpdate?.(key, value);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label
          htmlFor="claim-details-title"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Title
        </Label>
        <Input
          id="claim-details-title"
          placeholder="e.g. Client lunch"
          maxLength={100}
          value={String(formData.title ?? "")}
          onChange={(e) => update("title", e.target.value)}
          className={cn(
            "h-10 scroll-mt-24 focus-visible:ring-primary/40",
            titleError && "border-destructive"
          )}
        />
        {titleError ? (
          <p className="mt-1 text-sm text-destructive">{titleError}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="claim-details-amount"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Amount (RM)
        </Label>
        <Input
          id="claim-details-amount"
          type="number"
          placeholder="0.00"
          min={0}
          step={0.01}
          value={String(formData.amount ?? "")}
          onChange={(e) => update("amount", e.target.value)}
          className={cn(
            "h-10 scroll-mt-24 focus-visible:ring-primary/40",
            amountError && "border-destructive"
          )}
        />
        {amountError ? (
          <p className="mt-1 text-sm text-destructive">{amountError}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Receipt Date
          </Label>
          <ScrollDatePicker
            value={localDate}
            onChange={(d) => {
              setLocalDate(d);
              update("receiptDate", d?.toISOString());
            }}
            className="w-full focus-visible:ring-primary/40"
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="rc-merchant"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Merchant
          </Label>
          <Input
            id="rc-merchant"
            placeholder="Merchant name"
            maxLength={100}
            value={String(formData.merchant ?? "")}
            onChange={(e) => update("merchant", e.target.value)}
            className="h-10 focus-visible:ring-primary/40"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label
          htmlFor="rc-desc"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Description
        </Label>
        <Textarea
          id="rc-desc"
          placeholder="Brief description..."
          className="resize-none focus-visible:ring-primary/40"
          rows={2}
          maxLength={500}
          value={String(formData.description ?? "")}
          onChange={(e) => update("description", e.target.value)}
        />
      </div>
    </div>
  );
}
