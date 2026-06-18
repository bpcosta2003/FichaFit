// Camada de domínio — pura. Sem React, Dexie ou Supabase.
// Todas as funções retornam novos objetos — nunca mutam o argumento.
import { v4 as uuidv4 } from 'uuid';

export const TEMPO_DESCANSO_PADRAO = 90;
export const SERIES_PADRAO = 3;
export const REPETICOES_MIN_PADRAO = 8;
export const REPETICOES_MAX_PADRAO = 12;

export interface ExercicioFicha {
  id: string;
  exercicioDefinicaoId: string | null;
  nome: string;
  ordem: number;
  series: number;
  repeticoesMin: number;
  repeticoesMax: number;
  cargaReferenciaKg: number | null;
  descansoSegundos: number;
  observacoes: string | null;
}

// Texto explicativo gerado pela assistente de IA, guardado junto da ficha
// para o usuário relembrar depois por que aquele treino foi escolhido.
export interface JustificativaIA {
  porqueDoTreino: string;
  comoEvoluir: string;
  nivelAssertividade: string;
}

export interface FichaTreino {
  id: string;
  usuarioId: string;
  nome: string;
  descricao: string | null;
  grupoId: string | null;
  exercicios: ExercicioFicha[];
  justificativaIA: JustificativaIA | null;
  criadoEm: string;
  atualizadoEm: string;
  deletadoEm: string | null;
}

export interface NovaFicha {
  nome: string;
  usuarioId: string;
  descricao?: string;
  grupoId?: string | null;
  justificativaIA?: JustificativaIA | null;
}

export interface EdicaoFicha {
  nome: string;
  descricao?: string | null;
}

export interface NovoExercicioFicha {
  nome: string;
  exercicioDefinicaoId?: string | null;
  series?: number;
  repeticoesMin?: number;
  repeticoesMax?: number;
  cargaReferenciaKg?: number | null;
  descansoSegundos?: number;
  observacoes?: string | null;
}

function tocar(ficha: FichaTreino, mudancas: Partial<FichaTreino>): FichaTreino {
  return { ...ficha, ...mudancas, atualizadoEm: new Date().toISOString() };
}

export function criarFicha(dados: NovaFicha): FichaTreino {
  const nome = dados.nome.trim();
  if (nome.length === 0) {
    throw new Error('O nome da ficha é obrigatório.');
  }
  const agora = new Date().toISOString();
  return {
    id: uuidv4(),
    usuarioId: dados.usuarioId,
    nome,
    descricao: dados.descricao?.trim() || null,
    grupoId: dados.grupoId ?? null,
    exercicios: [],
    justificativaIA: dados.justificativaIA ?? null,
    criadoEm: agora,
    atualizadoEm: agora,
    deletadoEm: null,
  };
}

export function editarFicha(ficha: FichaTreino, dados: EdicaoFicha): FichaTreino {
  const nomeLimpo = dados.nome.trim();
  if (nomeLimpo.length === 0) {
    throw new Error('O nome da ficha é obrigatório.');
  }
  const descricao =
    dados.descricao === undefined ? ficha.descricao : dados.descricao?.trim() || null;
  return tocar(ficha, { nome: nomeLimpo, descricao });
}

export function atribuirGrupo(ficha: FichaTreino, grupoId: string | null): FichaTreino {
  return tocar(ficha, { grupoId });
}

export function adicionarExercicio(
  ficha: FichaTreino,
  dados: NovoExercicioFicha
): FichaTreino {
  const nome = dados.nome.trim();
  if (nome.length === 0) {
    throw new Error('O nome do exercício é obrigatório.');
  }
  const series = dados.series ?? SERIES_PADRAO;
  if (!Number.isInteger(series) || series < 1) {
    throw new Error('O número de séries deve ser um inteiro maior que zero.');
  }
  const repeticoesMin = dados.repeticoesMin ?? REPETICOES_MIN_PADRAO;
  const repeticoesMax = dados.repeticoesMax ?? REPETICOES_MAX_PADRAO;
  if (repeticoesMin < 1 || repeticoesMax < repeticoesMin) {
    throw new Error('A faixa de repetições é inválida.');
  }
  const exercicio: ExercicioFicha = {
    id: uuidv4(),
    exercicioDefinicaoId: dados.exercicioDefinicaoId ?? null,
    nome,
    ordem: ficha.exercicios.length,
    series,
    repeticoesMin,
    repeticoesMax,
    cargaReferenciaKg: dados.cargaReferenciaKg ?? null,
    descansoSegundos: dados.descansoSegundos ?? TEMPO_DESCANSO_PADRAO,
    observacoes: dados.observacoes ?? null,
  };
  return tocar(ficha, { exercicios: [...ficha.exercicios, exercicio] });
}

export function atualizarExercicio(
  ficha: FichaTreino,
  exercicioId: string,
  mudancas: Partial<Omit<ExercicioFicha, 'id' | 'ordem'>>
): FichaTreino {
  const existe = ficha.exercicios.some((exercicio) => exercicio.id === exercicioId);
  if (!existe) {
    throw new Error('Exercício não encontrado na ficha.');
  }
  const exercicios = ficha.exercicios.map((exercicio) =>
    exercicio.id === exercicioId ? { ...exercicio, ...mudancas } : exercicio
  );
  return tocar(ficha, { exercicios });
}

export function removerExercicio(ficha: FichaTreino, exercicioId: string): FichaTreino {
  const exercicios = ficha.exercicios
    .filter((exercicio) => exercicio.id !== exercicioId)
    .map((exercicio, indice) => ({ ...exercicio, ordem: indice }));
  return tocar(ficha, { exercicios });
}

export function moverExercicio(
  ficha: FichaTreino,
  exercicioId: string,
  direcao: 'cima' | 'baixo'
): FichaTreino {
  const ordenados = [...ficha.exercicios].sort((a, b) => a.ordem - b.ordem);
  const indice = ordenados.findIndex((exercicio) => exercicio.id === exercicioId);
  if (indice === -1) {
    throw new Error('Exercício não encontrado na ficha.');
  }
  const destino = direcao === 'cima' ? indice - 1 : indice + 1;
  if (destino < 0 || destino >= ordenados.length) {
    return ficha;
  }
  const copia = [...ordenados];
  const [removido] = copia.splice(indice, 1);
  if (removido === undefined) {
    return ficha;
  }
  copia.splice(destino, 0, removido);
  const exercicios = copia.map((exercicio, novaOrdem) => ({ ...exercicio, ordem: novaOrdem }));
  return tocar(ficha, { exercicios });
}

export function marcarFichaDeletada(ficha: FichaTreino): FichaTreino {
  return tocar(ficha, { deletadoEm: new Date().toISOString() });
}

export function exerciciosOrdenados(ficha: FichaTreino): ExercicioFicha[] {
  return [...ficha.exercicios].sort((a, b) => a.ordem - b.ordem);
}
