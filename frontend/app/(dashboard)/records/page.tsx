'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, FileText, ChevronRight } from 'lucide-react';
import { usePatients } from '@/hooks/use-patients';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function RecordsPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data, isLoading } = usePatients({ search: query, limit: 50 });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(search);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Prontuários</h1>
        <p className="text-sm text-muted-foreground">
          Selecione um paciente para acessar o prontuário
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" variant="secondary">Buscar</Button>
        {query && (
          <Button type="button" variant="ghost" onClick={() => { setSearch(''); setQuery(''); }}>
            Limpar
          </Button>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">Carregando...</div>
          ) : !data?.data.length ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              {query ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado.'}
            </div>
          ) : (
            <ul className="divide-y">
              {data.data.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/records/${p.id}`}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {p.email ?? p.phone ?? 'Sem contato'}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
