// Verifica no navegador a primeira nota tocada da escala completa: corda e traste.
import puppeteer from 'puppeteer-core';

const APP = process.env.APP_URL ?? 'http://localhost:4173/';
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
await page.goto(APP, { waitUntil: 'networkidle0' });
await page.evaluate(() =>
  localStorage.setItem(
    'tutor_escalas_v3_settings',
    JSON.stringify({ state: { lang: 'pt', skin: 'dark', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 40, view: 'neck' }, version: 2 }),
  ),
);
await page.reload({ waitUntil: 'networkidle0' });
await page.waitForFunction(() => !document.querySelector('.splash'), { timeout: 15000 });
await page.waitForSelector('.fb[data-diagram="main"]');
await page.click('.surface .play, .section .play');
await wait(3200);
const first = await page.evaluate(() => {
  const el = document.querySelector('.fb[data-diagram="main"] .note--play');
  const cell = el?.parentElement;
  return cell ? { string: Number(cell.dataset.string), fret: Number(cell.dataset.fret) } : null;
});
console.log('PRIMEIRA NOTA TOCADA (corda índice 0=mais aguda, traste):', JSON.stringify(first));
await page.evaluate(() => document.querySelectorAll('.play.is-on').forEach((b) => b.click()));
await browser.close();
