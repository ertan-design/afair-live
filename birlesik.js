// 50.000 slot: WebGL2 nokta bulutu. Kapı (ızgara) ve Podyum (sarmal) arasında GPU'da biçim değiştirir.
(() => {
  'use strict';
  const V = window.KATKI || { toplam: 50000, bant_boy: 6250, bantlar: [], teslim: [], ayrildi: [], uretim: null };
  const N = V.toplam, BOY = V.bant_boy;
  const RENK = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#0ca30c', '#9085e9', '#e66767'];
  const hareket = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s) => document.querySelector(s);
  const sayi = (n) => n.toLocaleString('tr-TR');

  // --- veri ---
  const durum = new Uint8Array(N);           // 0 boş, 1 çalışılıyor, 2 teslim
  const teslimNo = new Map();
  for (const s of V.ayrildi) durum[s - 1] = 1;
  for (const t of V.teslim) { durum[t.s - 1] = 2; teslimNo.set(t.s, t); }
  const bantAd = (b) => (V.bantlar[b] && V.bantlar[b].ad) || `Bant ${b + 1}`;

  // --- yerleşim (kabuk ve GPU aynı formülü kullanır) ---
  const kapi = new Float32Array(N * 2), pod = new Float32Array(N * 2), bant = new Float32Array(N), tohum = new Float32Array(N);
  const GEN = 125, YUK = BOY / GEN, ARA = 10, W = 2 * GEN + ARA, H = 4 * YUK + 3 * ARA;
  for (let i = 0; i < N; i++) {
    const b = Math.floor(i / BOY), j = i % BOY;
    const gx = (b % 2) * (GEN + ARA) + (j % GEN), gy = Math.floor(b / 2) * (YUK + ARA) + Math.floor(j / GEN);
    kapi[2 * i] = (gx - W / 2) / (H / 2) * 0.8;
    kapi[2 * i + 1] = -(gy - H / 2) / (H / 2) * 0.8;
    const h = Math.sin(i * 12.9898) * 43758.5453; tohum[i] = h - Math.floor(h);
    const r = 0.06 + 0.94 * Math.sqrt(j / BOY);
    pod[2 * i] = r + (tohum[i] - 0.5) * 0.05;                                         // yarıçap
    pod[2 * i + 1] = b * Math.PI / 4 + r * 3.4 + (tohum[i] - 0.5) * 0.35 * (1.1 - r); // açı
    bant[i] = b;
  }

  // --- WebGL2 ---
  const tuval = $('#tuval');
  const gl = tuval.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) { $('#kip-metin').textContent += ' (Bu tarayıcıda WebGL2 yok; harita çizilemedi.)'; }

  const VS = `#version 300 es
  in vec2 a_kapi; in vec2 a_pod; in float a_bant; in float a_durum; in float a_tohum;
  uniform float u_t, u_zaman, u_dpr, u_vurgu, u_ofset; uniform vec2 u_olcek; uniform vec3 u_renk[8];
  out vec4 v_renk;
  vec2 podyum(vec2 p, float z){ float a = p.y + z * 0.035 * (1.25 - p.x); return vec2(p.x * cos(a) * 0.98, p.x * sin(a) * 0.62); }
  void main(){
    vec2 k = a_kapi + vec2(u_ofset, 0.0);
    vec2 q = podyum(a_pod, u_zaman) + vec2(u_ofset, 0.0);
    float t = u_t * u_t * (3.0 - 2.0 * u_t);
    float g = sin(3.14159 * u_t) * 0.22;
    vec2 p = mix(k, q, t) + g * vec2(cos(a_tohum * 6.2832), sin(a_tohum * 6.2832));
    gl_Position = vec4(p * u_olcek, 0.0, 1.0);
    vec3 c = u_renk[int(a_bant)];
    float nabiz = 0.55 + 0.45 * sin(u_zaman * 3.0 + a_tohum * 6.2832);
    float boy = a_durum > 1.5 ? 5.0 : (a_durum > 0.5 ? 3.2 + nabiz : 1.7);
    float al = a_durum > 1.5 ? 1.0 : (a_durum > 0.5 ? 0.45 + 0.5 * nabiz : 0.30);
    if (abs(float(gl_VertexID) - u_vurgu) < 0.5) { boy = 11.0; al = 1.0; c = mix(c, vec3(1.0), 0.55); }
    gl_PointSize = boy * u_dpr;
    v_renk = vec4(c, al);
  }`;
  const FS = `#version 300 es
  precision mediump float; in vec4 v_renk; out vec4 renk;
  void main(){ vec2 d = gl_PointCoord - 0.5; float r = dot(d, d) * 4.0; if (r > 1.0) discard;
    renk = vec4(v_renk.rgb, v_renk.a * (1.0 - r * r)); }`;

  let prg, yer = {};
  const hex3 = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16) / 255);
  if (gl) {
    const derle = (tur, kaynak) => { const s = gl.createShader(tur); gl.shaderSource(s, kaynak); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    prg = gl.createProgram();
    gl.attachShader(prg, derle(gl.VERTEX_SHADER, VS)); gl.attachShader(prg, derle(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prg); gl.useProgram(prg);
    const tampon = (ad, veri, boyut) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, veri, gl.STATIC_DRAW); const k = gl.getAttribLocation(prg, ad);
      gl.enableVertexAttribArray(k); gl.vertexAttribPointer(k, boyut, gl.FLOAT, false, 0, 0); };
    tampon('a_kapi', kapi, 2); tampon('a_pod', pod, 2); tampon('a_bant', bant, 1);
    tampon('a_durum', Float32Array.from(durum), 1); tampon('a_tohum', tohum, 1);
    for (const u of ['u_t', 'u_zaman', 'u_dpr', 'u_vurgu', 'u_ofset', 'u_olcek', 'u_renk']) yer[u] = gl.getUniformLocation(prg, u);
    gl.uniform3fv(yer.u_renk, new Float32Array(RENK.flatMap(hex3)));
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  }

  // --- durum: kip, morf, boyut ---
  let t = 0, hedef = 0, zaman = 0, vurgu = -1, olcek = [1, 1], ofset = 0, dpr = 1;
  const boyutla = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const w = tuval.clientWidth, h = tuval.clientHeight;
    tuval.width = Math.round(w * dpr); tuval.height = Math.round(h * dpr);
    const en = w / h;
    const s = Math.min(0.92, 0.92 * en);   // dar ekranda harita genişliğe sığar
    olcek = [s / en, s];
    ofset = en > 1.25 ? Math.min(0.55, (en - 1.25) * 0.6) : 0;
    if (gl) gl.viewport(0, 0, tuval.width, tuval.height);
  };
  new ResizeObserver(boyutla).observe(tuval); boyutla();

  // kabuk tarafı konum: VS ile aynı
  const konum = (i) => {
    const tt = t * t * (3 - 2 * t), g = Math.sin(Math.PI * t) * 0.22, a = tohum[i] * 6.2832;
    const r = pod[2 * i], aci = pod[2 * i + 1] + zaman * 0.035 * (1.25 - r);
    const qx = r * Math.cos(aci) * 0.98 + ofset, qy = r * Math.sin(aci) * 0.62;
    const kx = kapi[2 * i] + ofset, ky = kapi[2 * i + 1];
    return [(kx + (qx - kx) * tt + g * Math.cos(a)) * olcek[0], (ky + (qy - ky) * tt + g * Math.sin(a)) * olcek[1]];
  };
  const en_yakin = (mx, my) => {   // ekran pikseli -> slot
    const w = tuval.clientWidth, h = tuval.clientHeight;
    const nx = (mx / w) * 2 - 1, ny = 1 - (my / h) * 2, esik = (12 / h) * 2;
    let iyi = -1, d0 = esik * esik;
    for (let i = 0; i < N; i++) {
      const [x, y] = konum(i), dx = (x - nx) * (w / h), dy = y - ny, d = dx * dx + dy * dy;
      if (d < d0 || (d === d0 && durum[i] > durum[iyi])) { d0 = d; iyi = i; }
    }
    return iyi;
  };

  let once = performance.now();
  const ciz = (simdi) => {
    const dt = Math.min(0.05, (simdi - once) / 1000); once = simdi;
    if (hareket) { zaman += dt; t += Math.sign(hedef - t) * Math.min(Math.abs(hedef - t), dt / 1.6); } else t = hedef;
    if (gl) {
      gl.clearColor(0.043, 0.043, 0.051, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(yer.u_t, t); gl.uniform1f(yer.u_zaman, zaman); gl.uniform1f(yer.u_dpr, dpr);
      gl.uniform1f(yer.u_vurgu, vurgu); gl.uniform1f(yer.u_ofset, ofset); gl.uniform2fv(yer.u_olcek, olcek);
      gl.drawArrays(gl.POINTS, 0, N);
    }
    requestAnimationFrame(ciz);
  };
  requestAnimationFrame(ciz);

  // --- etkileşim ---
  const ipucu = $('#ipucu');
  const anlat = (i) => {
    const b = Math.floor(i / BOY), no = i + 1, k = teslimNo.get(no);
    if (k) return { ust: `Slot ${sayi(no)} · ${bantAd(b)}`, baslik: k.baslik, metin: k.metin, alt: `Teslim eden: ${k.kimlik}` };
    if (durum[i] === 1) return { ust: `Slot ${sayi(no)} · ${bantAd(b)}`, baslik: 'Şu an bir GPT çalışıyor', metin: 'Süresi dolarsa sıradaki GPT\'ye geçer.', alt: '' };
    return { ust: `Slot ${sayi(no)} · ${bantAd(b)}`, baslik: 'Boş', metin: (V.bantlar[b] && V.bantlar[b].ne) || '', alt: `Almak için: katki.py al --bant ${b + 1}` };
  };
  let bekleyen = null;
  tuval.addEventListener('pointermove', (e) => {
    const r = tuval.getBoundingClientRect(); bekleyen = [e.clientX - r.left, e.clientY - r.top];
    requestAnimationFrame(() => {
      if (!bekleyen) return; const [x, y] = bekleyen; bekleyen = null;
      vurgu = en_yakin(x, y);
      if (vurgu < 0) { ipucu.classList.remove('acik'); return; }
      const a = anlat(vurgu);
      ipucu.replaceChildren(Object.assign(document.createElement('b'), { textContent: a.ust }),
        Object.assign(document.createElement('span'), { textContent: a.baslik }));
      ipucu.style.left = Math.min(x + 14, tuval.clientWidth - 270) + 'px'; ipucu.style.top = (y + 14) + 'px';
      ipucu.classList.add('acik');
    });
  });
  tuval.addEventListener('pointerleave', () => { vurgu = -1; ipucu.classList.remove('acik'); });
  const kart = $('#slot-kart');
  tuval.addEventListener('click', () => {
    if (vurgu < 0) return; const a = anlat(vurgu);
    $('#k-no').textContent = a.ust.split(' · ')[0]; $('#k-bant').textContent = a.ust.split(' · ')[1];
    $('#k-baslik').textContent = a.baslik; $('#k-metin').textContent = a.metin; $('#k-kimlik').textContent = a.alt;
    kart.showPopover();
  });

  const METIN = {
    kapi: ["50.000 kapı. Her biri bir GPT'nin işi.", 'Her nokta bir slot. Parlayanlar teslim edildi, nabız atanlar şu an bir GPT\'de, sönükler boş.'],
    podyum: ['Aynı 50.000 slot, podyumda.', 'Sekiz kol, sekiz bant: kapı, podyum, koleksiyon, stüdyo, yayın, ölçüm, hareket, arayüz. Her teslim sahneye bir ışık ekler.'],
  };
  document.querySelectorAll('.kip button').forEach((d) => d.addEventListener('click', () => {
    const kip = d.dataset.kip; if (document.body.dataset.kip === kip) return;
    const uygula = () => {
      document.body.dataset.kip = kip; hedef = kip === 'podyum' ? 1 : 0;
      document.querySelectorAll('.kip button').forEach((x) => x.setAttribute('aria-pressed', String(x === d)));
      $('#kip-baslik').textContent = METIN[kip][0]; $('#kip-metin').textContent = METIN[kip][1];
    };
    if (document.startViewTransition && hareket) document.startViewTransition(uygula); else uygula();
  }));

  // --- sayılar, bantlar, teslimler ---
  $('#s-toplam').textContent = sayi(N);
  $('#s-teslim').textContent = sayi(V.teslim.length);
  $('#s-ayrildi').textContent = sayi(V.ayrildi.length);
  $('#uretim').textContent = V.uretim ? new Date(V.uretim).toLocaleString('tr-TR') : 'yok (önce katki.py derle)';
  const liste = $('#bant-listesi');
  for (let b = 0; b < 8; b++) {
    let dolu = 0; for (let i = b * BOY; i < (b + 1) * BOY; i++) if (durum[i]) dolu++;
    const bb = V.bantlar[b] || { ad: `Bant ${b + 1}`, site: '', ne: '' };
    const li = document.createElement('li'); li.className = 'bant'; li.style.setProperty('--renk', RENK[b]);
    const h = document.createElement('h3'); h.append(document.createElement('i'), `${b + 1} · ${bb.ad}`);
    const site = Object.assign(document.createElement('p'), { className: 'site', textContent: bb.site });
    const ne = Object.assign(document.createElement('p'), { className: 'ne', textContent: bb.ne });
    const d = Object.assign(document.createElement('div'), { className: 'dolu', textContent: `${sayi(dolu)} / ${sayi(BOY)} dolu` });
    const c = Object.assign(document.createElement('div'), { className: 'cubuk' });
    const cb = document.createElement('b'); cb.style.width = (dolu / BOY * 100) + '%'; c.append(cb);
    li.append(h, site, ne, d, c); liste.append(li);
  }
  const tl = $('#teslim-listesi');
  const son = [...V.teslim].sort((a, b) => (a.utc < b.utc ? 1 : -1)).slice(0, 24);
  if (son.length) $('#teslim-bos').hidden = true;
  for (const k of son) {
    const li = document.createElement('li'); li.style.setProperty('--renk', RENK[k.b - 1]);
    li.append(Object.assign(document.createElement('p'), { className: 't-ust', textContent: `Slot ${sayi(k.s)} · ${bantAd(k.b - 1)} · ${k.kimlik}` }),
      Object.assign(document.createElement('h3'), { textContent: k.baslik }),
      Object.assign(document.createElement('p'), { textContent: k.metin }));
    if (k.kaynak && k.kaynak.startsWith('https://')) {
      const kp = Object.assign(document.createElement('p'), { className: 't-kaynak' });
      const a = Object.assign(document.createElement('a'), { href: k.kaynak, textContent: new URL(k.kaynak).host + new URL(k.kaynak).pathname, rel: 'noopener' });
      kp.append('İnternet tetiği · kaynak ', a, k.alinti ? ` · “${k.alinti}”` : '');
      li.append(kp);
    }
    tl.append(li);
  }
})();
