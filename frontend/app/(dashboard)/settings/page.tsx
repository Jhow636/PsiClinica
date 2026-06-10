'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, Building2, Save, Loader2 } from 'lucide-react';
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-notification-settings';
import { useClinicProfile, useUpdateClinicProfile } from '@/hooks/use-clinic';
import { useToast } from '@/components/ui/toast';
import type { NotificationSettings } from '@/lib/notifications';
import type { ClinicProfile } from '@/lib/clinic';

export default function SettingsPage() {
  const toast = useToast();

  const { data: notifData, isLoading: notifLoading } = useNotificationSettings();
  const updateNotif = useUpdateNotificationSettings();

  const { data: clinicData, isLoading: clinicLoading } = useClinicProfile();
  const updateClinic = useUpdateClinicProfile();

  const notifForm = useForm<NotificationSettings>({
    defaultValues: { reminder24hEnabled: false, reminder1hEnabled: false, reminderEmailText: '' },
  });

  const clinicForm = useForm<Omit<ClinicProfile, 'id'>>({
    defaultValues: { name: '', address: '', phone: '', logoUrl: '', sessionPrice: '' },
  });

  useEffect(() => {
    if (notifData) {
      notifForm.reset({ ...notifData, reminderEmailText: notifData.reminderEmailText ?? '' });
    }
  }, [notifData, notifForm]);

  useEffect(() => {
    if (clinicData) {
      clinicForm.reset({
        name: clinicData.name ?? '',
        address: clinicData.address ?? '',
        phone: clinicData.phone ?? '',
        logoUrl: clinicData.logoUrl ?? '',
        sessionPrice: clinicData.sessionPrice ?? '',
      });
    }
  }, [clinicData, clinicForm]);

  const either = notifForm.watch('reminder24hEnabled') || notifForm.watch('reminder1hEnabled');

  async function onSaveNotif(values: NotificationSettings) {
    try {
      await updateNotif.mutateAsync({ ...values, reminderEmailText: values.reminderEmailText || null });
      toast('Configurações de notificações salvas!');
    } catch {
      toast('Erro ao salvar notificações.', 'error');
    }
  }

  async function onSaveClinic(values: Omit<ClinicProfile, 'id'>) {
    try {
      await updateClinic.mutateAsync({
        ...values,
        address: values.address || null,
        phone: values.phone || null,
        logoUrl: values.logoUrl || null,
        sessionPrice: values.sessionPrice || null,
      });
      toast('Perfil da clínica atualizado!');
    } catch {
      toast('Erro ao salvar perfil.', 'error');
    }
  }

  const isLoading = notifLoading || clinicLoading;

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

      {/* Perfil da Clínica */}
      <form onSubmit={clinicForm.handleSubmit(onSaveClinic)} className="space-y-6">
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">Perfil da Clínica</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Nome da clínica *" error={clinicForm.formState.errors.name?.message}>
                <input
                  className={inputCls(!!clinicForm.formState.errors.name)}
                  placeholder="Ex: Consultório Silva"
                  {...clinicForm.register('name', { required: 'Obrigatório' })}
                />
              </Field>
            </div>
            <Field label="Telefone">
              <input
                className={inputCls()}
                placeholder="(11) 99999-9999"
                {...clinicForm.register('phone')}
              />
            </Field>
            <Field label="Valor padrão da sessão (R$)">
              <input
                className={inputCls()}
                placeholder="200.00"
                type="number"
                step="0.01"
                min="0"
                {...clinicForm.register('sessionPrice')}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Endereço">
                <input
                  className={inputCls()}
                  placeholder="Rua, número, cidade"
                  {...clinicForm.register('address')}
                />
              </Field>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <SaveButton pending={updateClinic.isPending} label="Salvar perfil" />
        </div>
      </form>

      {/* Notificações */}
      <form onSubmit={notifForm.handleSubmit(onSaveNotif)} className="space-y-6">
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
              {...notifForm.register('reminder24hEnabled')}
            />
            <Toggle
              id="reminder1h"
              label="Lembrete 1h antes da sessão"
              description="Envia um e-mail ao paciente uma hora antes da consulta."
              {...notifForm.register('reminder1hEnabled')}
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
                {...notifForm.register('reminderEmailText')}
              />
              <p className="mt-1 text-xs text-gray-400">Deixe em branco para usar o texto padrão.</p>
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <SaveButton pending={updateNotif.isPending} label="Salvar notificações" />
        </div>
      </form>
    </div>
  );
}

function inputCls(hasError = false) {
  return `w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
    hasError ? 'border-red-400 focus:border-red-400' : 'border-gray-300 focus:border-indigo-500'
  }`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function SaveButton({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {label}
    </button>
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
