import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { ClaimPieTooltip } from "@/features/claims/components/ClaimPieTooltip";
import type { ClaimCategory } from "@/features/claims/types";

interface ClaimsByCategoryChartProps {
  pieData: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  categories?: ClaimCategory[];
}

export function ClaimsByCategoryChart({ pieData, categories = [] }: ClaimsByCategoryChartProps) {
  return (
    <Card className="premium-shadow border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Claims by Category</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">Spending distribution</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
              cornerRadius={6}
            >
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <RechartsTooltip content={<ClaimPieTooltip categories={categories} />} />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
