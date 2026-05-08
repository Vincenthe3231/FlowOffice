"use client";

import { useState } from "react";
import { ClaimTypeManager } from "@/features/claims/components/ClaimTypeManager";
import { ClaimTypesTopManagementGate } from "@/features/claims/components/ClaimTypesTopManagementGate";
import { SubclaimTypesView } from "@/features/claims/components/SubclaimTypesView";

function ManageClaimTypesPageContent() {
  const [selectedClaimTypeId, setSelectedClaimTypeId] = useState<string | null>(null);

  if (selectedClaimTypeId) {
    return (
      <div className="space-y-6">
        <SubclaimTypesView
          claimTypeId={selectedClaimTypeId}
          onBack={() => setSelectedClaimTypeId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Manage Claim Types</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Create and edit claim categories, rates, and subclaim types.
        </p>
      </div>
      <ClaimTypeManager onSelectSubclaims={setSelectedClaimTypeId} />
    </div>
  );
}

/**
 * Top Management — configure claim types and subclaim types (former Settings → Claim types tab).
 */
export default function ManageClaimTypesPage() {
  return (
    <ClaimTypesTopManagementGate>
      <ManageClaimTypesPageContent />
    </ClaimTypesTopManagementGate>
  );
}
