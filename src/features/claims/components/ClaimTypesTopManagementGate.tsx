"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/shared/hooks/useAuth";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { isTopManagement } from "@/shared/lib/role-utils";

const CLAIMS_HOME = "/dashboard/claims";

/**
 * Client gate for Manage Claim Types routes — Top Management only; others are sent to personal Claims.
 */
export function ClaimTypesTopManagementGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const ready = !authLoading && !profileLoading;
  const allowed = isTopManagement(profile?.role, user?.roles);

  useEffect(() => {
    if (!ready) return;
    if (!allowed) router.replace(CLAIMS_HOME);
  }, [ready, allowed, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
