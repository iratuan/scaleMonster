import type { PlayNote, ScaleContext } from '../../core/types';
import type { Feedback } from '../usePlayback';
import { ChordPanel } from './ChordPanel';
import { Modal } from './Modal';

interface ChordModalProps {
  t: (key: string, vars?: Record<string, string | number>) => string;
  ctx: ScaleContext;
  activeId: string | null;
  playingKey: string | null;
  nextKey: string | null;
  feedback: Feedback | null;
  inverted: boolean;
  showGhost: boolean;
  onToggle: (id: string, sequence: PlayNote[]) => void;
  /** Fecha o dicionário e para qualquer reprodução de acorde. */
  onClose: () => void;
}

/** Dicionário de acordes: utilitário separado da digitação da escala, aberto pelo menu de ferramentas. */
export function ChordModal(p: ChordModalProps) {
  return (
    <Modal title={p.t('chords_dictionary')} onClose={p.onClose} closeLabel={p.t('btn_close')} variant="sheet">
      <ChordPanel
        t={p.t}
        ctx={p.ctx}
        activeId={p.activeId}
        playingKey={p.playingKey}
        nextKey={p.nextKey}
        feedback={p.feedback}
        inverted={p.inverted}
        showGhost={p.showGhost}
        onToggle={p.onToggle}
      />
    </Modal>
  );
}
