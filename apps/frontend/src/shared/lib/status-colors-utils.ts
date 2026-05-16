import { cn } from "@/lib/utils";

export interface StatusColorConfig {
  bg: string;
  text: string;
  dot: string;
}

const DEFAULT_STATUS_COLOR: StatusColorConfig = {
  bg: "bg-muted",
  text: "text-muted-foreground",
  dot: "bg-muted-foreground",
};

/**
 * Unified status colors across all modules.
 * Based on Claims module color system.
 */
export const STATUS_COLORS: Record<string, StatusColorConfig> = {
  // Claims statuses (PascalCase)
  Pending: {
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  Approved: {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  Rejected: {
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-800 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  Paid: {
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    text: "text-blue-800 dark:text-blue-200",
    dot: "bg-blue-500",
  },
  Draft: {
    bg: "bg-muted",
    text: "text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  // Additional statuses (normalized to PascalCase)
  Active: {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  Verifying: {
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  Deactivated: {
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-800 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  Cancelled: {
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-800 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  Present: {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  Absent: {
    bg: "bg-rose-500/15 dark:bg-rose-500/20",
    text: "text-rose-800 dark:text-rose-200",
    dot: "bg-rose-500",
  },
  Late: {
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    text: "text-amber-800 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  WFH: {
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    text: "text-purple-800 dark:text-purple-200",
    dot: "bg-purple-500",
  },
  "Clocked In": {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  "Clocked Out": {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
  Processed: {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    text: "text-emerald-800 dark:text-emerald-200",
    dot: "bg-emerald-500",
  },
};

/**
 * Get status color config by status string (case-insensitive).
 * Normalizes input to PascalCase and returns matching color config.
 */
export function getStatusColorConfig(
  status: string | null | undefined
): StatusColorConfig {
  if (!status) return DEFAULT_STATUS_COLOR;

  // Try exact match first (already PascalCase)
  if (STATUS_COLORS[status]) {
    return STATUS_COLORS[status];
  }

  // Try normalized version (capitalize first letter, lowercase rest)
  const normalized =
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  if (STATUS_COLORS[normalized]) {
    return STATUS_COLORS[normalized];
  }

  // Try multi-word status (e.g., "clocked in" → "Clocked In")
  const titleCased = status
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  if (STATUS_COLORS[titleCased]) {
    return STATUS_COLORS[titleCased];
  }

  return DEFAULT_STATUS_COLOR;
}

/**
 * Create HTML class string for status badge (like Claims component).
 * Includes border, padding, text formatting classes.
 */
export function getStatusBadgeClasses(status: string | null | undefined): string {
  const colorConfig = getStatusColorConfig(status);
  return cn(
    "flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-black uppercase tracking-widest",
    colorConfig.text,
    colorConfig.bg
  );
}

/**
 * Normalize status string to PascalCase for consistent display.
 */
export function normalizeStatusDisplay(status: string | null | undefined): string {
  if (!status) return "Unknown";
  return (
    status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
  );
}
