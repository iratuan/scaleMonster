# Dicionário de acordes (arquivado)

Funcionalidade retirada do app para revisão. O app em execução não a inclui.

## O que tem aqui

- `src/core/chords.ts`: tipos de acorde, nomes, formas CAGED (violão e guitarra, maior, menor e 7) e o gerador por busca (baixo, ukulele, cavaquinho e demais tipos).
- `src/core/chords.test.ts`: testes de cobertura de todas as combinações e de conferência das formas CAGED.
- `src/ui/components/ChordPanel.tsx`: painel com os acordes da escala, os tipos e o braço com a digitação.
- `src/ui/components/ChordModal.tsx`: o modal que abria o painel pelo menu de ferramentas.
- `scripts/`: capturas de tela usadas para revisão visual.

## Como restaurar

1. Copie os arquivos de `src/` de volta para `src/core/` e `src/ui/components/`.
2. Em `src/ui/components/ToolsMenu.tsx`, adicione a prop `onChords` e o item "Dicionário de acordes".
3. Em `src/ui/App.tsx`, adicione o estado `chords`, a prop `onChords` no `ToolsMenu` e o bloco `{chords && <ChordModal ... />}`.
4. As chaves de tradução `chords_dictionary`, `lbl_chords`, `lbl_chord_type`, `btn_play_chord`, `chord_hint`, `chord_none` e `chord_*` continuam em `src/core/i18n.ts`.

## Pendências antes de voltar

- Formas CAGED menores: só E, A e D. Faltam as demais.
- Maior 7, menor 7, diminuto, aumentado e sus: sem forma CAGED, usam o gerador por busca.
- Decisão de produto: manter ou esconder esses tipos no violão e na guitarra.
