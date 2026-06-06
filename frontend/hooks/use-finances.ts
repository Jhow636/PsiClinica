import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import {
  financesApi,
  ListPaymentsParams,
  CreatePaymentPayload,
  UpdateStatusPayload,
} from '@/lib/finances';

const KEYS = {
  all: ['finances'] as const,
  summary: ['finances', 'summary'] as const,
  list: (p: ListPaymentsParams) => ['finances', 'list', p] as const,
  detail: (id: string) => ['finances', id] as const,
};

export function useFinancialSummary() {
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useQuery({
    queryKey: KEYS.summary,
    queryFn: () => financesApi.summary(token),
    enabled: !!token,
  });
}

export function usePayments(params: ListPaymentsParams = {}) {
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => financesApi.list(params, token),
    enabled: !!token,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (data: CreatePaymentPayload) => financesApi.create(data, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useUpdatePaymentStatus() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatusPayload }) =>
      financesApi.updateStatus(id, data, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}

export function useDeletePayment() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (id: string) => financesApi.remove(id, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  });
}
