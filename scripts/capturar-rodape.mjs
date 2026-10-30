// Captura o rodapé com a curiosidade de abertura do app.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1100, height: 800, deviceScaleFactor: 1 });
await page.goto(APP, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'dark', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80 }, version: 2 })));
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
const footer = await page.$('.app-footer');
await footer.scrollIntoView?.();
await footer.screenshot({ path: fileURLToPath(new URL('../docs/evidencias/telas/rodape-curiosidade.png', import.meta.url)) });
console.log(await footer.evaluate((el) => el.textContent));
await browser.close();
