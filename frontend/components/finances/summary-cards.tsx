import { DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { FinancialSummary } from '@/lib/finances';

function fmt(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface Props {
  summary?: FinancialSummary;
  isLoading?: boolean;
}

export function SummaryCards({ summary, isLoading }: Props) {
  const cards = [
    {
      label: 'Recebido no mês',
      value: fmt(summary?.totalPaid ?? 0),
      sub: `${summary?.countPaid ?? 0} sessão(ões) paga(s)`,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pendente',
      value: fmt(summary?.totalPending ?? 0),
      sub: `${summary?.countPending ?? 0} sessão(ões) pendente(s)`,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Cancelado no mês',
      value: String(summary?.countCancelled ?? 0),
      sub: 'sessões canceladas',
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
    {
      label: 'Total em aberto',
      value: fmt((summary?.totalPending ?? 0)),
      sub: 'a receber',
      icon: DollarSign,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
        <Card key={label}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-xl font-bold ${isLoading ? 'opacity-40' : ''}`}>{value}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
