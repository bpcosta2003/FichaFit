'use client';

import { useTema, type PreferenciaTema } from '@/shared/hooks/useTema';

const OPCOES: { valor: PreferenciaTema; rotulo: string }[] = [
  { valor: 'sistema', rotulo: 'Sistema' },
  { valor: 'claro', rotulo: 'Claro' },
  { valor: 'escuro', rotulo: 'Escuro' },
];

// Toggle segmentado de tema (estilo iOS). Usado no Perfil.
export function SeletorTema() {
  const { preferencia, definir } = useTema();
  return (
    <div
      role="radiogroup"
      aria-label="Tema do aplicativo"
      className="flex gap-1 rounded-xl border border-borda bg-superficie-2 p-1"
    >
      {OPCOES.map((opcao) => {
        const ativo = preferencia === opcao.valor;
        return (
          <button
            key={opcao.valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => definir(opcao.valor)}
            className={`min-h-toque flex-1 rounded-lg text-sm font-semibold transition-colors ${
              ativo ? 'gradiente-fogo text-sobre-fogo' : 'text-texto-suave active:bg-superficie'
            }`}
          >
            {opcao.rotulo}
          </button>
        );
      })}
    </div>
  );
}
