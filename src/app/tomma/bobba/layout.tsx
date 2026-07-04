import { adminLogout } from '@/app/actions/admin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-white border-b border-greige flex items-center justify-between px-6 py-3">
        <span className="font-body font-semibold text-green text-lg">Admin Panel</span>
        <form action={adminLogout}>
          <button
            type="submit"
            className="font-body text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            Log out
          </button>
        </form>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
