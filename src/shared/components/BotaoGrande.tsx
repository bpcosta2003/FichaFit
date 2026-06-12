'use client';

import type { ButtonHTMLAttributes } from 'react';

type Variante = 'primaria' | 'secundaria' | 'perigo';

interface PropsBotaoGrande extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
}

const estilos: Record<Variante, string> = {
  primaria: 'bg-primaria-600 text-white active:bg-primaria-700 disabled:bg-primaria-100 disabled:text-primaria-500',
  secundaria: 'bg-gray-100 text-gray-900 active:bg-gray-200 disabled:text-gray-400',
  perigo: 'bg-erro text-white active:brightness-90 disabled:opacity-50',
};

// Alvo principal mid-workout: ≥64px de altura, largura total.
export function BotaoGrande({
  variante = 'primaria',
  className = '',
  children,
  ...rest
}: PropsBotaoGrande) {
  return (
    <button
      className={`min-h-botao-grande w-full rounded-2xl px-6 text-lg font-semibold transition-transform active:scale-[0.98] ${estilos[variante]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
