/*!
 * Gatinha — versão FANTOCHE (peças separadas)
 * Cada parte (corpo, cabeça, orelhas, rabo, patas, olhos, boca) é uma imagem própria
 * que só gira/move/troca. Nada é deformado.
 *
 *   <script src="fantoche-assets.js"></script>
 *   <script src="fantoche.js"></script>
 *   <gatinha-fantoche id="cat"></gatinha-fantoche>
 *   cat.play('tchau');  cat.play('feliz');  cat.setFace({ olhos: 'brilhantes' });
 *   cat.setPose('escrita');   // poses: 'sentada', 'escrita', 'permissao', 'comemoracao'
 *
 * Coordenadas em pixels de uma tela de 1024 × 1536.
 */
(function () {
  'use strict';

  const W = 1024, H = 1536;
  /* Folga dos lados (px da tela de montagem): o desenho pode passar da caixa do elemento,
   * pra ponta do rabo não ser cortada quando balança. Não muda tamanho nem lugar da gatinha. */
  const FOLGA = 160;

  /* ---------- MONTAGEM: onde cada peça fica (centro, largura) e onde gira (pivot) ----------
   * Proporções medidas no desenho original da gatinha.
   * group: 'root' = acompanha o corpo; 'head' = acompanha a cabeça
   * Ordem do array = ordem de desenho (de trás pra frente). */
  const PARTS = [
    { id: 'rabo',       img: 'rabo',           cx: 838, cy: 1085, w: 235, pivot: [790, 1330], rot: 8, group: 'root' },
    { id: 'orelhaEsq',  img: 'orelha-esq',     cx: 322, cy: 318,  w: 255, pivot: [375, 450],  rot: -9, group: 'head' },
    { id: 'orelhaDir',  img: 'orelha-dir',     cx: 688, cy: 322,  w: 265, pivot: [625, 445],  rot: 7, group: 'head' },
    // pelo do próprio corpo, escondido sob o queixo: tapa a abertura quando a cabeça sobe ou inclina
    { id: 'pescoco',    img: 'pescoco',        cx: 505.5, cy: 678, w: 379, group: 'root' },
    { id: 'corpo',      img: 'corpo',          cx: 510, cy: 1075, w: 730, group: 'root' },
    { id: 'patasTras',  img: 'patas-tras',     cx: 505, cy: 1335, w: 517, group: 'root' },
    { id: 'pataEsq',    img: 'pata-esq',       cx: 390, cy: 1120, w: 260, pivot: [390, 1120], rot: 6.2, group: 'root' },  // perna mais curta, pé alinhado ao chão
    { id: 'pataDir',    img: 'pata-dir',       cx: 610, cy: 1120, w: 225, pivot: [610, 1120], rot: -2.2, group: 'root' },
    { id: 'cabeca',     img: 'cabeca',         cx: 505, cy: 478,  w: 615, group: 'head' },
    { id: 'bochechas',  img: 'bochechas',      cx: 506, cy: 562,  w: 415, group: 'head' },
    { id: 'olhos',      slot: 'olhos', group: 'head' },
    { id: 'boca',       slot: 'boca',  group: 'head' },
    { id: 'pataLevantada', img: 'pata-levantada', cx: 705, cy: 750, w: 350, pivot: [615, 935], group: 'root' },  // na frente da cabeça
  ];

  /* Variações de olhos e boca (já calibradas pra caber no mesmo lugar) */
  const SLOTS = {
    olhos: {
      abertos:    { img: 'olhos-abertos',    cx: 508, cy: 485, w: 462 },
      meio:       { img: 'olhos-meio',       cx: 507, cy: 490, w: 464 },
      fechados:   { img: 'olhos-fechados',   cx: 508, cy: 493, w: 380 },
      felizes:    { img: 'olhos-felizes',    cx: 508, cy: 485, w: 412 },
      /* 'brilhantes' e 'cima' usam os olhos originais: as peças olhos-brilhantes e olhos-cima vieram
         redesenhadas (sem cílios, contorno mais grosso, outro tamanho) e destoavam no meio das ações.
         As imagens continuam em assets/pecas; se forem refeitas a partir dos pixels originais
         (só com a íris/pupila mexida), é só voltar a apontar pra elas aqui. */
      brilhantes: { img: 'olhos-abertos',    cx: 508, cy: 485, w: 462 },
      cima:       { img: 'olhos-abertos',    cx: 508, cy: 485, w: 462 },
    },
    boca: {
      sorriso: { img: 'boca-sorriso', cx: 505, cy: 606, w: 170 },
      aberta:  { img: 'boca-aberta',  cx: 505, cy: 626, w: 190 },
      o:       { img: 'boca-o',       cx: 505, cy: 618, w: 85 },
    },
  };

  /* ---------- POSE ESCRITA ----------
   * Peças do "Escrita_Kit_v4": separadas do próprio desenho original (sem redesenho), com as partes
   * escondidas reconstruídas por baixo. Olhos fechados: pálpebra pintada com o pelo da testa + risquinho do kit v3. */
  const PARTS_ESCRITA = [
    { id: 'rabo',      img: 'e-rabo',         cx: 809.5, cy: 1186,   w: 429, pivot: [700, 1400], group: 'root' },
    { id: 'base',      img: 'e-base',         cx: 482.5, cy: 1078,   w: 777, group: 'root' },
    { id: 'orelhaEsq', img: 'e-orelha-rosa',  cx: 363.5, cy: 241.5,  w: 367, pivot: [495, 385], group: 'head' },
    { id: 'orelhaDir', img: 'e-orelha-lilas', cx: 787.5, cy: 365,    w: 317, pivot: [675, 485], group: 'head' },
    { id: 'cabeca',    img: 'e-cabeca',       cx: 469,   cy: 557,    w: 794, group: 'head' },
    { id: 'olhos',     slot: 'olhos', group: 'head' },
    { id: 'maoLapis',  img: 'e-mao-lapis',    cx: 298,   cy: 926,    w: 310, group: 'root', move: 'escrita' },
  ];
  const SLOTS_ESCRITA = {
    olhos: {
      abertos:  { img: null },   // os olhos abertos já estão desenhados na cabeça
      meio:     { img: 'e-olhos-meio',     cx: 530,   cy: 598, w: 458 },
      fechados: { img: 'e-olhos-fechados', cx: 515.5, cy: 597, w: 453 },
    },
    boca: { sorriso: { img: null } },
  };

  /* ---------- POSES PERMISSÃO E COMEMORAÇÃO ----------
   * Só o corpo é novo (desenho da pose, sem cabeça e sem rabo, com o pescoço da sentada por baixo).
   * Cabeça, orelhas, expressões e rabo são os da sentada, então todas as caras funcionam igual. */
  const comCorpo = (corpo) => PARTS
    .filter((p) => !['corpo', 'patasTras', 'pataEsq', 'pataDir', 'pataLevantada'].includes(p.id))
    .flatMap((p) => (p.id === 'orelhaDir' ? [p, corpo] : [p]));
  const PARTS_PERMISSAO = comCorpo({ id: 'corpo', img: 'p-corpo', cx: 510.5, cy: 1034, w: 733, group: 'root' });
  const PARTS_COMEMORACAO = (() => {
    const parts = comCorpo({ id: 'corpo', img: 'c-corpo', cx: 516, cy: 933.5, w: 980, group: 'root' });
    // Ampliações discretas das mãos, recortadas diretamente do corpo original para manter a aquarela.
    const bodyIndex = parts.findIndex((p) => p.id === 'corpo');
    parts.splice(bodyIndex + 1, 0,
      { id: 'maoComemoraEsq', img: 'c-mao-esq', cx: 124, cy: 506, w: 218, pivot: [124, 565], rot: -1.5, group: 'root', move: 'maoEsq' },
      { id: 'maoComemoraDir', img: 'c-mao-dir', cx: 908, cy: 506, w: 218, pivot: [908, 565], rot: 1.5, group: 'root', move: 'maoDir' }
    );
    return parts;
  })();

  /* Cada pose: peças, expressões, pivô da cabeça (neck), chão (ground) e
   * "fallback" = qual expressão usar quando a pose não tem a pedida. */
  const POSES = {
    sentada: { label: 'Sentada', parts: PARTS, slots: SLOTS, neck: [505, 716], ground: [510, 1455], shadow: 330,
               fallback: {} },
    escrita: { label: 'Escrevendo', parts: PARTS_ESCRITA, slots: SLOTS_ESCRITA, neck: [470, 830], ground: [515, 1452], shadow: 340, scale: 0.86, earScale: 0.45, tailRange: [-8, 0],
               write: true,
               fallback: { felizes: 'fechados', brilhantes: 'abertos', cima: 'abertos', caderno: 'abertos', aberta: 'sorriso', o: 'sorriso' } },
    // patinhas no peito, logo abaixo do queixo: a cabeça mexe menos pra não descobrir a emenda
    permissao: { label: 'Permissão', parts: PARTS_PERMISSAO, slots: SLOTS, neck: [505, 716], ground: [510, 1455], shadow: 330, headScale: 0.6,
                 fallback: {} },
    comemoracao: { label: 'Comemoração', parts: PARTS_COMEMORACAO, slots: SLOTS, neck: [505, 716], ground: [510, 1455], shadow: 330,
                   fallback: {} },
  };

  const ease = {
    inOut: (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2),
    bump: (x) => Math.sin(Math.PI * Math.min(Math.max(x, 0), 1)),
  };
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  /* ---------- AÇÕES ----------
   * (t = segundos desde o início, s = estado). Somam valores ao estado.
   * Retornam false quando acabam.
   * Estado: cabeca (graus), cabecaY (px), orelhaEsq/orelhaDir/rabo/pata (graus),
   *         respira, pulo (px), amassa, olhos, boca, bochechas (0..1), pataLevantada (0..1) */
  const ACTIONS = {
    piscar(t, s) {
      if (t > 0.22) return false;
      s.olhos = t < 0.05 ? 'meio' : t < 0.13 ? 'fechados' : t < 0.18 ? 'meio' : s.olhos;
    },
    feliz(t, s) {
      const d = 1.8; if (t > d) return false;
      const k = ease.bump(t / d);
      s.olhos = 'felizes'; s.boca = 'aberta';
      s.bochechas = Math.max(s.bochechas, clamp01(k * 2));
      s.pulo += Math.abs(Math.sin(t * 7)) * 14 * k;
      s.cabeca += Math.sin(t * 7) * 3 * k;
      s.rabo += Math.sin(t * 14) * 12 * k;
    },
    curiosa(t, s) {
      const d = 2.2; if (t > d) return false;
      const k = ease.bump(t / d);
      s.cabeca += 10 * k; s.olhos = t > 0.15 && t < d - 0.15 ? 'cima' : s.olhos;
      s.orelhaEsq -= 8 * k; s.orelhaDir += 4 * k;
    },
    suspirar(t, s) {
      const d = 2.6; if (t > d) return false;
      const x = t / d;
      const inhale = x < 0.45 ? ease.inOut(x / 0.45) : 1 - ease.inOut((x - 0.45) / 0.55);
      s.respira += inhale * 3.5;
      s.cabecaY += -inhale * 10 + (x > 0.45 ? ease.bump((x - 0.45) / 0.55) * 8 : 0);
      if (x > 0.3 && x < 0.92) { s.olhos = 'fechados'; s.boca = x > 0.45 ? 'o' : s.boca; }
    },
    brilho(t, s) { // "clareza"
      const d = 1.6; if (t > d) return false;
      const k = ease.bump(t / d);
      s.olhos = 'brilhantes';
      s.pulo += ease.bump(t / 0.5) * 18;
      s.orelhaEsq += 6 * k; s.orelhaDir -= 6 * k;
    },
    tchau(t, s) {
      const d = 2.2; if (t > d) return false;
      const up = clamp01(t / 0.25) * clamp01((d - t) / 0.25);
      s.pataLevantada = Math.max(s.pataLevantada, up);
      s.pata += (4 + Math.sin(t * 11) * 10) * up;  // balança mais pra fora que pra dentro, sem tapar o olho
      s.cabeca += -3 * up; s.boca = 'aberta';
    },
    vergonha(t, s) {
      const d = 2.2; if (t > d) return false;
      const k = ease.bump(t / d);
      s.bochechas = Math.max(s.bochechas, clamp01(k * 2));
      s.olhos = 'meio'; s.cabeca += -6 * k; s.cabecaY += 6 * k;
      s.orelhaEsq += 10 * k; s.orelhaDir -= 10 * k;
    },
    orelhas(t, s) { // mexidinha de orelha
      if (t > 0.5) return false;
      const k = ease.bump(t / 0.5);
      s.orelhaEsq += Math.sin(t * 40) * 9 * k;
    },
    comemorar(t, s) { // pulinhos de alegria; fica melhor na pose 'comemoracao'
      const d = 2.4; if (t > d) return false;
      const k = clamp01(t / 0.2) * clamp01((d - t) / 0.35);
      s.olhos = 'felizes'; s.boca = 'aberta';
      s.bochechas = Math.max(s.bochechas, k);
      s.pulo += Math.abs(Math.sin(t * 7.5)) * 24 * k;
      s.cabeca += Math.sin(t * 7.5) * 3 * k;
      s.rabo += Math.sin(t * 15) * 12 * k;
      s.orelhaEsq += 5 * k; s.orelhaDir -= 5 * k;
    },
    abanar(t, s) {
      const d = 1.6; if (t > d) return false;
      s.rabo += Math.sin(t * 15) * 16 * ease.bump(t / d);
    },
    pular(t, s) {
      const d = 0.75; if (t > d) return false;
      const x = t / d;
      if (x < 0.18) s.amassa += ease.bump(x / 0.36) * 0.05;
      else if (x < 0.78) { s.pulo += ease.bump((x - 0.18) / 0.6) * 60; s.amassa -= ease.bump((x - 0.18) / 0.6) * 0.03; }
      else s.amassa += ease.bump((x - 0.78) / 0.22) * 0.04;
    },
    sim(t, s) {
      const d = 1.0; if (t > d) return false;
      s.cabecaY += Math.sin((t / d) * Math.PI * 4) * 8 * (1 - t / d);
    },
    escrever(t, s) { // escreve com vontade (na pose escrita)
      const d = 3; if (t > d) return false;
      const k = ease.bump(t / d);
      s.escrevendo = 1; s.escritaX += Math.sin(t * 16) * 4 * k; s.escritaY += Math.abs(Math.cos(t * 8)) * 3 * k;
      s.cabeca += Math.sin(t * 8) * 1.2 * k;
    },
    nao(t, s) {
      const d = 1.1; if (t > d) return false;
      s.cabeca += Math.sin((t / d) * Math.PI * 4) * 6 * (1 - t / d);
    },
  };

  const ALIASES = { blink: 'piscar', curious: 'curiosa', sigh: 'suspirar', wave: 'tchau', paw: 'tchau', happy: 'feliz', jump: 'pular', wag: 'abanar', celebrate: 'comemorar' };

  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
  }

  class GatinhaFantoche extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>:host{display:block;aspect-ratio:2/3;position:relative}canvas{position:absolute;top:0;left:${-FOLGA / W * 100}%;width:${(W + 2 * FOLGA) / W * 100}%;height:100%;display:block;pointer-events:none}</style><canvas></canvas>`;
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.imgs = {}; this.running = []; this.time = 0; this.nextBlink = 1.2; this.nextEar = 4;
      this.face = { olhos: 'abertos', boca: 'sorriso' };
      this.poseName = this.getAttribute('pose') || 'sentada'; if (!POSES[this.poseName]) this.poseName = 'sentada';  // pose que ainda não existe cai na sentada
      this.prevPose = null; this.fade = 1;
      this.buf = [document.createElement('canvas'), document.createElement('canvas')];
      this.basePath = this.getAttribute('src-base') || 'assets/pecas/';
      this.ready = this._init();
    }

    async _init() {
      const names = new Set();
      for (const P of Object.values(POSES)) {
        P.parts.forEach((p) => p.img && names.add(p.img));
        Object.values(P.slots).forEach((v) => Object.values(v).forEach((o) => o.img && names.add(o.img)));
      }
      await Promise.all([...names].map(async (n) => {
        const src = (window.FANTOCHE_ASSETS && window.FANTOCHE_ASSETS[n]) || (this.basePath + n + '.webp');
        this.imgs[n] = await loadImage(src);
      }));
      this._resize();
      new ResizeObserver(() => this._resize()).observe(this);
      this._last = performance.now();
      const loop = (now) => { this._frame(now); this._raf = requestAnimationFrame(loop); };
      this._raf = requestAnimationFrame(loop);
      this.dispatchEvent(new CustomEvent('ready'));
    }

    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      this.canvas.width = Math.max(1, Math.round(this.clientWidth * (W + 2 * FOLGA) / W * dpr));
      this.canvas.height = Math.max(1, Math.round(this.clientHeight * dpr));
      for (const b of this.buf) { b.width = this.canvas.width; b.height = this.canvas.height; }
    }

    /* ---------- API ---------- */
    play(name) {
      name = ALIASES[name] || name;
      const fn = ACTIONS[name];
      if (!fn) { console.warn('Ação desconhecida:', name); return Promise.resolve(); }
      return new Promise((resolve) => this.running.push({ fn, t0: this.time, resolve }));
    }
    /** Troca de pose com transição suave: cat.setPose('escrita') */
    setPose(name) {
      if (!POSES[name]) { console.warn('Pose desconhecida:', name); return; }
      if (name === this.poseName) return;
      this.prevPose = this.poseName; this.poseName = name; this.fade = 0;
      this.dispatchEvent(new CustomEvent('pose', { detail: name }));
    }
    get poses() { return Object.keys(POSES); }
    /** Expressão "de repouso": cat.setFace({ olhos: 'brilhantes', boca: 'o' }) */
    setFace(f) { Object.assign(this.face, f); }
    addAction(name, fn) { ACTIONS[name] = fn; }
    get actionNames() { return Object.keys(ACTIONS); }

    /* ---------- quadro a quadro ---------- */
    _state() {
      const t = this.time;
      const s = {
        cabeca: Math.sin(t * 0.8) * 1.6 + Math.sin(t * 0.37) * 0.8,
        cabecaY: 0,
        orelhaEsq: 0, orelhaDir: 0,
        rabo: Math.sin(t * 1.7) * 5 + Math.sin(t * 0.6) * 2,
        pata: 0, respira: Math.sin(t * Math.PI * 2 * 0.25), pulo: 0, amassa: 0,
        olhos: this.face.olhos, boca: this.face.boca, bochechas: 0, pataLevantada: 0,
        escritaX: 0, escritaY: 0, escrevendo: 0,
      };
      // escrita automática: escreve ~5 s olhando o caderno, depois para ~2 s e olha pra frente
      if (POSES[this.poseName].write) {
        const ph = t % 7;
        if (ph < 5) {
          const on = Math.min(1, ph / 0.3, (5 - ph) / 0.3);
          s.escrevendo = on;
          s.escritaX += Math.sin(t * 13) * 3.5 * on;
          s.escritaY += Math.abs(Math.cos(t * 6.5)) * 2.5 * on;
          s.cabeca += Math.sin(t * 6.5) * 0.6 * on;
        }
      }
      this.running = this.running.filter((r) => {
        if (r.fn(this.time - r.t0, s) === false) { r.resolve(); return false; }
        return true;
      });
      if (s.escrevendo > 0.5 && s.olhos === 'abertos') s.olhos = 'caderno';
      return s;
    }

    _drawImg(name, cx, cy, w, alpha = 1) {
      const im = this.imgs[name]; if (!im || alpha <= 0) return;
      const h = w * im.height / im.width;
      const c = this._ctx || this.ctx; const a = c.globalAlpha;
      c.globalAlpha = a * alpha;
      c.drawImage(im, cx - w / 2, cy - h / 2, w, h);
      c.globalAlpha = a;
    }

    /* Deforma o rabo em tiras finas, como uma malha 2D simples. A arte-fonte continua sendo
       o rabo original em aquarela; só deslocamos cada faixa para obter uma curva em S suave. */
    _drawTailMesh(p, matrix, s) {
      const im = this.imgs[p.img]; if (!im) return;
      const c = this._ctx || this.ctx;
      const w = p.w, h = w * im.height / im.width;
      const left = p.cx - w / 2, top = p.cy - h / 2;
      const strips = 72, stripH = im.height / strips;
      const amp = 25 + Math.min(7, Math.abs(s.rabo) * 0.45);
      const phase = (s.rabo || 0) * 0.018;
      c.save(); c.setTransform(matrix);
      for (let i = 0; i < strips; i++) {
        const sy = i * stripH, sh = Math.min(stripH + 1.25, im.height - sy);
        const u = 1 - (sy + sh / 2) / im.height; // 0 na raiz, 1 na ponta
        const curve = (v) => amp * Math.sin(2 * Math.PI * v + phase) * Math.sin(Math.PI * v / 2);
        const offset = curve(u);
        const du = 0.002;
        const slope = (curve(Math.min(1, u + du)) - curve(Math.max(0, u - du))) / (2 * du) * (-1 / h);
        const angle = -Math.atan(slope);
        const dy = top + ((sy + sh / 2) / im.height) * h;
        c.save(); c.translate(p.cx + offset, dy); c.rotate(angle);
        c.drawImage(im, 0, sy, im.width, sh, -w / 2, -(sh / im.height * h) / 2, w, sh / im.height * h + 0.8);
        c.restore();
      }
      c.restore();
    }

    _frame(now) {
      const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now; this.time += dt;
      // piscar e mexer orelha sozinha
      if ((this.nextBlink -= dt) <= 0) { this.play('piscar'); this.nextBlink = 2.2 + Math.random() * 3.5; if (Math.random() < 0.2) setTimeout(() => this.play('piscar'), 300); }
      if ((this.nextEar -= dt) <= 0) { this.play('orelhas'); this.nextEar = 5 + Math.random() * 7; }

      const s = this._state();
      const c = this.ctx;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.fade < 1) this.fade = Math.min(1, this.fade + dt / 0.45);
      if (this.fade >= 1 || !this.prevPose) {
        this._drawPose(c, POSES[this.poseName], s);
      } else { // transição: desenha cada pose num buffer e mistura
        const f = ease.inOut(this.fade);
        const [b0, b1] = this.buf;
        this._drawPose(b0.getContext('2d'), POSES[this.prevPose], s, true);
        this._drawPose(b1.getContext('2d'), POSES[this.poseName], s, true);
        c.globalAlpha = 1 - f; c.drawImage(b0, 0, 0);
        c.globalAlpha = f; c.drawImage(b1, 0, 0);
        c.globalAlpha = 1;
      }
    }

    _drawPose(c, P, s, clear) {
      const k = this.canvas.height / H, fx = FOLGA * k;
      const NECK = P.neck, GROUND = P.ground;
      c.setTransform(1, 0, 0, 1, 0, 0);
      if (clear) c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      this._ctx = c;

      // sombra
      c.setTransform(k, 0, 0, k, fx, 0);
      const sh = 1 - Math.min(s.pulo, 80) / 200;
      c.fillStyle = 'rgba(84,62,102,0.16)';
      c.beginPath(); c.ellipse(GROUND[0], GROUND[1], P.shadow * sh * (P.scale || 1), 34 * sh, 0, 0, Math.PI * 2); c.fill();

      // transformação do corpo (respiração, pulo, amassar)
      const sy = 1 + s.respira * 0.008 - s.amassa;
      const sx = 1 - s.respira * 0.003 + s.amassa * 0.6;
      const rootM = new DOMMatrix().translate(GROUND[0], GROUND[1] - s.pulo).scale(sx, sy).translate(-GROUND[0], -GROUND[1]);
      const hs = P.headScale || 1;
      const headM = rootM.translate(NECK[0], NECK[1] + s.cabecaY * hs).rotate(s.cabeca * hs).translate(-NECK[0], -NECK[1]);
      const ps = P.scale || 1;   // tamanho da pose dentro do quadro
      const base = new DOMMatrix().translate(fx, 0).scale(k, k).translate(GROUND[0], GROUND[1]).scale(ps).translate(-GROUND[0], -GROUND[1]);

      for (const p of P.parts) {
        const g = base.multiply(p.group === 'head' ? headM : rootM);
        let m = g;
        let ang = p.rot || 0, alpha = 1;
        if (p.id === 'rabo' && P.tailRange) { // balança só dentro de uma faixa (ex.: só pra dentro, sem abrir fresta)
          const [lo, hi] = P.tailRange, t01 = Math.min(1, Math.max(0, (s.rabo + 8) / 16));
          ang += lo + (hi - lo) * t01;
        }
        if (p.id === 'orelhaEsq') ang += s.orelhaEsq * (P.earScale || 1);
        if (p.id === 'orelhaDir') ang += s.orelhaDir * (P.earScale || 1);
        if (p.id === 'pataLevantada') { ang += s.pata + (1 - s.pataLevantada) * 35; alpha = s.pataLevantada; }
        if (p.id === 'pataDir') alpha = 1 - s.pataLevantada;
        if (p.id === 'bochechas') alpha = s.bochechas * 0.9;
        if (ang && p.pivot) m = g.translate(p.pivot[0], p.pivot[1]).rotate(ang).translate(-p.pivot[0], -p.pivot[1]);
        if (p.move === 'escrita') m = m.translate(s.escritaX, s.escritaY);
        if (p.move === 'maoEsq') m = g.translate(p.pivot[0], p.pivot[1]).rotate(Math.sin(this.time * 5.2) * 2.8).translate(-p.pivot[0], -p.pivot[1]);
        if (p.move === 'maoDir') m = g.translate(p.pivot[0], p.pivot[1]).rotate(-Math.sin(this.time * 5.2 + 0.6) * 2.8).translate(-p.pivot[0], -p.pivot[1]);
        // rabo em curva (malha) só onde ele pode balançar livre; com tailRange (escrita) a curva abre fresta no corpo
        if (p.id === 'rabo' && !P.tailRange) {
          this._drawTailMesh(p, m, s);
          continue;
        }
        c.setTransform(m);
        if (p.slot) {
          const set = P.slots[p.slot];
          const want = s[p.slot];
          const v = set[want] || set[P.fallback[want]] || set[Object.keys(set)[0]];
          if (v.img) this._drawImg(v.img, v.cx, v.cy, v.w);
        } else this._drawImg(p.img, p.cx, p.cy, p.w, alpha);
      }
    }

    static get observedAttributes() { return ['pose']; }
    attributeChangedCallback(nome, antes, valor) {  // <gatinha-fantoche pose="escrita">: no construtor o atributo ainda não existe
      if (nome !== 'pose' || !valor) return;
      if (!this.prevPose && !this._raf) this.poseName = POSES[valor] ? valor : 'sentada';  // antes do 1º quadro: sem transição
      else if (POSES[valor]) this.setPose(valor);
    }

    disconnectedCallback() { cancelAnimationFrame(this._raf); }
  }

  GatinhaFantoche.POSES = POSES; GatinhaFantoche.PARTS = PARTS; GatinhaFantoche.SLOTS = SLOTS; GatinhaFantoche.ACTIONS = ACTIONS;
  if (!customElements.get('gatinha-fantoche')) customElements.define('gatinha-fantoche', GatinhaFantoche);
})();
