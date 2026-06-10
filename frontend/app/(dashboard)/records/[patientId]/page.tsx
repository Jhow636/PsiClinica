'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Plus, Loader2, FileDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/toast';
import { useRecord, useUpdateAnamnesis, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/use-records';
import { usePatient } from '@/hooks/use-patients';
import { SessionNoteCard } from '@/components/records/session-note-card';
import { NewNoteForm } from '@/components/records/new-note-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { NotePayload } from '@/lib/records';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export default function RecordPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = use(params);

  const { data: patient } = usePatient(patientId);
  const { data: record, isLoading } = useRecord(patientId);
  const toast = useToast();
  const accessToken = useAuthStore((s) => s.accessToken);

  const updateAnamnesis = useUpdateAnamnesis(patientId);
  const createNote = useCreateNote(patientId);
  const updateNote = useUpdateNote(patientId);
  const deleteNote = useDeleteNote(patientId);

  const [editingAnamnesis, setEditingAnamnesis] = useState(false);
  const [anamnesisText, setAnamnesisText] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  async function handleExportPdf() {
    setExportingPdf(true);
    try {
      const res = await fetch(`${API_URL}/api/records/${patientId}/export/pdf`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prontuario-${patient?.name ?? patientId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast('PDF exportado com sucesso!');
    } catch {
      toast('Erro ao exportar PDF.', 'error');
    } finally {
      setExportingPdf(false);
    }
  }

  function startEditAnamnesis() {
    setAnamnesisText(record?.anamnesis ?? '');
    setEditingAnamnesis(true);
  }

  async function saveAnamnesis() {
    try {
      await updateAnamnesis.mutateAsync(anamnesisText);
      setEditingAnamnesis(false);
      toast('Anamnese salva!');
    } catch {
      toast('Erro ao salvar anamnese.', 'error');
    }
  }

  async function handleCreateNote(data: NotePayload) {
    try {
      await createNote.mutateAsync(data);
      setShowNoteForm(false);
      toast('Evolução registrada!');
    } catch {
      toast('Erro ao registrar evolução.', 'error');
    }
  }

  async function handleUpdateNote(noteId: string, content: string, tags: string[]) {
    try {
      await updateNote.mutateAsync({ noteId, data: { content, tags } });
      toast('Evolução atualizada!');
    } catch {
      toast('Erro ao atualizar evolução.', 'error');
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm('Remover esta evolução?')) return;
    try {
      await deleteNote.mutateAsync(noteId);
      toast('Evolução removida.', 'info');
    } catch {
      toast('Erro ao remover evolução.', 'error');
    }
  }

  const usedAppointmentIds = new Set(record?.sessionNotes.map((n) => n.appointmentId) ?? []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/records"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Prontuários
          </Link>
        </div>
        <Link
          href={`/patients/${patientId}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Ver paciente →
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary shrink-0">
            {patient?.name.charAt(0).toUpperCase() ?? '?'}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{patient?.name ?? 'Paciente'}</h1>
            <p className="text-sm text-muted-foreground">Prontuário eletrônico</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportPdf} disabled={exportingPdf}>
          {exportingPdf ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileDown className="mr-1.5 h-3.5 w-3.5" />
          )}
          Exportar PDF
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Evoluções */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Evoluções clínicas{' '}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ({record?.sessionNotes.length ?? 0})
              </span>
            </h2>
            {!showNoteForm && (
              <Button size="sm" onClick={() => setShowNoteForm(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nova evolução
              </Button>
            )}
          </div>

          {showNoteForm && (
            <NewNoteForm
              patientId={patientId}
              usedAppointmentIds={usedAppointmentIds}
              onSubmit={handleCreateNote}
              onCancel={() => setShowNoteForm(false)}
              isLoading={createNote.isPending}
            />
          )}

          {!record?.sessionNotes.length && !showNoteForm && (
            <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
              Nenhuma evolução registrada ainda.
              <br />
              <button
                className="mt-2 text-primary hover:underline"
                onClick={() => setShowNoteForm(true)}
              >
                Registrar primeira evolução
              </button>
            </div>
          )}

          {record?.sessionNotes.map((note) => (
            <SessionNoteCard
              key={note.id}
              note={note}
              onUpdate={handleUpdateNote}
              onDelete={handleDeleteNote}
              isDeleting={deleteNote.isPending}
            />
          ))}
        </div>

        {/* Anamnese */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Anamnese</CardTitle>
                {!editingAnamnesis && (
                  <Button variant="ghost" size="sm" onClick={startEditAnamnesis}>
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editingAnamnesis ? (
                <div className="space-y-3">
                  <textarea
                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                    rows={10}
                    placeholder="Histórico do paciente, queixa principal, antecedentes..."
                    value={anamnesisText}
                    onChange={(e) => setAnamnesisText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingAnamnesis(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveAnamnesis}
                      disabled={updateAnamnesis.isPending}
                    >
                      {updateAnamnesis.isPending && (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      )}
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : record?.anamnesis ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{record.anamnesis}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  Nenhuma anamnese registrada.{' '}
                  <button
                    className="text-primary hover:underline not-italic"
                    onClick={startEditAnamnesis}
                  >
                    Adicionar
                  </button>
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de evoluções</span>
                <span className="font-medium">{record?.sessionNotes.length ?? 0}</span>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-2">Tags mais usadas</p>
                <div className="flex flex-wrap gap-1">
                  {getTopTags(record?.sessionNotes ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                  {!getTopTags(record?.sessionNotes ?? []).length && (
                    <span className="text-muted-foreground text-xs">Nenhuma tag ainda</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function getTopTags(notes: { tags: string[] }[]): string[] {
  const freq: Record<string, number> = {};
  notes.forEach((n) => n.tags.forEach((t) => { freq[t] = (freq[t] ?? 0) + 1; }));
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag]) => tag);
}
