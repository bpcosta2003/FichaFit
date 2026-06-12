'use client';

import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useState } from 'react';

import { USUARIO_LOCAL } from '@/shared/db/db';
import {
  aoMudarSessao,
  enviarMagicLink,
  obterUsuarioAtual,
  sair as sairSupabase,
} from '../infrastructure/supabaseAuth';

export interface EstadoAuth {
  usuario: User | null;
  // Id usado nas queries locais: id real quando autenticado, 'local' antes disso.
  usuarioId: string;
  autenticado: boolean;
  carregando: boolean;
  entrarComEmail: (email: string) => Promise<void>;
  sair: () => Promise<void>;
}

export function useAuth(): EstadoAuth {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let montado = true;
    obterUsuarioAtual()
      .then((atual) => {
        if (montado) {
          setUsuario(atual);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (montado) {
          setCarregando(false);
        }
      });
    const cancelar = aoMudarSessao((novoUsuario) => {
      if (montado) {
        setUsuario(novoUsuario);
      }
    });
    return () => {
      montado = false;
      cancelar();
    };
  }, []);

  const entrarComEmail = useCallback(async (email: string) => {
    await enviarMagicLink(email);
  }, []);

  const sair = useCallback(async () => {
    await sairSupabase();
    setUsuario(null);
  }, []);

  return {
    usuario,
    usuarioId: usuario?.id ?? USUARIO_LOCAL,
    autenticado: usuario !== null,
    carregando,
    entrarComEmail,
    sair,
  };
}
