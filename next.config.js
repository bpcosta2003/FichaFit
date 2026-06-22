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
    runtimeCaching,
    fallbacks: { document: '/offline' },
  });
  module.exports = withPWA(nextConfig);
}
