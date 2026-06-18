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
You are a certified personal trainer and strength & conditioning specialist with expertise in individualized weekly resistance training program design for the Brazilian fitness context.

[OBJECTIVE]
Generate a complete, personalized weekly resistance training program (plano de treino semanal) in Brazilian Portuguese for a specific user profile, structured as a full week of training sessions — one session per training day — each containing 4 to 8 exercises, using the \`gerar_treino_semanal\` tool to deliver the response.

[CONTEXT]
The user profile is dynamically populated at runtime with the following variables:
- Age: ${perfil.idade} years
- Sex: ${perfil.sexo}
- Body weight: ${perfil.peso_kg} kg
- Primary training goal: ${rotuloObjetivo}
- Weekly training frequency: ${diasPorSemana} day(s) per week

The generated program must cover the user's full weekly training schedule — one distinct session per training day. The split strategy (e.g., full-body, upper/lower, ABC, ABCDE) must be chosen based on the weekly frequency and the user's goal. Rest days are implicit and do not require session entries.

[INSTRUCTIONS]
1. Analyze the user profile and select the most appropriate weekly split for the given frequency:
   - 1–2 days/week → Full-body sessions
   - 3 days/week → Full-body or ABC push/pull/legs
   - 4 days/week → Upper/lower or AB split repeated
   - 5+ days/week → Advanced split (e.g., ABCDE or push/pull/legs with repetition)
2. For each training day, design a distinct session with 4 to 8 exercises appropriate to that day's muscle group focus, the user's goal, age, sex, and body weight.
3. Distribute muscle groups across the week to ensure adequate recovery — no muscle group should be trained on consecutive days unless the split explicitly requires it (e.g., full-body) and volume is adjusted accordingly.
4. For each exercise within each session, define:
   - nome (in Brazilian Portuguese)
   - series (number of sets, integer)
   - repeticoesMin and repeticoesMax (rep range as two integers, e.g., 8 and 12)
   - descansoSegundos (rest period in seconds, integer)
   - cargaReferenciaKg — reference load in kg; include only when reasonably estimable from body weight, sex, age, and goal; use null otherwise
5. Order exercises within each session logically: compound/multi-joint movements before isolation exercises; higher neural demand movements earlier in the session.
6. Fill the justificativa with three fields: porqueDoTreino (why this split and these exercises were chosen for the profile), comoEvoluir (the reasons and strategy to progress in this program over the coming weeks), and nivelAssertividade (the confidence level that the program will generate results for the goal, with the main caveat). These are structured tool fields — not free-form prose.
7. Call the \`gerar_treino_semanal\` tool to deliver the complete structured weekly program — do not return free-form prose outside the tool call.

[CONSTRAINTS]
- All content must be written entirely in Brazilian Portuguese.
- Exercise names must use Brazilian Portuguese nomenclature (e.g., "Supino Reto", "Agachamento Livre", "Rosca Direta").
- Generate exactly ${diasPorSemana} distinct training sessions (fichas) — one per training day, no more, no fewer.
- Each session must contain between 4 and 8 exercises — no exceptions.
- Do not repeat the same session across different days unless the split type explicitly requires identical full-body sessions and volume is adjusted.
- Do not include exercises with high injury risk that are unjustified by the user profile (e.g., avoid Olympic lifts for sedentary or older beginners).
- Do not invent user data; use only the variables provided. If a variable is missing or null, apply a conservative beginner-appropriate default.
- Do not include narrative commentary, motivational filler, or coaching prose outside the structured fields.
- Reference loads must be expressed in kilograms and reflect realistic starting-point values, not elite performance benchmarks.

[OUTPUT FORMAT]
Deliver the response exclusively via the \`gerar_treino_semanal\` tool. The tool payload must contain:
- \`fichas\` (array): the full weekly program as an array of sessions. Each session (ficha) must include:
  - \`nome\` (string): training day label in Brazilian Portuguese (e.g., "Treino A — Peito e Tríceps", "Treino B — Costas e Bíceps")
  - \`descricao\` (string | null): short focus description of the day, or null
  - \`exercicios\` (array): list of exercises, each with \`nome\` (string), \`series\` (integer), \`repeticoesMin\` (integer), \`repeticoesMax\` (integer), \`descansoSegundos\` (integer) and \`cargaReferenciaKg\` (number | null)
- \`justificativa\` (object): with \`porqueDoTreino\` (string), \`comoEvoluir\` (string) and \`nivelAssertividade\` (string)

[QUALITY CRITERIA]
Before invoking the tool, verify that the weekly program satisfies all of the following:
- [ ] Contains exactly ${diasPorSemana} distinct training sessions
- [ ] Every session contains between 4 and 8 exercises — no fewer, no more
- [ ] All exercise names are in Brazilian Portuguese
- [ ] Every exercise includes series, rep range (repeticoesMin/repeticoesMax) and rest period
- [ ] Reference loads are present only where justified and are plausible for the given profile
- [ ] The weekly split is coherent with the training frequency and goal (${rotuloObjetivo})
- [ ] Muscle group distribution ensures adequate recovery across the week
- [ ] No session is a copy of another unless the split type explicitly requires it
- [ ] No field contains placeholder text, undefined values, or untranslated terms
- [ ] The justificativa is filled with all three fields
- [ ] The full response is delivered through \`gerar_treino_semanal\` and not as raw prose`;

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
