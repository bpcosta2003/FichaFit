'use client';

import { useCallback, useEffect, useState } from 'react';

// Evento beforeinstallprompt — não está nos tipos padrão do DOM.
interface EventoInstalacao extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

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
export function useInstalarApp(): EstadoInstalarApp {
  const [eventoInstalacao, setEventoInstalacao] = useState<EventoInstalacao | null>(null);
  const [jaInstalado, setJaInstalado] = useState(false);

  useEffect(() => {
    setJaInstalado(estaEmModoStandalone());

    const aoDisponibilizar = (evento: Event): void => {
      evento.preventDefault();
      setEventoInstalacao(evento as EventoInstalacao);
    };
    const aoInstalar = (): void => {
      setEventoInstalacao(null);
      setJaInstalado(true);
    };

    window.addEventListener('beforeinstallprompt', aoDisponibilizar);
    window.addEventListener('appinstalled', aoInstalar);
    return () => {
      window.removeEventListener('beforeinstallprompt', aoDisponibilizar);
      window.removeEventListener('appinstalled', aoInstalar);
    };
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
