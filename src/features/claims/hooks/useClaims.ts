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
  fetchClaimTypes as fetchClaimTypesApi,
  fetchSubclaimTypes as fetchSubclaimTypesApi,
  createClaimType as createClaimTypeApi,
  deleteClaimType as deleteClaimTypeApi,
  fetchClaimById,
  fetchClaimApprovals as fetchClaimApprovalsApi,
  fetchAllClaimsForApproval as fetchAllClaimsForApprovalApi,
  fetchPendingApprovals as fetchPendingApprovalsApi,
  fetchApprovalThreshold as fetchApprovalThresholdApi,
  submitClaim as submitClaimApi,
  approveRejectClaim as approveRejectClaimApi,
  createSubclaimType as createSubclaimTypeApi,
  deleteSubclaimType as deleteSubclaimTypeApi,
} from "@/shared/lib/api-client/claims";
import { CLAIM_PIE_COLORS } from "@/features/claims/data";
import type {
  ClaimFilter,
  ClaimType,
  SubclaimType,
  ClaimApproval,
  ApprovalThreshold,
} from "@/features/claims/types";
import type {
  CreateClaimPayload,
  ApproveRejectPayload,
  CreateClaimTypePayload,
} from "@/shared/lib/api-client/claims";
import { extractError } from "@/shared/lib/api-client/response-handler";
import { fetchMapsConfig } from "@/shared/lib/api-client/maps";

export const CLAIM_QUERY_KEYS = {
  claims: (filter?: ClaimFilter, page?: number) => ["claims", filter, page] as const,
  stats: () => ["claims", "stats"] as const,
  categories: () => ["claims", "categories"] as const,
  monthly: () => ["claims", "monthly"] as const,
  mileageRate: () => ["claims", "mileage-rate"] as const,
  claimTypes: () => ["claim-types"] as const,
  subclaimTypes: (id: string | null) => ["subclaim-types", id] as const,
  claim: (id: number | null) => ["claim", id] as const,
  claimApprovals: (claimId: number | null) => ["claim-approvals", claimId] as const,
  allClaimsApproval: () => ["all-claims-approval"] as const,
  pendingApprovals: () => ["pending-approvals"] as const,
  approvalThreshold: () => ["approval-threshold"] as const,
  mapsConfig: () => ["maps-config"] as const,
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

export function useMapsConfig() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.mapsConfig(),
    queryFn: fetchMapsConfig,
    staleTime: 1000 * 60 * 30,
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

// ── Wizard: claim types & subclaim types ──

export function useClaimTypes() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.claimTypes(),
    queryFn: async () => {
      const data = await fetchClaimTypesApi();
      return data.map(
        (row): ClaimType => ({
          id: String(row.id),
          key: row.key,
          label: row.label,
          description: row.description,
          icon: row.icon,
          color: row.color,
        })
      );
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function useSubclaimTypes(claimTypeId: string | null) {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.subclaimTypes(claimTypeId),
    queryFn: async () => {
      if (!claimTypeId) return [];
      const data = await fetchSubclaimTypesApi(claimTypeId);
      return data.map(
        (row): SubclaimType => ({
          id: String(row.id),
          claimTypeId: String(row.claimTypeId),
          key: row.key,
          label: row.label,
          rate: row.rate ?? null,
          status: row.status,
          description: row.description,
        })
      );
    },
    enabled: !!claimTypeId,
  });
}

// ── Single claim (with approvals from detail) ──

export function useClaimById(id: number | null) {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.claim(id),
    queryFn: () => fetchClaimById(id!),
    enabled: id != null,
  });
}

export function useClaimApprovals(claimId: number | null) {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.claimApprovals(claimId),
    queryFn: async () => {
      if (claimId == null) return [];
      const data = await fetchClaimApprovalsApi(claimId);
      return data.map(
        (row): ClaimApproval => ({
          id: row.id,
          claimId: row.claimId,
          level: row.level,
          status: row.status,
          reason: row.reason ?? null,
          decidedAt: row.decidedAt ?? null,
        })
      );
    },
    enabled: claimId != null,
  });
}

// ── Approval (HR) ──

export function useAllClaimsForApproval() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.allClaimsApproval(),
    queryFn: fetchAllClaimsForApprovalApi,
  });
}

export function usePendingApprovals() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.pendingApprovals(),
    queryFn: fetchPendingApprovalsApi,
  });
}

export function useApprovalThreshold() {
  return useQuery({
    queryKey: CLAIM_QUERY_KEYS.approvalThreshold(),
    queryFn: async () => {
      const data = await fetchApprovalThresholdApi();
      if (!data) return null;
      return {
        id: data.id,
        level1Max: data.level1Max,
        level2Max: data.level2Max,
        level3Min: data.level3Min,
      } as ApprovalThreshold;
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useSubmitClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitClaimApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["all-claims-approval"] });
      toast.success("Claim submitted");
    },
    onError: (err) => {
      const apiError = extractError(err);
      toast.error(apiError.message ?? "Failed to submit claim");
    },
  });
}

export function useApproveRejectClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApproveRejectPayload) => approveRejectClaimApi(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["claim-approvals"] });
      queryClient.invalidateQueries({ queryKey: ["all-claims-approval"] });
      queryClient.invalidateQueries({ queryKey: CLAIM_QUERY_KEYS.claim(variables.claimId) });
      toast.success("Action saved");
    },
    onError: (err) => {
      const apiError = extractError(err);
      toast.error(apiError.message ?? "Failed to update claim");
    },
  });
}

export function useCreateSubclaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimTypeId,
      ...data
    }: { claimTypeId: string; label: string; key?: string; description?: string; rate?: number }) =>
      createSubclaimTypeApi(claimTypeId, data),
    onSuccess: (_, { claimTypeId }) => {
      queryClient.invalidateQueries({ queryKey: ["subclaim-types", claimTypeId] });
    },
    onError: (err) => {
      const apiError = extractError(err);
      toast.error(apiError.message ?? "Failed to create subclaim type");
    },
  });
}

export function useDeleteSubclaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimTypeId,
      subclaimTypeId,
    }: { claimTypeId: string; subclaimTypeId: string }) =>
      deleteSubclaimTypeApi(claimTypeId, subclaimTypeId),
    onSuccess: (_, { claimTypeId }) => {
      queryClient.invalidateQueries({ queryKey: ["subclaim-types", claimTypeId] });
      toast.success("Subclaim type deleted");
    },
    onError: (err) => {
      const apiError = extractError(err);
      toast.error(apiError.message ?? "Failed to delete subclaim type");
    },
  });
}

export function useCreateClaimType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClaimTypePayload) => createClaimTypeApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLAIM_QUERY_KEYS.claimTypes() });
      toast.success("Claim type created");
    },
    onError: (err) => {
      const apiError = extractError(err);
      toast.error(apiError.message ?? "Failed to create claim type");
    },
  });
}

export function useDeleteClaimType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteClaimTypeApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLAIM_QUERY_KEYS.claimTypes() });
      toast.success("Claim type deleted");
    },
    onError: (err) => {
      const apiError = extractError(err);
      toast.error(apiError.message ?? "Failed to delete claim type");
    },
  });
}
