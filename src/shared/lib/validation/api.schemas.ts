import { z } from 'zod'

/**
 * API Response Validation Schemas
 * 
 * Zod schemas for runtime validation of API responses.
 * Ensures type safety and catches API contract violations.
 */

/**
 * User Schema
 * 
 * Validates user data returned from Laravel backend
 */
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()).optional(),
  lark_open_id: z.string().nullable().optional(),
  lark_union_id: z.string().nullable().optional(),
  email_verified_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),
  // Allow additional fields for flexibility
}).passthrough()

/**
 * TypeScript type inferred from user schema
 */
export type User = z.infer<typeof userSchema>

/**
 * Auth Response Schema
 * 
 * Validates authentication response (login/callback)
 */
export const authResponseSchema = z.object({
  user: userSchema,
  message: z.string().optional(),
  // Allow additional fields
}).passthrough()

/**
 * TypeScript type inferred from auth response schema
 */
export type AuthResponse = z.infer<typeof authResponseSchema>

/**
 * API Error Schema
 * 
 * Validates error responses from the API
 */
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  status: z.number().optional(),
  errors: z.record(z.array(z.string())).optional(),
  details: z.any().optional(),
  // Allow additional fields
}).passthrough()

/**
 * TypeScript type inferred from error schema
 */
export type ApiError = z.infer<typeof apiErrorSchema>

/**
 * Paginated Response Schema
 * 
 * Generic schema for paginated API responses
 */
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    meta: z.object({
      current_page: z.number(),
      from: z.number().nullable(),
      last_page: z.number(),
      per_page: z.number(),
      to: z.number().nullable(),
      total: z.number(),
    }).optional(),
    links: z.object({
      first: z.string().nullable(),
      last: z.string().nullable(),
      prev: z.string().nullable(),
      next: z.string().nullable(),
    }).optional(),
  })

/**
 * Generic API Response Wrapper
 * 
 * Wraps any data type in a standard API response format
 */
export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    message: z.string().optional(),
  })

/**
 * Type helper for paginated responses
 */
export type PaginatedResponse<T> = {
  data: T[]
  meta?: {
    current_page: number
    from: number | null
    last_page: number
    per_page: number
    to: number | null
    total: number
  }
  links?: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
}

/**
 * Type helper for generic API responses
 */
export type ApiResponse<T> = {
  data: T
  message?: string
}

