import { z } from "zod";
import { laravelApi } from "./axios";
import { API_ROUTES } from "./constants";
import { extractData } from "./response-handler";
import {
  approvalRoleOptionSchema,
  onboardingSchema,
} from "@/features/onboarding/schemas/onboarding.schemas";
import type { OnboardingRole } from "@/features/onboarding/schemas/onboarding.schemas";

const PROXY = API_ROUTES.PROXY_PREFIX;

const onboardingListSchema = z.array(onboardingSchema);
const approvalRoleListSchema = z.array(approvalRoleOptionSchema);

export { fetchDepartments } from "@/shared/lib/api-client/departments";

function normalizeListPayload(raw: unknown): unknown {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && "data" in raw) {
    const inner = (raw as { data: unknown }).data;
    if (Array.isArray(inner)) return inner;
  }
  return [];
}

export async function fetchOnboardings(): Promise<
  z.infer<typeof onboardingListSchema>
> {
  const res = await laravelApi.get(`${PROXY}/onboarding`);
  const raw = extractData<unknown>(res);
  const list = normalizeListPayload(raw);
  return onboardingListSchema.parse(list);
}

export async function fetchApprovalRoles(): Promise<
  z.infer<typeof approvalRoleListSchema>
> {
  const res = await laravelApi.get(`${PROXY}/onboarding/approval-roles`);
  const raw = extractData<unknown>(res);
  const list = normalizeListPayload(raw);
  return approvalRoleListSchema.parse(list);
}

export async function approveOnboarding(
  id: number,
  payload: { role: OnboardingRole; departmentId: number }
): Promise<void> {
  await laravelApi.post(`${PROXY}/onboarding/${id}/approval`, {
    role: payload.role,
    departmentId: payload.departmentId,
  });
}

export async function rejectOnboarding(
  id: number,
  payload: { rejectionReason: string }
): Promise<void> {
  await laravelApi.post(`${PROXY}/onboarding/${id}/rejection`, {
    rejectionReason: payload.rejectionReason,
  });
}
