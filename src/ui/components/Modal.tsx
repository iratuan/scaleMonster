import { useEffect, type ReactNode } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  title?: string;
  onClose: () => void;
  closeLabel: string;
  children: ReactNode;
  variant?: 'center' | 'sheet';
}

/** Janela sobreposta: fecha com Esc, toque no fundo ou no botão X. */
export function Modal({ title, onClose, closeLabel, children, variant = 'center' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={`overlay overlay--${variant}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`panel panel--${variant}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="panel__head">
          {title && <h2 className="panel__title">{title}</h2>}
          <button type="button" className="icon-btn" onClick={onClose} aria-label={closeLabel}>
            <CloseIcon width={18} height={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
