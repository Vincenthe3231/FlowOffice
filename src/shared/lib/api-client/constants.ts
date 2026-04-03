/**
 * Centralised API route constants
 *
 * Auth routes target Next.js API (same-origin); proxy path prefix for Laravel via Next.js.
 */

export const API_ROUTES = {
  // Authentication (Next.js Route Handlers; cookie-based, no client token)
  AUTH: {
    LOGIN: '/api/auth/login',
    ME: '/api/auth/me',
    LARK_CALLBACK: '/api/auth/lark/callback',
    LOGOUT: '/api/auth/logout',
  },
  /** Prefix for proxied Laravel API (e.g. /api/proxy/attendance/clock-in → Laravel /api/attendance/clock-in) */
  PROXY_PREFIX: '/api/proxy',

  /** Claims (relative to PROXY_PREFIX) */
  CLAIMS: {
    LIST: 'claims',
    CREATE: 'claims',
    DETAIL: (id: number) => `claims/${id}`,
    UPDATE: (id: number) => `claims/${id}`,
    SUBMIT: (id: number) => `claims/${id}/submit`,
    DELETE: (id: number) => `claims/${id}`,
    ATTACHMENTS: (id: number) => `claims/${id}/attachments`,
    ATTACHMENT: (id: number, attachmentId: number) => `claims/${id}/attachments/${attachmentId}`,
    APPROVE: (id: number) => `claims/${id}/approve`,
    REJECT: (id: number) => `claims/${id}/reject`,
    MARK_PAID: (id: number) => `claims/${id}/mark-paid`,
    STATS: 'claims/stats',
    MONTHLY: 'claims/monthly-spend',
    MILEAGE_RATE: 'claims/mileage-rate',
    CALCULATE_DISTANCE: 'claims/calculate-distance',
    TYPES: 'claim-types',
    TYPE_DETAIL: (id: string | number) => `claim-types/${id}`,
    TYPE_SUBCLAIMS: (id: string | number) => `claim-types/${id}/subclaim-types`,
    TYPE_SUBCLAIM_DETAIL: (claimTypeId: string | number, subclaimTypeId: string | number) =>
      `claim-types/${claimTypeId}/subclaim-types/${subclaimTypeId}`,
    CLAIM_APPROVALS: (id: number) => `claims/${id}/approvals`,
    APPROVAL_THRESHOLD: 'claims/approval-threshold',
    APPROVAL_ACTION: (approvalId: number) => `claim-approvals/${approvalId}`,
  },
  CLAIM_CATEGORIES: 'claim-categories',

  /** Geocode (Google Maps via backend; relative to PROXY_PREFIX) */
  GEOCODE: 'geocode',
  REVERSE_GEOCODE: 'reverse-geocode',
  MAPS_CONFIG: 'maps-config',
} as const
