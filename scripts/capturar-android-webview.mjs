// Captura o app Android pelo próprio WebView (depurador, porta 9222), simulando um celular.
// Uso: node scripts/capturar-android-webview.mjs [paisagem|retrato]
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const orientation = process.argv[2] ?? 'paisagem';
const size = orientation === 'retrato' ? { width: 390, height: 844 } : { width: 844, height: 390 };
const out = fileURLToPath(new URL(`../docs/evidencias/telas/android-celular-${orientation}.png`, import.meta.url));

const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
const pages = await browser.pages();
const page = pages.find((p) => p.url().includes('localhost')) ?? pages[0];
await page.setViewport({ ...size, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
// O WebView não recalcula o layout ao mudar o viewport pelo depurador: recarrega a página no novo tamanho.
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 30000 });
await new Promise((r) => setTimeout(r, 800));
const info = await page.evaluate(() => ({
  w: window.innerWidth,
  h: window.innerHeight,
  buttons: document.querySelectorAll('button').length,
  header: !!document.querySelector('.header'),
}));
console.log('viewport:', JSON.stringify(info));
await page.screenshot({ path: out });
console.log('salvo:', out);
await browser.disconnect();
