// Captura o braço madeira com perspectiva, em desktop e celular.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = (n) => fileURLToPath(new URL(`../docs/evidencias/telas/${n}`, import.meta.url));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
for (const v of [{ n: 'madeira-desktop.png', w: 1280, h: 860, m: false }, { n: 'madeira-celular.png', w: 390, h: 844, m: true }]) {
  const page = await browser.newPage();
  await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 1, isMobile: v.m });
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'madeira', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80, view: 'neck' }, version: 2 })));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 400));
  const board = await page.$('.fb[data-diagram="main"]');
  await board.screenshot({ path: OUT(v.n) });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(v.n, 'rolagem horizontal=', overflow);
  await page.close();
}
await browser.close();
