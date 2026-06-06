'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { usePatient, useUpdatePatient } from '@/hooks/use-patients';
import { PatientForm } from '@/components/patients/patient-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PatientPayload } from '@/lib/patients';

export default function EditPatientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(id);
  const update = useUpdatePatient(id);

  async function handleSubmit(data: PatientPayload) {
    await update.mutateAsync(data);
    router.push(`/patients/${id}`);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/patients/${id}`}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          {patient?.name ?? 'Paciente'}
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Editar paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm
            defaultValues={patient}
            onSubmit={handleSubmit}
            isLoading={update.isPending}
            submitLabel="Salvar alterações"
          />
          {update.error && (
            <p className="mt-3 text-sm text-destructive">{update.error.message}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
