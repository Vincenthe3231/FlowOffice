import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendBarTooltip } from "@/features/claims/components/SpendBarTooltip";
import type { ClaimMonthlySpend } from "@/features/claims/types";

interface MonthlySpendChartProps {
  monthlySpend?: ClaimMonthlySpend[];
}

export function MonthlySpendChart({ monthlySpend = [] }: MonthlySpendChartProps) {
  return (
    <Card className="premium-shadow border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Monthly Spend Trend</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">Last 6 months</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlySpend}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke="hsl(220, 10%, 50%)"
              tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`}
            />
            <RechartsTooltip content={<SpendBarTooltip monthlySpend={monthlySpend} />} />
            <Bar dataKey="amount" fill="hsl(230, 70%, 55%)" radius={[4, 4, 0, 0]} name="Spend" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
