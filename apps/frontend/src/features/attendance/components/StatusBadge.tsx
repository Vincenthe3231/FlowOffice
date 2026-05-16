"use client";

import { cn } from "@/lib/utils";
import { getStatusColorConfig } from "@/shared/lib/status-colors-utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorConfig = getStatusColorConfig(status);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
        colorConfig.text,
        colorConfig.bg,
        className
      )}
    >
      {status}
    </span>
  );
}
