'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Pencil, Loader2 } from 'lucide-react';
import { usePatient } from '@/hooks/use-patients';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function field(label: string, value?: string | null) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium">{value ?? '—'}</p>
    </div>
  );
}

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: patient, isLoading } = usePatient(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-24 text-center text-muted-foreground">Paciente não encontrado.</div>
    );
  }

  const birthFormatted = patient.birthDate
    ? format(new Date(patient.birthDate), 'dd/MM/yyyy', { locale: ptBR })
    : undefined;

  const createdFormatted = format(new Date(patient.createdAt), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/patients"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
            Pacientes
          </Link>
        </div>
        <Button variant="outline" onClick={() => router.push(`/patients/${id}/edit`)}>
          <Pencil className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
          {patient.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant={patient.isActive ? 'default' : 'secondary'}>
              {patient.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
            <span className="text-xs text-muted-foreground">Cadastrado em {createdFormatted}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {field('E-mail', patient.email)}
            {field('Telefone', patient.phone)}
            {field('Data de nascimento', birthFormatted)}
            {field('CPF', patient.cpf)}
            {field('Endereço', patient.address)}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informações clínicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {field('Valor da sessão', patient.sessionPrice ? `R$ ${patient.sessionPrice}` : undefined)}
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground">Observações</p>
              <p className="mt-0.5 text-sm">{patient.notes || '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
