import { useRef } from 'react';
import { fingerFor } from '../../core/fingering';
import type { DiagramData, ScaleContext } from '../../core/types';
import { PlayIcon, StopIcon, ChevronIcon } from './Icons';
import { Fretboard } from './Fretboard';
import type { Feedback } from '../usePlayback';

interface NeckCarouselProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ctx: ScaleContext;
  positions: DiagramData[];
  /** Posição mostrada (0 a 4). */
  index: number;
  onIndex: (i: number) => void;
  /** Acompanhar a execução: o braço rola com a posição que está tocando, no fim de cada padrão. */
  follow: boolean;
  onFollow: (on: boolean) => void;
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
 * Um braço só, com as 5 posições uma ao lado da outra. Trocar de posição rola o braço
 * (pontos, setas ou arrastar), como se o braço estivesse sendo passado pelas mãos.
 */
export function NeckCarousel(p: NeckCarouselProps) {
  const n = p.positions.length;
  const start = useRef<number | null>(null);
  const go = (i: number) => p.onIndex(Math.max(0, Math.min(n - 1, i)));
  const current = p.positions[p.index];
  const playing = current !== undefined && p.activeId === current.id;

  return (
    <section className="neck" aria-label={p.t('lbl_positions')}>
      <header className="neck__head">
        <div>
          <p className="section__label">{p.t('lbl_positions')}</p>
          <h3 className="neck__title">
            {p.t('position')} {p.index + 1}
            <span className="neck__range">
              {' '}
              · {p.t('frets')} {current?.start}–{current?.end}
            </span>
          </h3>
          {current && (
            <p className="neck__meta">
              {p.t('notes_per_cycle', { n: current.sequence.length })}
              {playing && ` · ${p.t('cycle_label')} ${p.cycle}`}
            </p>
          )}
        </div>
        {current && (
          <button
            type="button"
            className={`play${playing ? ' is-on' : ''}`}
            onClick={() => p.onToggle(current)}
            aria-label={playing ? p.t('btn_stop') : p.t('btn_play')}
          >
            {playing ? <StopIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
          </button>
        )}
      </header>

      <div
        className="neck__viewport"
        onPointerDown={(e) => (start.current = e.clientX)}
        onPointerUp={(e) => {
          if (start.current === null) return;
          const dx = e.clientX - start.current;
          start.current = null;
          if (Math.abs(dx) > 50) go(p.index + (dx < 0 ? 1 : -1));
        }}
      >
        <div className="neck__track" style={{ transform: `translateX(${-p.index * 100}%)` }}>
          {p.positions.map((d, i) => {
            const fb = p.feedback && p.feedback.diagramId === d.id ? { key: p.feedback.key, kind: p.feedback.kind, seq: p.feedback.seq } : null;
            return (
              <div key={d.id} className="neck__slide" aria-hidden={i !== p.index}>
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
                  playing={p.activeId === d.id ? p.playingKey : null}
                  next={p.activeId === d.id ? p.nextKey : null}
                  feedback={fb}
                  labels={{ hit: p.t('hit_label'), miss: p.t('miss_label') }}
                  compact
                />
              </div>
            );
          })}
        </div>
      </div>

      <footer className="neck__nav">
        <button type="button" className="neck__arrow" onClick={() => go(p.index - 1)} disabled={p.index === 0} aria-label={p.t('neck_prev')}>
          <ChevronIcon width={18} height={18} style={{ transform: 'rotate(90deg)' }} />
        </button>
        <div className="neck__dots" role="tablist" aria-label={p.t('lbl_positions')}>
          {p.positions.map((d, i) => (
            <button
              key={d.id}
              type="button"
              role="tab"
              aria-selected={i === p.index}
              aria-label={`${p.t('position')} ${i + 1}`}
              className={`neck__dot${i === p.index ? ' is-on' : ''}`}
              onClick={() => go(i)}
            />
          ))}
        </div>
        <button type="button" className="neck__arrow" onClick={() => go(p.index + 1)} disabled={p.index === n - 1} aria-label={p.t('neck_next')}>
          <ChevronIcon width={18} height={18} style={{ transform: 'rotate(-90deg)' }} />
        </button>
      </footer>

      <label className="neck__follow">
        <input type="checkbox" className="toggle" checked={p.follow} onChange={(e) => p.onFollow(e.target.checked)} />
        <span>{p.t('neck_follow')}</span>
      </label>
    </section>
  );
}
