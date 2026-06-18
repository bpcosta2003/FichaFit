import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSupabaseServerClient } from '@/shared/supabase/server';

const JANELA_RATE_LIMIT_MS = 60_000;

const MODELO_CLAUDE = 'claude-sonnet-4-5';

const ROTULOS_OBJETIVO: Record<string, string> = {
  hipertrofia: 'hipertrofia (ganho de massa muscular)',
  perda_peso: 'perda de peso',
  manutencao: 'manutenção da forma física',
  resistencia: 'resistência / condicionamento',
};

function respostaErro(erro: string, codigo: string, status: number): NextResponse {
  return NextResponse.json({ erro, codigo }, { status });
}

const esquemaExercicioGerado = z.object({
  nome: z.string().min(1),
  series: z.number().int().min(1).max(10),
  repeticoesMin: z.number().int().min(1).max(50),
  repeticoesMax: z.number().int().min(1).max(50),
  descansoSegundos: z.number().int().min(0).max(300),
  cargaReferenciaKg: z.number().min(0).max(500).nullable(),
});

const esquemaFichaGerada = z.object({
  nome: z.string().min(1),
  descricao: z.string().nullable(),
  exercicios: z.array(esquemaExercicioGerado).min(1).max(15),
});

const esquemaSemanaGerada = z.object({
  fichas: z.array(esquemaFichaGerada).min(1).max(7),
});

const ESQUEMA_FICHA_JSON = {
  type: 'object',
  properties: {
    nome: { type: 'string', description: 'Nome curto da ficha, ex: "Treino A — Peito e Tríceps".' },
    descricao: {
      type: ['string', 'null'],
      description: 'Breve descrição do foco do treino do dia, ou null.',
    },
    exercicios: {
      type: 'array',
      minItems: 3,
      maxItems: 15,
      items: {
        type: 'object',
        properties: {
          nome: { type: 'string' },
          series: { type: 'integer', minimum: 1, maximum: 10 },
          repeticoesMin: { type: 'integer', minimum: 1, maximum: 50 },
          repeticoesMax: { type: 'integer', minimum: 1, maximum: 50 },
          descansoSegundos: { type: 'integer', minimum: 0, maximum: 300 },
          cargaReferenciaKg: {
            type: ['number', 'null'],
            description: 'Carga sugerida em kg, ou null se não aplicável.',
          },
        },
        required: [
          'nome',
          'series',
          'repeticoesMin',
          'repeticoesMax',
          'descansoSegundos',
          'cargaReferenciaKg',
        ],
      },
    },
  },
  required: ['nome', 'descricao', 'exercicios'],
} as const;

const FERRAMENTA_GERAR_SEMANA: Anthropic.Tool = {
  name: 'gerar_treino_semanal',
  description:
    'Cria um conjunto de fichas de treino — uma por dia de treino da semana — personalizadas para o usuário.',
  input_schema: {
    type: 'object',
    properties: {
      fichas: {
        type: 'array',
        minItems: 1,
        maxItems: 7,
        items: ESQUEMA_FICHA_JSON,
      },
    },
    required: ['fichas'],
  },
};

