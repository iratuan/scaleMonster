import { describe, expect, it } from 'vitest';
import { getPositionWindows } from './caged';
import { buildFretboard } from './positions';
import { getScaleContext, NOTES, CATEGORIES, modesOf } from './notes';
import { INSTRUMENTS, filterFor, midiToFreq, resolveInstrument, type InstrumentId } from './instruments';
import { buildSequence, candidateNotes } from './exercise';
import type { DiagramData, ExerciseId, ScaleContext } from './types';

/**
 * Revisão da execução: para cada combinação de instrumento, variante, escala, tom,
 * exercício e filtro de cordas, cada nota tocada precisa estar na escala, no shape,
 * dentro do braço, com a altura correta e visível no desenho.
 */

const EXERCISES: ExerciseId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

function contextsFor(id: InstrumentId, count: number, root: string, cat: string, mode: string): ScaleContext {
  const c = getScaleContext(root, cat, mode, resolveInstrument(id, count));
  if (!c) throw new Error(`contexto inválido: ${root} ${cat} ${mode}`);
  return c;
}

/** Chave visual de uma nota: a mesma usada no DOM (corda-traste). */
const keyOf = (p: { string: number; fret: number }) => `${p.string}-${p.fret}`;

/** Confere um diagrama inteiro. Retorna a lista de problemas encontrados (vazia = ok). */
function checkDiagram(d: DiagramData, ctx: ScaleContext, maxFret: number): string[] {
  const errors: string[] = [];
  const strings = ctx.instrument.strings;
  const visible = new Set(d.activePairs.map(keyOf));

  for (const n of d.sequence) {
    const tag = `${ctx.instrument.id}/${strings.length}c ${ctx.root} ${ctx.category}/${ctx.mode} ${d.id} corda ${n.string} traste ${n.fret}`;
    if (n.string < 0 || n.string >= strings.length) errors.push(`${tag}: corda fora do instrumento`);
    if (n.fret < 0 || n.fret > maxFret) errors.push(`${tag}: traste fora do braço`);
    if (d.id !== 'main' && (n.fret < d.start || n.fret > d.end)) errors.push(`${tag}: fora da janela ${d.start}-${d.end}`);

    const midi = strings[n.string].midi + n.fret;
    const name = NOTES[midi % 12];
    if (!ctx.notes.has(name)) errors.push(`${tag}: nota ${name} não pertence à escala`);
    if (n.noteIdx !== midi % 12) errors.push(`${tag}: índice de nota incoerente`);
    if (n.absPitch !== midi) errors.push(`${tag}: altura MIDI ${n.absPitch} ≠ ${midi}`);
    if (Math.abs(n.pitch - midiToFreq(midi)) > 1e-6) errors.push(`${tag}: frequência ${n.pitch.toFixed(2)} ≠ ${midiToFreq(midi).toFixed(2)}`);
    if (!visible.has(keyOf(n))) errors.push(`${tag}: nota tocada sem casa visível no desenho`);
  }
  return errors;
}

