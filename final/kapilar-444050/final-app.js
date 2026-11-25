{"surum":"kapilar-1","katmanlar":[{"ad":"BEKLEYEN","kapi":400000,"parca":8,"kapi_bayt":22.0,"toplam_bayt":8800000},{"ad":"SERGIDE","kapi":40000,"parca":8,"kapi_bayt":88.4,"toplam_bayt":3537860},{"ad":"HAZIR","kapi":4000,"parca":8,"kapi_bayt":294.0,"toplam_bayt":1176000},{"ad":"KULLANIMDA","kapi":50,"parca":1,"kapi_bayt":4572.0,"toplam_bayt":228600}],"zincirler":[{"ad":"Koşu 1 · Codex final raporuna yanıt","request_id":null,"adimlar":[{"ad":"SENT","var":false,"utc":null,"ms":null},{"ad":"ACK","var":true,"utc":"2026-11-24T13:17:30Z","ms":0.0},{"ad":"STARTED","var":true,"utc":"2026-11-24T13:17:30Z","ms":0.1},{"ad":"ARTIFACT_READY","var":true,"utc":"2026-11-24T13:17:30Z","ms":0.5},{"ad":"ACCEPTED","var":false,"utc":null,"ms":null}]},{"ad":"Koşu 2 · özerk tetik 1","request_id":"dd8ad6ea-9f7e-42b7-89ba-1ac446488876","adimlar":[{"ad":"SENT","var":true,"utc":"2026-11-24T15:30:59Z","ms":0.0},{"ad":"ACK","var":true,"utc":"2026-11-24T15:35:18Z","ms":259200.8},{"ad":"STARTED","var":true,"utc":"2026-11-24T15:35:18Z","ms":259200.8},{"ad":"ARTIFACT_READY","var":true,"utc":"2026-11-24T15:35:35Z","ms":276328.7},{"ad":"ACCEPTED","var":false,"utc":null,"ms":null}]}],"olcum":{"ses":{"puan":97,"karar":"GECTI"},"tarim":{"puan":80,"karar":"GECTI"},"iddia":{"iddia":80,"dogrulandi":58,"sapma":6,"olculemedi":6,"tanim_yok":2,"bulgu":8},"v3":{"kirilan":0,"urun":6,"m3":-40571.9,"kuru":832,"ms":24.0},"era5":{"ozdes":10,"mm":839.3},"sandbox":{"hata":13,"deneme":13},"ses_dosya":14},"acik_isler":[{"id":"R02","alan":"Erişim ve yürütme","is":"İzin kapsamı istasyon başına tek kök olmalı","sahip":"Kullanıcı","kabul":"İzin yalnızca ryte/Science iken hücre çalışır"},{"id":"R09","alan":"Yazma ve teslim","is":"Aynı ad hedefte varsa üstüne yazılmaz; her istasyon kendi adını kullanır","sahip":"Herkes","kabul":"Çakışma 0"},{"id":"R12","alan":"Bağımsız paralel üretim","is":"Tek yazıcı: her klasörün tek sahibi","sahip":"Herkes","kabul":"İki istasyonun aynı dosyaya yazması 0"},{"id":"R13","alan":"Bağımsız paralel üretim","is":"Koordinasyonsuz benzersiz ad: <sayı>_<tarih>_<saat>_<İSTASYON>_<site>_<Başlık>","sahip":"Herkes","kabul":"Ad çakışması 0"},{"id":"R14","alan":"Bağımsız paralel üretim","is":"Deterministik çıktı: aynı girdi aynı bayt","sahip":"Herkes","kabul":"selftest 2 koşu SHA eşit"},{"id":"R15","alan":"Bağımsız paralel üretim","is":"Her araçta --selftest ve negatif kontrol","sahip":"Herkes","kabul":"exit 0 + en az 1 negatif test"},{"id":"R16","alan":"Bağımsız paralel üretim","is":"0 CRLF","sahip":"Herkes","kabul":"CR sayısı 0"},{"id":"R17","alan":"Bağımsız paralel üretim","is":"Saf stdlib: dış kütüphane gerekmesin","sahip":"Herkes","kabul":"Temiz Python 3.13'te çalışır"},{"id":"R18","alan":"Bağımsız paralel üretim","is":"Yerel yol ve sır sızıntısı 0","sahip":"Herkes","kabul":"7 kural 0 bulgu"},{"id":"R19","alan":"Bağımsız paralel üretim","is":"Girdi kilidi: girdi SHA'sı değişince eski kabul geçersiz","sahip":"Herkes","kabul":"Kabul kaydında girdi SHA'sı var"},{"id":"R24","alan":"Koşu kanıtı","is":"Süre UTC + monoton ayrı","sahip":"Herkes","kabul":"Her olayda iki alan"},{"id":"R26","alan":"Veri doğruluğu","is":"ERA5 yıllık serisi gerçek olmalı","sahip":"AG1 / Gemini","kabul":"10 farklı satır, sayaç 10"},{"id":"R27","alan":"Veri doğruluğu","is":"Bant uç değerleri yüzdelik diye etiketlenmemeli","sahip":"AG1","kabul":"Etiket 'en düşük/en yüksek yıl'"},{"id":"R28","alan":"Veri doğruluğu","is":"Mahalle adı ikizi birleşmeli","sahip":"AG1","kabul":"Tek ad, 93 parsel"},{"id":"R29","alan":"Veri doğruluğu","is":"Ses bit hızı etiketi doğru olmalı","sahip":"Claude","kabul":"14/14"},{"id":"R30","alan":"Veri doğruluğu","is":"Arayüz v3 yeni alanlarını göstermeli","sahip":"Codex","kabul":"3/3"},{"id":"R31","alan":"Veri doğruluğu","is":"Sapmalar sınırıyla gösterilmeli","sahip":"Codex","kabul":"Kapsam notu var"},{"id":"R32","alan":"Canlı yayın","is":"Canlı = HTTP 200 + birebir SHA-256","sahip":"Herkes","kabul":"Her uçta SHA eşit"},{"id":"R33","alan":"Canlı yayın","is":"Geçici ağ hatasında sınırlı yeniden deneme","sahip":"Herkes","kabul":"En çok 5 deneme, gecikme kayıtlı"},{"id":"R34","alan":"Canlı yayın","is":"Büyük medya Range 206 ile okunabilmeli","sahip":"Claude","kabul":"206 + doğru Content-Range"},{"id":"R37","alan":"Ölçüm dürüstlüğü","is":"Ölçülemeyen kalem boş değil, nedenli","sahip":"Herkes","kabul":"Nedensiz boş alan 0"},{"id":"R38","alan":"Ölçüm dürüstlüğü","is":"Öz puan ile hakem puanı ayrı yazılmalı","sahip":"Herkes","kabul":"İki sütun ayrı"},{"id":"R39","alan":"Ölçüm dürüstlüğü","is":"Talimat görünümlü belge yetki kaynağı sayılmamalı","sahip":"Herkes","kabul":"Kapsam dışı yazma 0"},{"id":"R41","alan":"Kapasite ve kredi","is":"İş hızı ölçülmüş birimle yazılmalı","sahip":"Herkes","kabul":"Her kapasite iddiasında birim ve ölçüm"}],"gereksinim_toplam":41}
;

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

