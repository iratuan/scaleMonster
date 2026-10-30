import { useMemo, useState } from 'react';
import { CHORD_TYPE_IDS, chordName, diatonicChords, findVoicing, type ChordTypeId } from '../../core/chords';
import type { PlayNote, ScaleContext } from '../../core/types';
import type { Feedback } from '../usePlayback';
import { Fretboard } from './Fretboard';
import { PlayIcon, StopIcon } from './Icons';

interface ChordPanelProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ctx: ScaleContext;
  activeId: string | null;
  playingKey: string | null;
  nextKey: string | null;
  feedback: Feedback | null;
  inverted: boolean;
  showGhost: boolean;
  onToggle: (id: string, sequence: PlayNote[]) => void;
}

interface Selection {
  root: number;
  type: ChordTypeId;
}

/** Id do diagrama de acordes na reprodução. */
export const CHORD_ID = 'chord';

/**
 * Acordes: os acordes diatônicos da escala e os demais tipos, com a digitação gerada para o instrumento.
 * Toca em arpejo, da nota mais grave à mais aguda. Quem muda de escala ou de instrumento deve recriar
 * o painel (key), para a seleção não ficar de outra escala.
 */
export function ChordPanel(p: ChordPanelProps) {
  const diatonic = useMemo(() => diatonicChords(p.ctx.rootIdx, p.ctx.intervals), [p.ctx]);
  const [sel, setSel] = useState<Selection | null>(null);
  const cur: Selection = sel ?? { root: p.ctx.rootIdx, type: diatonic[0]?.type ?? 'maj' };
  const voicing = useMemo(
    () => findVoicing(p.ctx.instrument.strings, p.ctx.instrument.frets, cur.root, cur.type),
    [p.ctx.instrument, cur.root, cur.type],
  );

  const playing = p.activeId === CHORD_ID;
  const keys = new Set((voicing?.notes ?? []).map((n) => `${n.string}-${n.fret}`));
  const fb = p.feedback && p.feedback.diagramId === CHORD_ID ? { key: p.feedback.key, kind: p.feedback.kind, seq: p.feedback.seq } : null;
  const name = chordName(cur.root, cur.type);
  const shapeText = voicing?.shape ? ` · forma ${voicing.shape}` : '';

  return (
    <section className="chord-panel" aria-label={p.t('lbl_chords')}>
      <div className="section__head">
        <h2 className="section__label">{p.t('lbl_chords')}</h2>
        <button
          type="button"
          className={`play${playing ? ' is-on' : ''}`}
          disabled={!voicing}
          onClick={() => voicing && p.onToggle(CHORD_ID, voicing.notes)}
          aria-label={playing ? p.t('btn_stop') : p.t('btn_play_chord')}
        >
          {playing ? <StopIcon width={16} height={16} /> : <PlayIcon width={16} height={16} />}
        </button>
      </div>

      {diatonic.length > 0 && (
        <div className="chord-panel__row" role="radiogroup" aria-label={p.t('lbl_chords')}>
          {diatonic.map((d) => {
            const on = cur.root === d.root && cur.type === d.type;
            return (
              <button
                key={d.degree}
                type="button"
                role="radio"
                aria-checked={on}
                className="chord-chip"
                onClick={() => setSel({ root: d.root, type: d.type })}
              >
                {chordName(d.root, d.type)}
              </button>
            );
          })}
        </div>
      )}

      <div className="chord-panel__row chord-panel__row--types" role="radiogroup" aria-label={p.t('lbl_chord_type')}>
        {CHORD_TYPE_IDS.map((tp) => (
          <button
            key={tp}
            type="button"
            role="radio"
            aria-checked={cur.type === tp}
            className="chord-chip chord-chip--type"
            onClick={() => setSel({ root: cur.root, type: tp })}
          >
            {p.t(`chord_${tp}`)}
          </button>
        ))}
      </div>

      <div className="surface">
        {voicing ? (
          <Fretboard
            id={CHORD_ID}
            start={voicing.start}
            end={voicing.end}
            ctx={p.ctx}
            activeKeys={keys}
            fingerOf={() => ''}
            hints={false}
            inverted={p.inverted}
            showGhost={p.showGhost}
            playing={playing ? p.playingKey : null}
            next={playing ? p.nextKey : null}
            feedback={fb}
            labels={{ hit: p.t('hit_label'), miss: p.t('miss_label') }}
          />
        ) : (
          <p className="caption">{p.t('chord_none')}</p>
        )}
        <p className="caption">
          {name}{shapeText} · {p.t('chord_hint')}
        </p>
      </div>
    </section>
  );
}
