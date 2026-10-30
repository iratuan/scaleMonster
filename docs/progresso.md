# Progresso — Tutor de Escalas

## Linha do tempo

### 2026-10-27 — Análise e início da refatoração

- **Diagnóstico do legado (Vanilla JS).** Código espalhado em ~3,5 mil linhas, estado guardado no DOM,
  funções globais e nenhum teste. Decisão: refatorar com rede de segurança (testes de caracterização)
  antes de mudar a estrutura.
- **Projeto antigo preservado** em `referencia-legado/`, para comparar comportamento.

### Fase 1 — v2: base em React + TypeScript

- Núcleo musical portado sem DOM: escalas, janelas CAGED, nove exercícios, digitação, backing track,
  detecção de pitch, julgamento do microfone, BPM automático e estatísticas.
- Dicionários de idioma (11 idiomas) extraídos automaticamente do legado, para não perder texto.
- Paridade verificada por testes: a sequência de "saltos de corda" reproduz o padrão do legado (5-3-4-2-3-1-2-0).
- Decisão: o botão "Desafio" do legado era um checkbox oculto sem efeito. Unificado com o modo microfone.
- Decisão: a dica "marcadores somem no desafio" da ajuda nunca foi implementada. Não foi implementada
  nesta fase; o texto da ajuda foi corrigido para o que o app faz.

### Fase 2 — v3: interface flat e múltiplos instrumentos

- Interface redesenhada a partir da referência enviada: tema escuro, barra inferior flutuante e chips.
- **Layout flat** (pedido explícito): sem sombras, desfoque ou gradientes, inclusive no braço.
- **Instrumentos** (pedido explícito): guitarra, violão, baixo, ukulele e cavaco. Afinação, trastes e
  filtros de cordas são dados (`src/core/instruments.ts`); o componente do braço se adapta sozinho.
- **Correções encontradas nas capturas de tela:**
  - Tema claro não cobria o fundo da página (o atributo de tema estava só no container). Corrigido.
  - Texto dos seletores ilegível no tema claro (paleta nativa do sistema). Corrigido com `color-scheme`.
  - Estouro horizontal de 170 px no celular (colunas de grade com largura mínima). Corrigido com `minmax(0, 1fr)`.
  - Grupo "Prática" com rótulo errado nos ajustes. Corrigido.
  - Modo desafio sem permissão de microfone no Android. Corrigido no manifesto.
- **Distribuição:**
  - Web: build de produção, base relativa.
  - Windows: instalador NSIS e executável portátil (Electron 33).
  - Android: APK de depuração (Capacitor 6, Gradle 8.11.1).

### 2026-10-27 — Braço: contraste, calibre, nota-alvo e tema madeira

- **Contraste:** trastes e cordas mais claros sobre o tabuleiro escuro (temas escuro e claro).
- **Calibre das cordas:** espessura proporcional ao calibre real, de 0,8 px (corda aguda) a 2,6 px (grave).
- **Nota-alvo:** a próxima nota da sequência ganha anel forte; as notas do exercício, anel sutil.
- **Tema madeira:** braço de jacarandá com textura, trastes e marcadores de osso, cordas de níquel.
  Os demais temas continuam flat.
- **Responsivo:** no celular o braço tem largura mínima menor e notas menores. Com 15 trastes,
  ainda há rolagem horizontal no celular (pendência abaixo).

### 2026-10-27 — Reorganização: barra de escolhas no topo

- **Motivo:** tom, escala, variação, exercício e velocidade ficavam espalhados entre a barra inferior
  e os ajustes. Decisão: agrupar as escolhas musicais no topo, na ordem em que o usuário decide
  (instrumento → tom e escala → cordas e exercício → velocidade).
