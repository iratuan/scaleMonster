// Captura as telas e funcionalidades do app (web) em docs/evidencias/telas.
// Uso: npm run build; npx vite preview --port 4173; node scripts/capturar-telas.mjs
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.env.APP_URL ?? 'http://127.0.0.1:4173/';
const OUT = resolve('docs/evidencias/telas');
mkdirSync(OUT, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const VIEWS = [
  { name: 'celular-escuro', w: 390, h: 844, instrument: 'guitarra', skin: 'dark' },
  { name: 'tablet-retrato', w: 820, h: 1180, instrument: 'guitarra', skin: 'dark' },
  { name: 'computador-1440', w: 1440, h: 900, instrument: 'guitarra', skin: 'dark' },
  { name: 'desktop-escuro-guitarra', w: 1280, h: 860, instrument: 'guitarra', skin: 'dark' },
  { name: 'desktop-claro-guitarra', w: 1280, h: 860, instrument: 'guitarra', skin: 'light' },
  { name: 'desktop-baixo', w: 1280, h: 860, instrument: 'baixo', skin: 'light' },
  { name: 'desktop-ukulele', w: 1280, h: 860, instrument: 'ukulele', skin: 'dark' },
  { name: 'desktop-cavaco', w: 1280, h: 860, instrument: 'cavaco', skin: 'dark' },
  { name: 'desktop-madeira-violao', w: 1280, h: 860, instrument: 'violao', skin: 'madeira' },
  { name: 'desktop-violao-7-cordas', w: 1280, h: 860, instrument: 'violao', skin: 'dark', stringCount: 7 },
  { name: 'desktop-baixo-6-cordas', w: 1280, h: 860, instrument: 'baixo', skin: 'dark', stringCount: 6 },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`));
const report = [];

/** Abre o menu Ferramentas e escolhe o item (0 = metrônomo, 1 = afinador). */
async function openTool(i) {
  await page.click('button[aria-label="Ferramentas"]');
  await wait(200);
  const items = await page.$$('.tools-menu__item');
  await items[i].click();
}

async function setSettings(instrument, skin, stringCount) {
  await page.goto(URL, { waitUntil: 'networkidle0' });
  await page.evaluate((inst, sk, sc) => {
    const raw = JSON.parse(localStorage.getItem('tutor_escalas_v3_settings') ?? '{"state":{},"version":2}');
    Object.assign(raw.state, { instrument: inst, strings: 'all', skin: sk });
    if (sc) raw.state.stringCount = sc;
    localStorage.setItem('tutor_escalas_v3_settings', JSON.stringify(raw));
  }, instrument, skin, stringCount ?? null);
  await page.reload({ waitUntil: 'networkidle0' });
  await wait(300);
}

// 1) Telas base: uma captura por instrumento/tema, com medição de estouro horizontal.
for (const v of VIEWS) {
  await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 1 });
  await setSettings(v.instrument, v.skin, v.stringCount);
  await page.screenshot({ path: `${OUT}/${v.name}.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  report.push(`tela ${v.name}: estouro horizontal = ${overflow}px`);
}

// 1a) Metrônomo em tablet (grade e opções em duas colunas).
await page.setViewport({ width: 820, height: 1180, deviceScaleFactor: 1 });
await setSettings('guitarra', 'dark');
await openTool(0);
await wait(300);
await page.screenshot({ path: `${OUT}/tablet-metronomo.png` });
report.push('tablet metronomo: capturado');
await page.keyboard.press('Escape');
await wait(250);

// 1b) Splash: captura logo após carregar, antes de sair.
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await page.goto(URL, { waitUntil: 'domcontentloaded' });
await wait(250);
await page.screenshot({ path: `${OUT}/splash.png` });
report.push('splash: capturada');
await wait(1200);

// 2) Funcionalidades no celular.
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
await setSettings('guitarra', 'dark');

async function flow(name, action, { delay = 400, closeWithEsc = true } = {}) {
  await action();
  await wait(delay);
  await page.screenshot({ path: `${OUT}/${name}.png` });
  report.push(`funcionalidade ${name}: capturada`);
  if (closeWithEsc) {
    await page.keyboard.press('Escape');
    await wait(250);
  }
}

await flow('funcao-combobox-tom', () => page.click('.toolbar .cb'));
await flow('funcao-combobox-exercicio', () => page.click('.toolbar .cb:last-of-type'));
await flow('funcao-ajustes', () => page.click('.header__actions .icon-btn:last-child'));
await flow('funcao-metronomo', () => openTool(0), { closeWithEsc: false });
await flow('funcao-metronomo-tocando', async () => { await page.click('.metro__start'); }, { delay: 700, closeWithEsc: false });
await page.click('.metro__start');
await page.keyboard.press('Escape');
await wait(250);
await flow('funcao-afinador', () => openTool(1));
await flow('funcao-ajuda', () => page.click('.header__actions .icon-btn:nth-last-child(2)'));
await flow('funcao-backing-track', () => page.click('.link'));

// Contagem regressiva e reprodução: ação de tocar a escala completa.
await setSettings('guitarra', 'dark');
await flow('funcao-contagem', () => page.click('.section .play'), { delay: 300, closeWithEsc: false });
await wait(4000);
await page.screenshot({ path: `${OUT}/funcao-reproducao.png` });
report.push('funcionalidade funcao-reproducao: capturada (áudio ativo, sem microfone)');
await page.click('.section .play'); // para

report.push(errors.length ? `erros de execução:\n${errors.join('\n')}` : 'erros de execução: nenhum');
console.log(report.join('\n'));
await browser.close();
