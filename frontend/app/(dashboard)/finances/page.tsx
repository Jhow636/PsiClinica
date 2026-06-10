'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useFinancialSummary,
  usePayments,
  useUpdatePaymentStatus,
  useDeletePayment,
} from '@/hooks/use-finances';
import { SummaryCards } from '@/components/finances/summary-cards';
import { PaymentStatusBadge } from '@/components/finances/payment-status-badge';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PaymentStatus } from '@/lib/finances';

const METHODS = ['Dinheiro', 'Pix', 'Transferência', 'Cartão', 'Outro'];

const STATUS_OPTIONS: { value: PaymentStatus | ''; label: string }[] = [
  { value: '',          label: 'Todos' },
  { value: 'PENDING',   label: 'Pendente' },
  { value: 'PAID',      label: 'Pago' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

export default function FinancesPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data: summary, isLoading: summaryLoading } = useFinancialSummary();
  const { data, isLoading } = usePayments({
    status: statusFilter || undefined,
    page,
    limit: 20,
  });
  const updateStatus = useUpdatePaymentStatus();
  const deletePayment = useDeletePayment();

  async function handleStatusChange(id: string, status: PaymentStatus, method?: string) {
    try {
      await updateStatus.mutateAsync({ id, data: { status, method: method || undefined } });
      toast('Status de pagamento atualizado!');
    } catch {
      toast('Erro ao atualizar pagamento.', 'error');
    }
  }

  async function handleDeletePayment(id: string) {
    try {
      await deletePayment.mutateAsync(id);
      toast('Lançamento removido.', 'info');
    } catch {
      toast('Erro ao remover lançamento.', 'error');
    }
  }

  function handleExportCSV() {
    if (!data?.data.length) return;
    const header = 'Paciente,Data,Valor,Status,Forma de Pagamento,Pago em';
    const rows = data.data.map((p) =>
      [
        p.patient.name,
        format(new Date(p.appointment.startTime), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
        `R$ ${p.amount}`,
        p.status,
        p.method ?? '',
        p.paidAt ? format(new Date(p.paidAt), 'dd/MM/yyyy', { locale: ptBR }) : '',
      ].join(','),
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financeiro-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast('CSV exportado!');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Controle de pagamentos das sessões</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV} disabled={!data?.data.length}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <SummaryCards summary={summary} isLoading={summaryLoading} />

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Filtrar:</span>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => { setStatusFilter(opt.value); setPage(1); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : !data?.data.length ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Nenhum pagamento encontrado.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Paciente</th>
                  <th className="hidden px-6 py-3 font-medium sm:table-cell">Data da sessão</th>
                  <th className="px-6 py-3 font-medium">Valor</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Forma</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-muted/20">
                    <td className="px-6 py-4 font-medium">{p.patient.name}</td>
                    <td className="hidden px-6 py-4 text-muted-foreground sm:table-cell">
                      {format(new Date(p.appointment.startTime), 'dd/MM/yyyy HH:mm', {
                        locale: ptBR,
                      })}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      R$ {Number(p.amount).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4">
                      <PaymentStatusBadge status={p.status} />
                    </td>
                    <td className="hidden px-6 py-4 text-muted-foreground md:table-cell">
                      {p.method ?? '—'}
                    </td>
                    <td className="px-6 py-4">
                      <ActionMenu
                        payment={p}
                        onStatusChange={handleStatusChange}
                        onDelete={async () => {
                          if (confirm('Remover este lançamento?'))
                            await handleDeletePayment(p.id);
                        }}
                        isUpdating={updateStatus.isPending}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Página {page} de {data.meta.totalPages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page === data.meta.totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionMenuProps {
  payment: { id: string; status: PaymentStatus; method?: string };
  onStatusChange: (id: string, status: PaymentStatus, method?: string) => Promise<void>;
  onDelete: () => Promise<void>;
  isUpdating: boolean;
}

function ActionMenu({ payment, onStatusChange, onDelete, isUpdating }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState(payment.method ?? '');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-primary hover:underline"
      >
        Ações
      </button>
    );
  }

  return (
    <div className="space-y-2 min-w-[160px]">
      <select
        className="flex h-7 w-full rounded-md border border-input bg-transparent px-2 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={method}
        onChange={(e) => setMethod(e.target.value)}
      >
        <option value="">Forma pgto.</option>
        {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>

      <div className="flex flex-wrap gap-1">
        {payment.status !== 'PAID' && (
          <button
            disabled={isUpdating}
            onClick={async () => { await onStatusChange(payment.id, 'PAID', method); setOpen(false); }}
            className="rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
          >
            Pago
          </button>
        )}
        {payment.status !== 'PENDING' && (
          <button
            disabled={isUpdating}
            onClick={async () => { await onStatusChange(payment.id, 'PENDING'); setOpen(false); }}
            className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700 hover:bg-yellow-200 disabled:opacity-50"
          >
            Pendente
          </button>
        )}
        {payment.status !== 'CANCELLED' && (
          <button
            disabled={isUpdating}
            onClick={async () => { await onStatusChange(payment.id, 'CANCELLED'); setOpen(false); }}
            className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-200 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={async () => { await onDelete(); setOpen(false); }}
          className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 hover:bg-zinc-200"
        >
          Remover
        </button>
      </div>

      <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">
        Fechar
      </button>
    </div>
  );
}
