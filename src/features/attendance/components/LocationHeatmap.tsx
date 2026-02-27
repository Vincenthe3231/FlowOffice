import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  staffByOffice: Array<{ name: string; count: number }>;
}

const COLORS = [
  "hsl(228, 85%, 68%)",
  "hsl(16, 85%, 58%)",
  "hsl(160, 72%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(270, 60%, 60%)",
];

export function LocationHeatmap({ staffByOffice }: Props) {
  const data = staffByOffice.map((o) => ({
    name: o.name.replace("BeLive ", "").replace("Co-Living", "HQ"),
    count: o.count,
  }));

  return (
    <Card className="shadow-card border-0">
      <CardContent className="p-4">
        <p className="text-sm font-semibold mb-3">Staff by Location</p>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 11 }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
