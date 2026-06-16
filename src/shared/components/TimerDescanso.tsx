'use client';

import { formatarTempoTimer } from '@/shared/utils/formatacao';

interface PropsTimerDescanso {
  segundosRestantes: number;
  total: number;
}

const RAIO = 86;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;

// Anel de progresso do descanso com número gigante (Bebas Neue) ao centro.
export function TimerDescanso({ segundosRestantes, total }: PropsTimerDescanso) {
  const proporcao = total > 0 ? Math.min(1, segundosRestantes / total) : 0;
  const offset = CIRCUNFERENCIA * (1 - proporcao);
  return (
    <div className="flex flex-col items-center gap-3">
      <p className="font-titulo text-sm font-semibold uppercase tracking-[0.3em] text-fogo">
        Descanso
      </p>
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="h-56 w-56 -rotate-90" aria-hidden="true">
          <circle cx="100" cy="100" r={RAIO} fill="none" stroke="var(--cor-superficie-2)" strokeWidth={10} />
          <circle
            cx="100"
            cy="100"
            r={RAIO}
            fill="none"
            stroke="#F59E0B"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={CIRCUNFERENCIA}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span
            aria-live="polite"
            className="font-numero text-7xl leading-none text-texto tabular-nums"
          >
            {formatarTempoTimer(segundosRestantes)}
          </span>
          <span className="text-sm text-texto-suave">de {formatarTempoTimer(total)}</span>
        </div>
      </div>
    </div>
  );
}
