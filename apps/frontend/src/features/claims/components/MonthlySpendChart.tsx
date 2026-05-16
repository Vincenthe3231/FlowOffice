import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SpendBarTooltip } from "@/features/claims/components/SpendBarTooltip";
import { CHART_COLORS, CHART_GRID, CHART_AXIS } from "@/shared/constants/chart-colors";
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
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke={CHART_AXIS} />
            <YAxis
              tick={{ fontSize: 11 }}
              stroke={CHART_AXIS}
              tickFormatter={(value) => `RM ${(value / 1000).toFixed(0)}k`}
            />
            <RechartsTooltip content={<SpendBarTooltip monthlySpend={monthlySpend} />} />
            <Bar dataKey="amount" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} name="Spend" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
