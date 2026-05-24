/**
 * Centralized white-label app config. All buyer-configurable values flow from env vars.
 */

export type AuthProvider = 'email' | 'lark' | 'google' | 'microsoft'

const ALL_AUTH_PROVIDERS: readonly AuthProvider[] = [
  'email',
  'lark',
  'google',
  'microsoft',
] as const

const DEFAULT_AUTH_PROVIDERS: readonly AuthProvider[] = ['email', 'lark'] as const

function parseEnabledAuthProviders(raw: string | undefined): readonly AuthProvider[] {
  if (!raw) return DEFAULT_AUTH_PROVIDERS
  const tokens = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  const validated = tokens.filter((t): t is AuthProvider =>
    (ALL_AUTH_PROVIDERS as readonly string[]).includes(t),
  )
  return validated.length > 0 ? validated : DEFAULT_AUTH_PROVIDERS
}

export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "FlowOffice",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    "FlowOffice - HR Management System",
  logoPath: process.env.NEXT_PUBLIC_APP_LOGO_PATH ?? "/images/logos/flowoffice-icon.svg",
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL ?? "",
  cookieNames: {
    auth: process.env.AUTH_COOKIE_NAME ?? "fo_auth_token",
    authCache: process.env.AUTH_CACHE_COOKIE_NAME ?? "fo_staff_auth",
  },
  defaultTheme: "system" as "light" | "dark" | "system",
  enabledAuthProviders: parseEnabledAuthProviders(
    process.env.NEXT_PUBLIC_ENABLED_AUTH_PROVIDERS,
  ),
  locationNamePrefix: process.env.NEXT_PUBLIC_LOCATION_NAME_PREFIX ?? "",
} as const

export function isAuthProviderEnabled(provider: AuthProvider): boolean {
  return (appConfig.enabledAuthProviders as readonly AuthProvider[]).includes(provider)
}
