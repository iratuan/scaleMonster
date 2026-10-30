import { useState } from 'react';
import { pickCuriosidade } from '../../core/curiosidades';
import personagemUrl from '../../assets/scalemonster-personagem.png';

interface FooterProps {
  t: (key: string) => string;
  lang: string;
}

/** Rodapé com uma curiosidade diferente a cada abertura do app, contada pelo personagem ScaleMonster. */
export function Footer({ t, lang }: FooterProps) {
  const [fact] = useState(() => pickCuriosidade(lang));
  return (
    <footer className="app-footer">
      <img className="app-footer__avatar" src={personagemUrl} alt="" aria-hidden="true" width={44} height={44} draggable={false} />
      <div className="app-footer__bubble">
        <span className="app-footer__label">{t('lbl_fact')}</span>
        <p>{fact}</p>
      </div>
    </footer>
  );
}
