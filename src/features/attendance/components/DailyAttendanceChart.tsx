import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  attendanceRate: number;
  presentToday: number;
  totalStaff: number;
  onViewAll?: () => void;
}

export function DailyAttendanceChart({ attendanceRate, presentToday, totalStaff, onViewAll }: Props) {
  const data = [
    { name: "Present", value: presentToday },
    { name: "Absent", value: Math.max(0, totalStaff - presentToday) },
  ];

  return (
    <Card className="shadow-card border-0">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Daily Attendance</p>
          {onViewAll && (
            <button onClick={onViewAll} className="text-xs text-primary font-medium hover:underline">
              View All
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={28}
                  outerRadius={40}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill="hsl(160, 72%, 42%)" />
                  <Cell fill="hsl(220, 14%, 92%)" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{attendanceRate}%</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{presentToday}<span className="text-sm text-muted-foreground font-normal">/{totalStaff}</span></p>
            <p className="text-xs text-muted-foreground">Staff present today</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
