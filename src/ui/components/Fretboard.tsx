import { fretWidths } from '../../core/caged';
import { noteOnString } from '../../core/notes';
import type { ScaleContext } from '../../core/types';

export interface FretboardProps {
  id: string;
  start: number;
  end: number;
  ctx: ScaleContext;
  /** Chaves 'corda-traste' que fazem parte do exercício. */
  activeKeys: Set<string>;
  fingerOf: (string: number, fret: number) => string;
  hints: boolean;
  inverted: boolean;
  /** Mostra as notas da escala que não fazem parte do exercício (em destaque menor). */
  showGhost?: boolean;
  playing: string | null;
  /** Nota-alvo: a próxima a ser tocada na reprodução. */
  next?: string | null;
  feedback: { key: string; kind: 'hit' | 'miss'; seq: number } | null;
  labels: { hit: string; miss: string };
  compact?: boolean;
}

/** Marcadores de casa, como num braço real. */
const INLAYS = new Set([3, 5, 7, 9, 12, 15]);

const key = (s: number, f: number) => `${s}-${f}`;

/**
 * Braço plano em grade CSS. Funciona para qualquer instrumento: o número de cordas
 * e a afinação vêm de `ctx.instrument`. Cordas e trastes são linhas, sem sombra.
 */
export function Fretboard(p: FretboardProps) {
  const strings = p.ctx.instrument.strings;
  const n = strings.length;
  const cols = fretWidths(p.start, p.end)
    .map((w) => `${w.toFixed(3)}fr`)
    .join(' ');
  const frets = Array.from({ length: p.end - p.start + 1 }, (_, i) => p.start + i);
  // Ordem visual: topo = corda mais aguda (ou a mais grave, se invertido).
  const rows = Array.from({ length: n }, (_, v) => (p.inverted ? n - 1 - v : v));
  const rowStyle = { gridTemplateRows: `repeat(${n}, var(--row, 44px))` };
  // Espessura em pixels inteiros. O baixo tem cordas bem mais grossas que as de guitarra e violão.
  const [minT, maxT] = p.ctx.instrument.id === 'baixo' ? [2.5, 6] : [1.5, 3];

  return (
    <div className={`fb${p.compact ? ' fb--compact' : ''}`} data-diagram={p.id} dir="ltr">
      <div className="fb__tuning" style={rowStyle} aria-hidden>
        {rows.map((s) => (
          <span key={s}>{strings[s].name}</span>
        ))}
      </div>

      <div className="fb__scroll">
        <div className="fb__board" style={{ ...rowStyle, gridTemplateColumns: cols }}>
          {rows.map((s, v) =>
            frets.map((f) => {
              const name = noteOnString(p.ctx.instrument, s, f);
              const inScale = p.ctx.notes.has(name);
              const k = key(s, f);
              const active = p.activeKeys.has(k);
              const fb = p.feedback && p.feedback.key === k ? p.feedback : null;
              const finger = p.hints && active ? p.fingerOf(s, f) : '';
              // Calibre em pixels inteiros (2 a 3 px): linhas fracionárias somem em telas de resolução normal.
              const thickness = Math.round(minT + (v / Math.max(n - 1, 1)) * (maxT - minT));
              const middle = v === Math.floor((n - 1) / 2) && INLAYS.has(f) && f > 0;

              const cell = [
                'fb__cell',
                f === 0 && p.start === 0 ? 'fb__cell--nut' : '',
                f === p.start && p.start !== 0 ? 'fb__cell--start' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <div
                  key={k}
                  className={cell}
                  data-string={s}
                  data-fret={f}
                  data-wound={s >= Math.floor(n / 2) ? '' : undefined}
                  style={{ ['--string-h' as string]: `${thickness.toFixed(2)}px` }}
                >
                  {middle && <span className="fb__inlay" />}
                  {(inScale || active) && (
                    <span
                      className={[
                        'note',
                        active ? 'note--on' : 'note--off',
                        !active && p.showGhost === false ? 'note--hidden' : '',
                        active && name === p.ctx.root ? 'note--root' : '',
                        p.playing === k ? 'note--play' : '',
                        p.next === k && p.playing !== k ? 'note--next' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-label={`${name}, ${f === 0 ? 'corda solta' : `traste ${f}`}`}
                    >
                      {name}
                      {finger !== '' && <span className="note__finger">{finger}</span>}
                    </span>
                  )}
                  {fb && (
                    <span key={fb.seq} className={`fb__feedback fb__feedback--${fb.kind}`}>
                      {fb.kind === 'hit' ? p.labels.hit : p.labels.miss}
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>

        <div className="fb__frets" style={{ gridTemplateColumns: cols }} aria-hidden>
          {frets.map((f) => (
            <span key={f} className={f === 5 || f === 12 ? 'fb__fret fb__fret--mark' : 'fb__fret'}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
