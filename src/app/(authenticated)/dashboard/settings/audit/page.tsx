"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import { auditTrail } from "@/features/attendance/data/mockData";

export default function AuditTrailPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Trail</h1>
        <p className="text-sm text-muted-foreground mt-1">Historical log of system changes and actions.</p>
      </div>

      <Card className="premium-shadow border-0">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Activity Log</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">User</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Action</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditTrail.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm text-muted-foreground font-mono text-xs">{entry.timestamp}</TableCell>
                  <TableCell>
                    <Badge variant={entry.user === "System" ? "secondary" : "outline"} className="text-[10px]">{entry.user}</Badge>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{entry.action}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">{entry.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
