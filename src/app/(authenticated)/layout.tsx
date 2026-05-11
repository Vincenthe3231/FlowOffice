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
  Sparkles,
  Users,
  Building2,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarInput,
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
import { Search, ChevronDown } from "lucide-react";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { BottomNav } from "@/components/layout/BottomNav";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { isRouteActive } from "@/shared/lib/nav-active";
import {
  canRejectClaimFromMyClaimsList,
  canSeeExpandedClaimsNav,
  canSeeOnboardingAdmin,
  canSeeSettingsNav,
  formatUserRoleForDisplay,
  isTopManagement,
} from "@/shared/lib/role-utils";
import { ROLE_HR_ADMIN } from "@/shared/constants/roles";
import { ClaimsSidebarSection } from "@/components/layout/ClaimsSidebarSection";
import { LeaveSidebarSection } from "@/components/layout/LeaveSidebarSection";
import { featuresConfig } from "@/config/features.config";

const mainNavAll = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Onboarding", href: "/dashboard/onboarding", icon: Sparkles },
  { title: "Attendance", href: "/dashboard/attendance", icon: ClipboardList },
  { title: "Leave", href: "/dashboard/leave", icon: Calendar },
  { title: "Claims", href: "/dashboard/claims", icon: FileText },
] as const;

const attendanceNav = [
  { title: "Attendance Log", href: "/dashboard/log", icon: ClipboardList },
];

const overtimeNav = [
  { title: "OT Requests", href: "/dashboard/overtime", icon: Timer },
];

const reportNav = [
  { title: "Reports & Export", href: "/dashboard/reports", icon: BarChart3 },
];

const baseSettingsNav = [
  { title: "Work Locations", href: "/dashboard/settings/locations", icon: MapPin },
  { title: "Work Mode", href: "/dashboard/settings/work-mode", icon: Monitor },
  { title: "Shift Scheduling", href: "/dashboard/settings/shifts", icon: Calendar },
  { title: "Audit Trail", href: "/dashboard/settings/audit", icon: ScrollText },
  { title: "User Management", href: "/dashboard/settings/users", icon: Users },
  { title: "Departments", href: "/dashboard/settings/departments", icon: Building2 },
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
              <SidebarMenuButton
                asChild
                isActive={isRouteActive(pathname, item.href)}
              >
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

/** Main nav: expandable Claims + Leave sections; sub-links gated by role. */
function MainNavGroup({
  items,
  showExpandedClaimsNav,
  showManageClaimTypes,
  claimsAllSubHref,
  showLeaveApprovalQueue,
  showLeaveTypes,
}: {
  items: readonly {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  showExpandedClaimsNav: boolean;
  showManageClaimTypes: boolean;
  claimsAllSubHref: string;
  showLeaveApprovalQueue: boolean;
  showLeaveTypes: boolean;
}) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarGroup>
      {!collapsed && (
        <SidebarGroupLabel className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          Main
        </SidebarGroupLabel>
      )}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            if (item.href === "/dashboard/claims" && showExpandedClaimsNav) {
              return (
                <ClaimsSidebarSection
                  key="claims-expanded"
                  showManageClaimTypes={showManageClaimTypes}
                  allClaimsHref={claimsAllSubHref}
                />
              );
            }
            if (item.href === "/dashboard/leave") {
              return (
                <LeaveSidebarSection
                  key="leave-expanded"
                  showApprovalQueue={showLeaveApprovalQueue}
                  showLeaveTypes={showLeaveTypes}
                />
              );
            }
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isRouteActive(pathname, item.href)}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
                  >
                    <item.icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
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
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);
  const showSettingsNav = canSeeSettingsNav(profile?.role, user?.roles);
  const showOnboardingNav = canSeeOnboardingAdmin(profile?.role, user?.roles);
  const showExpandedClaimsNav = canSeeExpandedClaimsNav();
  const showManageClaimTypes = isTopManagement(profile?.role, user?.roles);
  const claimsAllSubHref = canRejectClaimFromMyClaimsList(profile?.role, user?.roles)
    ? "/dashboard/claims/all"
    : "/dashboard/claims/my";
  const showLeaveApprovalQueue = canSeeSettingsNav(profile?.role, user?.roles);
  const showLeaveTypes = Boolean(isTopManagement(profile?.role, user?.roles) || profile?.role === ROLE_HR_ADMIN || (user?.roles ?? []).includes(ROLE_HR_ADMIN));
  const mainNav = React.useMemo(
    () =>
      mainNavAll.filter((item) => {
        if (!showOnboardingNav && item.href === "/dashboard/onboarding") return false;
        if (!featuresConfig.attendance && item.href === "/dashboard/attendance") return false;
        if (!featuresConfig.leave && item.href === "/dashboard/leave") return false;
        if (!featuresConfig.claims && item.href === "/dashboard/claims") return false;
        return true;
      }),
    [showOnboardingNav, featuresConfig]
  );
  const settingsNav = React.useMemo(() => {
    if (!showSettingsNav) return [];
    return baseSettingsNav;
  }, [showSettingsNav]);

  const headerRoleLabel = React.useMemo(
    () => formatUserRoleForDisplay(profile?.role, user?.roles),
    [profile?.role, user?.roles]
  );

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
      <Sidebar collapsible="icon" className="hidden border-r border-sidebar-border lg:flex">
        <SidebarHeader className="p-4 pb-2">
          <div className="flex items-center gap-2.5">
            <FullLogo />
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2 pt-2">
          <MainNavGroup
            items={mainNav}
            showExpandedClaimsNav={showExpandedClaimsNav}
            showManageClaimTypes={showManageClaimTypes}
            claimsAllSubHref={claimsAllSubHref}
            showLeaveApprovalQueue={showLeaveApprovalQueue}
            showLeaveTypes={showLeaveTypes}
          />
          {featuresConfig.attendance && <NavGroup label="Attendance" items={attendanceNav} />}
          {featuresConfig.overtime && <NavGroup label="Overtime" items={overtimeNav} />}
          {featuresConfig.reports && <NavGroup label="Reports" items={reportNav} />}
          {showSettingsNav && (
            <NavGroup label="Settings" items={settingsNav} />
          )}
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarInput placeholder="Find…" className="h-9" />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-border bg-card px-4 premium-shadow lg:flex">
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
            <NotificationBell />
            <div className="hidden lg:flex">
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
                      <p className="text-[11px] text-muted-foreground/90">{headerRoleLabel}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pb-20 md:p-6 lg:pb-6 overflow-x-hidden min-w-0">
          <div className="w-full min-w-0">{children}</div>
        </div>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
