// Cliente da API pública wger — catálogo de exercícios.
// Usado tanto no servidor (rota de seed) quanto no browser (biblioteca).
import { z } from 'zod';

const WGER_BASE_URL = 'https://wger.de/api/v2';
export const IDIOMA_PORTUGUES = 8;
export const IDIOMA_INGLES = 2; // fallback aceitável
const LIMITE_POR_PAGINA = 100;
const MAX_PAGINAS = 3;

// Categorias do wger traduzidas para grupos musculares em pt-BR.
const GRUPOS_MUSCULARES: Record<number, string> = {
  8: 'Braços',
  9: 'Pernas',
  10: 'Abdômen',
  11: 'Peito',
  12: 'Costas',
  13: 'Ombros',
  14: 'Panturrilhas',
  15: 'Cardio',
};

// A API wger não tem mais "name"/"description" direto no /exercise/ — eles
// ficam em "translations" (uma por idioma). /exerciseinfo/ retorna o
// exercício já com a categoria e todas as traduções aninhadas.
const esquemaTraducao = z.object({
  language: z.number(),
  name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const esquemaCategoria = z.object({
  id: z.number(),
});

const esquemaExercicioWger = z.object({
  id: z.number(),
  category: esquemaCategoria.optional().nullable(),
  translations: z.array(esquemaTraducao).optional().default([]),
});

const esquemaRespostaWger = z.object({
  next: z.string().nullable(),
  results: z.array(z.unknown()),
});

export interface ExercicioWger {
  wgerId: number;
  nome: string;
  grupoMuscular: string | null;
  descricao: string | null;
}

function removerHtml(texto: string): string {
  return texto.replace(/<[^>]*>/g, '').trim();
}

function escolherTraducao(
  traducoes: z.infer<typeof esquemaTraducao>[]
): z.infer<typeof esquemaTraducao> | null {
  for (const idioma of [IDIOMA_PORTUGUES, IDIOMA_INGLES]) {
    const traducao = traducoes.find((t) => t.language === idioma && t.name?.trim());
    if (traducao) {
      return traducao;
    }
  }
  return null;
}

async function buscarPagina(pagina: number): Promise<{
  exercicios: ExercicioWger[];
  temProxima: boolean;
}> {
  const offset = pagina * LIMITE_POR_PAGINA;
  const url = `${WGER_BASE_URL}/exerciseinfo/?format=json&limit=${LIMITE_POR_PAGINA}&offset=${offset}`;
  const resposta = await fetch(url);
  if (!resposta.ok) {
    throw new Error(`API wger respondeu com status ${resposta.status}`);
  }
  const corpo = esquemaRespostaWger.parse(await resposta.json());

  const exercicios: ExercicioWger[] = [];
  for (const bruto of corpo.results) {
    const resultado = esquemaExercicioWger.safeParse(bruto);
    if (!resultado.success) {
      continue;
    }
    const item = resultado.data;
    const traducao = escolherTraducao(item.translations);
    const nome = traducao?.name?.trim();
    if (!nome) {
      continue;
    }
    exercicios.push({
      wgerId: item.id,
      nome,
      grupoMuscular:
        item.category != null ? (GRUPOS_MUSCULARES[item.category.id] ?? null) : null,
      descricao: traducao?.description ? removerHtml(traducao.description) || null : null,
    });
  }
  return { exercicios, temProxima: corpo.next !== null };
}

export async function buscarExerciciosWger(): Promise<ExercicioWger[]> {
  const todos: ExercicioWger[] = [];
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const { exercicios, temProxima } = await buscarPagina(pagina);
    todos.push(...exercicios);
    if (!temProxima) {
      break;
    }
  }
  return todos;
}
