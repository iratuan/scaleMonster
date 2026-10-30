import { fingerFor } from './fingering';
import type { DiagramData } from './types';

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
