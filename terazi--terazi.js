// Selinahbap × AFAIR birlesik arayuz. Bagimsiz ES modulu; model cagirmaz, veri gondermez.
import { ciz, idAt, konum, rolu, ROL_RENK, SUTUN, SATIR, TOPLAM, BLOK } from "./terazi--terazi-atlas.js";

const $ = (s, k = document) => k.querySelector(s);
const sayi = new Intl.NumberFormat("tr-TR");
const kac = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const depo = {
  al(k, v) { try { const x = localStorage.getItem(k); return x == null ? v : JSON.parse(x); } catch { return v; } },
  koy(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};

const ROLLER = [
  ["Keşif", "Soruyu netleştir, kapsamı ve yanıt bekleyen soruları yaz.", "Açık amaç, kapsam ve yanıt bekleyen sorular."],
  ["Kaynak", "Verilen kaynakları incele; kimlik, bulgu ve doğrulama sınırını yaz.", "Kaynak kimliği, bulgu ve doğrulama sınırı."],
  ["Tasarım", "Amaca uygun akışı ve görünümü öner.", "İzlenebilir akış ve uygulanabilir tasarım kararları."],
  ["Üretim", "Kabul ölçütlerini karşılayan somut teslimi hazırla.", "Açılabilir, incelenebilir çalışma çıktısı."],
  ["Ölçüm", "Süre, boyut ve başarı ölçütlerini ayrı ayrı ölç.", "Birim, yöntem, ortam ve ham ölçüm."],
  ["Kontrol", "Çıktıyı kaynak ve kabul ölçütleriyle karşılaştır.", "Tekrarlanabilir kontrol ve bulunan kusurlar."],
  ["Paket", "Alıcının kullanacağı dosyaları ve kısa girişi hazırla.", "İçindekiler, sürüm, bütünlük bilgisi ve kullanım adımı."],
  ["Devir", "Sonucu doğru alıcıya teslim et; açık işleri yaz.", "Alıcı, sonuç, açık işler ve sonraki adım."],
];

// ---------- hareket anahtari ----------
const sistemAzalt = matchMedia("(prefers-reduced-motion: reduce)");
let hareketAcik = (() => { const v = depo.al("birlesik.hareket", null); return v == null ? !sistemAzalt.matches : v === "acik"; })();
const hareketDinleyici = new Set();
function hareketUygula() {
  document.documentElement.dataset.hareket = hareketAcik ? "acik" : "kapali";
  const b = $("#hareket");
  if (b) { b.setAttribute("aria-pressed", String(hareketAcik)); b.textContent = "Hareket: " + (hareketAcik ? "açık" : "kapalı"); }
  hareketDinleyici.forEach(f => f(hareketAcik));
}
function gecis(f) {  // ayni belge View Transition; yoksa ya da hareket kapaliysa dogrudan
  if (hareketAcik && document.startViewTransition) {
    const v = document.startViewTransition(f);
    v.ready.catch(() => {}); v.finished.catch(() => {}); v.updateCallbackDone.catch(() => {});
    return v;
  }
  f(); return null;
}

// ---------- kapi kimlikleri ----------
function kapiCoz(s) {  // "1903", "k001903" -> 1903
  const m = /^\s*k?0*([1-9]\d{0,4})\s*$/i.exec(String(s ?? ""));
  if (!m) return 0;
  const n = +m[1];
  return n >= 1 && n <= TOPLAM ? n : 0;
}
const kod = n => "k" + String(n).padStart(6, "0");
const kapiBilgi = n => { const r = rolu(n); return { id: n, kod: kod(n), rol: r, rolAd: ROLLER[r][0], slot: (n - 1) % BLOK + 1, talimat: ROLLER[r][1], beklenen: ROLLER[r][2] }; };
function kontrol(g) { let t = 0; for (let i = 0; i < g.length; i++) t += g.charCodeAt(i) * (i % 2 === 0 ? 3 : 1); return (10 - t % 10) % 10; }
const sergiKapi = (seri, no) => { const g = `K2-S${seri}-${String(no).padStart(5, "0")}`; return `${g}-${kontrol(g)}`; };

async function sha256(metin) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(metin));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
}

// ---------- gorev listesi (gorev.py ile bire bir) ----------
let GOREV = null, DURUM = null;
async function veriYukle() {
  if (GOREV) return;
  const [g, d] = await Promise.all([fetch("/terazi--terazi-gorevler.json").then(r => r.json()), fetch("/terazi--terazi-durum.json").then(r => r.json()).catch(() => ({ dolu: {} }))]);
  const liste = [], sayac = Array(8).fill(0);
  const rolNo = Object.fromEntries(g.roller.map((r, i) => [r.ad, i]));
  for (const e of g.eksikler) { const r = rolNo[e.rol]; sayac[r]++; liste.push({ kapi: e.kapi, tur: "eksik", rol: e.rol, is: e.is, beklenen: g.roller[r].beklenen }); }
  for (const b of g.bolumler) for (const t of g.teknikler) g.roller.forEach((r, i) => {
    sayac[i]++;
    liste.push({ kapi: sergiKapi(i + 1, sayac[i]), tur: "matris", rol: r.ad, bolum: b.id, teknik: t.id, site: b.site, is: `${b.ad} × ${t.ad} — ${r.ad}: ${r.talimat}`, beklenen: r.beklenen });
  });
  liste.forEach((x, i) => x.sira = i);
  GOREV = { ...g, liste }; DURUM = d;
  if (liste.length !== g.adet) console.warn("gorev adedi uyusmuyor", liste.length, g.adet);
}
async function gorevBul(ad) {
  const L = GOREV.liste, dolu = DURUM.dolu || {};
  const acik = L.find(x => dolu[x.kapi]?.durum === "ACIK" && dolu[x.kapi]?.acan === ad);
  if (acik) return { ...acik, durum: "ACIK", senin: true, yoklama: 0 };
  const h = await sha256(ad), i0 = parseInt(h.slice(0, 12), 16) % L.length;
  for (let j = 0; j < L.length; j++) { const x = L[(i0 + j) % L.length]; if (!dolu[x.kapi]) return { ...x, durum: "BOS", yoklama: j, sha: h }; }
  return null;
}

