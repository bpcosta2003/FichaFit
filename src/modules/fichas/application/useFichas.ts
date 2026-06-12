'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import {
  adicionarExercicio,
  atualizarExercicio,
  criarFicha,
  marcarFichaDeletada,
  moverExercicio,
  removerExercicio,
  renomearFicha,
  type ExercicioFicha,
  type FichaTreino,
  type NovoExercicioFicha,
} from '../domain/FichaTreino';
import { listarFichas, obterFicha, salvarFicha } from '../infrastructure/fichaRepository';

export interface EstadoFichas {
  fichas: FichaTreino[];
  carregando: boolean;
  criarNovaFicha: (nome: string, descricao?: string) => Promise<FichaTreino>;
}

export function useFichas(): EstadoFichas {
  const { usuarioId, carregando: carregandoAuth } = useAuth();
  const fichas = useLiveQuery(() => listarFichas(usuarioId), [usuarioId]);

  const criarNovaFicha = useCallback(
    async (nome: string, descricao?: string) => {
      const ficha = criarFicha({ nome, usuarioId, descricao });
      await salvarFicha(ficha);
      return ficha;
    },
    [usuarioId]
  );

  return {
    fichas: fichas ?? [],
    carregando: carregandoAuth || fichas === undefined,
    criarNovaFicha,
  };
}

export interface EstadoFicha {
  ficha: FichaTreino | null;
  carregando: boolean;
  renomear: (nome: string) => Promise<void>;
  incluirExercicio: (dados: NovoExercicioFicha) => Promise<void>;
  editarExercicio: (
    exercicioId: string,
    mudancas: Partial<Omit<ExercicioFicha, 'id' | 'ordem'>>
  ) => Promise<void>;
  excluirExercicio: (exercicioId: string) => Promise<void>;
  mover: (exercicioId: string, direcao: 'cima' | 'baixo') => Promise<void>;
  deletarFicha: () => Promise<void>;
}

export function useFicha(fichaId: string): EstadoFicha {
  const { usuarioId, carregando: carregandoAuth } = useAuth();
  const ficha = useLiveQuery(() => obterFicha(fichaId, usuarioId), [fichaId, usuarioId]);

  const aplicar = useCallback(
    async (transformar: (atual: FichaTreino) => FichaTreino) => {
      const atual = await obterFicha(fichaId, usuarioId);
      if (atual === null) {
        throw new Error('Ficha não encontrada.');
      }
      await salvarFicha(transformar(atual));
    },
    [fichaId, usuarioId]
  );

  return {
    ficha: ficha ?? null,
    carregando: carregandoAuth || ficha === undefined,
    renomear: (nome) => aplicar((atual) => renomearFicha(atual, nome)),
    incluirExercicio: (dados) => aplicar((atual) => adicionarExercicio(atual, dados)),
    editarExercicio: (exercicioId, mudancas) =>
      aplicar((atual) => atualizarExercicio(atual, exercicioId, mudancas)),
    excluirExercicio: (exercicioId) => aplicar((atual) => removerExercicio(atual, exercicioId)),
    mover: (exercicioId, direcao) => aplicar((atual) => moverExercicio(atual, exercicioId, direcao)),
    deletarFicha: () => aplicar((atual) => marcarFichaDeletada(atual)),
  };
}
