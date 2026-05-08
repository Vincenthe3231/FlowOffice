/**
 * Strip secrets from Laravel auth JSON before sending to the browser.
 * Token stays httpOnly-only; other fields (accessStatus, onboarding, etc.) pass through.
 */

export type LaravelAuthEnvelope = {
  message?: string
  data?: Record<string, unknown> & { user?: unknown; token?: string }
  token?: string
  user?: unknown
}

export function clientAuthPayloadFromLaravel(
  envelope: LaravelAuthEnvelope,
): { data: Record<string, unknown> } {
  const inner = envelope.data
  if (inner && typeof inner === 'object') {
    const rest = { ...(inner as Record<string, unknown>) }
    delete rest.token
    return {
      data: {
        ...rest,
        user: rest.user ?? envelope.user,
      },
    }
  }
  return {
    data: {
      user: envelope.user,
    },
  }
}
