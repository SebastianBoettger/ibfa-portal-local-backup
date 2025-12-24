'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadAuth, type AuthData } from '@/lib/auth';

type Customer = {
  id: string;
  legacyId: number | null; // Kd.-Nr
  name: string;
  street: string | null;
  zipCode: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
  isActive: boolean;
};

type SortKey = 'name' | 'city' | 'zipCode' | 'legacyId' | 'isActive';
type SortDir = 'asc' | 'desc';
type StatusFilter = 'all' | 'active' | 'inactive';

type EditableField = 'legacyId' | 'name' | 'city' | 'zipCode' | 'street' | 'email' | 'phone';
type DraftValue = string;

const ALL_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'city', label: 'Ort' },
  { key: 'zipCode', label: 'PLZ' },
  { key: 'street', label: 'Straße' },
  { key: 'email', label: 'E-Mail' },
  { key: 'phone', label: 'Telefon' },
  { key: 'legacyId', label: 'Kd.-Nr' },
  { key: 'isActive', label: 'Status' },
  { key: 'actions', label: 'Aktionen' },
] as const;

type ColumnKey = typeof ALL_COLUMNS[number]['key'];
const COL_STORAGE_KEY = 'customers_visible_columns_v1';

export default function CustomersPage() {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  const [auth, setAuth] = useState<AuthData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Highlight nach Rückkehr aus Edit
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Filter/Sort
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Spalten sichtbar
  const [visibleCols, setVisibleCols] = useState<Record<ColumnKey, boolean>>(() => {
    const defaults = Object.fromEntries(ALL_COLUMNS.map((c) => [c.key, true])) as Record<ColumnKey, boolean>;
    return defaults;
  });

  // Inline edit
  const [editing, setEditing] = useState<{ id: string; field: EditableField } | null>(null);
  const [draft, setDraft] = useState<DraftValue>('');
  const [savingKey, setSavingKey] = useState<string | null>(null); // `${id}:${field}`

  // visibleCols aus localStorage laden + speichern
  useEffect(() => {
    try {
      const raw = localStorage.getItem(COL_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<ColumnKey, boolean>>;
      setVisibleCols((prev) => ({ ...prev, ...parsed }));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(COL_STORAGE_KEY, JSON.stringify(visibleCols));
    } catch {}
  }, [visibleCols]);

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
      .then((data: Customer[]) => setCustomers(data))
      .catch((e) => setError(e.message ?? 'Fehler beim Laden'))
      .finally(() => setLoading(false));
  }, [baseUrl]);

  // Scroll/Row-Restore nach Rückkehr aus "Edit"
  useEffect(() => {
    if (loading) return;

    const id = sessionStorage.getItem('customersLastId');
    if (!id) return;

    requestAnimationFrame(() => {
      document.getElementById(`customer-row-${id}`)?.scrollIntoView({ block: 'center' });
    });

    sessionStorage.removeItem('customersLastId');
    sessionStorage.removeItem('customersScrollY');
  }, [loading, customers.length]);

  // Highlight-ID aus Edit übernehmen
  useEffect(() => {
    if (loading) return;

    const editedId = sessionStorage.getItem('customersLastEditedId');
    if (!editedId) return;

    setHighlightId(editedId);
    sessionStorage.removeItem('customersLastEditedId');
  }, [loading]);

  // Highlight verschwindet beim ersten Mausklick
  useEffect(() => {
    if (!highlightId) return;

    const clear = () => setHighlightId(null);
    window.addEventListener('mousedown', clear, { once: true });
    return () => window.removeEventListener('mousedown', clear);
  }, [highlightId]);

  async function handleDelete(id: string) {
    if (!auth || !baseUrl) return;
    if (!confirm('Kunde wirklich löschen?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`${baseUrl}/customers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Löschen fehlgeschlagen.');
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(id: string) {
    if (!auth || !baseUrl) return;

    const current = customers.find((c) => c.id === id);
    if (!current) return;

    const next = !current.isActive;

    // optimistic
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: next } : c)));

    try {
      const res = await fetch(`${baseUrl}/customers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch {
      // rollback
      setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, isActive: current.isActive } : c)));
      alert('Status ändern fehlgeschlagen.');
    }
  }

  // Inline edit helpers
  function getValue(c: Customer, field: EditableField): string {
    if (field === 'legacyId') return c.legacyId == null ? '' : String(c.legacyId);
    const v = c[field];
    return v == null ? '' : String(v);
  }

  function startEdit(c: Customer, field: EditableField) {
    setEditing({ id: c.id, field });
    setDraft(getValue(c, field));
  }

  function cancelEdit() {
    setEditing(null);
    setDraft('');
  }

  function normalizePatch(field: EditableField, value: string): any {
    if (field === 'legacyId') {
      const v = value.trim();
      if (!v) return { legacyId: null };
      const n = Number(v);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0) throw new Error('Kd.-Nr muss eine ganze Zahl sein');
      return { legacyId: n };
    }

    const v = value.trim();
    return { [field]: v === '' ? null : v };
  }

  async function saveEdit() {
    if (!editing || !auth || !baseUrl) return;

    const { id, field } = editing;
    const key = `${id}:${field}`;

    const current = customers.find((c) => c.id === id);
    if (!current) return;

    const oldVal = getValue(current, field);
    if (draft === oldVal) {
      cancelEdit();
      return;
    }

    let patch: any;
    try {
      patch = normalizePatch(field, draft);
    } catch (e: any) {
      alert(e?.message ?? 'Ungültiger Wert');
      return;
    }

    const before = current;
    setSavingKey(key);

    // optimistic update
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (field === 'legacyId') return { ...c, legacyId: patch.legacyId };
        return { ...c, [field]: patch[field] };
      }),
    );

    try {
      const res = await fetch(`${baseUrl}/customers/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(await res.text());
      cancelEdit();
    } catch {
      // rollback
      setCustomers((prev) => prev.map((c) => (c.id === id ? before : c)));
      alert('Speichern fehlgeschlagen.');
    } finally {
      setSavingKey(null);
    }
  }

  const visibleCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = customers.filter((c) => {
      if (statusFilter === 'active' && !c.isActive) return false;
      if (statusFilter === 'inactive' && c.isActive) return false;

      if (!q) return true;

      const legacy = c.legacyId == null ? '' : String(c.legacyId);
      const hay = [
        c.name ?? '',
        c.city ?? '',
        c.zipCode ?? '',
        c.street ?? '',
        c.email ?? '',
        c.phone ?? '',
        legacy, // Suche inkl. Kundennummer
      ]
        .join(' ')
        .toLowerCase();

      return hay.includes(q);
    });

    const dir = sortDir === 'asc' ? 1 : -1;
    const str = (v: string | null | undefined) => (v ?? '').toLowerCase();

    const sorted = [...filtered].sort((a, b) => {
      if (sortKey === 'name') return dir * str(a.name).localeCompare(str(b.name), 'de');
      if (sortKey === 'city') return dir * str(a.city).localeCompare(str(b.city), 'de');
      if (sortKey === 'zipCode') return dir * str(a.zipCode).localeCompare(str(b.zipCode), 'de');

      if (sortKey === 'legacyId') {
        const av = a.legacyId ?? Number.POSITIVE_INFINITY;
        const bv = b.legacyId ?? Number.POSITIVE_INFINITY;
        return dir * (av - bv);
      }

      if (sortKey === 'isActive') {
        const av = a.isActive ? 1 : 0;
        const bv = b.isActive ? 1 : 0;
        return dir * (bv - av);
      }

      return 0;
    });

    return sorted;
  }, [customers, query, statusFilter, sortKey, sortDir]);

  const isEditing = (id: string, field: EditableField) => editing?.id === id && editing?.field === field;

  const Cell = ({ c, field }: { c: Customer; field: EditableField }) => {
    const edit = isEditing(c.id, field);
    const key = `${c.id}:${field}`;
    const saving = savingKey === key;

    const display = getValue(c, field);

    if (!edit) {
      return (
        <button type="button" onClick={() => startEdit(c, field)} className="w-full text-left" title="Klicken zum Bearbeiten">
          <span className="inline-flex items-center gap-2">
            <span>{display}</span>
            {saving ? <span className="text-xs text-gray-400">Speichere…</span> : null}
          </span>
        </button>
      );
    }

    return (
      <input
        autoFocus
        className="w-full border rounded px-2 py-1 text-sm bg-white text-black"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => saveEdit()}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveEdit();
          if (e.key === 'Escape') cancelEdit();
        }}
      />
    );
  };

  if (!auth) return <div className="p-4">Prüfe Anmeldung …</div>;
  if (loading) return <div className="p-4">Lade Kunden …</div>;
  if (error) return <div className="p-4 text-red-600">Fehler: {error}</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold">Kunden</h1>

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Suche</label>
            <input
              className="border rounded px-3 py-2 text-sm w-72 bg-white text-black"
              placeholder="Name, Ort, PLZ, Straße, E-Mail, Telefon, Kd.-Nr"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Status</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option className="text-black" value="all">Alle</option>
              <option className="text-black" value="active">Nur Aktiv</option>
              <option className="text-black" value="inactive">Nur Inaktiv</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Sortierung</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              <option className="text-black" value="name">Name</option>
              <option className="text-black" value="city">Ort</option>
              <option className="text-black" value="zipCode">PLZ</option>
              <option className="text-black" value="legacyId">Kd.-Nr</option>
              <option className="text-black" value="isActive">Status</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Richtung</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-black"
              value={sortDir}
              onChange={(e) => setSortDir(e.target.value as SortDir)}
            >
              <option className="text-black" value="asc">A→Z / klein→groß</option>
              <option className="text-black" value="desc">Z→A / groß→klein</option>
            </select>
          </div>

          {/* Spalten-Auswahl */}
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-600">Spalten</label>
            <details className="border border-gray-300 rounded px-3 py-2 bg-white text-black">
              <summary className="cursor-pointer text-sm select-none">Auswählen</summary>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {ALL_COLUMNS.map((col) => (
                  <label key={col.key} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={visibleCols[col.key]}
                      onChange={() => setVisibleCols((prev) => ({ ...prev, [col.key]: !prev[col.key] }))}
                    />
                    {col.label}
                  </label>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Tipp: Klick auf eine Zelle zum Bearbeiten. Enter = speichern, ESC = abbrechen. Status-Badge klickbar.
      </div>

      <table className="min-w-full border text-sm">
        <thead>
          <tr className="border-b">
            {visibleCols.name && <th className="p-2 text-left">Name</th>}
            {visibleCols.city && <th className="p-2 text-left">Ort</th>}
            {visibleCols.zipCode && <th className="p-2 text-left">PLZ</th>}
            {visibleCols.street && <th className="p-2 text-left">Straße</th>}
            {visibleCols.email && <th className="p-2 text-left">E-Mail</th>}
            {visibleCols.phone && <th className="p-2 text-left">Telefon</th>}
            {visibleCols.legacyId && <th className="p-2 text-left">Kd.-Nr</th>}
            {visibleCols.isActive && <th className="p-2 text-left">Status</th>}
            {visibleCols.actions && <th className="p-2 text-left">Aktionen</th>}
          </tr>
        </thead>

        <tbody>
          {visibleCustomers.map((c) => {
            const isHighlight = highlightId === c.id;

            return (
              <tr id={`customer-row-${c.id}`} key={c.id} className={`border-b ${isHighlight ? 'bg-green-100 text-green-900' : ''}`}>
                {visibleCols.name && (
                  <td className="p-2 font-medium">
                    <Cell c={c} field="name" />
                  </td>
                )}
                {visibleCols.city && (
                  <td className="p-2">
                    <Cell c={c} field="city" />
                  </td>
                )}
                {visibleCols.zipCode && (
                  <td className="p-2">
                    <Cell c={c} field="zipCode" />
                  </td>
                )}
                {visibleCols.street && (
                  <td className="p-2">
                    <Cell c={c} field="street" />
                  </td>
                )}
                {visibleCols.email && (
                  <td className="p-2">
                    <Cell c={c} field="email" />
                  </td>
                )}
                {visibleCols.phone && (
                  <td className="p-2">
                    <Cell c={c} field="phone" />
                  </td>
                )}
                {visibleCols.legacyId && (
                  <td className="p-2">
                    <Cell c={c} field="legacyId" />
                  </td>
                )}

                {visibleCols.isActive && (
                  <td className="p-2">
                    <button type="button" onClick={() => toggleActive(c.id)} title="Klicken zum Umschalten">
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
                    </button>
                  </td>
                )}

                {visibleCols.actions && (
                  <td className="p-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => goEdit(c.id)}
                        className={
                          isHighlight
                            ? 'px-2 py-1 border border-green-400 rounded text-xs font-semibold text-green-900 hover:bg-green-200'
                            : 'px-2 py-1 border rounded text-xs text-blue-600 hover:bg-blue-50'
                        }
                      >
                        Bearbeiten
                      </button>

                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deletingId === c.id}
                        className={
                          isHighlight
                            ? 'px-2 py-1 border border-red-400 rounded text-xs font-semibold text-red-900 hover:bg-red-200 disabled:opacity-50'
                            : 'px-2 py-1 border rounded text-xs text-red-600 hover:bg-red-50 disabled:opacity-50'
                        }
                      >
                        {deletingId === c.id ? 'Lösche…' : 'Löschen'}
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="text-xs text-gray-500">
        Treffer: {visibleCustomers.length} / {customers.length}
      </div>
    </div>
  );
}
