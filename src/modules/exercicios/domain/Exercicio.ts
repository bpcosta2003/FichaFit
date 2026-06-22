// Camada de domínio — pura. Sem React, Dexie ou Supabase.
import { v4 as uuidv4 } from 'uuid';

export interface ExercicioDefinicao {
  id: string;
  wgerId: number | null;
  nome: string;
  grupoMuscular: string | null;
  descricao: string | null;
  // Foto estática de como executar o exercício (o wger não fornece GIFs).
  imagemUrl: string | null;
  isCustom: boolean;
  usuarioId: string | null;
  criadoEm: string;
  atualizadoEm: string;
  deletadoEm: string | null;
}

export interface NovoExercicioCustom {
  nome: string;
  usuarioId: string;
  grupoMuscular?: string;
  descricao?: string;
}

export function criarExercicioCustom(dados: NovoExercicioCustom): ExercicioDefinicao {
  const nome = dados.nome.trim();
  if (nome.length === 0) {
    throw new Error('O nome do exercício é obrigatório.');
  }
  const agora = new Date().toISOString();
  return {
    id: uuidv4(),
    wgerId: null,
    nome,
    grupoMuscular: dados.grupoMuscular?.trim() || null,
    descricao: dados.descricao?.trim() || null,
    imagemUrl: null,
    isCustom: true,
    usuarioId: dados.usuarioId,
    criadoEm: agora,
    atualizadoEm: agora,
    deletadoEm: null,
  };
}

export function filtrarPorNome(
  exercicios: readonly ExercicioDefinicao[],
  termo: string
): ExercicioDefinicao[] {
  const termoNormalizado = termo.trim().toLocaleLowerCase('pt-BR');
  if (termoNormalizado.length === 0) {
    return [...exercicios];
  }
  return exercicios.filter((exercicio) =>
    exercicio.nome.toLocaleLowerCase('pt-BR').includes(termoNormalizado)
  );
}
