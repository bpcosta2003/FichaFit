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

const esquemaExercicioWger = z.object({
  id: z.number(),
  name: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.number().optional().nullable(),
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

async function buscarPagina(idioma: number, pagina: number): Promise<{
  exercicios: ExercicioWger[];
  temProxima: boolean;
}> {
  const offset = pagina * LIMITE_POR_PAGINA;
  const url = `${WGER_BASE_URL}/exercise/?format=json&language=${idioma}&limit=${LIMITE_POR_PAGINA}&offset=${offset}`;
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
    const nome = item.name?.trim();
    if (!nome) {
      continue;
    }
    exercicios.push({
      wgerId: item.id,
      nome,
      grupoMuscular:
        item.category != null ? (GRUPOS_MUSCULARES[item.category] ?? null) : null,
      descricao: item.description ? removerHtml(item.description) || null : null,
    });
  }
  return { exercicios, temProxima: corpo.next !== null };
}

// Busca até 3 páginas × 100 exercícios. Tenta português primeiro;
// se o catálogo vier vazio, faz fallback para inglês.
export async function buscarExerciciosWger(): Promise<ExercicioWger[]> {
  for (const idioma of [IDIOMA_PORTUGUES, IDIOMA_INGLES]) {
    const todos: ExercicioWger[] = [];
    for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
      const { exercicios, temProxima } = await buscarPagina(idioma, pagina);
      todos.push(...exercicios);
      if (!temProxima) {
        break;
      }
    }
    if (todos.length > 0) {
      return todos;
    }
  }
  return [];
}
