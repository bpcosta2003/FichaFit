import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primaria: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        sucesso: '#22C55E',
        alerta: '#F59E0B',
        erro: '#EF4444',
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