export async function POST(): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user === null) {
      return respostaErro('É preciso estar autenticado para usar a assistente de IA.', 'NAO_AUTENTICADO', 401);
    }

    const { data: perfil, error: erroPerfil } = await supabase
      .from('perfis_usuario')
      .select('objetivo, idade, peso_kg, sexo, dias_por_semana')
      .eq('id', user.id)
      .maybeSingle();
    if (erroPerfil) {
      return respostaErro('Falha ao consultar o perfil de treino.', 'ERRO_CONSULTA', 500);
    }
    if (
      perfil === null ||
      perfil.objetivo === null ||
      perfil.idade === null ||
      perfil.peso_kg === null ||
      perfil.sexo === null ||
      perfil.dias_por_semana === null
    ) {
      return respostaErro(
        'Complete seu perfil de treino antes de gerar uma ficha com a IA.',
        'PERFIL_INCOMPLETO',
        400
      );
    }

    const desde = new Date(Date.now() - JANELA_RATE_LIMIT_MS).toISOString();
    const { count, error: erroRateLimit } = await supabase
      .from('ia_geracoes')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .gte('criado_em', desde);
    if (erroRateLimit) {
      return respostaErro('Falha ao verificar limite de uso.', 'ERRO_CONSULTA', 500);
    }
    if ((count ?? 0) > 0) {
      return respostaErro(
        'Aguarde um minuto antes de gerar outra ficha com a IA.',
        'RATE_LIMIT',
        429
      );
    }

    const chaveApi = process.env.ANTHROPIC_API_KEY;
    if (!chaveApi) {
      return respostaErro(
        'A assistente de IA não está configurada no momento.',
        'IA_INDISPONIVEL',
        503
      );
    }

    const rotuloObjetivo = ROTULOS_OBJETIVO[perfil.objetivo] ?? perfil.objetivo;
    const diasPorSemana = perfil.dias_por_semana;
    const prompt =
      `Crie um treino de musculação semanal completo, dividido em ${diasPorSemana} ficha(s) — ` +
      `uma para cada dia de treino —, personalizado em português brasileiro para uma pessoa de ` +
      `${perfil.idade} anos, sexo ${perfil.sexo}, pesando ${perfil.peso_kg} kg, com objetivo de ` +
      `${rotuloObjetivo}. Cada ficha deve ter um nome que indique o dia/foco (ex: "Treino A — Peito e ` +
      `Tríceps", "Treino B — Costas e Bíceps") e um foco muscular diferente das demais, para favorecer ` +
      `a recuperação entre os grupos musculares ao longo da semana. Cada ficha deve ter de 4 a 8 ` +
      `exercícios com nomes em português, séries, faixa de repetições, tempo de descanso em segundos e, ` +
      `quando fizer sentido, uma carga de referência em kg. Gere exatamente ${diasPorSemana} ficha(s). ` +
      `Use a ferramenta gerar_treino_semanal para responder.`;

    const anthropic = new Anthropic({ apiKey: chaveApi });
    let mensagem: Anthropic.Message;
    try {
      mensagem = await anthropic.messages.create({
        model: MODELO_CLAUDE,
        max_tokens: 4096,
        tools: [FERRAMENTA_GERAR_SEMANA],
        tool_choice: { type: 'tool', name: 'gerar_treino_semanal' },
        messages: [{ role: 'user', content: prompt }],
      });
    } catch (causa) {
      console.warn('[ia] Falha ao chamar a Anthropic:', causa);
      return respostaErro(
        'A assistente de IA está indisponível agora. Tente novamente em breve.',
        'IA_INDISPONIVEL',
        503
      );
    }

    const blocoFerramenta = mensagem.content.find(
      (bloco): bloco is Anthropic.ToolUseBlock => bloco.type === 'tool_use'
    );
    if (blocoFerramenta === undefined) {
      return respostaErro('A IA não retornou um treino válido.', 'IA_RESPOSTA_INVALIDA', 502);
    }

    const resultado = esquemaSemanaGerada.safeParse(blocoFerramenta.input);
    if (!resultado.success) {
      console.warn('[ia] Resposta da IA fora do schema esperado:', resultado.error.message);
      return respostaErro('A IA não retornou um treino válido.', 'IA_RESPOSTA_INVALIDA', 502);
    }

    const { error: erroRegistro } = await supabase
      .from('ia_geracoes')
      .insert({ usuario_id: user.id });
    if (erroRegistro) {
      console.warn('[ia] Falha ao registrar geração para rate limit:', erroRegistro.message);
    }

    return NextResponse.json({ fichas: resultado.data.fichas });
  } catch (causa) {
    console.warn('[ia] Erro inesperado ao gerar ficha:', causa);
    return respostaErro('Erro inesperado ao gerar a ficha.', 'ERRO_INTERNO', 500);
  }
}
