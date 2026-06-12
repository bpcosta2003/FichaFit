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
        className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-200"
      >
        <div
          className="h-full rounded-full bg-primaria-500 transition-all"
          style={{ width: `${Math.round(proporcao * 100)}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-700">
        {concluidos}/{total}
      </span>
    </div>
  );
}
