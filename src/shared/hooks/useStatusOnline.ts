'use client';

import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/modules/auth/application/useAuth';
import { sincronizar } from '@/shared/sync/syncEngine';

// Observa o status de rede e dispara sincronização ao reconectar
// (somente quando autenticado — Modo 3 da arquitetura de dados).
export function useStatusOnline(): { online: boolean } {
  const { usuario } = useAuth();
  const [online, setOnline] = useState(true);
  const usuarioRef = useRef(usuario);
  usuarioRef.current = usuario;

  useEffect(() => {
    setOnline(navigator.onLine);

    const aoConectar = (): void => {
      setOnline(true);
      const atual = usuarioRef.current;
      if (atual !== null) {
        sincronizar(atual.id).catch((erro) => {
          console.warn('[sync] Falha na sincronização automática:', erro);
        });
      }
    };
    const aoDesconectar = (): void => {
      setOnline(false);
    };

    window.addEventListener('online', aoConectar);
    window.addEventListener('offline', aoDesconectar);
    return () => {
      window.removeEventListener('online', aoConectar);
      window.removeEventListener('offline', aoDesconectar);
    };
  }, []);

  return { online };
}
