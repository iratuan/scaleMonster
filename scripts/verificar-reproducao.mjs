// Verifica no Chrome real a reprodução: cada nota gera um som na frequência certa,
// dentro da escala, e a nota em execução fica visível no braço.
// Uso: npm run build; npx vite preview --port 4173; node scripts/verificar-reproducao.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/';
const OUT = resolve('docs/evidencias/testes');
mkdirSync(OUT, { recursive: true });

// Baixo de 4 cordas, tônica C, pentatônica maior, exercício 4, cordas 1–2 (12 notas por ciclo).
const SETTINGS = { lang: 'pt', instrument: 'baixo', stringCount: 4, strings: '1-2', root: 'C', category: 'Pentatônica', mode: 'Maior', exercise: 4, bpm: 80, metronome: false, volume: 0.8 };
const OPEN_MIDI = [43, 38, 33, 28]; // G2 D2 A1 E1
const PC_SCALE = new Set([0, 2, 4, 7, 9]); // C D E G A
const freqOf = (m) => 440 * Math.pow(2, (m - 69) / 12);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 860 });

// Antes de a página carregar: registra cada oscilador criado e a frequência agendada.
await page.evaluateOnNewDocument(() => {
  window.__freqs = [];
  const orig = (window.AudioContext || window.webkitAudioContext).prototype.createOscillator;
  (window.AudioContext || window.webkitAudioContext).prototype.createOscillator = function () {
    const osc = orig.call(this);
    const set = osc.frequency.setValueAtTime.bind(osc.frequency);
    osc.frequency.setValueAtTime = (v, t) => {
      window.__freqs.push(v);
      return set(v, t);
    };
    return osc;
  };
});

await page.goto(URL, { waitUntil: 'networkidle0' });
await page.evaluate((s) => {
  localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify({ state: s, version: 2 }));
}, SETTINGS);
await page.reload({ waitUntil: 'networkidle0' });

// Toca a escala completa e espera 3 s de contagem + ~6 notas.
await page.click('.section .play');
await new Promise((r) => setTimeout(r, 3000 + 6 * 750 + 200));
const playingNow = await page.$$eval('[data-diagram="main"] .note--play', (els) => els.map((e) => e.getAttribute('aria-label')));
const freqs = await page.evaluate(() => window.__freqs.slice());
await page.click('.section .play'); // parar
await browser.close();

// Confere cada frequência: deve ser uma corda solta + traste 0–15 do baixo, e nota da escala.
const problems = [];
const valid = [];
for (const f of freqs) {
  let found = null;
  for (const open of OPEN_MIDI) {
    for (let fret = 0; fret <= 15; fret++) {
      if (Math.abs(freqOf(open + fret) - f) < 0.05) found = { open, fret };
    }
  }
  if (!found) problems.push(`frequência ${f.toFixed(2)} Hz não existe no baixo`);
  else if (!PC_SCALE.has((found.open + found.fret) % 12)) problems.push(`nota ${found.open + found.fret} fora da escala`);
  else valid.push(`${f.toFixed(2)} Hz (corda ${OPEN_MIDI.indexOf(found.open) + 1}, traste ${found.fret})`);
}

const report = [
  '# Verificação da reprodução (Chrome real)',
  '',
  `Configuração: baixo 4 cordas, tônica C, pentatônica maior, exercício 4, cordas 1–2, 80 BPM.`,
  `Sons gerados em ~${(3000 + 6 * 750) / 1000} s de reprodução: ${freqs.length}`,
  `Frequências válidas (corda e traste reais, nota da escala): ${valid.length}`,
  `Problemas: ${problems.length ? problems.join('; ') : 'nenhum'}`,
  `Notas destacadas em execução no braço principal (rótulo): ${playingNow.join(', ') || 'nenhuma'}`,
  '',
  'Primeiros sons:',
  ...valid.slice(0, 12).map((v, i) => `${i + 1}. ${v}`),
].join('\n');
writeFileSync(resolve(OUT, 'verificacao-reproducao.md'), report + '\n');
console.log(report);
if (problems.length || freqs.length === 0) process.exitCode = 1;
