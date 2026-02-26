"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Users, UserCheck, UserX, AlertTriangle, Home, Clock } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import { sparklineDataMap } from "@/features/attendance/data/mockData";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "Total Employees": Users,
  "Present Today": UserCheck,
  "On Leave": UserX,
  "Late Arrivals": AlertTriangle,
  "Work From Home": Home,
  "OT Pending": Clock,
};

const colorClasses: Record<string, { bg: string; icon: string; stroke: string; fill: string }> = {
  blue: { bg: "bg-stat-blue", icon: "text-stat-blue-icon", stroke: "hsl(215, 80%, 55%)", fill: "hsl(215, 80%, 55%)" },
  green: { bg: "bg-stat-green", icon: "text-stat-green-icon", stroke: "hsl(145, 60%, 40%)", fill: "hsl(145, 60%, 40%)" },
  orange: { bg: "bg-stat-orange", icon: "text-stat-orange-icon", stroke: "hsl(30, 80%, 50%)", fill: "hsl(30, 80%, 50%)" },
  pink: { bg: "bg-stat-pink", icon: "text-stat-pink-icon", stroke: "hsl(340, 65%, 55%)", fill: "hsl(340, 65%, 55%)" },
  purple: { bg: "bg-stat-purple", icon: "text-stat-purple-icon", stroke: "hsl(270, 60%, 55%)", fill: "hsl(270, 60%, 55%)" },
  cyan: { bg: "bg-stat-cyan", icon: "text-stat-cyan-icon", stroke: "hsl(185, 60%, 40%)", fill: "hsl(185, 60%, 40%)" },
};
const defaultColors = { bg: "bg-stat-blue", icon: "text-stat-blue-icon", stroke: "hsl(215, 80%, 55%)", fill: "hsl(215, 80%, 55%)" };

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "up" | "down" | "neutral";
  color: "blue" | "green" | "orange" | "pink" | "purple" | "cyan";
}

function SparklineTooltip({ active, payload, metricTitle }: { active?: boolean; payload?: Array<{ value: number; payload?: { day: number } }>; metricTitle?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
      <p className="font-medium text-foreground">Day {(payload[0]?.payload?.day ?? 0)}</p>
      <p className="text-muted-foreground">{metricTitle}: <span className="font-semibold text-foreground">{payload[0]?.value}</span></p>
    </div>
  );
}

export function StatCard({ title, value, change, changeType, color }: StatCardProps) {
  const Icon = iconMap[title] ?? Users;
  const colors = colorClasses[color] ?? defaultColors;
  const sparkRaw = sparklineDataMap[title] ?? [0, 0, 0, 0, 0, 0, 0];
  const sparkData = sparkRaw.map((v, i) => ({ v, day: i + 1 }));
  const gradId = `spark-${color}`;

  return (
    <Card className="premium-shadow border-0 p-5 hover:premium-shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          <p
            className={cn(
              "text-xs font-medium mt-1",
              changeType === "up" && "text-success",
              changeType === "down" && "text-destructive",
              changeType === "neutral" && "text-warning"
            )}
          >
            {change}
          </p>
        </div>
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", colors.bg)}>
          <Icon className={cn("h-5 w-5", colors.icon)} />
        </div>
      </div>
      <div className="mt-3 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.fill} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.fill} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Tooltip content={<SparklineTooltip metricTitle={title} />} cursor={false} />
            <Area type="monotone" dataKey="v" stroke={colors.stroke} fill={`url(#${gradId})`} strokeWidth={1.5} dot={false} activeDot={{ r: 3, fill: colors.stroke }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
