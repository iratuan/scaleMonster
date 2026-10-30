// Captura a tela principal no padrão visual atual: desktop e celular.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const views = [
  { name: 'visual-desktop.png', width: 1280, height: 860, mobile: false },
  { name: 'visual-celular.png', width: 390, height: 844, mobile: true },
];
for (const v of views) {
  const page = await browser.newPage();
  await page.setViewport({ width: v.width, height: v.height, deviceScaleFactor: 1, isMobile: v.mobile });
  await page.goto(APP, { waitUntil: 'networkidle0' });
  await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'dark', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80, view: 'neck' }, version: 2 })));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: fileURLToPath(new URL(`../docs/evidencias/telas/${v.name}`, import.meta.url)), fullPage: false });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log(v.name, 'rolagem horizontal=', overflow);
  await page.close();
}
await browser.close();
