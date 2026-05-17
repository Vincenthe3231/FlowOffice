"use client";

import { Fragment, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AuditDiffRow } from "./AuditDiffRow";
import type { AuditLogEntry } from "@/features/audit/types";
import { MODULE_BADGE_COLORS, EVENT_BADGE_COLORS } from "@/features/audit/types";

interface AuditTableProps {
  entries: AuditLogEntry[];
  isLoading: boolean;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-MY", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatEvent(event: string): string {
  return event.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function hasDiff(entry: AuditLogEntry): boolean {
  return !!(entry.properties.old || entry.properties.attributes);
}

export function AuditTable({ entries, isLoading }: AuditTableProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return (
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-8" />
            <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">User</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Module</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Action</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground">Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-4 w-4" /></TableCell>
              <TableCell><Skeleton className="h-4 w-32" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        No audit log entries found.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-8" />
          <TableHead className="text-xs font-semibold text-muted-foreground">Timestamp</TableHead>
          <TableHead className="text-xs font-semibold text-muted-foreground">User</TableHead>
          <TableHead className="text-xs font-semibold text-muted-foreground">Module</TableHead>
          <TableHead className="text-xs font-semibold text-muted-foreground">Action</TableHead>
          <TableHead className="text-xs font-semibold text-muted-foreground">Description</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const isExpanded = expanded.has(entry.id);
          const showDiff = hasDiff(entry);
          return (
            <Fragment key={entry.id}>
              <TableRow className={isExpanded ? "bg-muted/20" : undefined}>
                <TableCell className="w-8 pr-0">
                  {showDiff ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggle(entry.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3 w-3" />
                      ) : (
                        <ChevronRight className="h-3 w-3" />
                      )}
                    </Button>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(entry.createdAt)}
                </TableCell>
                <TableCell className="text-sm">
                  {entry.causer ? (
                    <span className="font-medium">{entry.causer.name}</span>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">System</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] border-0 ${MODULE_BADGE_COLORS[entry.module] ?? "bg-gray-100 text-gray-800"}`}>
                    {entry.module.replace(/_/g, " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={`text-[10px] border-0 ${EVENT_BADGE_COLORS[entry.event] ?? "bg-gray-100 text-gray-800"}`}>
                    {formatEvent(entry.event)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">
                  {entry.description}
                </TableCell>
              </TableRow>
              {isExpanded && showDiff && (
                <AuditDiffRow key={`diff-${entry.id}`} properties={entry.properties} colSpan={6} />
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
