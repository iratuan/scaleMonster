import { detectHeadset } from '../../audio/headset';
import type { MicStatus } from '../usePlayback';

interface ChallengeBarProps {
  t: (key: string) => string;
  micStatus: MicStatus;
}

/**
 * Aviso visível durante o desafio: se ele está pontuando, se o microfone falhou e se o som
 * do app pode estar contaminando a pontuação (sem fone de ouvido).
 */
export function ChallengeBar({ t, micStatus }: ChallengeBarProps) {
  if (micStatus === 'error') {
    return (
      <p className="challenge-bar challenge-bar--error" role="alert">
        {t('chal_error')}
      </p>
    );
  }
  const headset = detectHeadset();
  return (
    <p className={`challenge-bar challenge-bar--${headset === true ? 'ok' : 'warn'}`} role="status">
      {headset === true ? t('chal_active') : t('chal_no_headset')}
    </p>
  );
}