// ---------- yetenek algilama ----------
const destek = (p) => { try { return CSS.supports(p); } catch { return false; } };
const YETENEK = [
  ["webgpu", "WebGPU", () => "gpu" in navigator, "Sahne perdesi (WGSL gölgelendirici)", "WebGL2 → CSS perde"],
  ["webgl2", "WebGL2", () => { try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; } }, "Sahne perdesi (GLSL ES 3.0)", "CSS degrade perde"],
  ["vt", "View Transitions (aynı belge)", () => "startViewTransition" in document, "GPT sonucu, köprü önizlemesi", "Anında değişim"],
  ["vtx", "View Transitions (belgeler arası)", () => "CSSViewTransitionRule" in window, "Atlas → kapı sayfası (logo, başlık)", "Normal sayfa yüklemesi"],
  ["scroll", "Scroll-driven animations", () => destek("animation-timeline: view()"), "Bölüm girişleri, üst şerit gölgesi", "Durağan görünüm"],
  ["property", "@property", () => "CSSPropertyRule" in window, "Kart kenar ışıltısı, perde ışığı", "Durağan degrade"],
  ["container", "Container queries", () => destek("container-type: inline-size"), "Köprü akışı, atölye parçaları", "Mobil öncelikli düzen"],
  ["anchor", "Anchor positioning", () => destek("anchor-name: --a"), "Atlas ipucu", "JS ile konum"],
  ["popover", "Popover API", () => HTMLElement.prototype.hasOwnProperty("popover"), "Kapı ayrıntısı", "Durum satırında metin"],
  ["has", ":has()", () => destek("selector(:has(a))"), "Hatalı formda düğme rengi, tablo vurgusu", "Kural uygulanmaz"],
  ["oklch", "oklch / color-mix", () => destek("color: oklch(0% 0 0)") && destek("color: color-mix(in srgb, red, blue)"), "Palet, kumaş tonları", "Hex palet"],
  ["waapi", "Web Animations API", () => "animate" in Element.prototype, "Sayaçlar", "Doğrudan sayı"],
  ["offscreen", "OffscreenCanvas + Worker", () => "transferControlToOffscreen" in HTMLCanvasElement.prototype, "50.000 hücreli atlas", "Ana iş parçacığında çizim"],
  ["balance", "text-wrap: balance", () => destek("text-wrap: balance"), "Başlıklar", "Normal satır kırma"],
  ["starting", "@starting-style", () => "CSSStartingStyleRule" in window, "Popover girişi", "Girişsiz açılış"],
  ["interp", "interpolate-size", () => destek("interpolate-size: allow-keywords"), "Makine uçları açılır kutusu", "Anında açılış"],
  ["field", "field-sizing", () => destek("field-sizing: content"), "Parçalar alanı", "Sabit yükseklik"],
  ["crypto", "Web Crypto SHA-256", () => !!globalThis.crypto?.subtle, "GPT kapısı, paket özeti, bütünlük denetimi", "Güvenli bağlam gerekir (https/localhost)"],
  ["rm", "prefers-reduced-motion", () => true, "Tüm hareket + elle anahtar", "—"],
  ["speculation", "Speculation Rules", () => !!(HTMLScriptElement.supports && HTMLScriptElement.supports("speculationrules")), "Kullanılmıyor: yayın sitesinin CSP'si satır içi kurala izin vermiyor", "Normal gezinme"],
];
const algi = Object.fromEntries(YETENEK.map(([id, , f]) => { try { return [id, !!f()]; } catch { return [id, false]; } }));
const algiNot = {};
for (const [k, v] of Object.entries(algi)) document.documentElement.dataset["cap" + k[0].toUpperCase() + k.slice(1)] = v ? "1" : "0";

function vitrinCiz() {
  const tb = $("#vitrin-tablo tbody"); if (!tb) return;
  tb.innerHTML = YETENEK.map(([id, ad, , nerede, yedek]) => {
    let d = algi[id] ? `<span class="var">çalışıyor</span>` : `<span class="yok">yedekte</span>`;
    if (id === "rm") d = `<span class="var">${sistemAzalt.matches ? "sistem: azalt" : "sistem: normal"}</span> · sayfa: ${hareketAcik ? "açık" : "kapalı"}`;
    if (algiNot[id]) d += ` <small class="kucuk">${kac(algiNot[id])}</small>`;
    return `<tr><th scope="row">${kac(ad)}</th><td>${d}</td><td>${kac(nerede)}</td><td>${kac(yedek)}</td></tr>`;
  }).join("");
}

// ---------- sahne perdesi: WebGPU -> WebGL2 -> CSS ----------
const GLSL = `#version 300 es
precision highp float;
uniform vec2 r; uniform vec2 m; uniform float t; out vec4 o;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/r;
  float x=uv.x*14.0;
  float f1=sin(x+sin(uv.y*3.0+t*.4)*.8+t*.25)*.5+.5;
  float f2=sin(x*2.3-t*.17+uv.y*1.5)*.5+.5;
  vec3 c=mix(vec3(.055,.031,.047),vec3(.643,.408,.298),pow(f1,3.)*.8+f2*.15);
  c=mix(c,vec3(.031,.059,.106),smoothstep(.35,1.,uv.x));
  vec2 s=m;
  float d=length((uv-s)*vec2(r.x/r.y,1.));
  c+=vec3(.88,.69,.49)*.35*exp(-d*d*4.);
  vec2 cell=floor(gl_FragCoord.xy/18.);
  vec2 g=fract(gl_FragCoord.xy/18.)-.5;
  float nokta=smoothstep(.14,.0,length(g));
  float yan=step(.985,fract(h(cell)+t*.05));
  c+=mix(vec3(.05,.1,.083),vec3(.5,1.,.83)*.9,yan)*nokta*smoothstep(.45,.9,uv.x);
  o=vec4(c,1.);
}`;
const WGSL = `struct U { r: vec2f, m: vec2f, t: f32, a: f32, b: f32, c: f32 };
@group(0) @binding(0) var<uniform> u: U;
@vertex fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  var p = array<vec2f, 3>(vec2f(-1., -3.), vec2f(3., 1.), vec2f(-1., 1.));
  return vec4f(p[i], 0., 1.);
}
fn h(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453); }
@fragment fn fs(@builtin(position) fc: vec4f) -> @location(0) vec4f {
  let r = u.r; let t = u.t;
  let q = vec2f(fc.x, r.y - fc.y);
  let uv = q / r;
  let x = uv.x * 14.;
  let f1 = sin(x + sin(uv.y * 3. + t * .4) * .8 + t * .25) * .5 + .5;
  let f2 = sin(x * 2.3 - t * .17 + uv.y * 1.5) * .5 + .5;
  var c = mix(vec3f(.055, .031, .047), vec3f(.643, .408, .298), pow(f1, 3.) * .8 + f2 * .15);
  c = mix(c, vec3f(.031, .059, .106), smoothstep(.35, 1., uv.x));
  let s = u.m;
  let d = length((uv - s) * vec2f(r.x / r.y, 1.));
  c += vec3f(.88, .69, .49) * .35 * exp(-d * d * 4.);
  let cell = floor(q / 18.);
  let g = fract(q / 18.) - .5;
  let nokta = smoothstep(.14, .0, length(g));
  let yan = step(.985, fract(h(cell) + t * .05));
  c += mix(vec3f(.05, .1, .083), vec3f(.5, 1., .83) * .9, yan) * nokta * smoothstep(.45, .9, uv.x);
  return vec4f(c, 1.);
}`;

