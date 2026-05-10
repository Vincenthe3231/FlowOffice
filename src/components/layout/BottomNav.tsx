"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
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
  ChevronDown,
  Sparkles,
  Users,
  Building2,
  PlusCircle,
  LayoutList,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useAuthStore } from "@/shared/stores/auth-store";
import { logoutUser } from "@/shared/lib/api-client/laravel-client";
import { AUTH_QUERY_KEYS } from "@/shared/lib/api-client/auth-constants";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { cn } from "@/lib/utils";
import { CustomizerContext } from "@/app/context/CustomizerContext";
import { featuresConfig } from "@/config/features.config";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Same nav structure as the sidebar (existing sidebar content)
const mainNavAll = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Onboarding", href: "/dashboard/onboarding", icon: Sparkles },
  { title: "Attendance", href: "/dashboard/attendnance", icon: ClipboardList },
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

const baseSettingsNav = [
  { title: "Work Locations", href: "/dashboard/settings/locations", icon: MapPin },
  { title: "Work Mode", href: "/dashboard/settings/work-mode", icon: Monitor },
  { title: "Shift Scheduling", href: "/dashboard/settings/shifts", icon: Calendar },
  { title: "Audit Trail", href: "/dashboard/settings/audit", icon: ScrollText },
  { title: "User Management", href: "/dashboard/settings/users", icon: Users },
  { title: "Departments", href: "/dashboard/settings/departments", icon: Building2 },
];

type SimpleNavItem = { title: string; href: string; icon: LucideIcon };

type UnifiedNavItem =
  | { type: "link"; title: string; href: string; icon: LucideIcon }
  | { type: "claims"; title: "Claims"; children: SimpleNavItem[] };

function buildClaimsChildren(
  showManageClaimTypes: boolean,
  allClaimsHref: string
): SimpleNavItem[] {
  const base: SimpleNavItem[] = [
    { title: "Submit New Claim", href: "/dashboard/claims", icon: PlusCircle },
    { title: "All Claims", href: allClaimsHref, icon: LayoutList },
  ];
  if (showManageClaimTypes) {
    base.push({
      title: "Manage Claim Types",
      href: "/dashboard/claims/types",
      icon: Tags,
    });
  }
  return base;
}

function mainNavToUnifiedItems(
  mainItems: { title: string; href: string; icon: LucideIcon }[],
  opts: {
    showExpandedClaimsNav: boolean;
    showManageClaimTypes: boolean;
    claimsAllSubHref: string;
  }
): UnifiedNavItem[] {
  return mainItems.map((item) => {
    if (item.href === "/dashboard/claims" && opts.showExpandedClaimsNav) {
      return {
        type: "claims" as const,
        title: "Claims",
        children: buildClaimsChildren(opts.showManageClaimTypes, opts.claimsAllSubHref),
      };
    }
    return { type: "link" as const, ...item };
  });
}

function toLinkItems(items: SimpleNavItem[]): UnifiedNavItem[] {
  return items.map((item) => ({ type: "link" as const, ...item }));
}

function buildNavGroupsWithoutSettings(
  mainUnified: UnifiedNavItem[]
): { label: string; items: UnifiedNavItem[] }[] {
  const groups: { label: string; items: UnifiedNavItem[] }[] = [
    { label: "Main", items: mainUnified },
  ];
  if (featuresConfig.attendance) groups.push({ label: "Attendance", items: toLinkItems(attendanceNav) });
  if (featuresConfig.overtime) groups.push({ label: "Overtime", items: toLinkItems(overtimeNav) });
  if (featuresConfig.reports) groups.push({ label: "Reports", items: toLinkItems(reportNav) });
  return groups;
}

function filterNavGroupsByQuery(
  groups: { label: string; items: UnifiedNavItem[] }[],
  query: string
): { label: string; items: UnifiedNavItem[] }[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((group) => {
      const labelMatches = group.label.toLowerCase().includes(q);
      const matchingItems = group.items
        .map((item) => {
          if (item.type === "link") {
            const hit =
              item.title.toLowerCase().includes(q) ||
              item.href.toLowerCase().includes(q);
            return hit ? item : null;
          }
          const titleHit = item.title.toLowerCase().includes(q);
          const childHits = item.children.filter(
            (c) =>
              c.title.toLowerCase().includes(q) || c.href.toLowerCase().includes(q)
          );
          if (titleHit) return item;
          if (childHits.length) return { ...item, children: childHits };
          return null;
        })
        .filter((x): x is UnifiedNavItem => x != null);
      return {
        ...group,
        items: labelMatches ? group.items : matchingItems,
      };
    })
    .filter((group) => group.items.length > 0);
}

