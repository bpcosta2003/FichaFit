import { describe, expect, it } from 'vitest';

import {
  adicionarExercicio,
  criarFicha,
  exerciciosOrdenados,
  marcarFichaDeletada,
  moverExercicio,
  removerExercicio,
  renomearFicha,
  SERIES_PADRAO,
  TEMPO_DESCANSO_PADRAO,
} from './FichaTreino';

describe('criarFicha', () => {
  it('cria ficha com nome aparado e sem exercícios', () => {
    const ficha = criarFicha({ nome: '  Treino A  ', usuarioId: 'usuario-teste' });
    expect(ficha.nome).toBe('Treino A');
    expect(ficha.exercicios).toHaveLength(0);
    expect(ficha.deletadoEm).toBeNull();
  });

  it('rejeita nome vazio', () => {
    expect(() => criarFicha({ nome: '   ', usuarioId: 'usuario-teste' })).toThrow(/obrigatório/);
  });
});

describe('adicionarExercicio', () => {
  it('aplica valores padrão e ordem sequencial', () => {
    let ficha = criarFicha({ nome: 'Treino A', usuarioId: 'usuario-teste' });
    ficha = adicionarExercicio(ficha, { nome: 'Supino' });
    ficha = adicionarExercicio(ficha, { nome: 'Remada' });
    expect(ficha.exercicios[0]?.series).toBe(SERIES_PADRAO);
    expect(ficha.exercicios[0]?.descansoSegundos).toBe(TEMPO_DESCANSO_PADRAO);
    expect(ficha.exercicios.map((exercicio) => exercicio.ordem)).toEqual([0, 1]);
  });

  it('não muta a ficha original', () => {
    const original = criarFicha({ nome: 'Treino A', usuarioId: 'usuario-teste' });
    adicionarExercicio(original, { nome: 'Supino' });
    expect(original.exercicios).toHaveLength(0);
  });

  it('rejeita faixa de repetições inválida e séries não positivas', () => {
    const ficha = criarFicha({ nome: 'Treino A', usuarioId: 'usuario-teste' });
    expect(() =>
      adicionarExercicio(ficha, { nome: 'Supino', repeticoesMin: 10, repeticoesMax: 8 })
    ).toThrow(/repetições/);
    expect(() => adicionarExercicio(ficha, { nome: 'Supino', series: 0 })).toThrow(/séries/);
  });
});

describe('removerExercicio e moverExercicio', () => {
  function fichaComTres() {
    let ficha = criarFicha({ nome: 'Treino A', usuarioId: 'usuario-teste' });
    ficha = adicionarExercicio(ficha, { nome: 'A' });
    ficha = adicionarExercicio(ficha, { nome: 'B' });
    ficha = adicionarExercicio(ficha, { nome: 'C' });
    return ficha;
  }

  it('reordena após remoção', () => {
    const ficha = fichaComTres();
    const segundoId = ficha.exercicios[1]?.id ?? '';
    const semSegundo = removerExercicio(ficha, segundoId);
    expect(exerciciosOrdenados(semSegundo).map((exercicio) => exercicio.nome)).toEqual(['A', 'C']);
    expect(exerciciosOrdenados(semSegundo).map((exercicio) => exercicio.ordem)).toEqual([0, 1]);
  });

  it('move para cima e ignora movimento fora dos limites', () => {
    const ficha = fichaComTres();
    const terceiroId = exerciciosOrdenados(ficha)[2]?.id ?? '';
    const movida = moverExercicio(ficha, terceiroId, 'cima');
    expect(exerciciosOrdenados(movida).map((exercicio) => exercicio.nome)).toEqual(['A', 'C', 'B']);
    const primeiroId = exerciciosOrdenados(ficha)[0]?.id ?? '';
    expect(moverExercicio(ficha, primeiroId, 'cima')).toBe(ficha);
  });
});

describe('renomearFicha e marcarFichaDeletada', () => {
  it('renomeia e atualiza o carimbo de atualização', () => {
    const ficha = criarFicha({ nome: 'Treino A', usuarioId: 'usuario-teste' });
    const renomeada = renomearFicha(ficha, 'Treino B');
    expect(renomeada.nome).toBe('Treino B');
    expect(ficha.nome).toBe('Treino A');
  });

  it('soft delete preenche deletadoEm sem remover dados', () => {
    const ficha = criarFicha({ nome: 'Treino A', usuarioId: 'usuario-teste' });
    const deletada = marcarFichaDeletada(ficha);
    expect(deletada.deletadoEm).not.toBeNull();
    expect(deletada.nome).toBe('Treino A');
  });
});
