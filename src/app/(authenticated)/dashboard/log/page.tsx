"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/features/attendance/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Search, MapPin, Clock, ArrowDown, ArrowUp } from "lucide-react";
import { attendanceLogs, attendanceDetails } from "@/features/attendance/data/mockData";

export default function AttendanceLogPage() {
  const [selectedLog, setSelectedLog] = useState<(typeof attendanceLogs)[0] | null>(null);
  const detail = selectedLog ? attendanceDetails[selectedLog.id] : null;

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
                <Input placeholder="Search employee..." className="pl-9 h-9 w-48 bg-muted/50 border-0" />
              </div>
              <Select>
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
              {attendanceLogs.map((log) => (
                <TableRow key={log.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLog(log)}>
                  <TableCell className="font-medium text-sm">{log.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.date}</TableCell>
                  <TableCell className="text-sm">{log.clockIn}</TableCell>
                  <TableCell className="text-sm">{log.clockOut}</TableCell>
                  <TableCell className="text-sm">{log.hours}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.location}</TableCell>
                  <TableCell><StatusBadge status={log.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{detail?.avatar ?? "??"}</AvatarFallback>
              </Avatar>
              <div>
                <SheetTitle className="text-lg">{selectedLog?.name}</SheetTitle>
                <SheetDescription className="text-sm">{detail?.department ?? "—"}</SheetDescription>
              </div>
            </div>
          </SheetHeader>
          {selectedLog && detail && (
            <div className="space-y-5 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {new Date(selectedLog.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
                <StatusBadge status={selectedLog.status} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><ArrowDown className="h-3 w-3 text-success" /> Earliest In</p>
                  <p className="text-lg font-bold text-foreground">{selectedLog.clockIn}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                  <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><ArrowUp className="h-3 w-3 text-destructive" /> Latest Out</p>
                  <p className="text-lg font-bold text-foreground">{selectedLog.clockOut}</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" /> Total Working Hours</span>
                <span className="text-sm font-semibold text-foreground">{selectedLog.hours}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
                <span className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPin className="h-4 w-4" /> Work Location</span>
                <span className="text-sm font-semibold text-foreground">{selectedLog.location}</span>
              </div>
              {detail.remarks && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remarks</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-xl p-3">{detail.remarks}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Punch History</p>
                {detail.punchRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No records for this day.</p>
                ) : (
                  <div className="relative pl-5 space-y-3">
                    <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                    {detail.punchRecords.map((punch, i) => (
                      <div key={i} className="relative flex items-center gap-3">
                        <div className={`absolute left-[-13px] h-3.5 w-3.5 rounded-full border-2 border-background ${punch.type === "in" ? "bg-success" : "bg-destructive"}`} />
                        <div className="flex items-center justify-between w-full bg-muted/30 rounded-lg p-2.5">
                          <div>
                            <span className="text-sm font-medium text-foreground">{punch.time}</span>
                            <span className="text-xs text-muted-foreground ml-2">{punch.type === "in" ? "Clock In" : "Clock Out"}</span>
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
