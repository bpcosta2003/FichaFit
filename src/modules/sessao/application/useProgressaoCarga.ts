'use client';

import { useCallback } from 'react';

import { useSessoesConcluidas } from '@/modules/historico/application/useSessoesConcluidas';
import { extrairDesempenhoAnterior } from '../domain/analiseProgresso';
import { calcularSugestaoCarga, type SugestaoCarga } from '../domain/progressaoCarga';

export interface EstadoProgressaoCarga {
  carregando: boolean;
  // Sugestão de carga para a PRIMEIRA série de um exercício, com base no histórico.
  sugerir: (exercicioFichaId: string, cargaReferenciaKg: number | null) => SugestaoCarga;
}

export function useProgressaoCarga(): EstadoProgressaoCarga {
  const { sessoes, carregando } = useSessoesConcluidas();
  const sugerir = useCallback(
    (exercicioFichaId: string, cargaReferenciaKg: number | null): SugestaoCarga => {
      const anterior = extrairDesempenhoAnterior(sessoes, exercicioFichaId);
      return calcularSugestaoCarga(anterior, cargaReferenciaKg);
    },
    [sessoes]
  );
  return { carregando, sugerir };
}
