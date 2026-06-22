import type { Config } from 'tailwindcss';

// Tema EMBER — Âmbar & Fogo. Cores semânticas via CSS variables (tema
// claro/escuro alternável); o âmbar/fogo é fixo nos dois temas.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        fundo: 'var(--cor-fundo)',
        superficie: 'var(--cor-superficie)',
        'superficie-2': 'var(--cor-superficie-2)',
        texto: 'var(--cor-texto)',
        'texto-suave': 'var(--cor-texto-suave)',
        borda: 'var(--cor-borda)',
        fogo: {
          DEFAULT: '#F59E0B',
          claro: '#FB923C',
          escuro: '#D97706',
        },
        // Texto/ícone sobre o gradiente âmbar — legível nos dois temas.
        'sobre-fogo': 'var(--cor-sobre-fogo)',
        sucesso: '#22C55E',
        erro: '#EF4444',
      },
      fontFamily: {
        sans: ['var(--fonte-texto)', 'system-ui', 'sans-serif'],
        titulo: ['var(--fonte-titulo)', 'system-ui', 'sans-serif'],
        numero: ['var(--fonte-numero)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Brilho sutil do âmbar — reservado para os FABs circulares flutuantes.
        fogo: '0 4px 12px -4px rgba(245, 158, 11, 0.25)',
      },
      minHeight: {
        toque: '48px',
        'botao-grande': '64px',
      },
      minWidth: {
        toque: '48px',
      },
    },
  },
  plugins: [],
};

export default config;
