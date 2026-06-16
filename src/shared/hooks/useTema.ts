'use client';

import { useCallback, useEffect, useState } from 'react';

// Preferência de tema persistida no aparelho (offline-first).
export type PreferenciaTema = 'sistema' | 'claro' | 'escuro';

export const CHAVE_TEMA = 'fichafit:tema';
const PADRAO: PreferenciaTema = 'escuro';

function sistemaPrefereEscuro(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// Resolve a preferência para escuro/claro e aplica a classe no <html>.
// Escuro é o padrão do CSS (:root); claro adiciona a classe .tema-claro.
function aplicar(preferencia: PreferenciaTema): void {
  const escuro = preferencia === 'escuro' || (preferencia === 'sistema' && sistemaPrefereEscuro());
  document.documentElement.classList.toggle('tema-claro', !escuro);
}

export interface EstadoTema {
  preferencia: PreferenciaTema;
  definir: (preferencia: PreferenciaTema) => void;
}

export function useTema(): EstadoTema {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(PADRAO);

  useEffect(() => {
    const salva = window.localStorage.getItem(CHAVE_TEMA) as PreferenciaTema | null;
    if (salva === 'sistema' || salva === 'claro' || salva === 'escuro') {
      setPreferencia(salva);
    }
  }, []);

  // Reaplica quando o sistema muda — só relevante no modo 'sistema'.
  useEffect(() => {
    aplicar(preferencia);
    if (preferencia !== 'sistema') {
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const aoMudar = (): void => aplicar('sistema');
    media.addEventListener('change', aoMudar);
    return () => media.removeEventListener('change', aoMudar);
  }, [preferencia]);

  const definir = useCallback((nova: PreferenciaTema) => {
    window.localStorage.setItem(CHAVE_TEMA, nova);
    setPreferencia(nova);
  }, []);

  return { preferencia, definir };
}
