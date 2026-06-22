// Motor de sincronização Dexie ↔ Supabase.
// Regra: SEMPRE push antes de pull — evita sobrescrever dados locais
// novos com dados antigos do servidor.
import { z } from 'zod';

import type { ExercicioDefinicao } from '@/modules/exercicios/domain/Exercicio';
import { importarCatalogo } from '@/modules/exercicios/infrastructure/exercicioRepository';
import {
  pullFichasDoSupabase,
  pushFichaParaSupabase,
} from '@/modules/fichas/infrastructure/fichaSupabase';
import {
  pullGruposFichaDoSupabase,
  pushGrupoFichaParaSupabase,
} from '@/modules/fichas/infrastructure/grupoFichaSupabase';
import {
  pullSessoesDoSupabase,
  pushSessaoParaSupabase,
} from '@/modules/sessao/infrastructure/sessaoSupabase';
import { db, USUARIO_LOCAL } from '@/shared/db/db';
import { obterSupabaseBrowser, type SupabaseBrowser } from '@/shared/supabase/client';
import {
  enfileirar,
  listarPendentes,
  registrarFalha,
  removerEntrada,
} from './syncQueue';

const esquemaLinhaExercicioDefinicao = z.object({
  id: z.string(),
  wger_id: z.number().nullable(),
  nome: z.string(),
  grupo_muscular: z.string().nullable(),
  descricao: z.string().nullable(),
  imagem_url: z.string().nullable().default(null),
  is_custom: z.boolean(),
  usuario_id: z.string().nullable(),
  criado_em: z.string(),
  atualizado_em: z.string(),
  deletado_em: z.string().nullable(),
});

// Registros criados antes do login pertencem ao usuário autenticado.
export async function adotarRegistrosLocais(usuarioId: string): Promise<void> {
  const gruposLocais = await db.gruposFicha.where('usuarioId').equals(USUARIO_LOCAL).toArray();
  for (const grupo of gruposLocais) {
    await db.gruposFicha.put({ ...grupo, usuarioId });
    await enfileirar('grupo_ficha', grupo.id);
  }

  const fichasLocais = await db.fichasTreino.where('usuarioId').equals(USUARIO_LOCAL).toArray();
  for (const ficha of fichasLocais) {
    await db.fichasTreino.put({ ...ficha, usuarioId });
    await enfileirar('ficha', ficha.id);
  }

  const sessoesLocais = await db.sessoesTreino.where('usuarioId').equals(USUARIO_LOCAL).toArray();
  for (const sessao of sessoesLocais) {
    await db.sessoesTreino.put({ ...sessao, usuarioId });
    if (sessao.status !== 'em_andamento') {
      await enfileirar('sessao', sessao.id);
    }
  }

  const exerciciosLocais = await db.exercicioDefinicoes
    .where('usuarioId')
    .equals(USUARIO_LOCAL)
    .toArray();
  for (const exercicio of exerciciosLocais) {
    await db.exercicioDefinicoes.put({ ...exercicio, usuarioId });
    await enfileirar('exercicio', exercicio.id);
  }
}

async function pushExercicioCustom(
  supabase: SupabaseBrowser,
  exercicio: ExercicioDefinicao
): Promise<void> {
  const { error } = await supabase.from('exercicio_definicoes').upsert({
    id: exercicio.id,
    wger_id: exercicio.wgerId,
    nome: exercicio.nome,
    grupo_muscular: exercicio.grupoMuscular,
    descricao: exercicio.descricao,
    imagem_url: exercicio.imagemUrl,
    is_custom: exercicio.isCustom,
    usuario_id: exercicio.usuarioId,
    criado_em: exercicio.criadoEm,
    atualizado_em: exercicio.atualizadoEm,
    deletado_em: exercicio.deletadoEm,
  });
  if (error) {
    throw new Error(`Falha ao enviar exercício custom: ${error.message}`);
  }
}

