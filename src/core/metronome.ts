/**
 * Lógica do metrônomo: compassos, subdivisões, rampa de andamento e compasso mudo.
 * Pura (sem áudio nem DOM), para ser testada.
 */

export interface Meter {
  id: string;
  beats: number;
  /** Unidade do tempo: 4 = semínima, 8 = colcheia (compassos compostos). */
  unit: 4 | 8;
}

export const METERS: Meter[] = [
  { id: '2/4', beats: 2, unit: 4 },
  { id: '3/4', beats: 3, unit: 4 },
  { id: '4/4', beats: 4, unit: 4 },
  { id: '5/4', beats: 5, unit: 4 },
  { id: '6/8', beats: 6, unit: 8 },
  { id: '7/8', beats: 7, unit: 8 },
  { id: '9/8', beats: 9, unit: 8 },
  { id: '12/8', beats: 12, unit: 8 },
];

/** Quantas divisões por tempo. 1 = só o pulso. */
export type SubId = 1 | 2 | 3 | 4 | 5 | 6;

export const SUBDIVISIONS: SubId[] = [1, 2, 3, 4, 5, 6];

export interface Ramp {
  on: boolean;
  /** Variação do andamento a cada ajuste (pode ser negativa para desacelerar). */
  step: number;
  /** A cada quantos compassos o andamento muda. */
  everyBars: number;
  /** Andamento final: a rampa para aqui. */
  target: number;
}

export interface MetroConfig {
  bpm: number;
  meter: string;
  sub: SubId;
  /** Acento no primeiro tempo do compasso. */
  accent: boolean;
  ramp: Ramp;
  /** Um compasso mudo a cada N compassos. 0 = desligado. */
  silentEvery: number;
}

export const METRO_DEFAULT: MetroConfig = {
  bpm: 100,
  meter: '4/4',
  sub: 2,
  accent: true,
  ramp: { on: false, step: 5, everyBars: 4, target: 140 },
  silentEvery: 0,
};

export function meterOf(id: string): Meter {
  return METERS.find((m) => m.id === id) ?? METERS[2];
}

/** Tempos (ticks) por compasso, considerando a subdivisão. */
export function ticksPerBar(meter: Meter, sub: SubId): number {
  return meter.beats * sub;
}

/** Duração de cada tick em segundos. O andamento refere-se à unidade do compasso. */
export function tickDuration(bpm: number, sub: SubId): number {
  return 60 / bpm / sub;
}

/** Andamento do compasso indicado, considerando a rampa (limitado à meta). */
export function bpmAtBar(bar: number, cfg: MetroConfig): number {
  const { ramp } = cfg;
  if (!ramp.on || ramp.everyBars <= 0) return cfg.bpm;
  const steps = Math.floor(bar / ramp.everyBars);
  const direction = ramp.target >= cfg.bpm ? 1 : -1;
  const value = cfg.bpm + direction * Math.abs(ramp.step) * steps;
  const reached = direction > 0 ? value >= ramp.target : value <= ramp.target;
  return clampBpm(reached ? ramp.target : value);
}

/** Compasso é mudo quando é o N-ésimo de cada grupo (ex.: silentEvery 4 -> o 4º, 8º, 12º...). */
export function isSilentBar(bar: number, silentEvery: number): boolean {
  if (silentEvery <= 1) return false;
  return bar % silentEvery === silentEvery - 1;
}

export type Level = 'accent' | 'beat' | 'sub';

export interface TickInfo {
  bar: number;
  /** Índice do tempo dentro do compasso (0 = primeiro tempo). */
  beat: number;
  /** Índice da divisão dentro do tempo (0 = o próprio tempo). */
  sub: number;
  level: Level;
  silent: boolean;
  /** Índice do tick dentro do compasso. */
  index: number;
}

/** Informação do tick de número `n` (contando desde o início). */
export function tickInfo(n: number, meter: Meter, cfg: MetroConfig): TickInfo {
  const perBar = ticksPerBar(meter, cfg.sub);
  const bar = Math.floor(n / perBar);
  const index = n % perBar;
  const beat = Math.floor(index / cfg.sub);
  const sub = index % cfg.sub;
  let level: Level = 'beat';
  if (sub !== 0) level = 'sub';
  else if (beat === 0 && cfg.accent) level = 'accent';
  return { bar, beat, sub, level, silent: isSilentBar(bar, cfg.silentEvery), index };
}

export function clampBpm(v: number): number {
  return Math.min(300, Math.max(40, Math.round(v)));
}

/**
 * Andamento a partir dos intervalos entre toques (ms). Usa os 4 últimos toques válidos;
 * intervalos fora de 0,25 s a 2 s são descartados (pausa longa = recomeço).
 */
export function tapBpm(intervalsMs: number[]): number | null {
  const valid = intervalsMs.filter((ms) => ms >= 250 && ms <= 2000).slice(-4);
  if (valid.length === 0) return null;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return clampBpm(60000 / avg);
}
