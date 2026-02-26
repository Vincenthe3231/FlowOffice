"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Timer,
  BarChart3,
  MapPin,
  Monitor,
  ScrollText,
  Calendar,
  FileText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import FullLogo from "@/components/shared/FullLogo";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAuthStore } from "@/shared/stores/auth-store";
import { logoutUser } from "@/shared/lib/api-client/laravel-client";
import { AUTH_QUERY_KEYS } from "@/shared/lib/api-client/auth-constants";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Search, ChevronDown } from "lucide-react";

const mainNav = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Leave", href: "/dashboard/leave", icon: Calendar },
  { title: "Claims", href: "/dashboard/claims", icon: FileText },
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

function NavGroup({
  label,
  items,
}: {
  label: string;
  items: { title: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="text-[11px] uppercase tracking-wider text-muted-foreground/70 font-semibold mb-1">
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch {
      // ignore
    } finally {
      logout();
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.ME });
      queryClient.clear();
      window.location.href = "/login";
    }
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 pb-2">
          <div className="flex items-center gap-2.5">
            <FullLogo />
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 pt-2">
          <NavGroup label="Main" items={mainNav} />
          <NavGroup label="Attendance" items={attendanceNav} />
          <NavGroup label="Overtime" items={overtimeNav} />
          <NavGroup label="Reports" items={reportNav} />
          <NavGroup label="Settings" items={settingsNav} />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 premium-shadow">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="w-64 pl-9 h-9 bg-muted/50 border-0 focus-visible:ring-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium leading-none">{user?.name ?? "User"}</p>
                    <p className="text-[11px] text-muted-foreground">{user?.email ?? ""}</p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
