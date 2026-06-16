'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Ao zerar, o timer exibe "0:00" por 500ms e então chama aoCompletar
// AUTOMATICAMENTE — sem interação do usuário (regra do produto).
const DELAY_CONCLUSAO_MS = 500;

export interface Timer {
  segundosRestantes: number;
  total: number;
  ativo: boolean;
  iniciar: (segundos: number) => void;
  ajustar: (delta: number) => void;
  pular: () => void;
  cancelar: () => void;
}

export function useTimer(aoCompletar?: () => void): Timer {
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [total, setTotal] = useState(0);
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
    const valor = Math.max(0, Math.round(segundos));
    setSegundosRestantes(valor);
    setTotal(valor);
    setAtivo(true);
  }, []);

  // Ajusta o tempo restante (botões −15s / +15s). Mantém o total
  // sincronizado quando o usuário adiciona tempo acima do original.
  const ajustar = useCallback((delta: number) => {
    setSegundosRestantes((atual) => {
      const novo = Math.max(0, atual + delta);
      setTotal((totalAtual) => Math.max(totalAtual, novo));
      return novo;
    });
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

  return { segundosRestantes, total, ativo, iniciar, ajustar, pular, cancelar };
}
