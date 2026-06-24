import { describe, expect, it } from 'vitest';

import { calcularSugestaoCarga, INCREMENTO_CARGA_KG } from './progressaoCarga';

describe('calcularSugestaoCarga', () => {
  it('sem histórico usa a carga de referência', () => {
    expect(calcularSugestaoCarga(null, 40)).toEqual({
      pesoKg: 40,
      motivo: 'sem_historico',
      pesoAnteriorKg: null,
    });
  });

  it('sem histórico e sem referência sugere 0', () => {
    expect(calcularSugestaoCarga(null, null).pesoKg).toBe(0);
  });

  it('sobe a carga quando bateu o topo das reps em todas as séries', () => {
    const sugestao = calcularSugestaoCarga(
      { cargaBaseKg: 30, repeticoesMax: 10, bateuTopoEmTodasSeries: true },
      30
    );
    expect(sugestao.motivo).toBe('subir');
    expect(sugestao.pesoKg).toBe(30 + INCREMENTO_CARGA_KG);
    expect(sugestao.pesoAnteriorKg).toBe(30);
  });

  it('mantém a carga quando não bateu o topo', () => {
    const sugestao = calcularSugestaoCarga(
      { cargaBaseKg: 30, repeticoesMax: 10, bateuTopoEmTodasSeries: false },
      30
    );
    expect(sugestao.motivo).toBe('manter');
    expect(sugestao.pesoKg).toBe(30);
  });

  it('peso corporal (carga 0) mantém mesmo batendo o topo', () => {
    const sugestao = calcularSugestaoCarga(
      { cargaBaseKg: 0, repeticoesMax: 12, bateuTopoEmTodasSeries: true },
      0
    );
    expect(sugestao.motivo).toBe('manter');
    expect(sugestao.pesoKg).toBe(0);
  });
});
