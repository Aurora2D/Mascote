# Gatinha da Erica — orientações para o Claude

Este repositório é o **mascote do app da Erica**: uma gatinha tricolor em aquarela (manchas rosa e lilás,
olho âmbar à esquerda da imagem e azul à direita), animada como um **fantoche**. Cada parte do corpo é uma
imagem separada que só gira, se move ou é trocada. Nada é deformado. O dono do repositório é o Thiago
(conta Aurora2D) e a Erica (ericahotts) é colaboradora. O app onde a gatinha vai morar é o DIVA
(github.com/Aurora2D/DIVA).

Converse em português do Brasil. O Thiago prefere ser guiado passo a passo em tarefas técnicas.

## Arquivos

| Arquivo | O que é |
|---|---|
| `index.html` | Página de apresentação: botões de pose, expressões e gestos. Abre com duplo clique. |
| `fantoche.js` | O motor inteiro: montagem das peças, poses, expressões, ações e desenho no `<canvas>`. Sem bibliotecas. |
| `fantoche-assets.js` | Todas as peças em base64 (`window.FANTOCHE_ASSETS`). Existe para a página funcionar aberta direto do disco, sem servidor. |
| `assets/pecas/*.webp` | As mesmas peças soltas. As da pose escrita começam com `e-`. |
| `LEIA-ME.md` | Manual de uso para pessoas (API, ações, como criar ação nova). |

**Sempre que trocar ou adicionar uma imagem em `assets/pecas/`, regenere a entrada correspondente em
`fantoche-assets.js`.** Senão a página continua mostrando a imagem antiga. Exemplo em Python:

```python
import base64, re
nome = 'e-cabeca'
js = open('fantoche-assets.js').read()
b64 = base64.b64encode(open(f'assets/pecas/{nome}.webp', 'rb').read()).decode()
novo = f'"{nome}":"data:image/webp;base64,{b64}"'
js = re.sub(rf'"{nome}":"[^"]*"', novo, js) if f'"{nome}":' in js else js.rstrip().rstrip('};').rstrip() + f'\n{novo},\n}};\n'
open('fantoche-assets.js', 'w').write(js)
```

## Como o motor funciona (`fantoche.js`)

- **Tela de montagem:** 1024 × 1536 px. Todas as coordenadas do código estão nessa escala, e o canvas escala para o tamanho real.
- **`POSES`:** uma entrada por pose (`sentada`, `escrita`), cada uma com:
  - `parts`: lista de peças, desenhadas na ordem do array (de trás pra frente). Cada peça tem `img`, centro `cx`/`cy`, largura `w`, ponto de giro `pivot`, inclinação fixa `rot` e `group` (`'root'` acompanha o corpo, `'head'` acompanha a cabeça).
  - `slots`: variações trocáveis de `olhos` e `boca`. `img: null` significa "não desenha nada", porque a expressão já está pintada na cabeça.
  - `neck` (pivô da cabeça), `ground` (chão: pivô da respiração e centro da sombra) e `shadow` (largura da sombra).
  - `fallback`: qual expressão usar quando a pose não tem a pedida. Exemplo: na escrita, `felizes` vira `fechados`.
  - Opcionais: `scale` (tamanho da pose no quadro), `earScale` (reduz a mexida das orelhas), `tailRange: [min, max]` (faixa em graus em que o rabo balança) e `write: true` (escrita automática).
- **`ACTIONS`:** cada ação é `função(t, s)`. `t` são os segundos desde o início e `s` é o estado do quadro. A função soma valores ao estado e retorna `false` quando termina. Estado disponível: `cabeca`, `orelhaEsq`, `orelhaDir`, `rabo`, `pata` (graus), `cabecaY`, `pulo`, `escritaX`, `escritaY` (px), `respira`, `amassa`, `olhos`, `boca`, `bochechas` (0 a 1), `pataLevantada` (0 a 1) e `escrevendo`.
- **Movimentos automáticos:** respirar, cabeça, rabo, piscar e mexer orelha ficam em `_state()` e `_frame()`.
- **Troca de pose:** cada pose é desenhada num buffer e as duas são misturadas por uns 0,45 s.
- **API:** `cat.setPose('escrita')`, `cat.play('tchau')` (retorna uma Promise), `cat.setFace({olhos, boca})`, `cat.addAction(nome, fn)`.

## Lições aprendidas (leia antes de mexer nas peças)

1. **Nunca use peças redesenhadas por IA em partes visíveis.** As ferramentas de imagem redesenham mesmo quando o pedido é "só apague": a cabeça volta mais redonda, com olhos menores e outra boca, e a gata fica "deformada". O que funciona é usar os **pixels exatos do desenho original** em tudo o que aparece, e o conteúdo reconstruído **só nas áreas escondidas**, que aparecem quando uma peça se mexe. Foi isso que resolveu a pose escrita (kit v4).
2. **Confira sempre a montagem parada contra o desenho original**, pixel a pixel (diferença perto de zero) e visualmente com zoom. Linhas finas e "aspecto de recorte" aparecem justamente nas emendas.
3. **Teste os extremos do movimento.** Se uma peça abre fresta ou mostra corte ao se mexer, reduza a amplitude naquela pose (`earScale`, `tailRange`), em vez de deixar o defeito. Exemplo: na escrita, o rabo só pode balançar pra dentro, porque pra fora ele se afasta do corpo.
4. **Kits vindos da ferramenta de imagem** costumam trazer: tela inteira 1024 × 1536 (bom, já encaixado), mas às vezes **blocos de fundo branco opaco** e borda sem suavização. Limpe usando o canal alfa do desenho original (`alfa = min(alfa_da_peça, alfa_do_original)`) e suavize a borda em menos de 1 px.
5. **Cada pose tem o próprio desenho de referência.** As peças da pose sentada vieram de gerações separadas e foram encaixadas à mão pelas proporções do desenho original. Os ajustes finos foram pedidos pelo Thiago peça por peça: orelhas inclinadas, patas dianteiras espelhadas, rabo atrás do corpo, mãozinha do tchau na frente da cabeça. Não "corrija" esses valores sem pedir.
6. As medidas que o Thiago pede em "pixels" são pixels da **tela de montagem (1024 de largura)**, não da tela do celular.

## Como trabalhar

- **Depois de cada alteração:** commit e push pro GitHub, para ficar tudo salvo. Antes do push, rode `git pull --rebase`, porque o Thiago e a Erica mexem no mesmo repositório.
- **Mensagens de commit:** em português, dizendo o que mudou e por quê.
- **Antes de entregar,** abra o `index.html` num navegador (ou use Playwright headless) e confira a pose parada e as ações. Uma captura de tela ajuda a mostrar o resultado.

## O que falta (próximos passos)

- **Outras poses:** deixar-sair, clareza, permissão, menor passo, comemoração e descanso. As ilustrações inteiras dessas poses existem nos zips do Thiago, mas cada uma precisa de um kit de camadas como o "Escrita_Kit_v4": corpo sem a cabeça, cabeça sem orelhas, orelhas, rabo, membros que mexem e olhos alternativos. Tudo separado do desenho original da pose, com as partes escondidas reconstruídas, na tela 1024 × 1536, empacotado em zip.
- **Escrita:** os "olhos olhando pro caderno" do kit v4 vieram redesenhados e não foram usados. Se forem refeitos, precisam ser idênticos aos olhos originais, só com a íris e a pupila descidas.
- **Integração no app DIVA:** levar `fantoche.js` e `fantoche-assets.js` para o DIVA e usar `<gatinha-fantoche>` onde a gatinha deve aparecer.
