import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import {
  appointmentsApi,
  ListAppointmentsParams,
  AppointmentPayload,
  AppointmentStatus,
} from '@/lib/appointments';

const KEYS = {
  all: ['appointments'] as const,
  list: (p: ListAppointmentsParams) => ['appointments', 'list', p] as const,
  detail: (id: string) => ['appointments', id] as const,
};

export function useAppointments(params: ListAppointmentsParams = {}) {
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => appointmentsApi.list({ ...params, limit: params.limit ?? 200 }, token),
    enabled: !!token,
  });
}

export function useAppointment(id: string) {
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => appointmentsApi.get(id, token),
    enabled: !!token && !!id,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (data: AppointmentPayload) => appointmentsApi.create(data, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdateAppointment(id: string) {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (data: Partial<AppointmentPayload>) => appointmentsApi.update(id, data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentsApi.updateStatus(id, status, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.remove(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
