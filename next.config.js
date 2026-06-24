/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Fotos de exercícios vêm direto do catálogo público do wger.
    remotePatterns: [{ protocol: 'https', hostname: 'wger.de' }],
  },
};

const ehDesenvolvimento = process.env.NODE_ENV === 'development';

// O PWA (service worker) só faz sentido em produção. Em desenvolvimento,
// exportamos a config pura — evita carregar/chamar o next-pwa, que tem
// resolução instável entre ambientes (ESM/CJS interop em alguns setups).
if (ehDesenvolvimento) {
  module.exports = nextConfig;
} else {
  const withPWAInit = require('next-pwa');
  const cachePadrao = require('next-pwa/cache');

  // Revisão estável por deploy (Vercel) — invalida o precache da start_url a
  // cada novo deploy. Fallback para o horário do build em ambiente local.
  const revisaoBuild = process.env.VERCEL_GIT_COMMIT_SHA || String(Date.now());

  // Navegações (documentos HTML/RSC) — tenta a rede com timeout curto e cai
  // para o cache; sem isso, o SW padrão do next-pwa nunca precacha HTML e o
  // app fica inacessível offline (só assets estáticos ficavam em cache).
  const runtimeCaching = [
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'NetworkFirst',
      options: {
        cacheName: 'paginas-html',
        networkTimeoutSeconds: 4,
        expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        cacheableResponse: { statuses: [0, 200] },
      },
    },
    ...cachePadrao,
  ];

  // Trata tanto a forma function quanto a forma { default: function } (interop ESM/CJS).
  const withPWA = (withPWAInit.default || withPWAInit)({
    dest: 'public',
    register: true,
    skipWaiting: true,
    // Precacha a start_url (/treinos) no build. Sem isso (default dynamicStartUrl:true),
    // o next-pwa trata a start_url como NetworkFirst e o PWA instalado NÃO abre offline
    // num cold launch — o Chrome mostra a página nativa "Você está off-line". A rota é
    // estática + client-rendered (lê do Dexie), então precachar o shell resolve.
    dynamicStartUrl: false,
    // Cacheia as demais rotas conforme o usuário navega (cobertura offline ampla).
    cacheOnFrontEndNav: true,
    // Precacha o documento HTML da start_url. O next-pwa não inclui páginas do
    // App Router no precache automaticamente, então adicionamos /treinos à mão
    // (o Workbox busca e cacheia na instalação do SW, que ocorre online). Sem
    // isso, o primeiro cold launch offline cairia na página /offline.
    additionalManifestEntries: [{ url: '/treinos', revision: revisaoBuild }],
    runtimeCaching,
    fallbacks: { document: '/offline' },
  });
  module.exports = withPWA(nextConfig);
}