- **Barra inferior removida.** Liberou espaço vertical para o braço.
- **Combobox acessíveis (Radix UI):** escala, variação, cordas e exercício. Teclado e leitor de tela tratados pela biblioteca.
- **Tom em grade 4×3:** todas as notas à vista, um toque para escolher.
- **Velocidade:** bloco com botões de −10 e +10 BPM.
- **Ajustes** agora só guardam o que não é escolha musical: digitação, invertido, auto-BPM, desafio, tema, volume, idioma.
- **Layout:** 3 colunas em telas médias e largas; 2 colunas no celular.

### 2026-10-27 — Variantes de cordas, nota fantasma, splash, ícones e responsividade

- **Variantes de cordas:** baixo com 4, 5 ou 6 cordas; violão com 6 ou 7 (B1 grave). Seletor "Nº de cordas" abaixo dos instrumentos. Guitarra, ukulele e cavaco ficam fixos.
- **Hierarquia de notas:** notas do exercício preenchidas; demais notas da escala em contorno fino (fantasma); a próxima nota com anel forte. Ajuste "Mostrar outras notas da escala" nos ajustes.
- **Rótulos:** "Nº de cordas" (quantidade) e "Grupo de cordas" (filtro), para não repetir o termo.
- **Splash:** tela de abertura com a marca e indicador de carregamento; some com transição; sem animação para quem prefere movimento reduzido.
- **Ícones:** conjunto único com traço 1,75 e grade de 24 px. Preenchidos só para play, stop e logo.
- **Responsividade:** faixas de celular (<600 px), tablet (600–1023 px) e computador (≥1024 px). Área segura para iPhone e telas com entalhe. Alvos de toque de 44 px em telas sensíveis ao toque. Ajustes em folha inferior no celular e em diálogo centralizado no computador.
- **Internet:** manifest e ícone, para instalar o app no celular ou no computador; service worker para uso offline depois da primeira visita. Não é ativado no Electron nem no Capacitor.
- **Correção:** o braço cortava a nota do último traste. Liberado o corte do tabuleiro.

### 2026-10-27 — Revisão: afinador, atalho de teclado e referência A4

- **Afinador (novo):** ícone no cabeçalho. Usa o microfone e a mesma detecção de frequência do app.
  Mostra a nota mais próxima, o desvio em centavos num medidor (−50 a +50) e as cordas do instrumento
  atual. Tocar numa corda fixa o alvo. Referência A4 ajustável de 430 a 450 Hz, guardada nos ajustes.
  Sem microfone, mostra a mensagem de erro em vez de falhar.
- **Atalho:** barra de espaço toca e para a escala completa, quando nenhum campo ou janela está em uso.
- **Revisado e mantido:** temas, responsividade e critério do desafio. Mudar a pontuação precisa de uma
  decisão sua sobre o critério; por isso não foi alterada.
- **Testes:** 53 passando (inclui leitura de notas, desvio em centavos, corda mais próxima e mediana).

### 2026-10-27 — Revisão da execução das escalas

Pedido: conferir quantidade de notas, shape, nota em execução e som, em todas as combinações.

- **Investigação do caso do baixo (12ª nota):** não era erro nos dados. Com o exercício 4 e as cordas 1–2,
  cada ciclo tem 12 notas; na 12ª a sequência recomeça (comportamento correto de repetição). O problema
  era de interface: o app não sinalizava o fim do ciclo, então a escala parecia voltar sozinha.
  - **Correção:** o cartão em execução mostra "Ciclo n" e "N notas por ciclo"; o braço principal mostra o ciclo.
- **Bug corrigido:** a escala completa não destacava algumas notas tocadas (ex.: ukulele, traste 11–12) em
  exercícios com saltos. O destaque agora é a união das notas tocadas nas posições e da varredura completa.
- **Bug corrigido:** a barra de espaço não parava a contagem regressiva (o próprio overlay bloqueava o atalho).
- **Verificação em todas as combinações** (instrumentos, variantes, escalas, tons, exercícios e filtros):
  cada nota pertence à escala, ao shape e ao braço; altura MIDI e frequência conferem com corda e traste;
  cada nota tocada tem casa visível; respeita o filtro de cordas; uníssonos não se repetem nas posições.
  Contagem de notas: exercício 1 = 2n−1; exercício 2 = 2(2n−1); exercício 3 = 3(2n−1).
