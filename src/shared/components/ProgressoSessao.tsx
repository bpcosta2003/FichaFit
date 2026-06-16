'use client';

interface PropsProgressoSessao {
  concluidos: number;
  total: number;
}

// Barra de progresso da sessão — header fixo, não-interativo.
export function ProgressoSessao({ concluidos, total }: PropsProgressoSessao) {
  const proporcao = total > 0 ? concluidos / total : 0;
  return (
    <div className="flex items-center gap-3">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={concluidos}
        aria-label="Progresso da sessão"
        className="h-2 flex-1 overflow-hidden rounded-full bg-superficie-2"
      >
        <div
          className="gradiente-fogo h-full rounded-full transition-all"
          style={{ width: `${Math.round(proporcao * 100)}%` }}
        />
      </div>
      <span className="font-titulo text-sm font-semibold uppercase tracking-wide text-texto-suave">
        {concluidos}/{total}
      </span>
    </div>
  );
}
