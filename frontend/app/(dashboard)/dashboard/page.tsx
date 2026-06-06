'use client';

import Link from 'next/link';
import { format, startOfDay, endOfDay, isToday, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar,
  Users,
  Clock,
  DollarSign,
  ChevronRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useAppointments } from '@/hooks/use-appointments';
import { usePatients } from '@/hooks/use-patients';
import { useFinancialSummary, usePayments } from '@/hooks/use-finances';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/appointments/status-badge';
import { PaymentStatusBadge } from '@/components/finances/payment-status-badge';
import { Separator } from '@/components/ui/separator';

const today = new Date();
const todayStart = format(startOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");
const todayEnd = format(endOfDay(today), "yyyy-MM-dd'T'HH:mm:ss");

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const { data: todayAppointments } = useAppointments({
    dateFrom: todayStart,
    dateTo: todayEnd,
    limit: 50,
  });

  const { data: patients } = usePatients({ limit: 1 });
  const { data: summary } = useFinancialSummary();
  const { data: pendingPayments } = usePayments({ status: 'PENDING', limit: 5 });

  const sessions = todayAppointments?.data ?? [];
  const upcoming = sessions
    .filter((a) => a.status !== 'CANCELLED' && (isFuture(new Date(a.startTime)) || isToday(new Date(a.startTime))))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const nextSession = upcoming[0];
  const hour = format(today, 'HH');
  const greeting = Number(hour) < 12 ? 'Bom dia' : Number(hour) < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, {user?.name?.split(' ')[0] ?? 'Psicanalista'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Sessões hoje"
          value={String(sessions.filter((a) => a.status !== 'CANCELLED').length)}
          sub={`${upcoming.length} ainda por acontecer`}
          icon={Calendar}
          href="/appointments"
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          label="Pacientes ativos"
          value={String(patients?.meta.total ?? '—')}
          sub="total cadastrado"
          icon={Users}
          href="/patients"
          color="text-violet-600"
          bg="bg-violet-50"
        />
        <StatCard
          label="Recebido no mês"
          value={fmt(summary?.totalPaid ?? 0)}
          sub={`${summary?.countPaid ?? 0} sessões pagas`}
          icon={DollarSign}
          href="/finances"
          color="text-green-600"
          bg="bg-green-50"
        />
        <StatCard
          label="A receber"
          value={fmt(summary?.totalPending ?? 0)}
          sub={`${summary?.countPending ?? 0} sessões pendentes`}
          icon={AlertCircle}
          href="/finances"
          color="text-yellow-600"
          bg="bg-yellow-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Sessões de hoje */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Sessões de hoje</CardTitle>
              <Link
                href="/appointments"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                Ver agenda <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!sessions.length ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma sessão agendada para hoje.
              </div>
            ) : (
              <ul className="space-y-1">
                {sessions
                  .filter((a) => a.status !== 'CANCELLED')
                  .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                  .map((appt) => {
                    const start = new Date(appt.startTime);
                    const end = new Date(appt.endTime);
                    const past = !isFuture(end);
                    return (
                      <li
                        key={appt.id}
                        className={`flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/30 ${past ? 'opacity-60' : ''}`}
                      >
                        <div className="w-16 shrink-0 text-center">
                          <p className="text-sm font-semibold tabular-nums">
                            {format(start, 'HH:mm')}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {format(end, 'HH:mm')}
                          </p>
                        </div>
                        <div className={`h-8 w-0.5 rounded-full shrink-0 ${past ? 'bg-muted' : 'bg-primary'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium text-sm">{appt.patient.name}</p>
                          {appt.notes && (
                            <p className="truncate text-xs text-muted-foreground">{appt.notes}</p>
                          )}
                        </div>
                        <StatusBadge status={appt.status} />
                      </li>
                    );
                  })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Coluna direita */}
        <div className="space-y-6">
          {/* Próxima sessão */}
          {nextSession && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-xs font-medium text-primary mb-3">
                  <Clock className="h-3.5 w-3.5" />
                  Próxima sessão
                </div>
                <p className="text-lg font-bold">{nextSession.patient.name}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {format(new Date(nextSession.startTime), "HH:mm 'até' ", { locale: ptBR })}
                  {format(new Date(nextSession.endTime), 'HH:mm')}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/records/${nextSession.patientId}`}
                    className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Abrir prontuário
                  </Link>
                  <Link
                    href="/appointments"
                    className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    Ver agenda
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagamentos pendentes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pagamentos pendentes</CardTitle>
                <Link
                  href="/finances"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                >
                  Ver todos <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!pendingPayments?.data.length ? (
                <div className="flex items-center gap-2 py-4 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  Nenhum pagamento pendente!
                </div>
              ) : (
                <ul className="space-y-3">
                  {pendingPayments.data.map((p, i) => (
                    <li key={p.id}>
                      {i > 0 && <Separator className="mb-3" />}
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{p.patient.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(p.appointment.startTime), 'dd/MM/yyyy HH:mm', {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-sm font-semibold">
                            R$ {Number(p.amount).toFixed(2).replace('.', ',')}
                          </p>
                          <PaymentStatusBadge status={p.status} />
                        </div>
                      </div>
                    </li>
                  ))}
                  {(pendingPayments.meta.total ?? 0) > 5 && (
                    <li className="pt-1 text-center">
                      <Link href="/finances" className="text-xs text-primary hover:underline">
                        +{pendingPayments.meta.total - 5} outros pendentes
                      </Link>
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bg: string;
}

function StatCard({ label, value, sub, icon: Icon, href, color, bg }: StatCardProps) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{sub}</p>
            </div>
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