- **Som no Chrome real:** 7 sons gerados em ~7,5 s, todos em frequências reais do baixo e de notas da escala.
  Limite do método: a mesma frequência pode vir de duas cordas, então o som sozinho não prova a corda;
  essa parte é coberta pelos testes de dados.
- **Testes:** 71 passando. Regressão do caso do baixo incluída.

### 2026-10-27 — Investigação: notas puladas e repetidas na execução

Relato: na escala de C no baixo, a execução pulava ou repetia uma nota ao chegar à oitava.

Causas encontradas (todas corrigidas):

1. **Junção entre posições:** a escala completa era a concatenação das 5 posições. Na junção, a sequência
   pulava uma altura (ex.: E→G sem o F). Agora a escala completa é uma varredura contínua.
2. **Mesma altura em duas cordas:** a escala completa tocava a altura duas vezes seguidas. Agora a
   reprodução usa uma instância por altura (a de traste mais baixo); o desenho mostra todas.
3. **Filtro de cordas apagava notas:** a remoção de repetidas acontecia antes do filtro. Se a cópia
   escolhida ficava fora do grupo, a nota desaparecia. Agora o filtro vem primeiro.
4. **Repetições em junções e na virada do ciclo:** a mesma nota soava duas vezes nos encontros de janelas
   (exercícios 4, 5, 6 e 9) e na virada do ciclo. Agora cada ciclo não repete nota seguida.
   Exercícios 2 e 3 mantêm a repetição, que é o próprio exercício.
5. **Destaque incompleto:** a escala completa não destacava toda nota que soava. Agora destaca.

Verificação:

- 73 testes, incluindo: cada altura do grupo é tocada, sem pulo nem repetição, em todas as combinações;
  o filtro de cordas nunca toca nota de fora do grupo; toda nota tocada aparece destacada.
- Chrome real com log de depuração ligado (ajuste "Depuração"): a escala de C no baixo, modo Jônio,
  registra 34 notas por ciclo e a primeira do ciclo seguinte, todas corretas (ver
  `docs/evidencias/testes/execucao-baixo-c.md`).

Regra nova: exercício 1 tem 2n−2 notas por ciclo (sobe e desce sem repetir a nota inicial).

### 2026-10-27 — Investigação: execução por posição (G na 3ª casa da corda E aguda)

Relato: no cartão de posição, ao chegar ao G (corda E aguda, traste 3), o app toca um A a mais.

Verificação:

- Dados: 38.400 posições (todos os instrumentos e variantes, escalas, tons e filtros). Cada posição toca
  todas as alturas da sua janela, nenhuma fora dela, e cada ciclo tem um único ponto de virada (o topo).
- Interface: o cartão foi tocado nota a nota e comparado com a sequência e com o log de depuração. O destaque
  coincide com os dados. Na posição 2 de Dó maior, o G (traste 3) vem subindo para o A (traste 5), que é o
  topo da posição; depois a execução desce. Esse A está dentro do cartão, destacado e no log.
- Conclusão: não foi encontrada nota errada. A dúvida é de expectativa: o G só seria "volta" se fosse o topo
  da posição. Aguardando o cartão e o exercício exatos do relato para conferir o caso específico.

### 2026-10-27 — Correção: escala completa volta em cada limite de posição

Relato: na posição 1 (guitarra, C maior), ao chegar ao limite da posição a escala completa ainda subia uma nota.

Causa: ao corrigir as junções (rodada anterior), a escala completa virou uma varredura contínua, sem voltar
nos limites de cada posição. Isso removeu o encadeamento por posições do desenho original.

Correção:

