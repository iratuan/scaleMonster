# Distribuição web (1.4.0)

O pacote `release/ScaleMonster-web-1.4.0.zip` contém o site pronto (pasta `dist`). Não há servidor
Node ou PHP: é só um conjunto de arquivos estáticos.

## Conteúdo

- `index.html`, `assets/` (JavaScript e CSS)
- `manifest.webmanifest` e `sw.js` (instalação como app e uso offline)
- `icon-192.png` e `icon-512.png` (ícones do app, com a logomarca ScaleMonster)

## Como publicar

Qualquer hospedagem de arquivos estáticos serve (GitHub Pages, Netlify, Vercel, Cloudflare Pages,
ou uma pasta num servidor próprio).

1. Descompacte o ZIP. Você terá a pasta com `index.html` e `assets/`.
2. Envie o conteúdo da pasta para a hospedagem, mantendo a estrutura.
3. Abra o endereço. Para instalar como app (PWA), o site precisa estar em **HTTPS**
   (ou em `localhost`, para testes).

Para testar localmente, sem publicar, em qualquer computador com Python:

```bash
cd pasta-descompactada
python -m http.server 8080
```

e abra `http://localhost:8080`.

## Atualizações

O service worker guarda o app para uso offline. Ao publicar uma nova versão, o cache muda de nome
(`tutor-escalas-v13` nesta versão) e o navegador baixa a versão nova na próxima visita. Se algum usuário ainda vir a
versão antiga, peça para recarregar a página com Ctrl+F5 (ou Cmd+Shift+R no Mac).

## Publicação no GitHub Pages (quando você decidir)

Não publicamos nada automaticamente. Quando quiser, é preciso:

1. Escolher o nome do repositório e se será público ou privado.
2. Confirmar a publicação (ela torna o conteúdo acessível e fica em cache de buscadores).
