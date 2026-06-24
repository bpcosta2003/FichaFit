'use client';

import type { MotivoSugestao } from '@/modules/sessao/domain/progressaoCarga';
import { formatarPesoKg } from '@/shared/utils/formatacao';

interface PropsAvisoProgressao {
  motivo: MotivoSugestao;
  pesoKg: number;
  pesoAnteriorKg: number | null;
}

// Banner não-modal, dentro do fluxo da sessão (não overlay). Só aparece quando
// há sugestão de subir a carga — caso contrário não renderiza nada.
export function AvisoProgressao({ motivo, pesoKg, pesoAnteriorKg }: PropsAvisoProgressao) {
  if (motivo !== 'subir' || pesoAnteriorKg === null) {
    return null;
  }
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-2xl border border-fogo/40 bg-fogo/10 px-4 py-3"
    >
      <span aria-hidden="true" className="text-xl">
        ⬆️
      </span>
      <p className="text-sm text-texto">
        Subiu de {formatarPesoKg(pesoAnteriorKg)} para{' '}
        <span className="font-semibold">{formatarPesoKg(pesoKg)}</span> — você bateu o topo das
        reps no último treino.
      </p>
    </div>
  );
}
