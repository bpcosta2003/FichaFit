// Sync de fichas com o Supabase (push local→servidor, pull servidor→local).
import { z } from 'zod';

import type { SupabaseBrowser } from '@/shared/supabase/client';
import type { Json } from '@/shared/supabase/database.types';
import type { ExercicioFicha, FichaTreino } from '../domain/FichaTreino';

const esquemaJustificativaIA = z.object({
  porqueDoTreino: z.string(),
  comoEvoluir: z.string(),
  nivelAssertividade: z.string(),
});

const esquemaLinhaFicha = z.object({
  id: z.string(),
  usuario_id: z.string(),
  nome: z.string(),
  descricao: z.string().nullable(),
  grupo_id: z.string().nullable().default(null),
  justificativa_ia: esquemaJustificativaIA.nullable().default(null),
  criado_em: z.string(),
  atualizado_em: z.string(),
  deletado_em: z.string().nullable(),
});

const esquemaLinhaExercicioFicha = z.object({
  id: z.string(),
  ficha_id: z.string(),
  exercicio_definicao_id: z.string().nullable(),
  nome: z.string(),
  ordem: z.number(),
  series: z.number(),
  repeticoes_min: z.number(),
  repeticoes_max: z.number(),
  carga_referencia_kg: z.number().nullable(),
  descanso_segundos: z.number(),
  observacoes: z.string().nullable(),
  deletado_em: z.string().nullable(),
});

export async function pushFichaParaSupabase(
  supabase: SupabaseBrowser,
  ficha: FichaTreino
): Promise<void> {
  const { error: erroFicha } = await supabase.from('fichas_treino').upsert({
    id: ficha.id,
    usuario_id: ficha.usuarioId,
    nome: ficha.nome,
    descricao: ficha.descricao,
    grupo_id: ficha.grupoId,
    // JSONB: a justificativa é um objeto plano serializável (ou null).
    justificativa_ia: ficha.justificativaIA as Json,
    criado_em: ficha.criadoEm,
    atualizado_em: ficha.atualizadoEm,
    deletado_em: ficha.deletadoEm,
  });
  if (erroFicha) {
    throw new Error(`Falha ao enviar ficha: ${erroFicha.message}`);
  }

  if (ficha.exercicios.length > 0) {
    const agora = new Date().toISOString();
    const { error: erroExercicios } = await supabase.from('exercicios_ficha').upsert(
      ficha.exercicios.map((exercicio) => ({
        id: exercicio.id,
        ficha_id: ficha.id,
        exercicio_definicao_id: exercicio.exercicioDefinicaoId,
        usuario_id: ficha.usuarioId,
        nome: exercicio.nome,
        ordem: exercicio.ordem,
        series: exercicio.series,
        repeticoes_min: exercicio.repeticoesMin,
        repeticoes_max: exercicio.repeticoesMax,
        carga_referencia_kg: exercicio.cargaReferenciaKg,
        descanso_segundos: exercicio.descansoSegundos,
        observacoes: exercicio.observacoes,
        atualizado_em: agora,
        deletado_em: null,
      }))
    );
    if (erroExercicios) {
      throw new Error(`Falha ao enviar exercícios da ficha: ${erroExercicios.message}`);
    }
  }

  // Exercícios removidos localmente viram soft delete no servidor.
  const idsLocais = ficha.exercicios.map((exercicio) => exercicio.id);
  let remocao = supabase
    .from('exercicios_ficha')
    .update({ deletado_em: new Date().toISOString() })
    .eq('ficha_id', ficha.id)
    .eq('usuario_id', ficha.usuarioId)
    .is('deletado_em', null);
  if (idsLocais.length > 0) {
    remocao = remocao.not('id', 'in', `(${idsLocais.join(',')})`);
  }
  const { error: erroRemocao } = await remocao;
  if (erroRemocao) {
    throw new Error(`Falha ao remover exercícios no servidor: ${erroRemocao.message}`);
  }
}

export async function pullFichasDoSupabase(
  supabase: SupabaseBrowser,
  usuarioId: string
): Promise<FichaTreino[]> {
  const { data: linhasFicha, error: erroFichas } = await supabase
    .from('fichas_treino')
    .select('*')
    .eq('usuario_id', usuarioId);
  if (erroFichas) {
    throw new Error(`Falha ao buscar fichas: ${erroFichas.message}`);
  }

  const { data: linhasExercicio, error: erroExercicios } = await supabase
    .from('exercicios_ficha')
    .select('*')
    .eq('usuario_id', usuarioId)
    .is('deletado_em', null);
  if (erroExercicios) {
    throw new Error(`Falha ao buscar exercícios das fichas: ${erroExercicios.message}`);
  }

  const exerciciosPorFicha = new Map<string, ExercicioFicha[]>();
  for (const bruto of linhasExercicio ?? []) {
    const resultado = esquemaLinhaExercicioFicha.safeParse(bruto);
    if (!resultado.success) {
      console.warn('[sync] Exercício de ficha inválido ignorado:', resultado.error.message);
      continue;
    }
    const linha = resultado.data;
    const lista = exerciciosPorFicha.get(linha.ficha_id) ?? [];
    lista.push({
      id: linha.id,
      exercicioDefinicaoId: linha.exercicio_definicao_id,
      nome: linha.nome,
      ordem: linha.ordem,
      series: linha.series,
      repeticoesMin: linha.repeticoes_min,
      repeticoesMax: linha.repeticoes_max,
      cargaReferenciaKg: linha.carga_referencia_kg,
      descansoSegundos: linha.descanso_segundos,
      observacoes: linha.observacoes,
    });
    exerciciosPorFicha.set(linha.ficha_id, lista);
  }

  const fichas: FichaTreino[] = [];
  for (const bruto of linhasFicha ?? []) {
    const resultado = esquemaLinhaFicha.safeParse(bruto);
    if (!resultado.success) {
      console.warn('[sync] Ficha inválida ignorada:', resultado.error.message);
      continue;
    }
    const linha = resultado.data;
    const exercicios = (exerciciosPorFicha.get(linha.id) ?? []).sort(
      (a, b) => a.ordem - b.ordem
    );
    fichas.push({
      id: linha.id,
      usuarioId: linha.usuario_id,
      nome: linha.nome,
      descricao: linha.descricao,
      grupoId: linha.grupo_id,
      exercicios,
      justificativaIA: linha.justificativa_ia,
      criadoEm: linha.criado_em,
      atualizadoEm: linha.atualizado_em,
      deletadoEm: linha.deletado_em,
    });
  }
  return fichas;
}
