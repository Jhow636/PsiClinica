import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotificationSettings,
  updateNotificationSettings,
  type NotificationSettings,
} from '@/lib/notifications';

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notification-settings'],
    queryFn: getNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NotificationSettings) => updateNotificationSettings(data),
    onSuccess: (data) => {
      qc.setQueryData(['notification-settings'], data);
    },
  });
}
