// Gera ícones PNG placeholder (quadrado roxo com halter estilizado).
// Substituir por arte final antes do lançamento público.
// Uso: node scripts/gerar-icones.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROXO = [0x8b, 0x5c, 0xf6];
const BRANCO = [0xff, 0xff, 0xff];

const tabelaCrc = (() => {
  const tabela = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tabela[n] = c;
  }
  return tabela;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) {
    c = tabelaCrc[(c ^ byte) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(tipo, dados) {
  const comprimento = Buffer.alloc(4);
  comprimento.writeUInt32BE(dados.length);
  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));
  return Buffer.concat([comprimento, corpo, crc]);
}

// Desenha um halter simples (duas anilhas + barra) sobre fundo roxo.
function corDoPixel(x, y, tamanho) {
  const cx = x / tamanho;
  const cy = y / tamanho;
  const barra = cy > 0.46 && cy < 0.54 && cx > 0.2 && cx < 0.8;
  const anilhaEsq = cx > 0.16 && cx < 0.3 && cy > 0.3 && cy < 0.7;
  const anilhaDir = cx > 0.7 && cx < 0.84 && cy > 0.3 && cy < 0.7;
  return barra || anilhaEsq || anilhaDir ? BRANCO : ROXO;
}

function gerarPng(tamanho) {
  const linhas = [];
  for (let y = 0; y < tamanho; y += 1) {
    const linha = Buffer.alloc(1 + tamanho * 3);
    linha[0] = 0; // filtro: nenhum
    for (let x = 0; x < tamanho; x += 1) {
      const [r, g, b] = corDoPixel(x, y, tamanho);
      linha[1 + x * 3] = r;
      linha[2 + x * 3] = g;
      linha[3 + x * 3] = b;
    }
    linhas.push(linha);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(tamanho, 0);
  ihdr.writeUInt32BE(tamanho, 4);
  ihdr[8] = 8; // profundidade de bits
  ihdr[9] = 2; // cor RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(Buffer.concat(linhas))),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const pasta = join(raiz, 'public', 'icons');
mkdirSync(pasta, { recursive: true });
writeFileSync(join(pasta, 'icon-192.png'), gerarPng(192));
writeFileSync(join(pasta, 'icon-512.png'), gerarPng(512));
writeFileSync(join(pasta, 'icon-512-maskable.png'), gerarPng(512));
console.warn('Ícones gerados em public/icons/');
