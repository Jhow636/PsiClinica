import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { patientsApi, ListPatientsParams, PatientPayload } from '@/lib/patients';

const KEYS = {
  all: ['patients'] as const,
  list: (p: ListPatientsParams) => ['patients', 'list', p] as const,
  detail: (id: string) => ['patients', id] as const,
};

export function usePatients(params: ListPatientsParams = {}) {
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => patientsApi.list(params, token),
    enabled: !!token,
  });
}

export function usePatient(id: string) {
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => patientsApi.get(id, token),
    enabled: !!token && !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (data: PatientPayload) => patientsApi.create(data, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (data: Partial<PatientPayload>) => patientsApi.update(id, data, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.detail(id) });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (id: string) => patientsApi.remove(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
