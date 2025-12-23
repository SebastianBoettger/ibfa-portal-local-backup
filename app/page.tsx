import Link from 'next/link';

export default function PortalHomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div
        className="border border-blue-400/40 bg-black/40 
                   shadow-[0_0_20px_rgba(0,150,255,0.2)]
                   hover:shadow-[0_0_40px_rgba(0,150,255,0.4)]
                   transition-shadow duration-300
                   rounded-xl px-8 py-6 max-w-sm w-full space-y-5"
      >
        <h1 className="text-2xl font-bold text-center">
          IBfA Portal
        </h1>

        <p className="text-xs text-center text-gray-400">
          Bitte wählen Sie den gewünschten Login-Bereich.
        </p>

        <div className="space-y-3 pt-2">
          <Link
            href="/admin/login"
            className="w-full inline-flex justify-center rounded bg-blue-500 
                       text-white font-semibold py-2 text-sm hover:bg-blue-600"
          >
            Admin-Login
          </Link>

        <Link
            href="/management/login"
            className="w-full inline-flex justify-center rounded bg-blue-500 
                       text-white font-semibold py-2 text-sm hover:bg-blue-600"
          >
            Geschäftsführung
          </Link>
        </div>

        <p className="text-[11px] text-center text-gray-500 pt-2">
          Admin: interne Nutzer (Admin / Planung / Technik) ·
          Geschäftsführung: Dashboard &amp; Kundendaten
        </p>
      </div>
    </main>
  );
}
