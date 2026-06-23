'use client';
import { useState, useTransition } from 'react';
import { adminLogin } from '@/app/actions/admin';

export default function AdminLoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await adminLogin(formData);
      if (result && 'error' in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-greige p-8 md:p-10">
        <h1 className="font-display text-5xl md:text-6xl text-center text-green mb-1">
          Admin
        </h1>
        <p className="font-body text-center text-gray-500 text-sm mb-8">Admin access</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="font-body text-sm text-gray-700 block mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full border border-greige rounded-lg px-4 py-2.5 font-body text-base focus:outline-none focus:ring-2 focus:ring-green focus:border-transparent"
            />
          </div>
          {error && (
            <p className="font-body text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-green hover:bg-green-light text-white font-body font-semibold rounded-lg py-2.5 transition-colors disabled:opacity-60"
          >
            {isPending ? 'Checking…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  );
}
