'use client';

import { FormEvent, useState } from 'react';
import { saveAuth } from '@/lib/auth';
import { Eye, EyeOff } from 'lucide-react';

type LoginResponse = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/login/internal`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        throw new Error('Login fehlgeschlagen');
      }

      const data = (await res.json()) as LoginResponse;
      saveAuth({ token: data.accessToken, user: data.user });

      window.location.href = '/admin';
    } catch (err) {
      console.error(err);
      setError('Login fehlgeschlagen. Bitte Zugangsdaten prüfen.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="border border-blue-400/40 bg-black/40 
                   shadow-[0_0_20px_rgba(0,150,255,0.2)]
                   hover:shadow-[0_0_40px_rgba(0,150,255,0.4)]
                   transition-shadow duration-300
                   rounded-xl px-8 py-6 max-w-sm w-full space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Admin-Login</h1>

        {error && (
          <div className="border border-red-500 bg-red-50 text-red-700 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* EMAIL */}
        <div className="space-y-1">
          <label className="block text-sm">E-Mail</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2 
                       bg-white text-black placeholder-gray-500
                       border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {/* PASSWORD */}
        <div className="space-y-1 relative">
          <label className="block text-sm">Passwort</label>
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full rounded border px-3 py-2 
                       bg-white text-black placeholder-gray-500
                       border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-9 text-gray-600 hover:text-blue-400"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-500 text-white font-semibold py-2 
                     hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Anmelden…' : 'Anmelden'}
        </button>

        <p className="text-xs text-center text-gray-400 pt-2">
          Nur für interne Nutzer (Admin / Planung / Technik).
        </p>
      </form>
    </main>
  );
}
