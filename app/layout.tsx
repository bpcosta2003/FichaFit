import type { Metadata, Viewport } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: 'FichaFit',
  description: 'Suas fichas de treino, na palma da mão — mesmo sem internet.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'FichaFit',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#8B5CF6',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">{children}</body>
    </html>
  );
}
