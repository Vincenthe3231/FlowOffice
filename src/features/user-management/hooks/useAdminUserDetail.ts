import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchAdminUser,
  patchAdminUserDepartment,
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