- **Exercícios 1–3:** a escala completa passa pelas posições em ordem. Sobe até o topo de cada posição,
  volta até a base dela e segue para a próxima, andando sempre por alturas vizinhas (sem pular nem repetir).
  Ao final, sobe até o topo do braço (casas além da última janela) e desce até o início.
- **Exercícios 4–9:** continuam com varredura contínua (pendência: decidir se também devem voltar em cada posição).

Verificação:

- Testes (74): cada topo de posição é seguido de nota mais grave, em todos os instrumentos e variantes;
  a escala completa cobre todas as alturas do braço, incluindo as casas 14 e 15 da guitarra.
- Chrome real (`docs/evidencias/testes/escala-completa-limites-guitarra.md`): guitarra, C maior, exercício 1.
  Ao chegar ao G do traste 3 (limite da posição 1), a execução desce para o F, como esperado.

### 2026-10-27 — Correção: nota da volta fora da janela e log lógica x tela

Relato: a última nota antes da volta na escala completa estava errada.

Causa: na volta de algumas posições, a escala completa usava a instância mais grave da altura, mesmo quando
ela caía fora da janela da posição (ex.: o A da corda 5, traste 0, como base da posição 3, cuja janela é 5–8).
O cartão daquela posição não mostrava a nota da volta.

Correção: dentro de cada posição, a escala completa toca cada altura na casa da própria janela (quando existe).

Log de depuração (ajuste "Depuração"), em dois lados para separar lógica e desenho:

- `[exec]`: a nota que a lógica está tocando (diagrama, número da nota, nome, corda, traste, frequência).
- `[ui]`: a casa que está destacada na tela, lida do DOM.

Verificação: testes (75), incluindo: toda volta no topo de uma posição é tocada numa casa dessa posição.
No Chrome real, guitarra, C maior: 71 notas, lógica e tela coincidem em todas (0 diferenças).

### 2026-10-27 — Investigação: baixo, C jônio, grupos 1–2, posição 1

Relato: na posição 1 (baixo 4 cordas, C jônio, cordas 1–2, subir e descer, 80 BPM), a execução seria
D E F G A C e depois um D a mais.

Verificação (dados e tela, mesma configuração):

- Posição 1 = janela de trastes 0–4: D E F G A B A G F E (10 notas por ciclo). A tela toca essa mesma
  sequência, nota a nota. O topo é o B (traste 4).
- O C do traste 5 da corda G está fora da janela 0–4 (regra de 5 trastes do app.md), por isso não entra
  nesta posição.
- Não há nota extra no ciclo. O D após o E é a volta pela base; o ciclo seguinte começa com D.

Pendência de decisão: se a posição 1 deve incluir o C (traste 5), a janela precisa ser 1–5 ou 0–5,
o que muda a regra de 5 trastes. Aguardando definição do desenho dos shapes.

### 2026-10-27 — Verificação em todas as escalas: limite de posição e saltos

Pergunta: o C depois do B (passar do limite da posição 1) ocorre só no baixo C jônio?

Resultado: ocorre em todas as 16 escalas (480 de 480 combinações por escala). Causa: as janelas das
posições se sobrepõem (2 a 3 trastes). A subida para a posição seguinte passa de novo pelo topo da posição
anterior antes de chegar ao seu próprio topo. Assim, "voltar em cada limite" e "não pular nem repetir
nota" não podem valer ao mesmo tempo com as janelas atuais.

Estado atual do código: ciclos fechados por posição, com junções sem repetição. Essa forma ainda tem
saltos em todas as escalas (83 a 99 combinações por escala). Os testes de continuidade estão falhando por
isso (10 casos).

Decisão pendente: (a) aceitar saltos marcados entre posições; (b) redefinir as janelas para não se
sobreporem (muda o shape das posições); (c) voltar à varredura contínua, sem saltos, com passagem pelos
limites.

### 2026-10-27 — Motor de notas e exercícios reconstruído

