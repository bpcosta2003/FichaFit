// Camada de domínio — pura. Sem React, Dexie ou Supabase.
// Todas as funções retornam novos objetos — nunca mutam o argumento.
import { v4 as uuidv4 } from 'uuid';

import type { FichaTreino } from '@/modules/fichas/domain/FichaTreino';

export type StatusSessao = 'em_andamento' | 'concluida' | 'cancelada';

// Snapshot do exercício no momento em que a sessão começa —
// edições posteriores na ficha não afetam sessões já registradas.
export interface ExercicioSessao {
  exercicioFichaId: string;
  nome: string;
  ordem: number;
  seriesPlanejadas: number;
  repeticoesMin: number;
  repeticoesMax: number;
  cargaReferenciaKg: number | null;
  descansoSegundos: number;
  // Foto de como executar o exercício — vem do catálogo, não da ficha.
  imagemUrl: string | null;
}

export interface SerieRealizada {
  id: string;
  exercicioFichaId: string;
  nomeExercicio: string;
  numeroSerie: number;
  repeticoes: number;
  pesoKg: number;
  realizadaEm: string;
}

export interface SessaoTreino {
  id: string;
  clientId: string;
  usuarioId: string;
  fichaId: string;
  nomeFicha: string;
  exercicios: ExercicioSessao[];
  series: SerieRealizada[];
  status: StatusSessao;
  iniciadaEm: string;
  concluidaEm: string | null;
  atualizadoEm: string;
  deletadoEm: string | null;
}

export interface ProgressoSessao {
  exerciciosConcluidos: number;
  totalExercicios: number;
  seriesRealizadas: number;
  seriesPlanejadas: number;
}

export function iniciarSessao(
  ficha: FichaTreino,
  obterImagemUrl: (exercicioDefinicaoId: string | null) => string | null = () => null
): SessaoTreino {
  const exerciciosAtivos = [...ficha.exercicios].sort((a, b) => a.ordem - b.ordem);
  if (exerciciosAtivos.length === 0) {
    throw new Error('A ficha precisa ter ao menos um exercício para iniciar o treino.');
  }
  const agora = new Date().toISOString();
  return {
    id: uuidv4(),
    clientId: uuidv4(),
    usuarioId: ficha.usuarioId,
    fichaId: ficha.id,
    nomeFicha: ficha.nome,
    exercicios: exerciciosAtivos.map((exercicio, indice) => ({
      exercicioFichaId: exercicio.id,
      nome: exercicio.nome,
      ordem: indice,
      seriesPlanejadas: exercicio.series,
      repeticoesMin: exercicio.repeticoesMin,
      repeticoesMax: exercicio.repeticoesMax,
      cargaReferenciaKg: exercicio.cargaReferenciaKg,
      descansoSegundos: exercicio.descansoSegundos,
      imagemUrl: obterImagemUrl(exercicio.exercicioDefinicaoId),
    })),
    series: [],
    status: 'em_andamento',
    iniciadaEm: agora,
    concluidaEm: null,
    atualizadoEm: agora,
    deletadoEm: null,
  };
}

export function seriesDoExercicio(
  sessao: SessaoTreino,
  exercicioFichaId: string
): SerieRealizada[] {
  return sessao.series.filter((serie) => serie.exercicioFichaId === exercicioFichaId);
}

export function exercicioConcluido(
  sessao: SessaoTreino,
  exercicio: ExercicioSessao
): boolean {
  return seriesDoExercicio(sessao, exercicio.exercicioFichaId).length >= exercicio.seriesPlanejadas;
}

export function exercicioAtual(sessao: SessaoTreino): ExercicioSessao | null {
  const ordenados = [...sessao.exercicios].sort((a, b) => a.ordem - b.ordem);
  return ordenados.find((exercicio) => !exercicioConcluido(sessao, exercicio)) ?? null;
}

export interface NovaSerie {
  exercicioFichaId: string;
  repeticoes: number;
  pesoKg: number;
}

export function registrarSerie(sessao: SessaoTreino, dados: NovaSerie): SessaoTreino {
  if (sessao.status !== 'em_andamento') {
    throw new Error('Não é possível registrar séries em uma sessão encerrada.');
  }
  const exercicio = sessao.exercicios.find(
    (item) => item.exercicioFichaId === dados.exercicioFichaId
  );
  if (exercicio === undefined) {
    throw new Error('Exercício não encontrado na sessão.');
  }
  if (!Number.isInteger(dados.repeticoes) || dados.repeticoes < 1) {
    throw new Error('O número de repetições deve ser um inteiro maior que zero.');
  }
  if (!Number.isFinite(dados.pesoKg) || dados.pesoKg < 0) {
    throw new Error('O peso deve ser zero ou maior.');
  }
  const realizadas = seriesDoExercicio(sessao, dados.exercicioFichaId).length;
  if (realizadas >= exercicio.seriesPlanejadas) {
    throw new Error('Todas as séries deste exercício já foram registradas.');
  }
  const agora = new Date().toISOString();
  const serie: SerieRealizada = {
    id: uuidv4(),
    exercicioFichaId: dados.exercicioFichaId,
    nomeExercicio: exercicio.nome,
    numeroSerie: realizadas + 1,
    repeticoes: dados.repeticoes,
    pesoKg: dados.pesoKg,
    realizadaEm: agora,
  };
  return {
    ...sessao,
    series: [...sessao.series, serie],
    atualizadoEm: agora,
  };
}

export function progressoSessao(sessao: SessaoTreino): ProgressoSessao {
  return {
    exerciciosConcluidos: sessao.exercicios.filter((exercicio) =>
      exercicioConcluido(sessao, exercicio)
    ).length,
    totalExercicios: sessao.exercicios.length,
    seriesRealizadas: sessao.series.length,
    seriesPlanejadas: sessao.exercicios.reduce(
      (total, exercicio) => total + exercicio.seriesPlanejadas,
      0
    ),
  };
}

export function sessaoCompleta(sessao: SessaoTreino): boolean {
  return sessao.exercicios.every((exercicio) => exercicioConcluido(sessao, exercicio));
}

export function concluirSessao(sessao: SessaoTreino): SessaoTreino {
  if (sessao.status !== 'em_andamento') {
    throw new Error('A sessão já foi encerrada.');
  }
  const agora = new Date().toISOString();
  return { ...sessao, status: 'concluida', concluidaEm: agora, atualizadoEm: agora };
}

export function cancelarSessao(sessao: SessaoTreino): SessaoTreino {
  if (sessao.status !== 'em_andamento') {
    throw new Error('A sessão já foi encerrada.');
  }
  const agora = new Date().toISOString();
  return { ...sessao, status: 'cancelada', concluidaEm: agora, atualizadoEm: agora };
}

// Peso pré-preenchido: última série do exercício, ou a carga de referência.
export function pesoSugerido(sessao: SessaoTreino, exercicioFichaId: string): number {
  const series = seriesDoExercicio(sessao, exercicioFichaId);
  const ultima = series[series.length - 1];
  if (ultima !== undefined) {
    return ultima.pesoKg;
  }
  const exercicio = sessao.exercicios.find(
    (item) => item.exercicioFichaId === exercicioFichaId
  );
  return exercicio?.cargaReferenciaKg ?? 0;
}

export function duracaoSegundos(sessao: SessaoTreino): number {
  const fim = sessao.concluidaEm ? new Date(sessao.concluidaEm) : new Date();
  return Math.max(0, Math.round((fim.getTime() - new Date(sessao.iniciadaEm).getTime()) / 1000));
}
