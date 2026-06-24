'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useState } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import { obterDadosCatalogoPorIds } from '@/modules/exercicios/infrastructure/exercicioRepository';
import { obterFicha } from '@/modules/fichas/infrastructure/fichaRepository';
import { sincronizar } from '@/shared/sync/syncEngine';
import {
  cancelarSessao,
  concluirSessao,
  exercicioAtual,
  iniciarSessao,
  pesoSugerido,
  progressoSessao,
  registrarSerie,
  seriesDoExercicio,
  sessaoCompleta,
  type ExercicioSessao,
  type ProgressoSessao,
  type SessaoTreino,
} from '../domain/SessaoTreino';
import { obterSessaoEmAndamento, salvarSessao } from '../infrastructure/sessaoRepository';

export interface EstadoSessaoAtiva {
  sessao: SessaoTreino | null;
  carregando: boolean;
  erro: string | null;
  exercicio: ExercicioSessao | null;
  progresso: ProgressoSessao | null;
  completa: boolean;
  seriesFeitas: number;
  sugerirPeso: (exercicioFichaId: string) => number;
  iniciar: () => Promise<void>;
  registrar: (repeticoes: number, pesoKg: number) => Promise<void>;
  concluir: () => Promise<void>;
  cancelar: () => Promise<void>;
}

// Push ao concluir: dispara sync em segundo plano se autenticado e online.
function dispararPush(usuarioId: string | undefined): void {
  if (usuarioId !== undefined && navigator.onLine) {
    sincronizar(usuarioId).catch((causa) => {
      console.warn('[sync] Push pós-sessão falhou (fila persiste):', causa);
    });
  }
}

export function useSessaoAtiva(fichaId: string): EstadoSessaoAtiva {
  const { usuario, usuarioId, carregando: carregandoAuth } = useAuth();
  const [erro, setErro] = useState<string | null>(null);

  const sessao = useLiveQuery(
    () => obterSessaoEmAndamento(fichaId, usuarioId),
    [fichaId, usuarioId]
  );

  const iniciar = useCallback(async () => {
    setErro(null);
    try {
      const existente = await obterSessaoEmAndamento(fichaId, usuarioId);
      if (existente !== null) {
        return; // retoma a sessão em andamento
      }
      const ficha = await obterFicha(fichaId, usuarioId);
      if (ficha === null) {
        setErro('Ficha não encontrada.');
        return;
      }
      const dadosPorId = await obterDadosCatalogoPorIds(
        ficha.exercicios.map((exercicio) => exercicio.exercicioDefinicaoId)
      );
      await salvarSessao(
        iniciarSessao(ficha, (exercicioDefinicaoId) =>
          exercicioDefinicaoId !== null
            ? dadosPorId.get(exercicioDefinicaoId) ?? { imagemUrl: null, grupoMuscular: null }
            : { imagemUrl: null, grupoMuscular: null }
        )
      );
    } catch (causa) {
      setErro(causa instanceof Error ? causa.message : 'Não foi possível iniciar o treino.');
    }
  }, [fichaId, usuarioId]);

  const registrar = useCallback(
    async (repeticoes: number, pesoKg: number) => {
      if (sessao == null) {
        return;
      }
      const atual = exercicioAtual(sessao);
      if (atual === null) {
        return;
      }
      setErro(null);
      try {
        await salvarSessao(
          registrarSerie(sessao, {
            exercicioFichaId: atual.exercicioFichaId,
            repeticoes,
            pesoKg,
          })
        );
      } catch (causa) {
        setErro(causa instanceof Error ? causa.message : 'Não foi possível registrar a série.');
      }
    },
    [sessao]
  );

  const concluir = useCallback(async () => {
    if (sessao == null) {
      return;
    }
    await salvarSessao(concluirSessao(sessao));
    dispararPush(usuario?.id);
  }, [sessao, usuario]);

  const cancelar = useCallback(async () => {
    if (sessao == null) {
      return;
    }
    await salvarSessao(cancelarSessao(sessao));
    dispararPush(usuario?.id);
  }, [sessao, usuario]);

  const exercicio = sessao != null ? exercicioAtual(sessao) : null;

  return {
    sessao: sessao ?? null,
    carregando: carregandoAuth || sessao === undefined,
    erro,
    exercicio,
    progresso: sessao != null ? progressoSessao(sessao) : null,
    completa: sessao != null ? sessaoCompleta(sessao) : false,
    seriesFeitas:
      sessao != null && exercicio !== null
        ? seriesDoExercicio(sessao, exercicio.exercicioFichaId).length
        : 0,
    sugerirPeso: (exercicioFichaId) =>
      sessao != null ? pesoSugerido(sessao, exercicioFichaId) : 0,
    iniciar,
    registrar,
    concluir,
    cancelar,
  };
}
