// Abre o dicionário de acordes pelo menu de ferramentas, captura e toca um acorde em arpejo.
import puppeteer from 'puppeteer-core';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(APP, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'dark', instrument: 'violao', stringCount: 6, strings: 'all', root: 'G', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 60, view: 'neck' }, version: 2 })));
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });

await page.click('button[aria-label="Ferramentas"]');
await page.waitForSelector('.tools-menu', { timeout: 3000 });
const items = await page.$$eval('.tools-menu__item', (els) => els.map((e) => e.textContent));
console.log('itens do menu:', items.join(' | '));
await page.evaluate(() => [...document.querySelectorAll('.tools-menu__item')].find((b) => b.textContent.includes('Dicionário')).click());
await page.waitForSelector('.chord-panel', { timeout: 5000 });
await wait(300);
const chips = await page.$$eval('.chord-panel .chord-chip:not(.chord-chip--type)', (els) => els.map((e) => e.textContent));
console.log('acordes diatônicos no modal:', chips.length ? chips.join(' ') : '(nenhum: escala de 5 notas)');
await page.screenshot({ path: fileURLToPath(new URL('../docs/evidencias/telas/dicionario-acordes.png', import.meta.url)) });
await page.click('.chord-panel .play');
await wait(4200);
const playing = await page.$$eval('.fb[data-diagram="chord"] .note--play', (els) => els.length);
console.log('nota destacada no arpejo dentro do modal:', playing);
await page.keyboard.press('Escape');
await wait(400);
const stillOpen = await page.$('.chord-panel');
console.log('modal fechado:', stillOpen === null);
await browser.close();
