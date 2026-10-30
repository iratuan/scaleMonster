// Captura a partitura da escala completa em execução (guitarra, C Modos Gregos Jônio).
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = new URL('../docs/evidencias/telas/', import.meta.url);
await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(APP, { waitUntil: 'networkidle0' });
await page.evaluate(() =>
  localStorage.setItem(
    'tutor_escalas_v3_settings',
    JSON.stringify({
      state: { lang: 'pt', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Modos Gregos', mode: 'Jônio (Maior)', exercise: 1, bpm: 120, skin: 'dark', view: 'staff', clef: 'auto' },
      version: 2,
    }),
  ),
);
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForSelector('.staff svg', { timeout: 15000 });
const section = await page.$('.staff');
await section.screenshot({ path: fileURLToPath(new URL('partitura-parada.png', OUT)) });
await page.click('section.section:nth-of-type(2) .play, .section .play');
await new Promise((r) => setTimeout(r, 5000));
await section.screenshot({ path: fileURLToPath(new URL('partitura-tocando.png', OUT)) });
await page.evaluate(() => document.querySelectorAll('.play.is-on').forEach((b) => b.click()));
const svgCount = await page.$$eval('.staff svg', (els) => els.length);
console.log('staff svg:', svgCount);
await browser.close();
