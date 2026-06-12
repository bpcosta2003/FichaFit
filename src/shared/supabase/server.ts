import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from './database.types';

export type SupabaseServidor = ReturnType<typeof createServerClient<Database>>;
export type SupabaseAdmin = ReturnType<typeof createClient<Database>>;

function obterCredenciaisPublicas(): { url: string; chaveAnonima: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveAnonima = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chaveAnonima) {
    throw new Error(
      'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
  return { url, chaveAnonima };
}

// Cliente server-side com sessão do usuário (via cookies).
export function createSupabaseServerClient(): SupabaseServidor {
  const { url, chaveAnonima } = obterCredenciaisPublicas();
  const cookieStore = cookies();
  return createServerClient<Database>(url, chaveAnonima, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(novosCookies: { name: string; value: string; options: CookieOptions }[]) {
        try {
          novosCookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Chamado a partir de um Server Component — cookies são
          // somente leitura nesse contexto; o middleware cuida da sessão.
        }
      },
    },
  });
}

// Cliente admin — usa SUPABASE_SERVICE_ROLE_KEY, ignora RLS.
// Usar SOMENTE em rotas server-side (ex: seed do catálogo wger).
export function criarSupabaseAdmin(): SupabaseAdmin {
  const { url } = obterCredenciaisPublicas();
  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!chaveServico) {
    throw new Error('Supabase não configurado: defina SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient<Database>(url, chaveServico, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
