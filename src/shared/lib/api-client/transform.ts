/**
 * Case Transform Utilities
 *
 * Converts between camelCase (frontend) and snake_case (Laravel backend)
 * automatically via Axios interceptors.
 *
 * Adapted from RenoXpert staff-portal.
 */

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase())
}

export function toSnakeCase(str: string): string {
  let result = str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
  result = result.replace(/([a-z])([0-9])/g, '$1_$2')
  return result
}

export function keysToCamel<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T

  if (Array.isArray(obj)) {
    return obj.map((item) => keysToCamel(item)) as T
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const camelKey = toCamelCase(key)
        acc[camelKey] = keysToCamel((obj as Record<string, unknown>)[key])
        return acc
      },
      {} as Record<string, unknown>,
    ) as T
  }

  return obj as T
}

export function keysToSnake<T = unknown>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T

  if (Array.isArray(obj)) {
    return obj.map((item) => keysToSnake(item)) as T
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (acc, key) => {
        const snakeKey = toSnakeCase(key)
        acc[snakeKey] = keysToSnake((obj as Record<string, unknown>)[key])
        return acc
      },
      {} as Record<string, unknown>,
    ) as T
  }

  return obj as T
}
