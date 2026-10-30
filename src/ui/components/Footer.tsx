import { useState } from 'react';
import { pickCuriosidade } from '../../core/curiosidades';

interface FooterProps {
  t: (key: string) => string;
  lang: string;
}

/** Rodapé com uma curiosidade diferente a cada abertura do app, contada pelo mascote. */
export function Footer({ t, lang }: FooterProps) {
  const [fact] = useState(() => pickCuriosidade(lang));
  return (
    <footer className="app-footer">
      <img className="app-footer__avatar" src="logo-mascote.svg" alt="" aria-hidden="true" width={44} height={44} draggable={false} />
      <div className="app-footer__bubble">
        <span className="app-footer__label">{t('lbl_fact')}</span>
        <p>{fact}</p>
      </div>
    </footer>
  );
}