async function perdeKur() {
  const cv = $("#perde"), yaz = m => { const e = $("#perde-motor"); if (e) e.textContent = m; };
  // spot isigi kullanici yonetir: imlec / dokunma; 4 sn dokunulmazsa yavasca gezinir
  const isik = [0.52, 0.62]; let elle = -1e9;
  const sahne = cv.parentElement;
  sahne.addEventListener("pointermove", e => {
    const b = cv.getBoundingClientRect();
    isik[0] = Math.min(1, Math.max(0, (e.clientX - b.left) / b.width)); isik[1] = Math.min(1, Math.max(0, 1 - (e.clientY - b.top) / b.height));
    elle = performance.now(); if (!hareketAcik) kare();
  });
  if (!cv) return;
  const boyut = () => { const k = Math.min(devicePixelRatio || 1, 2) * .6; cv.width = Math.max(1, Math.round(cv.clientWidth * k)); cv.height = Math.max(1, Math.round(cv.clientHeight * k)); };
  boyut();
  let ciz = null, motor = "CSS perde";
  try {
    if (navigator.gpu) {
      const adaptor = await navigator.gpu.requestAdapter();
      algiNot.webgpu = adaptor ? "adaptör var" : "adaptör yok";
      if (adaptor) {
        const cihaz = await adaptor.requestDevice();
        const ctx = cv.getContext("webgpu"), bicim = navigator.gpu.getPreferredCanvasFormat();
        ctx.configure({ device: cihaz, format: bicim, alphaMode: "opaque" });
        const mod = cihaz.createShaderModule({ code: WGSL });
        const hat = cihaz.createRenderPipeline({ layout: "auto", vertex: { module: mod, entryPoint: "vs" }, fragment: { module: mod, entryPoint: "fs", targets: [{ format: bicim }] }, primitive: { topology: "triangle-list" } });
        const tampon = cihaz.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        const bag = cihaz.createBindGroup({ layout: hat.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: tampon } }] });
        ciz = t => {
          cihaz.queue.writeBuffer(tampon, 0, new Float32Array([cv.width, cv.height, isik[0], isik[1], t, 0, 0, 0]));
          const kod = cihaz.createCommandEncoder();
          const g = kod.beginRenderPass({ colorAttachments: [{ view: ctx.getCurrentTexture().createView(), loadOp: "clear", storeOp: "store", clearValue: { r: 0, g: 0, b: 0, a: 1 } }] });
          g.setPipeline(hat); g.setBindGroup(0, bag); g.draw(3); g.end();
          cihaz.queue.submit([kod.finish()]);
        };
        motor = "WebGPU";
      }
    }
  } catch (e) { algiNot.webgpu = "hata: " + (e?.message || e).toString().slice(0, 60); ciz = null; }
  if (!ciz) {
    const gl = cv.getContext("webgl2", { antialias: false, alpha: false });
    if (gl) {
      const sh = (tip, src) => { const s = gl.createShader(tip); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
      try {
        const p = gl.createProgram();
        gl.attachShader(p, sh(gl.VERTEX_SHADER, "#version 300 es\nvoid main(){vec2 p=vec2[3](vec2(-1,-3),vec2(3,1),vec2(-1,1))[gl_VertexID];gl_Position=vec4(p,0,1);}"));
        gl.attachShader(p, sh(gl.FRAGMENT_SHADER, GLSL));
        gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
        gl.useProgram(p);
        const ur = gl.getUniformLocation(p, "r"), ut = gl.getUniformLocation(p, "t"), um = gl.getUniformLocation(p, "m");
        ciz = t => { gl.viewport(0, 0, cv.width, cv.height); gl.uniform2f(ur, cv.width, cv.height); gl.uniform2f(um, isik[0], isik[1]); gl.uniform1f(ut, t); gl.drawArrays(gl.TRIANGLES, 0, 3); };
        motor = "WebGL2";
      } catch (e) { algiNot.webgl2 = "derleme hatası"; ciz = null; }
    }
  }
  let dongu = 0, t0 = performance.now(), gorunur = true;
  const kare = () => { if (!ciz) return; const sn = (performance.now() - t0) / 1000; if (performance.now() - elle > 4000 && hareketAcik) { isik[0] = .52 + .12 * Math.sin(sn * .3); isik[1] = .62 + .05 * Math.cos(sn * .2); } ciz(sn); if (hareketAcik && gorunur) dongu = requestAnimationFrame(kare); };
  const yeniden = () => { cancelAnimationFrame(dongu); kare(); };
  new ResizeObserver(() => { boyut(); if (!hareketAcik) yeniden(); }).observe(cv);
  new IntersectionObserver(([e]) => { gorunur = e.isIntersecting; if (gorunur) yeniden(); }).observe(cv);
  hareketDinleyici.add(yeniden);
  yeniden();
  yaz(`İmleç ışığı yönetir · ${motor}${ciz ? "" : " (gölgelendirici çalışmadı)"}`);
  hareketDinleyici.add(() => yaz(`İmleç ışığı yönetir · ${motor}`));
  vitrinCiz();
}

