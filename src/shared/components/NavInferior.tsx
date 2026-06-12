'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const itens = [
  { rota: '/treinos', rotulo: 'Treinos', icone: '🏋️' },
  { rota: '/historico', rotulo: 'Histórico', icone: '📅' },
  { rota: '/exercicios', rotulo: 'Exercícios', icone: '📚' },
  { rota: '/perfil', rotulo: 'Perfil', icone: '👤' },
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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md">
        {itens.map((item) => {
          const ativo = pathname.startsWith(item.rota);
          return (
            <li key={item.rota} className="flex-1">
              <Link
                href={item.rota}
                aria-current={ativo ? 'page' : undefined}
                className={`flex min-h-toque flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium ${
                  ativo ? 'text-primaria-600' : 'text-gray-500'
                }`}
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {item.icone}
                </span>
                {item.rotulo}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
