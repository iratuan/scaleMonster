import { describe, expect, it } from 'vitest';
import { getPositionWindows, fretWidths } from './caged';
import { buildSequence, candidateNotes, generateDiagram } from './exercise';
import { fingerFor } from './fingering';
import { buildFretboard } from './positions';
import { getScaleContext } from './notes';
import { getBackingTrack, harmonicField } from './backingTrack';
import { isMatch, hitWindowMs, NoteJudge } from './judge';
import { clampBpm, nextLoopState } from './autoBpm';
import { analyze, emptyStats, recordSession } from './stats';
import { displayFinger } from './hints';

const ctx = (root: string, cat: string, mode: string) => {
  const c = getScaleContext(root, cat, mode);
  if (!c) throw new Error(`contexto inválido ${root} ${cat} ${mode}`);
  return c;
};

describe('escala e notas', () => {
  it('monta o conjunto de notas da pentatônica maior em C', () => {
    const c = ctx('C', 'Pentatônica', 'Maior');
    expect([...c.notes].sort()).toEqual(['A', 'C', 'D', 'E', 'G']);
  });

  it('retorna null para escala ou modo inexistente', () => {
    expect(getScaleContext('C', 'Inexistente', 'Maior')).toBeNull();
    expect(getScaleContext('H', 'Pentatônica', 'Maior')).toBeNull();
  });
});

describe('janelas CAGED', () => {
  it('gera 5 janelas de até 5 trastes, sem início repetido', () => {
    const wins = getPositionWindows(0, 0);
    expect(wins).toHaveLength(5);
    const starts = wins.map((w) => w[0]);
    expect(new Set(starts).size).toBe(5);
    expect(starts).toEqual([...starts].sort((a, b) => a - b));
  });

  it('mantém a janela dentro do braço (início entre 0 e 11)', () => {
    for (let root = 0; root < 12; root++) {
      for (const [, off] of [['a', -4], ['b', 0], ['c', 3]] as const) {
        for (const [s] of getPositionWindows(root, off)) {
          expect(s).toBeGreaterThanOrEqual(0);
          expect(s).toBeLessThan(12);
        }
      }
    }
  });

  it('larguras de trastes são proporcionais e positivas', () => {
    const w = fretWidths(0, 4);
    expect(w).toHaveLength(5);
    expect(w.every((x) => x > 0)).toBe(true);
  });
});

describe('sequências de exercício', () => {
  const c = ctx('A', 'Pentatônica', 'Menor');
  const base = candidateNotes(c, 5, 8, 'all', false);

  it('exercício 1 sobe e desce sem repetir o topo', () => {
    const seq = buildSequence(base, 1, c.rootIdx);
    expect(seq.length).toBe(base.length * 2 - 2); // sem repetir a nota inicial na virada
    expect(seq[0]).toEqual(base[0]);
    expect(seq[base.length - 1]).toEqual(base[base.length - 1]);
  });

  it('exercício 2 toca cada nota duas vezes', () => {
    const seq = buildSequence(base, 2, c.rootIdx);
    expect(seq.length).toBe((base.length * 2 - 1) * 2);
    expect(seq[0]).toEqual(seq[1]);
  });

  it('nas posições CAGED não há duas notas na mesma altura absoluta', () => {
    const notes = candidateNotes(c, 0, 12, 'all', false);
    const pitches = notes.map((n) => n.absPitch);
    expect(new Set(pitches).size).toBe(pitches.length);
  });

  it('a escala completa mantém uníssonos (não filtra)', () => {
    const full = candidateNotes(c, 0, 15, 'all', true);
    const pitches = full.map((n) => n.absPitch);
    expect(new Set(pitches).size).toBeLessThan(pitches.length);
  });

  it('filtro de cordas restringe as notas', () => {
    const notes = candidateNotes(c, 0, 15, '1-3', true);
    expect(notes.every((n) => n.string <= 2)).toBe(true);
  });

  it('todos os exercícios produzem uma sequência não vazia', () => {
    for (let ex = 1; ex <= 9; ex++) {
      const d = generateDiagram('pos-0', c, 0, 4, ex as 1, 'all');
      expect(d.sequence.length).toBeGreaterThan(0);
    }
  });
});

