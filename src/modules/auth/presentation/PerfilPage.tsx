'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import { atualizarPerfil, obterPerfil } from '@/modules/auth/infrastructure/supabaseAuth';
import { AvatarUsuario } from '@/shared/components/AvatarUsuario';
import { BotaoGrande } from '@/shared/components/BotaoGrande';
import { useSync } from '@/shared/hooks/useSync';
import { AVATARES, AVATAR_PADRAO_ID } from '@/shared/types/avatares';
import { formatarDataRelativa } from '@/shared/utils/formatacao';

const CHAVE_AVATAR_LOCAL = 'fichafit:avatar';

export function PerfilPage() {
  const { usuario, autenticado, carregando, sair } = useAuth();
  const { executarSync, sincronizando, erro: erroSync, ultimaSync, pendentes } = useSync();
  const [avatarId, setAvatarId] = useState(AVATAR_PADRAO_ID);

  // Avatar vive no aparelho (offline-first) e no perfil quando autenticado.
  useEffect(() => {
    const salvo = window.localStorage.getItem(CHAVE_AVATAR_LOCAL);
    if (salvo !== null) {
      setAvatarId(salvo);
    }
  }, []);

  useEffect(() => {
    if (usuario === null) {
      return;
    }
    obterPerfil(usuario.id)
      .then((perfil) => {
        if (perfil !== null) {
          setAvatarId(perfil.avatarId);
          window.localStorage.setItem(CHAVE_AVATAR_LOCAL, perfil.avatarId);
        }
      })
      .catch(() => undefined);
  }, [usuario]);

  const aoEscolherAvatar = (novoId: string): void => {
    setAvatarId(novoId);
    window.localStorage.setItem(CHAVE_AVATAR_LOCAL, novoId);
    if (usuario !== null) {
      atualizarPerfil(usuario.id, { avatarId: novoId }).catch((causa) => {
        console.warn('[perfil] Falha ao salvar avatar no servidor:', causa);
      });
    }
  };

  if (carregando) {
    return <p className="px-4 py-8 text-center text-gray-500">Carregando perfil…</p>;
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>

      <div className="flex items-center gap-4">
        <AvatarUsuario avatarId={avatarId} tamanho="lg" />
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-gray-900">
            {autenticado ? (usuario?.email ?? 'Atleta') : 'Atleta local'}
          </span>
          <span className="text-sm text-gray-500">
            {autenticado ? 'Conta sincronizada' : 'Usando sem conta — dados só neste aparelho'}
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold text-gray-900">Escolha seu avatar</h2>
        <div className="grid grid-cols-4 gap-3">
          {AVATARES.map((avatar) => (
            <button
              key={avatar.id}
              type="button"
              aria-label={`Avatar ${avatar.nome}`}
              aria-pressed={avatar.id === avatarId}
              onClick={() => aoEscolherAvatar(avatar.id)}
              className={`flex min-h-toque min-w-toque items-center justify-center rounded-2xl border-2 p-1 ${
                avatar.id === avatarId ? 'border-primaria-500' : 'border-transparent'
              }`}
            >
              <AvatarUsuario avatarId={avatar.id} tamanho="sm" />
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <h2 className="font-semibold text-gray-900">Sincronização</h2>
        <p className="text-sm text-gray-600">
          {pendentes === 0
            ? 'Tudo sincronizado.'
            : pendentes === 1
              ? '1 alteração aguardando envio.'
              : `${pendentes} alterações aguardando envio.`}
          {ultimaSync !== null && ` Última sincronização ${formatarDataRelativa(ultimaSync)}.`}
        </p>
        {erroSync !== null && (
          <p role="alert" className="text-sm font-medium text-erro">
            {erroSync}
          </p>
        )}
        {autenticado ? (
          <>
            <BotaoGrande onClick={() => void executarSync()} disabled={sincronizando}>
              {sincronizando ? 'Sincronizando…' : 'Sincronizar agora'}
            </BotaoGrande>
            <BotaoGrande variante="secundaria" onClick={() => void sair()}>
              Sair da conta
            </BotaoGrande>
          </>
        ) : (
          <Link href="/login" className="block">
            <BotaoGrande>Entrar para sincronizar</BotaoGrande>
          </Link>
        )}
      </section>
    </div>
  );
}
