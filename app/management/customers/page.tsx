'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadAuth, type AuthData } from '@/lib/auth';

type Customer = {
  id: string;
  name: string;
  street: string | null;
  zipCode: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

export default function CustomersPage() {
  const [auth, setAuth] = useState<AuthData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const a = loadAuth();

    if (!a?.token) {
      window.location.href = '/management/login';
      return;
    }

    setAuth(a);

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      setError('API base URL nicht gesetzt');
      setLoading(false);
      return;
    }

    fetch(`${baseUrl}/customers`, {
      headers: {
        Authorization: `Bearer ${a.token}`,
      },
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: Customer[]) => setCustomers(data))
      .catch((err: any) => setError(err.message ?? 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!auth) return;
    if (!confirm('Kunde wirklich löschen?')) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) return;

    try {
      setDeletingId(id);
      const res = await fetch(`${baseUrl}/customers/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
      alert('Löschen fehlgeschlagen.');
    } finally {
      setDeletingId(null);
    }
  }

  if (!auth) {
    return <div className="p-4">Prüfe Anmeldung …</div>;
  }

  if (loading) {
    return <div className="p-4">Lade Kunden …</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Fehler: {error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Kunden</h1>
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Ort</th>
            <th className="p-2 text-left">PLZ</th>
            <th className="p-2 text-left">Straße</th>
            <th className="p-2 text-left">E-Mail</th>
            <th className="p-2 text-left">Telefon</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c) => (
            <tr key={c.id} className="border-b">
              <td className="p-2">{c.name}</td>
              <td className="p-2">{c.city}</td>
              <td className="p-2">{c.zipCode}</td>
              <td className="p-2">{c.street}</td>
              <td className="p-2">{c.email}</td>
              <td className="p-2">{c.phone}</td>
              <td className="p-2">
                <span
                  className={
                    c.isActive
                      ? 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700'
                      : 'inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700'
                  }
                >
                  {c.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              <td className="p-2">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/management/customers/${c.id}/edit`}
                    className="px-2 py-1 border rounded text-xs text-blue-600 hover:bg-blue-50"
                  >
                    Bearbeiten
                  </Link>

                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deletingId === c.id}
                    className="px-2 py-1 border rounded text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {deletingId === c.id ? 'Lösche…' : 'Löschen'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