// ---------- sayaclar (WAAPI) ----------
function sayacKur() {
  document.querySelectorAll("[data-say]").forEach((el, i) => {
    const hedef = +el.dataset.say;
    if (!hareketAcik || !el.animate) { el.textContent = sayi.format(hedef); return; }
    const a = el.animate([{ opacity: 0, transform: "translateY(.4em)" }, { opacity: 1, transform: "none" }], { duration: 900, delay: i * 140, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" });
    const adim = () => { const p = Math.min(1, Math.max(0, (a.currentTime - i * 140) / 900)); el.textContent = sayi.format(Math.round(hedef * (1 - (1 - p) ** 3))); if (p < 1) requestAnimationFrame(adim); };
    requestAnimationFrame(adim);
  });
}

// ---------- kopru: atolye -> kapi -> sahne ----------
const PROG = "birlesik.program.v1";
function guvenliMedya(s) {
  if (!s) return "";
  try { const u = new URL(s); if (u.protocol !== "https:" || u.username || u.password || !/\.(mp4|webm)$/i.test(u.pathname)) return null; return u.href; } catch { return null; }
}
function parcalarCoz(s) {
  return String(s || "").split(/\r?\n/).map(x => x.trim()).filter(Boolean).slice(0, 12).map(x => {
    const [ad, malzeme, renk] = x.split(/\s*[·|]\s*/);
    return { ad: (ad || "").slice(0, 60), malzeme: (malzeme || "").slice(0, 60), renk: /^#[0-9a-f]{6}$/i.test(renk || "") ? renk.toLowerCase() : "#a4684c" };
  }).filter(p => p.ad);
}
let sonPaket = null;
function kopruKur() {
  const f = $("#kopru-form"); if (!f) return;
  const rolCikis = $("#kapi-rol"), hata = $("#kopru-hata"), on = $("#kopru-onizleme"), indir = $("#kopru-indir");
  f.kapi.addEventListener("input", () => { const n = kapiCoz(f.kapi.value); rolCikis.textContent = n ? `${kod(n)} · ${ROLLER[rolu(n)][0]} · slot ${(n - 1) % BLOK + 1}` : "rol: —"; f.kapi.setCustomValidity(n || !f.kapi.value ? "" : "1–50.000 arası"); });
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const n = kapiCoz(f.kapi.value), med = guvenliMedya(f.kaynak.value.trim());
    const eksik = [];
    if (!f.tasarimci.value.trim()) eksik.push("tasarımcı");
    if (!f.koleksiyon.value.trim()) eksik.push("koleksiyon");
    if (!n) eksik.push("kapı (1–50.000)");
    if (!f.zaman.value) eksik.push("yayın zamanı");
    if (med === null) eksik.push("yayın kaynağı yalnız https .mp4/.webm");
    if (eksik.length) { hata.textContent = "Eksik ya da hatalı: " + eksik.join(", ") + "."; return; }
    hata.textContent = "";
    const k = kapiBilgi(n), at = new Date(f.zaman.value);
    const paket = {
      schema: "birlesik.handoff.v1", olusturma: new Date().toISOString(), execution: { modelCalls: 0, dispatch: "manual" },
      atolye: { kaynak: "afair.studio", tasarimci: f.tasarimci.value.trim().slice(0, 80), koleksiyon: f.koleksiyon.value.trim().slice(0, 80), parcalar: parcalarCoz(f.parcalar.value) },
      kapi: { kaynak: "selinahbap.com", kod: k.kod, rol: k.rolAd, slot: k.slot, talimat: k.talimat, beklenen: k.beklenen, adres: `https://www.selinahbap.com/kapilar/${k.kod}` },
      sahne: { kaynak: "afair.live", program: { name: f.koleksiyon.value.trim().slice(0, 80), at: at.toISOString() }, yayin: med || null, uyum: "afair.live.program.v1 alanları (name, at) korunur" },
      roller: ROLLER.map(([ad, talimat, beklenen]) => ({ ad, talimat, beklenen })),
      not: "Paket hazırlamak alıcıları çalıştırmaz. Yayın adresi doğrulanmadı.",
    };
    const metin = JSON.stringify(paket, null, 2), oz = await sha256(metin);
    sonPaket = { metin, oz, ad: `birlesik-${k.kod}.json` };
    gecis(() => {
      on.innerHTML = `<div class="akis"><div><b>Atölye</b>${kac(paket.atolye.tasarimci)} · ${kac(paket.atolye.koleksiyon)}<br><small class="kucuk">${paket.atolye.parcalar.length} parça</small></div>
        <div><b>Kapı</b>${k.kod} · ${kac(k.rolAd)}<br><small class="kucuk">${kac(k.beklenen)}</small></div>
        <div><b>Sahne</b>${at.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}<br><small class="kucuk">${med ? "kaynak girildi" : "kaynak yok"}</small></div></div>
        <p class="kucuk">SHA-256 <code>${oz}</code></p><pre>${kac(metin)}</pre>`;
    });
    indir.disabled = false;
    const liste = programTemiz(depo.al(PROG, [])).filter(x => x.kod !== k.kod).concat({ name: paket.sahne.program.name, at: paket.sahne.program.at, kod: k.kod, rol: k.rolAd, tasarimci: paket.atolye.tasarimci, parcalar: paket.atolye.parcalar, yayin: med || null }).slice(-20);
    const kalici = depo.koy(PROG, liste);
    programCiz(liste, kalici);
  });
  indir.addEventListener("click", () => {
    if (!sonPaket) return;
    const u = URL.createObjectURL(new Blob([sonPaket.metin], { type: "application/json" }));
    Object.assign(document.createElement("a"), { href: u, download: sonPaket.ad }).click();
    setTimeout(() => URL.revokeObjectURL(u), 1000);
  });
  $("#podyum-video")?.addEventListener("error", () => {
    $("#podyum-durum").textContent = "Yayın kaynağı açılamadı. Adres yanlış olabilir ya da bu sitenin güvenlik kuralı (CSP) başka alan adından video oynatmaya izin vermiyor.";
  });
  $("#program-temizle")?.addEventListener("click", () => { depo.koy(PROG, []); programCiz([], true); });
  programCiz(depo.al(PROG, []), true);
}
// localStorage elle bozulmus olabilir: her alan tur ve bicimiyle suzulur.
function programTemiz(liste) {
  const s = (v, n) => typeof v === "string" ? v.slice(0, n) : "";
  return (Array.isArray(liste) ? liste : []).filter(x => x && typeof x === "object" && typeof x.name === "string" && x.name && !isNaN(new Date(x.at)))
    .map(x => ({
      name: s(x.name, 80), at: new Date(x.at).toISOString(), kod: kapiCoz(x.kod) ? kod(kapiCoz(x.kod)) : "", rol: s(x.rol, 20), tasarimci: s(x.tasarimci, 80),
      yayin: guvenliMedya(s(x.yayin, 2000)) || null,
      parcalar: (Array.isArray(x.parcalar) ? x.parcalar : []).filter(p => p && typeof p === "object").slice(0, 12)
        .map(p => ({ ad: s(p.ad, 60), malzeme: s(p.malzeme, 60), renk: /^#[0-9a-f]{6}$/i.test(p.renk) ? p.renk.toLowerCase() : "#a4684c" })).filter(p => p.ad),
    }));
}
function programCiz(liste, kalici) {
  liste = programTemiz(liste);
  liste.sort((a, b) => new Date(a.at) - new Date(b.at));
  const ol = $("#program-liste"), durum = $("#podyum-durum"), vid = $("#podyum-video"), perde = $("#podyum-perde"), at = $("#atolye");
  ol.innerHTML = liste.map(x => `<li><time datetime="${kac(x.at)}">${new Date(x.at).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</time><b>${kac(x.name)}</b><small class="kucuk">${kac(x.tasarimci)}${x.kod ? ` · <a href="/terazi-kapi?k=${x.kod}">${x.kod}</a>` : ""} · ${kac(x.rol)}</small></li>`).join("");
  const yayin = [...liste].reverse().find(x => x.yayin);
  if (yayin) {
    if (vid.dataset.src !== yayin.yayin) { vid.src = yayin.yayin; vid.dataset.src = yayin.yayin; }
    vid.hidden = false; perde.hidden = true;
    durum.textContent = `Yayın kaynağı: ${new URL(yayin.yayin).host}. Adres doğrulanmadı; oynatma bu tarayıcıda.`;
  } else {
    vid.hidden = true; perde.hidden = false; vid.removeAttribute("src"); delete vid.dataset.src;
    durum.textContent = liste.length ? `${liste.length} program kaydı. Yayın kaynağı bekleniyor.` : "Yayın kaynağı bekleniyor. Doğrulanmış bir yayın saati henüz eklenmedi.";
  }
  if (!kalici) durum.textContent += " Tarayıcı depolaması kapalı: kayıt sayfa yenilenince silinir.";
  const parcalar = liste.flatMap(x => (x.parcalar || []).map(p => ({ ...p, koleksiyon: x.name })));
  at.innerHTML = parcalar.map(p => `<div class="parca" data-renk="${kac(p.renk)}"><b>${kac(p.ad)}</b><small>${kac(p.malzeme)} · ${kac(p.koleksiyon)}</small></div>`).join("");
  at.querySelectorAll(".parca").forEach(el => { if (/^#[0-9a-f]{6}$/.test(el.dataset.renk)) el.style.setProperty("--renk", el.dataset.renk); });
}

// ---------- atlas ----------
function atlasKur() {
  const cv = $("#atlas-tuval"); if (!cv) return;
  const kutu = cv.parentElement, ipucu = $("#atlas-ipucu"), capa = $("#atlas-capa"), durum = $("#atlas-durum"), pop = $("#kapi-pop"), ara = $("#atlas-ara");
  $("#rol-lejant").innerHTML = ROLLER.map(([ad], i) => `<li data-c="${ROL_RENK[i]}">${ad} <small class="kucuk">${sayi.format(i * BLOK + 1)}–${sayi.format((i + 1) * BLOK)}</small></li>`).join("");
  document.querySelectorAll("#rol-lejant li").forEach(li => li.style.setProperty("--c", li.dataset.c));
  let secili = 1903, isci = null, anaCtx = null, kucuk = null, dongu = 0;
  const W = cv.width, H = cv.height;
  if (algi.offscreen && window.Worker) {
    try {
      const off = cv.transferControlToOffscreen();
      isci = new Worker(new URL("./terazi--terazi-isci.js", import.meta.url), { type: "module" });
      isci.onerror = () => { algiNot.offscreen = "işçi açılamadı"; vitrinCiz(); };
      isci.postMessage({ tip: "baslat", tuval: off, hareket: hareketAcik }, [off]);
      isci.postMessage({ tip: "vurgu", id: secili });
    } catch (e) { isci = null; algiNot.offscreen = "aktarım hatası"; }
  }
  if (!isci) {
    anaCtx = cv.getContext("2d");
    const kare = t => { kucuk = ciz(anaCtx, W, H, secili, hareketAcik ? t : 0, kucuk); if (hareketAcik) dongu = requestAnimationFrame(kare); };
    hareketDinleyici.add(() => { cancelAnimationFrame(dongu); kare(0); });
    kare(0);
  } else hareketDinleyici.add(a => isci.postMessage({ tip: "hareket", acik: a }));
  const sec = (n, odakla) => {
    if (!n) return; secili = n;
    if (isci) isci.postMessage({ tip: "vurgu", id: n }); else { cancelAnimationFrame(dongu); kucuk = ciz(anaCtx, W, H, n, 0, kucuk); if (hareketAcik) dongu = requestAnimationFrame(function k(t) { kucuk = ciz(anaCtx, W, H, secili, t, kucuk); dongu = requestAnimationFrame(k); }); }
    const b = kapiBilgi(n);
    durum.textContent = `Seçili: ${b.kod} · ${b.rolAd} · slot ${sayi.format(b.slot)}. Enter ile ayrıntı.`;
    if (odakla) yerlestir(n);
  };
  const yerlestir = n => {
    const r = cv.getBoundingClientRect(), k = kutu.getBoundingClientRect(), { x, y } = konum(n);
    const px = r.left - k.left + cv.clientLeft + (x + .5) * cv.clientWidth / SUTUN, py = r.top - k.top + cv.clientTop + (y + .5) * cv.clientHeight / SATIR;
    capa.style.left = px + "px"; capa.style.top = py + "px";
    if (!algi.anchor) { ipucu.style.left = Math.min(Math.max(0, px - 60), k.width - 160) + "px"; ipucu.style.top = Math.max(0, py - 44) + "px"; }
    const b = kapiBilgi(n);
    ipucu.textContent = `${b.kod} · ${b.rolAd}`;
    ipucu.classList.add("gorunur");
  };
  // icerik kutusu (kenarlik haric) uzerinden hucre
  const hucre = e => { const r = cv.getBoundingClientRect(); return idAt(Math.floor((e.clientX - r.left - cv.clientLeft) / cv.clientWidth * SUTUN), Math.floor((e.clientY - r.top - cv.clientTop) / cv.clientHeight * SATIR)); };
  cv.addEventListener("pointermove", e => { const n = hucre(e); if (n) yerlestir(n); });
  cv.addEventListener("pointerleave", () => ipucu.classList.remove("gorunur"));
  cv.addEventListener("click", e => { const n = hucre(e); if (n) { sec(n, true); ac(n); } });
  cv.addEventListener("keydown", e => {
    const ok = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[e.key];
    const sayfa = { PageDown: BLOK, PageUp: -BLOK }[e.key];
    if (ok) {  // izgara sinirinda kal: satir/sutun sarmaz
      e.preventDefault(); const { x, y } = konum(secili);
      const n = idAt(Math.min(SUTUN - 1, Math.max(0, x + ok[0])), Math.min(SATIR - 1, Math.max(0, y + ok[1])));
      sec(n, true);
    }
    else if (sayfa) { e.preventDefault(); sec(Math.min(TOPLAM, Math.max(1, secili + sayfa)), true); }
    else if (e.key === "Home") { e.preventDefault(); sec(1, true); }
    else if (e.key === "End") { e.preventDefault(); sec(TOPLAM, true); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ac(secili); }
  });
  cv.addEventListener("blur", () => ipucu.classList.remove("gorunur"));
  ara.addEventListener("input", () => { const n = kapiCoz(ara.value); if (n) sec(n, true); else if (ara.value) durum.textContent = "1–50.000 arası bir kapı yazın."; });
  ara.addEventListener("keydown", e => { if (e.key === "Enter") { const n = kapiCoz(ara.value); if (n) ac(n); } });
  function ac(n) {
    const b = kapiBilgi(n);
    const html = `<p class="ust-yazi">${b.kod.toUpperCase()} / ${kac(b.rolAd.toLocaleUpperCase("tr-TR"))}</p><h3 id="kapi-pop-b" tabindex="-1">${kac(b.rolAd)} için bir kapı.</h3>
      <p>${kac(b.talimat)}</p><p class="kucuk">Beklenen teslim: ${kac(b.beklenen)}</p>
      <p class="kucuk">Bu adres henüz atanmış bir GPT oturumu veya tamamlanmış bir iş değildir.</p>
      <div class="satir"><a class="dugme ince" href="/terazi-kapi?k=${b.kod}">Kapı sayfası</a><button class="dugme bos ince" type="button" data-kopru="${n}">Köprüye taşı</button>
      <a class="dugme bos ince" href="https://www.selinahbap.com/calisma-alani?gate=${b.kod}" rel="noopener">selinahbap'ta başla ↗</a>${algi.popover ? `<button class="dugme bos ince" type="button" popovertarget="kapi-pop" popovertargetaction="hide">Kapat</button>` : ""}</div>`;
    if (algi.popover) {
      pop.innerHTML = html; pop.showPopover();
      $("#kapi-pop-b", pop).focus();
      durum.textContent = `${b.kod} ayrıntısı açıldı. Esc ile kapanır.`;
    } else { durum.innerHTML = html; }
    const k = (algi.popover ? pop : durum).querySelector("[data-kopru]");
    k?.addEventListener("click", () => { const f = $("#kopru-form"); f.kapi.value = kod(n); f.kapi.dispatchEvent(new Event("input")); if (algi.popover) pop.hidePopover(); f.tasarimci.focus(); f.scrollIntoView({ behavior: hareketAcik ? "smooth" : "auto" }); });
  }
  pop.addEventListener?.("toggle", e => { if (e.newState === "closed" && (!document.activeElement || document.activeElement === document.body || pop.contains(document.activeElement))) cv.focus({ preventScroll: true }); });
  sec(secili, false);
}

// ---------- GPT kapisi ----------
function gptKur() {
  const f = $("#gpt-form"), out = $("#gpt-sonuc"); if (!f) return;
  veriYukle().then(() => {
    $("#gorev-adet").dataset.say = GOREV.liste.length;
    out.innerHTML = `<p class="kucuk">${sayi.format(GOREV.liste.length)} görev hazır; ${sayi.format(Object.keys(DURUM.dolu || {}).length)} kapı dolu. Adını yaz.</p>`;
    defterCiz();
  }).catch(e => { out.innerHTML = `<p class="hata">Görev listesi yüklenemedi (${kac(e.message)}). Sayfayı bir sunucudan açın; file:// fetch'e izin vermez.</p>`; defterCiz(e); });
  f.addEventListener("submit", async e => {
    e.preventDefault();
    const ad = f.ad.value.trim();
    if (!/^[A-Za-z0-9_.-]{2,40}$/.test(ad)) { gecis(() => out.innerHTML = `<p class="hata">Ad 2–40 karakter: harf, rakam, _ . -</p>`); return; }
    if (!algi.crypto) { out.innerHTML = `<p class="hata">Web Crypto yok: sayfa https ya da localhost üzerinden açılmalı.</p>`; return; }
    await veriYukle();
    const g = await gorevBul(ad);
    if (!g) { out.innerHTML = `<p class="hata">Tüm görev kapıları dolu.</p>`; return; }
    const kmt = [`python -B gorev.py al --gpt ${ad}`, `python -B gorev.py bitir --gpt ${ad} --kapi ${g.kapi} --ozet "…" --cikti DOSYA --puan 0-10`];
    gecis(() => {
      out.innerHTML = `<div class="gorev-kart"><p class="ust-yazi">${kac(g.kapi)} · ${kac(g.rol.toLocaleUpperCase("tr-TR"))} · ${g.tur === "eksik" ? "DOĞRULANMIŞ EKSİK" : "MATRİS"} · SIRA ${sayi.format(g.sira + 1)}/${sayi.format(GOREV.liste.length)}</p>
        <h3>${kac(g.is)}</h3><p class="kucuk">Beklenen: ${kac(g.beklenen)}</p>
        <p class="kucuk">${g.senin ? "Bu kapı sende açık." : g.yoklama ? `Başlangıç kapısı doluydu; ${g.yoklama} adım ileride boş kapı bulundu.` : "Başlangıç kapın boş."} Durum: ${g.durum}.</p>
        ${kmt.map(c => `<div class="komut"><code>${kac(c)}</code><button class="dugme bos ince" type="button" data-kopya="${kac(c)}">Kopyala</button></div>`).join("")}
        <p class="kucuk">Kurallar: yalnız Kaptan'ın verdiği klasörlerde çalış; başkasının dosyasının üstüne yazma; yayın, DNS ve anahtar Kaptan'da.</p></div>`;
    });
  });
  out.addEventListener("click", async e => {
    const b = e.target.closest("[data-kopya]"); if (!b) return;
    try { await navigator.clipboard.writeText(b.dataset.kopya); b.textContent = "Kopyalandı"; } catch { b.textContent = "Kopyalanamadı"; }
  });
  $("#gpt-1903").addEventListener("click", async () => {
    if (!algi.crypto) return;
    await veriYukle();
    const L = GOREV.liste, al = new Set(Object.keys(DURUM.dolu || {})), N = Math.min(1903, L.length - al.size), t0 = performance.now();
    let top = 0, enUzun = 0;
    if (N < 1) { out.innerHTML = `<p class="hata">Boş görev kapısı kalmadı.</p>`; return; }
    out.innerHTML = `<p class="kucuk">1.903 ad dağıtılıyor…</p><div class="cubuk"><i id="cubuk"></i></div>`;
    const cubuk = $("#cubuk");
    for (let i = 1; i <= N; i++) {
      const h = await sha256("GPT-" + String(i).padStart(4, "0"));
      let j = parseInt(h.slice(0, 12), 16) % L.length, y = 0;
      while (al.has(L[j].kapi) && y < L.length) { j = (j + 1) % L.length; y++; }
      al.add(L[j].kapi); top += y; enUzun = Math.max(enUzun, y);
      if (i % 64 === 0) { cubuk.style.width = (i / N * 100) + "%"; await new Promise(r => setTimeout(r)); }
    }
    const ms = Math.round(performance.now() - t0), farkli = al.size - Object.keys(DURUM.dolu || {}).length;
    gecis(() => out.innerHTML = `<div class="gorev-kart"><p class="ust-yazi">BENZETİM · DEFTER YAZILMADI</p><h3>${sayi.format(N)} ad → ${sayi.format(farkli)} farklı kapı.</h3>${N < 1903 ? `<p class="kucuk">Yalnız ${sayi.format(N)} boş kapı vardı; dağıtım orada durdu.</p>` : ""}
      <p>Çakışan başlangıçlar ileri yoklamayla çözüldü: toplam ${sayi.format(top)} adım, en uzun ${sayi.format(enUzun)}. Süre ${sayi.format(ms)} ms. Boş kalan görev: ${sayi.format(L.length - al.size)}.</p>
      <p class="kucuk">Adlar GPT-0001…GPT-1903. Gerçek alma kilitli defterde sırayla yapılır; aynı kapıyı ikinci GPT açamaz.</p></div>`);
  });
}

// ---------- defter ----------
function defterCiz(hata) {
  const d = $("#defter-ic"); if (!d) return;
  if (hata || !DURUM) { d.innerHTML = `<p class="kucuk">durum.json okunamadı.</p>`; return; }
  const df = DURUM.defter || {};
  d.innerHTML = `<div><span class="kucuk">defter satırı</span><b>${sayi.format(df.satir ?? 0)}</b></div>
    <div><span class="kucuk">zincir</span><b>${df.zincir_dogru ? "doğru" : "BOZUK"}</b></div>
    <div><span class="kucuk">son halka</span><b><code>${kac((df.son || "").slice(0, 16))}…</code></b></div>
    <div><span class="kucuk">dolu görev kapısı</span><b>${sayi.format(Object.keys(DURUM.dolu || {}).length)} / ${sayi.format(DURUM.gorev_adet || 0)}</b></div>
    <div><span class="kucuk">sanal kapı (kapi.py)</span><b>${sayi.format(DURUM.kapi_toplam || 0)}</b></div>
    <div><span class="kucuk">durumu değişen kapı</span><b>${sayi.format(DURUM.kapi_degisen || 0)}</b></div>
    <p class="kucuk">Durum zamanı ${kac(DURUM.zaman || "—")}. Site k000001–k050000 adreslerini, defter K&lt;katman&gt;-S&lt;seri&gt;-&lt;no&gt; kimliklerini kullanır; iki biçimin eşlemesi açık bir görevdir.</p>`;
}

// ---------- butunluk: yayin paketini Web Crypto ile yeniden hesapla ----------
function butunlukKur() {
  const b = $("#butunluk-dugme"), oz = $("#butunluk-ozet"), ol = $("#butunluk-liste"); if (!b) return;
  b.addEventListener("click", async () => {
    if (!algi.crypto) { oz.textContent = "Web Crypto yok: sayfa https ya da localhost üzerinden açılmalı."; return; }
    b.disabled = true; oz.textContent = "Bütünlük dosyası okunuyor…"; ol.innerHTML = "";
    try {
      const r = await fetch("/terazi-butunluk.json", { cache: "no-store" });
      if (!r.ok) throw new Error(r.status === 404 ? "bütünlük dosyası yok (yalnız yayın paketinde üretilir)" : "HTTP " + r.status);
      const m = await r.json();
      const dosyalar = Object.entries(m.dosya || {});
      let tutan = 0;
      const sonuc = await Promise.all(dosyalar.map(async ([ad, d]) => {
        try {
          const y = await fetch("/" + ad, { cache: "no-store" });
          const h = [...new Uint8Array(await crypto.subtle.digest("SHA-256", await y.arrayBuffer()))].map(x => x.toString(16).padStart(2, "0")).join("");
          const ok = y.ok && h === d.sha;
          if (ok) tutan++;
          return { ad, ok, h, d };
        } catch (e) { return { ad, ok: false, h: "okunamadı", d }; }
      }));
      ol.innerHTML = sonuc.map(x => `<li class="${x.ok ? "var" : "yok"}"><code>${kac(x.ad)}</code> · ${sayi.format(x.d.bayt)} B · ${x.ok ? "tutar" : "TUTMUYOR"} <small class="kucuk">${kac(x.h.slice(0, 16))}…</small></li>`).join("");
      oz.textContent = `${tutan}/${dosyalar.length} dosya tutuyor. Paket sürümü ${String(m.paket_sha || "").slice(0, 12)}…${m.gorev_kapisi ? ` · görev kapısı ${m.gorev_kapisi}` : ""}.`;
    } catch (e) { oz.textContent = "Denetlenemedi: " + e.message; }
    b.disabled = false;
  });
}

// ---------- kapi sayfasi ----------
async function kapiSayfa() {
  const m = $("#kapi-ic"); if (!m) return;
  const q = new URLSearchParams(location.search).get("k") || "";
  const n = kapiCoz(q);
  if (n) {
    const b = kapiBilgi(n);
    document.title = `${b.kod} · ${b.rolAd} — Selinahbap × AFAIR`;
    m.innerHTML = `<p class="kapi-kod">${b.kod}</p><h1>${kac(b.rolAd)} için bir kapı.</h1><p>${kac(b.talimat)}</p><p class="kucuk">Beklenen teslim: ${kac(b.beklenen)} · slot ${sayi.format(b.slot)} / ${sayi.format(BLOK)}</p>
      <p class="kucuk">Bu adres henüz atanmış bir GPT oturumu veya tamamlanmış bir iş değildir.</p>
      <div class="satir"><a class="dugme" href="/terazi#atlas">Atlasa dön</a><a class="dugme bos" href="https://www.selinahbap.com/calisma-alani?gate=${b.kod}" rel="noopener">selinahbap'ta başla ↗</a></div>`;
    return;
  }
  if (/^K2-S[1-8]-\d{5}-\d$/.test(q)) {
    try { await veriYukle(); } catch { }
    const g = GOREV?.liste.find(x => x.kapi === q);
    if (g) {
      const d = DURUM?.dolu?.[q];
      document.title = `${g.kapi} — Selinahbap × AFAIR`;
      m.innerHTML = `<p class="kapi-kod">${kac(g.kapi)}</p><h1>${kac(g.rol)} görevi.</h1><p>${kac(g.is)}</p><p class="kucuk">Beklenen: ${kac(g.beklenen)} · durum: ${d ? kac(d.durum) + " (" + kac(d.acan || "—") + ")" : "BOŞ"}</p>
        <div class="satir"><a class="dugme" href="/terazi#gpt">GPT kapısına dön</a></div>`;
      return;
    }
  }
  m.innerHTML = `<p class="kapi-kod">?</p><h1>Bu kapı yok.</h1><p>1–50.000 arası bir adres (k001903) ya da bir görev kapısı (K2-S…) yazın.</p><a class="dugme" href="/terazi#atlas">Atlasa dön</a>`;
}

// ---------- baslat ----------
// ---------- dila video rafi: hareket aciksa gorunen video sessiz oynar; imlec ustundeyken oynar, ayrilinca durur ----------
function dilaVideo() {
  const vs = [...document.querySelectorAll(".dila-kart video")];
  const gorunur = new Set();
  const uygula = () => vs.forEach(v => { if (hareketAcik && gorunur.has(v)) v.play().catch(() => {}); else if (!v.matches(":hover")) v.pause(); });
  const io = new IntersectionObserver(es => { es.forEach(e => e.isIntersecting ? gorunur.add(e.target) : gorunur.delete(e.target)); uygula(); }, { threshold: 0.5 });
  vs.forEach(v => {
    v.muted = true; v.loop = true; v.preload = "metadata";
    io.observe(v);
    v.addEventListener("pointerenter", () => v.play().catch(() => {}));
    v.addEventListener("pointerleave", () => { if (!hareketAcik) v.pause(); });
  });
  hareketDinleyici.add(uygula);
}

function baslat() {
  hareketUygula();
  $("#hareket")?.addEventListener("click", () => { hareketAcik = !hareketAcik; depo.koy("birlesik.hareket", hareketAcik ? "acik" : "kapali"); hareketUygula(); vitrinCiz(); });
  sistemAzalt.addEventListener?.("change", () => { if (depo.al("birlesik.hareket", null) == null) { hareketAcik = !sistemAzalt.matches; hareketUygula(); vitrinCiz(); } });
  // belgeler arasi gecis: sayfa anahtari kapaliysa atla (sistem tercihi CSS'te)
  addEventListener("pageswap", e => { if (!hareketAcik) e.viewTransition?.skipTransition(); });
  const ust = $(".ust");
  if (ust) new ResizeObserver(() => document.documentElement.style.setProperty("--ust-h", ust.offsetHeight + "px")).observe(ust);
  if (document.documentElement.dataset.sayfa === "kapi") { kapiSayfa(); return; }
  if (document.documentElement.dataset.sayfa === "dila") { dilaVideo(); return; }
  // her bolum ayri: biri hata verirse digerleri yine kurulur
  for (const [ad, f] of [["vitrin", vitrinCiz], ["sayac", sayacKur], ["kopru", kopruKur], ["atlas", atlasKur], ["gpt", gptKur], ["butunluk", butunlukKur], ["perde", perdeKur]]) {
    try { const p = f(); p?.catch?.(e => console.error(ad, e)); } catch (e) { console.error(ad, e); }
  }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", baslat); else baslat();
