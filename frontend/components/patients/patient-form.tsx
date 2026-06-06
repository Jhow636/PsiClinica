'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PatientDetail, PatientPayload } from '@/lib/patients';

const schema = z.object({
  name: z.string().min(2, 'Nome muito curto').max(100),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, 'Telefone inválido (somente números, 10 ou 11 dígitos)')
    .optional()
    .or(z.literal('')),
  birthDate: z.string().optional().or(z.literal('')),
  cpf: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  sessionPrice: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Valor inválido')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface Props {
  defaultValues?: Partial<PatientDetail>;
  onSubmit: (data: PatientPayload) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
}

export function PatientForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Salvar' }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      phone: defaultValues?.phone ?? '',
      birthDate: defaultValues?.birthDate?.slice(0, 10) ?? '',
      cpf: defaultValues?.cpf ?? '',
      address: defaultValues?.address ?? '',
      sessionPrice: defaultValues?.sessionPrice ?? '',
      notes: defaultValues?.notes ?? '',
    },
  });

  function handleFormSubmit(data: FormData) {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
    ) as unknown as PatientPayload;
    return onSubmit(clean);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="name">Nome *</Label>
          <Input id="name" placeholder="Nome completo" {...register('name')} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="paciente@email.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" placeholder="11999999999" {...register('phone')} />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="birthDate">Data de nascimento</Label>
          <Input id="birthDate" type="date" {...register('birthDate')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" placeholder="000.000.000-00" {...register('cpf')} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="sessionPrice">Valor da sessão (R$)</Label>
          <Input id="sessionPrice" placeholder="200.00" {...register('sessionPrice')} />
          {errors.sessionPrice && (
            <p className="text-xs text-destructive">{errors.sessionPrice.message}</p>
          )}
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="address">Endereço</Label>
          <Input id="address" placeholder="Rua, número, bairro" {...register('address')} />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Encaminhamentos, informações relevantes..."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            {...register('notes')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
