"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { AUDIT_MODULES, AUDIT_EVENTS } from "@/features/audit/types";
import type { AuditFilter } from "@/features/audit/types";

interface AuditFiltersBarProps {
  filters: AuditFilter;
  onChange: (filters: AuditFilter) => void;
  onReset: () => void;
}

export function AuditFiltersBar({ filters, onChange, onReset }: AuditFiltersBarProps) {
  const eventOptions = filters.module ? (AUDIT_EVENTS[filters.module] ?? []) : [];
  const hasFilters = !!(filters.module || filters.event || filters.from || filters.to);

  function set<K extends keyof AuditFilter>(key: K, value: AuditFilter[K]) {
    const next: AuditFilter = { ...filters, [key]: value || undefined };
    if (key === "module") next.event = undefined;
    onChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pb-4">
      <Select value={filters.module ?? ""} onValueChange={(v) => set("module", v)}>
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue placeholder="All modules" />
        </SelectTrigger>
        <SelectContent>
          {AUDIT_MODULES.map((m) => (
            <SelectItem key={m.value} value={m.value} className="text-xs">
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.event ?? ""}
        onValueChange={(v) => set("event", v)}
        disabled={eventOptions.length === 0}
      >
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue placeholder="All actions" />
        </SelectTrigger>
        <SelectContent>
          {eventOptions.map((e) => (
            <SelectItem key={e.value} value={e.value} className="text-xs">
              {e.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        type="date"
        className="h-8 w-[140px] text-xs"
        value={filters.from ?? ""}
        onChange={(e) => set("from", e.target.value)}
        placeholder="From"
      />
      <Input
        type="date"
        className="h-8 w-[140px] text-xs"
        value={filters.to ?? ""}
        onChange={(e) => set("to", e.target.value)}
        placeholder="To"
      />

      {hasFilters && (
        <Button variant="ghost" size="sm" className="h-8 px-2 text-xs gap-1" onClick={onReset}>
          <X className="h-3 w-3" />
          Clear
        </Button>
      )}
    </div>
  );
}
