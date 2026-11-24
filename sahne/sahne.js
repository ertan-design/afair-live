"use strict";
const S=JSON.parse(document.getElementById("kapi-sozlesmesi").textContent);
const TOPLAM=S.toplam, GIRIS=[1,4,8,11];
const $=s=>document.querySelector(s);
const SINA=new URLSearchParams(location.search).has("sina");

/* ---- SHA-256 (bağımsız; dosyadan da çalışır) ---- */
function sha256(str){
  const K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
  const b=new TextEncoder().encode(str), l=b.length, n=((l+9+63)>>6)<<6, m=new Uint8Array(n);
  m.set(b); m[l]=0x80; const dv=new DataView(m.buffer); dv.setUint32(n-4,l*8); dv.setUint32(n-8,Math.floor(l/0x20000000));
  const H=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]), w=new Uint32Array(64);
  const r=(x,y)=>(x>>>y)|(x<<(32-y));
  for(let o=0;o<n;o+=64){
    for(let i=0;i<16;i++)w[i]=dv.getUint32(o+i*4);
    for(let i=16;i<64;i++){const a=w[i-15],c=w[i-2];w[i]=(w[i-16]+(r(a,7)^r(a,18)^(a>>>3))+w[i-7]+(r(c,17)^r(c,19)^(c>>>10)))>>>0}
    let [A,B,C,D,E,F,G,Hh]=H;
    for(let i=0;i<64;i++){const t1=(Hh+(r(E,6)^r(E,11)^r(E,25))+((E&F)^(~E&G))+K[i]+w[i])>>>0,t2=((r(A,2)^r(A,13)^r(A,22))+((A&B)^(A&C)^(B&C)))>>>0;
      Hh=G;G=F;F=E;E=(D+t1)>>>0;D=C;C=B;B=A;A=(t1+t2)>>>0}
    H[0]+=A;H[1]+=B;H[2]+=C;H[3]+=D;H[4]+=E;H[5]+=F;H[6]+=G;H[7]+=Hh;
  }
  return Array.from(H,x=>x.toString(16).padStart(8,"0")).join("");
}

/* ---- kapı formülü (Python hakemiyle aynı) ---- */
function kapi(n){
  if(!Number.isInteger(n)||n<1||n>TOPLAM) throw new RangeError("kapı aralık dışı");
  let k=n;
  for(const t of S.katmanlar){const kap=t.blok*t.boy;
    if(k<=kap){const b=Math.floor((k-1)/t.boy),sira=(k-1)%t.boy+1,id="K-"+String(n).padStart(6,"0");
      const serit={};for(const g of GIRIS)serit[g]=(n-1)%g+1;
      return {n,kimlik:id,katman:t.ad,blok:b+1,sira,serit,muhur:sha256(`selinahbap|${id}|${t.ad}|${b+1}`).slice(0,12)}}
    k-=kap}
}
function coz(s){s=String(s).trim().toUpperCase().replace(/^K-?/,"").replace(/[.\s]/g,"");return /^\d+$/.test(s)?parseInt(s,10):NaN}

/* ---- sayaç ---- */
const RENK=["--t0","--t1","--t2","--t3"];
$("#sayac").innerHTML=S.katmanlar.map((t,i)=>`<div><b data-hedef="${t.blok*t.boy}">0</b><span><i class="k${i}"></i>${t.ad} · ${t.blok}×${t.boy.toLocaleString("tr-TR")}</span></div>`).join("");
const hiz=matchMedia("(prefers-reduced-motion:reduce)").matches;
document.querySelectorAll("[data-hedef]").forEach(el=>{const h=+el.dataset.hedef,t0=performance.now();
  const f=t=>{const p=hiz?1:Math.min(1,(t-t0)/1600),e=1-Math.pow(1-p,3);el.textContent=Math.round(h*e).toLocaleString("tr-TR");if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)});

