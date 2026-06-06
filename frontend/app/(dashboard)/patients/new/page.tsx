'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { useCreatePatient } from '@/hooks/use-patients';
import { PatientForm } from '@/components/patients/patient-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PatientPayload } from '@/lib/patients';

export default function NewPatientPage() {
  const router = useRouter();
  const create = useCreatePatient();

  async function handleSubmit(data: PatientPayload) {
    await create.mutateAsync(data);
    router.push('/patients');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/patients"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Pacientes
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Novo paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm
            onSubmit={handleSubmit}
            isLoading={create.isPending}
            submitLabel="Cadastrar paciente"
          />
          {create.error && (
            <p className="mt-3 text-sm text-destructive">{create.error.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
