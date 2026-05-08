"use client";

import Link from "next/link";
import { ArrowLeft, MapPin, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import type { DailyRecord } from "@/features/attendance/lib/attendanceLogDailyRecords";
import { cn } from "@/lib/utils";

interface AttendanceLogDetailViewProps {
  record: DailyRecord;
  backHref: string;
}

function statusEntryLabel(status: DailyRecord["status"]): string | null {
  if (status === "Late") return "Late Entry";
  if (status === "Present") return "On Time";
  if (status === "Absent") return "Absent";
  if (status === "WFH") return "WFH";
  return null;
}

export function AttendanceLogDetailView({ record, backHref }: AttendanceLogDetailViewProps) {
  const dateStr = new Date(record.date).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const entryPill = statusEntryLabel(record.status);

  const handleExport = () => {
    const headers = ["Employee", "Date", "Clock In", "Clock Out", "Hours", "Location", "Status"];
    const row = [
      record.name,
      record.date,
      record.clockIn,
      record.clockOut,
      record.hours,
      record.location,
      record.status,
    ];
    const csv = [headers.join(","), row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${record.userId}-${record.date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported");
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0 -ml-2">
            <Link href={backHref} aria-label="Back to attendance log">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground sm:text-2xl">{record.name}</h1>
            <p className="text-sm text-muted-foreground">
              {record.department ?? "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          <Button type="button" size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Profile row + date */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16 border border-border">
            <AvatarFallback className="bg-primary/15 text-primary text-lg font-bold">
              {record.avatarInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap items-center gap-2">
            {entryPill && (
              <span
                className={cn(
                  "inline-flex rounded-full px-3 py-1 text-xs font-semibold",
                  record.status === "Late" &&
                    "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100",
                  record.status === "Present" &&
                    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-100",
                  record.status === "Absent" &&
                    "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100",
                  record.status === "WFH" &&
                    "bg-pink-100 text-pink-900 dark:bg-pink-500/20 dark:text-pink-100",
                )}
              >
                {entryPill}
              </span>
            )}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Date</p>
          <p className="text-base font-semibold text-foreground">{dateStr}</p>
        </div>
      </div>

      {/* Total hours hero */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Total hours worked
        </p>
        <p className="text-4xl sm:text-5xl font-black tracking-tight text-foreground tabular-nums">
          {record.hoursHero}
        </p>
        {record.deficitLabel && (
          <p className="mt-3 inline-flex rounded-full bg-rose-500/15 px-3 py-1 text-sm font-semibold text-rose-700 dark:bg-rose-500/20 dark:text-rose-200">
            {record.deficitLabel}
          </p>
        )}
        <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-500"
            style={{ width: `${Math.round(record.progressRatio * 100)}%` }}
          />
        </div>
      </div>

      {/* Three metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Check in</p>
          <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{record.clockIn}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Check out</p>
          <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{record.clockOut}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <p className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> Location
          </p>
          <p className="mt-2 text-center text-xl font-bold text-foreground">{record.location}</p>
        </div>
      </div>

      {record.remarks && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remarks</p>
          <p className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-foreground">{record.remarks}</p>
        </div>
      )}

      <Separator />

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Punch history</p>
        {record.punchRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records for this day.</p>
        ) : (
          <div className="relative pl-5 space-y-3 pt-2">
            <div className="absolute left-[7px] top-3 bottom-3 w-px bg-border" />
            {record.punchRecords.map((punch, i) => (
              <div key={i} className="relative flex items-center gap-3">
                <div
                  className={cn(
                    "absolute left-[-13px] h-3.5 w-3.5 rounded-full border-2 border-background",
                    punch.type === "in" ? "bg-emerald-500" : "bg-rose-500",
                  )}
                />
                <div className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/35 p-3 dark:bg-muted/50">
                  <div>
                    <span className="text-sm font-semibold text-foreground">{punch.time}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
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
  );
}
