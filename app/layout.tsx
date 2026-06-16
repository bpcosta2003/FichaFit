import type { Metadata, Viewport } from 'next';

import { fonteNumero, fonteTexto, fonteTitulo } from './fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'FichaFit',
  description: 'Suas fichas de treino, na palma da mão — mesmo sem internet.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'FichaFit',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: '#121010',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

// Aplica o tema salvo antes do paint — evita flash de tema errado (FOUC).
// Espelha a lógica de src/shared/hooks/useTema.ts (escuro é o padrão).
const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem('fichafit:tema')||'escuro';var e=p==='escuro'||(p==='sistema'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('tema-claro',!e);}catch(_){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: o script de tema e extensões de navegador
  // alteram <html>/<body> antes da hidratação. Suprime o aviso só nesses
  // elementos — não mascara mismatches reais na árvore.
  return (
    <html
      lang="pt-BR"
      className={`${fonteTitulo.variable} ${fonteNumero.variable} ${fonteTexto.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
