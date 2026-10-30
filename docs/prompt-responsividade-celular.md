# Prompt: otimizar a responsividade para celulares (orientação horizontal)

Você vai otimizar a interface do Tutor de Escalas para celulares, com a orientação horizontal como
principal. O projeto está em `E:\SANDBOX_CLAUDE\guitarra\guitarra-escalas-v3`.

## Contexto

- Stack: Vite + React 18 + TypeScript, Capacitor 6 (Android), Electron (desktop).
- O padrão visual já aprovado deve ser mantido: estilo Apple (fonte do sistema, cartões translúcidos,
  cabeçalho de vidro, listas agrupadas), os quatro temas em `src/styles/tokens.css` e o tema madeira.
- Não mude a lógica musical (`src/core/`). Só a forma de apresentar e de operar os controles.
- Os textos e o tom continuam bem-humorados, em português, inglês e alemão.

## O problema

Em telas pequenas (celular em horizontal, cerca de 844 × 390 px), o cabeçalho, a barra de escolhas
(instrumento, tom, escala, variação, grupo de cordas, exercício e velocidade) e os cartões ocupam
a tela antes do braço. O braço, que é o foco da prática, fica fora da área visível.

## O que fazer

1. **Orientação horizontal como padrão no celular.** Trave a orientação em paisagem no Android
   (`android/app/src/main/AndroidManifest.xml`, atributo `android:screenOrientation`). No navegador
   móvel, use a mesma lógica de layout, sem bloquear a rotação.

2. **Foco na execução.** Em tela pequena, o braço da escala completa deve ficar visível logo abaixo
   do cabeçalho, com o botão de tocar sempre à mão.

3. **Controles compactos.** Reorganize a barra de escolhas em uma linha recolhível ou em uma folha
   (sheet) acionada por um botão. Os seletores de tom, escala, variação, grupo, exercício e velocidade
   não devem ocupar a área do braço. Use `src/ui/components/Toolbar.tsx` e `src/styles/toolbar.css`.

4. **Botões minimalistas.** Reduza o cabeçalho a: logomarca, nome do instrumento, botão de tocar e
   um menu. Agrupe as ações secundárias (tema, ferramentas, ajuda, ajustes) num único botão. Mantenha
   alvos de toque de pelo menos 44 pt.

5. **Cartões de posição.** No celular, cada posição continua ocupando a linha inteira, mas com braço
   compacto (altura reduzida). Verifique `src/ui/components/PositionGrid.tsx`.

6. **Sem rolagem horizontal da página.** O braço pode rolar dentro do próprio cartão se faltar
   espaço, mas a página não.

7. **Preserve o desktop.** Nenhuma mudança pode piorar a tela larga (acima de 900 px). Use
   `@media (max-width: ...)` ou `(pointer: coarse)` para restringir as mudanças ao celular.

## Como verificar

- Testes: `npm test` (94 testes precisam continuar passando) e `npx tsc --noEmit`.
- Build e navegador: `npx vite build`, `npx vite preview --port 4173` e
  `node scripts/capturar-visual-apple.mjs` (desktop e celular).
- Android: `npx cap sync android`, gerar o APK com o Gradle em cache e instalar no emulador
  `MindCraft_Tablet`. Depois, capturar pelo WebView com
  `node scripts/capturar-android-webview.mjs paisagem` (e `retrato`).
- Critérios de aceite, no celular em horizontal (844 × 390):
  - o braço da escala completa aparece sem rolar a página;
  - o botão de tocar fica visível e acessível com o polegar;
  - a barra de escolhas ocupa no máximo uma faixa estreita (ou fica recolhida);
  - não há rolagem horizontal da página;
  - o desktop permanece igual às capturas em `docs/evidencias/telas/`.

## Observações

- Na captura pelo WebView do Android, a camada espacial de fundo é desativada no aparelho
  (`SpaceBackdrop` não é renderizado em plataforma nativa). Não reative sem testar.
- Ao final, atualize `README.md` (seção de telas) e `docs/progresso.md` com as capturas novas.
