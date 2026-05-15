export const featuresConfig = {
  attendance: process.env.NEXT_PUBLIC_FEATURE_ATTENDANCE !== "false",
  claims: process.env.NEXT_PUBLIC_FEATURE_CLAIMS !== "false",
  leave: process.env.NEXT_PUBLIC_FEATURE_LEAVE !== "false",
  onboarding: process.env.NEXT_PUBLIC_FEATURE_ONBOARDING !== "false",
  overtime: process.env.NEXT_PUBLIC_FEATURE_OVERTIME !== "false",
  reports: process.env.NEXT_PUBLIC_FEATURE_REPORTS !== "false",
  notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS !== "false",
} as const

export type FeatureKey = keyof typeof featuresConfig