Decisão do responsável: manter a parte gráfica e reconstruir o motor de notas e exercícios.

Regras do motor novo (uma só para tudo):

- Um conjunto de notas é tocado pelo exercício escolhido, com cada altura uma vez por passagem.
- Cada cartão de posição é um ciclo fechado: sobe até o topo da janela e volta à base. Nenhuma nota sai da janela.
- A escala completa é uma varredura contínua de todas as alturas do grupo de cordas. Não volta em cada limite
  de posição: com janelas sobrepostas, isso obrigaria a pular ou repetir notas.
- Destaque = notas que realmente soam. As demais notas da escala aparecem como fantasma.

Verificação: 76 testes, incluindo: cada cartão volta no próprio topo; a volta fica dentro da janela; a escala
completa toca cada altura sem pulo nem repetição, em todas as escalas, instrumentos, variantes, tons e filtros.
Caso do relato (baixo, C jônio, grupos 1–2, posição 1): D E F G A B A G F E, sem nota extra.

Pendência: a escala completa não volta em cada limite de posição (escolha do motor). Se for necessário,
redefinir as janelas para não se sobreporem.

### 2026-10-27 — Primeira nota: destaque da nota em execução

Relato: baixo 4 cordas, grupo todas, C pentatônica maior, exercício 1, posição 1: a execução começa no E, mas
a tela mostra o G.

Verificação: dados, log e som no Chrome real começam no E (corda 4, traste 0, 41,20 Hz). O G é a segunda nota.
O erro era visual: o anel verde forte da "próxima nota" chamava mais atenção que a nota que soava (leve
aumento com anel quase invisível).

Correção (gráfica): nota em execução branca, preenchida, maior e com anel verde. Próxima nota só com contorno
verde. Notas raiz continuam verdes, então a cor da nota em execução não se confunde com a raiz.

Evidência: docs/evidencias/testes/primeira-nota-baixo.md e docs/evidencias/telas/primeira-nota-baixo.png.

### 2026-10-27 — Revisão da interface: desafio, contraste e menu de ferramentas

Ordem de execução, da mais grave para a menos grave:

1. **Desafio (acertos falsos):** o juiz agora exige um ataque novo (a energia do sinal sobe) e a altura certa
   em frames seguidos. O eco de uma nota anterior, que só decai, não conta como acerto. Uma nota repetida só
   conta quando é tocada de novo. Testes: 79 passando (eco, repetição, altura errada, janela).
2. **Aviso visível no treino:** barra abaixo da escolha musical quando o desafio está ligado. Mostra
   "Desafio ativo", o aviso "use fones" (sem detecção de fone) ou o erro de microfone. O critério completo do
   acerto aparece nos ajustes.
3. **Contraste:** notas fantasma e rótulos fracos foram clareados nos três temas. Texto secundário e rótulos
   passam de 4,5:1. Notas fantasma passam de 3:1.
4. **Menu Ferramentas:** metrônomo e afinador saem do cabeçalho e ficam num menu com nome visível.

Pendências (não feitas nesta rodada):

- Faixas de visualização do braço (1–7, 5–12): precisam garantir que a nota em execução nunca fique fora da
  faixa visível, senão o aluno ouve uma nota que não vê.
- Abas "Escala" e "Posições": reorganiza a rolagem longa.
- Validação do juiz com instrumento real e microfone: a lógica está testada, mas não foi medida com som real.

### 2026-10-27 — Próximos passos: feedback, cartão e ícone Android

- **Feedback "PERFEITO!" e "ERROU":** fonte maior (15 px) e permanece 0,8 s (antes 0,5 s).
- **Cartão de posição:** trastes numa linha, contagem de notas e ciclo em outra.
- **Ícone do Android:** gerado a partir do mesmo SVG do app nas cinco densidades (`scripts/gerar-icones-android.mjs`).
- **Builds:** APK e Windows (instalador e portátil) regenerados com essas mudanças.
- **Testes:** 79 passando.

