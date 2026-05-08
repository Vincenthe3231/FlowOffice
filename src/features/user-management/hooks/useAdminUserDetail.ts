import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchAdminUser,
  patchAdminUserDepartment,
  patchAdminUserRole,
  type AdminUserDirectoryRole,
} from '@/shared/lib/api-client/admin-users'
import { ADMIN_USERS_QUERY_KEY } from '@/features/user-management/hooks/useAdminUsers'
import { extractError } from '@/shared/lib/api-client/response-handler'

export function adminUserDetailQueryKey(userUuid: string) {
  return [ADMIN_USERS_QUERY_KEY, 'detail', userUuid] as const
}

export function useAdminUserDetail(userUuid: string | undefined) {
  return useQuery({
    queryKey: adminUserDetailQueryKey(userUuid ?? ''),
    queryFn: () => fetchAdminUser(userUuid!),
    enabled: Boolean(userUuid && userUuid.length > 0),
    staleTime: 30_000,
  })
}

export function usePatchAdminUserDepartment(userUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (departmentId: number | null) =>
      patchAdminUserDepartment(userUuid, departmentId),
    onSuccess: (data) => {
      queryClient.setQueryData(adminUserDetailQueryKey(userUuid), data)
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] })
      toast.success('Department updated')
    },
    onError: (err: unknown) => {
      toast.error(extractError(err).message)
    },
  })
}

function rolePatchErrorMessage(err: unknown): string {
  const api = extractError(err)
  const fromRole = api.errors?.role?.[0] ?? api.fields?.role?.[0]
  return fromRole ?? api.message
}

export function usePatchAdminUserRole(userUuid: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (role: AdminUserDirectoryRole) =>
      patchAdminUserRole(userUuid, role),
    onSuccess: (data) => {
      queryClient.setQueryData(adminUserDetailQueryKey(userUuid), data)
      queryClient.invalidateQueries({ queryKey: [ADMIN_USERS_QUERY_KEY] })
      toast.success('Role updated')
    },
    onError: (err: unknown) => {
      toast.error(rolePatchErrorMessage(err))
    },
  })
}
