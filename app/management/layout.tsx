import Link from 'next/link';

export default function ManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 border-r p-4 flex flex-col gap-2">
        <div className="font-bold mb-4">Geschäftsführung</div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/management" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/management/customers/new" className="hover:underline">
            Neukundeneintrag
          </Link>
          <Link href="/management/customers" className="hover:underline">
            Kundentabelle einsehen
          </Link>
          <Link href="/management/appointments" className="hover:underline">
            Vergangene Termine
          </Link>
          <Link href="/management/appointments/due" className="hover:underline">
            Fällige Prüfungen
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
