import { api } from './api';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  userId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  isRecurring: boolean;
  recurrenceRule?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient: { id: string; name: string; email?: string; phone?: string };
}

export interface AppointmentsPage {
  data: Appointment[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListAppointmentsParams {
  dateFrom?: string;
  dateTo?: string;
  patientId?: string;
  status?: AppointmentStatus;
  page?: number;
  limit?: number;
}

export interface AppointmentPayload {
  patientId: string;
  startTime: string;
  endTime: string;
  notes?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export const appointmentsApi = {
  list: (params: ListAppointmentsParams, token: string) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    return api.get<AppointmentsPage>(`/appointments?${qs}`, token);
  },
  get: (id: string, token: string) => api.get<Appointment>(`/appointments/${id}`, token),
  create: (data: AppointmentPayload, token: string) =>
    api.post<Appointment>('/appointments', data, token),
  update: (id: string, data: Partial<AppointmentPayload>, token: string) =>
    api.put<Appointment>(`/appointments/${id}`, data, token),
  updateStatus: (id: string, status: AppointmentStatus, token: string) =>
    api.patch<Appointment>(`/appointments/${id}/status`, { status }, token),
  remove: (id: string, token: string) => api.delete<void>(`/appointments/${id}`, token),
};
