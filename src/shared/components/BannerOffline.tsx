'use client';

import { useStatusOnline } from '@/shared/hooks/useStatusOnline';

// Indicador de status offline. Também é o ponto de montagem do
// listener que dispara a sincronização automática ao reconectar.
export function BannerOffline() {
  const { online } = useStatusOnline();
  if (online) {
    return null;
  }
  return (
    <div
      role="status"
      className="bg-fogo px-4 py-2 text-center text-sm font-semibold text-black"
    >
      Você está offline — seus treinos continuam sendo salvos no aparelho.
    </div>
  );
}
