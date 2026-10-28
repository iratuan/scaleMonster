# Evidências

Capturas de tela, resultados de testes e registros de build. Tudo aqui é gerado a partir do código.

## Estrutura

| Pasta | Conteúdo |
| --- | --- |
| `telas/` | Capturas das 6 vistas (celular, desktop, claro, baixo, ukulele, cavaco) e das funcionalidades (ajustes, ajuda, backing track, contagem, reprodução). |
| `testes/` | Saída dos testes automatizados, da verificação de tipos e do log da captura de telas. |
| `builds/` | Resumo dos artefatos (tamanho e SHA-256) e log do build web. |

## Como regenerar

```bash
npm test > docs/evidencias/testes/vitest-resultado.txt   # testes (use tee no Windows)
npx tsc --noEmit                                         # tipos
npm run build                                            # web
npx vite preview --port 4173                             # servidor local (em outro terminal)
node scripts/capturar-telas.mjs                          # telas e funcionalidades
```

O script usa o Chrome instalado (`CHROME_PATH` para outro caminho). Não baixa navegador.

## Inventário atual

- `telas/`: 11 capturas (6 vistas + 5 funcionalidades; reprodução com áudio ativo, sem microfone).
- `testes/`: vitest-resultado.txt (42 testes), typecheck-resultado.txt, captura-telas-log.txt.
- `builds/`: resumo-builds.md, vite-build.txt.

Os executáveis (`.exe`, `.apk`) ficam em `release/` e não são copiados para cá; o resumo registra o hash de cada um.
