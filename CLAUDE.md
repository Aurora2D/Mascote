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
| `brincar.html` | Página de brincar (a Niquinha): tela cheia, cada toque troca de pose, faz um gesto e mia. |
| `miados.js` | Os miados em base64 (`window.MIADOS`), usados pela `brincar.html`. |
| `assets/sons/*.mp3` | Os mesmos miados soltos: miadinho, miau, miaaau, miu e ronron. |
| `ferramentas/miados.py` | Gera os miados por síntese (gera `.wav`; converta pra `.mp3`, veja o LEIA-ME). |
| `ferramentas/embutir.py` | Regenera `fantoche-assets.js` e `miados.js` a partir das pastas de assets. |
| `LEIA-ME.md` | Manual de uso para pessoas (API, ações, como criar ação nova). |

**Sempre que trocar, adicionar ou apagar uma imagem em `assets/pecas/` ou um som em `assets/sons/`, rode
`python3 ferramentas/embutir.py`** na raiz. Ele regenera `fantoche-assets.js` e `miados.js`; senão a página continua
mostrando a imagem (ou tocando o som) antigo.

## Como o motor funciona (`fantoche.js`)

- **Tela de montagem:** 1024 × 1536 px. Todas as coordenadas do código estão nessa escala, e o canvas escala para o tamanho real.
- **Folga (`FOLGA`, 160 px de cada lado):** o canvas é mais largo que a caixa do elemento e vaza pros lados, sem mudar tamanho nem lugar da gatinha nem empurrar o layout. Existe porque, na pose sentada, a ponta do rabo passa até ~130 px da borda direita no `abanar`. Se um movimento novo for mais longe que isso, aumente a folga em vez de limitar o movimento. Se o elemento estiver dentro de algo com `overflow: hidden`, o corte volta.
- **`POSES`:** uma entrada por pose (`sentada`, `escrita`, `permissao`, `comemoracao`), cada uma com:
  - `parts`: lista de peças, desenhadas na ordem do array (de trás pra frente). Cada peça tem `img`, centro `cx`/`cy`, largura `w`, ponto de giro `pivot`, inclinação fixa `rot` e `group` (`'root'` acompanha o corpo, `'head'` acompanha a cabeça).
  - `slots`: variações trocáveis de `olhos` e `boca`. `img: null` significa "não desenha nada", porque a expressão já está pintada na cabeça.
  - `neck` (pivô da cabeça), `ground` (chão: pivô da respiração e centro da sombra) e `shadow` (largura da sombra).
  - `fallback`: qual expressão usar quando a pose não tem a pedida. Exemplo: na escrita, `felizes` vira `fechados`.
  - Opcionais: `headScale` (quanto a cabeça acompanha os movimentos; 0,6 na permissão), `scale` (tamanho da pose no quadro), `earScale` (reduz a mexida das orelhas), `tailRange: [min, max]` (faixa em graus em que o rabo balança) e `write: true` (escrita automática).
- **`ACTIONS`:** cada ação é `função(t, s)`. `t` são os segundos desde o início e `s` é o estado do quadro. A função soma valores ao estado e retorna `false` quando termina. Estado disponível: `cabeca`, `orelhaEsq`, `orelhaDir`, `rabo`, `pata` (graus), `cabecaY`, `pulo`, `escritaX`, `escritaY` (px), `respira`, `amassa`, `olhos`, `boca`, `bochechas` (0 a 1), `pataLevantada` (0 a 1) e `escrevendo`.
- **Movimentos automáticos:** respirar, cabeça, rabo, piscar e mexer orelha ficam em `_state()` e `_frame()`.
- **Troca de pose:** cada pose é desenhada num buffer e as duas são misturadas por uns 0,45 s.
- **Pose desconhecida:** se o atributo `pose` pedir uma pose que não existe, a gatinha usa a `sentada` (o app pode já pedir poses futuras sem quebrar).
- **Rabo em malha:** sem `tailRange`, o rabo é desenhado por `_drawTailMesh()`, que corta a peça em 72 tiras e desloca cada uma numa curva em S (`amp` controla a amplitude). Com `tailRange` (escrita), volta a girar como peça rígida, porque a curva abria um vão branco entre o rabo e o corpo.
- **Pescoço (`pescoco`):** peça escondida atrás do corpo da sentada que tapa a abertura entre a cabeça e o corpo. É o pelo do próprio `corpo` copiado pra cima (deslocado 40, 80 e 120 px), recortado pelo contorno da cabeça parada (esticado 14 px pra baixo, pra cobrir também a faixa clara sob as pontas do pelo do queixo) e limitado à largura do pescoço (|x − 505| < 190, sem os ombros, que viravam tufos roxos). Parada, só muda essa faixa clara do queixo; quando a cabeça sobe ou inclina, aparece pelo em vez de fundo.
- **Atributo `pose`:** é observado (`attributeChangedCallback`). Não leia atributos no construtor: quando o elemento vem do HTML, eles ainda não existem ali.
- **API:** `cat.setPose('escrita')`, `cat.play('tchau')` (retorna uma Promise), `cat.setFace({olhos, boca})`, `cat.addAction(nome, fn)`.

## Lições aprendidas (leia antes de mexer nas peças)

