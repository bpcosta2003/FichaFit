// Camada de domínio — pura. Sem React, Dexie ou Supabase.
// Avisa quando um grupo muscular da ficha foi treinado recentemente.
import type { SessaoTreino } from './SessaoTreino';

export const LIMIAR_DESCANSO_HORAS = 48;

export interface GrupoTreinadoRecente {
  grupoMuscular: string;
  horasDesde: number;
  ultimaVezIso: string;
}

const MS_POR_HORA = 1000 * 60 * 60;

function normalizar(grupo: string): string {
  return grupo.trim().toLocaleLowerCase('pt-BR');
}

// Para cada grupo da ficha, encontra o treino mais recente daquele grupo no
// histórico (via grupoMuscular do snapshot da sessão) e, se foi há menos que o
// limiar, inclui no aviso. Sessões antigas sem grupoMuscular são ignoradas.
export function analisarDescansoGrupos(
  gruposDaFicha: readonly string[],
  sessoesConcluidasDesc: readonly SessaoTreino[],
  agora: Date = new Date(),
  limiarHoras: number = LIMIAR_DESCANSO_HORAS
): GrupoTreinadoRecente[] {
  const alvo = new Set(gruposDaFicha.map(normalizar).filter((grupo) => grupo.length > 0));
  if (alvo.size === 0) {
    return [];
  }

  const maisRecentePorGrupo = new Map<string, { iso: string; rotulo: string }>();
  for (const sessao of sessoesConcluidasDesc) {
    const grupoPorExercicio = new Map<string, string | null>();
    for (const exercicio of sessao.exercicios) {
      grupoPorExercicio.set(exercicio.exercicioFichaId, exercicio.grupoMuscular);
    }
    for (const serie of sessao.series) {
      const grupoBruto = grupoPorExercicio.get(serie.exercicioFichaId) ?? null;
      if (grupoBruto === null) {
        continue;
      }
      const chave = normalizar(grupoBruto);
      if (!alvo.has(chave)) {
        continue;
      }
      const atual = maisRecentePorGrupo.get(chave);
      // ISO 8601 compara cronologicamente como string.
      if (atual === undefined || serie.realizadaEm > atual.iso) {
        maisRecentePorGrupo.set(chave, { iso: serie.realizadaEm, rotulo: grupoBruto.trim() });
      }
    }
  }

  const resultado: GrupoTreinadoRecente[] = [];
  for (const { iso, rotulo } of maisRecentePorGrupo.values()) {
    const horasDesde = (agora.getTime() - new Date(iso).getTime()) / MS_POR_HORA;
    if (horasDesde < limiarHoras) {
      resultado.push({ grupoMuscular: rotulo, horasDesde, ultimaVezIso: iso });
    }
  }
  resultado.sort((a, b) => a.horasDesde - b.horasDesde);
  return resultado;
}
