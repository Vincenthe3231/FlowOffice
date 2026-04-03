import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: { wrap: "h-6 w-6", icon: "h-3 w-3" },
  md: { wrap: "h-8 w-8", icon: "h-4 w-4" },
} as const;

/** White X on solid destructive circle — matches product reject affordance */
export function RejectDiscIcon({
  size = "sm",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const s = sizes[size];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm ring-1 ring-destructive/20",
        s.wrap,
        className
      )}
      aria-hidden
    >
      <X className={cn(s.icon, "stroke-[2.75]")} />
    </span>
  );
}
