// Persistência local (Dexie). Escrita imediata — nunca bloqueia a UI.
import { z } from 'zod';

import { db } from '@/shared/db/db';
import { enfileirar } from '@/shared/sync/syncQueue';
import type { GrupoFicha } from '../domain/GrupoFicha';

// Dados do IndexedDB podem estar com schema antigo — validar ao ler.
const esquemaGrupoFicha = z.object({
  id: z.string(),
  usuarioId: z.string(),
  nome: z.string(),
  criadoEm: z.string(),
  atualizadoEm: z.string(),
  deletadoEm: z.string().nullable(),
});

function validarGrupoFicha(bruto: unknown): GrupoFicha | null {
  const resultado = esquemaGrupoFicha.safeParse(bruto);
  if (!resultado.success) {
    console.warn('[grupos-ficha] Registro local inválido ignorado:', resultado.error.message);
    return null;
  }
  return resultado.data;
}

export async function salvarGrupoFicha(grupo: GrupoFicha): Promise<void> {
  await db.gruposFicha.put(grupo);
  await enfileirar('grupo_ficha', grupo.id);
}

export async function listarGruposFicha(usuarioId: string): Promise<GrupoFicha[]> {
  const brutos = await db.gruposFicha.where('usuarioId').equals(usuarioId).toArray();
  return brutos
    .map(validarGrupoFicha)
    .filter((grupo): grupo is GrupoFicha => grupo !== null && grupo.deletadoEm === null)
    .sort((a, b) => a.nome.localeCompare(b.nome));
}

export async function obterGrupoFicha(
  id: string,
  usuarioId: string
): Promise<GrupoFicha | null> {
  const bruto = await db.gruposFicha.get(id);
  if (bruto === undefined) {
    return null;
  }
  const grupo = validarGrupoFicha(bruto);
  if (grupo === null || grupo.usuarioId !== usuarioId || grupo.deletadoEm !== null) {
    return null;
  }
  return grupo;
}
