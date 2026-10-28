import type { FretPair } from './types';

/**
 * Sugestão de dedo (1-4) para uma nota, olhando as notas ativas na mesma corda.
 * Retorna '0' para corda solta e '' quando não há contexto suficiente.
 */
export function fingerFor(fret: number, string: number, active: FretPair[]): string {
  if (fret === 0) return '0';

  const allFrets: number[] = [];
  const onString: number[] = [];
  for (const p of active) {
    if (p.fret <= 0) continue;
    allFrets.push(p.fret);
    if (p.string === string) onString.push(p.fret);
  }
  onString.sort((a, b) => a - b);
  if (onString.length === 0) return '';

  const minFretGeral = Math.min(...allFrets);

  if (onString.length === 3) {
    if (fret === onString[0]) return '1';
    if (fret === onString[2]) return '4';
    const gap1 = onString[1] - onString[0];
    const gap2 = onString[2] - onString[1];
    if (gap1 === 2 && gap2 === 1) return '3';
    return '2';
  }

  if (onString.length === 2) {
    const rel1 = onString[0] - minFretGeral;
    const f1 = rel1 === 0 ? 1 : rel1 === 1 ? 2 : rel1 === 2 ? 3 : 1;
    if (fret === onString[0]) return String(f1);
    if (fret === onString[1]) return String(Math.min(f1 + (onString[1] - onString[0]), 4));
  }

  if (onString.length === 1) {
    return String(Math.min(fret - minFretGeral + 1, 4));
  }

  // Mais de 3 notas na corda (escalas cromáticas): usa a ordem na corda.
  return String(Math.min(onString.indexOf(fret) + 1, 4));
}
