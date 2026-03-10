import { Tooltip as RadixTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClaimCategory } from "@/features/claims/types";

function budgetGradient(percent: number) {
  if (percent > 90) return "from-red-400 to-rose-500";
  if (percent > 70) return "from-amber-300 to-yellow-500";
  return "from-emerald-400 to-green-500";
}

interface BudgetUtilizationProps {
  categories?: ClaimCategory[];
}

export function BudgetUtilization({ categories = [] }: BudgetUtilizationProps) {
  return (
    <Card className="premium-shadow border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Budget Utilization</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">Category spend vs budget limits</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category, index) => {
          const percent = Math.round((category.spent / category.budget) * 100);
          const remaining = category.budget - category.spent;

          return (
            <RadixTooltip key={category.id}>
              <TooltipTrigger asChild>
                <div className="cursor-default space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{category.name}</span>
                    <span className="text-xs text-muted-foreground">
                      RM {category.spent.toLocaleString()} / RM {category.budget.toLocaleString()} ({percent}
                      %)
                    </span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${budgetGradient(percent)} transition-all`}
                      style={{ width: `${Math.min(percent, 100)}%` }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-semibold">{category.name}</p>
                <p>Budget: RM {category.budget.toLocaleString()}</p>
                <p>Spent: RM {category.spent.toLocaleString()}</p>
                <p>Remaining: RM {remaining.toLocaleString()}</p>
                <p>Utilization: {percent}%</p>
                <p>Rank: #{index + 1} of {categories.length}</p>
              </TooltipContent>
            </RadixTooltip>
          );
        })}
      </CardContent>
    </Card>
  );
}
