// Bateria de telas no navegador: abre cada tela, captura e registra erros de console e de página.
import puppeteer from 'puppeteer-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = new URL('../docs/evidencias/telas/', import.meta.url);
await mkdir(OUT, { recursive: true });
const shot = (name) => fileURLToPath(new URL(name, OUT));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
await page.goto(APP, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'dark', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80, view: 'neck' }, version: 2 })));
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });

const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push([name, 'ok']); } catch (e) { results.push([name, `FALHOU: ${e.message.split('\n')[0]}`]); }
};
const closeOverlay = async () => { await page.keyboard.press('Escape'); await wait(350); };

await check('tela principal + partitura', async () => {
  await page.waitForSelector('.pos-grid .pos-card', { timeout: 5000 });
  const n = await page.$$eval('.pos-card', (els) => els.length);
  if (n !== 5) throw new Error(`esperava 5 cartões, achei ${n}`);
  await page.screenshot({ path: shot('bateria-01-principal.png') });
});
await check('instrumento: baixo muda grupo de cordas', async () => {
  await page.click('.chips [aria-checked="false"]');
  await wait(300);
  await page.screenshot({ path: shot('bateria-02-instrumento.png') });
});
await check('configurações (folha de ajustes)', async () => {
  await page.click('button[aria-label="Ajustes"]');
  await page.waitForSelector('.panel--sheet', { timeout: 3000 });
  await wait(400);
  await page.screenshot({ path: shot('bateria-03-ajustes.png') });
  await closeOverlay();
});
await check('ferramentas (menu)', async () => {
  await page.click('button[aria-label="Ferramentas"]');
  await page.waitForSelector('.tools-menu', { timeout: 3000 });
  await wait(300);
  await page.screenshot({ path: shot('bateria-04-ferramentas.png') });
  await page.keyboard.press('Escape');
  await wait(300);
});
await check('metrônomo (ferramenta)', async () => {
  await page.click('button[aria-label="Ferramentas"]');
  await page.waitForSelector('.tools-menu', { timeout: 3000 });
  await page.evaluate(() => [...document.querySelectorAll('.tools-menu__item')][0].click());
  await wait(400);
  await page.screenshot({ path: shot('bateria-05-metronomo.png') });
  await closeOverlay();
});
await check('afinador (ferramenta)', async () => {
  await page.click('button[aria-label="Ferramentas"]');
  await page.waitForSelector('.tools-menu', { timeout: 3000 });
  await page.evaluate(() => [...document.querySelectorAll('.tools-menu__item')][1].click());
  await wait(400);
  await page.screenshot({ path: shot('bateria-06-afinador.png') });
  await closeOverlay();
});
await check('ajuda', async () => {
  await page.click('button[aria-label="Ajuda"]');
  await wait(400);
  await page.screenshot({ path: shot('bateria-07-ajuda.png') });
  await closeOverlay();
});
await check('partitura (modo)', async () => {
  await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'madeira', instrument: 'baixo', stringCount: 4, strings: 'all', root: 'E', category: 'Pentatônica', mode: 'Maior', exercise: 4, bpm: 80, view: 'staff', clef: 'auto' }, version: 2 })));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
  await page.waitForSelector('.staff svg', { timeout: 8000 });
  await page.screenshot({ path: shot('bateria-08-partitura-baixo.png') });
});
await check('tocar uma posição isolada (sem sobreposição)', async () => {
  await page.evaluate(() => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: { lang: 'pt', skin: 'dark', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 200, view: 'neck' }, version: 2 })));
  await page.reload({ waitUntil: 'networkidle0' });
  await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
  await page.waitForSelector('.pos-card .play', { timeout: 5000 });
  const btns = await page.$$('.pos-card .play');
  await btns[1].click();
  await wait(400);
  await btns[3].click();
  await wait(400);
  const playing = await page.$$eval('.pos-card.is-playing', (els) => els.length);
  if (playing !== 1) throw new Error(`esperava 1 posição tocando, achei ${playing}`);
  await page.evaluate(() => document.querySelectorAll('.play.is-on').forEach((b) => b.click()));
});

console.log('\n== Resultado da bateria ==');
for (const [name, r] of results) console.log(`${r === 'ok' ? 'OK   ' : 'FAIL '} ${name}${r === 'ok' ? '' : ' -> ' + r}`);
console.log(`\nErros de console/página: ${errors.length}`);
for (const e of errors.slice(0, 10)) console.log('  ' + e);
await browser.close();
