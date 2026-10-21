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

**Ações:** `piscar`, `feliz`, `curiosa`, `brilho` (clareza), `suspirar`, `tchau`, `vergonha`, `sim`, `nao`,
`abanar` (rabo), `orelhas`, `pular`

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