describe('modelo do braço', () => {
  it('cada posição fica dentro de 2 trastes ou mais e a escala completa cobre 0-15', () => {
    const c = ctx('E', 'Modos Gregos', 'Dórico');
    const fb = buildFretboard(c, 1, 'all');
    expect(fb.positions).toHaveLength(5);
    for (const p of fb.positions) expect(p.end - p.start).toBeGreaterThanOrEqual(2);
    expect(fb.main.start).toBe(0);
    expect(fb.main.end).toBe(15);
    // Escala completa cobre todas as alturas do braço.
    const n = candidateNotes(c, 0, 15, 'all', false).length;
    expect(new Set(fb.main.sequence.map((x) => x.absPitch)).size).toBe(n);
  });
});

describe('digitação', () => {
  it('corda solta sugere 0', () => {
    expect(fingerFor(0, 0, [{ string: 0, fret: 0 }])).toBe('0');
  });

  it('nota solitária na corda usa dedo relativo à casa mais baixa', () => {
    const active = [
      { string: 0, fret: 5 },
      { string: 1, fret: 7 },
    ];
    expect(fingerFor(5, 0, active)).toBe('1');
    expect(fingerFor(7, 1, active)).toBe('3');
  });

  it('três notas na corda: primeira = 1, última = 4', () => {
    const active = [2, 3, 5].map((f) => ({ string: 2, fret: f }));
    expect(fingerFor(2, 2, active)).toBe('1');
    expect(fingerFor(5, 2, active)).toBe('4');
    expect(fingerFor(3, 2, active)).toBe('2');
  });

  it('nunca repete o mesmo dedo para duas notas seguidas na corda (gap 1 e 2)', () => {
    const active = [2, 4, 5].map((f) => ({ string: 0, fret: f }));
    expect(fingerFor(4, 0, active)).toBe('3');
  });
});

describe('backing track e campo harmônico', () => {
  it('pop/rock jônico: I - vi - IV - V em C', () => {
    const bt = getBackingTrack(0, 'Modos Gregos', 'Jônio (Maior)');
    expect(bt.chords).toEqual(['C', 'Am', 'F', 'G']);
  });

  it('campo harmônico diatônico tem 7 graus', () => {
    const rows = harmonicField(0, 'Modos Gregos', 'Jônio (Maior)');
    expect(rows).toHaveLength(7);
    expect(rows?.[0]).toMatchObject({ roman: 'I', root: 'C', quality: '' });
    expect(rows?.[1]).toMatchObject({ roman: 'ii', root: 'D', quality: 'm' });
  });

  it('escala não diatônica não tem campo harmônico', () => {
    expect(harmonicField(0, 'Pentatônica', 'Maior')).toBeNull();
  });
});

