import {createScene} from './nexus-scene.js';
export const VERSION='nexus-1.0.0';
export const ROLES=[
 ['research','Araştırma','Soruyu netleştir; güvenilir kaynakları ve bilinmeyenleri ayır.','Kaynağa bağlı bulgular ve açık kalan tek soru.'],
 ['data','Veri','İlgili veriyi yapılandır; alanları, birimleri ve kaynağı açık tut.','Örnek veri, şema ve doğrulama kuralları.'],
 ['design','Tasarım','Görevin ekranda ve sahnede nasıl anlaşılacağını tasarla.','Klavye ve farklı ekranlarda kullanılabilir bir akış.'],
 ['build','Üretim','Tanımlı işi tamamlayan, incelenebilir bir parça geliştir.','Çalışan çıktı ve tekrar edilebilir kullanım adımı.'],
 ['qa','Kontrol','Çıktıyı kabul ölçütleriyle sınayıp gerçek sonucu kaydet.','Geçen kontroller, bulunan hatalar ve tekrar adımları.'],
 ['security','Güvenlik','Veri, yetki ve paylaşım sınırlarını kontrol et.','Risk, etkilenen alan ve uygulanabilir düzeltme.'],
 ['package','Paket','Alıcının okuyabileceği taşınabilir bir teslim hazırla.','Dosya listesi, sürüm, kaynak ve bütünlük bilgisi.'],
 ['handoff','Devir','Sonucu alıcısına ve bir sonraki somut işe bağla.','Alıcı, teslim, açık engel ve sonraki adım.']
];
const LIMIT=1024*1024,MAX_RECORDS=64;
const fields=['schema','gate','role','author','title','summary','acceptance','sources','baseVersion'];
function exactKeys(o,keys){if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).length!==keys.length||Object.keys(o).some(k=>!keys.includes(k)))throw Error('Dosyanın alanları beklenen şemayla eşleşmiyor.');}
function text(v,name,max){if(typeof v!=='string'||!v.trim()||[...v].length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(v))throw Error(name+' alanını ve uzunluğunu kontrol et.');return v.trim();}
export function validateRecord(o){
 exactKeys(o,fields);if(o.schema!=='gaia.afair.contribution.v1'||o.baseVersion!==VERSION)throw Error('Katkı sürümü desteklenmiyor.');
 if(!Number.isInteger(o.gate)||o.gate<1||o.gate>1903)throw Error('Kapı numarası 1–1903 arasında tam sayı olmalı.');
 if(!ROLES.some(r=>r[0]===o.role))throw Error('Katkı rolü tanınmıyor.');
 if(!Array.isArray(o.sources)||o.sources.length>8)throw Error('En fazla sekiz HTTPS kaynak adresi kullan.');
 const sources=o.sources.map(s=>{if(typeof s!=='string'||s.length>1000||!/^https:\/\/[^\s/?#@]+(?:[/?#][^\s]*)?$/.test(s))throw Error('Kaynak adresleri geçerli HTTPS adresleri olmalı.');let u;try{u=new URL(s);}catch{throw Error('Kaynak adresi geçersiz.');}if(u.protocol!=='https:'||u.username||u.password||!u.hostname)throw Error('Kaynak adresinde kullanıcı bilgisi bulunamaz.');return u.href;});
 return {schema:o.schema,gate:o.gate,role:o.role,author:text(o.author,'Gönderen',120),title:text(o.title,'Başlık',180),summary:text(o.summary,'Katkı',6000),acceptance:text(o.acceptance,'Kabul ölçütü',2000),sources,baseVersion:VERSION};
}
export function validateWorkspace(o){
 exactKeys(o,['schema','baseVersion','gate','role','mode','contributions']);
 if(o.schema!=='gaia.afair.workspace.v1'||o.baseVersion!==VERSION)throw Error('Çalışma paketi sürümü desteklenmiyor.');
 if(!Number.isInteger(o.gate)||o.gate<1||o.gate>1903||!ROLES.some(r=>r[0]===o.role)||!['network','stage','timeline'].includes(o.mode))throw Error('Çalışma alanı seçimi geçersiz.');
 if(!Array.isArray(o.contributions)||o.contributions.length>MAX_RECORDS)throw Error('Bir pakette en fazla 64 katkı bulunabilir.');
 const records=o.contributions.map(validateRecord),seen=new Set();for(const r of records){const key=JSON.stringify(r);if(seen.has(key))throw Error('Paket aynı katkıyı tekrar içeriyor.');seen.add(key);}
 const result={schema:o.schema,baseVersion:VERSION,gate:o.gate,role:o.role,mode:o.mode,contributions:records};if(new TextEncoder().encode(JSON.stringify(result)).length>LIMIT)throw Error('Paket üst sınırı 1 MiB.');return result;
}
export function parseImport(raw){if(typeof raw!=='string'||new TextEncoder().encode(raw).length>LIMIT)throw Error('Paket üst sınırı 1 MiB.');let o;try{o=JSON.parse(raw);}catch{throw Error('JSON dosyası okunamadı.');}if(o?.schema==='gaia.afair.contribution.v1'){const r=validateRecord(o);return {schema:'gaia.afair.workspace.v1',baseVersion:VERSION,gate:r.gate,role:r.role,mode:'network',contributions:[r]};}return validateWorkspace(o);}
function init(){
 const $=id=>document.getElementById(id),key='gaia.afair.nexus.v1';let scene=null,mediaUrl=null,provaFrame=0,provaRunning=false,disposed=false;
 const initial={schema:'gaia.afair.workspace.v1',baseVersion:VERSION,gate:1,role:'research',mode:location.hostname.includes('afair.live')?'stage':'network',contributions:[]};let state={...initial};
 const status=(id,msg)=>{$(id).textContent=msg;};
 function workspace(){return validateWorkspace(state);}
 function save(){if(!$('persist').checked)return;try{localStorage.setItem(key,JSON.stringify(workspace()));}catch{status('package-status','Cihaz kaydı yapılamadı. Paketi indirerek koruyabilirsin.');}}
 function transition(fn){if(document.startViewTransition&&!matchMedia('(prefers-reduced-motion: reduce)').matches){try{document.startViewTransition(fn).finished.catch(()=>{});}catch{fn();}}else fn();}
 function toast(msg){$('toast').textContent=msg;$('toast').hidden=false;setTimeout(()=>{$('toast').hidden=true;},4500);}
 const roleIndex=()=>ROLES.findIndex(r=>r[0]===state.role);
 function selectRole(index){state.role=ROLES[index][0];const r=ROLES[index];$('role-code').textContent='G'+String(index+1).padStart(2,'0');$('inspector-title').textContent=r[1];$('inspector-copy').textContent=r[2];$('acceptance-copy').textContent=r[3];$('role-label').textContent=r[1];$('roles').querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));scene?.setRole(index);save();}
 function setGate(n){if(!Number.isInteger(n)||n<1||n>1903)throw Error('Kapı numarası 1–1903 arasında tam sayı olmalı.');state.gate=n;$('gate').value=n;$('gate-label').textContent='K'+String(n).padStart(4,'0');save();}
 function mode(m){if(!['network','stage','timeline'].includes(m))return;state.mode=m;document.body.dataset.mode=m;$('visual-panel').setAttribute('aria-labelledby','mode-'+m);$('scene-title').textContent={network:'Bağlantılı sistem',stage:'Üretimin sahne görünümü',timeline:'Katkıların zaman görünümü'}[m];document.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.mode===m));b.tabIndex=b.dataset.mode===m?0:-1;});scene?.setMode(m);save();}
 ROLES.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-pressed',String(i===0));const n=document.createElement('span');n.textContent=String(i+1).padStart(2,'0');b.append(n,document.createTextNode(r[1]));b.onclick=()=>selectRole(i);$('roles').append(b);});
 document.querySelectorAll('[data-mode]').forEach((b,i,list)=>{b.onclick=()=>transition(()=>mode(b.dataset.mode));b.onkeydown=e=>{let n;if(e.key==='ArrowRight')n=(i+1)%3;if(e.key==='ArrowLeft')n=(i+2)%3;if(e.key==='Home')n=0;if(e.key==='End')n=2;if(n!==undefined){e.preventDefault();mode(list[n].dataset.mode);list[n].focus();}};});
 $('open-gate').onclick=()=>{try{setGate(Number($('gate').value));toast('Kapı seçildi: '+$('gate-label').textContent);}catch(e){status('package-status',e.message);$('gate').focus();}};
 $('gate').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('open-gate').click();}};
 let motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 function motionUI(){$('motion').setAttribute('aria-pressed',String(motion));$('motion').textContent=motion?'Hareketi durdur':'Hareketi başlat';}
 try{scene=createScene($('scene'),stats=>{if(disposed)return;$('renderer').textContent=stats.renderer;$('fps').textContent=stats.motion&&stats.fps>0?Math.round(stats.fps)+' FPS / GÖRSEL':'DURAĞAN GÖRÜNÜM';});scene.setMotion(motion);}catch{status('renderer','Grafik görünümü kullanılamıyor');status('fps','Görev araçları kullanılabilir');}motionUI();
 $('motion').onclick=()=>{motion=!motion;scene?.setMotion(motion);motionUI();};
 $('persist').onchange=()=>{if($('persist').checked){save();toast('Bu tarayıcı için kayıt açık.');}else{try{localStorage.removeItem(key);}catch{}toast('Cihaz kaydı kapatıldı. Açık çalışma bellekte duruyor.');}};
 function renderRecords(){
  $('contribution-count').textContent=state.contributions.length;const target=$('contributions');target.replaceChildren();
  if(!state.contributions.length){const p=document.createElement('p');p.className='empty';p.textContent='Henüz katkı yok. Bir rol seçerek ilk öneriyi ekleyebilirsin.';target.append(p);return;}
  for(const record of [...state.contributions].reverse()){
   const a=document.createElement('article');a.className='contribution';const h=document.createElement('header');h.textContent=`K${String(record.gate).padStart(4,'0')} · ${ROLES.find(r=>r[0]===record.role)[1]} · TASLAK`;
   const title=document.createElement('h4');title.textContent=record.title;const body=document.createElement('p');body.textContent=record.summary;const proof=document.createElement('p');proof.className='proof';proof.textContent='Kabul: '+record.acceptance;const by=document.createElement('p');by.textContent='Gönderen etiketi: '+record.author;a.append(h,title,body,proof,by);
   if(!record.sources.length){const p=document.createElement('p');p.className='fine';p.textContent='Kaynak eklenmedi; öneri doğrulanmış bulgu değildir.';a.append(p);}
   for(const source of record.sources){const link=document.createElement('a');link.href=source;link.target='_blank';link.rel='noopener noreferrer';link.textContent=source+' ↗';a.append(link);}
   const hash=document.createElement('span');hash.className='hash';hash.textContent='İçerik özeti hesaplanıyor…';a.append(hash);target.append(a);
   if(crypto.subtle)crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(record))).then(bytes=>{hash.textContent='SHA-256 / '+[...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');}).catch(()=>{hash.textContent='İçerik özeti hesaplanamadı.';});else hash.textContent='İçerik özeti için güvenli tarayıcı bağlamı gerekli.';
  }
 }
 $('contribution-form').onsubmit=e=>{e.preventDefault();try{if(state.contributions.length>=MAX_RECORDS)throw Error('Paket 64 katkıya ulaştı. Önce mevcut paketi indir.');const record=validateRecord({schema:'gaia.afair.contribution.v1',gate:state.gate,role:state.role,author:$('author').value,title:$('title').value,summary:$('summary').value,acceptance:$('acceptance').value,sources:$('sources').value.split('\n').map(s=>s.trim()).filter(Boolean),baseVersion:VERSION});if(state.contributions.some(r=>JSON.stringify(r)===JSON.stringify(record)))throw Error('Bu katkı zaten pakette.');const next=validateWorkspace({...state,contributions:[...state.contributions,record]});state=next;renderRecords();save();status('form-status','Öneri taslak olarak eklendi. Kod çalıştırılmadı, yayın değişmedi.');$('contribution-form').reset();}catch(err){status('form-status',err.message);}};
 function download(raw,name,type){const url=URL.createObjectURL(new Blob([raw],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 $('export-workspace').onclick=()=>{try{download(JSON.stringify(workspace()),'nexus-calisma-paketi.json','application/json');status('package-status','Çalışma paketi indirildi. Diğer sitedeki “Paketi aç” ile devam edebilirsin.');}catch(e){status('package-status',e.message);}};
 $('workspace-file').onchange=async()=>{const file=$('workspace-file').files[0];if(!file)return;try{if(file.size>LIMIT)throw Error('Paket üst sınırı 1 MiB.');const imported=parseImport(await file.text());const combined=[...state.contributions];for(const r of imported.contributions)if(!combined.some(x=>JSON.stringify(x)===JSON.stringify(r)))combined.push(r);const next=validateWorkspace({...imported,contributions:combined});state=next;setGate(state.gate);selectRole(roleIndex());mode(state.mode);renderRecords();save();status('package-status','Paket doğrulandı ve mevcut katkılar korunarak birleştirildi. Henüz paylaşılmadı.');}catch(e){status('package-status','Dosya eklenmedi: '+e.message);}finally{$('workspace-file').value='';}};
 function resetMedia(){if(mediaUrl){$('media').pause();$('media').removeAttribute('src');$('media').load();URL.revokeObjectURL(mediaUrl);mediaUrl=null;}$('media').hidden=true;$('remove-media').hidden=true;$('media-file').value='';}
 $('media-file').onchange=()=>{const file=$('media-file').files[0];if(!file)return;try{if(file.size>100*1024*1024)throw Error('Video üst sınırı 100 MiB.');if(!['video/mp4','video/webm'].includes(file.type))throw Error('MP4 veya WebM video seç.');resetMedia();mediaUrl=URL.createObjectURL(file);$('media').src=mediaUrl;$('media').hidden=false;$('remove-media').hidden=false;mode('stage');status('media-status',file.name+' · Yerel dosya; yüklenmedi.');}catch(e){resetMedia();status('media-status',e.message);}};
 $('media').onerror=()=>status('media-status','Video çözümlenemedi. Tarayıcının desteklediği bir MP4/WebM seç.');$('remove-media').onclick=()=>{resetMedia();status('media-status','Video kaldırıldı. Dosya sunucuya yüklenmedi.');};
 $('rehearse').onclick=()=>{if(provaRunning)return;provaRunning=true;$('rehearse').disabled=true;const started=performance.now();status('run-status','Görsel prova çalışıyor. Model çağrısı yapılmıyor.');function frame(now){if(disposed)return;const progress=Math.min(100,(now-started)/30);$('progress').value=progress;for(let i=0;i<3;i++)$('phase'+i).classList.toggle('active',progress>i*33);if(progress<100)provaFrame=requestAnimationFrame(frame);else{provaRunning=false;$('rehearse').disabled=false;status('run-status','Arayüz provası tamamlandı. Gerçek GPT işi yürütülmedi.');}}provaFrame=requestAnimationFrame(frame);};
 $('copy-prompt').onclick=async()=>{try{await navigator.clipboard.writeText($('prompt').textContent+'\nManifest: '+new URL('/gpt.json',location.origin).href);status('copy-status','Çağrı kopyalandı.');}catch{status('copy-status','Pano erişimi yok; yukarıdaki çağrıyı seçip kopyalayabilirsin.');}};
 for(const label of document.querySelectorAll('label[for="media-file"],label[for="workspace-file"]')){label.tabIndex=0;label.setAttribute('role','button');label.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$(label.htmlFor).click();}};}
 if(location.hostname.includes('afair.live')){$('other-domain').href='https://www.selinahbap.com/nexus';$('other-domain').textContent='Üretim alanına geç ↗';}
 try{const stored=localStorage.getItem(key);if(stored){state=parseImport(stored);$('persist').checked=true;status('package-status','Bu tarayıcıdaki çalışma geri açıldı.');}}catch{status('package-status','Önceki cihaz kaydı açılamadı; yeni çalışma kullanılıyor.');}
 setGate(state.gate);selectRole(roleIndex());mode(state.mode);renderRecords();
 window.addEventListener('pagehide',()=>{disposed=true;cancelAnimationFrame(provaFrame);scene?.destroy();resetMedia();});
 window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
}
if(typeof document!=='undefined'&&document.getElementById('scene'))init();
