// Sync de grupos de ficha com o Supabase (push local→servidor, pull servidor→local).
import { z } from 'zod';

import type { SupabaseBrowser } from '@/shared/supabase/client';
import type { GrupoFicha } from '../domain/GrupoFicha';

const esquemaLinhaGrupoFicha = z.object({
  id: z.string(),
  usuario_id: z.string(),
  nome: z.string(),
  criado_em: z.string(),
  atualizado_em: z.string(),
  deletado_em: z.string().nullable(),
});

export async function pushGrupoFichaParaSupabase(
  supabase: SupabaseBrowser,
  grupo: GrupoFicha
): Promise<void> {
  const { error } = await supabase.from('grupos_ficha').upsert({
    id: grupo.id,
    usuario_id: grupo.usuarioId,
    nome: grupo.nome,
    criado_em: grupo.criadoEm,
    atualizado_em: grupo.atualizadoEm,
    deletado_em: grupo.deletadoEm,
  });
  if (error) {
    throw new Error(`Falha ao enviar grupo de ficha: ${error.message}`);
  }
}

export async function pullGruposFichaDoSupabase(
  supabase: SupabaseBrowser,
  usuarioId: string
): Promise<GrupoFicha[]> {
  const { data, error } = await supabase
    .from('grupos_ficha')
    .select('*')
    .eq('usuario_id', usuarioId);
  if (error) {
    throw new Error(`Falha ao buscar grupos de ficha: ${error.message}`);
  }

  const grupos: GrupoFicha[] = [];
  for (const bruto of data ?? []) {
    const resultado = esquemaLinhaGrupoFicha.safeParse(bruto);
    if (!resultado.success) {
      console.warn('[sync] Grupo de ficha inválido ignorado:', resultado.error.message);
      continue;
    }
    const linha = resultado.data;
    grupos.push({
      id: linha.id,
      usuarioId: linha.usuario_id,
      nome: linha.nome,
      criadoEm: linha.criado_em,
      atualizadoEm: linha.atualizado_em,
      deletadoEm: linha.deletado_em,
    });
  }
  return grupos;
}
