"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, FileText, LayoutList, PlusCircle, Tags } from "lucide-react";
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

const CLAIMS_SUBMIT_HUB = {
  title: "Submit New Claim",
  href: "/dashboard/claims",
  icon: PlusCircle,
} as const;

const ALL_CLAIMS_LIST = {
  title: "All Claims",
  icon: LayoutList,
} as const;

const MANAGE_CLAIM_TYPES_ITEM = {
  title: "Manage Claim Types",
  href: "/dashboard/claims/types",
  icon: Tags,
} as const;

/**
 * Expandable Claims: Submit hub (`/dashboard/claims`), All Claims (`allClaimsHref` — my
 * submissions for staff, org approval queue for HOD/HR/Top Management).
 * "Manage Claim Types" only when `showManageClaimTypes` (Top Management).
 */
export function ClaimsSidebarSection({
  showManageClaimTypes,
  allClaimsHref,
}: {
  showManageClaimTypes: boolean;
  allClaimsHref: string;
}) {
  const subItems = React.useMemo(() => {
    const base = [
      { ...CLAIMS_SUBMIT_HUB },
      { ...ALL_CLAIMS_LIST, href: allClaimsHref },
    ] as const;
    return showManageClaimTypes ? [...base, MANAGE_CLAIM_TYPES_ITEM] : [...base];
  }, [showManageClaimTypes, allClaimsHref]);
  const pathname = usePathname();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isClaimsArea = pathname.startsWith("/dashboard/claims");
  const [open, setOpen] = React.useState(isClaimsArea);

  React.useEffect(() => {
    if (isClaimsArea) setOpen(true);
  }, [isClaimsArea]);

  if (collapsed) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={isClaimsArea} tooltip="Claims">
          <Link
            href="/dashboard/claims"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-sidebar-accent data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:font-semibold"
          >
            <FileText className="h-[18px] w-[18px] shrink-0" />
            <span>Claims</span>
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
        isActive={isClaimsArea}
        className="w-full justify-between gap-2"
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 items-center gap-3">
          <FileText className="h-[18px] w-[18px] shrink-0" />
          <span className="truncate text-left">Claims</span>
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
                    sub.href === "/dashboard/claims"
                      ? (pathname.replace(/\/$/, "") || "/") === "/dashboard/claims"
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
