import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './database.types';

export type SupabaseBrowser = ReturnType<typeof createBrowserClient<Database>>;

let cliente: SupabaseBrowser | null = null;

// Singleton do cliente browser. Retorna null quando o Supabase não está
// configurado — offline é o estado padrão, Supabase é aditivo.
export function obterSupabaseBrowser(): SupabaseBrowser | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chaveAnonima = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chaveAnonima) {
    return null;
  }
  if (cliente === null) {
    cliente = createBrowserClient<Database>(url, chaveAnonima);
  }
  return cliente;
}