describe('julgamento do microfone', () => {
  it('aceita frequência dentro de 60 cents e rejeita fora', () => {
    expect(isMatch(440, 440)).toBe(true);
    expect(isMatch(440 * Math.pow(2, 50 / 1200), 440)).toBe(true);
    expect(isMatch(440 * Math.pow(2, 80 / 1200), 440)).toBe(false);
    expect(isMatch(-1, 440)).toBe(false);
  });

  it('janela de tolerância: 450 ms em BPM baixo, 90% da nota em BPM alto', () => {
    expect(hitWindowMs(60)).toBe(450);
    expect(hitWindowMs(200)).toBeCloseTo(270, 0);
  });

  it('NoteJudge: acerto exige ataque novo e altura estável', () => {
    const j = new NoteJudge<string>();
    j.expect('n1', 440, 1000);
    // Ataque (energia sobe) e altura certa em dois frames seguidos.
    expect(j.feed(440, 100, 0.2, 0.01)).toBeNull();
    expect(j.feed(440, 120, 0.2, 0.01)).toEqual({ verdict: 'hit', id: 'n1' });
  });

  it('NoteJudge: eco da nota anterior (energia só cai) não conta como acerto', () => {
    const j = new NoteJudge<string>();
    j.feed(0, 50, 0.3, 0.01); // referência: o juiz já estava rodando, com energia do eco
    j.expect('n1', 440, 1000);
    // Sem ataque: energia caindo, altura igual ao esperado (o eco).
    expect(j.feed(440, 100, 0.3, 0.01)).toBeNull();
    expect(j.feed(440, 120, 0.2, 0.01)).toBeNull();
    expect(j.feed(440, 140, 0.1, 0.01)).toBeNull();
    // A janela expira sem ataque: erro.
    expect(j.feed(440, 1100, 0.05, 0.01)).toEqual({ verdict: 'miss', id: 'n1' });
  });

  it('NoteJudge: nota repetida só conta quando é tocada de novo (novo ataque)', () => {
    const j = new NoteJudge<string>();
    j.feed(0, 50, 0.2, 0.01); // referência
    j.expect('n2', 440, 2000);
    // Eco decaindo da cópia anterior, sem ataque.
    j.feed(440, 100, 0.2, 0.01);
    j.feed(440, 120, 0.15, 0.01);
    j.feed(440, 140, 0.1, 0.01);
    // Ataque da nova cópia.
    j.feed(440, 500, 0.5, 0.01);
    expect(j.feed(440, 520, 0.5, 0.01)).toEqual({ verdict: 'hit', id: 'n2' });
  });

  it('NoteJudge: altura errada não acerta mesmo com ataque', () => {
    const j = new NoteJudge<string>();
    j.expect('n3', 440, 1000);
    j.feed(550, 100, 0.3, 0.01);
    j.feed(550, 120, 0.5, 0.01);
    expect(j.feed(550, 140, 0.5, 0.01)).toBeNull();
  });
});

describe('BPM automático', () => {
  it('sobe 10 BPM a cada ciclo configurado', () => {
    let s = { loopCount: 0, bpm: 100 };
    s = nextLoopState(s.loopCount, s.bpm, { enabled: true, cycles: 2 });
    expect(s).toEqual({ loopCount: 1, bpm: 100 });
    s = nextLoopState(s.loopCount, s.bpm, { enabled: true, cycles: 2 });
    expect(s).toEqual({ loopCount: 0, bpm: 110 });
  });

  it('não sobe quando desligado e não passa de 300', () => {
    expect(nextLoopState(0, 150, { enabled: false, cycles: 1 }).bpm).toBe(150);
    expect(nextLoopState(0, 295, { enabled: true, cycles: 1 }).bpm).toBe(295);
  });

  it('limita BPM entre 40 e 300', () => {
    expect(clampBpm(10)).toBe(40);
    expect(clampBpm(999)).toBe(300);
    expect(clampBpm(NaN)).toBe(120);
  });
});

describe('estatísticas', () => {
  it('registra sessões e aponta a escala mais praticada e os erros mais frequentes', () => {
    let d = emptyStats();
    d = recordSession(d, { scaleName: 'A', durationSec: 120, hits: 10, misses: 1, missedNotes: [] });
    d = recordSession(d, { scaleName: 'B', durationSec: 60, hits: 2, misses: 8, missedNotes: ['3-5', '3-5', '1-2'] });
    const a = analyze(d);
    expect(a?.mostPlayed).toBe('A');
    expect(a?.recommendation).toBe('B');
    expect(a?.weakNotes[0]).toBe('3-5');
    expect(a?.totalTimeSec).toBe(180);
  });

  it('é imutável: não altera o estado anterior', () => {
    const d = emptyStats();
    recordSession(d, { scaleName: 'X', durationSec: 1, hits: 1, misses: 0, missedNotes: [] });
    expect(d.history).toHaveLength(0);
  });

  it('limita o histórico a 50 sessões', () => {
    let d = emptyStats();
    for (let i = 0; i < 60; i++) d = recordSession(d, { scaleName: 'S', durationSec: 1, hits: 1, misses: 0, missedNotes: [] });
    expect(d.history).toHaveLength(50);
  });
});

