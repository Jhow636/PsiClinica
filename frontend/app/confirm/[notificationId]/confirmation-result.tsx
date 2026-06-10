'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

type Status = 'loading' | 'confirmed' | 'cancelled' | 'already_cancelled' | 'already_completed' | 'error';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function callConfirmation(notificationId: string, action: string): Promise<Status> {
  const res = await fetch(
    `${API_BASE}/notifications/confirm/${notificationId}?action=${action}`,
  );

  if (!res.ok) {
    return 'error';
  }

  const body = (await res.json()) as { message: string };
  const msg = body.message ?? '';

  if (msg.includes('Presença confirmada')) return 'confirmed';
  if (msg.includes('cancelada') && msg.includes('profissional')) return 'cancelled';
  if (msg.includes('já foi cancelada')) return 'already_cancelled';
  if (msg.includes('já foi realizada')) return 'already_completed';

  return 'error';
}

const STATUS_CONFIG: Record<
  Exclude<Status, 'loading'>,
  { icon: React.ReactNode; title: string; description: string; color: string }
> = {
  confirmed: {
    icon: <CheckCircle className="h-16 w-16 text-green-500" />,
    title: 'Presença Confirmada!',
    description: 'Sua sessão foi confirmada com sucesso. Até breve!',
    color: 'text-green-700',
  },
  cancelled: {
    icon: <XCircle className="h-16 w-16 text-red-500" />,
    title: 'Sessão Cancelada',
    description: 'Sua sessão foi cancelada. O profissional foi notificado.',
    color: 'text-red-700',
  },
  already_cancelled: {
    icon: <AlertCircle className="h-16 w-16 text-yellow-500" />,
    title: 'Sessão já cancelada',
    description: 'Esta sessão já foi cancelada anteriormente.',
    color: 'text-yellow-700',
  },
  already_completed: {
    icon: <AlertCircle className="h-16 w-16 text-blue-500" />,
    title: 'Sessão já realizada',
    description: 'Esta sessão já foi realizada.',
    color: 'text-blue-700',
  },
  error: {
    icon: <AlertCircle className="h-16 w-16 text-gray-500" />,
    title: 'Link inválido',
    description: 'Este link de confirmação é inválido ou já expirou.',
    color: 'text-gray-700',
  },
};

interface Props {
  notificationId: string;
  action?: string;
}

export function ConfirmationResult({ notificationId, action }: Props) {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (action !== 'confirm' && action !== 'cancel') {
      setStatus('error');
      return;
    }

    callConfirmation(notificationId, action).then(setStatus);
  }, [notificationId, action]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
          <p className="text-sm text-gray-500">Processando sua solicitação…</p>
        </div>
      </div>
    );
  }

  const { icon, title, description, color } = STATUS_CONFIG[status];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg text-center">
        <div className="mb-6 flex justify-center">{icon}</div>
        <h1 className={`mb-2 text-2xl font-semibold ${color}`}>{title}</h1>
        <p className="text-gray-500">{description}</p>
        <p className="mt-8 text-xs text-gray-400">PsiClínica — Plataforma de Gestão para Psicanalistas</p>
      </div>
    </div>
  );
}
