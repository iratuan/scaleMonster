// Captura as posições em grade: duas colunas em tela larga e uma coluna no celular.
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = new URL('../docs/evidencias/telas/', import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const shots = [
  { name: 'posicoes-desktop-2colunas.png', width: 1280, height: 900 },
  { name: 'posicoes-celular-1coluna.png', width: 390, height: 844, mobile: true },
];
for (const v of shots) {
  const page = await browser.newPage();
  await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: 1, isMobile: !!v.mobile });
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await page.evaluate(() =>
    localStorage.setItem(
      'tutor_escalas_v3_settings',
      JSON.stringify({ state: { lang: 'pt', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80, skin: 'dark', view: 'neck' }, version: 2 }),
    ),
  );
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
  await page.waitForSelector('.pos-grid', { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 400));
  const grid = await page.$('.pos-grid');
  const cols = await grid.evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(v.name, 'colunas=', cols, 'rolagem horizontal da página=', overflow);
  await grid.screenshot({ path: fileURLToPath(new URL(v.name, OUT)) });
  await page.close();
}
await browser.close();
