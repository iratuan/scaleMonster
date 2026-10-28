// Baixo 4 cordas, grupo "todas", C pentatônica maior, exercício 1, posição 1: no Chrome real, qual é a
// primeira nota que SOA (frequência do primeiro oscilador) e qual é a primeira nota DESTACADA na tela.
// Uso: npm run build; npx vite preview --port 4173; node scripts/verificar-primeira-nota.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/';
const OUT = resolve('docs/evidencias/testes');
mkdirSync(OUT, { recursive: true });
const SETTINGS = { lang: 'pt', instrument: 'baixo', stringCount: 4, strings: 'all', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 1, bpm: 80, debug: true, metronome: false, volume: 0.6 };
const NAMES = { 41.2: 'E1', 49.0: 'G1', 43.65: 'F1', 55: 'A1' };

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });
await page.evaluateOnNewDocument(() => {
  window.__freqs = [];
  const Ctor = window.AudioContext || window.webkitAudioContext;
  const orig = Ctor.prototype.createOscillator;
  Ctor.prototype.createOscillator = function () {
    const osc = orig.call(this);
    const set = osc.frequency.setValueAtTime.bind(osc.frequency);
    osc.frequency.setValueAtTime = (v, t) => { window.__freqs.push(v); return set(v, t); };
    return osc;
  };
});
const logs = [];
page.on('console', (m) => (m.text().startsWith('[exec]') || m.text().startsWith('[ui]')) && logs.push(m.text()));
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate((s) => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: s, version: 2 })), SETTINGS);
await page.reload({ waitUntil: 'networkidle0' });
const card = (await page.$$('.positions article'))[0];
await (await card.$('.play')).click();
await new Promise((r) => setTimeout(r, 3000 + 150)); // logo após a primeira nota (80 BPM = 750 ms por nota)
const firstHighlight = await page.evaluate(() => {
  const el = document.querySelector('[data-diagram="pos-0"] .note--play');
  const c = el?.closest('.fb__cell');
  return el ? `${el.textContent} corda=${Number(c.dataset.string) + 1} traste=${c.dataset.fret}` : 'nenhum';
});
const freqs = await page.evaluate(() => window.__freqs.slice(0, 3));
await (await card.$('.play')).click();
await browser.close();

const report = [
  '# Primeira nota: baixo 4 cordas, grupo todas, C pentatônica maior, exercício 1, posição 1 (Chrome real)',
  '',
  `Primeira nota destacada na tela: ${firstHighlight}`,
  `Primeiros sons (Hz): ${freqs.map((f) => `${f.toFixed(2)} (${NAMES[f.toFixed(2)] ?? NAMES[Math.round(f * 100) / 100] ?? '?'})`).join(', ') || 'nenhum'}`,
  'Log (primeiras linhas):',
  ...logs.slice(0, 4).map((l) => `  ${l}`),
].join('\n');
writeFileSync(resolve(OUT, 'primeira-nota-baixo.md'), report + '\n');
console.log(report);
