"use client";

import { useState } from "react";
import { ClaimTypeManager } from "@/features/claims/components/ClaimTypeManager";
import { SubclaimTypesView } from "@/features/claims/components/SubclaimTypesView";

export default function ClaimTypesSettingsPage() {
  const [selectedClaimTypeId, setSelectedClaimTypeId] = useState<string | null>(
    null
  );

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
      <ClaimTypeManager onSelectSubclaims={setSelectedClaimTypeId} />
    </div>
  );
}