1. **Nunca use peças redesenhadas por IA em partes visíveis.** As ferramentas de imagem redesenham mesmo quando o pedido é "só apague": a cabeça volta mais redonda, com olhos menores e outra boca, e a gata fica "deformada". O que funciona é usar os **pixels exatos do desenho original** em tudo o que aparece, e o conteúdo reconstruído **só nas áreas escondidas**, que aparecem quando uma peça se mexe. Foi isso que resolveu a pose escrita (kit v4).
2. **Confira sempre a montagem parada contra o desenho original**, pixel a pixel (diferença perto de zero) e visualmente com zoom. Linhas finas e "aspecto de recorte" aparecem justamente nas emendas.
3. **Teste os extremos do movimento.** Se uma peça abre fresta ou mostra corte ao se mexer, reduza a amplitude naquela pose (`earScale`, `tailRange`), em vez de deixar o defeito. Exemplo: na escrita, o rabo só pode balançar pra dentro, porque pra fora ele se afasta do corpo.
4. **Kits vindos da ferramenta de imagem** costumam trazer: tela inteira 1024 × 1536 (bom, já encaixado), mas às vezes **blocos de fundo branco opaco** e borda sem suavização. Limpe usando o canal alfa do desenho original (`alfa = min(alfa_da_peça, alfa_do_original)`) e suavize a borda em menos de 1 px.
5. **Cada pose tem o próprio desenho de referência.** As peças da pose sentada vieram de gerações separadas e foram encaixadas à mão pelas proporções do desenho original. Os ajustes finos foram pedidos pelo Thiago peça por peça: orelhas inclinadas, patas dianteiras espelhadas, rabo atrás do corpo, mãozinha do tchau na frente da cabeça. Não "corrija" esses valores sem pedir.
6. **Patas (out/2026):** as patas dianteiras da sentada foram encurtadas a pedido do Thiago (`pataEsq` w 260, `pataDir` w 225, pés em cy 1120).
7. **Pacotes de fora já recusados:** um zip trouxe a pose "dormindo" (colagem com cabeça sem orelhas e rosto redesenhado) e um novelo de lã que aparecia em todas as poses. Esses dois ficaram de fora pela lição 1. A coleira vermelha com medalhão "DIVA" do mesmo pacote chegou a entrar, mas o Thiago achou que ficou ruim e ela foi tirada. Se voltarem, precisam vir como kit de camadas tirado de um desenho de verdade da pose.
8. As medidas que o Thiago pede em "pixels" são pixels da **tela de montagem (1024 de largura)**, não da tela do celular.

## Poses Permissão e Comemoração (como foram feitas)

- Só o corpo é novo (`p-corpo`, `c-corpo`). Cabeça, orelhas, expressões e rabo são os da sentada (função `comCorpo` no `fantoche.js`), então todas as caras e gestos funcionam igual e a gatinha não "muda de rosto" ao trocar de pose.
- Os desenhos vieram de **edição** da gatinha sentada na ferramenta de imagem (não de geração do zero), com a cabeça e o rabo pedidos idênticos à referência. A da Comemoração saiu com o corpo em "coluna", então a barriga e as patas de trás dela são as da Permissão (as silhuetas batem a poucos pixels) e o meio da barriga foi clareado.
- No corpo novo foram removidos: a cabeça (com folga de 6 px, preenchida com o pelo do próprio desenho do queixo pra baixo), o rabo visível e os bigodes do desenho novo. Por baixo da cabeça fica o corpo da sentada.
- Na permissão as patinhas ficam logo abaixo do queixo, por isso `headScale: 0.6`.
- Ação nova: `comemorar` (pulinhos, olhos felizes, rabo abanando). Combina com a pose `comemoracao`.
- Os desenhos originais das duas poses não estão no repositório; as peças em `assets/pecas/` já são o resultado final.

## Como trabalhar

- **Depois de cada alteração:** commit e push pro GitHub, para ficar tudo salvo. Antes do push, rode `git pull --rebase`, porque o Thiago e a Erica mexem no mesmo repositório.
- **Mensagens de commit:** em português, dizendo o que mudou e por quê.
- **Antes de entregar,** abra o `index.html` num navegador (ou use Playwright headless) e confira a pose parada e as ações. Uma captura de tela ajuda a mostrar o resultado.

## O que falta (próximos passos)

- **Outras poses:** deixar-sair, clareza, menor passo e descanso (permissão e comemoração já existem). Pelo que se viu na trilha, deixar-sair, clareza e menor passo funcionam bem com a sentada e os gestos atuais; o descanso só faz falta quando houver tela pra ele. As ilustrações inteiras dessas poses existem nos zips do Thiago, mas cada uma precisa de um kit de camadas como o "Escrita_Kit_v4": corpo sem a cabeça, cabeça sem orelhas, orelhas, rabo, membros que mexem e olhos alternativos. Tudo separado do desenho original da pose, com as partes escondidas reconstruídas, na tela 1024 × 1536, empacotado em zip.
- **Escrita:** os "olhos olhando pro caderno" do kit v4 vieram redesenhados e não foram usados. Se forem refeitos, precisam ser idênticos aos olhos originais, só com a íris e a pupila descidas.
- **Olhos 'brilhantes' e 'cima' da pose sentada:** as peças `olhos-brilhantes` e `olhos-cima` vieram redesenhadas (sem cílios, contorno mais grosso, tamanho diferente) e destoavam no meio do "clareza" e do "curiosa". Desde 23/out/2026 essas expressões usam os olhos originais. Se forem refeitas, precisam ser idênticas aos olhos abertos, só com a íris e a pupila mexidas.
- **Integração no app DIVA:** levar `fantoche.js` e `fantoche-assets.js` para o DIVA e usar `<gatinha-fantoche>` onde a gatinha deve aparecer.
