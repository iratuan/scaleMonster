import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { NOTES } from '../../core/notes';
import { ChevronIcon } from './Icons';

interface KeyPickerProps {
  label: string;
  value: string;
  names: string[];
  onChange: (note: string) => void;
}

/** Tom em grade 4×3: todas as notas visíveis de uma vez, um toque para escolher. */
export function KeyPicker({ label, value, names, onChange }: KeyPickerProps) {
  const [open, setOpen] = useState(false);
  const idx = NOTES.indexOf(value);
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="cb" aria-label={label}>
        <span className="cb__text">
          <span className="cb__label">{label}</span>
          <span className="cb__value">{names[idx] ?? value}</span>
        </span>
        <span className="cb__icon">
          <ChevronIcon width={14} height={14} />
        </span>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="cb__menu cb__menu--grid" sideOffset={6} collisionPadding={12} align="start">
          <div className="keygrid" role="listbox" aria-label={label}>
            {NOTES.map((n, i) => (
              <button
                key={n}
                type="button"
                role="option"
                aria-selected={n === value}
                className={`keygrid__btn${n === value ? ' is-on' : ''}`}
                onClick={() => {
                  onChange(n);
                  setOpen(false);
                }}
              >
                {names[i] ?? n}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
