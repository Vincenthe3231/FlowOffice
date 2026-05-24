export const featuresConfig = {
  attendance: process.env.NEXT_PUBLIC_FEATURE_ATTENDANCE !== "false",
  claims: process.env.NEXT_PUBLIC_FEATURE_CLAIMS !== "false",
  leave: process.env.NEXT_PUBLIC_FEATURE_LEAVE !== "false",
  onboarding: process.env.NEXT_PUBLIC_FEATURE_ONBOARDING !== "false",
  overtime: process.env.NEXT_PUBLIC_FEATURE_OVERTIME !== "false",
  reports: process.env.NEXT_PUBLIC_FEATURE_REPORTS !== "false",
  notifications: process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS !== "false",
  shift: process.env.NEXT_PUBLIC_FEATURE_SHIFT !== "false",
} as const

export type FeatureKey = keyof typeof featuresConfig

/**
 * Maps dashboard route prefixes to feature flag keys.
 * Used by proxy middleware to gate routes when a feature is disabled.
 * Add new entries here when creating a new feature module with dashboard routes.
 */
export const FEATURE_ROUTE_MAP: Array<[string, FeatureKey]> = [
  ['/dashboard/attendance', 'attendance'],
  ['/dashboard/log', 'attendance'],
  ['/dashboard/claims', 'claims'],
  ['/dashboard/leave', 'leave'],
  ['/dashboard/onboarding', 'onboarding'],
  ['/dashboard/overtime', 'overtime'],
  ['/dashboard/reports', 'reports'],
  ['/dashboard/settings/shifts', 'shift'],
]
