/**
 * Transform utility tests — snake_case ↔ camelCase contract verification.
 *
 * Run with: npx vitest run src/shared/lib/api-client/__tests__/transform.test.ts
 * (Requires vitest to be installed: pnpm add -D vitest)
 *
 * These tests document the exact behavior of the transform layer that ALL API
 * interactions depend on. Do not modify transform.ts without verifying these pass.
 */

import { describe, it, expect } from 'vitest'
import { toCamelCase, toSnakeCase, keysToCamel, keysToSnake } from '../transform'

// ─── Single key transforms ──────────────────────────────────────────────────

describe('toCamelCase', () => {
  it('converts simple snake_case', () => {
    expect(toCamelCase('first_name')).toBe('firstName')
  })

  it('converts multi-segment snake_case', () => {
    expect(toCamelCase('created_at_utc')).toBe('createdAtUtc')
  })

  it('handles numeric segments', () => {
    expect(toCamelCase('step_1_status')).toBe('step1Status')
  })

  it('leaves already-camelCase unchanged', () => {
    expect(toCamelCase('firstName')).toBe('firstName')
  })

  it('leaves single word unchanged', () => {
    expect(toCamelCase('name')).toBe('name')
  })
})

describe('toSnakeCase', () => {
  it('converts simple camelCase', () => {
    expect(toSnakeCase('firstName')).toBe('first_name')
  })

  it('converts multi-segment camelCase', () => {
    expect(toSnakeCase('createdAtUtc')).toBe('created_at_utc')
  })

  it('separates letters from numbers', () => {
    expect(toSnakeCase('step1')).toBe('step_1')
  })

  it('leaves already-snake_case unchanged', () => {
    expect(toSnakeCase('first_name')).toBe('first_name')
  })

  it('leaves single word unchanged', () => {
    expect(toSnakeCase('name')).toBe('name')
  })

  /**
   * ⚠️ Known edge case: consecutive uppercase letters are split individually.
   * "apiURL" becomes "api_u_r_l", NOT "api_url".
   * Avoid consecutive uppercase in API field names.
   */
  it('splits consecutive uppercase individually (known edge case)', () => {
    expect(toSnakeCase('apiURL')).toBe('api_u_r_l')
  })
})

// ─── Recursive object transforms ────────────────────────────────────────────

describe('keysToCamel', () => {
  it('converts flat object keys', () => {
    expect(keysToCamel({ first_name: 'John', last_name: 'Doe' })).toEqual({
      firstName: 'John',
      lastName: 'Doe',
    })
  })

  it('converts nested objects recursively', () => {
    expect(
      keysToCamel({
        user_profile: {
          first_name: 'John',
          home_address: { zip_code: '12345' },
        },
      }),
    ).toEqual({
      userProfile: {
        firstName: 'John',
        homeAddress: { zipCode: '12345' },
      },
    })
  })

  it('converts arrays of objects', () => {
    expect(
      keysToCamel([{ leave_type: 'annual' }, { leave_type: 'sick' }]),
    ).toEqual([{ leaveType: 'annual' }, { leaveType: 'sick' }])
  })

  it('handles null and undefined', () => {
    expect(keysToCamel(null)).toBeNull()
    expect(keysToCamel(undefined)).toBeUndefined()
  })

  it('passes through primitives', () => {
    expect(keysToCamel('hello')).toBe('hello')
    expect(keysToCamel(42)).toBe(42)
    expect(keysToCamel(true)).toBe(true)
  })

  it('passes through non-plain objects (Date, etc.)', () => {
    const date = new Date('2026-01-01')
    expect(keysToCamel(date)).toBe(date)
  })
})

describe('keysToSnake', () => {
  it('converts flat object keys', () => {
    expect(keysToSnake({ firstName: 'John', lastName: 'Doe' })).toEqual({
      first_name: 'John',
      last_name: 'Doe',
    })
  })

  it('converts nested objects recursively', () => {
    expect(
      keysToSnake({
        userProfile: {
          firstName: 'John',
          homeAddress: { zipCode: '12345' },
        },
      }),
    ).toEqual({
      user_profile: {
        first_name: 'John',
        home_address: { zip_code: '12345' },
      },
    })
  })

  it('converts arrays of objects', () => {
    expect(
      keysToSnake([{ leaveType: 'annual' }, { leaveType: 'sick' }]),
    ).toEqual([{ leave_type: 'annual' }, { leave_type: 'sick' }])
  })

  it('handles null and undefined', () => {
    expect(keysToSnake(null)).toBeNull()
    expect(keysToSnake(undefined)).toBeUndefined()
  })
})

// ─── Round-trip fidelity ─────────────────────────────────────────────────────

describe('round-trip', () => {
  it('snake → camel → snake preserves keys (standard naming)', () => {
    const original = {
      annual_quota: 14,
      leave_type_id: 3,
      eligible_approvers: [{ user_id: 1, full_name: 'Admin' }],
    }
    expect(keysToSnake(keysToCamel(original))).toEqual(original)
  })

  it('camel → snake → camel preserves keys (standard naming)', () => {
    const original = {
      annualQuota: 14,
      leaveTypeId: 3,
      eligibleApprovers: [{ userId: 1, fullName: 'Admin' }],
    }
    expect(keysToCamel(keysToSnake(original))).toEqual(original)
  })
})
