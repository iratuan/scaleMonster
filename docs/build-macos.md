# Gerar o app para macOS (MacBook)

O app de desktop é feito com Electron e empacotado com electron-builder. O instalador de macOS
(DMG e ZIP) **só pode ser gerado num Mac**, porque o electron-builder usa ferramentas do macOS
para montar o DMG. Por isso, esta etapa não foi executada no Windows deste projeto.

## Requisitos

- macOS 12 ou mais recente.
- Node.js 20 ou mais recente (`node -v`). Instale pelo site oficial ou com Homebrew: `brew install node`.
- Git (opcional, para trazer o projeto).
- Conexão com a internet na primeira vez (o npm baixa as dependências e o Electron).

Não é preciso Xcode para gerar o app de desktop.

## Passo a passo

1. **Traga o projeto para o Mac.** Copie o arquivo `release/guitarra-escalas-1.3.0.bundle` (ele contém o histórico git completo) e rode:

   ```bash
   git clone guitarra-escalas-1.3.0.bundle guitarra-escalas-v3
   cd guitarra-escalas-v3
   ```

   Alternativa: copiar a pasta do projeto inteira, sem `node_modules`.

2. **Abra o Terminal na pasta do projeto** e instale as dependências:

   ```bash
   npm ci
   ```

   Se não houver `package-lock.json`, use `npm install`.

3. **Confira os testes e o build web** (opcional, mas recomendado):

   ```bash
   npm test
   npm run build
   ```

4. **Gere o app para macOS:**

   ```bash
   npm run electron:build:mac
   ```

   O resultado vai para a pasta `release/`:

   - `ScaleMonster-1.3.0-mac-x64.dmg` (Macs Intel)
   - `ScaleMonster-1.3.0-mac-x64.zip`
   - Para Macs Apple Silicon (M1, M2, M3...), o electron-builder gera a versão `arm64`
     quando você roda em um Mac com esse processador. Para gerar as duas arquiteturas de uma vez:

     ```bash
     npx electron-builder --mac --x64 --arm64
     ```

5. **Abra o DMG**, arraste o app para a pasta Aplicativos e abra.

## Primeira abertura (app sem assinatura)

A configuração atual gera o app **sem assinatura da Apple** (`identity: null` no `package.json`).
Por isso, o macOS pode bloquear a primeira abertura com o aviso de que o desenvolvedor não foi verificado.

Para abrir mesmo assim:

- Clique com o botão direito no app e escolha **Abrir**, e confirme; **ou**
- Em Ajustes do Sistema > Privacidade e Segurança, role até o aviso do app e clique em **Abrir Mesmo Assim**; **ou**
- No Terminal: `xattr -dr com.apple.quarantine "/Applications/ScaleMonster.app"`

## Para distribuir sem avisos (opcional, depois)

Para o app abrir sem o aviso em outros Macs, é preciso:

1. Ter uma conta **Apple Developer** (paga) e um certificado "Developer ID Application".
2. Trocar `"identity": null` por o nome do certificado no bloco `build.mac` do `package.json`.
3. Notarizar o app com a Apple (electron-builder aceita as variáveis `APPLE_ID`,
   `APPLE_APP_SPECIFIC_PASSWORD` e `APPLE_TEAM_ID`).

## Observações

- O áudio do app pede permissão de microfone no macOS (usada pelo afinador e pelo desafio).
  Se negar, é possível liberar depois em Ajustes do Sistema > Privacidade e Segurança > Microfone.
- O build de macOS não foi testado neste projeto. Se algo falhar, envie a mensagem de erro do
  terminal para ajustarmos.
