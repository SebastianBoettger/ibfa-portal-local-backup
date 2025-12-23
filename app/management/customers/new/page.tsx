'use client';

import { FormEvent, useState } from 'react';
import { loadAuth } from '@/lib/auth';

type FormState = {
  legacyId: string;     // Kd.-Nr Eingabe als String (wir parsen zu number)
  isActive: 'true' | 'false';

  praxisname: string;
  email: string;
  street: string;
  houseNumber: string;
  zipCode: string;
  city: string;
  phoneLandline: string;
  phoneMobile: string; // aktuell noch nicht gespeichert
};

export default function NewCustomerPage() {
  const [form, setForm] = useState<FormState>({
    legacyId: '',
    isActive: 'true',

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
  const [saving, setSaving] = useState(false);

  const update = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);

    const auth = loadAuth();
    if (!auth) {
      setMessage('Nicht angemeldet');
      setSaving(false);
      return;
    }

    // legacyId parsen
    const legacyTrim = form.legacyId.trim();
    let legacyId: number | null = null;
    if (legacyTrim !== '') {
      const n = Number(legacyTrim);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) {
        setMessage('Kd.-Nr muss eine ganze Zahl sein');
        setSaving(false);
        return;
      }
      legacyId = n;
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      body: JSON.stringify({
        name: form.praxisname,
        email: form.email.trim() || null,
        street: `${form.street} ${form.houseNumber}`.trim() || null,
        zipCode: form.zipCode.trim() || null,
        city: form.city.trim() || null,
        phone: form.phoneLandline.trim() || null,

        // NEU:
        legacyId, // Kd.-Nr
        isActive: form.isActive === 'true',
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      setMessage(text || 'Speichern fehlgeschlagen');
      setSaving(false);
      return;
    }

    setMessage('Kunde erfolgreich angelegt');
    setSaving(false);

    // optional: Formular leeren
    // setForm({ ...initial });
  };

  return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-semibold">Neukundeneintrag</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
        <div className="grid grid-cols-[1fr,1fr] gap-2">
          <input
            className="border px-3 py-2 rounded"
            placeholder="Kd.-Nr (optional)"
            value={form.legacyId}
            onChange={(e) => update('legacyId', e.target.value)}
            inputMode="numeric"
          />

          <select
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
            value={form.isActive}
            onChange={(e) => update('isActive', e.target.value)}
          >
            <option className="text-black" value="true">Aktiv</option>
            <option className="text-black" value="false">Inaktiv</option>
          </select>
        </div>

        <input
          className="border px-3 py-2 rounded"
          placeholder="Praxisname"
          value={form.praxisname}
          onChange={(e) => update('praxisname', e.target.value)}
          required
        />

        <input
          className="border px-3 py-2 rounded"
          placeholder="E-Mail"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
        />

        <div className="grid grid-cols-[2fr,1fr] gap-2">
          <input
            className="border px-3 py-2 rounded"
            placeholder="Straße"
            value={form.street}
            onChange={(e) => update('street', e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded"
            placeholder="Hausnummer"
            value={form.houseNumber}
            onChange={(e) => update('houseNumber', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-[1fr,2fr] gap-2">
          <input
            className="border px-3 py-2 rounded"
            placeholder="Postleitzahl"
            value={form.zipCode}
            onChange={(e) => update('zipCode', e.target.value)}
          />
          <input
            className="border px-3 py-2 rounded"
            placeholder="Ort"
            value={form.city}
            onChange={(e) => update('city', e.target.value)}
          />
        </div>

        <input
          className="border px-3 py-2 rounded"
          placeholder="Festnetznummer"
          value={form.phoneLandline}
          onChange={(e) => update('phoneLandline', e.target.value)}
        />

        <input
          className="border px-3 py-2 rounded"
          placeholder="Mobilnummer (noch nicht gespeichert)"
          value={form.phoneMobile}
          onChange={(e) => update('phoneMobile', e.target.value)}
        />

        <button
          type="submit"
          disabled={saving}
          className="border px-3 py-2 rounded mt-2 disabled:opacity-50"
        >
          {saving ? 'Speichere…' : 'Speichern'}
        </button>
      </form>

      {message && <p className="text-sm">{message}</p>}
    </div>
  );
}
