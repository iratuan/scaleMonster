import { MAX_BPM, MIN_BPM } from '../../core/autoBpm';
import { MinusIcon, PlusIcon } from './Icons';

interface BpmControlProps {
  label: string;
  bpm: number;
  onNudge: (delta: number) => void;
}

/** Velocidade em BPM com passos de 10, num bloco do mesmo tamanho dos combobox. */
export function BpmControl({ label, bpm, onNudge }: BpmControlProps) {
  return (
    <div className="cb cb--stepper" role="group" aria-label={label}>
      <span className="cb__text">
        <span className="cb__label">{label}</span>
        <span className="cb__value num">
          {bpm}
          <small> BPM</small>
        </span>
      </span>
      <span className="cb__steps">
        <button type="button" className="step" onClick={() => onNudge(-10)} disabled={bpm <= MIN_BPM} aria-label="-10 BPM">
          <MinusIcon width={14} height={14} />
        </button>
        <button type="button" className="step" onClick={() => onNudge(10)} disabled={bpm >= MAX_BPM} aria-label="+10 BPM">
          <PlusIcon width={14} height={14} />
        </button>
      </span>
    </div>
  );
}
