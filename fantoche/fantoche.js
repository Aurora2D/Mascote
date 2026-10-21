/*!
 * Gatinha — versão FANTOCHE (peças separadas)
 * Cada parte (corpo, cabeça, orelhas, rabo, patas, olhos, boca) é uma imagem própria
 * que só gira/move/troca. Nada é deformado.
 *
 *   <script src="fantoche-assets.js"></script>
 *   <script src="fantoche.js"></script>
 *   <gatinha-fantoche id="cat"></gatinha-fantoche>
 *   cat.play('tchau');  cat.play('feliz');  cat.setFace({ olhos: 'brilhantes' });
 *
 * Coordenadas em pixels de uma tela de 1024 × 1536.
 */
(function () {
  'use strict';

  const W = 1024, H = 1536;
  const NECK = [505, 716];      // pivô da cabeça
  const GROUND = [510, 1455];   // pivô da respiração / chão

  /* ---------- MONTAGEM: onde cada peça fica (centro, largura) e onde gira (pivot) ----------
   * Proporções medidas no desenho original da gatinha.
   * group: 'root' = acompanha o corpo; 'head' = acompanha a cabeça
   * Ordem do array = ordem de desenho (de trás pra frente). */
  const PARTS = [
    { id: 'rabo',       img: 'rabo',           cx: 880, cy: 1195, w: 200, pivot: [825, 1410], group: 'root' },
    { id: 'orelhaEsq',  img: 'orelha-esq',     cx: 305, cy: 300,  w: 255, pivot: [365, 440],  group: 'head' },
    { id: 'orelhaDir',  img: 'orelha-dir',     cx: 700, cy: 305,  w: 265, pivot: [630, 435],  group: 'head' },
    { id: 'corpo',      img: 'corpo',          cx: 510, cy: 1075, w: 730, group: 'root' },
    { id: 'patasTras',  img: 'patas-tras',     cx: 505, cy: 1345, w: 470, group: 'root' },
    { id: 'pataEsq',    img: 'pata-esq',       cx: 440, cy: 1062, w: 300, pivot: [440, 700],  group: 'root' },
    { id: 'pataDir',    img: 'pata-dir',       cx: 580, cy: 1058, w: 245, pivot: [580, 700],  group: 'root' },
    { id: 'pataLevantada', img: 'pata-levantada', cx: 705, cy: 800, w: 350, pivot: [615, 985], group: 'root' },
    { id: 'cabeca',     img: 'cabeca',         cx: 505, cy: 478,  w: 615, group: 'head' },
    { id: 'bochechas',  img: 'bochechas',      cx: 506, cy: 562,  w: 415, group: 'head' },
    { id: 'olhos',      slot: 'olhos', group: 'head' },
    { id: 'boca',       slot: 'boca',  group: 'head' },
  ];

  /* Variações de olhos e boca (já calibradas pra caber no mesmo lugar) */
  const SLOTS = {
    olhos: {
      abertos:    { img: 'olhos-abertos',    cx: 508, cy: 485, w: 462 },
      meio:       { img: 'olhos-meio',       cx: 507, cy: 490, w: 464 },
      fechados:   { img: 'olhos-fechados',   cx: 508, cy: 493, w: 380 },
      felizes:    { img: 'olhos-felizes',    cx: 508, cy: 485, w: 412 },
      brilhantes: { img: 'olhos-brilhantes', cx: 508, cy: 485, w: 449 },
      cima:       { img: 'olhos-cima',       cx: 508, cy: 485, w: 405 },
    },
    boca: {
      sorriso: { img: 'boca-sorriso', cx: 505, cy: 606, w: 170 },
      aberta:  { img: 'boca-aberta',  cx: 505, cy: 626, w: 190 },
      o:       { img: 'boca-o',       cx: 505, cy: 618, w: 85 },
    },
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
      s.pata += Math.sin(t * 11) * 12 * up;
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
    nao(t, s) {
      const d = 1.1; if (t > d) return false;
      s.cabeca += Math.sin((t / d) * Math.PI * 4) * 6 * (1 - t / d);
    },
  };

  const ALIASES = { blink: 'piscar', curious: 'curiosa', sigh: 'suspirar', wave: 'tchau', paw: 'tchau', happy: 'feliz', jump: 'pular', wag: 'abanar' };

  function loadImage(src) {
    return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(src)); i.src = src; });
  }

  class GatinhaFantoche extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>:host{display:block;aspect-ratio:2/3}canvas{width:100%;height:100%;display:block}</style><canvas></canvas>`;
      this.canvas = root.querySelector('canvas');
      this.ctx = this.canvas.getContext('2d');
      this.imgs = {}; this.running = []; this.time = 0; this.nextBlink = 1.2; this.nextEar = 4;
      this.face = { olhos: 'abertos', boca: 'sorriso' };
      this.basePath = this.getAttribute('src-base') || 'assets/pecas/';
      this.ready = this._init();
    }

    async _init() {
      const names = new Set(PARTS.filter((p) => p.img).map((p) => p.img));
      Object.values(SLOTS).forEach((v) => Object.values(v).forEach((o) => names.add(o.img)));
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
      this.canvas.width = Math.max(1, Math.round(this.clientWidth * dpr));
      this.canvas.height = Math.max(1, Math.round(this.clientHeight * dpr));
    }

    /* ---------- API ---------- */
    play(name) {
      name = ALIASES[name] || name;
      const fn = ACTIONS[name];
      if (!fn) { console.warn('Ação desconhecida:', name); return Promise.resolve(); }
      return new Promise((resolve) => this.running.push({ fn, t0: this.time, resolve }));
    }
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
      };
      this.running = this.running.filter((r) => {
        if (r.fn(this.time - r.t0, s) === false) { r.resolve(); return false; }
        return true;
      });
      return s;
    }

    _drawImg(name, cx, cy, w, alpha = 1) {
      const im = this.imgs[name]; if (!im || alpha <= 0) return;
      const h = w * im.height / im.width;
      const c = this.ctx; const a = c.globalAlpha;
      c.globalAlpha = a * alpha;
      c.drawImage(im, cx - w / 2, cy - h / 2, w, h);
      c.globalAlpha = a;
    }

    _frame(now) {
      const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now; this.time += dt;
      // piscar e mexer orelha sozinha
      if ((this.nextBlink -= dt) <= 0) { this.play('piscar'); this.nextBlink = 2.2 + Math.random() * 3.5; if (Math.random() < 0.2) setTimeout(() => this.play('piscar'), 300); }
      if ((this.nextEar -= dt) <= 0) { this.play('orelhas'); this.nextEar = 5 + Math.random() * 7; }

      const s = this._state();
      const c = this.ctx, D = Math.PI / 180;
      const k = this.canvas.width / W;
      c.setTransform(1, 0, 0, 1, 0, 0);
      c.clearRect(0, 0, this.canvas.width, this.canvas.height);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';

      // sombra
      c.setTransform(k, 0, 0, k, 0, 0);
      const sh = 1 - Math.min(s.pulo, 80) / 200;
      c.fillStyle = 'rgba(84,62,102,0.16)';
      c.beginPath(); c.ellipse(GROUND[0], GROUND[1], 330 * sh, 34 * sh, 0, 0, Math.PI * 2); c.fill();

      // transformação do corpo (respiração, pulo, amassar)
      const sy = 1 + s.respira * 0.008 - s.amassa;
      const sx = 1 - s.respira * 0.003 + s.amassa * 0.6;
      const rootM = new DOMMatrix().translate(GROUND[0], GROUND[1] - s.pulo).scale(sx, sy).translate(-GROUND[0], -GROUND[1]);
      const headM = rootM.translate(NECK[0], NECK[1] + s.cabecaY).rotate(s.cabeca).translate(-NECK[0], -NECK[1]);
      const base = new DOMMatrix().scale(k, k);

      for (const p of PARTS) {
        const g = base.multiply(p.group === 'head' ? headM : rootM);
        let m = g;
        let ang = 0, alpha = 1;
        if (p.id === 'rabo') ang = s.rabo;
        if (p.id === 'orelhaEsq') ang = s.orelhaEsq;
        if (p.id === 'orelhaDir') ang = s.orelhaDir;
        if (p.id === 'pataLevantada') { ang = s.pata + (1 - s.pataLevantada) * 35; alpha = s.pataLevantada; }
        if (p.id === 'pataDir') alpha = 1 - s.pataLevantada;
        if (p.id === 'bochechas') alpha = s.bochechas * 0.9;
        if (ang && p.pivot) m = g.translate(p.pivot[0], p.pivot[1]).rotate(ang).translate(-p.pivot[0], -p.pivot[1]);
        c.setTransform(m);
        if (p.slot) {
          const v = SLOTS[p.slot][s[p.slot]] || SLOTS[p.slot][Object.keys(SLOTS[p.slot])[0]];
          this._drawImg(v.img, v.cx, v.cy, v.w);
        } else this._drawImg(p.img, p.cx, p.cy, p.w, alpha);
      }
    }

    disconnectedCallback() { cancelAnimationFrame(this._raf); }
  }

  GatinhaFantoche.PARTS = PARTS; GatinhaFantoche.SLOTS = SLOTS; GatinhaFantoche.ACTIONS = ACTIONS;
  if (!customElements.get('gatinha-fantoche')) customElements.define('gatinha-fantoche', GatinhaFantoche);
})();
