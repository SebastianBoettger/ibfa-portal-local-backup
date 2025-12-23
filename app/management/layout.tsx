'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { loadAuth } from '@/lib/auth';

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Login-Seite darf ohne Auth
    if (pathname === '/management/login') return;

    const auth = loadAuth();
    if (!auth?.token) {
      window.location.href = '/management/login';
    }
  }, [pathname]);

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4 flex flex-col gap-2">
        <div className="font-bold mb-4">Geschäftsführung</div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/management" className="hover:underline">Dashboard</Link>
          <Link href="/management/customers/new" className="hover:underline">Neukundeneintrag</Link>
          <Link href="/management/customers" className="hover:underline">Kundentabelle einsehen</Link>
          <Link href="/management/appointments" className="hover:underline">Vergangene Termine</Link>
          <Link href="/management/appointments/due" className="hover:underline">Fällige Prüfungen</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
