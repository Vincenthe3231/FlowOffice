"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { SubclaimTypesView } from "@/features/claims/components/SubclaimTypesView";

export default function SubclaimTypesPage() {
  const params = useParams();
  const router = useRouter();
  const claimTypeId = typeof params?.claimTypeId === "string" ? params.claimTypeId : null;

  useEffect(() => {
    if (claimTypeId == null || claimTypeId === "") {
      router.replace("/dashboard/settings/claim-types");
    }
  }, [claimTypeId, router]);

  if (claimTypeId == null || claimTypeId === "") {
    return null;
  }

  return (
    <SubclaimTypesView
      claimTypeId={claimTypeId}
      onBack={() => router.replace("/dashboard/settings/claim-types")}
    />
  );
}
