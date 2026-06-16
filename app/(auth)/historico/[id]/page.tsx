'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const HistoricoDetalhe = dynamic(
  () =>
    import('@/modules/historico/presentation/HistoricoDetalhe').then(
      (modulo) => modulo.HistoricoDetalhe
    ),
  { ssr: false, loading: () => <p className="px-5 py-8 text-center text-texto-suave">Carregando…</p> }
);

export default function PaginaDetalheSessao() {
  const params = useParams<{ id: string }>();
  return <HistoricoDetalhe sessaoId={params.id} />;
}
