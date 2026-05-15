import { laravelApi } from './axios'
import { API_ROUTES } from './constants'
import { extractData } from './response-handler'

const PROXY = API_ROUTES.PROXY_PREFIX

export const IN_APP_NOTIFICATION_QUERY_KEYS = {
  list: () => ['in-app-notifications'] as const,
} as const

export interface InAppNotificationApi {
  id: number
  claimId?: number | null
  type: string
  title: string
  message?: string | null
  read: boolean
  createdAt?: string
}

export async function fetchInAppNotifications(): Promise<InAppNotificationApi[]> {
  const response = await laravelApi.get(
    `${PROXY}/${API_ROUTES.NOTIFICATIONS.LIST}`
  )
  const data = extractData<InAppNotificationApi[]>(response)
  return Array.isArray(data) ? data : []
}

export async function markInAppNotificationRead(id: number): Promise<void> {
  await laravelApi.patch(
    `${PROXY}/${API_ROUTES.NOTIFICATIONS.READ(id)}`
  )
}

export async function markAllInAppNotificationsRead(): Promise<void> {
  await laravelApi.patch(`${PROXY}/${API_ROUTES.NOTIFICATIONS.READ_ALL}`)
}
