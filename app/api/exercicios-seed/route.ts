import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

import { buscarExerciciosWger } from '@/modules/exercicios/infrastructure/wgerApiClient';
import { createSupabaseServerClient, criarSupabaseAdmin } from '@/shared/supabase/server';

const MINIMO_CATALOGO = 50;

function respostaErro(erro: string, codigo: string, status: number): NextResponse {
  return NextResponse.json({ erro, codigo }, { status });
}

// POST /api/exercicios-seed — importa o catálogo wger (executar 1x após deploy,
// autenticado no app). Upsert por wger_id evita duplicatas.
// POST /api/exercicios-seed?forcar=true — força a reimportação mesmo que o
// catálogo já tenha sido importado, corrigindo registros com traduções erradas
// ou ausentes (ex.: importados antes de uma correção no parser do wger).
export async function POST(requisicao: Request): Promise<NextResponse> {
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user === null) {
      return respostaErro('É preciso estar autenticado para importar o catálogo.', 'NAO_AUTENTICADO', 401);
    }

    const admin = criarSupabaseAdmin();
    const forcar = new URL(requisicao.url).searchParams.get('forcar') === 'true';

    const { count, error: erroContagem } = await admin
      .from('exercicio_definicoes')
      .select('id', { count: 'exact', head: true })
      .eq('is_custom', false);
    if (erroContagem) {
      return respostaErro('Falha ao consultar o catálogo existente.', 'ERRO_CONSULTA', 500);
    }
    if (!forcar && (count ?? 0) >= MINIMO_CATALOGO) {
      return NextResponse.json({
        mensagem: 'Catálogo já importado anteriormente.',
        total: count,
      });
    }

    const exercicios = await buscarExerciciosWger();
    if (exercicios.length === 0) {
      return respostaErro('A API wger não retornou exercícios.', 'WGER_VAZIO', 502);
    }

    // Mapa wger_id -> id existente: reaproveita o id ao atualizar para não
    // duplicar registros (e não quebrar referências de exercicios_ficha).
    const { data: existentes, error: erroExistentes } = await admin
      .from('exercicio_definicoes')
      .select('id, wger_id')
      .not('wger_id', 'is', null);
    if (erroExistentes) {
      return respostaErro('Falha ao consultar o catálogo existente.', 'ERRO_CONSULTA', 500);
    }
    const idsPorWgerId = new Map(
      (existentes ?? [])
        .filter((registro): registro is { id: string; wger_id: number } => registro.wger_id !== null)
        .map((registro) => [registro.wger_id, registro.id])
    );

    const agora = new Date().toISOString();
    const { error: erroUpsert } = await admin.from('exercicio_definicoes').upsert(
      exercicios.map((exercicio) => ({
        id: idsPorWgerId.get(exercicio.wgerId) ?? uuidv4(),
        wger_id: exercicio.wgerId,
        nome: exercicio.nome,
        grupo_muscular: exercicio.grupoMuscular,
        descricao: exercicio.descricao,
        is_custom: false,
        usuario_id: null,
        criado_em: agora,
        atualizado_em: agora,
      })),
      { onConflict: 'wger_id' }
    );
    if (erroUpsert) {
      return respostaErro('Falha ao gravar o catálogo.', 'ERRO_GRAVACAO', 500);
    }

    return NextResponse.json({
      mensagem: 'Catálogo importado com sucesso.',
      total: exercicios.length,
    });
  } catch (causa) {
    console.warn('[seed] Falha na importação do catálogo:', causa);
    return respostaErro('Erro inesperado ao importar o catálogo.', 'ERRO_INTERNO', 500);
  }
}