function MenuOption({
  icon: Icon,
  label,
  href,
  isActive,
  onNavigate,
  variant = "default",
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
  onNavigate: () => void;
  variant?: "default" | "sub";
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex w-full items-center justify-between rounded px-2 py-1.5 transition-colors hover:bg-muted/50 group sm:rounded-md sm:px-2.5 sm:py-2 md:rounded-lg md:px-3 md:py-2.5",
        variant === "sub" && "ml-1 border-l-2 border-primary/20 pl-3 sm:ml-1.5 sm:pl-3.5"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2 md:gap-3">
        <Icon
          size={14}
          className={`h-3.5 w-3.5 shrink-0 transition-colors sm:h-4 sm:w-4 md:h-[18px] md:w-[18px] ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
        />
        <span
          className={`truncate text-[11px] sm:text-xs md:text-[14px] ${isActive ? "font-semibold text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}
        >
          {label}
        </span>
      </div>
      {variant === "default" ? (
        <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground/70 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5" />
      ) : null}
    </Link>
  );
}

function ClaimsExpandableNav({
  subItems,
  pathname,
  onNavigate,
  hasSearchQuery,
}: {
  subItems: SimpleNavItem[];
  pathname: string;
  onNavigate: () => void;
  hasSearchQuery: boolean;
}) {
  const isClaimsArea = pathname.startsWith("/dashboard/claims");
  const [open, setOpen] = useState(isClaimsArea);

  useEffect(() => {
    if (isClaimsArea) setOpen(true);
  }, [isClaimsArea]);

  useEffect(() => {
    if (hasSearchQuery) setOpen(true);
  }, [hasSearchQuery]);

  const subActive = subItems.some((sub) =>
    sub.href === "/dashboard/claims"
      ? (pathname.replace(/\/$/, "") || "/") === "/dashboard/claims"
      : isRouteActive(pathname, sub.href)
  );

  return (
    <div className="rounded px-0.5 sm:rounded-md md:rounded-lg">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded px-2 py-1.5 transition-colors hover:bg-muted/50 group sm:rounded-md sm:px-2.5 sm:py-2 md:rounded-lg md:px-3 md:py-2.5",
          (isClaimsArea || subActive) && "bg-muted/30"
        )}
        aria-expanded={open}
        aria-controls="bottom-nav-claims-sub"
      >
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2 md:gap-3">
          <FileText
            className={cn(
              "h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 md:h-[18px] md:w-[18px]",
              isClaimsArea || subActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span
            className={cn(
              "text-[11px] sm:text-xs md:text-[14px]",
              isClaimsArea || subActive
                ? "font-semibold text-foreground"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          >
            Claims
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200 sm:h-3.5 sm:w-3.5",
            open ? "rotate-0" : "-rotate-90"
          )}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id="bottom-nav-claims-sub"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-0.5 space-y-0.5 pb-0.5 pt-0.5">
              {subItems.map((sub) => {
                const subIsActive =
                  sub.href === "/dashboard/claims"
                    ? (pathname.replace(/\/$/, "") || "/") === "/dashboard/claims"
                    : isRouteActive(pathname, sub.href);
                return (
                  <MenuOption
                    key={`${sub.href}-${sub.title}`}
                    icon={sub.icon}
                    label={sub.title}
                    href={sub.href}
                    isActive={subIsActive}
                    onNavigate={onNavigate}
                    variant="sub"
                  />
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function renderUnifiedItem(
  item: UnifiedNavItem,
  pathname: string,
  closeMenu: () => void,
  hasSearchQuery: boolean
) {
  if (item.type === "claims") {
    return (
      <ClaimsExpandableNav
        key="claims-expandable"
        subItems={item.children}
        pathname={pathname}
        onNavigate={closeMenu}
        hasSearchQuery={hasSearchQuery}
      />
    );
  }
  return (
    <MenuOption
      key={item.href}
      icon={item.icon}
      label={item.title}
      href={item.href}
      isActive={isRouteActive(pathname, item.href)}
      onNavigate={closeMenu}
    />
  );
}

export function BottomNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const [isThemeReady, setIsThemeReady] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { profile } = useProfile();
  const customizer = useContext(CustomizerContext);
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();
  const currentMode = customizer?.activeMode ?? "light";
  const hasSearchQuery = findQuery.trim().length > 0;
  const isPanelOpen = isOpen || hasSearchQuery;

  const showSettingsNav = canSeeSettingsNav(profile?.role, user?.roles);
  const showOnboardingNav = canSeeOnboardingAdmin(profile?.role, user?.roles);
  const showExpandedClaimsNav = canSeeExpandedClaimsNav();
  const showManageClaimTypes = isTopManagement(profile?.role, user?.roles);
  const claimsAllSubHref = canRejectClaimFromMyClaimsList(profile?.role, user?.roles)
    ? "/dashboard/claims/all"
    : "/dashboard/claims/my";
  const mainNav = useMemo(
    () =>
      mainNavAll.filter((item) => {
        if (!showOnboardingNav && item.href === "/dashboard/onboarding") return false;
        if (!featuresConfig.attendance && item.href === "/dashboard/attendnance") return false;
        if (!featuresConfig.leave && item.href === "/dashboard/leave") return false;
        if (!featuresConfig.claims && item.href === "/dashboard/claims") return false;
        return true;
      }),
    [showOnboardingNav]
  );
  const mainUnified = useMemo(
    () =>
      mainNavToUnifiedItems(mainNav, {
        showExpandedClaimsNav,
        showManageClaimTypes,
        claimsAllSubHref,
      }),
    [mainNav, showExpandedClaimsNav, showManageClaimTypes, claimsAllSubHref]
  );
  const settingsNav = useMemo(() => {
    if (!showSettingsNav) return [];
    return baseSettingsNav;
  }, [showSettingsNav]);
  const mobileRoleLabel = useMemo(
    () => formatUserRoleForDisplay(profile?.role, user?.roles),
    [profile?.role, user?.roles]
  );
  const navGroupsWithoutSettings = useMemo(
    () => buildNavGroupsWithoutSettings(mainUnified),
    [mainUnified]
  );
  const navGroups = useMemo(
    () =>
      showSettingsNav
        ? [
            ...navGroupsWithoutSettings,
            { label: "Settings", items: toLinkItems(settingsNav) },
          ]
        : navGroupsWithoutSettings,
    [showSettingsNav, settingsNav, navGroupsWithoutSettings]
  );
  const pinnedGroups = useMemo(
    () => filterNavGroupsByQuery(navGroups, findQuery),
    [navGroups, findQuery]
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

  const closeMenu = () => {
    setIsOpen(false);
    setFindQuery("");
  };
  const isLightMode = currentMode !== "dark";

  useEffect(() => {
    setIsThemeReady(true);
  }, []);

  const handleThemeToggle = () => {
    if (!customizer) return;
    customizer.setActiveMode(isLightMode ? "dark" : "light");
  };

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
        className="fixed bottom-3 left-1/2 z-[70] w-[92%] max-w-[200px] -translate-x-1/2 pb-[env(safe-area-inset-bottom)] sm:bottom-4 sm:max-w-[380px] md:bottom-8 md:w-[90%] md:max-w-[440px] lg:hidden"
        aria-label="Mobile navigation"
      >
        <AnimatePresence>
          {isPanelOpen && (
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
                        {group.items.map((item) =>
                          renderUnifiedItem(item, pathname, closeMenu, hasSearchQuery)
                        )}
                      </div>
                    ) : (
                      group.items.map((item) =>
                        renderUnifiedItem(item, pathname, closeMenu, hasSearchQuery)
                      )
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          layout
          className="flex h-12 w-full items-center justify-between rounded-full border border-border bg-card px-3 shadow-2xl text-foreground sm:h-[52px] sm:px-4 md:h-14 md:px-5"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5 md:gap-3">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground sm:h-[18px] sm:w-[18px] md:h-5 md:w-5" />
            <input
              type="text"
              placeholder="Find..."
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:text-sm md:text-base"
              aria-label="Search"
            />
          </div>

          <div className="mx-2 h-5 w-px shrink-0 bg-border sm:mx-2.5 sm:h-6 md:mx-3 md:h-7" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="shrink-0 rounded-full p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring md:p-1.5"
                aria-label="Profile"
              >
                <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9">
                  <AvatarImage src={profile?.avatarUrl ?? undefined} alt="" />
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold sm:text-xs md:text-sm">
                    {user?.name?.slice(0, 2).toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="w-56 rounded-2xl border-border/80 bg-card/95 p-1.5 text-foreground shadow-2xl backdrop-blur-xl"
            >
              <DropdownMenuLabel className="px-2.5 py-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar className="h-8 w-8 shrink-0 border border-border/60">
                    <AvatarImage src={profile?.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">
                      {user?.name ?? "User"}
                    </p>
                    <p className="truncate text-[11px] font-normal text-muted-foreground">
                      {user?.email ?? ""}
                    </p>
                    <p className="truncate text-[11px] font-medium text-muted-foreground/90">
                      {mobileRoleLabel}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-0 my-1 bg-border/70" />
              <DropdownMenuItem
                asChild
                className="rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground focus:bg-muted/60 focus:text-foreground"
              >
                <Link href="/dashboard/profile" className="flex items-center gap-2.5">
                  <User className="h-3.5 w-3.5 shrink-0" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground focus:bg-muted/60 focus:text-foreground">
                <div className="flex w-full items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <Bell className="h-3.5 w-3.5 shrink-0" />
                    <span>Notifications</span>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-destructive" />
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleThemeToggle}
                className="rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground focus:bg-muted/60 focus:text-foreground"
              >
                <div className="flex w-full items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    {isThemeReady && !isLightMode ? (
                      <Sun className="h-3.5 w-3.5 shrink-0" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span>Theme</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {isThemeReady ? (isLightMode ? "Light" : "Dark") : "Theme"}
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl px-2.5 py-2 text-xs font-medium text-muted-foreground focus:bg-muted/60 focus:text-foreground">
                <Settings className="h-3.5 w-3.5 shrink-0" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="mx-0 my-1 bg-border/70" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="rounded-xl px-2.5 py-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5 shrink-0" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="ml-3 shrink-0 p-1 text-muted-foreground transition-colors hover:text-foreground md:ml-4 md:p-1.5"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="h-5 w-5 sm:h-[22px] sm:w-[22px] md:h-6 md:w-6" /> : <Menu className="h-5 w-5 sm:h-[22px] sm:w-[22px] md:h-6 md:w-6" />}
          </button>
        </motion.div>
      </nav>
    </>
  );
}
