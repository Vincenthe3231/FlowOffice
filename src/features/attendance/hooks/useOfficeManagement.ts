import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Office,
  OfficeFormData,
  createOffice,
  fetchAllOffices,
  toggleOfficeActive as toggleOfficeActiveApi,
  updateOffice as updateOfficeApi,
} from "@/shared/lib/api-client/offices";

export type { Office, OfficeFormData };

export function useOfficeManagement() {
  const queryClient = useQueryClient();

  const { data: offices = [], isLoading } = useQuery({
    queryKey: ["admin-offices-all"],
    queryFn: async () => fetchAllOffices(),
  });

  const addOffice = useMutation({
    mutationFn: async (form: OfficeFormData) => createOffice(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offices-all"] });
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      toast.success("Office added successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateOffice = useMutation({
    mutationFn: async ({ id, ...form }: OfficeFormData & { id: string }) =>
      updateOfficeApi(id, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offices-all"] });
      queryClient.invalidateQueries({ queryKey: ["offices"] });
      toast.success("Office updated successfully");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleOfficeActiveApi(id, is_active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-offices-all"] });
      queryClient.invalidateQueries({ queryKey: ["offices"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return { offices, isLoading, addOffice, updateOffice, toggleActive };
}
