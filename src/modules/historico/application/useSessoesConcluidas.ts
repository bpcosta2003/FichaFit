'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { useAuth } from '@/modules/auth/application/useAuth';
import type { SessaoTreino } from '@/modules/sessao/domain/SessaoTreino';
import { listarSessoesConcluidas } from '@/modules/sessao/infrastructure/sessaoRepository';

export interface EstadoSessoesConcluidas {
  // Sessões concluídas do usuário, ordenadas da mais recente para a mais antiga.
  sessoes: SessaoTreino[];
  carregando: boolean;
}

// Fonte única das sessões concluídas — reusada pelo histórico e pelos insights
// (progressão, platô, descanso), evitando múltiplas leituras divergentes.
export function useSessoesConcluidas(): EstadoSessoesConcluidas {
  const { usuarioId, carregando: carregandoAuth } = useAuth();
  const sessoes = useLiveQuery(() => listarSessoesConcluidas(usuarioId), [usuarioId]);
  return {
    sessoes: sessoes ?? [],
    carregando: carregandoAuth || sessoes === undefined,
  };
}
