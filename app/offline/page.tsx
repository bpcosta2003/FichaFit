// Documento de fallback servido pelo service worker quando uma navegação
// falha (sem rede e sem essa rota em cache). Precisa ficar leve e estático
// (sem 'use client', sem fetch) para precachar de forma confiável via
// Workbox como o documento de fallback configurado em next.config.js.
export default function PaginaOffline() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-fundo px-6 text-center">
      <p className="font-titulo text-lg font-semibold text-texto">Você está offline</p>
      <p className="text-sm text-texto-suave">
        Sem conexão com a internet agora. Seus dados continuam salvos no aparelho — toque abaixo
        para tentar novamente.
      </p>
      <a
        href="/treinos"
        className="flex min-h-toque items-center justify-center rounded-2xl bg-fogo px-6 font-semibold text-fundo"
      >
        Tentar novamente
      </a>
    </div>
  );
}
