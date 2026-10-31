import { useCallback, useEffect, useRef, useState } from 'react';
import logoUrl from '../../assets/scalemonster-logo.png';
import splashVideoUrl from '../../assets/splash.mp4';
import splashPosterUrl from '../../assets/splash-poster.jpg';

interface SplashProps {
  title: string;
  /** Tempo mínimo de exibição da logomarca, em ms, quando não há vídeo. */
  minMs?: number;
}

type Phase = 'in' | 'out' | 'gone';

const FADE_MS = 320;
/** Limite de segurança: se o vídeo travar, a tela de abertura sai mesmo assim. */
const VIDEO_MAX_MS = 14000;

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Tela de abertura: vídeo de apresentação (mudo, reproduzido uma vez). Toque/clique pula.
 * Sem vídeo (movimento reduzido ou falha de reprodução), mostra a logomarca por um tempo mínimo.
 * Some com uma transição curta e não bloqueia a interface depois de sair.
 */
export function Splash({ title, minMs = 900 }: SplashProps) {
  const [phase, setPhase] = useState<Phase>('in');
  const [withVideo, setWithVideo] = useState(() => !prefersReducedMotion());
  const videoRef = useRef<HTMLVideoElement>(null);

  const finish = useCallback(() => setPhase((p) => (p === 'in' ? 'out' : p)), []);

  // Sem vídeo: logomarca por um tempo mínimo.
  useEffect(() => {
    if (withVideo) return;
    const out = setTimeout(finish, minMs);
    return () => clearTimeout(out);
  }, [withVideo, minMs, finish]);

  // Com vídeo: limite de segurança.
  useEffect(() => {
    if (!withVideo) return;
    const max = setTimeout(finish, VIDEO_MAX_MS);
    return () => clearTimeout(max);
  }, [withVideo, finish]);

  // Inicia o vídeo; se o navegador bloquear a reprodução, cai para a logomarca.
  useEffect(() => {
    if (!withVideo) return;
    const el = videoRef.current;
    if (!el) return;
    const played = el.play?.();
    played?.catch(() => setWithVideo(false));
  }, [withVideo]);

  // Depois do fade, remove a tela.
  useEffect(() => {
    if (phase !== 'out') return;
    const gone = setTimeout(() => setPhase('gone'), FADE_MS);
    return () => clearTimeout(gone);
  }, [phase]);

  if (phase === 'gone') return null;

  const className = `splash splash--${phase}${withVideo ? ' splash--video' : ''}`;

  return (
    <div className={className} role="status" aria-live="polite" aria-label={title} onClick={finish}>
      {withVideo ? (
        <video
          ref={videoRef}
          className="splash__video"
          src={splashVideoUrl}
          poster={splashPosterUrl}
          muted
          playsInline
          preload="auto"
          onEnded={finish}
          onError={() => setWithVideo(false)}
        />
      ) : (
        <div className="splash__mark">
          <img src={logoUrl} alt="" className="splash__logo" />
        </div>
      )}
      <p className="sr-only">{title}</p>
      {!withVideo && (
        <div className="splash__bar" aria-hidden>
          <span />
        </div>
      )}
    </div>
  );
}
