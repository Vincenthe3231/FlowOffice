"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAttendance } from "@/features/attendance/hooks/useAdminAttendance";
import { AttendanceLogDetailView } from "@/features/attendance/components/AttendanceLogDetailView";
import {
  buildDailyRecords,
  findDailyRecordForRouteParam,
  getLocalDateKey,
} from "@/features/attendance/lib/attendanceLogDailyRecords";

export interface AttendanceLogDetailPageClientProps {
  /** Dynamic route segment `[userId]` (from Next.js `params`). */
  userId: string;
  /** `?date=YYYY-MM-DD` when present (from Next.js `searchParams`). */
  dateFromUrl?: string;
}

export function AttendanceLogDetailPageClient({
  userId,
  dateFromUrl,
}: AttendanceLogDetailPageClientProps) {
  const today = useMemo(() => getLocalDateKey(), []);

  const dateParam = dateFromUrl ?? today;
  const isTodayOnly = dateParam === today;

  const { todayAllLogs, allProfiles, allOffices, logsLoading } = useAdminAttendance(true);

  const record = useMemo(() => {
    if (!userId || !isTodayOnly) return undefined;
    const records = buildDailyRecords(todayAllLogs, allProfiles, allOffices, today);
    return findDailyRecordForRouteParam(records, userId, today, allProfiles);
  }, [userId, today, isTodayOnly, todayAllLogs, allProfiles, allOffices]);

  if (logsLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        Loading…
      </div>
    );
  }

  if (!isTodayOnly) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Attendance detail is only available for today&apos;s records. Historical dates will be supported when the API provides them.
        </p>
        <p className="text-sm text-muted-foreground">Requested date: {dateParam}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/log">Back to Attendance Log</Link>
        </Button>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <p className="text-lg font-semibold text-foreground">Record not found</p>
        <p className="text-sm text-muted-foreground">
          No attendance record for this employee for today, or the link is invalid.
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/log">Back to Attendance Log</Link>
        </Button>
      </div>
    );
  }

  return <AttendanceLogDetailView record={record} backHref="/dashboard/log" />;
}
