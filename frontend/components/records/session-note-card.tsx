'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/appointments/status-badge';
import type { SessionNote } from '@/lib/records';

interface Props {
  note: SessionNote;
  onUpdate: (noteId: string, content: string, tags: string[]) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  isDeleting?: boolean;
}

export function SessionNoteCard({ note, onUpdate, onDelete, isDeleting }: Props) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [tagInput, setTagInput] = useState(note.tags.join(', '));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      await onUpdate(note.id, content, tags);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setContent(note.content);
    setTagInput(note.tags.join(', '));
    setEditing(false);
  }

  const dateStr = format(new Date(note.appointment.startTime), "dd/MM/yyyy 'às' HH:mm", {
    locale: ptBR,
  });

  return (
    <div className="rounded-lg border bg-white p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="text-sm font-medium">{dateStr}</p>
          <StatusBadge status={note.appointment.status} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!editing && (
            <>
              <Button variant="ghost" size="icon" onClick={() => setEditing(true)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(note.id)}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </>
          )}
          {editing && (
            <>
              <Button variant="ghost" size="icon" onClick={handleSave} disabled={saving}>
                <Check className="h-3.5 w-3.5 text-green-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <textarea
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div>
            <label className="text-xs text-muted-foreground">
              Tags (separadas por vírgula)
            </label>
            <input
              className="flex h-8 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="ansiedade, trauma, família..."
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{note.content}</p>
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
