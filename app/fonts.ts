// Fontes do tema Ember — self-hospedadas pelo next/font (offline-friendly).
// Oswald: títulos condensados · Bebas Neue: números gigantes · Archivo: texto.
import { Archivo, Bebas_Neue, Oswald } from 'next/font/google';

export const fonteTitulo = Oswald({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--fonte-titulo',
  display: 'swap',
});

export const fonteNumero = Bebas_Neue({
  subsets: ['latin'],
  weight: '400',
  variable: '--fonte-numero',
  display: 'swap',
});

export const fonteTexto = Archivo({
  subsets: ['latin'],
  variable: '--fonte-texto',
  display: 'swap',
});
