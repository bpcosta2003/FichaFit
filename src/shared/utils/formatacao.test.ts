import { describe, expect, it } from 'vitest';

import {
  formatarDataRelativa,
  formatarDuracao,
  formatarPesoKg,
  formatarTempoTimer,
} from './formatacao';

describe('formatarDuracao', () => {
  it('formata segundos, minutos e horas', () => {
    expect(formatarDuracao(45)).toBe('45s');
    expect(formatarDuracao(12 * 60)).toBe('12min');
    expect(formatarDuracao(3900)).toBe('1h 05min');
    expect(formatarDuracao(-5)).toBe('0s');
  });
});

describe('formatarTempoTimer', () => {
  it('formata no padrão m:ss', () => {
    expect(formatarTempoTimer(65)).toBe('1:05');
    expect(formatarTempoTimer(0)).toBe('0:00');
    expect(formatarTempoTimer(90)).toBe('1:30');
  });
});

describe('formatarDataRelativa', () => {
  const agora = new Date(2026, 5, 11, 15, 0, 0);

  it('reconhece hoje, ontem e dias recentes', () => {
    expect(formatarDataRelativa(new Date(2026, 5, 11, 8, 0).toISOString(), agora)).toBe('hoje');
    expect(formatarDataRelativa(new Date(2026, 5, 10, 22, 0).toISOString(), agora)).toBe('ontem');
    expect(formatarDataRelativa(new Date(2026, 5, 8, 10, 0).toISOString(), agora)).toBe(
      'há 3 dias'
    );
  });

  it('usa data completa para registros antigos', () => {
    expect(formatarDataRelativa(new Date(2026, 4, 1, 10, 0).toISOString(), agora)).toBe(
      '01/05/2026'
    );
  });
});

describe('formatarPesoKg', () => {
  it('formata em kg com vírgula decimal', () => {
    expect(formatarPesoKg(80)).toBe('80 kg');
    expect(formatarPesoKg(12.5)).toBe('12,5 kg');
  });
});
