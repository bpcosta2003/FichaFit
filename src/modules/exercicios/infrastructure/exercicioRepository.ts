// Persistência local (Dexie) do catálogo + exercícios custom.
import { z } from 'zod';

import { db } from '@/shared/db/db';
import { enfileirar } from '@/shared/sync/syncQueue';
import type { ExercicioDefinicao } from '../domain/Exercicio';

const esquemaExercicio = z.object({
  id: z.string(),
  wgerId: z.number().int().nullable(),
  nome: z.string(),
  grupoMuscular: z.string().nullable(),
  descricao: z.string().nullable(),
  imagemUrl: z.string().nullable().default(null),
  isCustom: z.boolean(),
  usuarioId: z.string().nullable(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  deletadoEm: z.string().nullable(),
});

function validarExercicio(bruto: unknown): ExercicioDefinicao | null {
  const resultado = esquemaExercicio.safeParse(bruto);
  if (!resultado.success) {
    console.warn('[exercicios] Registro local inválido ignorado:', resultado.error.message);
    return null;
  }
  return resultado.data;
}

// Catálogo global (usuarioId === null) + exercícios custom do usuário.
export async function listarExercicios(usuarioId: string): Promise<ExercicioDefinicao[]> {
  const brutos = await db.exercicioDefinicoes
    .filter((exercicio) => exercicio.usuarioId === null || exercicio.usuarioId === usuarioId)
    .toArray();
  return brutos
    .map(validarExercicio)
    .filter(
      (exercicio): exercicio is ExercicioDefinicao =>
        exercicio !== null && exercicio.deletadoEm === null
    )
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

export async function salvarExercicioCustom(exercicio: ExercicioDefinicao): Promise<void> {
  await db.exercicioDefinicoes.put(exercicio);
  await enfileirar('exercicio', exercicio.id);
}

// Importa o catálogo (do wger ou do pull do Supabase) sem enfileirar sync.
export async function importarCatalogo(exercicios: ExercicioDefinicao[]): Promise<void> {
  await db.exercicioDefinicoes.bulkPut(exercicios);
}

export async function contarCatalogo(): Promise<number> {
  return db.exercicioDefinicoes.filter((exercicio) => !exercicio.isCustom).count();
}

// wgerIds já importados — evita duplicatas na reimportação.
export async function obterWgerIdsExistentes(): Promise<Set<number>> {
  const exercicios = await db.exercicioDefinicoes
    .filter((exercicio) => exercicio.wgerId !== null)
    .toArray();
  return new Set(
    exercicios
      .map((exercicio) => exercicio.wgerId)
      .filter((wgerId): wgerId is number => wgerId !== null)
  );
}

// Dados do catálogo anexados a cada exercício ao iniciar/exibir uma sessão
// (a ficha não guarda nem a foto nem o grupo muscular).
export interface DadosCatalogoExercicio {
  imagemUrl: string | null;
  grupoMuscular: string | null;
}

// Mapa exercicioDefinicaoId -> { imagemUrl, grupoMuscular } em uma só passada
// (bulkGet, sem N+1). Usado para anexar dados do catálogo aos exercícios.
export async function obterDadosCatalogoPorIds(
  ids: Array<string | null>
): Promise<Map<string, DadosCatalogoExercicio>> {
  const idsValidos = Array.from(new Set(ids.filter((id): id is string => id !== null)));
  const brutos = await db.exercicioDefinicoes.bulkGet(idsValidos);
  const mapa = new Map<string, DadosCatalogoExercicio>();
  brutos.forEach((bruto, indice) => {
    const id = idsValidos[indice];
    if (id === undefined) {
      return;
    }
    const exercicio = bruto !== undefined ? validarExercicio(bruto) : null;
    mapa.set(id, {
      imagemUrl: exercicio?.imagemUrl ?? null,
      grupoMuscular: exercicio?.grupoMuscular ?? null,
    });
  });
  return mapa;
}

// Mapa wgerId -> id local — usado para sobrescrever (e não duplicar) registros
// já importados quando o catálogo é atualizado.
export async function obterIdsLocaisPorWgerId(): Promise<Map<number, string>> {
  const exercicios = await db.exercicioDefinicoes
    .filter((exercicio) => exercicio.wgerId !== null)
    .toArray();
  const mapa = new Map<number, string>();
  for (const exercicio of exercicios) {
    if (exercicio.wgerId !== null) {
      mapa.set(exercicio.wgerId, exercicio.id);
    }
  }
  return mapa;
}
