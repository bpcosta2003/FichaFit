import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/shared/supabase/server';

// Callback do Magic Link: troca o código pela sessão e volta para o app.
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url);
  const codigo = searchParams.get('code');

  if (codigo !== null) {
    try {
      const supabase = createSupabaseServerClient();
      const { error } = await supabase.auth.exchangeCodeForSession(codigo);
      if (error) {
        console.warn('[auth] Falha ao trocar código por sessão:', error.message);
        return NextResponse.redirect(`${origin}/login?erro=link-invalido`);
      }
    } catch (erro) {
      console.warn('[auth] Supabase indisponível no callback:', erro);
      return NextResponse.redirect(`${origin}/login?erro=indisponivel`);
    }
  }

  return NextResponse.redirect(`${origin}/treinos`);
}
