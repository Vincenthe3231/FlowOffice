// API client exports

// Axios instances – use directly for custom requests
export { laravelApi, laravelRootApi } from './axios'

// Laravel API functions (high-level, uses Axios under the hood)
export {
  getCsrfCookie,
  loginWithEmail,
  loginWithLark,
  getCurrentUser,
} from './laravel-client'

// Response helpers
export { extractData, extractError, validateAndExtract } from './response-handler'
export type { ApiError } from './response-handler'

// Route constants
export { API_ROUTES } from './constants'

// Transform utilities
export { keysToCamel, keysToSnake, toCamelCase, toSnakeCase } from './transform'
