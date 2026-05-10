export const appConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "FlowOffice",
  description:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    "FlowOffice - HR Management System",
  logoPath: process.env.NEXT_PUBLIC_APP_LOGO_PATH ?? "/images/logos/Lark.png",
  supportUrl: process.env.NEXT_PUBLIC_SUPPORT_URL ?? "",
  cookieNames: {
    auth: process.env.AUTH_COOKIE_NAME ?? "fo_auth_token",
    authCache: process.env.AUTH_CACHE_COOKIE_NAME ?? "fo_staff_auth",
  },
  defaultTheme: "system" as "light" | "dark" | "system",
  enabledAuthProviders: ["email", "lark"] as const,
  locationNamePrefix: process.env.NEXT_PUBLIC_LOCATION_NAME_PREFIX ?? "",
} as const
