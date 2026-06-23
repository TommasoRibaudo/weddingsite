import GuestNav from '@/components/GuestNav';

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <GuestNav />
      <main className="flex-1">{children}</main>
      <footer className="py-6 text-center font-body text-sm text-gray-500 border-t border-greige">
        Tommaso &amp; [Partner] &middot; 2026
      </footer>
    </div>
  );
}
