'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const navLinks = [
  { href: '/home', label: 'Home' },
  { href: '/gifts', label: 'Gifts' },
  { href: '/gallery', label: 'Gallery' },
];

export default function GuestNav() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-greige">
      <nav className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-display text-2xl text-green">T &amp; [Partner]</span>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`font-body text-base transition-colors ${
                pathname.startsWith(href)
                  ? 'text-green underline underline-offset-4'
                  : 'text-gray-700 hover:text-green'
              }`}
            >
              {label}
            </Link>
          ))}
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="font-body text-sm text-gray-500 hover:text-green transition-colors"
            >
              Log out
            </button>
          </form>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-gray-700"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/30"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="w-64 bg-cream h-full shadow-xl flex flex-col p-6 gap-6">
            <button
              className="self-end text-gray-500"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            >
              ✕
            </button>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setDrawerOpen(false)}
                className={`font-body text-lg ${
                  pathname.startsWith(href)
                    ? 'text-green underline underline-offset-4'
                    : 'text-gray-700'
                }`}
              >
                {label}
              </Link>
            ))}
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="font-body text-base text-gray-500 hover:text-green"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
