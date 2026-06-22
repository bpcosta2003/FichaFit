'use client';

// Componente sem renderização — sua única função é forçar o carregamento
// precoce do módulo de captura do beforeinstallprompt, a partir do layout
// raiz, antes que qualquer página lazy tenha chance de perder o evento.
import '@/shared/lib/capturarInstalacaoPwa';

export function CapturadorInstalacaoPwa(): null {
  return null;
}
