import { NOTES } from './notes';

/**
 * Pauta: conversão das notas tocadas para a grafia da partitura.
 *
 * Claves:
 *  - "treble" / "bass" / "alto": escrita direta, sem oitava.
 *  - "treble8" / "bass8": clave com "8" embaixo. A nota é escrita uma oitava acima do som.
 *
 * Padrão por instrumento (convenção de escrita; pode ser trocado nas configurações):
 *  - guitarra e violão: sol com 8 embaixo (escritos uma oitava acima).
 *  - baixo: fá com 8 embaixo (escrito uma oitava acima).
 *  - ukulele e cavaquinho: sol, sem transposição.
 */

export type ClefId = 'treble' | 'treble8' | 'bass' | 'bass8' | 'alto';
export type ClefChoice = 'auto' | ClefId;

export const CLEF_CHOICES: ClefChoice[] = ['auto', 'treble', 'treble8', 'bass', 'bass8', 'alto'];

export function defaultClef(instrument: string): ClefId {
  if (instrument === 'baixo') return 'bass8';
  if (instrument === 'guitarra' || instrument === 'violao') return 'treble8';
  return 'treble';
}

export function resolveClef(choice: ClefChoice, instrument: string): ClefId {
  return choice === 'auto' ? defaultClef(instrument) : choice;
}

/** Semitons somados à altura do som para a nota ficar na posição certa da pauta. */
export function clefShift(clef: ClefId): number {
  return clef === 'treble8' || clef === 'bass8' ? 12 : 0;
}

/** Nome da clave no VexFlow e anotação de oitava (quando existe). */
export function vexClef(clef: ClefId): { name: string; annotation?: string } {
  switch (clef) {
    case 'treble8':
      return { name: 'treble', annotation: '8vb' };
    case 'bass8':
      return { name: 'bass', annotation: '8vb' };
    default:
      return { name: clef };
  }
}

export interface StaffKey {
  /** Chave do VexFlow, por exemplo "c#/4". */
  key: string;
  accidental: '#' | null;
}

/**
 * Converte uma nota do som (altura MIDI e classe de altura) na chave da pauta, já com o deslocamento
 * da clave. Oitava MIDI: C4 = 60, que o VexFlow escreve como "c/4".
 */
export function staffKey(midi: number, noteIdx: number, shift = 0): StaffKey {
  const name = NOTES[noteIdx];
  const letter = name[0].toLowerCase();
  const sharp = name.length > 1 && name[1] === '#';
  const placed = midi + shift;
  const octave = Math.floor(placed / 12) - 1;
  return { key: `${letter}${sharp ? '#' : ''}/${octave}`, accidental: sharp ? '#' : null };
}
