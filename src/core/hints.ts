import { fingerFor } from './fingering';
import type { DiagramData, FretWindow } from './types';

/**
 * Na escala completa, cada nota pode ter dedo diferente em cada posição CAGED.
 * Retorna, por nota 'corda-traste', o dedo de cada posição (índice da posição -> dedo).
 */
export function mainFingerMap(positions: DiagramData[]): Map<string, Map<number, string>> {
  const map = new Map<string, Map<number, string>>();
  positions.forEach((pos, index) => {
    for (const p of pos.activePairs) {
      const key = `${p.string}-${p.fret}`;
      const byPos = map.get(key) ?? new Map<number, string>();
      byPos.set(index, fingerFor(p.fret, p.string, pos.activePairs));
      map.set(key, byPos);
    }
  });
  return map;
}

/** Dedo a exibir na escala completa para a posição atual (cai na primeira posição que contém a nota). */
export function displayFinger(
  byPos: Map<number, string> | undefined,
  currentPos: number,
): string {
  if (!byPos || byPos.size === 0) return '';
  if (byPos.has(currentPos)) return byPos.get(currentPos) ?? '';
  const first = Math.min(...byPos.keys());
  return byPos.get(first) ?? '';
}

/**
 * Ao tocar uma nota fora da janela atual, troca para a próxima janela que a contém
 * (ou para a primeira que a contém). Mesma regra do observador legado.
 */
export function nextWindowIndex(current: number, fret: number, windows: FretWindow[]): number {
  const contains = (i: number) => fret >= windows[i][0] && fret <= windows[i][1];
  const inCurrent = windows[current];
  if (inCurrent && contains(current)) return current;
  if (windows[current + 1] && contains(current + 1)) return current + 1;
  const found = windows.findIndex((_, i) => contains(i));
  return found >= 0 ? found : current;
}
