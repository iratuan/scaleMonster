// Captura o desafio ligado (aviso visível) e o menu Ferramentas no computador.
// Uso: npm run build; npx vite preview --port 4173; node scripts/capturar-desafio.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/';
const OUT = resolve('docs/evidencias/telas');
mkdirSync(OUT, { recursive: true });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80, skin: 'dark', challenge: true }, version: 2 })));
await page.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${OUT}/desafio-ativo.png` });
await page.click('button[aria-label="Ferramentas"]');
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: `${OUT}/menu-ferramentas.png` });
await browser.close();
console.log('desafio e menu capturados');
