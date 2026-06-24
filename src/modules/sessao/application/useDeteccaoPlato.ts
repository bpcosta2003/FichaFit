'use client';

import { useMemo } from 'react';

import { useSessoesConcluidas } from '@/modules/historico/application/useSessoesConcluidas';
import { detectarPlato } from '../domain/analiseProgresso';

export interface EstadoDeteccaoPlato {
  carregando: boolean;
  // exercicioFichaId -> está em platô.
  platosPorId: Map<string, boolean>;
}

export function useDeteccaoPlato(exercicioFichaIds: string[]): EstadoDeteccaoPlato {
  const { sessoes, carregando } = useSessoesConcluidas();
  // String estável para a dependência do memo (arrays mudam de identidade a cada render).
  const chave = exercicioFichaIds.join(',');
  const platosPorId = useMemo(() => {
    const ids = chave.length > 0 ? chave.split(',') : [];
    const mapa = new Map<string, boolean>();
    for (const id of ids) {
      mapa.set(id, detectarPlato(sessoes, id).emPlato);
    }
    return mapa;
  }, [sessoes, chave]);
  return { carregando, platosPorId };
}
