import { describe, expect, it } from 'vitest';

import { analisarDescansoGrupos } from './descansoGrupos';
import type { SessaoTreino } from './SessaoTreino';

const AGORA = new Date('2026-06-24T20:00:00.000Z');

function horasAtras(horas: number): string {
  return new Date(AGORA.getTime() - horas * 60 * 60 * 1000).toISOString();
}

// Sessão concluída com um exercício de um dado grupo muscular (ou null).
function sessao(grupoMuscular: string | null, iso: string, exercicioFichaId = 'ex-1'): SessaoTreino {
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
        seriesPlanejadas: 1,
        repeticoesMin: 8,
        repeticoesMax: 10,
        cargaReferenciaKg: null,
        descansoSegundos: 60,
        imagemUrl: null,
        grupoMuscular,
      },
    ],
    series: [
      {
        id: `${iso}-0`,
        exercicioFichaId,
        nomeExercicio: 'Exercício',
        numeroSerie: 1,
        repeticoes: 8,
        pesoKg: 30,
        realizadaEm: iso,
      },
    ],
    status: 'concluida',
    iniciadaEm: iso,
    concluidaEm: iso,
    atualizadoEm: iso,
    deletadoEm: null,
  };
}

describe('analisarDescansoGrupos', () => {
  it('avisa quando o grupo foi treinado há menos de 48h', () => {
    const resultado = analisarDescansoGrupos(['Peito'], [sessao('Peito', horasAtras(20))], AGORA);
    expect(resultado).toHaveLength(1);
    expect(resultado[0]?.grupoMuscular).toBe('Peito');
    expect(Math.round(resultado[0]?.horasDesde ?? 0)).toBe(20);
  });

  it('não avisa quando passou de 48h', () => {
    const resultado = analisarDescansoGrupos(['Peito'], [sessao('Peito', horasAtras(60))], AGORA);
    expect(resultado).toHaveLength(0);
  });

  it('ignora sessões sem grupo muscular (snapshot antigo)', () => {
    const resultado = analisarDescansoGrupos(['Peito'], [sessao(null, horasAtras(10))], AGORA);
    expect(resultado).toHaveLength(0);
  });

  it('retorna vazio sem histórico ou sem grupos', () => {
    expect(analisarDescansoGrupos(['Peito'], [], AGORA)).toHaveLength(0);
    expect(analisarDescansoGrupos([], [sessao('Peito', horasAtras(10))], AGORA)).toHaveLength(0);
  });

  it('ordena por horas desde o treino (mais recente primeiro)', () => {
    const resultado = analisarDescansoGrupos(
      ['Peito', 'Costas'],
      [sessao('Costas', horasAtras(30), 'ex-2'), sessao('Peito', horasAtras(10), 'ex-1')],
      AGORA
    );
    expect(resultado.map((grupo) => grupo.grupoMuscular)).toEqual(['Peito', 'Costas']);
  });

  it('é insensível a maiúsculas/acentos de caixa no nome do grupo', () => {
    const resultado = analisarDescansoGrupos(['peito'], [sessao('Peito', horasAtras(5))], AGORA);
    expect(resultado).toHaveLength(1);
  });
});
