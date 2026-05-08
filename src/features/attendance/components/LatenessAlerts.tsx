import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface LateArrival {
  userId: string;
  name: string;
  time: string;
  lateByMinutes: number;
}

interface Props {
  lateArrivals: LateArrival[];
  onStaffClick?: (userId: string) => void;
}

export function LatenessAlerts({ lateArrivals, onStaffClick }: Props) {
  return (
    <Card className="shadow-card border-0">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <p className="text-sm font-semibold">Lateness Alerts</p>
          {lateArrivals.length > 0 && (
            <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full font-medium">
              {lateArrivals.length}
            </span>
          )}
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2">
          {lateArrivals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">No late arrivals today 🎉</p>
          ) : (
            lateArrivals.map((item) => (
              <div key={item.userId} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => onStaffClick?.(item.userId)}>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(item.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className="text-xs text-destructive font-medium">+{item.lateByMinutes} min</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
