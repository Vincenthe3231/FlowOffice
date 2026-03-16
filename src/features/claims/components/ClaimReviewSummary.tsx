"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { CustomField } from "@/features/claims/types";

interface ClaimReviewSummaryProps {
  claimantName: string;
  claimTypeLabel: string;
  subclaimLabel?: string;
  formData: Record<string, unknown>;
  customFields: CustomField[];
  amount: number;
  /** Attachment file name when user added a file on details step */
  attachmentFileName?: string | null;
}

export function ClaimReviewSummary({
  claimantName,
  claimTypeLabel,
  subclaimLabel,
  formData,
  customFields,
  amount,
  attachmentFileName,
}: ClaimReviewSummaryProps) {
  const fieldDisplay = [
    { label: "Full Name", value: claimantName },
    { label: "Claim Type", value: claimTypeLabel },
    ...(subclaimLabel ? [{ label: "Subclaim", value: subclaimLabel }] : []),
    ...(formData.title ? [{ label: "Title", value: String(formData.title) }] : []),
    ...(attachmentFileName ? [{ label: "Attachment", value: attachmentFileName }] : []),
    ...(formData.merchant ? [{ label: "Merchant", value: String(formData.merchant) }] : []),
    ...(formData.category ? [{ label: "Category", value: String(formData.category) }] : []),
    ...(formData.fromLocation ? [{ label: "From", value: String(formData.fromLocation) }] : []),
    ...(formData.toLocation ? [{ label: "To", value: String(formData.toLocation) }] : []),
    ...(formData.distance ? [{ label: "Distance", value: `${formData.distance} km` }] : []),
    ...(formData.description ? [{ label: "Description", value: String(formData.description) }] : []),
  ];

  const renderCustomFieldValue = (field: CustomField) => {
    if (!field.value) return "—";
    switch (field.type) {
      case "mileage":
        return `${field.value} km (RM ${(parseFloat(field.value) * 0.8).toFixed(2)})`;
      case "percentage":
        return `${field.value}%`;
      default:
        return field.value;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">Claim Summary</h3>
        <div className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">
          RM {amount.toFixed(2)}
        </div>
      </div>

      <Card className="premium-shadow border-0">
        <CardContent className="p-4 space-y-3">
          {fieldDisplay.map((item, i) => (
            <div
              key={item.label}
              className={`flex items-start justify-between gap-4 ${i % 2 === 0 ? "bg-muted/10" : ""} px-2 py-1.5 rounded-lg`}
            >
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold shrink-0">
                {item.label}
              </span>
              <span className="text-sm text-foreground text-right">
                {item.value}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {customFields.length > 0 && (
        <Card className="premium-shadow border-0">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Custom Fields
            </p>
            {customFields.map((field, i) => (
              <div
                key={field.id}
                className={`flex items-start justify-between gap-4 ${i % 2 === 0 ? "bg-muted/10" : ""} px-2 py-1.5 rounded-lg`}
              >
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-primary flex items-center justify-center text-primary-foreground text-[8px] font-bold uppercase">
                    {field.type.charAt(0)}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {field.label}
                  </span>
                </div>
                <span className="text-sm text-foreground text-right">
                  {renderCustomFieldValue(field)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
