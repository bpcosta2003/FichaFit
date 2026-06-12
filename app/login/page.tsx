'use client';

import dynamic from 'next/dynamic';

const TelaLogin = dynamic(
  () => import('@/modules/auth/presentation/TelaLogin').then((modulo) => modulo.TelaLogin),
  { ssr: false, loading: () => <p className="px-4 py-8 text-center text-gray-500">Carregando…</p> }
);

export default function PaginaLogin() {
  return <TelaLogin />;
}
