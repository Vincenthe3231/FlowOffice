import type { ClaimCategory } from "@/features/claims/types";

interface ClaimPieTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
  }>;
  categories: ClaimCategory[];
}

export function ClaimPieTooltip({
  active,
  payload,
  categories,
}: ClaimPieTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const totalSpent = categories.reduce((sum, category) => sum + category.spent, 0);
  const sortedCategories = [...categories].sort((a, b) => b.spent - a.spent);
  const rank = sortedCategories.findIndex((category) => category.name === item.name) + 1;
  const value = item.value ?? 0;
  const percentage = totalSpent === 0 ? "0.0" : ((value / totalSpent) * 100).toFixed(1);

  return (
    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-foreground">{item.name}</p>
      <p className="text-muted-foreground">
        Spent: <span className="font-semibold text-foreground">RM {value.toLocaleString()}</span>
      </p>
      <p className="text-muted-foreground">
        Share: <span className="font-semibold text-foreground">{percentage}%</span>
      </p>
      <p className="text-muted-foreground">
        Rank: <span className="font-semibold text-foreground">#{rank}</span>
      </p>
    </div>
  );
}
