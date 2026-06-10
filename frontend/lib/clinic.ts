import { api } from './api';
import { useAuthStore } from '@/store/auth.store';

export interface ClinicProfile {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  sessionPrice?: string | null;
}

function token() {
  return useAuthStore.getState().accessToken ?? undefined;
}

export const clinicApi = {
  getProfile: () => api.get<ClinicProfile>('/clinic/profile', token()),
  updateProfile: (data: Omit<ClinicProfile, 'id'>) =>
    api.put<ClinicProfile>('/clinic/profile', data, token()),
};
