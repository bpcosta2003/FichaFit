'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { useAuth } from '@/modules/auth/application/useAuth';
import type { SessaoTreino } from '@/modules/sessao/domain/SessaoTreino';
import { obterSessao } from '@/modules/sessao/infrastructure/sessaoRepository';
import { useSessoesConcluidas, type EstadoSessoesConcluidas } from './useSessoesConcluidas';

export type EstadoHistorico = EstadoSessoesConcluidas;

// Histórico completo, sem limite de data.
export function useHistorico(): EstadoHistorico {
  return useSessoesConcluidas();
}

export interface EstadoSessaoHistorico {
  sessao: SessaoTreino | null;
  carregando: boolean;
}

export function useSessaoHistorico(sessaoId: string): EstadoSessaoHistorico {
  const { usuarioId, carregando: carregandoAuth } = useAuth();
  const sessao = useLiveQuery(() => obterSessao(sessaoId, usuarioId), [sessaoId, usuarioId]);
  return {
    sessao: sessao ?? null,
    carregando: carregandoAuth || sessao === undefined,
  };
}
