import { bpmAtBar, meterOf, tickDuration, tickInfo, type MetroConfig, type TickInfo } from '../core/metronome';
import { playMetroClick } from './metroSound';

/** Janela de agendamento: quantos segundos à frente os cliques são colocados no áudio. */
const LOOKAHEAD_S = 0.12;
/** Intervalo em que o agendador acorda. */
const TICK_MS = 25;

export type TickHandler = (info: TickInfo, bpm: number, at: number) => void;

/**
 * Metrônomo com agendamento preciso: os cliques são colocados no relógio do áudio
 * com antecedência, em vez de depender de setTimeout. A configuração é lida a cada
 * tick, então mudanças de andamento, compasso e subdivisão valem na hora.
 */
export class MetronomeEngine {
  private ctx: AudioContext | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private n = 0;
  private nextTime = 0;
  private running = false;

  constructor(
    private readonly getConfig: () => MetroConfig,
    private readonly getVolume: () => number,
    private readonly onTick: TickHandler,
  ) {}

  get isRunning(): boolean {
    return this.running;
  }

  start(): void {
    if (this.running) return;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    if (!this.ctx || this.ctx.state === 'closed') this.ctx = new AC();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    this.running = true;
    this.n = 0;
    this.nextTime = this.ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.schedule(), TICK_MS);
    this.schedule();
  }

  private schedule(): void {
    if (!this.running || !this.ctx) return;
    const cfg = this.getConfig();
    const meter = meterOf(cfg.meter);
    const horizon = this.ctx.currentTime + LOOKAHEAD_S;
    while (this.nextTime < horizon) {
      const info = tickInfo(this.n, meter, cfg);
      const bpm = bpmAtBar(info.bar, cfg);
      if (!info.silent) playMetroClick(this.ctx, info.level, this.getVolume(), this.nextTime);
      this.onTick(info, bpm, this.nextTime);
      this.nextTime += tickDuration(bpm, cfg.sub);
      this.n++;
    }
  }

  stop(): void {
    this.running = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.n = 0;
  }

  close(): void {
    this.stop();
    if (this.ctx && this.ctx.state !== 'closed') void this.ctx.close();
    this.ctx = null;
  }

  /** Segundos entre agora e o instante `at` do áudio (para sincronizar a tela). */
  delayUntil(at: number): number {
    return Math.max(0, (at - (this.ctx?.currentTime ?? 0)) * 1000);
  }
}
