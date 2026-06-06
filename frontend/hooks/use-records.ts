import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { recordsApi, NotePayload, UpdateNotePayload } from '@/lib/records';

const key = (patientId: string) => ['records', patientId];

export function useRecord(patientId: string) {
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useQuery({
    queryKey: key(patientId),
    queryFn: () => recordsApi.get(patientId, token),
    enabled: !!token && !!patientId,
  });
}

export function useUpdateAnamnesis(patientId: string) {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (anamnesis: string) => recordsApi.updateAnamnesis(patientId, anamnesis, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(patientId) }),
  });
}

export function useCreateNote(patientId: string) {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (data: NotePayload) => recordsApi.createNote(patientId, data, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(patientId) }),
  });
}

export function useUpdateNote(patientId: string) {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: ({ noteId, data }: { noteId: string; data: UpdateNotePayload }) =>
      recordsApi.updateNote(patientId, noteId, data, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(patientId) }),
  });
}

export function useDeleteNote(patientId: string) {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.accessToken) ?? '';
  return useMutation({
    mutationFn: (noteId: string) => recordsApi.deleteNote(patientId, noteId, token),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(patientId) }),
  });
}
