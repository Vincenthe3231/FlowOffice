import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveOnboarding,
  fetchApprovalRoles,
  fetchDepartments,
  fetchOnboardings,
  rejectOnboarding,
} from "@/shared/lib/api-client/onboarding";
import { extractError } from "@/shared/lib/api-client/response-handler";
import type { OnboardingRole } from "@/features/onboarding/schemas/onboarding.schemas";

export const ONBOARDING_QUERY_KEYS = {
  list: ["onboarding", "list"] as const,
  departments: ["departments", "list"] as const,
  approvalRoles: ["onboarding", "approval-roles"] as const,
};

export function useOnboardings() {
  return useQuery({
    queryKey: ONBOARDING_QUERY_KEYS.list,
    queryFn: fetchOnboardings,
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ONBOARDING_QUERY_KEYS.departments,
    queryFn: fetchDepartments,
  });
}

export function useApprovalRoles() {
  return useQuery({
    queryKey: ONBOARDING_QUERY_KEYS.approvalRoles,
    queryFn: fetchApprovalRoles,
    staleTime: Infinity,
  });
}

export function useApproveOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      role,
      departmentId,
    }: {
      id: number;
      role: OnboardingRole;
      departmentId: number;
    }) => approveOnboarding(id, { role, departmentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.list });
      toast.success("User approved");
    },
    onError: (err: unknown) => {
      toast.error(extractError(err).message);
    },
  });
}

export function useRejectOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      rejectionReason,
    }: {
      id: number;
      rejectionReason: string;
    }) => rejectOnboarding(id, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONBOARDING_QUERY_KEYS.list });
      toast.success("Request rejected");
    },
    onError: (err: unknown) => {
      toast.error(extractError(err).message);
    },
  });
}
