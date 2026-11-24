'use strict';
const V=JSON.parse(document.getElementById('veri').textContent);
const az=matchMedia('(prefers-reduced-motion: reduce)').matches;
const tr=n=>Number(n).toLocaleString('tr-TR');
const $=id=>document.getElementById(id);
const el=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!==undefined)n.textContent=h;return n};
const RENK={BEKLEYEN:'#3b4a7a',SERGIDE:'#5b8cff',HAZIR:'#7fffd4',KULLANIMDA:'#ff5fa2'};
const toplam=V.katmanlar.reduce((a,k)=>a+k.kapi,0);
const hedef={toplam,kullanim:V.katmanlar.find(k=>k.ad==='KULLANIMDA').kapi,zincir:V.zincirler.length,acik:V.acik_isler.length};
document.querySelectorAll('[data-say]').forEach(b=>{const h=hedef[b.dataset.say],t0=performance.now(),d=az?0:1800;
 const f=t=>{const p=d?Math.min(1,(t-t0)/d):1;b.textContent=tr(Math.round(h*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(f)};requestAnimationFrame(f)});
/* hero: drifting gate field */
(function(){const c=$('alan'),x=c.getContext('2d');let W,H,P=[];
 function boy(){W=c.width=innerWidth*devicePixelRatio;H=c.height=innerHeight*devicePixelRatio;P=[];const n=Math.min(900,Math.round(W*H/9000));
  for(let i=0;i<n;i++){const r=Math.random();P.push({x:Math.random()*W,y:Math.random()*H,v:.2+Math.random()*.6,k:r<.005?'KULLANIMDA':r<.05?'HAZIR':r<.2?'SERGIDE':'BEKLEYEN'})}}
 boy();addEventListener('resize',boy);
 function ciz(t){x.clearRect(0,0,W,H);for(const p of P){p.y-=az?0:p.v*devicePixelRatio;if(p.y<-10)p.y=H+10;const s=(p.k==='KULLANIMDA'?4:p.k==='HAZIR'?2.6:1.8)*devicePixelRatio;
  x.globalAlpha=p.k==='KULLANIMDA'?.6+.4*Math.sin(t/300+p.x):p.k==='BEKLEYEN'?.35:.75;x.fillStyle=RENK[p.k];x.fillRect(p.x,p.y,s,s)}
  x.globalAlpha=1;if(!az)requestAnimationFrame(ciz)}requestAnimationFrame(ciz)})();
/* tiers */
for(const k of V.katmanlar){const d=el('div');d.style.setProperty('--c',RENK[k.ad]);d.append(el('small',null,k.ad.toLowerCase())),d.append(el('b',null,tr(k.kapi)));
 d.append(el('small',null,k.parca+' parça · kapı başı '+String(k.kapi_bayt).replace('.',',')+' B · '+(k.toplam_bayt/1048576).toFixed(2).replace('.',',')+' MiB'));$('katlar').append(d)}
(function(){const c=$('harita'),x=c.getContext('2d');let hucre=[],W,H,cell;
 function kur(){W=c.width=c.clientWidth*devicePixelRatio;H=c.height=c.clientHeight*devicePixelRatio;hucre=[];
  for(const k of V.katmanlar){const n=Math.max(1,Math.round(k.kapi/100));for(let i=0;i<n;i++)hucre.push(k.ad)}
  const N=hucre.length;cell=Math.floor(Math.sqrt(W*H/N));}
 kur();addEventListener('resize',kur);
 function ciz(t){x.fillStyle='#070b18';x.fillRect(0,0,W,H);const cols=Math.floor(W/cell);
  hucre.forEach((k,i)=>{const cx=(i%cols)*cell,cy=Math.floor(i/cols)*cell;let a=k==='BEKLEYEN'?.28:k==='SERGIDE'?.7:1;
   if(k==='KULLANIMDA')a=.55+.45*Math.sin(t/250);if(k==='HAZIR')a=.75+.25*Math.sin(t/600+i);x.globalAlpha=a;x.fillStyle=RENK[k];x.fillRect(cx+1,cy+1,Math.max(1,cell-2),Math.max(1,cell-2))});
  x.globalAlpha=1;if(!az)requestAnimationFrame(ciz)}requestAnimationFrame(ciz)})();
/* chains */
const AD={SENT:'gönderildi',ACK:'alındı',STARTED:'başladı',ARTIFACT_READY:'teslim',ACCEPTED:'kabul'};
for(const z of V.zincirler){const b=el('div','zin');b.append(el('h3',null,z.ad));b.append(el('div','rid','istek kimliği: '+(z.request_id||'yok (gönderen vermedi)')));
 const a=el('div','adim');let son=0;z.adimlar.forEach((s,i)=>{const d=el('div','dug '+(s.var?'var':'yok'));d.append(el('i'));d.append(el('b',null,AD[s.ad]));
  d.append(el('small',null,s.var?(s.utc.replace('T',' ').replace('Z',' UTC')+(s.ms!=null?' · '+String(s.ms).replace('.',',')+' ms':'')):'kanıt yok'));a.append(d);if(s.var)son=i});
 const f=el('span','akis');f.style.setProperty('--son',(10+son*20)+'%');a.append(f);b.append(a);$('zincirler').append(b)}
/* measurements */
const O=V.olcum,olc=[[O.ses.puan+'/100','/ses · '+O.ses.karar,'Claude: '+O.ses_dosya+' ses dosyası, LUFS ve gerçek tepe beyanla aynı',O.ses.puan],
 [O.tarim.puan+'/100','/tarim · '+O.tarim.karar,'Codex: v3 veriyle 1.308/1.308 parsel; yeni alanların 0/3’ü gösteriliyor',O.tarim.puan],
 [O.iddia.dogrulandi+'/'+O.iddia.iddia,'rapor iddiası doğrulandı',O.iddia.sapma+' sapma · '+O.iddia.olculemedi+' ölçülemedi · '+O.iddia.bulgu+' bulgu',100*O.iddia.dogrulandi/O.iddia.iddia],
 [String(O.v3.kirilan),'bozulan eski alan (v3)',O.v3.urun+' parselde ürün değişti · '+tr(O.v3.m3)+' m³ · '+tr(O.v3.kuru)+' kuru tarım farkı',100],
 [O.era5.ozdes+'/10','ERA5 satırı aynı','her yıl '+String(O.era5.mm).replace('.',',')+' mm; yıllık seri yüklenmemiş',100],
 [O.sandbox.hata+'/'+O.sandbox.deneme,'sandbox hatası (Science)','kod hücreleri açılmıyor; açık engel',100]];
for(const [b1,b2,s,p] of olc){const d=el('div');const B=el('b',b2.includes('sandbox')?'k':null,b1);d.append(B,el('div',null,b2),el('small',null,s));const r=el('div','bar'),i=el('i');i.dataset.w=Math.min(100,p);r.append(i);d.append(r);$('olcler').append(d)}
/* contribution */
const ornek={schema:'ryte.kapi-karti.v1',kapi:'K3000417',katman:'HAZIR',request_id:'<benzersiz kimlik>',gonderen:'<istasyon>',gorev:V.acik_isler[0]?V.acik_isler[0].id:'R00',girdi_sha256:'<64 hane>',kabul:V.acik_isler[0]?V.acik_isler[0].kabul:'',son_tarih_utc:'<ISO zaman>',durum:'HAZIR'};
$('ornek').textContent=JSON.stringify(ornek,null,2);
const alanlar=['Tümü',...new Set(V.acik_isler.map(a=>a.alan))];let sec='Tümü';
function isleri(){$('isler').replaceChildren(...V.acik_isler.filter(a=>sec==='Tümü'||a.alan===sec).map(a=>{const d=el('div','is');d.append(el('span','sh',a.sahip));const h=el('div');h.append(el('code',null,a.id),document.createTextNode(' '+a.is));d.append(h,el('small',null,'kabul: '+a.kabul));return d}))}
alanlar.forEach(a=>{const b=el('button',a===sec?'on':null,a+(a==='Tümü'?' ('+V.acik_isler.length+')':''));b.onclick=()=>{sec=a;document.querySelectorAll('#filt button').forEach(x=>x.classList.toggle('on',x===b));isleri()};$('filt').append(b)});isleri();
/* reveal */
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');e.target.querySelectorAll('.bar i').forEach(i=>i.style.width=i.dataset.w+'%')}}),{threshold:.15});
document.querySelectorAll('.rev').forEach(s=>io.observe(s));
