import { z } from "zod";
import { ROLE_STAFF, ROLE_HOD, ROLE_HR_ADMIN } from "@/shared/constants/roles";

export const onboardingRoleSchema = z.enum([ROLE_STAFF, ROLE_HOD, ROLE_HR_ADMIN]);
export type OnboardingRole = z.infer<typeof onboardingRoleSchema>;

export const approvalRoleOptionSchema = z.object({
  value: z.string(),
  label: z.string(),
});
export type ApprovalRoleOption = z.infer<typeof approvalRoleOptionSchema>;

export const onboardingStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export const onboardingUserStatusSchema = z.enum([
  "verifying",
  "active",
  "rejected",
  "deactivated",
]);

export const onboardingUserSchema = z.object({
  id: z.coerce.string(),
  name: z.string(),
  email: z.string().email(),
  status: onboardingUserStatusSchema,
});

export const onboardingSchema = z
  .object({
    id: z.coerce.number(),
    userId: z.number().nullable().optional(),
    reviewedBy: z.number().nullable().optional(),
    reviewedAt: z.string().nullable().optional(),
    status: onboardingStatusSchema,
    assignedRole: onboardingRoleSchema.nullable().optional(),
    departmentId: z.number().nullable().optional(),
    rejectionReason: z.string().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    user: onboardingUserSchema.nullable().optional(),
  })
  .passthrough();

export type OnboardingRecord = z.infer<typeof onboardingSchema>;

export const approveOnboardingFormSchema = z.object({
  role: onboardingRoleSchema,
  departmentId: z.number({ message: "Department is required" }),
});

export const rejectOnboardingFormSchema = z.object({
  rejectionReason: z
    .string()
    .min(5, "Reason must be at least 5 characters")
    .max(500, "Reason must be at most 500 characters"),
});

export const colorSchemeSchema = z.enum([
  "cyan",
  "pink",
  "emerald",
  "violet",
  "amber",
  "slate",
]);

export const departmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  shortCode: z.string(),
  colorScheme: colorSchemeSchema,
  status: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Department = z.infer<typeof departmentSchema>;
