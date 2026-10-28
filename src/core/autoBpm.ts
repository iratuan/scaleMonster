export const MIN_BPM = 40;
export const MAX_BPM = 300;
export const DEFAULT_BPM = 120;
export const AUTO_STEP = 10;

export function clampBpm(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(value)));
}

/**
 * Estado após terminar um ciclo completo da escala.
 * Com o modo automático, sobe 10 BPM a cada N ciclos (sem passar de 300).
 */
export function nextLoopState(
  loopCount: number,
  bpm: number,
  auto: { enabled: boolean; cycles: number },
): { loopCount: number; bpm: number } {
  const next = loopCount + 1;
  if (!auto.enabled || next < auto.cycles) return { loopCount: next, bpm };
  const raised = bpm + AUTO_STEP;
  return { loopCount: 0, bpm: raised <= MAX_BPM ? raised : bpm };
}
