import type { PaymentStatus } from '@/lib/finances';

const CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  PAID:      { label: 'Pago',      color: 'text-green-700 border-green-200 bg-green-50' },
  PENDING:   { label: 'Pendente',  color: 'text-yellow-700 border-yellow-200 bg-yellow-50' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-600 border-red-200 bg-red-50' },
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { label, color } = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
