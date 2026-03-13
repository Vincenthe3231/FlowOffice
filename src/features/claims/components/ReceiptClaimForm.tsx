"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload } from "lucide-react";
import { ScrollDatePicker } from "@/components/ui/ScrollDatePicker";

interface ReceiptClaimFormProps {
  categories: { id: string; name: string }[];
  formData?: Record<string, unknown>;
  onUpdate?: (key: string, value: unknown) => void;
  onFileChange?: (file: File | null) => void;
}

export function ReceiptClaimForm({
  categories,
  formData = {},
  onUpdate,
  onFileChange,
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
          htmlFor="rc-title"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Title
        </Label>
        <Input
          id="rc-title"
          placeholder="e.g. Client lunch"
          maxLength={100}
          value={String(formData.title ?? "")}
          onChange={(e) => update("title", e.target.value)}
          className="h-10 focus-visible:ring-primary/40"
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
          <Select
            value={String(formData.category ?? "")}
            onValueChange={(v) => update("category", v)}
          >
            <SelectTrigger id="rc-category" className="h-10 focus:ring-primary/40">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
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
            value={String(formData.amount ?? "")}
            onChange={(e) => update("amount", e.target.value)}
            className="h-10 focus-visible:ring-primary/40"
          />
        </div>
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

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Receipt Photo
        </Label>
        <label
          htmlFor="rc-file"
          className="group flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-border cursor-pointer transition-all hover:border-primary/60 bg-muted/20 hover:bg-muted/40"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary group-hover:scale-110 transition-transform mb-2">
            <Upload className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">Click to upload</span>{" "}
            or drag and drop
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            PNG, JPG up to 10MB
          </p>
          <input
            id="rc-file"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onFileChange?.(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </div>
  );
}
