import { describe, expect, it } from 'vitest';

import { detectarPlato, extrairDesempenhoAnterior } from './analiseProgresso';
import type { SessaoTreino } from './SessaoTreino';

// Constrói uma sessão concluída com séries de UM exercício.
function sessao(
  exercicioFichaId: string,
  repeticoesMax: number,
  series: Array<{ reps: number; peso: number }>,
  iso: string
): SessaoTreino {
  return {
    id: iso,
    clientId: iso,
    usuarioId: 'u',
    fichaId: 'f',
    nomeFicha: 'Ficha',
    exercicios: [
      {
        exercicioFichaId,
        nome: 'Exercício',
        ordem: 0,
        seriesPlanejadas: series.length,
        repeticoesMin: 1,
        repeticoesMax,
        cargaReferenciaKg: null,
        descansoSegundos: 60,
        imagemUrl: null,
        grupoMuscular: null,
      },
    ],
    series: series.map((serie, indice) => ({
      id: `${iso}-${indice}`,
      exercicioFichaId,
      nomeExercicio: 'Exercício',
      numeroSerie: indice + 1,
      repeticoes: serie.reps,
      pesoKg: serie.peso,
      realizadaEm: iso,
    })),
    status: 'concluida',
    iniciadaEm: iso,
    concluidaEm: iso,
    atualizadoEm: iso,
    deletadoEm: null,
  };
}

describe('extrairDesempenhoAnterior', () => {
  it('retorna null sem histórico', () => {
    expect(extrairDesempenhoAnterior([], 'ex-1')).toBeNull();
  });

  it('usa a sessão mais recente que contém o exercício e o top set', () => {
    const sessoes = [
      sessao('ex-1', 10, [{ reps: 8, peso: 32 }, { reps: 8, peso: 30 }], '2026-06-20T10:00:00.000Z'),
      sessao('ex-1', 10, [{ reps: 8, peso: 28 }], '2026-06-18T10:00:00.000Z'),
    ];
    const desempenho = extrairDesempenhoAnterior(sessoes, 'ex-1');
    expect(desempenho?.cargaBaseKg).toBe(32);
    expect(desempenho?.bateuTopoEmTodasSeries).toBe(false);
  });

  it('ignora sessões sem o exercício', () => {
    const sessoes = [
      sessao('outro', 10, [{ reps: 10, peso: 50 }], '2026-06-20T10:00:00.000Z'),
      sessao('ex-1', 12, [{ reps: 12, peso: 40 }], '2026-06-18T10:00:00.000Z'),
    ];
    const desempenho = extrairDesempenhoAnterior(sessoes, 'ex-1');
    expect(desempenho?.cargaBaseKg).toBe(40);
    expect(desempenho?.bateuTopoEmTodasSeries).toBe(true);
  });
});

describe('detectarPlato', () => {
  it('não detecta platô com menos de 3 sessões', () => {
    const sessoes = [
      sessao('ex-1', 10, [{ reps: 8, peso: 30 }], '2026-06-20T10:00:00.000Z'),
      sessao('ex-1', 10, [{ reps: 8, peso: 30 }], '2026-06-18T10:00:00.000Z'),
    ];
    expect(detectarPlato(sessoes, 'ex-1').emPlato).toBe(false);
  });

  it('detecta platô quando carga e volume não evoluem', () => {
    const sessoes = [
      sessao('ex-1', 10, [{ reps: 8, peso: 30 }], '2026-06-22T10:00:00.000Z'),
      sessao('ex-1', 10, [{ reps: 8, peso: 30 }], '2026-06-20T10:00:00.000Z'),
      sessao('ex-1', 10, [{ reps: 8, peso: 30 }], '2026-06-18T10:00:00.000Z'),
    ];
    expect(detectarPlato(sessoes, 'ex-1').emPlato).toBe(true);
  });

  it('não detecta platô quando a carga cresce', () => {
    const sessoes = [
      sessao('ex-1', 10, [{ reps: 8, peso: 32 }], '2026-06-22T10:00:00.000Z'),
      sessao('ex-1', 10, [{ reps: 8, peso: 30 }], '2026-06-20T10:00:00.000Z'),
      sessao('ex-1', 10, [{ reps: 8, peso: 28 }], '2026-06-18T10:00:00.000Z'),
    ];
    expect(detectarPlato(sessoes, 'ex-1').emPlato).toBe(false);
  });

  it('não detecta platô quando só o volume cresce (mesma carga, mais reps)', () => {
    const sessoes = [
      sessao('ex-1', 12, [{ reps: 10, peso: 30 }], '2026-06-22T10:00:00.000Z'),
      sessao('ex-1', 12, [{ reps: 9, peso: 30 }], '2026-06-20T10:00:00.000Z'),
      sessao('ex-1', 12, [{ reps: 8, peso: 30 }], '2026-06-18T10:00:00.000Z'),
    ];
    expect(detectarPlato(sessoes, 'ex-1').emPlato).toBe(false);
  });
});
