'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primaria' | 'secundaria' | 'perigo';
type Tamanho = 'grande' | 'medio';

interface PropsBotaoGrande extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: Tamanho;
}

const estilos: Record<Variante, string> = {
  primaria: 'gradiente-fogo text-sobre-fogo active:brightness-95 disabled:opacity-40',
  secundaria:
    'bg-superficie-2 text-texto border border-borda active:bg-superficie disabled:opacity-40',
  perigo: 'bg-erro text-white active:brightness-90 disabled:opacity-50',
};

// 'grande' (64px) é o alvo principal mid-workout exigido pelo CLAUDE.md
// (ex.: "Registrar Série"). 'medio' (48px) é para ações secundárias —
// modais, formulários, "Cancelar" — para não dominar a tela.
const tamanhos: Record<Tamanho, string> = {
  grande: 'min-h-botao-grande text-lg',
  medio: 'min-h-toque text-base',
};

// Botão de largura total, tipografia de pôster: Oswald, caixa alta, espaçada.
export function BotaoGrande({
  variante = 'primaria',
  tamanho = 'grande',
  className = '',
  children,
  ...rest
}: PropsBotaoGrande) {
  return (
    <button
      className={`w-full rounded-2xl px-6 font-titulo font-semibold uppercase tracking-wide transition-transform active:scale-[0.98] ${tamanhos[tamanho]} ${estilos[variante]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
