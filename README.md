# Tutor de Escalas (v3)

Variação minimalista e flat do Tutor de Escalas, para web, Windows e Android.
Instrumentos: guitarra, violão, baixo, ukulele e cavaco.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm test` | Testes (núcleo musical, instrumentos, interface) |
| `npm run build` | Gera `dist/` (web; base relativa) |
| `npm run electron:build` | Gera `release/` com instalador NSIS e executável portátil (Windows) |
| `npx cap sync android` | Copia `dist/` para o projeto Android |
| `cd android && ./gradlew assembleDebug` | Gera o APK de depuração |

## Estrutura

- `src/core/instruments.ts` — instrumentos como dados: afinação (MIDI), trastes, filtros de cordas.
- `src/core/` — lógica musical sem DOM (escalas, posições, exercícios, digitação, julgamento, estatísticas).
- `src/ui/` — React. `components/Fretboard.tsx` desenha qualquer instrumento; `App.tsx` monta a tela.
- `src/styles/` — `tokens.css` (cores, espaço, tipo, três temas) e `app.css` (layout flat).
- `electron/main.cjs` — casca desktop. `android/` — projeto Capacitor.

## Decisões

- Estilo flat: sem sombras, desfoque ou gradientes. Hierarquia por tipo e espaço.
- Posições de 5 trastes valem para qualquer instrumento; as formas CAGED são as do violão/guitarra.
- Violão e guitarra usam a mesma afinação (E A D G B E); a diferença é só o nome e o timbre.
- Não assinado: o `.exe` e o APK são de teste. Para distribuir, falta certificado (Windows) e keystore (Android).