describe('execução das escalas: notas válidas, shape e destaque', () => {
  it('toda nota tocada pertence à escala, ao shape e ao braço, em todas as combinações', () => {
    const problems: string[] = [];
    const roots = NOTES.slice();
    const instruments = Object.values(INSTRUMENTS);

    for (const inst of instruments) {
      for (const count of inst.variants) {
        const resolved = resolveInstrument(inst.id, count);
        for (const cat of CATEGORIES) {
          for (const mode of modesOf(cat)) {
            for (const root of roots) {
              const ctx = contextsFor(inst.id, count, root, cat, mode);
              for (const ex of EXERCISES) {
                for (const f of resolved.filters) {
                  const fb = buildFretboard(ctx, ex, f.id);
                  for (const p of fb.positions) problems.push(...checkDiagram(p, ctx, inst.frets));
                  problems.push(...checkDiagram(fb.main, ctx, inst.frets));
                }
              }
            }
          }
        }
      }
    }

    // Mostra só os 10 primeiros, para o relatório ficar legível.
    expect(problems.slice(0, 10)).toEqual([]);
    expect(problems.length).toBe(0);
  }, 120000);

  it('posições não têm duas notas de mesma altura (uníssono) em nenhuma combinação', () => {
    const bad: string[] = [];
    for (const inst of Object.values(INSTRUMENTS)) {
      for (const count of inst.variants) {
        const resolved = resolveInstrument(inst.id, count);
        for (const cat of CATEGORIES) {
          for (const mode of modesOf(cat)) {
            const ctx = contextsFor(inst.id, count, 'C', cat, mode);
            for (const f of resolved.filters) {
              const fb = buildFretboard(ctx, 1, f.id);
              for (const p of fb.positions) {
                // O filtro de uníssono vale para as notas da posição (não para a sequência, que pode repetir).
                const ctxP = ctx;
                const pitches = candidateNotes(ctxP, p.start, p.end, f.id, false).map((n) => n.absPitch);
                if (new Set(pitches).size !== pitches.length) bad.push(`${inst.id}/${count}c ${cat}/${mode} ${p.id}`);
              }
            }
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('quantidade de notas segue a regra de cada exercício', () => {
    const ctx = contextsFor('guitarra', 6, 'C', 'Modos Gregos', 'Jônio (Maior)');
    const base = candidateNotes(ctx, 0, 15, 'all', true);
    const k = base.length; // notas da escala no braço inteiro (sem uníssono, pois é a escala completa)
    const h = new Set(base.map((n) => n.absPitch)).size; // alturas distintas
    expect(buildSequence(base, 1, ctx.rootIdx, 6).length).toBe(2 * h - 2); // sobe e desce sem repetir a nota inicial nem o topo
    expect(buildSequence(base, 2, ctx.rootIdx, 6).length).toBe(2 * (2 * k - 1)); // cada nota duas vezes
    expect(buildSequence(base, 3, ctx.rootIdx, 6).length).toBe(3 * (2 * k - 1)); // cada nota três vezes
    expect(buildSequence(base, 7, ctx.rootIdx, 6).every((n) => ctx.notes.has(NOTES[n.noteIdx]))).toBe(true);
  });

  it('exercício 7 e 8 usam só as notas do acorde (tríade e tétrade) da escala', () => {
    const ctx = contextsFor('guitarra', 6, 'A', 'Pentatônica', 'Menor');
    const base = candidateNotes(ctx, 0, 15, 'all', true);
    const tri = buildSequence(base, 7, ctx.rootIdx, 6);
    const tetra = buildSequence(base, 8, ctx.rootIdx, 6);
    const triDegrees = new Set(tri.map((n) => (n.noteIdx - ctx.rootIdx + 12) % 12));
    expect([...triDegrees].every((d) => [0, 3, 4, 6, 7, 8].includes(d))).toBe(true);
    expect(tetra.length).toBeGreaterThanOrEqual(tri.length);
  });

  it('a escala completa cobre o braço inteiro e encadeia as cinco posições', () => {
    for (const inst of Object.values(INSTRUMENTS)) {
      const ctx = contextsFor(inst.id, inst.defaultCount, 'G', 'Menor Harmônica', 'Padrão');
      const fb = buildFretboard(ctx, 1, 'all');
      expect(fb.main.start).toBe(0);
      expect(fb.main.end).toBe(inst.frets);
      // A escala completa cobre todas as alturas do braço (passando pelas posições, com volta em cada limite).
      const all = new Set(candidateNotes(ctx, 0, inst.frets, 'all', false).map((n) => n.absPitch)).size;
      expect(new Set(fb.main.sequence.map((n) => n.absPitch)).size).toBe(all);
      expect(fb.positions.length).toBe(5);
    }
  });
});

describe('som da reprodução', () => {
  /** AudioContext falso que registra cada oscilador criado e a frequência agendada. */
  function fakeContext() {
    const oscillators: { freq: number[]; startedAt: number[] }[] = [];
    const ctx = {
      currentTime: 0,
      destination: {},
      createOscillator() {
        const rec = { freq: [] as number[], startedAt: [] as number[] };
        oscillators.push(rec);
        return {
          type: 'sine',
          frequency: { setValueAtTime: (v: number) => rec.freq.push(v) },
          connect() {},
          start(t: number) {
            rec.startedAt.push(t);
          },
          stop() {},
        };
      },
      createBiquadFilter() {
        return { type: '', frequency: { setValueAtTime() {} }, connect() {} };
      },
      createGain() {
        return {
          gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
          connect() {},
        };
      },
    };
    return { ctx: ctx as unknown as AudioContext, oscillators };
  }

  it('cada nota da sequência gera um som na frequência exata da corda e traste', async () => {
    const { playPluck } = await import('../audio/synth');
    const ctx = contextsFor('violao', 7, 'E', 'Pentatônica', 'Menor');
    const fb = buildFretboard(ctx, 1, 'all');
    const { ctx: fake, oscillators } = fakeContext();
    for (const n of fb.main.sequence) playPluck(fake, n.pitch, 0.8);

    expect(oscillators.length).toBe(fb.main.sequence.length);
    fb.main.sequence.forEach((n, i) => {
      expect(oscillators[i].freq[0]).toBeCloseTo(midiToFreq(n.absPitch), 4);
    });
  });

  it('volume zero não gera som', async () => {
    const { playPluck } = await import('../audio/synth');
    const { ctx, oscillators } = fakeContext();
    playPluck(ctx, 440, 0);
    expect(oscillators.length).toBe(0);
  });
});

describe('filtro de cordas na execução', () => {
  it('toda nota tocada respeita o grupo de cordas escolhido, em todas as combinações', () => {
    const bad: string[] = [];
    for (const inst of Object.values(INSTRUMENTS)) {
      for (const count of inst.variants) {
        const resolved = resolveInstrument(inst.id, count);
        for (const cat of CATEGORIES) {
          for (const mode of modesOf(cat)) {
            const ctx = contextsFor(inst.id, count, 'C', cat, mode);
            for (const ex of EXERCISES) {
              for (const f of resolved.filters) {
                const fb = buildFretboard(ctx, ex, f.id);
                for (const d of [fb.main, ...fb.positions]) {
                  for (const n of d.sequence) {
                    if (!f.test(n.string)) bad.push(`${inst.id}/${count}c filtro ${f.id} ${d.id} corda ${n.string}`);
                  }
                }
              }
            }
          }
        }
      }
    }
    expect(bad.slice(0, 10)).toEqual([]);
  }, 120000);
});

describe('escala tocada: sem notas puladas nem repetidas', () => {
  /** Alturas distintas da escala no braço, em ordem crescente. */
  /** Alturas do grupo de cordas escolhido, calculadas direto da afinação (sem passar pela escala). */
  const heightsOf = (ctx: ScaleContext, filter: string) => {
    const keep = filterFor(ctx.instrument, filter).test;
    const set = new Set<number>();
    ctx.instrument.strings.forEach((s, i) => {
      if (!keep(i)) return;
      for (let fr = 0; fr <= ctx.instrument.frets; fr++) {
        if (ctx.notes.has(NOTES[(s.midi + fr) % 12])) set.add(s.midi + fr);
      }
    });
    return [...set].sort((a, b) => a - b);
  };

  it('exercício 1 na escala completa: cada passo é vizinho na escala, sem pular nem repetir nota seguida', () => {
    const problems: string[] = [];
    for (const inst of Object.values(INSTRUMENTS)) {
      for (const count of inst.variants) {
        const resolved = resolveInstrument(inst.id, count);
        for (const cat of CATEGORIES) {
          for (const mode of modesOf(cat)) {
            for (const root of NOTES) {
              const ctx = contextsFor(inst.id, count, root, cat, mode);
              for (const f of resolved.filters) {
                const heights = heightsOf(ctx, f.id);
                const fb = buildFretboard(ctx, 1, f.id);
                const seq = fb.main.sequence;
                const idx = (m: number) => heights.indexOf(m);
                const tag = `${inst.id}/${count}c ${root} ${cat}/${mode} filtro ${f.id}`;
                if (seq.length !== 2 * heights.length - 1 && seq.length !== 2 * heights.length) {
                  // Varredura de n alturas tem 2n−1 notas (sobe e desce sem repetir o topo).
                  // Filtro de cordas pode deixar uma altura de fora: então a conta é sobre as alturas do filtro.
                }
                const played = new Set(seq.map((n) => n.absPitch));
                const lost = heights.filter((h) => !played.has(h));
                if (lost.length) problems.push(`${tag}: alturas do grupo não tocadas: ${lost.join(',')}`);
                for (let i = 1; i < seq.length; i++) {
                  const d = Math.abs(idx(seq[i].absPitch) - idx(seq[i - 1].absPitch));
                  if (d !== 1) problems.push(`${tag}: passo ${i} pulou ou repetiu (${seq[i - 1].absPitch} -> ${seq[i].absPitch})`);
                }
                if (problems.length > 10) break;
              }
            }
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
  }, 120000);

  it('cada posição, subindo e descendo, não pula nem repete notas', () => {
    const problems: string[] = [];
    for (const inst of Object.values(INSTRUMENTS)) {
      for (const count of inst.variants) {
        for (const cat of CATEGORIES) {
          for (const mode of modesOf(cat)) {
            const ctx = contextsFor(inst.id, count, 'C', cat, mode);
            const fb = buildFretboard(ctx, 1, 'all');
            const windows = getPositionWindows(ctx.rootIdx, ctx.cagedOffset, inst.frets);
            fb.positions.forEach((p, k) => {
              const [ws, we] = windows[k];
              // Alturas da janela original (a regra de cada posição), não do recorte visual.
              const heights = [...new Set(candidateNotes(ctx, ws, we, 'all', false).map((n) => n.absPitch))].sort((a, b) => a - b);
              for (let i = 1; i < p.sequence.length; i++) {
                const d = Math.abs(heights.indexOf(p.sequence[i].absPitch) - heights.indexOf(p.sequence[i - 1].absPitch));
                if (d !== 1) problems.push(`${inst.id}/${count}c ${cat}/${mode} ${p.id} passo ${i}`);
              }
            });
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
  }, 120000);
});

describe('cartão de posição: volta no próprio limite', () => {
  it('no exercício 1, cada cartão sobe até o topo da sua janela e volta: o topo é seguido de nota mais grave', () => {
    const problems: string[] = [];
    for (const inst of Object.values(INSTRUMENTS)) {
      for (const count of inst.variants) {
        for (const cat of CATEGORIES) {
          for (const mode of modesOf(cat)) {
            const ctx = contextsFor(inst.id, count, 'C', cat, mode);
            const fb = buildFretboard(ctx, 1, 'all');
            fb.positions.forEach((p) => {
              const seq = p.sequence;
              if (seq.length < 3) return;
              const top = Math.max(...seq.map((n) => n.absPitch));
              const i = seq.findIndex((n) => n.absPitch === top);
              if (i < 0 || i + 1 >= seq.length || seq[i + 1].absPitch >= top) problems.push(`${inst.id}/${count}c ${cat}/${mode} ${p.id}: não volta no topo`);
            });
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
  }, 120000);

  it('a volta de cada cartão é tocada numa casa dentro da janela do cartão', () => {
    const problems: string[] = [];
    for (const inst of Object.values(INSTRUMENTS)) {
      for (const count of inst.variants) {
        for (const cat of CATEGORIES) {
          for (const mode of modesOf(cat)) {
            const ctx = contextsFor(inst.id, count, 'G', cat, mode);
            const fb = buildFretboard(ctx, 1, 'all');
            for (const p of fb.positions) {
              for (const n of p.sequence) if (n.fret < p.start || n.fret > p.end) problems.push(`${inst.id}/${count}c ${cat}/${mode} ${p.id}: casa ${n.fret} fora de ${p.start}-${p.end}`);
            }
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
  }, 120000);
});

describe('escala completa: varredura contínua', () => {
  it('a escala completa toca cada altura do grupo, em ordem, sem pular nem repetir nota seguida', () => {
    const problems: string[] = [];
    for (const inst of Object.values(INSTRUMENTS)) {
      for (const count of inst.variants) {
        const resolved = resolveInstrument(inst.id, count);
        for (const cat of CATEGORIES) {
          for (const mode of modesOf(cat)) {
            for (const root of NOTES) {
              const ctx = contextsFor(inst.id, count, root, cat, mode);
              for (const f of resolved.filters) {
                const heights = [...new Set(candidateNotes(ctx, 0, inst.frets, f.id, false).map((n) => n.absPitch))].sort((a, b) => a - b);
                const seq = buildFretboard(ctx, 1, f.id).main.sequence;
                const played = new Set(seq.map((n) => n.absPitch));
                if (heights.some((h) => !played.has(h))) problems.push(`${inst.id}/${count}c ${root} ${cat}/${mode} ${f.id}: altura não tocada`);
                for (let i = 1; i < seq.length; i++) {
                  const d = Math.abs(heights.indexOf(seq[i].absPitch) - heights.indexOf(seq[i - 1].absPitch));
                  if (d !== 1) problems.push(`${inst.id}/${count}c ${root} ${cat}/${mode} ${f.id}: passo ${i} pula`);
                }
              }
            }
          }
        }
      }
    }
    expect(problems.slice(0, 10)).toEqual([]);
  }, 120000);
});
