'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

// Ícones de linha (line icons) — estilo pôster, herdam currentColor.
const icones: Record<string, ReactNode> = {
  treinos: (
    <path d="M6.5 7v10M17.5 7v10M4 9.5h2.5M17.5 9.5H20M4 14.5h2.5M17.5 14.5H20M6.5 12h11" />
  ),
  historico: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 9h16M8 3v4M16 3v4" />
    </>
  ),
  exercicios: (
    <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V4zM5 16h13" />
  ),
  perfil: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
    </>
  ),
};

const itens = [
  { rota: '/treinos', rotulo: 'Treinos', icone: 'treinos' },
  { rota: '/historico', rotulo: 'Histórico', icone: 'historico' },
  { rota: '/exercicios', rotulo: 'Exercícios', icone: 'exercicios' },
  { rota: '/perfil', rotulo: 'Perfil', icone: 'perfil' },
];

// Bottom navigation — oculta em /sessao para maximizar espaço.
export function NavInferior() {
  const pathname = usePathname();
  if (pathname.includes('/sessao')) {
    return null;
  }
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-superficie pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md">
        {itens.map((item) => {
          const ativo = pathname.startsWith(item.rota);
          return (
            <li key={item.rota} className="flex-1">
              <Link
                href={item.rota}
                aria-current={ativo ? 'page' : undefined}
                className={`flex min-h-toque flex-col items-center justify-center gap-1 py-2 text-[0.7rem] font-semibold uppercase tracking-wide ${
                  ativo ? 'text-fogo' : 'text-texto-suave'
                }`}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6"
                >
                  {icones[item.icone]}
                </svg>
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
