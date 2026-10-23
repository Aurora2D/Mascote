# Gatinha — mascote do app da Erica

Abra o **index.html** (duplo clique já funciona) para ver a gatinha e testar as expressões e os gestos.

A gata é montada como um fantoche: cada parte (corpo, cabeça, orelhas, rabo, patas, olhos, boca, bochechas)
é uma imagem em aquarela separada que só gira, se move ou troca. Nada é deformado.

## Arquivos
- `fantoche.js`: o motor da animação, a montagem das peças (`PARTS`), as expressões (`SLOTS`) e as ações (`ACTIONS`).
- `fantoche-assets.js`: as peças embutidas no próprio arquivo (por isso funciona sem servidor).
- `assets/pecas/*.webp`: as mesmas peças soltas. Se não incluir o `fantoche-assets.js`, o motor carrega daqui.
- `index.html`: página de apresentação.

## Como usar no app
```html
<script src="fantoche-assets.js"></script>
<script src="fantoche.js"></script>

<gatinha-fantoche id="cat" style="width:300px"></gatinha-fantoche>

<script>
  const cat = document.getElementById('cat');
  cat.play('tchau');                                // toca uma ação
  await cat.play('feliz');                          // play() devolve uma Promise: dá pra encadear
  cat.setFace({ olhos: 'brilhantes', boca: 'o' });  // muda a expressão de repouso
</script>
```

**Poses:** `sentada`, `escrita`, `permissao` (patinhas no peito), `comemoracao` (bracinhos pra cima) (troque com `cat.setPose('escrita')`). Pose que não existe vira `sentada`.

Na pose escrita ela escreve sozinha uns 5 segundos olhando o caderno, para, olha pra frente e volta a escrever.

**Ações:** `piscar`, `feliz`, `curiosa`, `brilho` (clareza), `suspirar`, `tchau`, `vergonha`, `sim`, `nao`,
`abanar` (rabo), `orelhas`, `pular`, `escrever`, `comemorar` (pulinhos de alegria; fica melhor na pose `comemoracao`)

**Olhos:** `abertos`, `meio`, `fechados`, `felizes`, `brilhantes`, `cima`
**Boca:** `sorriso`, `aberta`, `o`

Sozinha, a gatinha respira, mexe a cabeça, balança o rabo, mexe a orelha e pisca de vez em quando.

## Criar uma ação nova
Cada ação é uma função que recebe o tempo `t` (em segundos) e o estado `s`, e mexe nos valores.
Ela retorna `false` quando termina.
```js
cat.addAction('dancinha', (t, s) => {
  if (t > 2) return false;
  s.cabeca += Math.sin(t * 8) * 6;     // balança a cabeça
  s.rabo += Math.sin(t * 16) * 14;     // abana o rabo
  s.olhos = 'felizes'; s.boca = 'aberta';
});
cat.play('dancinha');
```
Estado disponível: `cabeca`, `orelhaEsq`, `orelhaDir`, `rabo`, `pata` (graus), `cabecaY`, `pulo` (px),
`respira`, `amassa`, `olhos`, `boca`, `bochechas` (0 a 1), `pataLevantada` (0 a 1).

## Ajustar a montagem
Cada peça em `PARTS` tem centro (`cx`, `cy`), largura (`w`), ponto de giro (`pivot`) e inclinação fixa (`rot`),
em pixels de uma tela de 1024 × 1536.

O desenho tem uma folga invisível dos lados (`FOLGA` no `fantoche.js`): o rabo pode passar da caixa do elemento quando balança, sem ser cortado. Só não coloque a gatinha dentro de algo com `overflow: hidden` se quiser o rabo inteiro.

## Poses
Cada pose fica em `POSES` no `fantoche.js`, com sua lista de peças, expressões, pivô da cabeça (`neck`) e chão (`ground`).
O `fallback` diz qual expressão usar quando a pose não tem a pedida (ex.: na escrita não há olhos "meio fechados", então a piscada usa os fechados).

As peças da escrita começam com `e-` em `assets/pecas/` e vieram do "Escrita_Kit_v4": separadas do próprio desenho
original da pose, sem redesenho, com as partes escondidas reconstruídas por baixo (pescoço sob a cabeça, peito sob o braço,
base do rabo e raízes das orelhas). Os olhos meio fechados são do kit v4; os fechados são uma pálpebra pintada com o pelo
da testa mais o risquinho de olho fechado do kit v3.
