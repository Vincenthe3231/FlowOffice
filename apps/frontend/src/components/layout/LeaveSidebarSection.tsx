"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calendar, ChevronDown, LayoutList, CalendarCheck, Tags } from "lucide-react";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { isRouteActive } from "@/shared/lib/nav-active";

export function LeaveSidebarSection({
  showApprovalQueue,
  showLeaveTypes,
}: {
  showApprovalQueue: boolean;
  showLeaveTypes: boolean;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const isLeaveArea = pathname.startsWith("/dashboard/leave");
  const [open, setOpen] = React.useState(isLeaveArea);

  React.useEffect(() => {
    if (isLeaveArea) setOpen(true);
  }, [isLeaveArea]);

  const subItems = React.useMemo(() => {
    const base = [
      { title: "My Leave", href: "/dashboard/leave", icon: LayoutList, exact: true },
    ];
    if (showApprovalQueue) {
      base.push({ title: "Approval Queue", href: "/dashboard/leave/approval", icon: CalendarCheck, exact: false });
    }
    if (showLeaveTypes) {
      base.push({ title: "Leave Types", href: "/dashboard/leave/types", icon: Tags, exact: false });
    }
    return base;
  }, [showApprovalQueue, showLeaveTypes]);

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isLeaveArea} tooltip="Leave">
          <Link
            href="/dashboard/leave"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
          >
            <Calendar className="h-[18px] w-[18px] shrink-0" />
            <span>Leave</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        type="button"
        onClick={() => setOpen((o) => !o)}
        isActive={isLeaveArea}
        className="w-full justify-between gap-2"
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <Calendar className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate text-left">Leave</span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            open ? "rotate-0" : "-rotate-90"
          )}
          aria-hidden
        />
      </SidebarMenuButton>
      {open ? (
        <SidebarMenuSub>
          {subItems.map((sub) => {
            const Icon = sub.icon;
            return (
              <SidebarMenuSubItem key={sub.href}>
                <SidebarMenuSubButton
                  asChild
                  isActive={
                    sub.exact
                      ? (pathname.replace(/\/$/, "") || "/") === sub.href
                      : isRouteActive(pathname, sub.href)
                  }
                  size="sm"
                >
                  <Link href={sub.href}>
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{sub.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  );
}
