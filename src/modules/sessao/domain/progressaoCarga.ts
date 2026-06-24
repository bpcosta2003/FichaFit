// Camada de domínio — pura. Sem React, Dexie ou Supabase.
// Sugestão de carga para a PRIMEIRA série de um exercício, com base no
// desempenho da última sessão concluída desse mesmo exercício.

export const INCREMENTO_CARGA_KG = 2.5;

export type MotivoSugestao = 'subir' | 'manter' | 'sem_historico';

// Resumo do desempenho de UM exercício em UMA sessão anterior.
// Calculado na camada application a partir do histórico.
export interface DesempenhoExercicioAnterior {
  // Carga representativa da sessão = maior peso entre as séries (top set).
  cargaBaseKg: number;
  // Teto de reps planejado naquela sessão.
  repeticoesMax: number;
  // Todas as séries atingiram o teto de reps.
  bateuTopoEmTodasSeries: boolean;
}

export interface SugestaoCarga {
  pesoKg: number;
  motivo: MotivoSugestao;
  pesoAnteriorKg: number | null;
}

// Heurística: se bateu o topo das reps em todas as séries, sugere subir a carga;
// senão mantém. Sem histórico, usa a carga de referência da ficha.
export function calcularSugestaoCarga(
  anterior: DesempenhoExercicioAnterior | null,
  cargaReferenciaKg: number | null
): SugestaoCarga {
  if (anterior === null) {
    return { pesoKg: cargaReferenciaKg ?? 0, motivo: 'sem_historico', pesoAnteriorKg: null };
  }
  // Peso corporal / sem carga: não faz sentido sugerir incremento.
  if (anterior.cargaBaseKg <= 0) {
    return { pesoKg: anterior.cargaBaseKg, motivo: 'manter', pesoAnteriorKg: anterior.cargaBaseKg };
  }
  if (anterior.bateuTopoEmTodasSeries) {
    return {
      pesoKg: anterior.cargaBaseKg + INCREMENTO_CARGA_KG,
      motivo: 'subir',
      pesoAnteriorKg: anterior.cargaBaseKg,
    };
  }
  return { pesoKg: anterior.cargaBaseKg, motivo: 'manter', pesoAnteriorKg: anterior.cargaBaseKg };
}
