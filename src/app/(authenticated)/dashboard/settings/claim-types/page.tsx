"use client";

import { useState } from "react";
import { ClaimTypeManager } from "@/features/claims/components/ClaimTypeManager";
import { SubclaimTypesView } from "@/features/claims/components/SubclaimTypesView";

export default function ClaimTypesSettingsPage() {
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
        <h1 className="text-2xl font-bold text-foreground">Manage Claims</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage main claim types (Receipt, Mileage, etc.). Only HR and super admins can add or delete.
        </p>
      </div>

      <ClaimTypeManager onSelectSubclaims={setSelectedClaimTypeId} />
    </div>
  );
}
