// Captura cada instrumento de cordas na horizontal do celular, pelo WebView (porta 9222 encaminhada pelo adb).
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const INSTRUMENTOS = [
  { id: 'guitarra', count: 6, root: 'C' },
  { id: 'violao', count: 6, root: 'G' },
  { id: 'baixo', count: 4, root: 'E' },
  { id: 'ukulele', count: 4, root: 'C' },
  { id: 'cavaco', count: 4, root: 'D' },
];
const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
const pages = await browser.pages();
const page = pages.find((p) => p.url().includes('localhost')) ?? pages[0];
await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
for (const i of INSTRUMENTOS) {
  await page.evaluate((x) => {
    const st = JSON.parse(localStorage.getItem('tutor_escalas_v3_settings') || '{"state":{},"version":2}');
    Object.assign(st.state, { lang: 'pt', skin: 'dark', instrument: x.id, stringCount: x.count, strings: 'all', root: x.root, category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80, view: 'neck' });
    localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify(st));
  }, i);
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 30000 });
  await new Promise((r) => setTimeout(r, 800));
  const out = fileURLToPath(new URL(`../docs/evidencias/telas/android-paisagem-${i.id}.png`, import.meta.url));
  await page.screenshot({ path: out });
  const info = await page.evaluate(() => ({
    cols: getComputedStyle(document.querySelector('.fb')).gridTemplateColumns.split(' ').length,
    overflowX: document.documentElement.scrollWidth > innerWidth,
    scrollH: document.documentElement.scrollHeight,
  }));
  console.log(i.id, JSON.stringify(info));
}
await browser.disconnect();
