// Gera os ícones do Android (mipmap) a partir de public/icon.svg, no tamanho de cada densidade.
// Uso: node scripts/gerar-icones-android.mjs
import puppeteer from 'puppeteer-core';
import { readFileSync, copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const svg = readFileSync(resolve('public/icon.svg'), 'utf8');
const DENSITIES = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
for (const [dens, size] of Object.entries(DENSITIES)) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  const out = resolve(`android/app/src/main/res/mipmap-${dens}`);
  if (!existsSync(out)) continue;
  await page.screenshot({ path: resolve(out, 'ic_launcher.png'), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  copyFileSync(resolve(out, 'ic_launcher.png'), resolve(out, 'ic_launcher_round.png'));
  console.log(dens, size, 'px');
}
await browser.close();