export async function pushParaServidor(usuarioId: string): Promise<void> {
  const supabase = obterSupabaseBrowser();
  if (supabase === null) {
    return;
  }
  const pendentes = await listarPendentes();
  for (const entrada of pendentes) {
    try {
      if (entrada.entidade === 'ficha') {
        const ficha = await db.fichasTreino.get(entrada.registroId);
        if (ficha !== undefined && ficha.usuarioId === usuarioId) {
          await pushFichaParaSupabase(supabase, ficha);
        }
      } else if (entrada.entidade === 'sessao') {
        const sessao = await db.sessoesTreino.get(entrada.registroId);
        if (sessao !== undefined && sessao.usuarioId === usuarioId) {
          await pushSessaoParaSupabase(supabase, sessao);
        }
      } else if (entrada.entidade === 'grupo_ficha') {
        const grupo = await db.gruposFicha.get(entrada.registroId);
        if (grupo !== undefined && grupo.usuarioId === usuarioId) {
          await pushGrupoFichaParaSupabase(supabase, grupo);
        }
      } else {
        const exercicio = await db.exercicioDefinicoes.get(entrada.registroId);
        if (exercicio !== undefined && exercicio.usuarioId === usuarioId) {
          await pushExercicioCustom(supabase, exercicio);
        }
      }
      if (entrada.id !== undefined) {
        await removerEntrada(entrada.id);
      }
    } catch (erro) {
      console.warn('[sync] Falha no push de', entrada.entidade, entrada.registroId, erro);
      await registrarFalha(entrada);
    }
  }
}

export async function pullDoServidor(usuarioId: string): Promise<void> {
  const supabase = obterSupabaseBrowser();
  if (supabase === null) {
    return;
  }

  // Last-write-wins: só sobrescreve o registro local se o remoto for mais novo.
  const gruposRemotos = await pullGruposFichaDoSupabase(supabase, usuarioId);
  for (const remoto of gruposRemotos) {
    const local = await db.gruposFicha.get(remoto.id);
    if (local === undefined || local.atualizadoEm <= remoto.atualizadoEm) {
      await db.gruposFicha.put(remoto);
    }
  }

  const fichasRemotas = await pullFichasDoSupabase(supabase, usuarioId);
  for (const remota of fichasRemotas) {
    const local = await db.fichasTreino.get(remota.id);
    if (local === undefined || local.atualizadoEm <= remota.atualizadoEm) {
      await db.fichasTreino.put(remota);
    }
  }

  const sessoesRemotas = await pullSessoesDoSupabase(supabase, usuarioId);
  for (const remota of sessoesRemotas) {
    const local = await db.sessoesTreino.get(remota.id);
    if (local === undefined || local.atualizadoEm <= remota.atualizadoEm) {
      await db.sessoesTreino.put(remota);
    }
  }

  const { data: linhasExercicio, error } = await supabase
    .from('exercicio_definicoes')
    .select('*')
    .or(`usuario_id.is.null,usuario_id.eq.${usuarioId}`)
    .is('deletado_em', null);
  if (error) {
    throw new Error(`Falha ao buscar catálogo de exercícios: ${error.message}`);
  }
  const exercicios: ExercicioDefinicao[] = [];
  for (const bruto of linhasExercicio ?? []) {
    const resultado = esquemaLinhaExercicioDefinicao.safeParse(bruto);
    if (!resultado.success) {
      console.warn('[sync] Definição de exercício inválida ignorada:', resultado.error.message);
      continue;
    }
    const linha = resultado.data;
    exercicios.push({
      id: linha.id,
      wgerId: linha.wger_id,
      nome: linha.nome,
      grupoMuscular: linha.grupo_muscular,
      descricao: linha.descricao,
      imagemUrl: linha.imagem_url,
      isCustom: linha.is_custom,
      usuarioId: linha.usuario_id,
      criadoEm: linha.criado_em,
      atualizadoEm: linha.atualizado_em,
      deletadoEm: linha.deletado_em,
    });
  }
  await importarCatalogo(exercicios);
}

// Sync completo: adota registros locais, push, depois pull.
export async function sincronizar(usuarioId: string): Promise<void> {
  await adotarRegistrosLocais(usuarioId);
  await pushParaServidor(usuarioId);
  await pullDoServidor(usuarioId);
}
