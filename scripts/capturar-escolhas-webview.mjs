// Abre o botão flutuante de escolhas no WebView (paisagem de celular) e captura o painel.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const browser = await puppeteer.connect({ browserURL: 'http://localhost:9222', defaultViewport: null });
const pages = await browser.pages();
const page = pages.find((p) => p.url().includes('localhost')) ?? pages[0];
await page.setViewport({ width: 844, height: 390, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 30000 });
await new Promise((r) => setTimeout(r, 600));
await page.click('.fab-escolhas');
await new Promise((r) => setTimeout(r, 700));
const open = await page.evaluate(() => !!document.querySelector('.panel--sheet .toolbar'));
console.log('painel de escolhas aberto:', open);
await page.screenshot({ path: fileURLToPath(new URL('../docs/evidencias/telas/android-celular-escolhas.png', import.meta.url)) });
await browser.disconnect();
