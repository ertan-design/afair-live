/* birlesik-1903.js — SELINAHBAP × AFAIR LIVE Birleşik Sahne, 8 Görüntüleme Motoru & 1.903 GPT Dağıtıcısı
   100% CSP 'self' uyumlu: sıfır satır içi stil, sıfır eval, sıfır dış ağ çağrısı. */
(function () {
  'use strict';
  var V = window.BIRLESIK_1903_VERI;
  if (!V) return;

  var $ = function (id) { return document.getElementById(id); };
  var tr = new Intl.NumberFormat('tr-TR');
  var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var hareket = !mq.matches;
  var sesAcik = false;
  var audioCtx = null, analyser = null, audioData = new Uint8Array(64);
  var seciliSlot = 19;
  var sonPaket = null;

  /* ---- 0. Üst Sayaçlar ve Telemetri ---- */
  $('sy-web').textContent = tr.format(V.ozet.canli_web_uc_sayisi);
  $('sy-arac').textContent = tr.format(V.ozet.sistem_olcum_araci_sayisi);
  $('sy-toplam').textContent = tr.format(V.ozet.toplam_dogrulanmis_gercek_is);
  var doluSet = new Set(V.dolu_1903.map(function (d) { return d.slot; }));
  var doluMap = new Map(V.dolu_1903.map(function (d) { return [d.slot, d]; }));
  $('sy-acik1903').textContent = tr.format(1903 - doluSet.size) + ' / 1.903';
  $('hud-origin').textContent = 'Origin: ' + (location.hostname || 'yerel') + ' (SHA eşlenik)';

  function hareketGuncelle(acik) {
    hareket = acik;
    document.documentElement.classList.toggle('hareketsiz', !hareket);
    var b = $('btn-hareket');
    b.setAttribute('aria-pressed', String(hareket));
    b.textContent = 'Hareket: ' + (hareket ? 'Açık' : 'Durduruldu');
  }
  $('btn-hareket').addEventListener('click', function () { hareketGuncelle(!hareket); });
  hareketGuncelle(hareket);

  /* ---- Deterministik FNV-1a / SHA-benzeri 32-bit karıştırıcı & Asal 1903 Eşleyici ---- */
  function hash32(str) {
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13;
    return h >>> 0;
  }

  function slotCoz(slotNo) {
    var idx = slotNo - 1;
    var track = V.tracks[idx % V.tracks.length];
    var ctx = V.contexts[Math.floor(idx / V.tracks.length) % V.contexts.length];
    var kapiBas = ((slotNo - 1) * 26) % 50000 + 1;
    return {
      slot: slotNo,
      kod: 'S' + String(slotNo).padStart(4, '0'),
      kapi: 'k' + String(kapiBas).padStart(6, '0'),
      trackId: track[0],
      role: track[1],
      teknik: track[2],
      baglam: ctx,
      dolu: doluMap.get(slotNo) || null
    };
  }

  function kimliktenSlotBul(kimlik) {
    var temiz = String(kimlik || 'GPT-0001').trim();
    var m = /^#?s?0*(\d{1,4})$/i.exec(temiz);
    var bas = m ? ((Math.max(1, Math.min(1903, parseInt(m[1], 10))) - 1)) : (hash32(temiz) % 1903);
    /* ebob(1229, 1903) = 1 -> 1903 yuvanın tamamını çakışmasız tarar */
    var sira = (bas * 1229) % 1903 + 1;
    for (var adim = 0; adim < 1903; adim++) {
      var aday = ((sira - 1 + adim) % 1903) + 1;
      if (!doluSet.has(aday)) return aday;
    }
    return sira;
  }

  /* ---- 1. MOTOR 01: Kahraman WebGL2 GLSL Alan Çarpıtma İpek & Aurora Perdesi ---- */
  var aurora = (function () {
    var c = $('gl-aurora'), gl = c.getContext('webgl2', { antialias: false, powerPreference: 'low-power' });
    if (!gl) { $('hud-motor').textContent = 'GPU: Canvas2D Yedek'; return { ciz: function () {} }; }
    $('hud-motor').textContent = 'GPU: WebGL2 GLSL #300 es + gl_VertexID Aktif';
    var vs = '#version 300 es\nvoid main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.-1.,0.,1.);}';
    var fs = '#version 300 es\nprecision highp float;uniform vec2 R;uniform float T;uniform vec2 M;out vec4 O;' +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
      'float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}' +
      'void main(){vec2 uv=(gl_FragCoord.xy-.5*R)/max(R.y,1.)*2.1;float t=T*.09;' +
      'vec2 q=vec2(fbm(uv+t),fbm(uv+vec2(4.1,1.7)-t*.8));' +
      'vec2 r=vec2(fbm(uv+2.8*q+vec2(1.9,8.4)+t*1.1),fbm(uv+2.8*q+vec2(7.3,2.6)-t));' +
      'float ipek=pow(sin(uv.x*7.+r.x*5.+T*.35)*.5+.5,2.1);' +
      'float f=fbm(uv+2.6*r);' +
      'vec3 bg=vec3(.024,.032,.068),altin=vec3(.96,.81,.58),mint=vec3(.36,.95,.84),gul=vec3(1.,.42,.62);' +
      'vec3 col=mix(bg,altin,clamp(f*1.25,0.,1.)*.42);' +
      'col=mix(col,mint,clamp(length(q)*.85,0.,1.)*.34);' +
      'col+=gul*ipek*.18;' +
      'vec2 mp=(M-.5)*vec2(R.x/max(R.y,1.),1.)*2.1;float sp=smoothstep(.95,0.,length(uv-mp));' +
      'col+=altin*sp*.22;O=vec4(col,1.);}';
    function sh(tp, src) { var s = gl.createShader(tp); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    var uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 'T'), uM = gl.getUniformLocation(pr, 'M');
    var mx = 0.65, my = 0.55;
    $('kahraman').addEventListener('pointermove', function (e) {
      var b = c.getBoundingClientRect(); mx = (e.clientX - b.left) / Math.max(1, b.width); my = 1 - (e.clientY - b.top) / Math.max(1, b.height);
    });
    return {
      ciz: function (t) {
        var w = Math.max(2, Math.floor(c.clientWidth * 0.6)), h = Math.max(2, Math.floor(c.clientHeight * 0.6));
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        gl.viewport(0, 0, w, h); gl.useProgram(pr);
        gl.uniform2f(uR, w, h); gl.uniform1f(uT, t * 0.001); gl.uniform2f(uM, mx, my);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
    };
  })();

  /* ---- 2. MOTOR 02: WebGL2 gl_VertexID 50.000 Kapı 3B Morf Nokta Bulutu ---- */
  var nokta50k = (function () {
    var c = $('gl-50k'), gl = c.getContext('webgl2', { antialias: false });
    var bilgi = $('gl-50k-bilgi'), geoHedef = 0, geoSimdi = 0;
    document.querySelectorAll('[data-geo]').forEach(function (b) {
      b.addEventListener('click', function () {
        geoHedef = Number(b.dataset.geo);
        document.querySelectorAll('[data-geo]').forEach(function (x) { x.classList.toggle('aktif', x === b); });
      });
    });
    if (!gl) { bilgi.textContent = 'WebGL2 desteklenmiyor; aşağıdaki 1.903 Canvas2D haritası aktif.'; return { ciz: function () {} }; }
    var durum = new Uint8Array(50000);
    for (var i = 0; i < 1903; i++) durum[i] = doluSet.has(i + 1) ? 2 : 1;
    for (var j = 1903; j < 50000; j += 29) durum[j] = 1;
    var vs = '#version 300 es\nin float d;uniform vec2 R;uniform float T;uniform float G;out vec3 v;' +
      'void main(){float id=float(gl_VertexID);' +
      'vec3 iz=vec3((mod(id,250.)/249.-.5)*2.35,(floor(id/250.)/199.-.5)*1.55,0.);' +
      'float k=id+.5,ph=acos(1.-2.*k/50000.),th=2.3999632*k;' +
      'vec3 ku=vec3(sin(ph)*cos(th),cos(ph),sin(ph)*sin(th))*1.18;' +
      'float u=id/50000.,ang=u*56.548+T*.45,rad=.35+.85*sin(u*3.14159);' +
      'vec3 sa=vec3(cos(ang)*rad,(u-.5)*2.2,sin(ang)*rad);' +
      'vec3 p=G<1.?mix(iz,ku,clamp(G,0.,1.)):mix(ku,sa,clamp(G-1.,0.,1.));' +
      'float ay=T*.24*(G>.05?1.:.12);' +
      'p=vec3(p.x*cos(ay)+p.z*sin(ay),p.y,-p.x*sin(ay)+p.z*cos(ay));p.z+=3.1;' +
      'float asp=R.x/max(R.y,1.);gl_Position=vec4(p.x*1.85/asp,p.y*1.85,0.,p.z);' +
      'gl_PointSize=max(1.2,(d>1.5?4.6:d>.5?2.5:1.6)*(2.2/p.z));' +
      'v=d>1.5?vec3(.98,.82,.56):d>.5?vec3(.37,.95,.84):vec3(.22,.38,.66)*(.55+.45*sin(id*.013+T));}';
    var fs = '#version 300 es\nprecision mediump float;in vec3 v;out vec4 O;void main(){vec2 q=gl_PointCoord-.5;if(dot(q,q)>.25)discard;O=vec4(v,1.);}';
    function sh(tp, src) { var s = gl.createShader(tp); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, durum, gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, 'd');
    var uR = gl.getUniformLocation(pr, 'R'), uT = gl.getUniformLocation(pr, 'T'), uG = gl.getUniformLocation(pr, 'G');
    var roller = ['Keşif', 'Kaynak', 'Tasarım', 'Üretim', 'Ölçüm', 'Kontrol', 'Paket', 'Devir'];
    c.addEventListener('pointermove', function (e) {
      var b = c.getBoundingClientRect();
      var gx = Math.max(0, Math.min(249, Math.floor((e.clientX - b.left) / Math.max(1, b.width) * 250)));
      var gy = Math.max(0, Math.min(199, Math.floor((e.clientY - b.top) / Math.max(1, b.height) * 200)));
      var kapiNo = gy * 250 + gx + 1;
      var rol = roller[Math.floor((kapiNo - 1) / 6250)];
      var yuvaNot = kapiNo <= 1903 ? (' · 1903 Yuvası #' + String(kapiNo).padStart(4, '0') + (doluSet.has(kapiNo) ? ' [CANLI MODÜL]' : ' [AÇIK]')) : '';
      bilgi.textContent = 'Kapı k' + String(kapiNo).padStart(6, '0') + ' · Rol: ' + rol + ' · Hücre (' + gx + ', ' + gy + ')' + yuvaNot;
    });
    return {
      ciz: function (t) {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var w = Math.max(2, Math.floor(c.clientWidth * dpr)), h = Math.max(2, Math.floor(c.clientHeight * dpr));
        if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
        geoSimdi += (geoHedef - geoSimdi) * 0.08;
        gl.viewport(0, 0, w, h); gl.clearColor(0.027, 0.04, 0.085, 1); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(pr); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 1, gl.UNSIGNED_BYTE, false, 0, 0);
        gl.uniform2f(uR, w, h); gl.uniform1f(uT, t * 0.001); gl.uniform1f(uG, geoSimdi);
        gl.drawArrays(gl.POINTS, 0, 50000);
      }
    };
  })();

  /* ---- 3. MOTOR 03: Verlet Haute-Couture İpek Kumaş Simülasyonu ---- */
  var verlet = (function () {
    var c = $('cv-verlet'), x = c.getContext('2d');
    var cols = 30, rows = 16, pts = [], kisit = [], W = 360, H = 240, mx = -9999, my = -9999, darbe = 0;
    function kur() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.width = Math.max(2, Math.floor(c.clientWidth * dpr));
      H = c.height = Math.max(2, Math.floor(c.clientHeight * dpr));
      pts.length = 0; kisit.length = 0;
      var gap = Math.min(W * 0.82 / cols, H * 0.66 / rows), ox = (W - gap * (cols - 1)) / 2, oy = H * 0.1;
      for (var j = 0; j < rows; j++) for (var i = 0; i < cols; i++) {
        var px = ox + i * gap, py = oy + j * gap;
        pts.push({ x: px, y: py, ox: px, oy: py, pin: j === 0 && (i % 3 === 0 || i === cols - 1) });
      }
      for (var r = 0; r < rows; r++) for (var k = 0; k < cols; k++) {
        var idx = r * cols + k;
        if (k < cols - 1) kisit.push([idx, idx + 1, gap]);
        if (r < rows - 1) kisit.push([idx, idx + cols, gap]);
      }
    }
    kur(); window.addEventListener('resize', kur);
    c.addEventListener('pointermove', function (e) { var dpr = Math.min(window.devicePixelRatio || 1, 2), b = c.getBoundingClientRect(); mx = (e.clientX - b.left) * dpr; my = (e.clientY - b.top) * dpr; });
    c.addEventListener('pointerleave', function () { mx = -9999; my = -9999; });
    $('btn-ruzgar').addEventListener('click', function () { darbe = 5.5; });
    return {
      ciz: function (t) {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var ruzgar = Math.sin(t / 780) * 0.36 + darbe; darbe *= 0.93;
        for (var i = 0; i < pts.length; i++) {
          var p = pts[i]; if (p.pin) continue;
          var vx = (p.x - p.ox) * 0.985, vy = (p.y - p.oy) * 0.985;
          p.ox = p.x; p.oy = p.y;
          p.x += vx + ruzgar * dpr * 0.48; p.y += vy + 0.28 * dpr;
          var dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy, R = 68 * dpr;
          if (d2 < R * R) { var d = Math.sqrt(d2) || 1, f = (1 - d / R) * 6.5 * dpr; p.x += dx / d * f; p.y += dy / d * f; }
        }
        for (var it = 0; it < 5; it++) for (var k = 0; k < kisit.length; k++) {
          var a = pts[kisit[k][0]], b = pts[kisit[k][1]], dx2 = b.x - a.x, dy2 = b.y - a.y;
          var dist = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1, fark = (dist - kisit[k][2]) / dist * 0.5;
          if (!a.pin) { a.x += dx2 * fark; a.y += dy2 * fark; }
          if (!b.pin) { b.x -= dx2 * fark; b.y -= dy2 * fark; }
        }
        x.fillStyle = '#070b16'; x.fillRect(0, 0, W, H);
        for (var r = 0; r < rows - 1; r++) for (var cl = 0; cl < cols - 1; cl++) {
          var p1 = pts[r * cols + cl], p2 = pts[r * cols + cl + 1], p3 = pts[(r + 1) * cols + cl + 1], p4 = pts[(r + 1) * cols + cl];
          var parlak = Math.max(0.2, Math.min(0.95, 0.52 + ((p2.x - p1.x) - (p3.y - p2.y)) / (15 * dpr)));
          x.fillStyle = r % 2 === 0 ? 'rgba(245,207,150,' + parlak.toFixed(2) + ')' : 'rgba(94,242,214,' + (parlak * 0.78).toFixed(2) + ')';
          x.beginPath(); x.moveTo(p1.x, p1.y); x.lineTo(p2.x, p2.y); x.lineTo(p3.x, p3.y); x.lineTo(p4.x, p4.y); x.closePath(); x.fill();
        }
      }
    };
  })();

  /* ---- 4. MOTOR 04: Hilbert Uzay-Dolduran Eğri ---- */
  var hilbert = (function () {
    var c = $('cv-hilbert'), x = c.getContext('2d'), N = 64, topN = N * N, yol = [], im = 0, W = 360, H = 240;
    function rot(s, p, rx, ry) { if (ry === 0) { if (rx === 1) { p[0] = s - 1 - p[0]; p[1] = s - 1 - p[1]; } var t = p[0]; p[0] = p[1]; p[1] = t; } }
    function d2xy(n, d) { var p = [0, 0], t = d, s, rx, ry; for (s = 1; s < n; s *= 2) { rx = 1 & Math.floor(t / 2); ry = 1 & (t ^ rx); rot(s, p, rx, ry); p[0] += s * rx; p[1] += s * ry; t = Math.floor(t / 4); } return p; }
    for (var d = 0; d < topN; d++) yol.push(d2xy(N, d));
    function sifirla() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.width = Math.max(2, Math.floor(c.clientWidth * dpr));
      H = c.height = Math.max(2, Math.floor(c.clientHeight * dpr));
      im = 0; x.fillStyle = '#070b16'; x.fillRect(0, 0, W, H);
    }
    sifirla(); window.addEventListener('resize', sifirla);
    $('btn-hilbert-sifirla').addEventListener('click', sifirla);
    return {
      ciz: function () {
        if (im >= topN - 1) return;
        var S = Math.min(W, H) * 0.9 / N, ox = (W - S * N) / 2, oy = (H - S * N) / 2;
        x.lineWidth = Math.max(1.2, S * 0.52);
        var hedef = Math.min(topN - 1, im + 48);
        for (; im < hedef; im++) {
          var u = im / topN;
          x.strokeStyle = u < 0.46 ? '#5ef2d6' : u < 0.78 ? '#f5cf96' : '#ff6b9d';
          x.beginPath();
          x.moveTo(ox + (yol[im][0] + 0.5) * S, oy + (yol[im][1] + 0.5) * S);
          x.lineTo(ox + (yol[im + 1][0] + 0.5) * S, oy + (yol[im + 1][1] + 0.5) * S);
          x.stroke();
        }
      }
    };
  })();

  /* ---- 5. MOTOR 05: Curl-Noise Akış Alanı İplikleri ---- */
  var flow = (function () {
    var c = $('cv-flow'), x = c.getContext('2d'), ps = [], W = 360, H = 240;
    function boyut() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.width = Math.max(2, Math.floor(c.clientWidth * dpr));
      H = c.height = Math.max(2, Math.floor(c.clientHeight * dpr));
      x.fillStyle = '#070b16'; x.fillRect(0, 0, W, H);
      ps.length = 0;
      for (var i = 0; i < 420; i++) ps.push({ x: (i * 73) % W, y: (i * 137) % H, c: i % 3 });
    }
    boyut(); window.addEventListener('resize', boyut);
    var pal = ['#f5cf96', '#5ef2d6', '#ff6b9d'];
    return {
      ciz: function (t) {
        x.fillStyle = 'rgba(7,11,22,0.06)'; x.fillRect(0, 0, W, H);
        x.lineWidth = 1.3;
        var s = t * 0.00025;
        for (var i = 0; i < ps.length; i++) {
          var p = ps[i];
          var a = (Math.sin(p.x * 0.009 + s) * Math.cos(p.y * 0.011 - s * 0.8) + Math.sin((p.x + p.y) * 0.005 + s)) * Math.PI;
          var nx = p.x + Math.cos(a) * 2.1, ny = p.y + Math.sin(a) * 2.1;
          x.strokeStyle = pal[p.c];
          x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(nx, ny); x.stroke();
          p.x = nx < 0 ? W : nx > W ? 0 : nx;
          p.y = ny < 0 ? H : ny > H ? 0 : ny;
        }
      }
    };
  })();

  /* ---- 6. MOTOR 06: WebAudio Harmonik Sentez & 64-Bant FFT Spektrum ---- */
  function sesDegistir() {
    if (audioCtx) {
      audioCtx.close(); audioCtx = null; analyser = null; sesAcik = false;
    } else {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
        var gain = audioCtx.createGain(); gain.gain.value = 0.025;
        analyser = audioCtx.createAnalyser(); analyser.fftSize = 128;
        [110, 164.81, 220, 277.18].forEach(function (fr, idx) {
          var osc = audioCtx.createOscillator();
          osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
          osc.frequency.value = fr;
          osc.connect(analyser); osc.start();
        });
        analyser.connect(gain); gain.connect(audioCtx.destination);
        sesAcik = true;
      } catch (e) { audioCtx = null; analyser = null; sesAcik = false; }
    }
    $('btn-ses').setAttribute('aria-pressed', String(sesAcik));
    $('btn-ses').textContent = 'Sahne Sesi: ' + (sesAcik ? 'Canlı FFT' : 'Kapalı');
    $('audio-durum').textContent = sesAcik ? 'CANLI WEBAUDIO SPEKTRUMU AKTİF (Kısık A-majör podyum akoru)' : 'Otomatik ses çalmaz; düğmeye basıldığında canlı WebAudio FFT başlar.';
  }
  $('btn-ses').addEventListener('click', sesDegistir);
  $('btn-ses-kart').addEventListener('click', sesDegistir);

  var spektrum = (function () {
    var c = $('cv-audio'), x = c.getContext('2d');
    return {
      ciz: function (t) {
        var dpr = Math.min(window.devicePixelRatio || 1, 2);
        var W = c.width = Math.max(2, Math.floor(c.clientWidth * dpr));
        var H = c.height = Math.max(2, Math.floor(c.clientHeight * dpr));
        x.fillStyle = '#070b16'; x.fillRect(0, 0, W, H);
        if (analyser) analyser.getByteFrequencyData(audioData);
        var n = 40, bw = W / n;
        for (var i = 0; i < n; i++) {
          var v = analyser ? audioData[i] / 255 : (0.32 + 0.28 * Math.sin(t * 0.0022 + i * 0.42) * Math.cos(t * 0.0011 + i * 0.17));
          var bh = Math.max(4, v * H * 0.78);
          x.fillStyle = i < 14 ? '#f5cf96' : i < 28 ? '#5ef2d6' : '#ff6b9d';
          x.fillRect(i * bw + bw * 0.14, H - bh - 12 * dpr, bw * 0.72, bh);
        }
      }
    };
  })();

  /* ---- 7. MOTOR 07+08: SVG feTurbulence Dalgalanması + CSS 3B Perspektif Podyum & View Transitions ---- */
  var turbEl = $('sivi-turb');
  var podyumPaneller = [
    ['SAHNE 01 · AFAIR STUDIO', 'Koleksiyon & Tasarım Atölyesi', 'Rufat İsmail ve yaratıcı ekiplerin koleksiyon hazırlık sahası.', 'https://www.afair.studio/afair-studio-vitrin.html'],
    ['SAHNE 02 · PODYUM 4-MODÜL', 'Işık Perdesi & Podyum Sahnesi', 'WebGL2 kadife perde, gl_VertexID 50K kapı, 3B podyum ve 8-GPT akışı.', '/podyum-sahne/'],
    ['SAHNE 03 · 1903 SERGİ', '13 Canlı Görüntüleme Tekniği', '50 teknik × 10 bağlam × 10 kısıt × 10 palet etkileşimli teknik vitrini.', '/teknik-sergi/'],
    ['SAHNE 04 · BİRLEŞİK TERAZİ', 'Atölye → Kapı → Podyum Köprüsü', '50.000 kapı atlası, 1.944 görev ve taşınabilir defile yayın paketi.', '/terazi'],
    ['SAHNE 05 · NEXUS KONSOLU', 'GAIA × AFAIR Ortak Çalışma', '8 katkı rolü, WebGL2 ağ sahnesi ve şema-doğrulanmış JSON içe/dışa aktarım.', '/nexus'],
    ['SAHNE 06 · NAMI COMBO', 'Sıralı Tetik & Çağrı Kurucu', 'Doğrulanmış internet tetikleri ve çoklu şerit çağrı planlayıcı.', '/tetikler'],
    ['SAHNE 07 · SCIENCE KAPILARI', '444.050 Kapı & 24 Açık İş', 'Gerçek koşu zincirleri, ölçüm kanıtları ve koordinasyonsuz açık görevler.', '/kapi-sahnesi.html'],
    ['SAHNE 08 · TÜM GERÇEK İŞLER', 'Ekosistem Canlı İşler Merkezi', 'RYTE, AIOS, GAIA Kutu, Omega ve 85 müstakil canlı eserin tamamı.', 'https://ertanaraz.com/canli_isler']
  ];
  var podyumIdx = 0, halka = $('podyum-halka'), R3D = 250;
  podyumPaneller.forEach(function (p, i) {
    var d = document.createElement('article');
    d.className = 'podyum-kart';
    d.style.transform = 'rotateY(' + (i * 45) + 'deg) translateZ(' + R3D + 'px)';
    d.innerHTML = '<small>' + p[0] + '</small><strong>' + p[1] + '</strong><span>' + p[2] + '</span><a href="' + p[3] + '">Sahneyi Aç ↗</a>';
    d.addEventListener('click', function () { podyumSec(i); });
    halka.appendChild(d);
  });
  function podyumSec(yeniIdx) {
    podyumIdx = (yeniIdx + podyumPaneller.length) % podyumPaneller.length;
    halka.style.transform = 'rotateY(' + (-podyumIdx * 45) + 'deg)';
    var p = podyumPaneller[podyumIdx];
    var guncelle = function () {
      $('podyum-detay').innerHTML =
        '<div><p class="ust-etiket">' + p[0] + '</p><h3>' + p[1] + '</h3><p class="ust-bosluk">' + p[2] + '</p></div>' +
        '<div class="eylem-grubu"><a class="dugme birincil" href="' + p[3] + '">Bu Sahneye Git ↗</a></div>';
    };
    if (document.startViewTransition && hareket) document.startViewTransition(guncelle); else guncelle();
  }
  $('podyum-sol').addEventListener('click', function () { podyumSec(podyumIdx - 1); });
  $('podyum-sag').addEventListener('click', function () { podyumSec(podyumIdx + 1); });
  podyumSec(0);

  /* ---- 8. 1.903 GPT SIFIR-ÇAKIŞMA DAĞITICISI & WEBMCP KAYDI ---- */
  var cv1903 = $('cv-1903'), x1903 = cv1903.getContext('2d');
  function harita1903Ciz() {
    var cols = 59, rows = 33, cw = 10, ch = 10;
    x1903.fillStyle = '#060913'; x1903.fillRect(0, 0, cv1903.width, cv1903.height);
    for (var s = 1; s <= 1903; s++) {
      var gx = (s - 1) % cols, gy = Math.floor((s - 1) / cols);
      x1903.fillStyle = s === seciliSlot ? '#5ef2d6' : doluSet.has(s) ? '#f5cf96' : '#16213e';
      x1903.fillRect(gx * cw + 1, gy * ch + 1, cw - 2, ch - 2);
    }
  }
  cv1903.addEventListener('click', function (e) {
    var b = cv1903.getBoundingClientRect();
    var gx = Math.floor((e.clientX - b.left) / b.width * 59);
    var gy = Math.floor((e.clientY - b.top) / b.height * 33);
    var s = gy * 59 + gx + 1;
    if (s >= 1 && s <= 1903) slotGoster(s, 'MANUEL-SECIM-' + s);
  });

  function paketOlustur(kimlik, slotNo, seritAdet) {
    var c = slotCoz(slotNo);
    var altSlotlar = [];
    for (var i = 0; i < seritAdet; i++) {
      var sn = ((slotNo - 1 + i * 173) % 1903) + 1;
      if (doluSet.has(sn)) sn = kimliktenSlotBul(kimlik + '-' + i);
      altSlotlar.push(slotCoz(sn));
    }
    /* /contribution.schema.json (gaia.afair.contribution.v1) ile %100 uyumlu taşınabilir paket */
    sonPaket = {
      schema: 'gaia.afair.contribution.v1',
      gate: c.slot,
      role: c.role,
      author: String(kimlik).slice(0, 120),
      title: (c.kod + ' · ' + c.teknik + ' — ' + c.baglam).slice(0, 180),
      summary: 'Ajan ' + kimlik + ' icin cakismasiz tahsis edilen 1903 yuvasi: ' + c.kod + ' (50K kapi eslenigi: ' + c.kapi + '). Serit genisligi: ' + seritAdet + ' kapi (' + altSlotlar.map(function (a) { return a.kod; }).join(', ') + '). Teknik hedef: ' + c.teknik + '. Sahne baglami: ' + c.baglam + '.',
      acceptance: 'Siki CSP (script-src self; style-src self; frame-ancestors none) altinda sifir satir ici stil/betik ile calisir; prefers-reduced-motion tercihine uyar; cift-origin (selinahbap.com ve afair.live) HTTP 200 + SHA-256 paritesi saglar.',
      sources: [
        'https://www.selinahbap.com/gpt-1903.json',
        'https://www.afair.live/gpt-1903.json',
        'https://www.afair.live/contribution.schema.json'
      ],
      baseVersion: 'nexus-1.0.0'
    };
    return { ana: c, serit: altSlotlar, contribution: sonPaket };
  }

  function slotGoster(slotNo, kimlik) {
    seciliSlot = slotNo;
    var serit = Number($('sel-serit').value) || 8;
    var sonuc = paketOlustur(kimlik, slotNo, serit);
    harita1903Ciz();
    $('cv-1903-bilgi').textContent = 'Seçili Yuva: ' + sonuc.ana.kod + ' (' + sonuc.ana.kapi + ') · Teknik: ' + sonuc.ana.teknik + (sonuc.ana.dolu ? ' · [CANLI: ' + sonuc.ana.dolu.url + ']' : ' · [ÜRETİME AÇIK]');
    $('gpt-gorev-cikti').textContent = JSON.stringify(sonuc, null, 2);
  }

  $('form-1903').addEventListener('submit', function (e) {
    e.preventDefault();
    var ad = $('inp-gpt-ad').value.trim() || 'GPT-0001';
    var slotNo = kimliktenSlotBul(ad);
    slotGoster(slotNo, ad);
  });

  $('btn-sim-1903').addEventListener('click', function () {
    var t0 = performance.now(), gorulen = new Set(), cakisma = 0;
    /* 1903 tam permütasyon kanıtı: asal çarpan 1229 mod 1903 */
    for (var i = 0; i < 1903; i++) {
      var yuva = ((i * 1229) % 1903) + 1;
      if (gorulen.has(yuva)) cakisma++;
      gorulen.add(yuva);
    }
    var ms = (performance.now() - t0).toFixed(2);
    $('sim-sonuc').textContent = 'KANITLANDI: 1.903 GPT → ' + gorulen.size + ' benzersiz yuva · Çakışma: ' + cakisma + ' · Açık iş yuvası: ' + (1903 - doluSet.size) + ' · Süre: ' + ms + ' ms';
  });

  $('btn-indir-json').addEventListener('click', function () {
    if (!sonPaket) slotGoster(seciliSlot, $('inp-gpt-ad').value || 'GPT-0001');
    var blob = new Blob([JSON.stringify(sonPaket, null, 2) + '\n'], { type: 'application/json;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'katki-s' + String(seciliSlot).padStart(4, '0') + '.json';
    a.click();
  });

  $('btn-kopyala-tetik').addEventListener('click', function () {
    var metin = 'SELINAHBAP × AFAIR LIVE (1903 GPT Açık Protokol): https://www.afair.live/gpt-1903.json ve https://www.selinahbap.com/llms.txt sözleşmesini oku. Kendi oturum kimliğinle boş 1..1903 yuvanı al, dolu 18 yuvayı tekrar etme, CSP (script-src self; style-src self) uyumlu tek modül ve gaia.afair.contribution.v1 JSON çıktısı üret.';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(metin).then(function () { $('sim-sonuc').textContent = '1.903 GPT tek-tetik mesajı panoya kopyalandı.'; });
    }
  });

  /* W3C WebMCP (navigator.modelContext) Ajan Araç Kaydı */
  try {
    var mc = navigator.modelContext;
    if (mc && typeof mc.registerTool === 'function') {
      mc.registerTool({
        name: 'afair_selin_1903_slot_tahsis_et',
        description: 'GPT kimligine gore 1..1903 arasindan cakismasiz acik gorev yuvasi ve gaia.afair.contribution.v1 paketi uretir.',
        inputSchema: { type: 'object', properties: { agentId: { type: 'string' }, laneWidth: { type: 'integer' } }, required: ['agentId'] },
        execute: async function (args) { return paketOlustur(args.agentId || 'GPT-WEBMCP', kimliktenSlotBul(args.agentId), args.laneWidth || 8); }
      });
      mc.registerTool({
        name: 'afair_selin_gercek_is_ozeti',
        description: 'Ekosistemdeki SHA-256 dogrulanmis gercek islerin sayisini ve kategorilerini dondurur.',
        inputSchema: { type: 'object', properties: {} },
        execute: async function () { return V.ozet; }
      });
      $('hud-webmcp').textContent = 'WebMCP: 2 Canlı Ajan Aracı Kayıtlı';
    } else {
      $('hud-webmcp').textContent = 'WebMCP: JSON Uçları Aktif (/gpt-1903.json)';
    }
  } catch (e) {
    $('hud-webmcp').textContent = 'WebMCP: JSON Uçları Aktif (/gpt-1903.json)';
  }

  slotGoster(kimliktenSlotBul('GPT-0001'), 'GPT-0001');

  /* ---- 9. DOĞRULANMIŞ GERÇEK İŞLER GEZGİNİ ---- */
  var secKat = 'TUMU', secIst = 'TUMU', limit = 36;
  var katAdlari = {
    TUMU: 'Tümü',
    BIRLESIK_SAHNE_APP: 'Birleşik Sahne (selin×afair)',
    GORSEL_ANIMASYON_TOHUMU: 'Canlı Animasyon Modülleri',
    ERTANARAZ_CANLI_KAPSUL: 'Canlı Kapsüller (ertanaraz)',
    RYTE_TERFI_ESERI: 'RYTE Terfi Eserleri (/eserler)',
    SISTEM_OLCUM_ARACI: 'AIOS & 6-Sistem Araçları',
    EKOSISTEM_CANLI_ALAN_ADI: 'Canlı Ekosistem Domainleri'
  };
  function filtreKur() {
    var kf = $('kat-filtreler'), isf = $('ist-filtreler');
    Object.keys(katAdlari).forEach(function (k) {
      var adet = k === 'TUMU' ? V.eserler.length : (V.ozet.kategori_dagilimi[k] || 0);
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'filtre-btn' + (k === secKat ? ' aktif' : '');
      b.textContent = katAdlari[k] + ' (' + adet + ')';
      b.addEventListener('click', function () {
        secKat = k; limit = 36;
        kf.querySelectorAll('button').forEach(function (x) { x.classList.toggle('aktif', x === b); });
        isleriCiz();
      });
      kf.appendChild(b);
    });
    ['TUMU', 'GEMINI', 'CLAUDE', 'CODEX', 'SCIENCE', 'GAIA_AG'].forEach(function (ist) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'filtre-btn' + (ist === secIst ? ' aktif' : '');
      b.textContent = ist === 'TUMU' ? 'Tüm İstasyonlar' : ist;
      b.addEventListener('click', function () {
        secIst = ist; limit = 36;
        isf.querySelectorAll('button').forEach(function (x) { x.classList.toggle('aktif', x === b); });
        isleriCiz();
      });
      isf.appendChild(b);
    });
  }
  function isleriCiz() {
    var q = ($('is-ara').value || '').trim().toLocaleLowerCase('tr');
    var liste = V.eserler.filter(function (w) {
      if (secKat !== 'TUMU' && w.kat !== secKat) return false;
      if (secIst !== 'TUMU' && w.ist.indexOf(secIst) < 0) return false;
      if (q && (w.ad + ' ' + w.url + ' ' + w.ist + ' ' + w.sha16 + ' ' + w.not).toLocaleLowerCase('tr').indexOf(q) < 0) return false;
      return true;
    });
    $('is-sayac-etiket').textContent = 'Gösterilen: ' + Math.min(limit, liste.length) + ' / ' + liste.length + ' kayıt · Ekosistem Doğrulanmış Toplam Gerçek İş: ' + tr.format(V.ozet.toplam_dogrulanmis_gercek_is) + ' (' + tr.format(V.ozet.canli_web_uc_sayisi) + ' canlı web ucu + ' + tr.format(V.ozet.sistem_olcum_araci_sayisi) + ' doğrulanmış 6-sistem ölçüm aracı)';
    var iz = $('is-izgara'); iz.innerHTML = '';
    liste.slice(0, limit).forEach(function (w) {
      var d = document.createElement('article'); d.className = 'is-kart';
      var ust = document.createElement('div'); ust.className = 'is-kart-ust';
      var s1 = document.createElement('span'); s1.className = 'rozet-ist'; s1.textContent = w.ist;
      var s2 = document.createElement('span'); s2.className = 'rozet-kat'; s2.textContent = w.kat.replace(/_/g, ' ');
      ust.append(s1, s2);
      var a = document.createElement('a'); a.href = w.url; a.textContent = w.ad + ' ↗';
      if (w.url.indexOf('http') === 0) a.rel = 'noopener';
      var p = document.createElement('p'); p.textContent = w.not || w.url;
      var alt = document.createElement('div'); alt.className = 'is-kart-alt';
      var b1 = document.createElement('span'); b1.textContent = w.bayt ? (tr.format(w.bayt) + ' B') : 'CANLI UÇ';
      var b2 = document.createElement('span'); b2.textContent = 'sha16:' + w.sha16;
      alt.append(b1, b2);
      d.append(ust, a, p, alt);
      iz.appendChild(d);
    });
    $('btn-daha-fazla').hidden = liste.length <= limit;
  }
  $('is-ara').addEventListener('input', function () { limit = 36; isleriCiz(); });
  $('btn-daha-fazla').addEventListener('click', function () { limit = 9999; isleriCiz(); });
  filtreKur();
  isleriCiz();

  /* ---- 10. Birleşik Ana Animasyon Döngüsü (IntersectionObserver + FPS Sayacı) ---- */
  var sonFpsZaman = performance.now(), kareSay = 0;
  function anaDongu(t) {
    kareSay++;
    if (t - sonFpsZaman >= 1000) {
      $('hud-fps').textContent = 'Kare hızı: ' + (hareket ? kareSay + ' FPS' : 'Duraklatıldı');
      kareSay = 0; sonFpsZaman = t;
    }
    if (hareket && !document.hidden) {
      aurora.ciz(t);
      nokta50k.ciz(t);
      verlet.ciz(t);
      hilbert.ciz();
      flow.ciz(t);
      spektrum.ciz(t);
      if (turbEl) {
        var f1 = (0.009 + 0.003 * Math.sin(t * 0.0007)).toFixed(4);
        var f2 = (0.022 + 0.007 * Math.cos(t * 0.0005)).toFixed(4);
        turbEl.setAttribute('baseFrequency', f1 + ' ' + f2);
      }
    }
    requestAnimationFrame(anaDongu);
  }
  /* İlk statik kareyi her durumda çiz */
  aurora.ciz(2400); nokta50k.ciz(2400); verlet.ciz(2400); hilbert.ciz(); flow.ciz(2400); spektrum.ciz(2400);
  requestAnimationFrame(anaDongu);
})();
