'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primaria' | 'secundaria' | 'perigo';

interface PropsBotaoGrande extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const estilos: Record<Variante, string> = {
  primaria:
    'gradiente-fogo text-black shadow-fogo active:brightness-95 disabled:opacity-40 disabled:shadow-none',
  secundaria:
    'bg-superficie-2 text-texto border border-borda active:bg-superficie disabled:opacity-40',
  perigo: 'bg-erro text-white active:brightness-90 disabled:opacity-50',
};

// Alvo principal mid-workout: ≥64px de altura, largura total.
// Tipografia de pôster: Oswald, caixa alta, espaçada.
export function BotaoGrande({
  variante = 'primaria',
  className = '',
  children,
  ...rest
}: PropsBotaoGrande) {
  return (
    <button
      className={`min-h-botao-grande w-full rounded-2xl px-6 font-titulo text-lg font-semibold uppercase tracking-wide transition-transform active:scale-[0.98] ${estilos[variante]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
