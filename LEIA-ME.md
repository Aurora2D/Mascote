# Gatinha — mascote do app da Erica

Há duas versões para comparar:

- **Malha** (`index.html`, na raiz): usa as 7 poses inteiras e deforma a imagem de leve. Tem todas as poses.
- **Fantoche** (`fantoche/index.html`): monta a gata sentada com as peças separadas (corpo, cabeça, orelhas, rabo, patas, olhos, boca). As peças só giram, se movem e trocam, sem deformar nada. Por enquanto tem só a pose sentada, mas troca de verdade as expressões (olhos felizes, boca aberta, bochechas, pata levantada).

Duplo clique em qualquer um dos dois já funciona.

## Arquivos
- `mascote.js`: o motor da animação e o **RIG** (configuração de cada pose). É aqui que se mexe.
- `mascote-assets.js`: as 7 ilustrações embutidas no próprio arquivo (por isso funciona sem servidor).
- `assets/poses/*.webp`: as mesmas ilustrações soltas. Se não incluir o `mascote-assets.js`, o motor carrega daqui.
- `index.html`: página de demonstração.

## Como usar no app
```html
<script src="mascote-assets.js"></script>
<script src="mascote.js"></script>

<gatinha-mascote id="cat" pose="clareza" style="width:300px"></gatinha-mascote>

<script>
  const cat = document.getElementById('cat');
  cat.setPose('comemoracao');          // troca de pose (com transição suave)
  cat.play('pular');                   // toca uma ação
  await cat.play('suspirar');          // play() devolve uma Promise: dá pra encadear
</script>
```

**Poses:** `deixar-sair`, `clareza`, `permissao`, `menor-passo`, `comemoracao`, `descanso`, `escrita`

**Ações:** `piscar`, `piscadinha`, `curiosa`, `inclinar`, `acenar` (dizer sim), `suspirar`,
`abanar` (rabo), `pular`, `festa`, `tchau`, `escrever`, `tremer`, `atenta`, `passinho`

Os nomes antigos (`blink`, `curious`, `sigh`, `wave`, `paw`) continuam funcionando.

Sozinha, a gatinha respira, mexe a cabeça, balança o rabo e pisca de vez em quando.

## Criar uma ação nova
Cada ação é uma função que recebe o tempo `t` (em segundos) e os parâmetros `p`, e soma valores neles.
Ela retorna `false` quando termina.
```js
cat.addAction('negar', (t, p) => {
  if (t > 1) return false;
  p.head += Math.sin(t * 20) * 6 * (1 - t);   // balança a cabeça
});
cat.play('negar');
```
Parâmetros disponíveis: `head`, `tail`, `armL`, `armR` (graus), `breath`, `sway` (graus),
`jump` (px), `squash`, `lid` (0 = olho aberto, 1 = fechado), `wiggleX`, `wiggleY` (px, mão que escreve), `shiftX`.

## Adicionar uma pose nova
1. Gere a ilustração inteira no mesmo estilo, em 1024 × 1536 com fundo transparente.
2. Salve em `assets/poses/nome.webp` (e, se quiser, embuta no `mascote-assets.js`).
3. Crie um bloco no `RIG` dentro do `mascote.js` com os pontos em pixels da imagem:
   pescoço e topo da cabeça (`head`), base e ponta do rabo (`tail`), olhos (`eyes`) e centro do chão (`ground`).

## Versão fantoche
```html
<script src="fantoche/fantoche-assets.js"></script>
<script src="fantoche/fantoche.js"></script>
<gatinha-fantoche id="cat" style="width:300px"></gatinha-fantoche>
<script>
  cat.play('tchau');                                // ações
  cat.setFace({ olhos: 'brilhantes', boca: 'o' });  // expressão de repouso
</script>
```
**Ações:** `piscar`, `feliz`, `curiosa`, `brilho`, `suspirar`, `tchau`, `vergonha`, `sim`, `nao`, `abanar`, `orelhas`, `pular`

**Olhos:** `abertos`, `meio`, `fechados`, `felizes`, `brilhantes`, `cima` · **Boca:** `sorriso`, `aberta`, `o`

A posição de cada peça fica na lista `PARTS` do `fantoche.js` (centro, largura e ponto de giro).
