import type { ClaimMonthlySpend } from "@/features/claims/types";

interface SpendBarTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
  }>;
  label?: string;
  monthlySpend: ClaimMonthlySpend[];
}

export function SpendBarTooltip({
  active,
  payload,
  label,
  monthlySpend,
}: SpendBarTooltipProps) {
  if (!active || !payload?.length || !label) return null;

  const currentAmount = payload[0].value ?? 0;
  const currentIndex = monthlySpend.findIndex((entry) => entry.month === label);
  const previousAmount = currentIndex > 0 ? monthlySpend[currentIndex - 1].amount : null;
  const change =
    previousAmount && previousAmount !== 0
      ? (((currentAmount - previousAmount) / previousAmount) * 100).toFixed(1)
      : null;

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{label}</p>
      <p className="text-muted-foreground">
        Amount:{" "}
        <span className="font-semibold text-foreground">${currentAmount.toLocaleString()}</span>
      </p>
      {change !== null && (
        <p className="text-muted-foreground">
          vs prev:{" "}
          <span
            className={`font-semibold ${
              Number(change) >= 0 ? "text-destructive" : "text-success"
            }`}
          >
            {Number(change) >= 0 ? "+" : ""}
            {change}%
          </span>
        </p>
      )}
    </div>
  );
}
