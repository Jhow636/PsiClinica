'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, Save, Loader2 } from 'lucide-react';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-notification-settings';
import type { NotificationSettings } from '@/lib/notifications';

export default function SettingsPage() {
  const { data, isLoading } = useNotificationSettings();
  const update = useUpdateNotificationSettings();

  const { register, handleSubmit, reset, watch } = useForm<NotificationSettings>({
    defaultValues: {
      reminder24hEnabled: false,
      reminder1hEnabled: false,
      reminderEmailText: '',
    },
  });

  useEffect(() => {
    if (data) reset({ ...data, reminderEmailText: data.reminderEmailText ?? '' });
  }, [data, reset]);

  const either = watch('reminder24hEnabled') || watch('reminder1hEnabled');

  function onSubmit(values: NotificationSettings) {
    update.mutate({
      ...values,
      reminderEmailText: values.reminderEmailText || null,
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Configurações</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie as preferências da sua clínica.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Notificações */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Lembretes por E-mail</h2>
          </div>

          <div className="space-y-4">
            <Toggle
              id="reminder24h"
              label="Lembrete 24h antes da sessão"
              description="Envia um e-mail ao paciente um dia antes da consulta."
              {...register('reminder24hEnabled')}
            />
            <Toggle
              id="reminder1h"
              label="Lembrete 1h antes da sessão"
              description="Envia um e-mail ao paciente uma hora antes da consulta."
              {...register('reminder1hEnabled')}
            />
          </div>

          {either && (
            <div className="mt-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Texto personalizado do e-mail{' '}
                <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Ex: Olá! Este é um lembrete da sua sessão com Dr(a). Silva…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                {...register('reminderEmailText')}
              />
              <p className="mt-1 text-xs text-gray-400">
                Deixe em branco para usar o texto padrão.
              </p>
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={update.isPending}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {update.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar configurações
          </button>
        </div>

        {update.isSuccess && (
          <p className="text-center text-sm text-green-600">Configurações salvas com sucesso!</p>
        )}
        {update.isError && (
          <p className="text-center text-sm text-red-600">Erro ao salvar. Tente novamente.</p>
        )}
      </form>
    </div>
  );
}

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  description: string;
}

function Toggle({ id, label, description, ...props }: ToggleProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-4">
      <div className="relative mt-0.5 flex-shrink-0">
        <input id={id} type="checkbox" className="peer sr-only" {...props} />
        <div className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-indigo-600" />
        <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </label>
  );
}
