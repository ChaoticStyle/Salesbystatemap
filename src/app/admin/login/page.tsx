'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#595959]">
      <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4 rounded-lg bg-black/30 p-6">
        <h1 className="text-xl font-bold text-white">Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="rounded-md bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="rounded-md bg-white/10 px-3 py-2 text-white placeholder:text-white/40"
        />
        {error && <div className="rounded bg-red-900/60 px-3 py-2 text-sm text-red-100">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
