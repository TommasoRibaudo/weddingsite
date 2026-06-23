import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'You\'re Invited',
  description: 'A private wedding celebration',
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
