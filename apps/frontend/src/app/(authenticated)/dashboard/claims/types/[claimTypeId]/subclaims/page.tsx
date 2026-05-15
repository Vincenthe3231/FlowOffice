"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ClaimTypesTopManagementGate } from "@/features/claims/components/ClaimTypesTopManagementGate";
import { SubclaimTypesView } from "@/features/claims/components/SubclaimTypesView";

const TYPES_INDEX = "/dashboard/claims/types";

function SubclaimTypesPageContent() {
  const params = useParams();
  const router = useRouter();
  const claimTypeId =
    typeof params?.claimTypeId === "string" ? params.claimTypeId : null;

  useEffect(() => {
    if (claimTypeId == null || claimTypeId === "") {
      router.replace(TYPES_INDEX);
    }
  }, [claimTypeId, router]);

  if (claimTypeId == null || claimTypeId === "") {
    return null;
  }

  return (
    <SubclaimTypesView
      claimTypeId={claimTypeId}
      onBack={() => router.replace(TYPES_INDEX)}
    />
  );
}

export default function SubclaimTypesPage() {
  return (
    <ClaimTypesTopManagementGate>
      <SubclaimTypesPageContent />
    </ClaimTypesTopManagementGate>
  );
}
