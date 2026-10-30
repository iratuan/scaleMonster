// Gera os ícones de desktop a partir de public/icon.svg (o mascote):
//  - buildResources/icon.ico (Windows, vários tamanhos, PNG dentro do ICO)
//  - buildResources/icon.png (512 px, usado pelo electron-builder no macOS)
// Uso: node scripts/gerar-icone-desktop.mjs
import puppeteer from 'puppeteer-core';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SIZES = [16, 24, 32, 48, 64, 128, 256];
const svg = await readFile(new URL('../public/icon.svg', import.meta.url), 'utf8');
const outDir = new URL('../buildResources/', import.meta.url);
await mkdir(outDir, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const pngs = new Map();
for (const size of [...SIZES, 512]) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`,
  );
  pngs.set(size, await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } }));
}
await browser.close();

// Monta o ICO: cabeçalho, uma entrada por tamanho e os PNGs em sequência.
const images = SIZES.map((s) => ({ size: s, data: pngs.get(s) }));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map(({ size, data }) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0);
  e.writeUInt8(size === 256 ? 0 : size, 1);
  e.writeUInt8(0, 2);
  e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(data.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += data.length;
  return e;
});
const ico = Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
await writeFile(new URL('icon.ico', outDir), ico);
await writeFile(new URL('icon.png', outDir), pngs.get(512));
console.log('ícones gerados:', `ico ${ico.length} bytes`, `png 512 ${pngs.get(512).length} bytes`);
