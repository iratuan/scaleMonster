# Builds — Tutor de Escalas v3

Gerado em 2026-10-27 17:21 (horário local). Código: versão atual do projeto v3, incluindo a correção do rótulo "Prática".

| Alvo | Artefato | Tamanho | SHA-256 | Observação |
| --- | --- | --- | --- | --- |
| Web | `dist/` (index.html + assets) | JS 235,5 KB (84,9 KB gzip) · CSS 17,1 KB | ver `vite-build.txt` | Base relativa; mesmo build usado no Electron e no Capacitor |
| Windows (instalador NSIS) | `release/Tutor de Escalas Setup 3.0.0.exe` | 83,4 MB | d1f9dcc81ab9d95aff600bc78f8b07225a5f552d603c15836ce7b71c195dba1a | Sem assinatura de código |
| Windows (portátil) | `release/Tutor de Escalas 3.0.0.exe` | 83,1 MB | 748029ce8a56c9ad77bc42e107912294af6dec1019ee4db0979d3153f9eb87ed | Sem assinatura de código; abre e permanece em execução (teste de fumaça) |
| Android (APK debug) | `release/tutor-escalas-debug.apk` | 3,9 MB | ec3dd10fa16d311444736374da91907ad899b8971f3f9f98ab40adf5411eadcf | Assinado com chave de depuração; permissões RECORD_AUDIO e MODIFY_AUDIO_SETTINGS verificadas com aapt2 |

Os executáveis não são versionados em `docs/`. Para regenerá-los: `npm run build`, `npx cap sync android`, `cd android && ./gradlew assembleDebug` e `npx electron-builder --win --x64`.
