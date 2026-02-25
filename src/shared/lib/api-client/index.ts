// API client exports

// Axios instances – use directly for custom requests
export { laravelApi, laravelRootApi } from './axios'

// API functions (auth via Next.js; cookie-based)
export {
  loginWithEmail,
  loginWithLark,
  getCurrentUser,
  logoutUser,
} from './laravel-client'

// Response helpers
export {
  extractData,
  extractError,
  validateAndExtract,
  parseAuthSuccess,
  parseUserResponse,
} from './response-handler'
export type { ApiError, AuthSuccess } from './response-handler'

// Route constants
export { API_ROUTES } from './constants'

// Transform utilities
export { keysToCamel, keysToSnake, toCamelCase, toSnakeCase } from './transform'
