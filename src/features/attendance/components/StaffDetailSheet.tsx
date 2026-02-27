import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, MessageSquare } from "lucide-react";

interface AttendanceLog {
  id: string;
  type: "clock_in" | "clock_out";
  timestamp: string;
  office_id: string | null;
  photo_url: string | null;
  distance_meters: number | null;
  notes: string | null;
  status: string;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  department: string | null;
}

interface Office {
  id: string;
  name: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  logs: AttendanceLog[];
  offices: Office[];
}

export function StaffDetailSheet({ open, onOpenChange, profile, logs, offices }: Props) {
  if (!profile) return null;

  const initials = (profile.full_name || profile.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const firstClockIn = logs.find((l) => l.type === "clock_in");
  const lastClockOut = [...logs].reverse().find((l) => l.type === "clock_out");

  const getOfficeName = (officeId: string | null) => {
    if (!officeId) return "Unknown";
    return offices.find((o) => o.id === officeId)?.name || "Unknown";
  };

  const formatTime = (ts: string) =>
    new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-base">
                {profile.full_name || profile.email || "Unknown"}
              </SheetTitle>
              {profile.department && (
                <p className="text-xs text-muted-foreground">{profile.department}</p>
              )}
            </div>
          </div>
        </SheetHeader>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-success/10 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">First In</p>
            <p className="text-lg font-bold text-success">
              {firstClockIn ? formatTime(firstClockIn.timestamp) : "--:--"}
            </p>
          </div>
          <div className="bg-accent/10 rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Last Out</p>
            <p className="text-lg font-bold text-accent-foreground">
              {lastClockOut ? formatTime(lastClockOut.timestamp) : "--:--"}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-0">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No records today</p>
          ) : (
            logs.map((log, i) => (
              <div key={log.id} className="flex gap-3 py-3 relative">
                <div className="flex flex-col items-center">
                  <div
                    className={`h-3 w-3 rounded-full shrink-0 ${
                      log.type === "clock_in" ? "bg-success" : "bg-accent"
                    }`}
                  />
                  {i < logs.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 -mt-0.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.type === "clock_in" ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
                        {log.type === "clock_in" ? "IN" : "OUT"}
                      </Badge>
                      <span className="text-sm font-medium">{formatTime(log.timestamp)}</span>
                    </div>
                    {log.photo_url && (
                      <div className="h-8 w-8 rounded overflow-hidden shrink-0">
                        <img src={log.photo_url} alt="" className="h-full w-full object-cover" />
                      </div>
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {getOfficeName(log.office_id)}
                      {log.distance_meters != null && ` · ${log.distance_meters}m`}
                    </p>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 italic">
                        <MessageSquare className="h-3 w-3" />
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
