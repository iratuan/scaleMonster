import { useEffect, useState } from 'react';
import logoUrl from '../../assets/scalemonster-logo.png';

interface SplashProps {
  title: string;
  /** Tempo mínimo de exibição, em ms, para a marca ser percebida. */
  minMs?: number;
}

/**
 * Tela de abertura: marca e indicador de carregamento. Some com uma transição curta.
 * Com movimento reduzido, aparece sem animação. Não bloqueia a interface depois de sair.
 */
export function Splash({ title, minMs = 900 }: SplashProps) {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');

  useEffect(() => {
    const out = setTimeout(() => setPhase('out'), minMs);
    const gone = setTimeout(() => setPhase('gone'), minMs + 320);
    return () => {
      clearTimeout(out);
      clearTimeout(gone);
    };
  }, [minMs]);

  if (phase === 'gone') return null;

  return (
    <div className={`splash splash--${phase}`} role="status" aria-live="polite" aria-label={title}>
      <div className="splash__mark">
        <img src={logoUrl} alt="" className="splash__logo" />
      </div>
      <p className="sr-only">{title}</p>
      <div className="splash__bar" aria-hidden>
        <span />
      </div>
    </div>
  );
}
