import type { Level } from '../core/metronome';

/** Frequência e intensidade de cada nível do clique. O acento é mais agudo e forte. */
const LEVEL: Record<Level, { freq: number; gain: number }> = {
  accent: { freq: 1800, gain: 0.9 },
  beat: { freq: 1100, gain: 0.5 },
  sub: { freq: 2600, gain: 0.25 },
};

/** Clique curto agendado no instante `when` (tempo do AudioContext). */
export function playMetroClick(ctx: AudioContext, level: Level, volume: number, when: number): void {
  if (volume <= 0) return;
  const { freq, gain } = LEVEL[level];
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, when);
  const peak = Math.min(1, volume * gain);
  amp.gain.setValueAtTime(0, when);
  amp.gain.linearRampToValueAtTime(peak, when + 0.002);
  amp.gain.exponentialRampToValueAtTime(0.001, when + 0.05);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(when);
  osc.stop(when + 0.06);
}
