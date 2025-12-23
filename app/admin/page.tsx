'use client';

import { useEffect, useState } from 'react';
import { AuthData, clearAuth, loadAuth } from '@/lib/auth';
import { CustomerListItem } from '@/lib/customers';

export default function AdminHomePage() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [customers, setCustomers] = useState<CustomerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth aus localStorage laden
  useEffect(() => {
    const a = loadAuth();
    setAuth(a);
  }, []);

  // Kundenliste laden, sobald Auth da ist
  useEffect(() => {
    async function fetchCustomers() {
      if (!auth) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`,
          {
            headers: {
              Authorization: `Bearer ${auth.token}`,
            },
          },
        );

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setError('Keine Berechtigung für Kundenliste.');
          } else {
            setError(`Fehler beim Laden der Kunden (Status ${res.status})`);
          }
          setCustomers([]);
        } else {
          const data = (await res.json()) as CustomerListItem[];
          setCustomers(data);
        }
      } catch (err) {
        console.error(err);
        setError('Netzwerkfehler beim Laden der Kunden.');
      } finally {
        setLoading(false);
      }
    }

    fetchCustomers();
  }, [auth]);

  function handleLogout() {
    clearAuth();
    window.location.href = '/admin/login';
  }

  if (!auth) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">Admin-Dashboard</h1>
        <p>Du bist nicht eingeloggt.</p>
        <a
          href="/admin/login"
          className="underline text-blue-300 hover:text-blue-100"
        >
          Zum Admin-Login
        </a>
      </main>
    );
  }

  const { user } = auth;

  return (
    <main className="min-h-screen flex flex-col items-center pt-16 px-4 gap-6">
      <div className="flex w-full max-w-5xl justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin-Dashboard</h1>
          <div className="mt-1 text-sm text-gray-300">
            Angemeldet als{' '}
            <span className="font-semibold">
              {user.firstName} {user.lastName} ({user.email})
            </span>{' '}
            – Rolle: <span className="font-semibold">{user.role}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="rounded border border-white px-4 py-2 hover:bg-white hover:text-black text-sm"
        >
          Abmelden
        </button>
      </div>

      <section className="w-full max-w-5xl bg-black/40 border border-blue-400/40 rounded-xl p-4 shadow-[0_0_20px_rgba(0,150,255,0.2)]">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold">Kundenliste</h2>
          {loading && (
            <span className="text-xs text-gray-400">Lade Kunden …</span>
          )}
        </div>

        {error && (
          <div className="mb-3 border border-red-500 bg-red-50 text-red-700 px-3 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {!loading && customers.length === 0 && !error && (
          <div className="text-sm text-gray-300">
            Noch keine Kunden vorhanden.
          </div>
        )}

        {customers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700 text-left">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Adresse</th>
                  <th className="py-2 pr-4">E-Mail</th>
                  <th className="py-2 pr-4">Telefon</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-800/60 hover:bg-white/5"
                  >
                    <td className="py-1 pr-4">{c.name}</td>
                    <td className="py-1 pr-4">
                      {[c.street, [c.zipCode, c.city].filter(Boolean).join(' ')]
                        .filter(Boolean)
                        .join(', ')}
                    </td>
                    <td className="py-1 pr-4">{c.email ?? '–'}</td>
                    <td className="py-1 pr-4">{c.phone ?? '–'}</td>
                    <td className="py-1">
                      {c.isActive ? (
                        <span className="inline-block rounded bg-green-500/20 text-green-300 px-2 py-0.5 text-xs">
                          aktiv
                        </span>
                      ) : (
                        <span className="inline-block rounded bg-gray-500/20 text-gray-300 px-2 py-0.5 text-xs">
                          inaktiv
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
