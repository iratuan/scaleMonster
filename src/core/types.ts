import type { Instrument } from './instruments';

export type Skin = 'light' | 'dark' | 'vintage' | 'madeira';

/** Identificador do filtro de cordas do instrumento atual (ex.: 'all', '1-3'). */
export type StringFilter = string;

export type ExerciseId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface ModeDef {
  /** Intervalos em semitons a partir da tônica. */
  i: number[];
  /** Deslocamento de traste usado para encaixar o padrão CAGED. */
  c: number;
}

export type ScaleBank = Record<string, Record<string, ModeDef>>;

export interface ScaleContext {
  root: string;
  rootIdx: number;
  category: string;
  mode: string;
  intervals: number[];
  notes: Set<string>;
  cagedOffset: number;
  instrument: Instrument;
}

/** [trasteInicial, trasteFinal], inclusivos. */
export type FretWindow = [number, number];

export interface PlayNote {
  /** Índice da corda: 0 é a mais aguda (topo visual). */
  string: number;
  fret: number;
  pitch: number;
  noteIdx: number;
  /** Altura MIDI absoluta, usada para detectar uníssonos. */
  absPitch: number;
}

export interface FretPair {
  string: number;
  fret: number;
}

export interface DiagramData {
  id: string;
  start: number;
  end: number;
  sequence: PlayNote[];
  activePairs: FretPair[];
}
