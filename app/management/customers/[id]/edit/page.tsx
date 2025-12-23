'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadAuth } from '@/lib/auth';
import type { CustomerListItem } from '@/lib/customers';

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [form, setForm] = useState({
    name: '',
    email: '',
    street: '',
    houseNumber: '',
    zipCode: '',
    city: '',
    phoneLandline: '',
    phoneMobile: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const auth = loadAuth();
      if (!auth || !id) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${id}`,
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        },
      );

      if (!res.ok) return;
      const c = (await res.json()) as CustomerListItem;

      // Straße in Straße + Hausnummer aufteilen (letztes Wort = Hausnummer, wenn passend)
      let street = c.street || '';
      let houseNumber = '';

      if (street) {
        const parts = street.trim().split(' ');
        if (parts.length > 1) {
          const last = parts[parts.length - 1];
          if (/^\d+[a-zA-Z0-9\-]*$/.test(last)) {
            houseNumber = last;
            street = parts.slice(0, -1).join(' ');
          }
        }
      }

      setForm({
        name: c.name || '',
        email: c.email || '',
        street,
        houseNumber,
        zipCode: c.zipCode || '',
        city: c.city || '',
        phoneLandline: c.phone || '',
        phoneMobile: '', // aktuell noch nicht aus dem Backend befüllt
      });
    };

    load();
  }, [id]);

  const update = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');

    const auth = loadAuth();
    if (!auth) {
      setMessage('Nicht angemeldet');
      return;
    }

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email || null,
          street: `${form.street} ${form.houseNumber}`.trim() || null,
          zipCode: form.zipCode || null,
          city: form.city || null,
          phone: form.phoneLandline || null,
          // phoneMobile könnte später separat gespeichert werden
        }),
      },
    );

    if (!res.ok) {
      setMessage('Speichern fehlgeschlagen');
      return;
    }
    
    setMessage('Kunde aktualisiert');
    
    // ✅ für Highlight in der Tabelle
    sessionStorage.setItem('customersLastEditedId', id);
    
    router.push('/management/customers');
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Kunde bearbeiten</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Praxisname"
          value={form.name}
          onChange={e => update('name', e.target.value)}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="E-Mail"
          type="email"
          value={form.email}
          onChange={e => update('email', e.target.value)}
        />
        <div className="grid grid-cols-[2fr,1fr] gap-2">
          <input
            className="border px-3 py-2 rounded"
            placeholder="Straße"
            value={form.street}
            onChange={e => update('street', e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded"
            placeholder="Hausnummer"
            value={form.houseNumber}
            onChange={e => update('houseNumber', e.target.value)}
          />
        </div>
        <input
          className="border px-3 py-2 rounded"
          placeholder="PLZ"
          value={form.zipCode}
          onChange={e => update('zipCode', e.target.value)}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Ort"
          value={form.city}
          onChange={e => update('city', e.target.value)}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Festnetznummer"
          value={form.phoneLandline}
          onChange={e => update('phoneLandline', e.target.value)}
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="Mobilnummer"
          value={form.phoneMobile}
          onChange={e => update('phoneMobile', e.target.value)}
        />
        <button type="submit" className="border px-3 py-2 rounded mt-2">
          Speichern
        </button>
      </form>
      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
