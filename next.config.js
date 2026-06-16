/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

const ehDesenvolvimento = process.env.NODE_ENV === 'development';

// O PWA (service worker) só faz sentido em produção. Em desenvolvimento,
// exportamos a config pura — evita carregar/chamar o next-pwa, que tem
// resolução instável entre ambientes (ESM/CJS interop em alguns setups).
if (ehDesenvolvimento) {
  module.exports = nextConfig;
} else {
  const withPWAInit = require('next-pwa');
  // Trata tanto a forma function quanto a forma { default: function } (interop ESM/CJS).
  const withPWA = (withPWAInit.default || withPWAInit)({
    dest: 'public',
    register: true,
    skipWaiting: true,
  });
  module.exports = withPWA(nextConfig);
}
