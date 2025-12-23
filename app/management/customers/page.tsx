'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();

  const [auth, setAuth] = useState<AuthData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [highlightId, setHighlightId] = useState<string | null>(null);

  function goEdit(id: string) {
    sessionStorage.setItem('customersScrollY', String(window.scrollY));
    sessionStorage.setItem('customersLastId', id);
    router.push(`/management/customers/${id}/edit`);
  }

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
      headers: { Authorization: `Bearer ${a.token}` },
      cache: 'no-store',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(setCustomers)
      .catch((e) => setError(e.message ?? 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, []);

  // Scroll-Restore
  useEffect(() => {
    if (loading) return;

    const id = sessionStorage.getItem('customersLastId');
    if (!id) return;

    requestAnimationFrame(() => {
      document
        .getElementById(`customer-row-${id}`)
        ?.scrollIntoView({ block: 'center' });
    });

    sessionStorage.removeItem('customersLastId');
    sessionStorage.removeItem('customersScrollY');
  }, [loading, customers.length]);

  // Highlight nach Edit
  useEffect(() => {
    if (loading) return;

    const editedId = sessionStorage.getItem('customersLastEditedId');
    if (!editedId) return;

    setHighlightId(editedId);
    sessionStorage.removeItem('customersLastEditedId');
  }, [loading]);

  // Highlight beim ersten Klick entfernen
  useEffect(() => {
    if (!highlightId) return;
    const clear = () => setHighlightId(null);
    window.addEventListener('mousedown', clear, { once: true });
    return () => window.removeEventListener('mousedown', clear);
  }, [highlightId]);

  async function handleDelete(id: string) {
    if (!auth) return;
    if (!confirm('Kunde wirklich löschen?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${auth.token}` },
        },
      );
      if (!res.ok) throw new Error(await res.text());
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Löschen fehlgeschlagen.');
    } finally {
      setDeletingId(null);
    }
  }

  if (!auth) return <div className="p-4">Prüfe Anmeldung …</div>;
  if (loading) return <div className="p-4">Lade Kunden …</div>;
  if (error) return <div className="p-4 text-red-600">Fehler: {error}</div>;

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
          {customers.map((c) => {
            const isHighlight = highlightId === c.id;

            return (
              <tr
                key={c.id}
                id={`customer-row-${c.id}`}
                className={`border-b ${
                  isHighlight ? 'bg-green-100 text-green-900' : ''
                }`}
              >
                <td className="p-2 font-medium">{c.name}</td>
                <td className="p-2">{c.city}</td>
                <td className="p-2">{c.zipCode}</td>
                <td className="p-2">{c.street}</td>
                <td className="p-2">{c.email}</td>
                <td className="p-2">{c.phone}</td>

                <td className="p-2">
                  <span
                    className={
                      c.isActive
                        ? isHighlight
                          ? 'inline-flex rounded-full bg-green-200 px-2 py-0.5 text-xs font-semibold text-green-900'
                          : 'inline-flex rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700'
                        : isHighlight
                        ? 'inline-flex rounded-full bg-red-200 px-2 py-0.5 text-xs font-semibold text-red-900'
                        : 'inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700'
                    }
                  >
                    {c.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>

                <td className="p-2">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => goEdit(c.id)}
                      className={`px-2 py-1 border rounded text-xs ${
                        isHighlight
                          ? 'text-green-900 border-green-400 hover:bg-green-200'
                          : 'text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      Bearbeiten
                    </button>

                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className={`px-2 py-1 border rounded text-xs disabled:opacity-50 ${
                        isHighlight
                          ? 'text-red-900 border-red-400 hover:bg-red-200'
                          : 'text-red-600 hover:bg-red-50'
                      }`}
                    >
                      {deletingId === c.id ? 'Lösche…' : 'Löschen'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
