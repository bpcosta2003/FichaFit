'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const HistoricoDetalhe = dynamic(
  () =>
    import('@/modules/historico/presentation/HistoricoDetalhe').then(
      (modulo) => modulo.HistoricoDetalhe
    ),
  { ssr: false, loading: () => <p className="px-4 py-8 text-center text-gray-500">Carregando…</p> }
);

export default function PaginaDetalheSessao() {
  const params = useParams<{ id: string }>();
  return <HistoricoDetalhe sessaoId={params.id} />;
}
