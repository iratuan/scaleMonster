import { describe, expect, it } from 'vitest';
import { CHORD_TYPE_IDS, CHORD_TYPES, chordName, diatonicChords, findVoicing } from './chords';
import { INSTRUMENTS, resolveInstrument } from './instruments';

describe('acordes: digitação gerada', () => {
  it('toda combinação de instrumento, tonalidade e tipo tem digitação com as notas do acorde', () => {
    const problems: string[] = [];
    for (const inst of Object.values(INSTRUMENTS)) {
      for (const count of inst.variants) {
        const r = resolveInstrument(inst.id, count);
        for (let root = 0; root < 12; root++) {
          for (const type of CHORD_TYPE_IDS) {
            const tag = `${inst.id}/${count}c ${chordName(root, type)}`;
            const v = findVoicing(r.strings, r.frets, root, type);
            if (!v) {
              problems.push(`${tag}: sem digitação`);
              continue;
            }
            const pcs = new Set(CHORD_TYPES[type].map((i) => (root + i) % 12));
            const strings = new Set<number>();
            for (const n of v.notes) {
              if (!pcs.has(n.noteIdx)) problems.push(`${tag}: nota fora do acorde (${n.noteIdx})`);
              if (strings.has(n.string)) problems.push(`${tag}: corda repetida`);
              strings.add(n.string);
              if (n.fret < 0 || n.fret > r.frets) problems.push(`${tag}: traste fora do braço`);
            }
            const sorted = v.notes.every((n, i) => i === 0 || v.notes[i - 1].absPitch <= n.absPitch);
            if (!sorted) problems.push(`${tag}: ordem do arpejo errada`);
            for (const pc of CHORD_TYPES[type].slice(0, 3).map((i) => (root + i) % 12)) {
              if (!v.notes.some((n) => n.noteIdx === pc)) problems.push(`${tag}: falta a nota obrigatória ${pc}`);
            }
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
  });

  it('no baixo, a fundamental fica na corda mais grave tocada', () => {
    const r = resolveInstrument('baixo', 4);
    for (let root = 0; root < 12; root++) {
      const v = findVoicing(r.strings, r.frets, root, 'maj');
      expect(v).not.toBeNull();
      expect(v!.notes[0].noteIdx).toBe(root);
    }
  });

  it('a forma de maior no violão cabe em até 4 casas', () => {
    const r = resolveInstrument('guitarra', 6);
    const v = findVoicing(r.strings, r.frets, 4, 'maj');
    expect(v).not.toBeNull();
    expect(v!.end - v!.start).toBeLessThanOrEqual(4);
  });
});

describe('acordes: diatônicos', () => {
  it('escala maior de C: C, Dm, Em, F, G, Am e Bº', () => {
    const maior = [0, 2, 4, 5, 7, 9, 11];
    const acordes = diatonicChords(0, maior).map((a) => chordName(a.root, a.type));
    expect(acordes).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bº']);
  });

  it('escalas que não têm sete notas não geram tríades diatônicas', () => {
    expect(diatonicChords(0, [0, 2, 4, 7, 9])).toEqual([]);
  });
});

describe('acordes: formas CAGED no violão e na guitarra', () => {
  it('toda forma CAGED, em todas as tonalidades, toca só as notas do acorde e inclui a fundamental, a terça e a quinta', () => {
    const problems: string[] = [];
    for (const count of [6, 7]) {
      const r = resolveInstrument('violao', count);
      for (let root = 0; root < 12; root++) {
        for (const type of ['maj', 'min', '7'] as const) {
          const v = findVoicing(r.strings, r.frets, root, type);
          const tag = `violao/${count}c ${chordName(root, type)}`;
          if (!v || !v.shape) {
            problems.push(`${tag}: sem forma CAGED`);
            continue;
          }
          const pcs = new Set(CHORD_TYPES[type].map((i) => (root + i) % 12));
          for (const n of v.notes) if (!pcs.has(n.noteIdx)) problems.push(`${tag} forma ${v.shape}: nota fora do acorde`);
          for (const pc of CHORD_TYPES[type].slice(0, 3).map((i) => (root + i) % 12)) {
            if (!v.notes.some((n) => n.noteIdx === pc)) problems.push(`${tag} forma ${v.shape}: falta ${pc}`);
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
  });

  it('o violão usa forma CAGED, com o nome da forma', () => {
    const r = resolveInstrument('guitarra', 6);
    const v = findVoicing(r.strings, r.frets, 4, 'maj');
    expect(v?.shape).toMatch(/^[CAGED]$/);
  });

  it('a forma escolhida é a de traste mais baixo entre as que servem', () => {
    const r = resolveInstrument('guitarra', 6);
    // Lá maior: a forma A começa no traste 0 (corda A solta), que é o mais baixo possível.
    const v = findVoicing(r.strings, r.frets, 9, 'maj');
    expect(v?.start).toBe(0);
    expect(v?.shape).toBe('A');
  });

  it('o baixo continua com o gerador por busca (sem forma CAGED)', () => {
    const r = resolveInstrument('baixo', 4);
    const v = findVoicing(r.strings, r.frets, 4, 'maj');
    expect(v?.shape).toBeUndefined();
  });
});
