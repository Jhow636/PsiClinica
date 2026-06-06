import { api } from './api';

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  cpf?: string;
  address?: string;
  notes?: string;
  sessionPrice?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PatientDetail extends Patient {
  clinicId: string;
  updatedAt: string;
}

export interface PatientsPage {
  data: Patient[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ListPatientsParams {
  search?: string;
  orderBy?: 'name' | 'createdAt';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PatientPayload {
  name: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  cpf?: string;
  address?: string;
  notes?: string;
  sessionPrice?: string;
}

export const patientsApi = {
  list: (params: ListPatientsParams, token: string) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && qs.set(k, String(v)));
    return api.get<PatientsPage>(`/patients?${qs}`, token);
  },
  get: (id: string, token: string) => api.get<PatientDetail>(`/patients/${id}`, token),
  create: (data: PatientPayload, token: string) => api.post<PatientDetail>('/patients', data, token),
  update: (id: string, data: Partial<PatientPayload>, token: string) =>
    api.put<PatientDetail>(`/patients/${id}`, data, token),
  remove: (id: string, token: string) => api.delete<void>(`/patients/${id}`, token),
};
