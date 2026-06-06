'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAppointments } from '@/hooks/use-appointments';
import type { NotePayload } from '@/lib/records';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  patientId: string;
  usedAppointmentIds: Set<string>;
  onSubmit: (data: NotePayload) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NewNoteForm({ patientId, usedAppointmentIds, onSubmit, onCancel, isLoading }: Props) {
  const { data } = useAppointments({ patientId, status: 'COMPLETED', limit: 100 });
  const available = (data?.data ?? []).filter((a) => !usedAppointmentIds.has(a.id));

  const [appointmentId, setAppointmentId] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appointmentId) { setError('Selecione uma sessão'); return; }
    if (!content.trim()) { setError('Escreva o conteúdo da nota'); return; }
    setError('');
    const tags = tagInput.split(',').map((t) => t.trim()).filter(Boolean);
    await onSubmit({ appointmentId, content: content.trim(), tags });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-5 space-y-4">
      <h3 className="text-sm font-semibold">Nova evolução</h3>

      <div className="space-y-1.5">
        <Label htmlFor="appointmentId">Sessão *</Label>
        <select
          id="appointmentId"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={appointmentId}
          onChange={(e) => setAppointmentId(e.target.value)}
        >
          <option value="">Selecione uma sessão realizada...</option>
          {available.map((a) => (
            <option key={a.id} value={a.id}>
              {format(new Date(a.startTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </option>
          ))}
        </select>
        {available.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma sessão realizada disponível para este paciente.
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="content">Evolução clínica *</Label>
        <textarea
          id="content"
          rows={6}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          placeholder="Registre as observações desta sessão..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags</Label>
        <input
          id="tags"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="ansiedade, vínculo, resistência..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Salvar evolução
        </Button>
      </div>
    </form>
  );
}
