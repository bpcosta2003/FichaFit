'use client';

import dynamic from 'next/dynamic';

const HistoricoPage = dynamic(
  () =>
    import('@/modules/historico/presentation/HistoricoPage').then(
      (modulo) => modulo.HistoricoPage
    ),
  { ssr: false, loading: () => <p className="px-4 py-8 text-center text-gray-500">Carregando…</p> }
);

export default function PaginaHistorico() {
  return <HistoricoPage />;
}