describe('dicas da escala completa', () => {
  it('troca o dedo conforme a janela atual e cai na primeira posição quando necessário', () => {
    const map = new Map<number, string>([
      [0, '1'],
      [2, '3'],
    ]);
    expect(displayFinger(map, 2)).toBe('3');
    expect(displayFinger(map, 1)).toBe('1');
    expect(displayFinger(undefined, 0)).toBe('');
  });

});

describe('instrumentos', () => {
  it('altura MIDI: A4 = 440 Hz', async () => {
    const { midiToFreq } = await import('./instruments');
    expect(midiToFreq(69)).toBeCloseTo(440, 6);
  });

  it('baixo tem 4 cordas, uma oitava abaixo da guitarra', async () => {
    const { INSTRUMENTS } = await import('./instruments');
    const bass = INSTRUMENTS.baixo.strings;
    expect(bass.length).toBe(4);
    expect(bass[3].midi).toBe(28); // E1
  });

  it('ukulele é reentrante: a corda G (4ª) é mais aguda que a C (3ª)', async () => {
    const { INSTRUMENTS } = await import('./instruments');
    const uke = INSTRUMENTS.ukulele.strings;
    expect(uke.map((s) => s.name).join('')).toBe('AECG');
    expect(uke[3].midi).toBeGreaterThan(uke[2].midi);
  });

  it('cavaco é afinado em D G B D (tudo mais agudo que o violão)', async () => {
    const { INSTRUMENTS } = await import('./instruments');
    const cav = INSTRUMENTS.cavaco.strings;
    expect(cav.map((s) => s.name).join('')).toBe('DBGD');
    expect(cav[0].midi).toBeGreaterThan(INSTRUMENTS.guitarra.strings[0].midi);
  });

  it('a escala funciona em qualquer instrumento e respeita o número de trastes', async () => {
    const { INSTRUMENTS } = await import('./instruments');
    for (const id of Object.keys(INSTRUMENTS) as (keyof typeof INSTRUMENTS)[]) {
      const c = getScaleContext('C', 'Pentatônica', 'Maior', id);
      if (!c) throw new Error('contexto nulo');
      const fb = buildFretboard(c, 1, 'all');
      expect(fb.main.end).toBe(INSTRUMENTS[id].frets);
      for (const p of fb.positions) expect(p.end).toBeLessThanOrEqual(INSTRUMENTS[id].frets);
      expect(fb.main.sequence.length).toBeGreaterThan(0);
    }
  });

  it('exercício 9 em 4 cordas: pares de cordas, sem índices fora do instrumento', async () => {
    const { INSTRUMENTS } = await import('./instruments');
    const c = getScaleContext('A', 'Escala Blues', 'Menor', 'ukulele');
    if (!c) throw new Error('contexto nulo');
    const base = candidateNotes(c, 0, INSTRUMENTS.ukulele.frets, 'all', true);
    const seq = buildSequence(base, 9, c.rootIdx, 4);
    expect(seq.every((n) => n.string >= 0 && n.string < 4)).toBe(true);
  });

  it('filtro de cordas inválido para o instrumento cai para "all"', async () => {
    const { validStrings } = await import('../state/store');
    expect(validStrings('baixo', '1-3')).toBe('1-3');
    expect(validStrings('baixo', '4-6')).toBe('all');
  });
});

