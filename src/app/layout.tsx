import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/components/LanguageProvider';

export const metadata: Metadata = {
  title: 'Tommaso & Melissa',
  description: 'Una celebración privada de boda',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-full">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
