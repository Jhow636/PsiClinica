import { api } from './api';
import type { AppointmentStatus } from './appointments';

export type PaymentStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export interface Payment {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: string;
  status: PaymentStatus;
  method?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  patient: { id: string; name: string; email?: string };
  appointment: { startTime: string; endTime: string; status: AppointmentStatus };
}

export interface PaymentsPage {
  data: Payment[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface FinancialSummary {
  totalPaid: number;
  totalPending: number;
  countPaid: number;
  countPending: number;
  countCancelled: number;
}

export interface ListPaymentsParams {
  patientId?: string;
  status?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface CreatePaymentPayload {
  appointmentId: string;
  amount: string;
  method?: string;
  status?: PaymentStatus;
}

export interface UpdateStatusPayload {
  status: PaymentStatus;
  method?: string;
  paidAt?: string;
}

export const financesApi = {
  summary: (token: string) =>
    api.get<FinancialSummary>('/finances/summary', token),

  list: (params: ListPaymentsParams, token: string) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    return api.get<PaymentsPage>(`/finances?${qs}`, token);
  },

  get: (id: string, token: string) =>
    api.get<Payment>(`/finances/${id}`, token),

  create: (data: CreatePaymentPayload, token: string) =>
    api.post<Payment>('/finances', data, token),

  updateStatus: (id: string, data: UpdateStatusPayload, token: string) =>
    api.patch<Payment>(`/finances/${id}/status`, data, token),

  remove: (id: string, token: string) =>
    api.delete<void>(`/finances/${id}`, token),
};
