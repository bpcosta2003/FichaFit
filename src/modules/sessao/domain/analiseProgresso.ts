// Camada de domínio — pura. Sem React, Dexie ou Supabase.
// Análise do histórico de um exercício ao longo de sessões concluídas.
// As funções recebem as sessões JÁ ordenadas da mais recente para a mais antiga.
import type { DesempenhoExercicioAnterior } from './progressaoCarga';
import { seriesDoExercicio, type SessaoTreino } from './SessaoTreino';

export const MIN_SESSOES_PARA_PLATO = 3;

// Desempenho do exercício na sessão concluída MAIS RECENTE que o contém.
export function extrairDesempenhoAnterior(
  sessoesConcluidasDesc: readonly SessaoTreino[],
  exercicioFichaId: string
): DesempenhoExercicioAnterior | null {
  for (const sessao of sessoesConcluidasDesc) {
    const series = seriesDoExercicio(sessao, exercicioFichaId);
    if (series.length === 0) {
      continue;
    }
    const cargaBaseKg = Math.max(...series.map((serie) => serie.pesoKg));
    const repsRegistradasMax = Math.max(...series.map((serie) => serie.repeticoes));
    const exercicio = sessao.exercicios.find(
      (item) => item.exercicioFichaId === exercicioFichaId
    );
    // Prefere o teto planejado do snapshot; sessões reconstruídas do servidor
    // não têm essa info confiável, então cai para as reps registradas.
    const repeticoesMax = exercicio?.repeticoesMax ?? repsRegistradasMax;
    const bateuTopoEmTodasSeries = series.every((serie) => serie.repeticoes >= repeticoesMax);
    return { cargaBaseKg, repeticoesMax, bateuTopoEmTodasSeries };
  }
  return null;
}

export interface ResultadoPlato {
  emPlato: boolean;
  sessoesAnalisadas: number;
}

interface PontoHistorico {
  melhorCargaKg: number;
  melhorVolume: number;
}

// Platô: nas últimas N sessões com o exercício, nem a melhor carga nem o melhor
// volume (peso × reps) superaram a sessão mais antiga da janela.
export function detectarPlato(
  sessoesConcluidasDesc: readonly SessaoTreino[],
  exercicioFichaId: string
): ResultadoPlato {
  const pontos: PontoHistorico[] = [];
  for (const sessao of sessoesConcluidasDesc) {
    const series = seriesDoExercicio(sessao, exercicioFichaId);
    if (series.length === 0) {
      continue;
    }
    pontos.push({
      melhorCargaKg: Math.max(...series.map((serie) => serie.pesoKg)),
      melhorVolume: Math.max(...series.map((serie) => serie.pesoKg * serie.repeticoes)),
    });
    if (pontos.length === MIN_SESSOES_PARA_PLATO) {
      break;
    }
  }
  const maisAntiga = pontos[pontos.length - 1];
  if (pontos.length < MIN_SESSOES_PARA_PLATO || maisAntiga === undefined) {
    return { emPlato: false, sessoesAnalisadas: pontos.length };
  }
  const melhorCargaJanela = Math.max(...pontos.map((ponto) => ponto.melhorCargaKg));
  const melhorVolumeJanela = Math.max(...pontos.map((ponto) => ponto.melhorVolume));
  const semGanhoCarga = melhorCargaJanela <= maisAntiga.melhorCargaKg;
  const semGanhoVolume = melhorVolumeJanela <= maisAntiga.melhorVolume;
  return { emPlato: semGanhoCarga && semGanhoVolume, sessoesAnalisadas: pontos.length };
}
