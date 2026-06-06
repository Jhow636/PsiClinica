import { api } from './api';
import type { AppointmentStatus } from './appointments';

export interface SessionNote {
  id: string;
  appointmentId: string;
  medicalRecordId: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  appointment: {
    startTime: string;
    endTime: string;
    status: AppointmentStatus;
    patient: { name: string };
  };
}

export interface RecordFile {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  anamnesis?: string;
  createdAt: string;
  updatedAt: string;
  sessionNotes: SessionNote[];
  files: RecordFile[];
}

export interface NotePayload {
  appointmentId: string;
  content: string;
  tags?: string[];
}

export interface UpdateNotePayload {
  content?: string;
  tags?: string[];
}

export const recordsApi = {
  get: (patientId: string, token: string) =>
    api.get<MedicalRecord>(`/records/${patientId}`, token),

  updateAnamnesis: (patientId: string, anamnesis: string, token: string) =>
    api.patch<MedicalRecord>(`/records/${patientId}/anamnesis`, { anamnesis }, token),

  createNote: (patientId: string, data: NotePayload, token: string) =>
    api.post<SessionNote>(`/records/${patientId}/notes`, data, token),

  updateNote: (patientId: string, noteId: string, data: UpdateNotePayload, token: string) =>
    api.put<SessionNote>(`/records/${patientId}/notes/${noteId}`, data, token),

  deleteNote: (patientId: string, noteId: string, token: string) =>
    api.delete<void>(`/records/${patientId}/notes/${noteId}`, token),
};