Pendências que dependem de decisão ou de aparelho (não avançadas):

- Validar o desafio e o som dos instrumentos com microfone e tablet reais.
- Decidir se as janelas dos shapes mudam (para a escala completa voltar em cada limite de posição).
- Faixas do braço e abas, após a decisão acima.
- Assinatura do Windows e do Android.

### 2026-10-27 — Braço deslizante com as 5 posições

Pedido: as 5 posições num único braço que rola ao trocar de posição.

- **Navegação:** pontos 1 a 5, setas e arrastar sobre o braço (toque). Parado por padrão.
- **Acompanhar a execução (opcional):** o braço rola com a posição que está tocando. Na escala completa, só
  troca de posição no fim de um padrão do exercício (unidade: 1 nota nos exercícios 1, 2, 3, 7 e 8; 3 no 4;
  4 no 5; 2 no 6 e no 9), para não cortar grupo no meio. No cartão de posição, o braço segue a posição que toca.
- **Cabeçalho do braço:** posição, trastes, quantidade de notas por ciclo e ciclo atual.
- **Removido:** a lista de cartões empilhados.

Evidências: docs/evidencias/telas/braco-deslizante-posicao2.png e braco-deslizante-acompanhando.png.
Testes: 80 passando.

Pendências: validar o acompanhamento com exercícios 4 a 9 em execução real; APK e Windows ainda não
regenerados com o braço deslizante.

### 2026-10-27 — Percurso pelas 5 posições na escala completa

Checkpoint antes da mudança: commit `a556226`, tag `checkpoint-braco-deslizante`.

Percurso (escala completa, todos os exercícios):

- Começa no grave do grupo de cordas e sobe até a posição 1.
- Sobe e desce a posição 1, depois a 2, a 3, a 4 e a 5 (cada uma é um ciclo completo, dentro da sua janela).
- Entre duas posições, a passagem anda por alturas vizinhas. Se a forma de uma posição não tem uma altura da
  escala entre duas notas dela (ex.: ukulele com o grupo 3–4), essa altura é preenchida pela nota do grupo.
- Depois da posição 5, sobe até o topo do braço (casas além da última janela) e desce até o grave.

Decisões tomadas (podem ser revistas):

1. Notas compartilhadas por posições sobrepostas são tocadas em cada posição que as contém, porque o percurso precisa delas.
2. Nenhuma altura do grupo é pulada: o percurso passa por todas, em ordem.
3. A volta desce até o grave do grupo, e não só até a base da posição 1.

Verificação: 81 testes passando, incluindo: todas as alturas do grupo tocadas, sem pulo, em todas as
combinações; posições visitadas em ordem (1 a 5).

Pendências: validar o som do percurso no tablet; o script `verificar-execucao-baixo.mjs` ainda espera o
tamanho antigo da escala completa e precisa ser atualizado.

## Status atual (2026-10-27)

| Área | Situação | Evidência |
| --- | --- | --- |
| Tipos (TypeScript) | Sem erros | evidencias/testes/typecheck-resultado.txt |
| Testes automatizados | 42 passando | evidencias/testes/vitest-resultado.txt |
| Telas (6 vistas) | Capturadas, sem estouro horizontal | evidencias/telas/ |
| Funcionalidades | Ajustes, ajuda, backing track, contagem e reprodução capturados | evidencias/telas/funcao-*.png |
| Build web | OK | evidencias/builds/vite-build.txt |
| Build Windows | Instalador e portátil gerados; portátil abre sem falhar | evidencias/builds/resumo-builds.md |
| Build Android | APK gerado com permissões de microfone | evidencias/builds/resumo-builds.md |

## Pendências

- **Escala completa, exercícios 4–9:** ainda sem volta em cada limite de posição. Confirmar se devem seguir o mesmo padrão.

- **Afinador em aparelho real:** a captura do microfone não foi testada com instrumento. Verificar com violão e baixo, em ambiente com ruído.

