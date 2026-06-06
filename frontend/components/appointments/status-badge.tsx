import { Badge } from '@/components/ui/badge';
import type { AppointmentStatus } from '@/lib/appointments';

const CONFIG: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  SCHEDULED:  { label: 'Agendado',   variant: 'outline',     color: 'text-blue-600 border-blue-200 bg-blue-50' },
  CONFIRMED:  { label: 'Confirmado', variant: 'default',     color: 'text-green-700 border-green-200 bg-green-50' },
  COMPLETED:  { label: 'Realizado',  variant: 'secondary',   color: 'text-zinc-600 border-zinc-200 bg-zinc-50' },
  CANCELLED:  { label: 'Cancelado',  variant: 'destructive', color: 'text-red-600 border-red-200 bg-red-50' },
  NO_SHOW:    { label: 'Faltou',     variant: 'outline',     color: 'text-orange-600 border-orange-200 bg-orange-50' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, color } = CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
