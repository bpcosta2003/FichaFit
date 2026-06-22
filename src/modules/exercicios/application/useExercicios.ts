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
  obterIdsLocaisPorWgerId,
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
  criarCustom: (nome: string, grupoMuscular?: string) => Promise<ExercicioDefinicao>;
  importarCatalogoWger: (forcar?: boolean) => Promise<void>;
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
        const exercicio = criarExercicioCustom({ nome, usuarioId, grupoMuscular });
        await salvarExercicioCustom(exercicio);
        return exercicio;
      } catch (causa) {
        setErro(causa instanceof Error ? causa.message : 'Não foi possível criar o exercício.');
        throw causa;
      }
    },
    [usuarioId]
  );

  const importarCatalogoWger = useCallback(async (forcar = false) => {
    setErro(null);
    setImportando(true);
    try {
      if (!forcar && (await contarCatalogo()) >= MINIMO_CATALOGO) {
        return; // catálogo já importado
      }
      const doWger = await buscarExerciciosWger();
      const idsLocais = await obterIdsLocaisPorWgerId();
      const agora = new Date().toISOString();
      // Reaproveita o id local de exercícios já importados (mesmo wgerId) para
      // que a atualização sobrescreva o registro existente em vez de duplicá-lo.
      const atualizados: ExercicioDefinicao[] = doWger.map((item) => ({
        id: idsLocais.get(item.wgerId) ?? uuidv4(),
        wgerId: item.wgerId,
        nome: item.nome,
        grupoMuscular: item.grupoMuscular,
        descricao: item.descricao,
        imagemUrl: item.imagemUrl,
        isCustom: false,
        usuarioId: null,
        criadoEm: agora,
        atualizadoEm: agora,
        deletadoEm: null,
      }));
      await importarCatalogo(atualizados);
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
