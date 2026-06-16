'use client';

import dynamic from 'next/dynamic';

const HistoricoPage = dynamic(
  () =>
    import('@/modules/historico/presentation/HistoricoPage').then(
      (modulo) => modulo.HistoricoPage
    ),
  { ssr: false, loading: () => <p className="px-5 py-8 text-center text-texto-suave">Carregando…</p> }
);

export default function PaginaHistorico() {
  return <HistoricoPage />;
}
