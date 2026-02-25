/**
 * Response Handler Utilities
 *
 * Structured data extraction, error handling, and optional Zod validation
 * for Axios responses.
 *
 * Adapted from RenoXpert staff-portal.
 */

import type { AxiosResponse } from 'axios'
import axios from 'axios'
import type { ZodType } from 'zod'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiError {
  message: string
  status: number
  error: string | null
  errors: Record<string, string[]> | null
  /** Validation field errors (backend may send `fields` instead of `errors`) */
  fields: Record<string, string[]> | null
  /** Seconds after which to retry (429 rate limit) */
  retryAfter: number | null
  /** Seconds until account unlock (423 locked) */
  remainingSeconds: number | null
  data: unknown
}

// ---------------------------------------------------------------------------
// extractData
// ---------------------------------------------------------------------------

/**
 * Extract data from a successful Axios response.
 *
 * Handles common Laravel envelope patterns:
 *  - `{ data: T }`
 *  - `T` (unwrapped)
 */
export function extractData<T>(response: AxiosResponse): T {
  const body = response.data

  // Laravel often wraps in `data`
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T
  }

  return body as T
}

// ---------------------------------------------------------------------------
// extractError
// ---------------------------------------------------------------------------

/**
 * Normalise any thrown value (AxiosError, Error, unknown) into a
 * consistent `ApiError` shape.
 */
export function extractError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined
    const errors = (data?.errors as Record<string, string[]> | undefined) ?? null
    const fields = (data?.fields as Record<string, string[]> | undefined) ?? errors
    return {
      message:
        (data?.message as string) ??
        (data?.error as string) ??
        error.message ??
        'Request failed',
      status: error.response?.status ?? 0,
      error: (data?.error as string) ?? null,
      errors,
      fields,
      retryAfter: (data?.retryAfter as number) ?? (data?.retry_after as number) ?? null,
      remainingSeconds:
        (data?.remainingSeconds as number) ?? (data?.remaining_seconds as number) ?? null,
      data: data ?? null,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 0,
      error: null,
      errors: null,
      fields: null,
      retryAfter: null,
      remainingSeconds: null,
      data: null,
    }
  }

  return {
    message: 'An unknown error occurred',
    status: 0,
    error: null,
    errors: null,
    fields: null,
    retryAfter: null,
    remainingSeconds: null,
    data: null,
  }
}

// ---------------------------------------------------------------------------
// Auth response helpers (backend contract: { data: { user, token? } })
// ---------------------------------------------------------------------------

export interface AuthSuccess {
  user: unknown
  token: string | null
}

/**
 * Normalise login/callback success body to { user, token }.
 * Backend returns { message?, data: { user, token } }.
 */
export function parseAuthSuccess(body: unknown): AuthSuccess {
  if (body && typeof body === 'object' && 'data' in body) {
    const data = (body as { data?: { user?: unknown; token?: string } }).data
    return {
      user: data?.user ?? null,
      token: data?.token ?? null,
    }
  }
  return { user: null, token: null }
}

/**
 * Normalise GET /user success body to user.
 * Backend returns { message?, data: { user } }.
 */
export function parseUserResponse(body: unknown): unknown {
  if (body && typeof body === 'object' && 'data' in body) {
    const data = (body as { data?: { user?: unknown } }).data
    return data?.user ?? null
  }
  return (body as { user?: unknown })?.user ?? body
}

// ---------------------------------------------------------------------------
// validateAndExtract
// ---------------------------------------------------------------------------

/**
 * Extract data from response and validate it with a Zod schema.
 */
export function validateAndExtract<T>(
  response: AxiosResponse,
  schema: ZodType<T>,
): T {
  const data = extractData<unknown>(response)
  return schema.parse(data)
}
