'use client';

import dynamic from 'next/dynamic';

const BibliotecaExercicios = dynamic(
  () =>
    import('@/modules/exercicios/presentation/BibliotecaExercicios').then(
      (modulo) => modulo.BibliotecaExercicios
    ),
  { ssr: false, loading: () => <p className="px-5 py-8 text-center text-texto-suave">Carregando…</p> }
);

export default function PaginaExercicios() {
  return <BibliotecaExercicios />;
}
