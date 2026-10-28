/**
 * Síntese "pluck": onda dente de serra, filtro passa-baixa que acompanha a altura
 * e um decaimento longo de 2.5 s, para soar como corda vibrando.
 */
export const PLUCK_DURATION_S = 2.5;

export function playPluck(ctx: AudioContext, pitch: number, volume: number): void {
  if (volume <= 0 || !Number.isFinite(pitch) || pitch <= 0) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(pitch, now);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(Math.min(3500, pitch + 1500), now);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + PLUCK_DURATION_S);

  osc.start(now);
  osc.stop(now + PLUCK_DURATION_S);
}

/**
 * Clique do metrônomo: um pulso curto de onda senoidal. A nota de início do ciclo
 * (accent) sai mais aguda e mais forte, para marcar a volta da sequência.
 */
export function playClick(ctx: AudioContext, accent: boolean, volume: number): void {
  if (volume <= 0) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(accent ? 1800 : 1100, now);
  const peak = Math.min(1, volume * (accent ? 0.9 : 0.5));
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.07);
}
