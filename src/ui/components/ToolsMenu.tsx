import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { MetronomeIcon, TunerIcon, ToolsIcon } from './Icons';

interface ToolsMenuProps {
  t: (key: string) => string;
  onMetronome: () => void;
  onTuner: () => void;
}

/** Ferramentas (metrônomo e afinador) num menu com nome visível, em vez de ícones soltos no cabeçalho. */
export function ToolsMenu({ t, onMetronome, onTuner }: ToolsMenuProps) {
  const [open, setOpen] = useState(false);
  const pick = (action: () => void) => {
    setOpen(false);
    action();
  };
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="icon-btn" aria-label={t('tools_title')} title={t('tools_title')}>
        <ToolsIcon width={18} height={18} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content className="tools-menu" sideOffset={8} align="end" collisionPadding={12}>
          <button type="button" className="tools-menu__item" onClick={() => pick(onMetronome)}>
            <MetronomeIcon width={18} height={18} />
            <span>{t('metro_title')}</span>
          </button>
          <button type="button" className="tools-menu__item" onClick={() => pick(onTuner)}>
            <TunerIcon width={18} height={18} />
            <span>{t('tuner_title')}</span>
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
