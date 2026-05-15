import { useQuery } from '@tanstack/react-query'
import {
  type AdminUsersQuery,
  fetchAdminUsers,
} from '@/shared/lib/api-client/admin-users'

export const ADMIN_USERS_QUERY_KEY = 'admin-users' as const

export function adminUsersQueryKey(query: AdminUsersQuery) {
  return [
    ADMIN_USERS_QUERY_KEY,
    query.page ?? 1,
    query.perPage ?? 25,
    query.search ?? '',
    query.departmentId ?? '',
    query.role ?? '',
    query.status ?? '',
  ] as const
}

export function useAdminUsers(query: AdminUsersQuery) {
  return useQuery({
    queryKey: adminUsersQueryKey(query),
    queryFn: () => fetchAdminUsers(query),
    staleTime: 30_000,
  })
}
