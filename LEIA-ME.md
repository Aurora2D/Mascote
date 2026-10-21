# Gatinha — mascote do app da Erica

Abra o **index.html** (duplo clique já funciona) para ver a gatinha e testar as poses e ações.

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
