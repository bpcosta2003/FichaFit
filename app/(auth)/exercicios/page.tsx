'use client';

import dynamic from 'next/dynamic';

const BibliotecaExercicios = dynamic(
  () =>
    import('@/modules/exercicios/presentation/BibliotecaExercicios').then(
      (modulo) => modulo.BibliotecaExercicios
    ),
  { ssr: false, loading: () => <p className="px-4 py-8 text-center text-gray-500">Carregando…</p> }
);

export default function PaginaExercicios() {
  return <BibliotecaExercicios />;
}
