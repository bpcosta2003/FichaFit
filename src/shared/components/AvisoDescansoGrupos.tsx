'use client';

import type { GrupoTreinadoRecente } from '@/modules/sessao/domain/descansoGrupos';

interface PropsAvisoDescansoGrupos {
  gruposRecentes: GrupoTreinadoRecente[];
}

function formatarHorasDesde(horas: number): string {
  const arredondado = Math.max(0, Math.round(horas));
  if (arredondado < 1) {
    return 'menos de 1 hora';
  }
  if (arredondado === 1) {
    return '1 hora';
  }
  if (arredondado < 24) {
    return `${arredondado} horas`;
  }
  const dias = Math.round(arredondado / 24);
  return dias === 1 ? '1 dia' : `${dias} dias`;
}

// Aviso de descanso insuficiente. Não renderiza nada quando tudo está descansado.
export function AvisoDescansoGrupos({ gruposRecentes }: PropsAvisoDescansoGrupos) {
  if (gruposRecentes.length === 0) {
    return null;
  }
  return (
    <div
      role="status"
      className="flex flex-col gap-1 rounded-2xl border border-fogo/40 bg-fogo/10 p-4"
    >
      <p className="font-titulo text-sm font-bold uppercase tracking-tight text-texto">
        Atenção ao descanso
      </p>
      {gruposRecentes.map((grupo) => (
        <p key={grupo.grupoMuscular} className="text-sm text-texto-suave">
          <span className="font-semibold text-texto">{grupo.grupoMuscular}</span> treinado há{' '}
          {formatarHorasDesde(grupo.horasDesde)} — considere descansar (ideal ≥ 48h).
        </p>
      ))}
    </div>
  );
}
