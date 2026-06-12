'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Ao zerar, o timer exibe "0:00" por 500ms e então chama aoCompletar
// AUTOMATICAMENTE — sem interação do usuário (regra do produto).
const DELAY_CONCLUSAO_MS = 500;

export interface Timer {
  segundosRestantes: number;
  ativo: boolean;
  iniciar: (segundos: number) => void;
  pular: () => void;
  cancelar: () => void;
}

export function useTimer(aoCompletar?: () => void): Timer {
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [ativo, setAtivo] = useState(false);
  const aoCompletarRef = useRef(aoCompletar);
  aoCompletarRef.current = aoCompletar;

  useEffect(() => {
    if (!ativo) {
      return;
    }
    if (segundosRestantes <= 0) {
      const timeout = setTimeout(() => {
        setAtivo(false);
        aoCompletarRef.current?.();
      }, DELAY_CONCLUSAO_MS);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      setSegundosRestantes((atual) => atual - 1);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [ativo, segundosRestantes]);

  const iniciar = useCallback((segundos: number) => {
    setSegundosRestantes(Math.max(0, Math.round(segundos)));
    setAtivo(true);
  }, []);

  // Pula o descanso e avança imediatamente.
  const pular = useCallback(() => {
    setAtivo(false);
    setSegundosRestantes(0);
    aoCompletarRef.current?.();
  }, []);

  const cancelar = useCallback(() => {
    setAtivo(false);
    setSegundosRestantes(0);
  }, []);

  return { segundosRestantes, ativo, iniciar, pular, cancelar };
}
