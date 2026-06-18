// Persistência local (Dexie). Escrita imediata — nunca bloqueia a UI.
import { z } from 'zod';

import { db } from '@/shared/db/db';
import { enfileirar } from '@/shared/sync/syncQueue';
import type { FichaTreino } from '../domain/FichaTreino';

// Dados do IndexedDB podem estar com schema antigo — validar ao ler.
const esquemaExercicioFicha = z.object({
  id: z.string(),
  exercicioDefinicaoId: z.string().nullable(),
  nome: z.string(),
  ordem: z.number().int(),
  series: z.number().int().min(1),
  repeticoesMin: z.number().int().min(1),
  repeticoesMax: z.number().int().min(1),
  cargaReferenciaKg: z.number().nullable(),
  descansoSegundos: z.number().int().min(0),
  observacoes: z.string().nullable(),
});

const esquemaFicha = z.object({
  id: z.string(),
  usuarioId: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  grupoId: z.string().nullable().default(null),
  exercicios: z.array(esquemaExercicioFicha),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  deletadoEm: z.string().nullable(),
});

function validarFicha(bruto: unknown): FichaTreino | null {
  const resultado = esquemaFicha.safeParse(bruto);
  if (!resultado.success) {
    console.warn('[fichas] Registro local inválido ignorado:', resultado.error.message);
    return null;
  }
  return resultado.data;
}

export async function salvarFicha(ficha: FichaTreino): Promise<void> {
  await db.fichasTreino.put(ficha);
  await enfileirar('ficha', ficha.id);
}

export async function listarFichas(usuarioId: string): Promise<FichaTreino[]> {
  const brutos = await db.fichasTreino.where('usuarioId').equals(usuarioId).toArray();
  return brutos
    .map(validarFicha)
    .filter((ficha): ficha is FichaTreino => ficha !== null && ficha.deletadoEm === null)
    .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
}

export async function obterFicha(id: string, usuarioId: string): Promise<FichaTreino | null> {
  const bruto = await db.fichasTreino.get(id);
  if (bruto === undefined) {
    return null;
  }
  const ficha = validarFicha(bruto);
  if (ficha === null || ficha.usuarioId !== usuarioId || ficha.deletadoEm !== null) {
    return null;
  }
  return ficha;
}
