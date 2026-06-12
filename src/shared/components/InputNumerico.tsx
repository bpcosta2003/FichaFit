'use client';

interface PropsInputNumerico {
  rotulo: string;
  valor: number;
  aoMudar: (valor: number) => void;
  passo?: number;
  minimo?: number;
  maximo?: number;
  sufixo?: string;
}

// +/- com input central — otimizado para uso com uma mão no celular.
// Botões com alvo de toque ≥48px.
export function InputNumerico({
  rotulo,
  valor,
  aoMudar,
  passo = 1,
  minimo = 0,
  maximo = 999,
  sufixo,
}: PropsInputNumerico) {
  const ajustar = (delta: number): void => {
    const novo = Math.min(maximo, Math.max(minimo, Math.round((valor + delta) * 100) / 100));
    aoMudar(novo);
  };

  return (
    <div className="flex flex-1 flex-col gap-1">
      <span className="text-sm font-medium text-gray-600">{rotulo}</span>
      <div className="flex items-stretch overflow-hidden rounded-xl border border-gray-300 bg-white">
        <button
          type="button"
          aria-label={`Diminuir ${rotulo}`}
          onClick={() => ajustar(-passo)}
          className="min-h-toque min-w-toque text-2xl font-bold text-primaria-600 active:bg-gray-100"
        >
          −
        </button>
        <input
          type="number"
          inputMode="decimal"
          aria-label={rotulo}
          value={valor}
          min={minimo}
          max={maximo}
          step={passo}
          onChange={(evento) => {
            const novo = Number(evento.target.value);
            if (Number.isFinite(novo)) {
              aoMudar(Math.min(maximo, Math.max(minimo, novo)));
            }
          }}
          className="min-h-toque w-full border-x border-gray-200 text-center text-xl font-semibold outline-none focus:bg-primaria-50"
        />
        <button
          type="button"
          aria-label={`Aumentar ${rotulo}`}
          onClick={() => ajustar(passo)}
          className="min-h-toque min-w-toque text-2xl font-bold text-primaria-600 active:bg-gray-100"
        >
          +
        </button>
      </div>
      {sufixo !== undefined && (
        <span className="text-right text-xs text-gray-500">{sufixo}</span>
      )}
    </div>
  );
}
