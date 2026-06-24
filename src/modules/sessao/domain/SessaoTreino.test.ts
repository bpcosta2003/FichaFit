import { describe, expect, it } from 'vitest';

import { adicionarExercicio, criarFicha, type FichaTreino } from '@/modules/fichas/domain/FichaTreino';
import {
  cancelarSessao,
  concluirSessao,
  exercicioAtual,
  iniciarSessao,
  pesoSugerido,
  progressoSessao,
  registrarSerie,
  sessaoCompleta,
} from './SessaoTreino';

function fichaComExercicios(): FichaTreino {
  let ficha = criarFicha({ nome: 'Treino A', usuarioId: 'usuario-teste' });
  ficha = adicionarExercicio(ficha, {
    nome: 'Supino Reto',
    series: 2,
    repeticoesMin: 8,
    repeticoesMax: 10,
    cargaReferenciaKg: 80,
    descansoSegundos: 90,
  });
  ficha = adicionarExercicio(ficha, {
    nome: 'Agachamento',
    series: 2,
    repeticoesMin: 10,
    repeticoesMax: 12,
  });
  return ficha;
}

describe('iniciarSessao', () => {
  it('cria sessão em andamento com snapshot dos exercícios', () => {
    const sessao = iniciarSessao(fichaComExercicios());
    expect(sessao.status).toBe('em_andamento');
    expect(sessao.exercicios).toHaveLength(2);
    expect(sessao.exercicios[0]?.nome).toBe('Supino Reto');
    expect(sessao.clientId).not.toBe(sessao.id);
    expect(sessao.series).toHaveLength(0);
  });

  it('rejeita ficha sem exercícios', () => {
    const fichaVazia = criarFicha({ nome: 'Vazia', usuarioId: 'usuario-teste' });
    expect(() => iniciarSessao(fichaVazia)).toThrow(/ao menos um exercício/);
  });

  it('deixa imagem e grupo nulos quando não há resolver de catálogo', () => {
    const sessao = iniciarSessao(fichaComExercicios());
    expect(sessao.exercicios[0]?.imagemUrl).toBeNull();
    expect(sessao.exercicios[0]?.grupoMuscular).toBeNull();
  });

  it('anexa imagem e grupo do catálogo via resolver', () => {
    const sessao = iniciarSessao(fichaComExercicios(), () => ({
      imagemUrl: 'https://wger.de/foto.png',
      grupoMuscular: 'Peito',
    }));
    expect(sessao.exercicios[0]?.imagemUrl).toBe('https://wger.de/foto.png');
    expect(sessao.exercicios[0]?.grupoMuscular).toBe('Peito');
  });
});

describe('registrarSerie', () => {
  it('adiciona série numerada sem mutar a sessão original', () => {
    const sessao = iniciarSessao(fichaComExercicios());
    const exercicio = exercicioAtual(sessao);
    expect(exercicio).not.toBeNull();
    const nova = registrarSerie(sessao, {
      exercicioFichaId: exercicio?.exercicioFichaId ?? '',
      repeticoes: 8,
      pesoKg: 80,
    });
    expect(sessao.series).toHaveLength(0);
    expect(nova.series).toHaveLength(1);
    expect(nova.series[0]?.numeroSerie).toBe(1);
    expect(nova.series[0]?.nomeExercicio).toBe('Supino Reto');
  });

  it('rejeita repetições inválidas e peso negativo', () => {
    const sessao = iniciarSessao(fichaComExercicios());
    const id = exercicioAtual(sessao)?.exercicioFichaId ?? '';
    expect(() => registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 0, pesoKg: 10 })).toThrow();
    expect(() => registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 2.5, pesoKg: 10 })).toThrow();
    expect(() => registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 8, pesoKg: -1 })).toThrow();
  });

  it('rejeita série além do planejado e exercício desconhecido', () => {
    let sessao = iniciarSessao(fichaComExercicios());
    const id = exercicioAtual(sessao)?.exercicioFichaId ?? '';
    sessao = registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 8, pesoKg: 80 });
    sessao = registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 8, pesoKg: 80 });
    expect(() =>
      registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 8, pesoKg: 80 })
    ).toThrow(/já foram registradas/);
    expect(() =>
      registrarSerie(sessao, { exercicioFichaId: 'inexistente', repeticoes: 8, pesoKg: 80 })
    ).toThrow(/não encontrado/);
  });

  it('rejeita registro em sessão encerrada', () => {
    const sessao = iniciarSessao(fichaComExercicios());
    const id = exercicioAtual(sessao)?.exercicioFichaId ?? '';
    const cancelada = cancelarSessao(sessao);
    expect(() =>
      registrarSerie(cancelada, { exercicioFichaId: id, repeticoes: 8, pesoKg: 80 })
    ).toThrow(/encerrada/);
  });
});

describe('exercicioAtual e progresso', () => {
  it('avança para o próximo exercício quando as séries terminam', () => {
    let sessao = iniciarSessao(fichaComExercicios());
    const primeiro = exercicioAtual(sessao);
    expect(primeiro?.nome).toBe('Supino Reto');
    const id = primeiro?.exercicioFichaId ?? '';
    sessao = registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 8, pesoKg: 80 });
    sessao = registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 8, pesoKg: 80 });
    expect(exercicioAtual(sessao)?.nome).toBe('Agachamento');
    expect(progressoSessao(sessao)).toEqual({
      exerciciosConcluidos: 1,
      totalExercicios: 2,
      seriesRealizadas: 2,
      seriesPlanejadas: 4,
    });
    expect(sessaoCompleta(sessao)).toBe(false);
  });
});

describe('pesoSugerido', () => {
  it('usa a carga de referência antes da primeira série e o último peso depois', () => {
    let sessao = iniciarSessao(fichaComExercicios());
    const id = exercicioAtual(sessao)?.exercicioFichaId ?? '';
    expect(pesoSugerido(sessao, id)).toBe(80);
    sessao = registrarSerie(sessao, { exercicioFichaId: id, repeticoes: 8, pesoKg: 82.5 });
    expect(pesoSugerido(sessao, id)).toBe(82.5);
  });
});

describe('concluirSessao', () => {
  it('marca como concluída com data de conclusão', () => {
    const sessao = iniciarSessao(fichaComExercicios());
    const concluida = concluirSessao(sessao);
    expect(concluida.status).toBe('concluida');
    expect(concluida.concluidaEm).not.toBeNull();
    expect(sessao.status).toBe('em_andamento');
    expect(() => concluirSessao(concluida)).toThrow(/já foi encerrada/);
  });
});
