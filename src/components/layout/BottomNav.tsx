"use client"; // 1. Must be a client component to use hooks

import { Home, Clock, Calendar, Receipt, User } from "lucide-react";
import Link from "next/link"; // 2. Use Next.js Link
import { usePathname } from "next/navigation"; // 3. Use Next.js usePathname
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname(); // 4. Get the current path

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: Clock, label: "Attendance", path: "/dashboard/attendnance" },
    { icon: Calendar, label: "Leave", path: "/dashboard/leave" },
    { icon: Receipt, label: "Claims", path: "/dashboard/claims" },
    { icon: User, label: "Profile", path: "/dashboard/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          // 5. Compare the pathname directly
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path} // 6. Use 'href' instead of 'to'
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-h-touch min-w-[48px] px-2 py-2 rounded-xl transition-all duration-200 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-primary" />
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className={cn("text-2xs font-medium", isActive && "font-semibold")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}