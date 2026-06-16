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
  // suppressHydrationWarning: extensões de navegador (ex: LanguageTool, que
  // injeta data-lt-installed) alteram <html>/<body> antes da hidratação.
  // Suprime o aviso apenas nesses elementos — não mascara mismatches reais na árvore.
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
