"use client";

import { useEffect, useState } from "react";
import { loadAuth } from "@/lib/auth";

type Customer = {
  id: string;
  name: string;
  city?: string | null;
};

type DueItem = {
  customerId: string;
  customer: Customer;
  lastStartTime: string;
  dueDate: string;
  quarter: string;
};

export default function DueAppointmentsPage() {
  const [data, setData] = useState<DueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = loadAuth();
    if (!auth?.token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments/due`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })
      .then(async (r) => {
        const json = await r.json();
        console.log("DUE RESPONSE", json); // zum Debuggen in der Browserkonsole

        if (!r.ok) {
          setError(
            typeof json === "object" && json?.message
              ? String(json.message)
              : "Fehler beim Laden der Fälligkeiten"
          );
          return;
        }

        if (Array.isArray(json)) {
          setData(json);
        } else {
          setError("API /appointments/due liefert kein Array.");
        }
      })
      .catch((e) => {
        console.error(e);
        setError("Netzwerk- oder Serverfehler.");
      });
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">
        Fällige Prüfungen (12 Monate nach letzter Prüfung)
      </h1>

      {error && (
        <div className="mb-4 rounded border border-red-500/60 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <table className="w-full text-sm border border-slate-800">
        <thead className="bg-slate-900/60">
          <tr>
            <th className="px-3 py-2 text-left">Praxis</th>
            <th className="px-3 py-2 text-left">Ort</th>
            <th className="px-3 py-2 text-left">Letzte Prüfung</th>
            <th className="px-3 py-2 text-left">Nächste Fälligkeit</th>
            <th className="px-3 py-2 text-left">Quartal</th>
          </tr>
        </thead>

        <tbody>
            {data.map((item, index) => (
                <tr
                key={`${item.customerId}-${item.dueDate}-${index}`}
                className="border-t border-slate-800"
                >
                <td className="px-3 py-2">{item.customer?.name}</td>
                <td className="px-3 py-2">{item.customer?.city}</td>
                <td className="px-3 py-2">
                    {new Date(item.lastStartTime).toLocaleDateString("de-DE")}
                </td>
                <td className="px-3 py-2">
                    {new Date(item.dueDate).toLocaleDateString("de-DE")}
                </td>
                <td className="px-3 py-2">{item.quarter}</td>
                </tr>
            ))}
        </tbody>
      </table>
    </main>
  );
}
