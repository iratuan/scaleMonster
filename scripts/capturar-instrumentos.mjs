// Captura a tela de cada instrumento de cordas, em desktop e celular, para revisão visual.
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = new URL('../docs/evidencias/telas/', import.meta.url);
await mkdir(OUT, { recursive: true });
const INSTR = [
  { id: 'guitarra', count: 6, root: 'C', cat: 'Pentatônica', mode: 'Maior' },
  { id: 'violao', count: 7, root: 'G', cat: 'Pentatônica', mode: 'Maior' },
  { id: 'baixo', count: 4, root: 'E', cat: 'Pentatônica', mode: 'Maior' },
  { id: 'ukulele', count: 4, root: 'C', cat: 'Pentatônica', mode: 'Maior' },
  { id: 'cavaco', count: 4, root: 'D', cat: 'Pentatônica', mode: 'Maior' },
];
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
for (const v of [{ tag: 'desktop', width: 1280, height: 900, mobile: false }, { tag: 'celular', width: 390, height: 844, mobile: true }]) {
  for (const i of INSTR) {
    const page = await browser.newPage();
    await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: 1, isMobile: v.mobile });
    await page.goto(APP, { waitUntil: 'networkidle0' });
    await page.evaluate((s) => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'dark', instrument: s.id, stringCount: s.count, strings: 'all', root: s.root, category: s.cat, mode: s.mode, exercise: 1, bpm: 80, view: 'neck' }, version: 2 })), i);
    await page.reload({ waitUntil: 'networkidle0' });
    await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
    await page.waitForSelector('.pos-card', { timeout: 8000 });
    await new Promise((r) => setTimeout(r, 300));
    await page.screenshot({ path: fileURLToPath(new URL(`instrumento-${i.id}-${v.tag}.png`, OUT)) });
    const cards = await page.$$eval('.pos-card', (els) => els.length);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`${i.id} ${v.tag}: cartoes=${cards} rolagem_horizontal=${overflow}`);
    await page.close();
  }
}
await browser.close();
