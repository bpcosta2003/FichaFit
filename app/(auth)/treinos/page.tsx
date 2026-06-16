'use client';

import dynamic from 'next/dynamic';

// IndexedDB só existe no browser — desabilita SSR nas telas offline-first.
const FichaListagem = dynamic(
  () =>
    import('@/modules/fichas/presentation/FichaListagem').then((modulo) => modulo.FichaListagem),
  { ssr: false, loading: () => <p className="px-5 py-8 text-center text-texto-suave">Carregando…</p> }
);

export default function PaginaTreinos() {
  return <FichaListagem />;
}
