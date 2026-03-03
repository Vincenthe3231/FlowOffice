"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  LayoutDashboard,
  ClipboardList,
  Timer,
  BarChart3,
  MapPin,
  Monitor,
  ScrollText,
  Calendar,
  FileText,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Same nav structure as the sidebar (existing sidebar content)
const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Attendance", href: "/dashboard/attendnance", icon: ClipboardList },
  { title: "Leave", href: "/dashboard/leave", icon: Calendar },
  { title: "Claims", href: "/dashboard/claims", icon: FileText },
];

const dashboardNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const attendanceNav = [
  { title: "Attendance Log", href: "/dashboard/log", icon: ClipboardList },
];

const overtimeNav = [
  { title: "OT Requests", href: "/dashboard/overtime", icon: Timer },
];

const reportNav = [
  { title: "Reports & Export", href: "/dashboard/reports", icon: BarChart3 },
];

const settingsNav = [
  { title: "Work Locations", href: "/dashboard/settings/locations", icon: MapPin },
  { title: "Work Mode", href: "/dashboard/settings/work-mode", icon: Monitor },
  { title: "Shift Scheduling", href: "/dashboard/settings/shifts", icon: Calendar },
  { title: "Audit Trail", href: "/dashboard/settings/audit", icon: ScrollText },
];

const navGroups: { label: string; items: { title: string; href: string; icon: LucideIcon }[] }[] = [
  { label: "Main", items: mainNav },
  { label: "Attendance", items: attendanceNav },
  { label: "Overtime", items: overtimeNav },
  { label: "Reports", items: reportNav },
  { label: "Settings", items: settingsNav },
];

function MenuOption({
  icon: Icon,
  label,
  href,
  isActive,
  onNavigate,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex w-full items-center justify-between rounded px-2 py-1.5 transition-colors hover:bg-muted/50 group sm:rounded-md sm:px-2.5 sm:py-2 md:rounded-lg md:px-3 md:py-2.5"
    >
      <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
        <Icon
          size={14}
          className={`h-3.5 w-3.5 shrink-0 transition-colors sm:h-4 sm:w-4 md:h-[18px] md:w-[18px] ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
        />
        <span
          className={`text-[11px] sm:text-xs md:text-[14px] ${isActive ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
        >
          {label}
        </span>
      </div>
      <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground/70 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
    </Link>
  );
}

function filterNavGroupsByQuery(
  groups: { label: string; items: { title: string; href: string; icon: LucideIcon }[] }[],
  query: string
): { label: string; items: { title: string; href: string; icon: LucideIcon }[] }[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((group) => {
      const labelMatches = group.label.toLowerCase().includes(q);
      const matchingItems = group.items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q)
      );
      return {
        ...group,
        items: labelMatches ? group.items : matchingItems,
      };
    })
    .filter((group) => group.items.length > 0);
}

export function BottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const pathname = usePathname();
  const pinnedGroups = useMemo(
    () => filterNavGroupsByQuery(navGroups, findQuery),
    [findQuery]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMenu}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <nav
        className="fixed bottom-3 left-1/2 z-[70] w-[50%] max-w-[200px] -translate-x-1/2 pb-[env(safe-area-inset-bottom)] sm:bottom-4 sm:max-w-[320px] sm:w-[92%] md:bottom-6 md:w-[90%] md:max-w-[380px] md:bottom-8 lg:hidden"
        aria-label="Mobile navigation"
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "tween", duration: 0.2 }}
              className="absolute bottom-[calc(100%+6px)] left-0 right-0 flex max-h-[50vh] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl sm:bottom-[calc(100%+8px)] sm:max-h-[55vh] sm:rounded-xl md:bottom-[calc(100%+12px)] md:max-h-[60vh] md:rounded-2xl"
            >
              <div className="custom-scrollbar overflow-y-auto p-1 sm:p-1.5 md:p-2">
                {pinnedGroups.map((group, groupIndex) => (
                  <div key={group.label}>
                    {groupIndex > 0 && (
                      <div className="mx-1 my-1 h-px bg-border sm:mx-1.5 sm:my-1.5 md:mx-2 md:my-2" />
                    )}
                    {group.items.length > 1 ? (
                      <div className="mb-1 rounded bg-muted/30 p-0.5 sm:mb-1.5 sm:rounded-md md:mb-2 md:rounded-lg md:p-1">
                        {group.items.map((item) => (
                          <MenuOption
                            key={item.href}
                            icon={item.icon}
                            label={item.title}
                            href={item.href}
                            isActive={pathname === item.href}
                            onNavigate={closeMenu}
                          />
                        ))}
                      </div>
                    ) : (
                      group.items.map((item) => (
                        <MenuOption
                          key={item.href}
                          icon={item.icon}
                          label={item.title}
                          href={item.href}
                          isActive={pathname === item.href}
                          onNavigate={closeMenu}
                        />
                      ))
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          className="flex h-8 w-full items-center justify-between rounded-full border border-border bg-card px-2.5 shadow-2xl text-foreground sm:h-9 sm:px-3 md:h-11 md:px-4"
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 md:gap-2.5">
            <Search className="h-3 w-3 shrink-0 text-muted-foreground sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
            <input
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent text-[11px] outline-none placeholder:text-muted-foreground sm:text-xs md:text-sm"
              onFocus={() => setIsOpen(true)}
              aria-label="Search"
            />
          </div>

          <div className="mx-1 h-3.5 w-px shrink-0 bg-border sm:mx-1.5 sm:h-4 md:mx-2 md:h-5" />

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="shrink-0 p-0.5 text-muted-foreground transition-colors hover:text-foreground md:p-1"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" /> : <Menu className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]" />}
          </button>
        </motion.div>
      </nav>
    </>
  );
}
