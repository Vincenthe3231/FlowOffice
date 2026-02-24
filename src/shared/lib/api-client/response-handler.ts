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
    return {
      message:
        (data?.message as string) ??
        (data?.error as string) ??
        error.message ??
        'Request failed',
      status: error.response?.status ?? 0,
      error: (data?.error as string) ?? null,
      errors: (data?.errors as Record<string, string[]>) ?? null,
      data: data ?? null,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: 0,
      error: null,
      errors: null,
      data: null,
    }
  }

  return {
    message: 'An unknown error occurred',
    status: 0,
    error: null,
    errors: null,
    data: null,
  }
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
