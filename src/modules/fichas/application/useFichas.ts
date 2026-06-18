'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import {
  adicionarExercicio,
  atribuirGrupo,
  atualizarExercicio,
  criarFicha,
  editarFicha,
  marcarFichaDeletada,
  moverExercicio,
  removerExercicio,
  type EdicaoFicha,
  type ExercicioFicha,
  type FichaTreino,
  type NovoExercicioFicha,
} from '../domain/FichaTreino';
import {
  criarGrupoFicha,
  marcarGrupoFichaDeletado,
  renomearGrupoFicha,
  type GrupoFicha,
} from '../domain/GrupoFicha';
import { listarFichas, obterFicha, salvarFicha } from '../infrastructure/fichaRepository';
import {
  listarGruposFicha,
  obterGrupoFicha,
  salvarGrupoFicha,
} from '../infrastructure/grupoFichaRepository';

export interface EstadoFichas {
  fichas: FichaTreino[];
  carregando: boolean;
  criarNovaFicha: (nome: string, descricao?: string) => Promise<FichaTreino>;
  moverFichaParaGrupo: (fichaId: string, grupoId: string | null) => Promise<void>;
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

  const moverFichaParaGrupo = useCallback(
    async (fichaId: string, grupoId: string | null) => {
      const atual = await obterFicha(fichaId, usuarioId);
      if (atual === null) {
        throw new Error('Ficha não encontrada.');
      }
      await salvarFicha(atribuirGrupo(atual, grupoId));
    },
    [usuarioId]
  );

  return {
    fichas: fichas ?? [],
    carregando: carregandoAuth || fichas === undefined,
    criarNovaFicha,
    moverFichaParaGrupo,
  };
}

export interface EstadoFicha {
  ficha: FichaTreino | null;
  carregando: boolean;
  editar: (dados: EdicaoFicha) => Promise<void>;
  atribuirGrupo: (grupoId: string | null) => Promise<void>;
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
    editar: (dados) => aplicar((atual) => editarFicha(atual, dados)),
    atribuirGrupo: (grupoId) => aplicar((atual) => atribuirGrupo(atual, grupoId)),
    incluirExercicio: (dados) => aplicar((atual) => adicionarExercicio(atual, dados)),
    editarExercicio: (exercicioId, mudancas) =>
      aplicar((atual) => atualizarExercicio(atual, exercicioId, mudancas)),
    excluirExercicio: (exercicioId) => aplicar((atual) => removerExercicio(atual, exercicioId)),
    mover: (exercicioId, direcao) => aplicar((atual) => moverExercicio(atual, exercicioId, direcao)),
    deletarFicha: () => aplicar((atual) => marcarFichaDeletada(atual)),
  };
}

export interface EstadoGruposFicha {
  grupos: GrupoFicha[];
  carregando: boolean;
  criarGrupo: (nome: string) => Promise<GrupoFicha>;
  renomearGrupo: (grupoId: string, nome: string) => Promise<void>;
  excluirGrupo: (grupoId: string) => Promise<void>;
}

export function useGruposFicha(): EstadoGruposFicha {
  const { usuarioId, carregando: carregandoAuth } = useAuth();
  const grupos = useLiveQuery(() => listarGruposFicha(usuarioId), [usuarioId]);

  const criarGrupo = useCallback(
    async (nome: string) => {
      const grupo = criarGrupoFicha({ nome, usuarioId });
      await salvarGrupoFicha(grupo);
      return grupo;
    },
    [usuarioId]
  );

  const renomearGrupo = useCallback(
    async (grupoId: string, nome: string) => {
      const atual = await obterGrupoFicha(grupoId, usuarioId);
      if (atual === null) {
        throw new Error('Grupo não encontrado.');
      }
      await salvarGrupoFicha(renomearGrupoFicha(atual, nome));
    },
    [usuarioId]
  );

  const excluirGrupo = useCallback(
    async (grupoId: string) => {
      const atual = await obterGrupoFicha(grupoId, usuarioId);
      if (atual === null) {
        throw new Error('Grupo não encontrado.');
      }
      await salvarGrupoFicha(marcarGrupoFichaDeletado(atual));
    },
    [usuarioId]
  );

  return {
    grupos: grupos ?? [],
    carregando: carregandoAuth || grupos === undefined,
    criarGrupo,
    renomearGrupo,
    excluirGrupo,
  };
}
