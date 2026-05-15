"use client";

import { cn } from "@/lib/utils";

const statusGradients: Record<string, string> = {
  Present: "from-emerald-400 to-green-500",
  "Clocked In": "from-emerald-400 to-green-500",
  "Clocked Out": "from-emerald-400 to-green-500",
  Approved: "from-emerald-400 to-green-500",
  Paid: "from-cyan-400 to-sky-500",
  Pending: "from-amber-300 to-yellow-500",
  Draft: "from-slate-400 to-slate-500",
  Rejected: "from-red-400 to-rose-500",
  Late: "from-amber-300 to-yellow-500",
  Absent: "from-red-400 to-rose-500",
  WFH: "from-pink-300 to-pink-500",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let resolvedStatus = status;
  if (status.includes("Late")) resolvedStatus = "Late";
  else if (status.includes("WFH")) resolvedStatus = "WFH";
  else if (status.includes("Absent")) resolvedStatus = "Absent";
  else if (status.includes("Approved")) resolvedStatus = "Approved";
  else if (status.includes("Paid")) resolvedStatus = "Paid";
  else if (status.includes("Pending")) resolvedStatus = "Pending";
  else if (status.includes("Draft")) resolvedStatus = "Draft";
  else if (status.includes("Rejected")) resolvedStatus = "Rejected";
  else if (status.includes("Clocked") || status.includes("Present")) resolvedStatus = "Clocked In";

  const gradient = statusGradients[resolvedStatus] ?? "from-gray-400 to-gray-500";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold text-white bg-gradient-to-r shadow-sm",
        gradient,
        className
      )}
    >
      {status}
    </span>
  );
}
