'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo } from 'react';

import { obterDadosCatalogoPorIds } from '@/modules/exercicios/infrastructure/exercicioRepository';
import type { FichaTreino } from '../domain/FichaTreino';

export interface EstadoGruposDaFicha {
  carregando: boolean;
  // Grupos musculares distintos (não-nulos) dos exercícios da ficha.
  grupos: string[];
}

export function useGruposDaFicha(ficha: FichaTreino | null): EstadoGruposDaFicha {
  const ids = ficha ? ficha.exercicios.map((exercicio) => exercicio.exercicioDefinicaoId) : [];
  // String estável para a dependência da query (ids muda de identidade a cada render).
  const chave = ids.map((id) => id ?? '').join(',');
  const dados = useLiveQuery(() => obterDadosCatalogoPorIds(ids), [chave]);
  const grupos = useMemo(() => {
    if (dados === undefined) {
      return [];
    }
    const distintos = new Set<string>();
    for (const { grupoMuscular } of dados.values()) {
      if (grupoMuscular !== null && grupoMuscular.trim().length > 0) {
        distintos.add(grupoMuscular);
      }
    }
    return Array.from(distintos);
  }, [dados]);
  return { carregando: ficha !== null && dados === undefined, grupos };
}
