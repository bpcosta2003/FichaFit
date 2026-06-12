'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { useAuth } from '@/modules/auth/application/useAuth';
import {
  criarExercicioCustom,
  filtrarPorNome,
  type ExercicioDefinicao,
} from '../domain/Exercicio';
import {
  contarCatalogo,
  importarCatalogo,
  listarExercicios,
  obterWgerIdsExistentes,
  salvarExercicioCustom,
} from '../infrastructure/exercicioRepository';
import { buscarExerciciosWger } from '../infrastructure/wgerApiClient';

const MINIMO_CATALOGO = 50;

export interface EstadoExercicios {
  exercicios: ExercicioDefinicao[];
  carregando: boolean;
  erro: string | null;
  importando: boolean;
  buscar: (termo: string) => ExercicioDefinicao[];
  criarCustom: (nome: string, grupoMuscular?: string) => Promise<void>;
  importarCatalogoWger: () => Promise<void>;
}

export function useExercicios(): EstadoExercicios {
  const { usuarioId, carregando: carregandoAuth } = useAuth();
  const [erro, setErro] = useState<string | null>(null);
  const [importando, setImportando] = useState(false);

  const exercicios = useLiveQuery(() => listarExercicios(usuarioId), [usuarioId]);

  const buscar = useCallback(
    (termo: string) => filtrarPorNome(exercicios ?? [], termo),
    [exercicios]
  );

  const criarCustom = useCallback(
    async (nome: string, grupoMuscular?: string) => {
      setErro(null);
      try {
        await salvarExercicioCustom(criarExercicioCustom({ nome, usuarioId, grupoMuscular }));
      } catch (causa) {
        setErro(causa instanceof Error ? causa.message : 'Não foi possível criar o exercício.');
        throw causa;
      }
    },
    [usuarioId]
  );

  const importarCatalogoWger = useCallback(async () => {
    setErro(null);
    setImportando(true);
    try {
      if ((await contarCatalogo()) >= MINIMO_CATALOGO) {
        return; // catálogo já importado
      }
      const doWger = await buscarExerciciosWger();
      const existentes = await obterWgerIdsExistentes();
      const agora = new Date().toISOString();
      const novos: ExercicioDefinicao[] = doWger
        .filter((item) => !existentes.has(item.wgerId))
        .map((item) => ({
          id: uuidv4(),
          wgerId: item.wgerId,
          nome: item.nome,
          grupoMuscular: item.grupoMuscular,
          descricao: item.descricao,
          isCustom: false,
          usuarioId: null,
          criadoEm: agora,
          atualizadoEm: agora,
          deletadoEm: null,
        }));
      await importarCatalogo(novos);
    } catch (causa) {
      console.warn('[exercicios] Falha ao importar catálogo wger:', causa);
      setErro('Não foi possível baixar o catálogo de exercícios. Verifique sua conexão.');
    } finally {
      setImportando(false);
    }
  }, []);

  return {
    exercicios: exercicios ?? [],
    carregando: carregandoAuth || exercicios === undefined,
    erro,
    importando,
    buscar,
    criarCustom,
    importarCatalogoWger,
  };
}
