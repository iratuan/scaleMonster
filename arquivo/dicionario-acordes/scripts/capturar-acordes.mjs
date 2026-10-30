// Captura o painel de acordes em violão e baixo, e confere que o arpejo toca e destaca o acorde.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = (name) => fileURLToPath(new URL(`../docs/evidencias/telas/${name}`, import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const CASES = [
  { id: 'violao', count: 6, root: 'G', name: 'acordes-violao.png' },
  { id: 'baixo', count: 4, root: 'E', name: 'acordes-baixo.png' },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
for (const c of CASES) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await page.evaluate((s) => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'dark', instrument: s.id, stringCount: s.count, strings: 'all', root: s.root, category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 60, view: 'neck' }, version: 2 })), c);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
  await page.waitForSelector('.chord-panel', { timeout: 8000 });
  const panel = await page.$('.chord-panel');
  await panel.screenshot({ path: OUT(c.name) });
  const chips = await page.$$eval('.chord-panel .chord-chip:not(.chord-chip--type)', (els) => els.map((e) => e.textContent));
  console.log(c.id, 'acordes da escala:', chips.join(' '));
  // Toca o primeiro acorde e confere que o arpejo destaca uma nota por vez.
  await page.click('.chord-panel .play');
  await wait(4200);
  const playingNote = await page.$$eval('.fb[data-diagram="chord"] .note--play', (els) => els.length);
  const playingNow = await page.$eval('.chord-panel .play', (b) => b.className);
  console.log(c.id, 'nota destacada durante o arpejo:', playingNote, '| botao:', playingNow);
  await page.click('.chord-panel .play');
  await page.close();
}
await browser.close();
