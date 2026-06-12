'use client';

import { useLiveQuery } from 'dexie-react-hooks';

import { useAuth } from '@/modules/auth/application/useAuth';
import type { SessaoTreino } from '@/modules/sessao/domain/SessaoTreino';
import {
  listarSessoesConcluidas,
  obterSessao,
} from '@/modules/sessao/infrastructure/sessaoRepository';

export interface EstadoHistorico {
  sessoes: SessaoTreino[];
  carregando: boolean;
}

// Histórico completo, sem limite de data.
export function useHistorico(): EstadoHistorico {
  const { usuarioId, carregando: carregandoAuth } = useAuth();
  const sessoes = useLiveQuery(() => listarSessoesConcluidas(usuarioId), [usuarioId]);
  return {
    sessoes: sessoes ?? [],
    carregando: carregandoAuth || sessoes === undefined,
  };
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
