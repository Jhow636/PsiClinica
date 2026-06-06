'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Olá, {user?.name ?? 'Psicanalista'} 👋</h1>
        <p className="text-muted-foreground">Dashboard em construção...</p>
        <button
          onClick={handleLogout}
          className="text-sm text-destructive underline underline-offset-4"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
