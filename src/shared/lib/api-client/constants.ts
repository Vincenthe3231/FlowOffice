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
    /** Org-wide list; Laravel `ClaimApprovalController::all` — `hod` | `hr_admin` | `top_management` only */
    ALL: 'claims/all',
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

  /** In-app notifications (Laravel `in_app_notifications`; relative to PROXY_PREFIX) */
  NOTIFICATIONS: {
    LIST: 'notifications',
    READ_ALL: 'notifications/read-all',
    READ: (id: number) => `notifications/${id}/read`,
  },

  /** Leave (relative to PROXY_PREFIX) */
  LEAVE: {
    LIST: 'leave',
    ALL: 'leave/all',
    PENDING_APPROVALS: 'leave/pending-approvals',
    BALANCE_ME: 'leave/balance',
    OIL_GRANT: 'leave/oil-grant',
    DETAIL: (id: number) => `leave/${id}`,
    CANCEL: (id: number) => `leave/${id}/cancel`,
    APPROVE: (id: number) => `leave/${id}/approve`,
    REJECT: (id: number) => `leave/${id}/reject`,
    APPROVALS: (id: number) => `leave/${id}/approvals`,
    ATTACHMENTS: (id: number) => `leave/${id}/attachments`,
    ATTACHMENT: (id: number, attachId: number) => `leave/${id}/attachments/${attachId}`,
    BALANCE_USER: (userId: number) => `leave/balance/${userId}`,
  },

  /** Leave Types (relative to PROXY_PREFIX) */
  LEAVE_TYPES: {
    LIST: 'leave-types',
    DETAIL: (id: string | number) => `leave-types/${id}`,
  },

  /** Geocode (Google Maps via backend; relative to PROXY_PREFIX) */
  GEOCODE: 'geocode',
  REVERSE_GEOCODE: 'reverse-geocode',
  MAPS_CONFIG: 'maps-config',
} as const
