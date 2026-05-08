import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

export type Role = 'employee' | 'manager' | 'hr_admin'

const PROXY = API_ROUTES.PROXY_PREFIX

export async function fetchMyRoles(): Promise<Role[]> {
  const response = await laravelApi.get(`${PROXY}/auth/my-roles`)
  return extractData<Role[]>(response)
}

