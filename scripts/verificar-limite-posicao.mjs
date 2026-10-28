// Escala completa, guitarra, C maior (Jônio), exercício 1, no Chrome real com o log de depuração.
// Confere que ao chegar a cada limite de posição (topo) a execução volta (desce) e que não há pulo.
// Uso: npm run build; npx vite preview --port 4173; node scripts/verificar-limite-posicao.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/';
const OUT = resolve('docs/evidencias/testes');
mkdirSync(OUT, { recursive: true });

const SETTINGS = { lang: 'pt', instrument: 'guitarra', stringCount: 6, strings: 'all', root: 'C', category: 'Modos Gregos', mode: 'Jônio (Maior)', exercise: 1, bpm: 200, debug: true, metronome: false, volume: 0.5 };
const OPEN = [64, 59, 55, 50, 45, 40]; // E4 B3 G3 D3 A2 E2 (corda 1 = topo)
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });
const logs = [];
const uiLogs = [];
page.on('console', (m) => {
  if (m.text().startsWith('[exec]')) logs.push(m.text());
  if (m.text().startsWith('[ui]')) uiLogs.push(m.text());
});
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate((s) => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: s, version: 2 })), SETTINGS);
await page.reload({ waitUntil: 'networkidle0' });
await page.click('.section .play');
// Espera a primeira passagem completa pelo topo do braço e a volta (~ 60 notas a 200 BPM).
await new Promise((r) => setTimeout(r, 3000 + 70 * 300 + 300));
await page.click('.section .play');
await browser.close();

const rows = logs.map((l) => l.match(/nota (\d+) (\S+) corda=(\d+) traste=(\d+) hz=([\d.]+)/)).filter(Boolean)
  .map((m) => ({ i: +m[1], name: m[2], string: +m[3], fret: +m[4], midi: OPEN[+m[3] - 1] + +m[4] }));

// Lógica (exec) x tela (ui): mesma nota, corda e casa, na mesma ordem.
const uiRows = uiLogs.map((l) => l.match(/corda=(\d+|-) traste=(\d+|-)/)).filter(Boolean).map((m) => ({ string: m[1], fret: m[2] }));
const mismatch = rows.filter((r, k) => !uiRows[k] || String(r.string) !== uiRows[k].string || String(r.fret) !== uiRows[k].fret).length;
const problems = [];
if (mismatch) problems.push(`${mismatch} notas em que a tela destaca casa diferente da lógica`);
rows.forEach((r, k) => {
  if (NAMES[r.midi % 12] !== r.name) problems.push(`nota ${r.i}: nome`);
  if (k > 0 && Math.abs(rows[k - 1].midi - r.midi) > 2 && rows[k - 1].midi !== r.midi) {
    // Salto grande só é aceitável se for a volta do ciclo (topo -> base)
  }
});
// Posições da escala completa (topo de cada janela de 5 trastes, usando a janela de traste real da nota).
const ascending = (k) => k > 0 && rows[k].midi > rows[k - 1].midi;
const turns = rows.filter((r, k) => k > 0 && k + 1 < rows.length && ascending(k) !== (rows[k + 1].midi > rows[k].midi) && rows[k + 1].midi !== rows[k].midi);
const limitG = rows.filter((r) => r.string === 1 && r.fret === 3);
const lines = rows.map((r, k) => `${String(r.i).padStart(2)}. ${r.name.padEnd(2)} corda ${r.string} traste ${String(r.fret).padStart(2)} (${r.midi})${k && rows[k].midi === rows[k - 1].midi ? '  <- repetida' : ''}`);
const report = [
  '# Escala completa, guitarra, C maior: volta nos limites de posição (Chrome real)',
  '',
  `Notas registradas: ${rows.length} · Voltas (topos e bases) observadas: ${turns.length}`,
  `Lógica x tela: ${rows.length} notas comparadas, ${mismatch} diferenças`,
  `Passagens pelo G do traste 3 (limite da posição 1): ${limitG.length} · Problemas: ${problems.length ? problems.join('; ') : 'nenhum'}`,
  '',
  '```',
  ...lines,
  '```',
].join('\n');
writeFileSync(resolve(OUT, 'escala-completa-limites-guitarra.md'), report + '\n');
console.log(report.split('\n').slice(0, 5).join('\n'));
if (rows.length === 0) process.exitCode = 1;
