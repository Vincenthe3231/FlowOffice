import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { fetchMyRoles, Role } from "@/shared/lib/api-client/roles";

export function useRoles() {
  const { user } = useAuth();

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => fetchMyRoles(),
    enabled: !!user?.id,
  });

  return {
    roles,
    isLoading,
    isAdmin: roles.includes("hr_admin" as Role),
    isManager: roles.includes("manager"),
    isEmployee: roles.includes("employee"),
    isAdminOrManager: roles.includes("hr_admin") || roles.includes("manager"),
  };
}
