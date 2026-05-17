"use client";

import { Fragment } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AuditProperties } from "@/features/audit/types";

interface AuditDiffRowProps {
  properties: AuditProperties;
  colSpan?: number;
}

export function AuditDiffRow({ properties, colSpan = 6 }: AuditDiffRowProps) {
  const old = properties.old;
  const attrs = properties.attributes;

  if (!old && !attrs) return null;

  const keys = Array.from(
    new Set([...Object.keys(old ?? {}), ...Object.keys(attrs ?? {})])
  );

  if (keys.length === 0) return null;

  return (
    <TableRow className="bg-muted/30 hover:bg-muted/40">
      <TableCell colSpan={colSpan} className="py-2 px-4">
        <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 text-xs">
          <span className="font-semibold text-muted-foreground col-start-2">Before</span>
          <span className="font-semibold text-muted-foreground">After</span>
          {keys.map((key) => {
            const prev = old?.[key];
            const next = attrs?.[key];
            const changed = JSON.stringify(prev) !== JSON.stringify(next);
            return (
              <Fragment key={`item-${key}`}>
                <span className="text-muted-foreground font-mono truncate">
                  {key}
                </span>
                <span>
                  {prev !== undefined && prev !== null ? (
                    <Badge variant="outline" className={`text-[10px] font-normal ${changed ? "line-through opacity-60" : ""}`}>
                      {String(prev)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
                <span>
                  {next !== undefined && next !== null ? (
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-normal ${changed ? "border-emerald-500 text-emerald-700 dark:text-emerald-400" : ""}`}
                    >
                      {String(next)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </Fragment>
            );
          })}
        </div>
      </TableCell>
    </TableRow>
  );
}
