// Toca a escala completa de C (Jônio) no baixo de 4 cordas, com o log de depuração ligado,
// e confere nota a nota no Chrome real: casa, corda, frequência, e se a sequência sobe e desce
// sem pular nem repetir nenhuma altura.
// Uso: npm run build; npx vite preview --port 4173; node scripts/verificar-execucao-baixo.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/';
const OUT = resolve('docs/evidencias/testes');
mkdirSync(OUT, { recursive: true });

const SETTINGS = { lang: 'pt', instrument: 'baixo', stringCount: 4, strings: 'all', root: 'C', category: 'Modos Gregos', mode: 'Jônio (Maior)', exercise: 1, bpm: 200, debug: true, metronome: false, volume: 0.6 };
const OPEN = [43, 38, 33, 28]; // G2 D2 A1 E1 (corda 1 = topo)
const SCALE = new Set([0, 2, 4, 5, 7, 9, 11]); // C Jônio
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });
const logs = [];
page.on('console', (m) => {
  if (m.text().startsWith('[exec]')) logs.push(m.text());
});
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate((s) => localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: s, version: 2 })), SETTINGS);
await page.reload({ waitUntil: 'networkidle0' });

const ONE_PASS = 34; // 2n−2 para as 18 alturas do baixo: sobe e desce sem repetir a nota inicial
await page.click('.section .play');
let last = -1;
for (let t = 0; t < 120; t++) {
  await new Promise((r) => setTimeout(r, 500));
  if (logs.length >= ONE_PASS + 1) break; // um ciclo completo + a primeira nota do seguinte
  last = logs.length;
}
await page.click('.section .play');
await browser.close();

// Interpreta cada linha: [exec] <diagrama> nota <i> <NOME> corda=<c> traste=<f> hz=<Hz>
const rows = logs.map((l) => {
  const m = l.match(/nota (\d+) (\S+) corda=(\d+) traste=(\d+) hz=([\d.]+)/);
  return m ? { i: +m[1], name: m[2], string: +m[3], fret: +m[4], hz: +m[5] } : null;
}).filter(Boolean);

const problems = [];
const midis = [];
for (const r of rows) {
  const midi = OPEN[r.string - 1] + r.fret;
  midis.push(midi);
  if (NAMES[midi % 12] !== r.name) problems.push(`nota ${r.i}: nome ${r.name} ≠ ${NAMES[midi % 12]}`);
  if (!SCALE.has(midi % 12)) problems.push(`nota ${r.i}: ${r.name} fora da escala de C`);
  if (r.fret < 0 || r.fret > 15) problems.push(`nota ${r.i}: traste ${r.fret} fora do baixo`);
  const expected = 440 * Math.pow(2, (midi - 69) / 12);
  if (Math.abs(expected - r.hz) > 0.05) problems.push(`nota ${r.i}: ${r.hz} Hz ≠ ${expected.toFixed(2)} Hz`);
}
// Alturas distintas da escala no braço, em ordem: a sequência deve passar por elas uma a uma.
const heights = [...new Set(midis)].sort((a, b) => a - b);
// Virada do ciclo: a última nota do ciclo não pode ser igual à primeira do ciclo seguinte.
if (midis.length > ONE_PASS && midis[ONE_PASS - 1] === midis[ONE_PASS]) problems.push(`virada do ciclo repete ${NAMES[midis[ONE_PASS] % 12]}`);
for (let k = 1; k < midis.length; k++) {
  const a = heights.indexOf(midis[k - 1]);
  const b = heights.indexOf(midis[k]);
  if (Math.abs(a - b) !== 1) problems.push(`salto ou repetição entre notas ${k} e ${k + 1}: ${NAMES[midis[k - 1] % 12]} -> ${NAMES[midis[k] % 12]}`);
}

const lines = rows.map((r) => `${String(r.i).padStart(2)}. ${r.name.padEnd(2)} corda ${r.string} traste ${String(r.fret).padStart(2)}  ${r.hz.toFixed(2).padStart(7)} Hz`);
const report = [
  '# Execução da escala de C no baixo (Chrome real, log de depuração)',
  '',
  'Configuração: baixo 4 cordas, tônica C, modo Jônio, exercício 1, todas as cordas, 200 BPM.',
  `Notas registradas: ${rows.length} · Alturas distintas: ${heights.length}`,
  `Problemas: ${problems.length ? problems.join('; ') : 'nenhum (todas as notas em escala, corda e frequência corretas; sem salto nem repetição)'}`,
  '',
  '```',
  ...lines,
  '```',
].join('\n');
writeFileSync(resolve(OUT, 'execucao-baixo-c.md'), report + '\n');
console.log(report);
if (problems.length || rows.length === 0) process.exitCode = 1;
