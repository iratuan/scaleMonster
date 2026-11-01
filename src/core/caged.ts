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
  const imgWidth = neckImageWidth(start, end);
  return fretSpans(start, end).map((fw) => (fw / imgWidth) * 100);
}

/** Largura, na escala da imagem do braço, da região entre start e end. */
function neckImageWidth(start: number, end: number): number {
  const imgStart = start === 0 ? 0 : FRET_POS[start - 1];
  const imgEnd = FRET_POS[end] || 100;
  const width = imgEnd - imgStart;
  return width > 0 ? width : 100;
}

/** Largura de cada coluna de traste, na escala da imagem (o traste 0 é fixo). */
function fretSpans(start: number, end: number): number[] {
  const spans: number[] = [];
  for (let f = start; f <= end; f++) {
    spans.push(f === 0 ? 2.5 : FRET_POS[f] - FRET_POS[f - 1]);
  }
  return spans;
}

/**
 * Larguras de cada coluna como % do braço inteiro de referência (refStart a refEnd).
 * Um trecho com esta função tem os trastes na mesma escala do braço completo:
 * a posição é um recorte fiel da escala, e não um braço esticado.
 */
export function fretWidthsOn(start: number, end: number, refStart: number, refEnd: number): number[] {
  const refWidth = neckImageWidth(refStart, refEnd);
  return fretSpans(start, end).map((fw) => (fw / refWidth) * 100);
}
