'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useState } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import { sincronizar } from '@/shared/sync/syncEngine';
import { contarPendentes } from '@/shared/sync/syncQueue';

const CHAVE_ULTIMA_SYNC = 'fichafit:ultima-sync';

function lerUltimaSync(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(CHAVE_ULTIMA_SYNC);
}

export interface EstadoSync {
  executarSync: () => Promise<void>;
  sincronizando: boolean;
  erro: string | null;
  ultimaSync: string | null;
  pendentes: number;
  podeSincronizar: boolean;
}

// Trigger manual de sincronização (botão no perfil).
export function useSync(): EstadoSync {
  const { usuario } = useAuth();
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ultimaSync, setUltimaSync] = useState<string | null>(lerUltimaSync);
  const pendentes = useLiveQuery(() => contarPendentes(), [], 0);

  const executarSync = useCallback(async () => {
    if (usuario === null) {
      setErro('Entre com seu email para sincronizar seus treinos.');
      return;
    }
    setSincronizando(true);
    setErro(null);
    try {
      await sincronizar(usuario.id);
      const agora = new Date().toISOString();
      window.localStorage.setItem(CHAVE_ULTIMA_SYNC, agora);
      setUltimaSync(agora);
    } catch (causa) {
      console.warn('[sync] Falha na sincronização manual:', causa);
      setErro('Não foi possível sincronizar. Verifique sua conexão e tente de novo.');
    } finally {
      setSincronizando(false);
    }
  }, [usuario]);

  return {
    executarSync,
    sincronizando,
    erro,
    ultimaSync,
    pendentes,
    podeSincronizar: usuario !== null,
  };
}