/* ---- WebGL2 sahne: 444.050 nokta, tampon yok, konum gl_VertexID'den ---- */
const cv=$("#sahne"); let secili=-1, gl=null, prog=null, U={}, t00=performance.now();
const VS=`#version 300 es
precision highp float; precision highp int;
uniform float uT; uniform vec2 uR; uniform int uSec; uniform vec2 uFare;
uniform vec3 c0,c1,c2,c3,cs;
out vec3 vC; out float vA;
uint hs(uint x){x^=x>>16;x*=0x7feb352du;x^=x>>15;x*=0x846ca68bu;x^=x>>16;return x;}
float h1(uint x){return float(hs(x)&0xffffu)/65535.0;}
void main(){
  int n=gl_VertexID+1; uint u=uint(n);
  int tier; int b; float s; float r0,r1,y; vec3 c; float sz;
  if(n<=400000){tier=0;b=(n-1)/50000;s=float((n-1)%50000)/50000.0;r0=.55;r1=1.15;y=-.62;c=c0;sz=1.4;}
  else if(n<=440000){tier=1;int k=n-400001;b=k/5000;s=float(k%5000)/5000.0;r0=.30;r1=.62;y=-.18;c=c1;sz=2.0;}
  else if(n<=444000){tier=2;int k=n-440001;b=k/500;s=float(k%500)/500.0;r0=.14;r1=.30;y=.16;c=c2;sz=2.8;}
  else{tier=3;int k=n-444001;b=0;s=float(k)/50.0;r0=.02;r1=.10;y=.46;c=c3;sz=7.0;}
  float kol=float(b)*6.2831853/8.0;
  float rr=mix(r0,r1,sqrt(s))+(h1(u)-.5)*.06*(r1-r0)*4.0;
  float a=kol+s*3.6+(h1(u*7u)-.5)*.5;
  if(tier==3){a=s*6.2831853;rr=.11;}
  float yy=y+(h1(u*13u)-.5)*(tier==0?.10:.06)+(tier==3?sin(uT*1.5+s*12.0)*.03:0.0);
  vec3 p=vec3(cos(a)*rr,yy,sin(a)*rr);
  float don=uT*.07+uFare.x*.6; float cd=cos(don),sd=sin(don);
  p=vec3(cd*p.x+sd*p.z,p.y,-sd*p.x+cd*p.z);
  float eg=.42+uFare.y*.15; float ce=cos(eg),se=sin(eg);
  p=vec3(p.x,ce*p.y-se*p.z,se*p.y+ce*p.z);
  float z=p.z+2.4; vec2 q=p.xy/z*3.1; q.x*=uR.y/uR.x; q.y+=.22;
  gl_Position=vec4(q,0.,1.);
  float pul=tier==3?(.75+.25*sin(uT*3.0+s*30.0)):1.0;
  vC=c; vA=(tier==0?.33:tier==1?.55:tier==2?.75:1.0)*pul;
  gl_PointSize=sz*(2.4/z)*(uR.x>900.?1.0:.8);
  if(n==uSec){gl_PointSize=26.0;vC=cs;vA=1.0;}
}`;
const FS=`#version 300 es
precision mediump float; in vec3 vC; in float vA; out vec4 o;
void main(){vec2 d=gl_PointCoord-.5;float r=dot(d,d);if(r>.25)discard;float a=vA*(1.-r*3.2);o=vec4(vC*a,a);}`;
function renk(v){const c=getComputedStyle(document.documentElement).getPropertyValue(v).trim(),x=c.replace("#","");
  return [0,2,4].map(i=>parseInt(x.slice(i,i+2),16)/255)}
function glKur(){
  gl=cv.getContext("webgl2",{antialias:false,premultipliedAlpha:false,powerPreference:"high-performance"});
  if(!gl)return false;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);if(!gl.getShaderParameter(o,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(o));return o};
  prog=gl.createProgram();gl.attachShader(prog,sh(gl.VERTEX_SHADER,VS));gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);gl.bindVertexArray(gl.createVertexArray());
  for(const k of["uT","uR","uSec","uFare","c0","c1","c2","c3","cs"])U[k]=gl.getUniformLocation(prog,k);
  gl.enable(gl.BLEND);renkVer();return true}
