// Captura o braço da escala completa (guitarra, C Modos Gregos Jônio) para conferir a corda mais aguda.
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = new URL('../docs/evidencias/telas/', import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(APP, { waitUntil: 'networkidle0' });
await page.evaluate(() =>
  localStorage.setItem(
    'tutor_escalas_v3_settings',
    JSON.stringify({
      state: { lang: 'pt', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Modos Gregos', mode: 'Jônio (Maior)', exercise: 1, bpm: 80, skin: 'dark', view: 'neck', clef: 'auto' },
      version: 2,
    }),
  ),
);
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForSelector('.fb[data-diagram="main"]', { timeout: 15000 });
const board = await page.$('.fb[data-diagram="main"]');
await board.screenshot({ path: fileURLToPath(new URL('braco-escala-completa-6cordas.png', OUT)) });
await browser.close();
console.log('ok');
