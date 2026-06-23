'use client';
import { useState, useTransition } from 'react';
import { verifyPassword, setGuestName } from '@/app/actions/auth';

export default function GateForm({ initialStep }: { initialStep: 1 | 2 }) {
  const [step, setStep] = useState<1 | 2>(initialStep);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePasswordSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await verifyPassword(formData);
      if ('error' in result) {
        setError(result.error ?? null);
      } else {
        setError(null);
        setStep(2);
      }
    });
  }

  function handleNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await setGuestName(formData);
      if (result && 'error' in result) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-greige p-8 md:p-10">
        <h1 className="font-display text-5xl md:text-7xl text-center text-green mb-2">
          You&apos;re Invited
        </h1>
        <p className="font-body text-center text-gray-500 text-sm mb-8">
          {step === 1 ? 'Enter the password to continue' : 'What is your name?'}
        </p>

        {step === 1 ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
              {isPending ? 'Checking…' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleNameSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="font-body text-sm text-gray-700 block mb-1">
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                required
                maxLength={50}
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
              {isPending ? 'Entering…' : 'View our celebration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
