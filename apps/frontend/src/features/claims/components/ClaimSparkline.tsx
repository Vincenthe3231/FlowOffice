import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface ClaimSparklineProps {
  data: number[];
  color: string;
}

export function ClaimSparkline({ data, color }: ClaimSparklineProps) {
  const chartData = data.map((value, index) => ({ day: index + 1, value }));

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`claim-spark-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#claim-spark-${color})`}
            strokeWidth={1.5}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
