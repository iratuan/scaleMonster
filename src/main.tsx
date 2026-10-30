import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
import './styles/app.css';
import './styles/toolbar.css';
import './styles/variants.css';
import './styles/responsive.css';
import './styles/tuner.css';
import './styles/metronome.css';
import './styles/madeira-braco.css';
import './styles/posicoes.css';
import './styles/apple.css';
import './styles/celular-paisagem.css';

// Celular na horizontal: uma classe na página (e não media query) ativa o layout compacto.
function marcaPaisagemCelular() {
  const compacto = window.innerWidth > window.innerHeight && window.innerHeight <= 500;
  document.documentElement.classList.toggle('paisagem-celular', compacto);
}
marcaPaisagemCelular();
window.addEventListener('resize', marcaPaisagemCelular);
window.addEventListener('orientationchange', marcaPaisagemCelular);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// App instalável e offline na web. Não roda no Electron (file://) nem no Capacitor (WebView nativa).
const isNative = typeof window !== 'undefined' && 'Capacitor' in window;
if ('serviceWorker' in navigator && import.meta.env.PROD && location.protocol.startsWith('http') && !isNative) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* sem cache offline: o app segue funcionando online */
    });
  });
}