0. **Teste em aparelhos reais:** celular, tablet e navegadores de iPhone, iPad e Mac (Safari) não foram testados. As telas foram verificadas em 390, 820 e 1440 px no Chrome.
0b. **Mac (aplicativo):** o instalador de macOS só pode ser gerado num Mac. Daqui só é possível gerar o Windows e o Android.
0c. **Tamanho do pacote web:** 320 KB (114 KB comprimido), por causa dos combobox. Aceitável, mas vale acompanhar.

1. **Áudio e microfone em dispositivo real.** Não testados: só a lógica pura e a interface foram verificadas.
   Prioridade alta, principalmente o modo desafio no tablet (latência do microfone no WebView).
2. **Som do baixo, ukulele e cavaco.** A síntese usa as frequências corretas, mas não foi ouvida.
3. **Assinatura.** Windows sem certificado e Android com chave de depuração. Necessário para distribuir.
4. **Posições para instrumentos que não são de 6 cordas.** Usam janelas de 5 trastes, não formas CAGED.
   Decidir se o usuário precisa de formas específicas por instrumento.
5. **Violão e guitarra** têm a mesma afinação. Confirmar se o violão deve ter algum comportamento próprio.

## Responsividade para celular na horizontal (primeira etapa)

- Android travado em paisagem (`sensorLandscape`).
- O app marca `<html class="paisagem-celular">` quando a janela é de paisagem e tem até 500 px de altura.
  `src/styles/celular-paisagem.css` compacta o cabeçalho, põe as escolhas numa faixa de seis colunas,
  recolhe legendas e aumenta a altura do braço. Desktop e retrato não mudam.
- Causa encontrada no WebView do Android: um bloco `@media (prefers-reduced-motion)` ficou sem fechamento
  depois de uma edição antiga do CSS, e tudo que vinha depois (fundo espacial e paisagem) era lido dentro
  dele. Corrigido em `src/styles/apple.css`.
- O WebView do Android não respeitou a camada espacial de fundo. Ela não é renderizada na plataforma nativa.
- Pendente: o valor de velocidade (BPM) ainda fica cortado na paisagem; o retrato ainda não foi revisado.
- Capturas: `docs/evidencias/telas/android-celular-paisagem.png` e `android-celular-retrato.png`.

### Paisagem: seletor compacto e botão de escolhas

- Na paisagem, o seletor de instrumento vai para o cabeçalho, como um controle compacto.
- A faixa de escolhas (tom, escala, variação, grupo, exercício e velocidade) sai da tela e vira um botão
  flutuante no canto. Ao tocar nele, abre uma folha com as escolhas em três colunas.
- Capturas: `android-celular-paisagem.png` (braço em destaque) e `android-celular-escolhas.png` (folha aberta).
- Ainda não revisado: o retrato e os demais instrumentos na paisagem.

### 2026-10-30 — Escala completa mostra o padrão dos exercícios 2 a 15

- **Decisão (escolha do usuário):** a escala completa passa a tocar o padrão de cada exercício, e não mais uma
  varredura contínua. Saltos, oitavas e grupos aparecem como são. Notas de passagem só entram entre posições
  (junção de ciclos), para a escala não ter buracos ao trocar de janela.
- **Exercício 1 não muda:** continua com o zigue-zague e a varredura contínua. Os testes de vizinhança e de
  varredura usam o exercício 1, então continuam valendo.
- **Medição antes da mudança:** cada posição já tinha pares de oitava (guitarra 7–8, baixo 4–5, violão 9–11);
  na escala completa não havia nenhum, porque as notas de passagem separavam os pares.
- **Teste de regressão:** `playback.test.ts`, exercícios 13 a 15: posições com oitavas e escala completa com
  pares de oitava consecutivos.
- **Pendência:** conferir visualmente a escala completa nos exercícios 4 a 12 em aparelho real.
