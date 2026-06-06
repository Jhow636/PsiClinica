'use client';

import { useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import { ptBR } from 'date-fns/locale';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { Plus } from 'lucide-react';
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useUpdateAppointmentStatus,
  useDeleteAppointment,
} from '@/hooks/use-appointments';
import { AppointmentModal } from '@/components/appointments/appointment-modal';
import { StatusBadge } from '@/components/appointments/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Appointment, AppointmentPayload, AppointmentStatus } from '@/lib/appointments';

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  SCHEDULED: '#3b82f6',
  CONFIRMED: '#22c55e',
  COMPLETED: '#94a3b8',
  CANCELLED: '#ef4444',
  NO_SHOW:   '#f97316',
};

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: 'SCHEDULED',  label: 'Agendado' },
  { value: 'CONFIRMED',  label: 'Confirmado' },
  { value: 'COMPLETED',  label: 'Realizado' },
  { value: 'CANCELLED',  label: 'Cancelado' },
  { value: 'NO_SHOW',    label: 'Faltou' },
];

export default function AppointmentsPage() {
  const [rangeStart, setRangeStart] = useState(() =>
    format(startOfMonth(new Date()), 'yyyy-MM-dd'),
  );
  const [rangeEnd, setRangeEnd] = useState(() =>
    format(endOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd'),
  );

  const { data } = useAppointments({ dateFrom: rangeStart, dateTo: rangeEnd });
  const createAppt = useCreateAppointment();
  const updateAppt = useUpdateAppointment('');
  const updateStatus = useUpdateAppointmentStatus();
  const deleteAppt = useDeleteAppointment();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingAppt, setEditingAppt] = useState<Appointment | undefined>();
  const [detailAppt, setDetailAppt] = useState<Appointment | undefined>();

  const events = (data?.data ?? []).map((a) => ({
    id: a.id,
    title: a.patient.name,
    start: a.startTime,
    end: a.endTime,
    backgroundColor: STATUS_COLORS[a.status],
    borderColor: STATUS_COLORS[a.status],
    extendedProps: { appointment: a },
  }));

  const handleDateClick = useCallback((arg: DateClickArg) => {
    setEditingAppt(undefined);
    setSelectedDate(arg.date);
    setModalOpen(true);
  }, []);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const appt = arg.event.extendedProps.appointment as Appointment;
    setDetailAppt(appt);
  }, []);

  const handleEventDrop = useCallback(
    async (arg: EventDropArg) => {
      const appt = arg.event.extendedProps.appointment as Appointment;
      const delta = arg.delta;
      const newStart = new Date(new Date(appt.startTime).getTime() + delta.milliseconds +
        (delta.days * 86400000) + (delta.months * 30 * 86400000));
      const newEnd = new Date(new Date(appt.endTime).getTime() + delta.milliseconds +
        (delta.days * 86400000) + (delta.months * 30 * 86400000));
      try {
        await updateAppt.mutateAsync({ startTime: newStart.toISOString(), endTime: newEnd.toISOString() });
      } catch {
        arg.revert();
      }
    },
    [updateAppt],
  );

  async function handleModalSubmit(payload: AppointmentPayload) {
    if (editingAppt) {
      await updateAppt.mutateAsync(payload);
    } else {
      await createAppt.mutateAsync(payload);
    }
  }

  async function handleStatusChange(id: string, status: AppointmentStatus) {
    await updateStatus.mutateAsync({ id, status });
    setDetailAppt((prev) => (prev ? { ...prev, status } : prev));
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta sessão?')) return;
    await deleteAppt.mutateAsync(id);
    setDetailAppt(undefined);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-sm text-muted-foreground">
            {data?.meta.total ?? 0} sessão(ões) no período
          </p>
        </div>
        <Button onClick={() => { setEditingAppt(undefined); setSelectedDate(new Date()); setModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Nova sessão
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardContent className="p-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              locale="pt-br"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia' }}
              events={events}
              editable
              selectable
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              slotMinTime="07:00:00"
              slotMaxTime="22:00:00"
              allDaySlot={false}
              height="auto"
              datesSet={(arg) => {
                setRangeStart(format(arg.start, 'yyyy-MM-dd'));
                setRangeEnd(format(arg.end, 'yyyy-MM-dd'));
              }}
              eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              nowIndicator
            />
          </CardContent>
        </Card>

        {detailAppt && (
          <Card className="h-fit">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">{detailAppt.patient.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(detailAppt.startTime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {' — '}
                    {format(new Date(detailAppt.endTime), 'HH:mm', { locale: ptBR })}
                  </p>
                </div>
                <button
                  onClick={() => setDetailAppt(undefined)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <div>
                <StatusBadge status={detailAppt.status} />
              </div>

              {detailAppt.notes && (
                <p className="text-sm text-muted-foreground">{detailAppt.notes}</p>
              )}

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Alterar status</p>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={detailAppt.status}
                  onChange={(e) =>
                    handleStatusChange(detailAppt.id, e.target.value as AppointmentStatus)
                  }
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setEditingAppt(detailAppt);
                    setModalOpen(true);
                    setDetailAppt(undefined);
                  }}
                >
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleDelete(detailAppt.id)}
                  disabled={deleteAppt.isPending}
                >
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <AppointmentModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingAppt(undefined); }}
        onSubmit={handleModalSubmit}
        isLoading={createAppt.isPending || updateAppt.isPending}
        defaultValues={editingAppt}
        defaultDate={selectedDate}
      />
    </div>
  );
}