function koyuMu(){const r=document.documentElement;return r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches}
function renkVer(){if(!gl)return;["c0","c1","c2","c3"].forEach((k,i)=>gl.uniform3fv(U[k],renk(RENK[i])));gl.uniform3fv(U.cs,renk("--tech"));
  /* koyu zeminde ışık toplanır (ekleyici), açık zeminde mürekkep gibi üst üste biner */
  if(koyuMu())gl.blendFunc(gl.ONE,gl.ONE);else gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA)}
let fare=[0,0],hedefFare=[0,0];
addEventListener("pointermove",e=>{hedefFare=[e.clientX/innerWidth-.5,e.clientY/innerHeight-.5]},{passive:true});
function boyut(){const d=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();cv.width=Math.round(r.width*d);cv.height=Math.round(r.height*d);if(gl)gl.viewport(0,0,cv.width,cv.height)}
addEventListener("resize",boyut);
let gorunur=true;new IntersectionObserver(e=>gorunur=e[0].isIntersecting).observe(cv);
function ciz(t){
  requestAnimationFrame(ciz);if(!gorunur||!gl)return;
  fare=fare.map((v,i)=>v+(hedefFare[i]-v)*.04);
  const bg=renk("--bg");gl.clearColor(bg[0],bg[1],bg[2],1);gl.clear(gl.COLOR_BUFFER_BIT);
  gl.uniform1f(U.uT,hiz?0:(t-t00)/1000);gl.uniform2f(U.uR,cv.width,cv.height);gl.uniform1i(U.uSec,secili);gl.uniform2f(U.uFare,fare[0],fare[1]);
  gl.drawArrays(gl.POINTS,0,TOPLAM)}
let glDurum="yok";
try{boyut();if(glKur()){glDurum="webgl2 · "+TOPLAM.toLocaleString("tr-TR")+" nokta";requestAnimationFrame(ciz)}else{cizYedek();glDurum="webgl2 yok · 2D yedek"}}
catch(e){glDurum="sahne hatası: "+e.message;cizYedek()}
$("#gl").textContent=" · sahne: "+glDurum;
function cizYedek(){const c=cv.getContext("2d");if(!c)return;boyut();const w=cv.width,h=cv.height;c.fillStyle=getComputedStyle(document.body).backgroundColor;c.fillRect(0,0,w,h);
  S.katmanlar.forEach((t,i)=>{c.fillStyle=getComputedStyle(document.documentElement).getPropertyValue(RENK[i]);const adet=Math.min(4000,t.blok*t.boy);
    for(let j=0;j<adet;j++){const a=j/adet*Math.PI*16,rr=(1-i/4)*Math.min(w,h)*.42*Math.sqrt(j/adet);c.fillRect(w/2+Math.cos(a)*rr,h*(.75-i*.17)+Math.sin(a)*rr*.25,i==3?4:1.2,i==3?4:1.2)}})}

/* ---- kapı kartı ---- */
function kart(k){
  return `<div class="eye">${k.katman}${k.katman==="kullanimda"?" · AFAIR pist slotu "+(k.n-444000):""}</div>
  <h2 class="ust6">${k.kimlik}</h2>
  <dl class="kapi"><dt>Katman / blok / sıra</dt><dd>${k.katman} · ${k.blok} · ${k.sira.toLocaleString("tr-TR")}</dd>
  <dt>Şerit 1 · 4 · 8 · 11</dt><dd>${GIRIS.map(g=>k.serit[g]).join(" · ")}</dd>
  <dt>Mühür</dt><dd class="muhur mono">${k.muhur}</dd>
  <dt>Durum</dt><dd>${k.katman==="kullanimda"?"canlı slot · yayın bekliyor":k.katman==="hazir"?"açılmaya hazır":k.katman==="sergi"?"sergide":"bekliyor · 0 bayt"}</dd></dl>`}
function ac(n,kaydir){
  let k;try{k=kapi(n)}catch(e){$("#kart").innerHTML=`<p class="hata">Kapı 1 ile ${TOPLAM.toLocaleString("tr-TR")} arasında olmalı.</p>`;return}
  const yap=()=>{$("#kart").innerHTML=kart(k);secili=n;history.replaceState(null,"",location.pathname+location.search+"#"+k.kimlik)};
  document.startViewTransition&&!hiz?document.startViewTransition(yap):yap();
  if(kaydir)$("#kapi").scrollIntoView({behavior:hiz?"auto":"smooth"});
  return k}
