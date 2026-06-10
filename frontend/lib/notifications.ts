import { api } from './api';
import { useAuthStore } from '@/store/auth.store';

export interface NotificationSettings {
  reminder24hEnabled: boolean;
  reminder1hEnabled: boolean;
  reminderEmailText: string | null;
}

function token() {
  return useAuthStore.getState().accessToken ?? undefined;
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  return api.get<NotificationSettings>('/notifications/settings', token());
}

export async function updateNotificationSettings(
  data: NotificationSettings,
): Promise<NotificationSettings> {
  return api.put<NotificationSettings>('/notifications/settings', data, token());
}
