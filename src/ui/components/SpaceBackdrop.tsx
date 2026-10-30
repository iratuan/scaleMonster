import { useMemo } from 'react';
import { Capacitor } from '@capacitor/core';

/** Gerador pseudoaleatório com semente fixa: o céu é o mesmo em toda abertura do app. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/**
 * Fundo espacial: nebulosas nas cores do tema, estrelas e um planeta com anel.
 * Fica desfocado (CSS) e em movimento lento, como um céu visto de longe.
 */
export function SpaceBackdrop() {
  const stars = useMemo(() => {
    const r = seeded(7);
    return Array.from({ length: 150 }, () => ({
      x: r() * 1600,
      y: r() * 1000,
      rad: 0.6 + r() * 2.4,
      op: 0.35 + r() * 0.65,
    }));
  }, []);

  // No WebView do Android, a camada espacial cobre a interface. Lá o app usa o fundo sólido do tema.
  if (Capacitor.isNativePlatform()) return null;

  return (
    <div className="space-backdrop" aria-hidden="true">
      <svg viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" focusable="false">
        <defs>
          <filter id="sb-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" />
          </filter>
          <radialGradient id="sb-nebula-accent">
            <stop offset="0" style={{ stopColor: 'var(--accent)', stopOpacity: 0.7 }} />
            <stop offset="1" style={{ stopColor: 'var(--accent)', stopOpacity: 0 }} />
          </radialGradient>
          <radialGradient id="sb-nebula-indigo">
            <stop offset="0" stopColor="#5e5ce6" stopOpacity="0.75" />
            <stop offset="1" stopColor="#5e5ce6" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sb-nebula-rose">
            <stop offset="0" stopColor="#ff375f" stopOpacity="0.4" />
            <stop offset="1" stopColor="#ff375f" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sb-planet" cx="35%" cy="35%" r="72%">
            <stop offset="0" stopColor="#ffe2b8" />
            <stop offset="0.55" stopColor="#d9864a" />
            <stop offset="1" stopColor="#4a2312" />
          </radialGradient>
        </defs>

        <g filter="url(#sb-blur)">
        <ellipse cx="360" cy="300" rx="700" ry="420" fill="url(#sb-nebula-accent)" />
        <ellipse cx="1240" cy="720" rx="760" ry="460" fill="url(#sb-nebula-indigo)" />
        <ellipse cx="900" cy="140" rx="520" ry="260" fill="url(#sb-nebula-rose)" />

        {stars.map((st, i) => (
          <circle key={i} cx={st.x} cy={st.y} r={st.rad} fill="#ffffff" opacity={st.op} />
        ))}

        <g transform="rotate(-14 1260 230)">
          <ellipse cx="1260" cy="230" rx="270" ry="50" fill="none" stroke="#ffe2b8" strokeOpacity="0.35" strokeWidth="20" />
        </g>
        <circle cx="1260" cy="230" r="150" fill="url(#sb-planet)" />
        </g>
      </svg>
    </div>
  );
}
