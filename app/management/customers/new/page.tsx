'use client';

import { FormEvent, useState } from 'react';
import { loadAuth } from '@/lib/auth';

type FormState = {
  praxisname: string;
  email: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  phoneLandline: string;
  phoneMobile: string;
};

export default function NewCustomerPage() {
  const [form, setForm] = useState<FormState>({
    praxisname: '',
    email: '',
    street: '',
    houseNumber: '',
    zipCode: '',
    city: '',
    phoneLandline: '',
    phoneMobile: '',
  });
  const [message, setMessage] = useState('');

  const update = (field: keyof FormState, value: string) =>
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
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          name: form.praxisname,
          email: form.email || null,
          street: `${form.street} ${form.houseNumber}`.trim() || null,
          zipCode: form.zipCode || null,
          city: form.city || null,
          phone: form.phoneLandline || null,
        }),
      },
    );

    if (!res.ok) {
      setMessage('Speichern fehlgeschlagen');
      return;
    }

    setMessage('Kunde erfolgreich angelegt');
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Neukundeneintrag</h1>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
        <input
          className="border px-3 py-2 rounded"
          placeholder="Praxisname"
          value={form.praxisname}
          onChange={e => update('praxisname', e.target.value)}
          required
        />
        <input
          className="border px-3 py-2 rounded"
          placeholder="E-Mail"
          type="email"
          value={form.email}
          onChange={e => update('email', e.target.value)}
        />
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
        <input
          className="border px-3 py-2 rounded"
          placeholder="Postleitzahl"
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
