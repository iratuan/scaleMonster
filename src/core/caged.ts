import type { FretWindow } from './types';

const BASE_WINDOWS: FretWindow[] = [
  [0, 4],
  [2, 6],
  [4, 8],
  [7, 11],
  [9, 13],
];

/** Posição de cada traste no braço (percentual de escala), usada para o layout proporcional. */
const FRET_POS = [0, 8.68, 16.88, 24.61, 31.91, 38.8, 45.31, 51.44, 57.23, 62.69, 67.85, 72.71, 77.34, 81.68, 85.78, 89.65, 93.3, 96.75, 100];

/**
 * Janelas móveis de 5 trastes das 5 posições para a tônica dada.
 * Ordenadas, sem início repetido e limitadas ao número de trastes do instrumento.
 */
export function getPositionWindows(rootIdx: number, cagedOffset: number, maxFret = Infinity): FretWindow[] {
  const windows: FretWindow[] = BASE_WINDOWS.map(([b0, b1]) => {
    let start = b0 + rootIdx + cagedOffset;
    let end = b1 + rootIdx + cagedOffset;
    while (start >= 12) {
      start -= 12;
      end -= 12;
    }
    while (start < 0) {
      start += 12;
      end += 12;
    }
    return [start, Math.min(end, maxFret)];
  });

  windows.sort((a, b) => a[0] - b[0]);

  const seen = new Set<number>();
  const unique = windows.filter(([start]) => {
    if (seen.has(start)) return false;
    seen.add(start);
    return true;
  });

  const result = unique.length < 5 ? BASE_WINDOWS.map(([s, e]) => [s, Math.min(e, maxFret)] as FretWindow) : unique;
  return result.slice(0, 5);
}

/**
 * Largura relativa de cada coluna de traste entre start e end.
 * O traste 0 (corda solta) recebe uma largura fixa menor, como no braço real.
 */
export function fretWidths(start: number, end: number): number[] {
  const imgStart = start === 0 ? 0 : FRET_POS[start - 1];
  const imgEnd = FRET_POS[end] || 100;
  let imgWidth = imgEnd - imgStart;
  if (imgWidth <= 0) imgWidth = 100;

  const widths: number[] = [];
  for (let f = start; f <= end; f++) {
    const fw = f === 0 ? 2.5 : FRET_POS[f] - FRET_POS[f - 1];
    widths.push((fw / imgWidth) * 100);
  }
  return widths;
}
