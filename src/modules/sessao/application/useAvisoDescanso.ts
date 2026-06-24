'use client';

import { useMemo } from 'react';

import { useSessoesConcluidas } from '@/modules/historico/application/useSessoesConcluidas';
import { analisarDescansoGrupos, type GrupoTreinadoRecente } from '../domain/descansoGrupos';

export interface EstadoAvisoDescanso {
  carregando: boolean;
  gruposRecentes: GrupoTreinadoRecente[];
}

export function useAvisoDescanso(gruposDaFicha: string[]): EstadoAvisoDescanso {
  const { sessoes, carregando } = useSessoesConcluidas();
  // String estável para a dependência do memo.
  const chave = gruposDaFicha.join('|');
  const gruposRecentes = useMemo(() => {
    const grupos = chave.length > 0 ? chave.split('|') : [];
    return analisarDescansoGrupos(grupos, sessoes);
  }, [sessoes, chave]);
  return { carregando, gruposRecentes };
}
