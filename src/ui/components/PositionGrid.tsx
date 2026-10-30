import { fingerFor } from '../../core/fingering';
import type { DiagramData, ScaleContext } from '../../core/types';
import { PlayIcon, StopIcon } from './Icons';
import { Fretboard } from './Fretboard';
import type { Feedback } from '../usePlayback';

interface PositionGridProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ctx: ScaleContext;
  positions: DiagramData[];
  activeId: string | null;
  playingKey: string | null;
  nextKey: string | null;
  feedback: Feedback | null;
  /** Ciclo atual da execução (1 = primeira passada). */
  cycle: number;
  hints: boolean;
  inverted: boolean;
  showGhost: boolean;
  onToggle: (p: DiagramData) => void;
}

const keysOf = (d: DiagramData) => new Set(d.activePairs.map((p) => `${p.string}-${p.fret}`));

/**
 * Posições lado a lado (duas colunas em telas largas, uma abaixo da outra no celular).
 * Cada posição é tocada sozinha: tocar uma interrompe a anterior.
 */
export function PositionGrid(p: PositionGridProps) {
  return (
    <section className="pos-grid" aria-label={p.t('lbl_positions')}>
      {p.positions.map((d, i) => {
        const playing = p.activeId === d.id;
        const fb = p.feedback && p.feedback.diagramId === d.id ? { key: p.feedback.key, kind: p.feedback.kind, seq: p.feedback.seq } : null;
        return (
          <article key={d.id} className={`pos-card${playing ? ' is-playing' : ''}`}>
            <header className="pos-card__head">
              <div>
                <h3 className="neck__title">
                  {p.t('position')} {i + 1}
                  <span className="neck__range">
                    {' '}
                    · {p.t('frets')} {d.start}–{d.end}
                  </span>
                </h3>
                <p className="neck__meta">
                  {p.t('notes_per_cycle', { n: d.sequence.length })}
                  {playing && ` · ${p.t('cycle_label')} ${p.cycle}`}
                </p>
              </div>
              <button
                type="button"
                className={`play${playing ? ' is-on' : ''}`}
                onClick={() => p.onToggle(d)}
                aria-label={playing ? p.t('btn_stop') : p.t('btn_play')}
              >
                {playing ? <StopIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
              </button>
            </header>
            <Fretboard
              id={d.id}
              start={d.start}
              end={d.end}
              ctx={p.ctx}
              activeKeys={keysOf(d)}
              fingerOf={(str, fret) => fingerFor(fret, str, d.activePairs)}
              hints={p.hints}
              inverted={p.inverted}
              showGhost={p.showGhost}
              playing={playing ? p.playingKey : null}
              next={playing ? p.nextKey : null}
              feedback={fb}
              labels={{ hit: p.t('hit_label'), miss: p.t('miss_label') }}
              compact
            />
          </article>
        );
      })}
    </section>
  );
}
