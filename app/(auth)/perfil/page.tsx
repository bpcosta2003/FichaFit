'use client';

import dynamic from 'next/dynamic';

const PerfilPage = dynamic(
  () => import('@/modules/auth/presentation/PerfilPage').then((modulo) => modulo.PerfilPage),
  { ssr: false, loading: () => <p className="px-5 py-8 text-center text-texto-suave">Carregando…</p> }
);

export default function PaginaPerfil() {
  return <PerfilPage />;
}
