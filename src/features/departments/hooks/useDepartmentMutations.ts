import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  DEPARTMENTS_LIST_QUERY_KEY,
  createDepartment,
  updateDepartment,
  type CreateDepartmentInput,
  type UpdateDepartmentInput,
} from '@/shared/lib/api-client/departments'
import { extractError } from '@/shared/lib/api-client/response-handler'

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDepartmentInput) => createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_QUERY_KEY })
      toast.success('Department created')
    },
    onError: (err: unknown) => {
      toast.error(extractError(err).message)
    },
  })
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDepartmentInput }) =>
      updateDepartment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DEPARTMENTS_LIST_QUERY_KEY })
    },
    onError: (err: unknown) => {
      toast.error(extractError(err).message)
    },
  })
}
