import { z } from 'zod'

/**
 * Login Form Schema
 * 
 * Validates email/password login form
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

/**
 * TypeScript type inferred from schema
 */
export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Lark OAuth Schema (for future use)
 */
export const larkOAuthSchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
})

export type LarkOAuthData = z.infer<typeof larkOAuthSchema>
