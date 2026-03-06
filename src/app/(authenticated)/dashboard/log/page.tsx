"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/attendance/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Clock, ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { useAdminAttendance } from "@/features/attendance/hooks/useAdminAttendance";
import type { AdminAttendanceLog, Office } from "@/shared/lib/api-client/attendance";

type TableStatus = "Present" | "Late" | "Absent" | "WFH";

interface DailyRecord {
  userId: string;
  name: string;
  date: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  location: string;
  status: TableStatus;
  department: string | null;
  avatarInitials: string;
  punchRecords: { time: string; type: "in" | "out"; location: string }[];
  remarks: string | null;
}

const NINE_AM_MS = 9 * 60 * 60 * 1000;

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatHours(ms: number): string {
  const h = Math.floor(ms / (60 * 60 * 1000));
  const m = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
  if (h === 0 && m === 0) return "—";
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function getInitials(fullName: string | null, email: string | null): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return fullName.slice(0, 2).toUpperCase();
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

function buildDailyRecords(
  todayLogs: AdminAttendanceLog[],
  profiles: { userId: string; fullName: string | null; email: string | null; department: string | null }[],
  offices: Office[],
  todayDate: string,
): DailyRecord[] {
  const byUser = new Map<string, AdminAttendanceLog[]>();
  for (const log of todayLogs) {
    if (!byUser.has(log.userId)) byUser.set(log.userId, []);
    byUser.get(log.userId)!.push(log);
  }

  const getOfficeName = (officeId: string | null) => {
    if (!officeId) return "—";
    const o = offices.find((x) => x.id === officeId);
    return o?.name ?? "—";
  };

  const records: DailyRecord[] = [];

  for (const [userId, logs] of byUser) {
    const profile = profiles.find((p) => p.userId === userId);
    const name = profile?.fullName || profile?.email || "Unknown";
    const sorted = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    const ins = sorted.filter((l) => l.type === "clock_in");
    const outs = sorted.filter((l) => l.type === "clock_out");
    const firstIn = ins[0];
    const lastOut = outs[outs.length - 1];

    const clockIn = firstIn ? formatTime(firstIn.timestamp) : "—";
    const clockOut = lastOut ? formatTime(lastOut.timestamp) : "—";

    let hoursMs = 0;
    if (firstIn && lastOut) {
      hoursMs = new Date(lastOut.timestamp).getTime() - new Date(firstIn.timestamp).getTime();
    }
    const hours = hoursMs > 0 ? formatHours(hoursMs) : "—";

    const firstInTime = firstIn ? new Date(firstIn.timestamp).getTime() : 0;
    const dayStart = new Date(todayDate).setHours(0, 0, 0, 0);
    const nineAm = dayStart + NINE_AM_MS;
    const status: TableStatus = !firstIn ? "Absent" : firstInTime > nineAm ? "Late" : "Present";

    const location = firstIn ? getOfficeName(firstIn.officeId) : "—";

    const punchRecords = sorted.map((l) => ({
      time: formatTime(l.timestamp),
      type: l.type === "clock_in" ? "in" as const : "out" as const,
      location: getOfficeName(l.officeId),
    }));

    const remarks = firstIn?.notes ?? lastOut?.notes ?? null;

    records.push({
      userId,
      name,
      date: todayDate,
      clockIn,
      clockOut,
      hours,
      location,
      status,
      department: profile?.department ?? null,
      avatarInitials: getInitials(profile?.fullName ?? null, profile?.email ?? null),
      punchRecords,
      remarks,
    });
  }

  records.sort((a, b) => a.name.localeCompare(b.name));
  return records;
}

export default function AttendanceLogPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRecord, setSelectedRecord] = useState<DailyRecord | null>(null);

  const { todayAllLogs, allProfiles, allOffices, logsLoading } = useAdminAttendance(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.toISOString().slice(0, 10);
  }, []);

  const dailyRecords = useMemo(
    () => buildDailyRecords(todayAllLogs, allProfiles, allOffices, today),
    [todayAllLogs, allProfiles, allOffices, today],
  );

  const filteredRecords = useMemo(() => {
    let list = dailyRecords;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    if (statusFilter && statusFilter !== "all") {
      list = list.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase());
    }
    return list;
  }, [dailyRecords, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Log</h1>
        <p className="text-sm text-muted-foreground mt-1">View and manage daily attendance records.</p>
      </div>

      <Card className="premium-shadow border-0">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">Today&apos;s Records</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee..."
                  className="pl-9 h-9 w-48 bg-muted/50 border-0"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="wfh">WFH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Employee</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Date</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Clock In</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Clock Out</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Hours</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Location</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Loading records…
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    {dailyRecords.length === 0
                      ? "No attendance records yet today. Records appear after clock-in/out on the Attendance page."
                      : "No records match your search or filter."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow
                    key={record.userId}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <TableCell className="font-medium text-sm">{record.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.date}</TableCell>
                    <TableCell className="text-sm">{record.clockIn}</TableCell>
                    <TableCell className="text-sm">{record.clockOut}</TableCell>
                    <TableCell className="text-sm">{record.hours}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{record.location}</TableCell>
                    <TableCell>
                      <StatusBadge status={record.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedRecord} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {selectedRecord?.avatarInitials ?? "??"}
                </AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-lg">{selectedRecord?.name}</SheetTitle>
                <SheetDescription className="text-sm">{selectedRecord?.department ?? "—"}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          {selectedRecord && (
            <div className="space-y-5 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedRecord.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <StatusBadge status={selectedRecord.status} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowDown className="h-3 w-3 text-success" /> Earliest In
                  </p>
                  <p className="text-lg font-bold text-foreground">{selectedRecord.clockIn}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <ArrowUp className="h-3 w-3 text-destructive" /> Latest Out
                  </p>
                  <p className="text-lg font-bold text-foreground">{selectedRecord.clockOut}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-4 w-4" /> Total Working Hours
                </span>
                <span className="text-sm font-semibold text-foreground">{selectedRecord.hours}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" /> Work Location
                </span>
                <span className="text-sm font-semibold text-foreground">{selectedRecord.location}</span>
              </div>
              {selectedRecord.remarks && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remarks</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-xl p-3">{selectedRecord.remarks}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Punch History</p>
                {selectedRecord.punchRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No records for this day.</p>
                ) : (
                  <div className="relative pl-5 space-y-3">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                    {selectedRecord.punchRecords.map((punch, i) => (
                      <div key={i} className="relative flex items-center gap-3">
                        <div
                          className={`absolute left-[-13px] h-3.5 w-3.5 rounded-full border-2 border-background ${punch.type === "in" ? "bg-success" : "bg-destructive"}`}
                        />
                        <div className="flex items-center justify-between w-full bg-muted/30 rounded-lg p-2.5">
                          <div>
                            <span className="text-sm font-medium text-foreground">{punch.time}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {punch.type === "in" ? "Clock In" : "Clock Out"}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{punch.location}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
