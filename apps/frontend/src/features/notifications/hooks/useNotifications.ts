"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchInAppNotifications,
  markAllInAppNotificationsRead,
  markInAppNotificationRead,
  IN_APP_NOTIFICATION_QUERY_KEYS,
} from "@/shared/lib/api-client/notifications";
import { extractError } from "@/shared/lib/api-client/response-handler";
import { toast } from "sonner";

export function useInAppNotifications() {
  return useQuery({
    queryKey: IN_APP_NOTIFICATION_QUERY_KEYS.list(),
    queryFn: fetchInAppNotifications,
    refetchInterval: 30_000,
  })
}

export function useMarkInAppNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => markInAppNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: IN_APP_NOTIFICATION_QUERY_KEYS.list(),
      })
    },
    onError: (err) => {
      const e = extractError(err)
      toast.error(e.message ?? "Could not mark notification read");
    },
  })
}

export function useMarkAllInAppNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllInAppNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: IN_APP_NOTIFICATION_QUERY_KEYS.list(),
      })
      toast.success("All notifications marked read");
    },
    onError: (err) => {
      const e = extractError(err)
      toast.error(e.message ?? "Could not mark all read");
    },
  })
}

export type { InAppNotificationApi } from "@/shared/lib/api-client/notifications";
