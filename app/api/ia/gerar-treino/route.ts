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

const esquemaJustificativa = z.object({
  porqueDoTreino: z.string().min(1),
  comoEvoluir: z.string().min(1),
  nivelAssertividade: z.string().min(1),
});

const esquemaSemanaGerada = z.object({
  fichas: z.array(esquemaFichaGerada).min(1).max(7),
  justificativa: esquemaJustificativa,
});

const ESQUEMA_JUSTIFICATIVA_JSON = {
  type: 'object',
  properties: {
    porqueDoTreino: {
      type: 'string',
      description:
        'Texto expandido em português explicando por que esta divisão de treino e estes exercícios ' +
        'foram escolhidos para o perfil (objetivo, idade, sexo, peso e frequência semanal).',
    },
    comoEvoluir: {
      type: 'string',
      description:
        'Texto expandido em português com os motivos e a estratégia para evoluir neste treino ' +
        '(progressão de carga, repetições, frequência) ao longo das próximas semanas.',
    },
    nivelAssertividade: {
      type: 'string',
      description:
        'Texto curto em português indicando o nível de assertividade/confiança de que este treino ' +
        'gera resultado para o objetivo, com a principal ressalva (ex: aderência, alimentação, descanso).',
    },
  },
  required: ['porqueDoTreino', 'comoEvoluir', 'nivelAssertividade'],
} as const;

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
    'Cria um conjunto de fichas de treino — uma por dia de treino da semana — personalizadas para o ' +
    'usuário, junto de uma justificativa explicando as escolhas, a progressão e o nível de assertividade.',
  input_schema: {
    type: 'object',
    properties: {
      fichas: {
        type: 'array',
        minItems: 1,
        maxItems: 7,
        items: ESQUEMA_FICHA_JSON,
      },
      justificativa: ESQUEMA_JUSTIFICATIVA_JSON,
    },
    required: ['fichas', 'justificativa'],
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
    const prompt = `[ROLE]
Você é um personal trainer certificado e especialista em treinamento de força e condicionamento, com experiência no planejamento individualizado de treinos resistidos para o contexto fitness brasileiro.

[OBJECTIVE]
Gerar um treino semanal de musculação personalizado em português brasileiro para o perfil de usuário abaixo, dividido em exatamente ${diasPorSemana} ficha(s) — uma por dia de treino —, onde cada ficha é um treino completo e imediatamente executável com 4 a 8 exercícios. Além das fichas, gerar uma justificativa explicando as escolhas, a progressão e o nível de assertividade. Entregue tudo usando a ferramenta gerar_treino_semanal.

[CONTEXT]
Perfil do usuário:
- Idade: ${perfil.idade} anos
- Sexo: ${perfil.sexo}
- Peso corporal: ${perfil.peso_kg} kg
- Objetivo principal: ${rotuloObjetivo}
- Frequência semanal de treino: ${diasPorSemana} dia(s) por semana

A seleção de exercícios, volume, intensidade e descanso devem ser calibrados ao objetivo, ao perfil biológico e à frequência semanal disponível.

[INSTRUCTIONS]
- Analise o perfil e determine a divisão de treino mais apropriada para a frequência informada (ex: full-body para 1–2 dias; upper/lower ou push/pull/legs para 3+ dias), distribuindo os grupos musculares ao longo da semana para favorecer a recuperação.
- Gere exatamente ${diasPorSemana} ficha(s); cada ficha deve ter um nome indicando o dia/foco (ex: "Treino A — Peito e Tríceps", "Treino B — Costas e Bíceps") e um foco diferente das demais.
- Para cada ficha, selecione de 4 a 8 exercícios apropriados ao objetivo, idade e sexo, priorizando movimentos compostos primeiro quando relevante (lógica progressiva: ativação/aquecimento antes dos compostos pesados quando aplicável).
- Para cada exercício defina: nome (em português BR), número de séries, faixa de repetições (repeticoesMin e repeticoesMax), tempo de descanso em segundos e carga de referência em kg — inclua a carga apenas quando puder ser razoavelmente estimada pelo peso corporal, sexo, idade e objetivo; use null quando não houver dados suficientes.
- Preencha a justificativa com: porqueDoTreino (por que esta divisão e estes exercícios foram escolhidos para o perfil), comoEvoluir (motivos e estratégia de progressão ao longo das semanas) e nivelAssertividade (nível de confiança de que o treino gera resultado, com a principal ressalva).

[CONSTRAINTS]
- Todo o conteúdo deve estar inteiramente em português brasileiro.
- Use a nomenclatura padrão brasileira para os exercícios (ex: "Supino Reto", "Agachamento Livre", "Remada Curvada").
- Não inclua exercícios de alto risco de lesão sem justificativa clara do perfil (ex: evite levantamentos olímpicos para perfis sedentários ou mais velhos).
- Não invente dados do usuário; use apenas as variáveis fornecidas. Se algum valor faltar, aplique um padrão conservador apropriado para iniciantes.
- Cargas de referência em quilogramas devem refletir pontos de partida realistas, não padrões de atletas de elite.

[QUALITY CRITERIA]
Antes de chamar a ferramenta, verifique que cada ficha tem entre 4 e 8 exercícios, todos com nome em português, séries, faixa de repetições e descanso; que as cargas estão presentes só onde justificadas e são plausíveis; que a divisão é coerente com a frequência semanal; que volume e intensidade são adequados ao objetivo (${rotuloObjetivo}); e que nenhum campo contém texto placeholder, valores indefinidos ou termos não traduzidos.

Responda exclusivamente através da ferramenta gerar_treino_semanal.`;

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

    return NextResponse.json({
      fichas: resultado.data.fichas,
      justificativa: resultado.data.justificativa,
    });
  } catch (causa) {
    console.warn('[ia] Erro inesperado ao gerar ficha:', causa);
    return respostaErro('Erro inesperado ao gerar a ficha.', 'ERRO_INTERNO', 500);
  }
}
