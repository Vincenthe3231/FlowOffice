import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchClaims,
  fetchClaimsStats,
  fetchClaimCategories,
  fetchMonthlySpend,
  fetchMileageRate,
  createClaim,
  uploadClaimAttachment,
} from "@/shared/lib/api-client/claims";
import { CLAIM_PIE_COLORS } from "@/features/claims/data";
import type { ClaimFilter } from "@/features/claims/types";
import type { CreateClaimPayload } from "@/shared/lib/api-client/claims";
import { extractError } from "@/shared/lib/api-client/response-handler";

export const CLAIM_QUERY_KEYS = {
  claims: (filter?: ClaimFilter, page?: number) => ["claims", filter, page] as const,
  stats: () => ["claims", "stats"] as const,
  categories: () => ["claims", "categories"] as const,
  monthly: () => ["claims", "monthly"] as const,
  mileageRate: () => ["claims", "mileage-rate"] as const,
};

export function useClaims(filter: ClaimFilter, page = 1, perPage = 50) {
  const statusParam = filter === "All" ? undefined : filter;
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.claims(statusParam, page),
    queryFn: async () =>
      fetchClaims({
        status: statusParam,
        page,
        perPage,
      }),
    select: (res) => ({
      claims: res.claims,
      meta: res.meta,
    }),
  });
}

export function useClaimsStats() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.stats(),
    queryFn: fetchClaimsStats,
    select: (data) => ({
      totalAmount: data.totalAmount ?? 0,
      pendingCount: data.pendingCount ?? 0,
      approvedCount: data.approvedCount ?? 0,
      totalClaims: data.totalClaims ?? 0,
      sparkline: data.sparkline ?? [],
    }),
  });
}

export function useClaimCategories() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.categories(),
    queryFn: fetchClaimCategories,
  });
}

/** Returns categories shaped for the pie chart: { name, value, fill } */
export function useClaimCategoriesForChart() {
  const { data: categories = [] } = useClaimCategories();
  return categories.map((category, index) => ({
    name: category.name,
    value: category.spent,
    fill: CLAIM_PIE_COLORS[index % CLAIM_PIE_COLORS.length] ?? "hsl(var(--muted-foreground))",
  }));
}

export function useMonthlySpend() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.monthly(),
    queryFn: fetchMonthlySpend,
  });
}

export function useMileageRate() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.mileageRate(),
    queryFn: fetchMileageRate,
    placeholderData: 0.8,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClaimPayload) => createClaim(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success("Claim submitted");
    },
    onError: (err) => {
      const apiError = extractError(err);
      toast.error(apiError.message ?? "Failed to submit claim");
    },
  });
}

export function useUploadClaimAttachment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ claimId, file }: { claimId: number; file: File }) =>
      uploadClaimAttachment(claimId, file),
    onSuccess: (_, { claimId }) => {
      queryClient.invalidateQueries({ queryKey: ["claims", claimId] });
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
    onError: (err) => {
      const apiError = extractError(err);
      toast.error(apiError.message ?? "Failed to upload receipt");
    },
  });
}

/** Client-side only: compute amount from distance * rate (no API) */
export function useMileageAmount(distance: string, rate: number) {
  if (!distance) return "0.00";
  const parsed = Number.parseFloat(distance);
  if (Number.isNaN(parsed)) return "0.00";
  return (parsed * rate).toFixed(2);
}
