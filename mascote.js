/*!
 * Gatinha — mascote do app da Erica
 * Motor de animação em WebGL que deforma as ilustrações em aquarela com uma malha.
 * Uso:
 *   <script src="mascote-assets.js"></script>   (imagens embutidas, funciona abrindo direto do disco)
 *   <script src="mascote.js"></script>
 *   <gatinha-mascote pose="clareza"></gatinha-mascote>
 *   const cat = document.querySelector('gatinha-mascote');
 *   cat.setPose('comemoracao');  cat.play('pular');  cat.play('piscar');
 *
 * Coordenadas do RIG estão em pixels da imagem original (1024 × 1536).
 */
(function () {
  'use strict';

  const TEX_W = 1024, TEX_H = 1536;

  /* =========================================================================
   * RIG — um bloco por pose. É aqui que se ajusta/inventa animação.
   *  bones: ossos que giram um pedaço da imagem
   *    base = ponto de articulação, tip = ponta, r = raio de influência
   *    kind 'rigid' = gira tudo além da base (cabeça)
   *    kind 'chain' = curva mais na ponta que na base (rabo, braços)
   *  eyes: olhos abertos que podem piscar [cx, cy, rx, ry, ânguloGraus]
   *  wiggle: regiões que se deslocam (ex.: mão escrevendo) [cx, cy, raio]
   *  ground: centro da sombra no chão [x, y, larguraRaio]
   *  idle: intensidade dos movimentos automáticos
   * ========================================================================= */
  const RIG = {
    'deixar-sair': {
      label: 'Deixar sair',
      ground: [520, 1445, 330],
      bones: {
        head: { base: [512, 735], tip: [512, 300], r: 430, kind: 'rigid' },
        tail: { base: [830, 1390], tip: [905, 985], r: 120, kind: 'chain' },
      },
      eyes: null,
      idle: { breath: 1.4, breathRate: 0.16, tail: 2.5, head: 0.8, blink: false },
      enter: 'suspirar',
    },
    clareza: {
      label: 'Clareza',
      ground: [520, 1445, 330],
      bones: {
        head: { base: [512, 715], tip: [512, 300], r: 430, kind: 'rigid' },
        tail: { base: [830, 1390], tip: [905, 985], r: 120, kind: 'chain' },
      },
      eyes: [[376, 477, 57, 51, 3], [618, 490, 58, 51, 3]],
      idle: { breath: 0.7, breathRate: 0.25, tail: 3.5, head: 0.9, blink: true },
      enter: 'atenta',
    },
    permissao: {
      label: 'Permissão',
      ground: [540, 1470, 330],
      bones: {
        head: { base: [480, 705], tip: [560, 280], r: 420, kind: 'rigid' },
        tail: { base: [855, 1400], tip: [900, 1020], r: 115, kind: 'chain' },
      },
      eyes: [[432, 445, 54, 56, 20], [659, 540, 59, 51, 20]],
      idle: { breath: 0.7, breathRate: 0.22, tail: 3, head: 1.5, blink: true },
      enter: 'inclinar',
    },
    'menor-passo': {
      label: 'Menor passo',
      ground: [520, 1420, 360],
      bones: {
        head: { base: [400, 790], tip: [380, 330], r: 330, kind: 'rigid' },
        tail: { base: [800, 930], tip: [905, 480], r: 120, kind: 'chain' },
      },
      eyes: [[291, 577, 53, 54, 11], [520, 623, 61, 53, 11]],
      idle: { breath: 0.6, breathRate: 0.3, tail: 5, head: 0.9, blink: true, bob: 0.5 },
      enter: 'passinho',
    },
    comemoracao: {
      label: 'Comemoração',
      ground: [520, 1465, 300],
      bones: {
        head: { base: [500, 690], tip: [505, 300], r: 250, kind: 'rigid' },
        tail: { base: [770, 1275], tip: [835, 860], r: 115, kind: 'chain' },
        armL: { base: [262, 735], tip: [122, 395], r: 105, kind: 'chain' },
        armR: { base: [715, 750], tip: [830, 455], r: 105, kind: 'chain' },
      },
      eyes: null,
      idle: { breath: 0.7, breathRate: 0.35, tail: 5, head: 1, blink: false, arms: 2.5 },
      enter: 'festa',
    },
    descanso: {
      label: 'Descanso',
      ground: [525, 1360, 420],
      bones: {
        head: { base: [470, 1010], tip: [440, 640], r: 300, kind: 'rigid' },
      },
      eyes: null,
      idle: { breath: 1.8, breathRate: 0.14, tail: 0, head: 0.5, blink: false },
      enter: null,
    },
    escrita: {
      label: 'Escrita',
      ground: [510, 1447, 330],
      bones: {
        head: { base: [500, 770], tip: [480, 300], r: 400, kind: 'rigid' },
        tail: { base: [865, 1360], tip: [900, 990], r: 110, kind: 'chain' },
      },
      eyes: [[394, 569, 67, 57, 8], [645, 641, 70, 47, 16]],
      wiggle: [[368, 880, 85]],
      idle: { breath: 0.6, breathRate: 0.22, tail: 3, head: 0.8, blink: true, write: 1 },
      enter: 'escrever',
    },
  };

  /* =========================================================================
   * AÇÕES — cada uma é uma função (t em segundos desde o início, p = parâmetros)
   * que soma valores aos parâmetros. Retorna false quando acabou.
   * Parâmetros: breath, sway(graus), jump(px), squash, lid(0..1),
   *             head, tail, armL, armR (graus), wiggleX, wiggleY (px)
   * ========================================================================= */
  const ease = {
    inOut: (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2,
    out: (x) => 1 - Math.pow(1 - x, 3),
    bump: (x) => Math.sin(Math.PI * Math.min(Math.max(x, 0), 1)),
  };

  const ACTIONS = {
    piscar(t, p) {
      const d = 0.24;
      if (t > d) return false;
      p.lid = Math.max(p.lid, t < 0.08 ? t / 0.08 : t < 0.11 ? 1 : 1 - (t - 0.11) / 0.13);
    },
    piscadinha(t, p) { // duas piscadas seguidas
      if (t > 0.6) return false;
      const k = t < 0.3 ? t : t - 0.32;
      if (k >= 0) ACTIONS.piscar(k, p);
    },
    suspirar(t, p) {
      const d = 2.6;
      if (t > d) return false;
      const x = t / d;
      const inhale = x < 0.45 ? ease.inOut(x / 0.45) : 1 - ease.inOut((x - 0.45) / 0.55);
      p.breath += inhale * 3.5;
      p.head += -inhale * 3;
      p.jump += -inhale * 4;
      p.lid = Math.max(p.lid, x > 0.4 && x < 0.9 ? 0.5 * ease.bump((x - 0.4) / 0.5) : 0);
    },
    atenta(t, p) { // "clareza": ergue a cabeça e para
      const d = 0.9;
      if (t > d) return false;
      const x = t / d;
      p.jump += ease.bump(x) * 10;
      p.head += Math.sin(x * Math.PI * 2) * 2 * (1 - x);
      p.squash += -ease.bump(x) * 0.02;
    },
    inclinar(t, p) {
      const d = 1.6;
      if (t > d) return false;
      p.head += ease.bump(t / d) * 4.5;
    },
    curiosa(t, p) { // inclina pra um lado e pro outro
      const d = 2.0;
      if (t > d) return false;
      const x = t / d;
      p.head += Math.sin(x * Math.PI * 2) * 4.5 * ease.bump(x);
    },
    acenar(t, p) { // sim com a cabeça
      const d = 1.0;
      if (t > d) return false;
      p.head += 0; p.nod += Math.sin((t / d) * Math.PI * 4) * 6 * (1 - t / d);
    },
    passinho(t, p) {
      const d = 1.2;
      if (t > d) return false;
      const x = t / d;
      p.shiftX += ease.inOut(Math.min(x * 1.6, 1)) * 14 - (x > 0.62 ? ease.inOut((x - 0.62) / 0.38) * 14 : 0);
      p.jump += Math.abs(Math.sin(x * Math.PI * 3)) * 9;
      
    },
    pular(t, p) {
      const d = 0.75;
      if (t > d) return false;
      const x = t / d;
      if (x < 0.18) p.squash += ease.bump(x / 0.36) * 0.06; // agacha
      else if (x < 0.78) p.jump += ease.bump((x - 0.18) / 0.6) * 55, p.squash -= ease.bump((x - 0.18) / 0.6) * 0.035;
      else p.squash += ease.bump((x - 0.78) / 0.22) * 0.05; // pouso
    },
    festa(t, p) { // pula duas vezes balançando os braços
      const d = 1.6;
      if (t > d) return false;
      ACTIONS.pular(t % 0.8, p);
      const w = Math.sin(t * 14) * 6 * ease.bump(t / d);
      p.armL += w; p.armR -= w;
      p.tail += Math.sin(t * 12) * 6;
    },
    tchau(t, p) { // acena com os braços (pose comemoração) ou com a cabeça
      const d = 1.8;
      if (t > d) return false;
      const w = Math.sin(t * 12) * 7 * ease.bump(t / d);
      p.armR -= w; p.armL += w * 0.4;
      if (!p._hasArms) p.head += w * 0.35;
    },
    abanar(t, p) { // rabo animado
      const d = 1.6;
      if (t > d) return false;
      p.tail += Math.sin(t * 16) * 10 * ease.bump(t / d);
    },
    escrever(t, p) {
      const d = 2.4;
      if (t > d) return false;
      const k = ease.bump(t / d);
      p.wiggleX += Math.sin(t * 15) * 6 * k;
      p.wiggleY += Math.abs(Math.cos(t * 7.5)) * 4 * k;
      p.nod += Math.sin(t * 7.5) * 1.5 * k;
    },
    tremer(t, p) { // "brrr" de frio/susto
      const d = 0.6;
      if (t > d) return false;
      p.sway += Math.sin(t * 60) * 1 * (1 - t / d);
    },
  };

  /* Nomes antigos do index.html anterior continuam funcionando */
  const ALIASES = {
    blink: 'piscar', curious: 'curiosa', sigh: 'suspirar', wave: 'tchau', paw: 'tchau',
    jump: 'pular', nod: 'acenar', wag: 'abanar', write: 'escrever',
  };

  /* ======================= WebGL ======================= */
  const VS = `
  attribute vec2 aPos;
  uniform vec2 uTex;
  uniform float uPad;
  uniform vec4 uBone[6];   // base.xy, tip.xy
  uniform vec4 uBoneP[6];  // r, angle(rad), kind, -
  uniform vec4 uGlobal;    // breathScale, swayRad, jumpPx, squash
  uniform vec4 uGround;    // ground.xy, shiftX, fadeScale
  uniform vec4 uWig;       // c.xy, radius, -
  uniform vec2 uWigOff;
  varying vec2 vUV;
  vec2 rot(vec2 v, float a){ float c=cos(a), s=sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
  void main(){
    vec2 p = aPos;
    vec2 disp = vec2(0.0);
    for (int i=0;i<6;i++){
      float r = uBoneP[i].x;
      if (r <= 0.0) continue;
      vec2 b = uBone[i].xy, axis = uBone[i].zw - b;
      float L = length(axis); vec2 dir = axis / L;
      vec2 d = p - b;
      float along = dot(d, dir) / L;
      float perp = abs(dot(d, vec2(-dir.y, dir.x)));
      float w;
      if (uBoneP[i].z < 0.5) {
        w = smoothstep(-0.18, 0.12, along) * (1.0 - smoothstep(r, r*1.35, perp));
      } else {
        float a = clamp(along, 0.0, 1.25);
        w = smoothstep(0.15, 1.0, a) * (1.0 - smoothstep(r, r*1.7, perp));
        w *= 1.0 - smoothstep(1.08, 1.32, along);
      }
      disp += rot(d, uBoneP[i].y * w) - d;
    }
    p += disp;
    // mão escrevendo
    if (uWig.z > 0.0) {
      float k = 1.0 - smoothstep(uWig.z*0.35, uWig.z, distance(aPos, uWig.xy));
      p += uWigOff * k;
    }
    // respiração: estica pra cima a partir do chão, mais forte no alto do corpo
    vec2 g = uGround.xy;
    float h = clamp((g.y - p.y) / 900.0, 0.0, 1.2);
    p.y = g.y + (p.y - g.y) * (1.0 + uGlobal.x * h);
    p.x = g.x + (p.x - g.x) * (1.0 - uGlobal.x * 0.45 * h);
    // amassar (squash & stretch)
    p.y = g.y + (p.y - g.y) * (1.0 - uGlobal.w);
    p.x = g.x + (p.x - g.x) * (1.0 + uGlobal.w * 0.7);
    // balanço do corpo todo
    p = g + rot(p - g, uGlobal.y);
    p.y -= uGlobal.z;
    p.x += uGround.z;
    // entrada/saída de pose
    p = g + (p - g) * uGround.w;
    vec2 n = (p + vec2(uPad)) / (uTex + vec2(2.0*uPad));
    gl_Position = vec4(n.x*2.0-1.0, 1.0-n.y*2.0, 0.0, 1.0);
    vUV = aPos;
  }`;

  const FS = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif
  uniform sampler2D uImg;
  uniform vec2 uTex;
  uniform float uAlpha;
  uniform vec4 uEye[2];    // cx, cy, rx, ry
  uniform float uEyeA[2];
  uniform float uLid;
  uniform float uShadow;   // >0: desenha sombra
  uniform vec4 uShadowE;   // cx, cy, rx, ry  (já deslocada)
  varying vec2 vUV;
  vec2 rot(vec2 v, float a){ float c=cos(a), s=sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }
  vec4 tex(vec2 px){ return texture2D(uImg, px / uTex); }
  void main(){
    if (uShadow > 0.0) {
      vec2 q = (vUV - uShadowE.xy) / uShadowE.zw;
      float a = (1.0 - smoothstep(0.15, 1.0, length(q))) * uShadow;
      gl_FragColor = vec4(0.33, 0.24, 0.40, 1.0) * a;
      return;
    }
    vec4 col = tex(vUV);
    if (uLid > 0.001) {
      for (int i=0;i<2;i++){
        if (uEye[i].z <= 0.0) continue;
        vec2 c = uEye[i].xy; float rx = uEye[i].z, ry = uEye[i].w, ang = uEyeA[i];
        vec2 q = rot(vUV - c, -ang);
        float u = q.x / rx, v = q.y / ry;
        float rr = length(vec2(u, v));
        if (rr > 1.3) continue;
        float inside = 1.0 - smoothstep(1.08, 1.32, rr);
        // pálpebra de cima desce; quando fecha vira um risquinho curvo pra baixo (sorrindo)
        float edge = mix(-1.2, 0.2, uLid) + uLid * 0.38 * (1.0 - u*u);
        float lowEdge = mix(1.25, edge, uLid * uLid);
        float upper = smoothstep(edge + 0.04, edge - 0.04, v);
        float lower = smoothstep(lowEdge - 0.04, lowEdge + 0.04, v);
        float m = max(upper, lower) * inside;
        // cor da pálpebra = "remendo" suave feito com o pelo em volta do olho
        vec4 acc = vec4(0.0); float wsum = 0.0;
        for (int k=0;k<12;k++){
          float th = float(k) * 0.5235988;
          vec2 rp = vec2(cos(th), sin(th)) * vec2(1.55, 1.5);
          float dd = dot(vec2(u, v) - rp, vec2(u, v) - rp);
          float wk = 1.0 / (dd * dd + 0.02);
          acc += tex(c + rot(vec2(rp.x * rx, rp.y * ry), ang)) * wk; wsum += wk;
        }
        vec4 fur = acc / wsum;
        
        col = mix(col, fur, m);
        // cílios na borda da pálpebra
        float ld = abs(v - edge) * ry;
        float lash = (1.0 - smoothstep(1.4 + uLid*0.8, 3.8 + uLid*1.2, ld)) * (1.0 - smoothstep(0.82, 1.02, abs(u)));
        lash *= smoothstep(0.05, 0.3, uLid) * inside;
        col = mix(col, vec4(0.25, 0.17, 0.29, 1.0), lash * 0.88);
      }
    }
    gl_FragColor = col * uAlpha;
  }`;

  function compile(gl, type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  function loadImage(src) {
    return new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = () => rej(new Error('Não carregou ' + src));
      im.src = src;
    });
  }

  class GatinhaMascote extends HTMLElement {
    static get observedAttributes() { return ['pose']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>:host{display:block;aspect-ratio:2/3;position:relative}
        canvas{width:100%;height:100%;display:block}</style><canvas></canvas>`;
      this.canvas = root.querySelector('canvas');
      this.rig = RIG; this.actions = ACTIONS;
      this.poseName = this.getAttribute('pose') || 'clareza';
      this.prevPose = null; this.fadeT = 1;
      this.running = []; this.nextBlink = 1.5; this.time = 0;
      this.textures = {};
      this.basePath = this.getAttribute('src-base') || 'assets/poses/';
      this.ready = this._init();
    }

    attributeChangedCallback(n, o, v) { if (n === 'pose' && v && o !== v && this.gl) this.setPose(v); }

    async _init() {
      const gl = this.canvas.getContext('webgl2', { premultipliedAlpha: true, alpha: true, antialias: true })
              || this.canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true });
      if (!gl) { this.shadowRoot.innerHTML += '<p>WebGL indisponível</p>'; return; }
      this.gl = gl; this.isGL2 = typeof WebGL2RenderingContext !== 'undefined' && gl instanceof WebGL2RenderingContext;
      const prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      gl.useProgram(prog);
      this.prog = prog;
      const U = (n) => gl.getUniformLocation(prog, n);
      this.u = {
        tex: U('uTex'), pad: U('uPad'), bone: U('uBone'), boneP: U('uBoneP'), global: U('uGlobal'),
        ground: U('uGround'), wig: U('uWig'), wigOff: U('uWigOff'), img: U('uImg'), alpha: U('uAlpha'),
        eye: U('uEye'), eyeA: U('uEyeA'), lid: U('uLid'), shadow: U('uShadow'), shadowE: U('uShadowE'),
      };
      // malha 48 × 72
      const NX = 48, NY = 72, verts = [], idx = [];
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) verts.push(i / NX * TEX_W, j / NY * TEX_H);
      for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
        const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
      this.nIdx = idx.length;
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
      const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform2f(this.u.tex, TEX_W, TEX_H);
      gl.uniform1f(this.u.pad, 110);
      gl.uniform1i(this.u.img, 0);

      await Promise.all(Object.keys(RIG).map((n) => this._loadTexture(n)));
      this._resize();
      new ResizeObserver(() => this._resize()).observe(this);
      this._last = performance.now();
      const loop = (now) => { this._frame(now); this._raf = requestAnimationFrame(loop); };
      this._raf = requestAnimationFrame(loop);
      this.dispatchEvent(new CustomEvent('ready'));
    }

    async _loadTexture(name) {
      const gl = this.gl;
      const src = (window.MASCOTE_ASSETS && window.MASCOTE_ASSETS[name]) || (this.basePath + name + '.webp');
      const im = await loadImage(src);
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (this.isGL2) {
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      } else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      this.textures[name] = t;
    }

    _resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      const w = Math.max(1, Math.round(this.clientWidth * dpr)), h = Math.max(1, Math.round(this.clientHeight * dpr));
      if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
      this.gl && this.gl.viewport(0, 0, w, h);
    }

    /* ---------- API pública ---------- */
    get poses() { return Object.keys(RIG); }
    get actionNames() { return Object.keys(ACTIONS); }

    setPose(name, { playEnter = true } = {}) {
      if (!RIG[name]) { console.warn('Pose desconhecida:', name); return; }
      if (name === this.poseName && this.fadeT >= 1) { if (playEnter && RIG[name].enter) this.play(RIG[name].enter); return; }
      this.prevPose = this.poseName; this.poseName = name; this.fadeT = 0;
      this.running = this.running.filter((r) => r.name === 'piscar');
      this.setAttribute('pose', name);
      if (playEnter && RIG[name].enter) setTimeout(() => this.play(RIG[name].enter), 180);
      this.dispatchEvent(new CustomEvent('pose', { detail: name }));
    }

    /** Toca uma ação ou troca de pose. Retorna uma Promise que resolve quando termina. */
    play(name) {
      name = ALIASES[name] || name;
      if (RIG[name]) { this.setPose(name); return Promise.resolve(); }
      const fn = ACTIONS[name];
      if (!fn) { console.warn('Ação desconhecida:', name); return Promise.resolve(); }
      return new Promise((resolve) => this.running.push({ name, fn, t0: this.time, resolve }));
    }

    /** Registra uma ação nova: cat.addAction('girar', (t, p) => { ...; if (t > 1) return false; }) */
    addAction(name, fn) { ACTIONS[name] = fn; }

    /* ---------- quadro a quadro ---------- */
    _params(poseName, time, includeActions) {
      const rig = RIG[poseName], id = rig.idle;
      const p = { breath: 0, sway: 0, jump: 0, squash: 0, lid: 0, head: 0, nod: 0, tail: 0, armL: 0, armR: 0,
                  wiggleX: 0, wiggleY: 0, shiftX: 0, _hasArms: !!rig.bones.armL };
      // movimentos automáticos (idle)
      const br = Math.sin(time * Math.PI * 2 * id.breathRate);
      p.breath += br * id.breath;
      p.head += Math.sin(time * 0.7) * id.head + Math.sin(time * 0.31 + 1) * id.head * 0.5;
      p.tail += Math.sin(time * 1.9) * id.tail + Math.sin(time * 0.83) * id.tail * 0.4;
      if (id.bob) p.jump += Math.abs(Math.sin(time * 1.6)) * 3 * id.bob;
      if (id.arms) { p.armL += Math.sin(time * 2.4) * id.arms; p.armR -= Math.sin(time * 2.4 + 0.6) * id.arms; }
      if (id.write) {
        const on = (Math.sin(time * 0.9) > -0.2) ? 1 : 0;
        p.wiggleX += Math.sin(time * 13) * 3.5 * on * id.write;
        p.wiggleY += Math.abs(Math.cos(time * 6.5)) * 3 * on * id.write;
      }
      if (includeActions) {
        this.running = this.running.filter((r) => {
          const res = r.fn(this.time - r.t0, p);
          if (res === false) { r.resolve(); return false; }
          return true;
        });
      }
      return p;
    }

    _draw(poseName, p, alpha, scale) {
      const gl = this.gl, u = this.u, rig = RIG[poseName];
      const D = Math.PI / 180;
      const bones = new Float32Array(24), bp = new Float32Array(24);
      let k = 0;
      for (const [bn, b] of Object.entries(rig.bones)) {
        let ang = 0;
        if (bn === 'head') ang = p.head + p.nod * 0.4;
        else ang = p[bn] || 0;
        bones.set([b.base[0], b.base[1], b.tip[0], b.tip[1]], k * 4);
        bp.set([b.r, ang * D, b.kind === 'rigid' ? 0 : 1, 0], k * 4);
        k++;
      }
      gl.uniform4fv(u.bone, bones); gl.uniform4fv(u.boneP, bp);
      const g = rig.ground;
      gl.uniform4f(u.global, p.breath * 0.0035, p.sway * D, p.jump + p.nod * 1.2, p.squash);
      gl.uniform4f(u.ground, g[0], g[1], p.shiftX, scale);
      if (rig.wiggle) { const w = rig.wiggle[0]; gl.uniform4f(u.wig, w[0], w[1], w[2], 0); }
      else gl.uniform4f(u.wig, 0, 0, 0, 0);
      gl.uniform2f(u.wigOff, p.wiggleX, p.wiggleY);

      // sombra no chão
      gl.uniform1f(u.shadow, 0.22 * alpha * Math.max(0.35, 1 - p.jump / 120));
      const sw = g[2] * (1 - Math.min(p.jump, 90) / 260) * (1 + p.squash);
      gl.uniform4f(u.shadowE, g[0] + p.shiftX, g[1], sw, sw * 0.13);
      gl.uniform1f(u.alpha, 1);
      gl.drawElements(gl.TRIANGLES, this.nIdx, gl.UNSIGNED_SHORT, 0);
      gl.uniform1f(u.shadow, 0);

      const e = rig.eyes;
      if (e) {
        gl.uniform4fv(u.eye, new Float32Array([...e[0].slice(0, 4), ...e[1].slice(0, 4)]));
        gl.uniform1fv(u.eyeA, new Float32Array([e[0][4] * D, e[1][4] * D]));
        gl.uniform1f(u.lid, Math.min(1, p.lid));
      } else gl.uniform1f(u.lid, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.textures[poseName]);
      gl.uniform1f(u.alpha, alpha);
      gl.drawElements(gl.TRIANGLES, this.nIdx, gl.UNSIGNED_SHORT, 0);
    }

    _frame(now) {
      const dt = Math.min(0.05, (now - this._last) / 1000); this._last = now;
      this.time += dt;
      const gl = this.gl;
      // piscar sozinha
      const rig = RIG[this.poseName];
      if (rig.idle.blink && rig.eyes) {
        this.nextBlink -= dt;
        if (this.nextBlink <= 0) {
          this.play(Math.random() < 0.18 ? 'piscadinha' : 'piscar');
          this.nextBlink = 2.2 + Math.random() * 3.5;
        }
      }
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      if (this.fadeT < 1) this.fadeT = Math.min(1, this.fadeT + dt / 0.42);
      const f = ease.inOut(this.fadeT);
      if (this.prevPose && this.fadeT < 1) {
        const pp = this._params(this.prevPose, this.time, false);
        this._draw(this.prevPose, pp, 1 - f, 1 - 0.04 * f);
      }
      const p = this._params(this.poseName, this.time, true);
      const pop = this.fadeT < 1 ? 0.96 + 0.04 * ease.out(this.fadeT) + Math.sin(this.fadeT * Math.PI) * 0.015 : 1;
      this._draw(this.poseName, p, f, pop);
    }

    disconnectedCallback() { cancelAnimationFrame(this._raf); }
  }

  GatinhaMascote.RIG = RIG;
  GatinhaMascote.ACTIONS = ACTIONS;
  if (!customElements.get('gatinha-mascote')) customElements.define('gatinha-mascote', GatinhaMascote);
})();
