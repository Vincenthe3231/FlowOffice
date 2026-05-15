"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/attendance/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Loader2 } from "lucide-react";
import { useAdminAttendance } from "@/features/attendance/hooks/useAdminAttendance";
import {
  buildDailyRecords,
  getLocalDateKey,
} from "@/features/attendance/lib/attendanceLogDailyRecords";
import { buildAttendanceLogDetailHref } from "@/features/attendance/lib/attendanceLogUrlParams";

export default function AttendanceLogPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { todayAllLogs, allProfiles, allOffices, logsLoading } = useAdminAttendance(true);

  const today = useMemo(() => getLocalDateKey(), []);

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

  const openDetail = (userId: string, date: string) => {
    router.push(buildAttendanceLogDetailHref(userId, date));
  };

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
                    onClick={() => openDetail(record.userId, record.date)}
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
    </div>
  );
}
