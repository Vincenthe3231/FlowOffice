"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OnboardingAdminView } from "@/features/onboarding/components/OnboardingAdminView";
import { useAuth } from "@/shared/hooks/useAuth";
import { canSeeOnboardingAdmin } from "@/shared/lib/role-utils";
import { useProfile } from "@/features/profile/hooks/useProfile";
import { PageHeader } from "@/components/shared/PageHeader";

export default function OnboardingPage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const allowed = canSeeOnboardingAdmin(profile?.role, user?.roles);

  if (!allowed) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Onboarding"
          subtitle="Admin queue for new joiners"
        />
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">
            You do not have access to onboarding administration. Top Management can review and
            approve requests here.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding"
        subtitle="Review pending accounts, assign role and department, or reject with a reason."
      />
      <OnboardingAdminView />
    </div>
  );
}
