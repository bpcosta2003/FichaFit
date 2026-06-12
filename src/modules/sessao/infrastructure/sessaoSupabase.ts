// Sync de sessões com o Supabase. Deduplicação por client_id no upsert.
import { z } from 'zod';

import type { SupabaseBrowser } from '@/shared/supabase/client';
import type {
  ExercicioSessao,
  SerieRealizada,
  SessaoTreino,
  StatusSessao,
} from '../domain/SessaoTreino';

const esquemaLinhaSessao = z.object({
  id: z.string(),
  client_id: z.string(),
  usuario_id: z.string(),
  ficha_id: z.string(),
  nome_ficha: z.string(),
  status: z.enum(['em_andamento', 'concluida', 'cancelada']),
  iniciada_em: z.string(),
  concluida_em: z.string().nullable(),
  atualizado_em: z.string(),
  deletado_em: z.string().nullable(),
});

const esquemaLinhaSerie = z.object({
  id: z.string(),
  sessao_id: z.string(),
  exercicio_ficha_id: z.string(),
  nome_exercicio: z.string(),
  numero_serie: z.number(),
  repeticoes: z.number(),
  peso_kg: z.number(),
  realizada_em: z.string(),
});

export async function pushSessaoParaSupabase(
  supabase: SupabaseBrowser,
  sessao: SessaoTreino
): Promise<void> {
  const { error: erroSessao } = await supabase.from('sessoes_treino').upsert(
    {
      id: sessao.id,
      client_id: sessao.clientId,
      usuario_id: sessao.usuarioId,
      ficha_id: sessao.fichaId,
      nome_ficha: sessao.nomeFicha,
      status: sessao.status,
      iniciada_em: sessao.iniciadaEm,
      concluida_em: sessao.concluidaEm,
      atualizado_em: sessao.atualizadoEm,
      deletado_em: sessao.deletadoEm,
    },
    { onConflict: 'client_id' }
  );
  if (erroSessao) {
    throw new Error(`Falha ao enviar sessão: ${erroSessao.message}`);
  }

  if (sessao.series.length > 0) {
    const { error: erroSeries } = await supabase.from('series_realizadas').upsert(
      sessao.series.map((serie) => ({
        id: serie.id,
        sessao_id: sessao.id,
        exercicio_ficha_id: serie.exercicioFichaId,
        usuario_id: sessao.usuarioId,
        nome_exercicio: serie.nomeExercicio,
        numero_serie: serie.numeroSerie,
        repeticoes: serie.repeticoes,
        peso_kg: serie.pesoKg,
        realizada_em: serie.realizadaEm,
      }))
    );
    if (erroSeries) {
      throw new Error(`Falha ao enviar séries: ${erroSeries.message}`);
    }
  }
}

// O snapshot de exercícios não é armazenado no servidor — é reconstruído
// a partir das séries realizadas (suficiente para exibir o histórico).
function reconstruirExercicios(series: SerieRealizada[]): ExercicioSessao[] {
  const porExercicio = new Map<string, SerieRealizada[]>();
  for (const serie of series) {
    const lista = porExercicio.get(serie.exercicioFichaId) ?? [];
    lista.push(serie);
    porExercicio.set(serie.exercicioFichaId, lista);
  }
  return Array.from(porExercicio.entries()).map(([exercicioFichaId, lista], indice) => {
    const primeira = lista[0];
    return {
      exercicioFichaId,
      nome: primeira?.nomeExercicio ?? 'Exercício',
      ordem: indice,
      seriesPlanejadas: lista.length,
      repeticoesMin: 1,
      repeticoesMax: Math.max(...lista.map((serie) => serie.repeticoes)),
      cargaReferenciaKg: null,
      descansoSegundos: 0,
    };
  });
}

export async function pullSessoesDoSupabase(
  supabase: SupabaseBrowser,
  usuarioId: string
): Promise<SessaoTreino[]> {
  const { data: linhasSessao, error: erroSessoes } = await supabase
    .from('sessoes_treino')
    .select('*')
    .eq('usuario_id', usuarioId);
  if (erroSessoes) {
    throw new Error(`Falha ao buscar sessões: ${erroSessoes.message}`);
  }

  const { data: linhasSerie, error: erroSeries } = await supabase
    .from('series_realizadas')
    .select('*')
    .eq('usuario_id', usuarioId)
    .is('deletado_em', null);
  if (erroSeries) {
    throw new Error(`Falha ao buscar séries: ${erroSeries.message}`);
  }

  const seriesPorSessao = new Map<string, SerieRealizada[]>();
  for (const bruto of linhasSerie ?? []) {
    const resultado = esquemaLinhaSerie.safeParse(bruto);
    if (!resultado.success) {
      console.warn('[sync] Série inválida ignorada:', resultado.error.message);
      continue;
    }
    const linha = resultado.data;
    const lista = seriesPorSessao.get(linha.sessao_id) ?? [];
    lista.push({
      id: linha.id,
      exercicioFichaId: linha.exercicio_ficha_id,
      nomeExercicio: linha.nome_exercicio,
      numeroSerie: linha.numero_serie,
      repeticoes: linha.repeticoes,
      pesoKg: linha.peso_kg,
      realizadaEm: linha.realizada_em,
    });
    seriesPorSessao.set(linha.sessao_id, lista);
  }

  const sessoes: SessaoTreino[] = [];
  for (const bruto of linhasSessao ?? []) {
    const resultado = esquemaLinhaSessao.safeParse(bruto);
    if (!resultado.success) {
      console.warn('[sync] Sessão inválida ignorada:', resultado.error.message);
      continue;
    }
    const linha = resultado.data;
    const series = (seriesPorSessao.get(linha.id) ?? []).sort((a, b) =>
      a.realizadaEm.localeCompare(b.realizadaEm)
    );
    sessoes.push({
      id: linha.id,
      clientId: linha.client_id,
      usuarioId: linha.usuario_id,
      fichaId: linha.ficha_id,
      nomeFicha: linha.nome_ficha,
      exercicios: reconstruirExercicios(series),
      series,
      status: linha.status as StatusSessao,
      iniciadaEm: linha.iniciada_em,
      concluidaEm: linha.concluida_em,
      atualizadoEm: linha.atualizado_em,
      deletadoEm: linha.deletado_em,
    });
  }
  return sessoes;
}
