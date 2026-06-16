'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const FichaTreinoPage = dynamic(
  () =>
    import('@/modules/sessao/presentation/FichaTreinoPage').then(
      (modulo) => modulo.FichaTreinoPage
    ),
  {
    ssr: false,
    loading: () => (
      <p className="px-5 py-8 text-center text-texto-suave">Carregando treino…</p>
    ),
  }
);

export default function PaginaSessaoAtiva() {
  const params = useParams<{ id: string }>();
  return <FichaTreinoPage fichaId={params.id} />;
}
