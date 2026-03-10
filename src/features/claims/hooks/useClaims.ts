import { useMemo } from "react";
import {
  CLAIM_PIE_COLORS,
  MILEAGE_RATE,
  claimCategories,
  claimsList,
} from "@/features/claims/data";
import type { ClaimFilter } from "@/features/claims/types";

export function useClaims(filter: ClaimFilter) {
  return useMemo(
    () =>
      filter === "All"
        ? claimsList
        : claimsList.filter((claim) => claim.status === filter),
    [filter]
  );
}

export function useClaimsStats() {
  return useMemo(() => {
    const totalAmount = claimsList.reduce((sum, claim) => sum + claim.amount, 0);
    const pendingCount = claimsList.filter((claim) => claim.status === "Pending").length;
    const approvedCount = claimsList.filter(
      (claim) => claim.status === "Approved" || claim.status === "Paid"
    ).length;

    return {
      totalAmount,
      pendingCount,
      approvedCount,
      totalClaims: claimsList.length,
    };
  }, []);
}

export function useClaimCategories() {
  return useMemo(
    () =>
      claimCategories.map((category, index) => ({
        name: category.name,
        value: category.spent,
        fill: CLAIM_PIE_COLORS[index % CLAIM_PIE_COLORS.length] ?? "hsl(var(--muted-foreground))",
      })),
    []
  );
}

export function useMileageAmount(distance: string) {
  return useMemo(() => {
    if (!distance) return "0.00";

    const parsedDistance = Number.parseFloat(distance);
    if (Number.isNaN(parsedDistance)) return "0.00";

    return (parsedDistance * MILEAGE_RATE).toFixed(2);
  }, [distance]);
}
