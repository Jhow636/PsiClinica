'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePatients } from '@/hooks/use-patients';
import type { Appointment, AppointmentPayload } from '@/lib/appointments';

const schema = z
  .object({
    patientId: z.string().min(1, 'Selecione um paciente'),
    date: z.string().min(1, 'Data obrigatória'),
    startHour: z.string().min(1, 'Hora de início obrigatória'),
    endHour: z.string().min(1, 'Hora de término obrigatória'),
    notes: z.string().optional(),
  })
  .refine((d) => d.startHour < d.endHour, {
    message: 'Hora de término deve ser depois do início',
    path: ['endHour'],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentPayload) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<Appointment>;
  defaultDate?: Date;
}

export function AppointmentModal({
  open,
  onClose,
  onSubmit,
  isLoading,
  defaultValues,
  defaultDate,
}: Props) {
  const { data: patientsData } = usePatients({ limit: 200 });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: getDefaults(defaultValues, defaultDate),
  });

  useEffect(() => {
    reset(getDefaults(defaultValues, defaultDate));
  }, [defaultValues, defaultDate, reset]);

  async function handleFormSubmit(data: FormData) {
    const startTime = new Date(`${data.date}T${data.startHour}`).toISOString();
    const endTime = new Date(`${data.date}T${data.endHour}`).toISOString();
    await onSubmit({
      patientId: data.patientId,
      startTime,
      endTime,
      notes: data.notes || undefined,
    });
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">
            {defaultValues?.id ? 'Editar sessão' : 'Nova sessão'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="patientId">Paciente *</Label>
            <select
              id="patientId"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('patientId')}
            >
              <option value="">Selecione...</option>
              {patientsData?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-xs text-destructive">{errors.patientId.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date">Data *</Label>
            <Input id="date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startHour">Início *</Label>
              <Input id="startHour" type="time" {...register('startHour')} />
              {errors.startHour && (
                <p className="text-xs text-destructive">{errors.startHour.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endHour">Término *</Label>
              <Input id="endHour" type="time" {...register('endHour')} />
              {errors.endHour && (
                <p className="text-xs text-destructive">{errors.endHour.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observações</Label>
            <textarea
              id="notes"
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              placeholder="Notas sobre a sessão..."
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {defaultValues?.id ? 'Salvar' : 'Agendar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function getDefaults(appt?: Partial<Appointment>, defaultDate?: Date): FormData {
  if (appt?.startTime) {
    const start = new Date(appt.startTime);
    const end = new Date(appt.endTime ?? appt.startTime);
    return {
      patientId: appt.patientId ?? '',
      date: format(start, 'yyyy-MM-dd'),
      startHour: format(start, 'HH:mm'),
      endHour: format(end, 'HH:mm'),
      notes: appt.notes ?? '',
    };
  }
  return {
    patientId: '',
    date: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    startHour: '09:00',
    endHour: '10:00',
    notes: '',
  };
}
