"use client";

import { useEffect, useState } from "react";
import { loadAuth } from "@/lib/auth";

type Customer = {
  id: string;
  name: string;
  city?: string | null;
};

type Appointment = {
  id: string;
  startTime: string;
  endTime: string;
  title: string;
  customer: Customer;
};

export default function AppointmentsHistoryPage() {
  const [data, setData] = useState<Appointment[]>([]);

  useEffect(() => {
    const auth = loadAuth();
    if (!auth?.token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments/history`, {
      headers: {
        Authorization: `Bearer ${auth.token}`,
      },
    })
      .then((r) => r.json())
      .then((json) => setData(json));
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Vergangene Kundentermine</h1>

      <table className="w-full text-sm border border-slate-800">
        <thead className="bg-slate-900/60">
          <tr>
            <th className="px-3 py-2 text-left">Datum</th>
            <th className="px-3 py-2 text-left">Praxis</th>
            <th className="px-3 py-2 text-left">Ort</th>
            <th className="px-3 py-2 text-left">Titel</th>
          </tr>
        </thead>

        <tbody>
          {data.map((a) => (
            <tr key={a.id} className="border-t border-slate-800">
              <td className="px-3 py-2">
                {new Date(a.startTime).toLocaleString("de-DE")}
              </td>
              <td className="px-3 py-2">{a.customer?.name}</td>
              <td className="px-3 py-2">{a.customer?.city}</td>
              <td className="px-3 py-2">{a.title}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