describe('exercícios e metrônomo', () => {
  it('separa o número do nome do exercício, sem repetir o número', async () => {
    const { exerciseParts } = await import('./i18n');
    expect(exerciseParts('3. Grupos de 3 (1-2-3, 2-3-4...)')).toEqual({ num: '3', name: 'Grupos de 3' });
    expect(exerciseParts('1. Subir e descer a escala toda')).toEqual({ num: '1', name: 'Subir e descer' });
  });

  it('metrônomo vem desligado por padrão', async () => {
    const { useSettings } = await import('../state/store');
    expect(useSettings.getState().metronome).toBe(false);
  });
});

describe('variantes de cordas', () => {
  it('baixo tem 4, 5 ou 6 cordas; a de 6 começa no C3', async () => {
    const { resolveInstrument } = await import('./instruments');
    expect(resolveInstrument('baixo', 4).strings.length).toBe(4);
    expect(resolveInstrument('baixo', 5).strings.length).toBe(5);
    const six = resolveInstrument('baixo', 6).strings;
    expect(six.length).toBe(6);
    expect(six[0].name).toBe('C');
    expect(six[5].midi).toBe(23); // B0
  });

  it('violão de 7 cordas acrescenta um B1 grave', async () => {
    const { resolveInstrument } = await import('./instruments');
    const seven = resolveInstrument('violao', 7).strings;
    expect(seven.length).toBe(7);
    expect(seven[6]).toEqual({ name: 'B', midi: 35 });
    expect(seven[5].midi).toBe(40); // E2 continua
  });

  it('contagem não suportada cai para o padrão', async () => {
    const { resolveInstrument } = await import('./instruments');
    expect(resolveInstrument('violao', 5).strings.length).toBe(6);
    expect(resolveInstrument('baixo', 9).strings.length).toBe(4);
  });

  it('filtros de cordas acompanham o número de cordas', async () => {
    const { resolveInstrument } = await import('./instruments');
    const ids = resolveInstrument('violao', 7).filters.map((f) => f.id);
    expect(ids).toContain('4-7');
    expect(ids).toContain('5-7');
  });

  it('escala e exercícios funcionam com 7 cordas', async () => {
    const { resolveInstrument } = await import('./instruments');
    const c = getScaleContext('E', 'Pentatônica', 'Menor', 'violao');
    if (!c) throw new Error('contexto nulo');
    const seven = { ...c, instrument: resolveInstrument('violao', 7) };
    const fb = buildFretboard(seven, 9, 'all');
    expect(fb.main.activePairs.some((p) => p.string === 6)).toBe(true);
    expect(fb.main.sequence.every((n) => n.string < 7)).toBe(true);
  });
});

describe('afinador', () => {
  it('reconhece A4 e E2 da afinação padrão sem desvio', async () => {
    const { readNote } = await import('./tuner');
    expect(readNote(440)).toMatchObject({ name: 'A', octave: 4, cents: 0 });
    expect(readNote(82.41)).toMatchObject({ name: 'E', octave: 2, cents: 0 });
  });

  it('mede o desvio em centavos e respeita a referência A4', async () => {
    const { readNote, centsFromTarget } = await import('./tuner');
    expect(readNote(446.4, 440).cents).toBe(25); // 1200·log2(446,4/440) ≈ 25 cents
    expect(readNote(442, 442)).toMatchObject({ name: 'A', cents: 0 });
    expect(centsFromTarget(329.63, 64)).toBe(0); // E4
  });

  it('escolhe a corda mais próxima e identifica quando está afinada', async () => {
    const { nearestString, isInTune } = await import('./tuner');
    const guitar = [64, 59, 55, 50, 45, 40].map((midi) => ({ midi }));
    expect(nearestString(196, guitar)).toBe(2); // G3
    expect(isInTune(3)).toBe(true);
    expect(isInTune(12)).toBe(false);
  });

  it('mediana descarta leituras isoladas', async () => {
    const { median } = await import('./tuner');
    expect(median([0, 0, 440, 0, 0])).toBe(0);
    expect(median([440, 441, 900, 439, 440])).toBe(440);
  });
});

