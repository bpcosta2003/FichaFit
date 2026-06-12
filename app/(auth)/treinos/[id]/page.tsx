'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const FichaDetalhe = dynamic(
  () =>
    import('@/modules/fichas/presentation/FichaDetalhe').then((modulo) => modulo.FichaDetalhe),
  { ssr: false, loading: () => <p className="px-4 py-8 text-center text-gray-500">Carregando…</p> }
);

export default function PaginaDetalheFicha() {
  const params = useParams<{ id: string }>();
  return <FichaDetalhe fichaId={params.id} />;
}
