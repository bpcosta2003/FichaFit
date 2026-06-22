'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  consumirEventoInstalacao,
  type EventoInstalacaoPwa,
  inscreverEventoInstalacao,
  obterAppFoiInstalado,
  obterEventoInstalacaoCapturado,
} from '@/shared/lib/capturarInstalacaoPwa';

export interface EstadoInstalarApp {
  // O navegador disponibilizou o prompt nativo de instalação.
  podeInstalar: boolean;
  // O app já está rodando como PWA instalado (standalone).
  jaInstalado: boolean;
  // iOS/Safari não expõe beforeinstallprompt — precisa de instrução manual.
  precisaInstrucaoIOS: boolean;
  instalar: () => Promise<void>;
}

function estaEmModoStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const comoApp = window.matchMedia('(display-mode: standalone)').matches;
  // iOS Safari usa navigator.standalone (fora dos tipos padrão).
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return comoApp || iosStandalone;
}

function ehIOS(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

// Captura o evento de instalação do PWA e expõe uma ação para dispará-lo.
// O evento em si é capturado em module scope (ver capturarInstalacaoPwa.ts)
// o mais cedo possível — este hook só lê/observa esse estado compartilhado,
// para não perder o evento quando montado tarde (ex: páginas dynamic ssr:false).
export function useInstalarApp(): EstadoInstalarApp {
  const [eventoInstalacao, setEventoInstalacao] = useState<EventoInstalacaoPwa | null>(
    obterEventoInstalacaoCapturado
  );
  const [jaInstalado, setJaInstalado] = useState(false);

  useEffect(() => {
    setJaInstalado(estaEmModoStandalone() || obterAppFoiInstalado());
    setEventoInstalacao(obterEventoInstalacaoCapturado());

    return inscreverEventoInstalacao((evento) => {
      setEventoInstalacao(evento);
      if (evento === null) {
        // Pode ter vindo do appinstalled — não rebaixar para falso só porque
        // ainda estamos na aba do navegador (display-mode standalone é falso lá).
        setJaInstalado(estaEmModoStandalone() || obterAppFoiInstalado());
      }
    });
  }, []);

  const instalar = useCallback(async (): Promise<void> => {
    if (eventoInstalacao === null) {
      return;
    }
    await eventoInstalacao.prompt();
    try {
      const escolha = await eventoInstalacao.userChoice;
      if (escolha.outcome === 'accepted') {
        setJaInstalado(true);
      }
    } finally {
      // O prompt só pode ser usado uma vez.
      consumirEventoInstalacao();
      setEventoInstalacao(null);
    }
  }, [eventoInstalacao]);

  return {
    podeInstalar: eventoInstalacao !== null,
    jaInstalado,
    precisaInstrucaoIOS: !jaInstalado && eventoInstalacao === null && ehIOS(),
    instalar,
  };
}
