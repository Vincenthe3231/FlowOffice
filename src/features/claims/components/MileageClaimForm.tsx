"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Car } from "lucide-react";

interface MileageClaimFormProps {
  mileageRate: number;
  formData?: Record<string, unknown>;
  onUpdate?: (key: string, value: unknown) => void;
  onFromBlur?: () => void;
  onToBlur?: () => void;
}

export function MileageClaimForm({
  mileageRate,
  formData = {},
  onUpdate,
  onFromBlur,
  onToBlur,
}: MileageClaimFormProps) {
  const distance = formData.distance ?? "";
  const calculatedAmount = distance
    ? (parseFloat(String(distance)) * mileageRate).toFixed(2)
    : "0.00";

  const update = (key: string, value: unknown) => {
    onUpdate?.(key, value);
    if (key === "distance" && value) {
      onUpdate?.("amount", (parseFloat(String(value)) * mileageRate).toFixed(2));
    }
  };

  return (
    <div className="space-y-4">
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
          value={String(formData.title ?? "")}
          onChange={(e) => update("title", e.target.value)}
          className="h-10 focus-visible:ring-primary/40"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Route
        </Label>
        <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/10">
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-3">
              <div className="w-3 h-3 rounded-full bg-primary shadow-md ring-2 ring-background" />
              <div className="w-px flex-1 my-1 border-l-2 border-dashed border-primary/30" />
              <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Car className="h-3 w-3 text-primary-foreground" />
              </div>
              <div className="w-px flex-1 my-1 border-l-2 border-dashed border-primary/30" />
              <div className="w-3 h-3 rounded-full bg-primary shadow-md ring-2 ring-background" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">
                  FROM
                </p>
                <Input
                  id="mc-from"
                  placeholder="Start point"
                  maxLength={100}
                  value={String(formData.fromLocation ?? "")}
                  onChange={(e) => update("fromLocation", e.target.value)}
                  onBlur={onFromBlur}
                  className="h-9 text-sm focus-visible:ring-primary/40"
                />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium mb-1">
                  TO
                </p>
                <Input
                  id="mc-to"
                  placeholder="End point"
                  maxLength={100}
                  value={String(formData.toLocation ?? "")}
                  onChange={(e) => update("toLocation", e.target.value)}
                  onBlur={onToBlur}
                  className="h-9 text-sm focus-visible:ring-primary/40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl border border-border/50 bg-card">
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
                value={String(distance)}
                onChange={(e) => update("distance", e.target.value)}
                className="h-10 pr-8 focus-visible:ring-primary/40"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                km
              </span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Rate
            </Label>
            <div className="flex h-10 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-muted-foreground font-medium">
              RM {mileageRate}/km
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Amount
            </Label>
            <div className="flex h-10 items-center rounded-md bg-primary px-3 text-sm font-bold text-primary-foreground shadow-md">
              RM {calculatedAmount}
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