describe('metrônomo', () => {
  const m = async () => await import('./metronome');

  it('conta os ticks do compasso pela subdivisão (4/4 com tercinas = 12)', async () => {
    const { meterOf, ticksPerBar } = await m();
    expect(ticksPerBar(meterOf('4/4'), 3)).toBe(12);
    expect(ticksPerBar(meterOf('6/8'), 1)).toBe(6);
  });

  it('duração do tick: 120 BPM com semicolcheias = 125 ms', async () => {
    const { tickDuration } = await m();
    expect(tickDuration(120, 4)).toBeCloseTo(0.125, 6);
    expect(tickDuration(120, 1)).toBeCloseTo(0.5, 6);
  });

  it('marca acento no primeiro tempo e nível "sub" nas divisões', async () => {
    const { meterOf, tickInfo, METRO_DEFAULT } = await m();
    const cfg = { ...METRO_DEFAULT, sub: 2 as const, accent: true };
    expect(tickInfo(0, meterOf('4/4'), cfg).level).toBe('accent');
    expect(tickInfo(1, meterOf('4/4'), cfg).level).toBe('sub');
    expect(tickInfo(2, meterOf('4/4'), cfg).level).toBe('beat');
    expect(tickInfo(8, meterOf('4/4'), { ...cfg, accent: false }).level).toBe('beat');
  });

  it('compasso mudo cai a cada N compassos', async () => {
    const { isSilentBar } = await m();
    expect([0, 1, 2, 3, 4, 5, 6, 7].filter((b) => isSilentBar(b, 4))).toEqual([3, 7]);
    expect(isSilentBar(3, 0)).toBe(false);
  });

  it('rampa sobe em degraus e para na meta', async () => {
    const { bpmAtBar, METRO_DEFAULT } = await m();
    const cfg = { ...METRO_DEFAULT, bpm: 100, ramp: { on: true, step: 10, everyBars: 2, target: 120 } };
    expect(bpmAtBar(0, cfg)).toBe(100);
    expect(bpmAtBar(2, cfg)).toBe(110);
    expect(bpmAtBar(10, cfg)).toBe(120);
  });

  it('rampa de desaceleração também para na meta', async () => {
    const { bpmAtBar, METRO_DEFAULT } = await m();
    const cfg = { ...METRO_DEFAULT, bpm: 120, ramp: { on: true, step: -10, everyBars: 1, target: 100 } };
    expect(bpmAtBar(1, cfg)).toBe(110);
    expect(bpmAtBar(9, cfg)).toBe(100);
  });

  it('toque ritmado: 4 toques de meio segundo = 120 BPM', async () => {
    const { tapBpm } = await m();
    expect(tapBpm([500, 500, 500, 500])).toBe(120);
    expect(tapBpm([])).toBeNull();
    expect(tapBpm([5000])).toBeNull(); // pausa longa não conta
  });
});

describe('rolagem automática por exercício', () => {
  it('troca de posição só no fim de um padrão completo', async () => {
    const { exerciseUnit } = await import('./exercise');
    expect([1, 2, 3, 7, 8].map((e) => exerciseUnit(e as 1))).toEqual([1, 1, 1, 1, 1]);
    expect(exerciseUnit(4)).toBe(3);
    expect(exerciseUnit(5)).toBe(4);
    expect(exerciseUnit(6)).toBe(2);
    expect(exerciseUnit(9)).toBe(2);
    expect(exerciseUnit(10)).toBe(3);
    expect(exerciseUnit(11)).toBe(2);
    expect(exerciseUnit(12)).toBe(2);
    expect(exerciseUnit(13)).toBe(3);
    expect(exerciseUnit(14)).toBe(4);
    expect(exerciseUnit(15)).toBe(2);
  });
});
