// Captura o braço deslizante: posição 2 escolhida pelos pontos, e a execução com "acompanhar" ligado.
// Uso: npm run build; npx vite preview --port 4173; node scripts/capturar-braco-deslizante.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/';
const OUT = resolve('docs/evidencias/telas');
mkdirSync(OUT, { recursive: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80, skin: 'dark' }, version: 2 })));
await page.reload({ waitUntil: 'networkidle0' });
const neck = await page.$('.neck');
await neck.evaluate((el) => el.scrollIntoView({ block: 'start' }));
await wait(300);
const dots = await page.$$('.neck__dot');
await dots[1].click();
await wait(600);
await (await page.$('.neck')).screenshot({ path: `${OUT}/braco-deslizante-posicao2.png` });
await page.evaluate(() => {
  const cb = document.querySelector('.neck__follow input');
  cb.click();
});
await (await page.$('.section .play')).click();
await wait(3000 + 16 * 750 + 200);
await (await page.$('.neck')).screenshot({ path: `${OUT}/braco-deslizante-acompanhando.png` });
const idx = await page.$$eval('.neck__dot', (els) => els.findIndex((e) => e.getAttribute('aria-selected') === 'true'));
await (await page.$('.section .play')).click();
await browser.close();
console.log('posição mostrada durante a execução (índice):', idx);
