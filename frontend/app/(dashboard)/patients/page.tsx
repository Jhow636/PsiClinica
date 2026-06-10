'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Loader2, Trash2, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePatients, useDeletePatient } from '@/hooks/use-patients';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function PatientsPage() {
  const router = useRouter();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');

  const { data, isLoading } = usePatients({ search: query, page, limit: 15 });
  const deletePatient = useDeletePatient();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
    setPage(1);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remover ${name}?`)) return;
    try {
      await deletePatient.mutateAsync(id);
      toast(`${name} removido com sucesso.`, 'info');
    } catch {
      toast('Erro ao remover paciente.', 'error');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pacientes</h1>
          <p className="text-sm text-muted-foreground">
            {data?.meta.total ?? 0} paciente{data?.meta.total !== 1 ? 's' : ''} cadastrado
            {data?.meta.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button asChild>
          <Link href="/patients/new">
            <Plus className="mr-2 h-4 w-4" />
            Novo paciente
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">Buscar</Button>
        {query && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setSearch(''); setQuery(''); setPage(1); }}
          >
            Limpar
          </Button>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !data?.data.length ? (
            <div className="py-16 text-center text-muted-foreground">
              {query ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="hidden px-6 py-3 font-medium sm:table-cell">Contato</th>
                  <th className="hidden px-6 py-3 font-medium md:table-cell">Valor/sessão</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/patients/${p.id}`)}
                  >
                    <td className="px-6 py-4 font-medium">{p.name}</td>
                    <td className="hidden px-6 py-4 text-muted-foreground sm:table-cell">
                      <div>{p.email ?? '—'}</div>
                      <div className="text-xs">{p.phone ?? ''}</div>
                    </td>
                    <td className="hidden px-6 py-4 text-muted-foreground md:table-cell">
                      {p.sessionPrice ? `R$ ${p.sessionPrice}` : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={p.isActive ? 'default' : 'secondary'}>
                        {p.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td
                      className="px-6 py-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/patients/${p.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deletePatient.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Página {page} de {data.meta.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page === data.meta.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