$("#bulform").addEventListener("submit",e=>{e.preventDefault();ac(coz($("#bul").value),false)});
$("#rastgele").addEventListener("click",()=>{const n=1+Math.floor(Math.random()*TOPLAM);$("#bul").value=n;ac(n,false)});

/* ---- pist ---- */
let G=11;
function pist(){
  $("#pistgrid").innerHTML=Array.from({length:50},(_,i)=>{const n=444001+i,s=(n-1)%G+1;
    return `<button class="slot${secili===n?" sec":""}" data-n="${n}" data-serit="G${s}" data-isik="${(.1+.5*((i*37)%50)/50).toFixed(2)}" aria-label="Slot ${i+1}, şerit ${s}"><span>${String(i+1).padStart(2,"0")}</span></button>`}).join("");
document.querySelectorAll(".slot[data-isik]").forEach(b=>b.style.setProperty("--isik",b.dataset.isik));
}
$("#pistgrid").addEventListener("click",e=>{const b=e.target.closest(".slot");if(!b)return;const k=ac(+b.dataset.n,false);
  document.querySelectorAll(".slot").forEach(x=>x.classList.toggle("sec",x===b));
  $("#dlgic").innerHTML=kart(k)+`<pre class="mono">${komut(G,k.serit[G],k.kimlik)}</pre>`;$("#dlg").showModal()});
$("#dlgkapa").addEventListener("click",()=>$("#dlg").close());

/* ---- GPT şeritleri ---- */
function komut(g,s,id){return `# GPT ${s}/${g} · yalnız kendi kapıları\npython -B kutu.py ates --serit ${g}\n# kapı: ${id||"K-4440xx"} · al → başla → teslim → kabul (ates.py)`}
function seritCiz(){
  $("#seritler").innerHTML=GIRIS.map(g=>`<button type="button" aria-pressed="${g===G}" data-g="${g}">${g} şerit</button>`).join("");
  const say=Array.from({length:G},(_,i)=>Math.floor(50/G)+(i<50%G?1:0));
  $("#akis").innerHTML=say.map((c,i)=>`<div class="s"><span class="mono">GPT ${i+1}</span><div class="bar"><i></i></div><span class="mono">${c} kapı</span></div>`).join("");
  requestAnimationFrame(()=>document.querySelectorAll("#akis .bar i").forEach((el,i)=>el.style.setProperty("--g",(say[i]/Math.max(...say)*100)+"%")));
  $("#komut").textContent=komut(G,1);pist()}
$("#seritler").addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;G=+b.dataset.g;
  document.startViewTransition&&!hiz?document.startViewTransition(seritCiz):seritCiz()});
seritCiz();

/* ---- sözleşme ---- */
$("#sozmetin").textContent=JSON.stringify(S,null,1);
$("#kopyala").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(JSON.stringify(S));$("#kopyadurum").textContent="kopyalandı"}catch{$("#kopyadurum").textContent="kopyalanamadı; bloğu seçip kopyala"}});

/* ---- tema ---- */
$("#tema").addEventListener("click",()=>{document.documentElement.dataset.theme=koyuMu()?"light":"dark";renkVer()});
matchMedia("(prefers-color-scheme:dark)").addEventListener("change",renkVer);

/* ---- görünüşe giriş (eski tarayıcı yedeği) ---- */
if(!CSS.supports("animation-timeline:view()")){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("gor");io.unobserve(e.target)}}),{threshold:.15});document.querySelectorAll(".gir").forEach(el=>io.observe(el))}

/* ---- başlangıç kapısı ---- */
const h=coz(decodeURIComponent(location.hash.slice(1)));ac(Number.isInteger(h)&&h>=1&&h<=TOPLAM?h:444001,false);

/* ---- sınama kancası: ?sina=1 mühürleri DOM'a yazar (Python hakemi karşılaştırır) ---- */
if(SINA){const o=document.createElement("pre");o.id="sina";
  o.textContent=JSON.stringify({gl:glDurum,kapilar:[1,50000,400000,400001,440001,444001,444050,123457].map(n=>kapi(n))});document.body.append(o)}
