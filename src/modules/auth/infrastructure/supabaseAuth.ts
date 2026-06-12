// Autenticação via Supabase Magic Link — sem senha.
import type { User } from '@supabase/supabase-js';

import { obterSupabaseBrowser } from '@/shared/supabase/client';

export async function enviarMagicLink(email: string): Promise<void> {
  const supabase = obterSupabaseBrowser();
  if (supabase === null) {
    throw new Error('Sincronização indisponível: o servidor não está configurado.');
  }
  const urlApp = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${urlApp}/auth/callback` },
  });
  if (error) {
    throw new Error('Não foi possível enviar o link de acesso. Tente novamente.');
  }
}

export async function obterUsuarioAtual(): Promise<User | null> {
  const supabase = obterSupabaseBrowser();
  if (supabase === null) {
    return null;
  }
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

// Retorna função de unsubscribe.
export function aoMudarSessao(callback: (usuario: User | null) => void): () => void {
  const supabase = obterSupabaseBrowser();
  if (supabase === null) {
    return () => undefined;
  }
  const { data } = supabase.auth.onAuthStateChange((_evento, sessao) => {
    callback(sessao?.user ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function sair(): Promise<void> {
  const supabase = obterSupabaseBrowser();
  if (supabase === null) {
    return;
  }
  await supabase.auth.signOut();
}

export interface PerfilUsuario {
  nome: string | null;
  avatarId: string;
}

export async function obterPerfil(usuarioId: string): Promise<PerfilUsuario | null> {
  const supabase = obterSupabaseBrowser();
  if (supabase === null) {
    return null;
  }
  const { data, error } = await supabase
    .from('perfis_usuario')
    .select('nome, avatar_id')
    .eq('id', usuarioId)
    .maybeSingle();
  if (error || data === null) {
    return null;
  }
  return { nome: data.nome, avatarId: data.avatar_id };
}

export async function atualizarPerfil(
  usuarioId: string,
  mudancas: Partial<{ nome: string; avatarId: string }>
): Promise<void> {
  const supabase = obterSupabaseBrowser();
  if (supabase === null) {
    return;
  }
  const { error } = await supabase
    .from('perfis_usuario')
    .upsert({
      id: usuarioId,
      ...(mudancas.nome !== undefined ? { nome: mudancas.nome } : {}),
      ...(mudancas.avatarId !== undefined ? { avatar_id: mudancas.avatarId } : {}),
      atualizado_em: new Date().toISOString(),
    });
  if (error) {
    throw new Error('Não foi possível salvar o perfil. Tente novamente.');
  }
}
