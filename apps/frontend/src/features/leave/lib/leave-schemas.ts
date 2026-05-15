import { z } from "zod"

export const leaveRequestFormSchema = z
  .object({
    leaveTypeId: z.string().min(1, "Please select a leave type"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    dayType: z.enum(["full", "am", "pm"], {
      required_error: "Please select a day type",
    }),
    reason: z.string().min(5, "Please provide a reason (minimum 5 characters)"),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.endDate) return true
      return new Date(data.endDate) >= new Date(data.startDate)
    },
    { message: "End date must be on or after start date", path: ["endDate"] }
  )
  .refine(
    (data) => {
      if (data.dayType === "am" || data.dayType === "pm") {
        return data.startDate === data.endDate
      }
      return true
    },
    {
      message: "Half-day leave must be a single day (start and end date must match)",
      path: ["endDate"],
    }
  )

export type LeaveRequestFormValues = z.infer<typeof leaveRequestFormSchema>

export const leaveTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, or underscores"),
  description: z.string().optional(),
  annualQuota: z.number().min(0).nullable(),
  requiresAttachment: z.boolean(),
  approvalChain: z
    .array(
      z.object({
        level: z.number().min(1),
        role: z.enum(["hod", "hr_admin", "top_management"]),
      })
    )
    .min(1, "At least one approver level is required"),
  durationThreshold: z.number().min(1).nullable(),
  durationThresholdRole: z.enum(["hod", "hr_admin", "top_management"]).nullable(),
})

export type LeaveTypeFormValues = z.infer<typeof leaveTypeFormSchema>

export const oilGrantFormSchema = z.object({
  userId: z.number({ required_error: "Select a user" }),
  days: z
    .number()
    .min(0.5, "Must grant at least 0.5 days")
    .max(365, "Cannot exceed 365 days"),
  reason: z.string().min(1, "Reason is required"),
})

export type OilGrantFormValues = z.infer<typeof oilGrantFormSchema>

export const approveRejectLeaveSchema = z.object({
  leaveRequestId: z.number(),
  action: z.enum(["approved", "rejected"]),
  reason: z.string().optional(),
})

export type ApproveRejectLeaveValues = z.infer<typeof approveRejectLeaveSchema>
