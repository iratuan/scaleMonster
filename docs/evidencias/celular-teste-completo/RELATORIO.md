# Teste no celular (Motorola Edge 20 Pro, Android 13) — relatório parcial

APK: `release/Tutor-de-Escalas-1.0.0-android.apk` (instalado com `adb install -r`).
Orientação: paisagem (o manifest trava em `sensorLandscape`).

| # | Passo | Resultado | Evidência |
|---|-------|-----------|-----------|
| 1 | Abertura do app (após desbloqueio) | OK, instrumento do estado salvo (baixo) | 01-inicio.png |
| 2 | Escala completa: play | OK, contagem regressiva e depois tocando, nota destacada avança | 02/03 (captura defasada, ver nota) |
| 3 | Escala completa: parar | OK, botão volta ao play branco | 04 e 06 |
| 4 | Posição 1: play, depois parar | OK, cartão destacado, botão vira stop | 07, 08 |
| 5 | Ajustes (folha abre e mostra opções) | OK | 09-ajustes.png |
| 6 | Fechar ajustes, ferramentas, ajuda, ideia de harmonia | NÃO CONCLUÍDO: celular desconectou do adb | — |

**Forma do botão de play (correção do oval):** verificada em paisagem no celular, botão circular (~89 px) — ver conversa anterior.

**Limitações:**
- Um `screencap` leva vários segundos, então algumas capturas (02, 03, 04) saíram em momentos diferentes do esperado. A 04 mostra a contagem regressiva, não a parada.
- Não foi possível coletar o log do Android (logcat) porque o celular desconectou.
- Configurações alteradas no celular para o teste, a restaurar: `stay_on_while_plugged_in` (estava 0), `screen_off_timeout` (1800000 ms), `user_rotation` (1).
