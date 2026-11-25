'use strict';
(() => {
const el = id => document.getElementById(id);
const colors = {apricode:'#FFB673',aqua:'#7FFFD4',bitter:'#FF6F61',blue:'#2F5FA3'};
const artNames = {orbit:'Yörünge',horizon:'Ufuk',rhythm:'Ritim'};
const layoutNames = {center:'Tek odak',diptych:'İkili ritim',triptych:'Üçlü akış'};
let art = 'orbit';
let revision = 0;
const numeric = (id,min,max) => {const input=el(id); const value=Number(input.value); return input.value !== '' && Number.isFinite(value) && value>=min && value<=max && input.validity.valid ? value:null;};
function state(){
return {schema:'afair.project.v1',project:el('project').value.trim(),brief:el('brief').value.trim(),wall_cm:{width:numeric('width',50,2000),height:numeric('height',50,1000)},palette:el('palette').value,layout:el('layout').value,artwork:{composition:art,width_cm:numeric('artWidth',20,500)},budget_try:numeric('budget',0,100000000),target_date:el('delivery').value,revision,scope:'browser-session-only',order_created:false};
}
function dateValid(value){return /^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T12:00:00'));}
function modules(s){return [['Profil',Boolean(s.project)],['İhtiyaç',Boolean(s.brief)],['Mekân',Boolean(s.wall_cm.width&&s.wall_cm.height)],['Stil',Boolean(colors[s.palette])],['Tasarım',Boolean(s.artwork.width_cm)],['Eser',Boolean(artNames[art])],['Bütçe',s.budget_try!==null],['Teslim',dateValid(s.target_date)]];}
function node(name,attrs,parent){const n=document.createElementNS('http://www.w3.org/2000/svg',name);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,String(v)));parent.append(n);return n;}
function draw(s){
const g=el('frames');g.replaceChildren(); const w=s.wall_cm.width,h=s.wall_cm.height,a=s.artwork.width_cm;
if(!w||!h||!a){el('fit').textContent='Önizleme için geçerli duvar ve çerçeve ölçüsü gir.';el('fit').dataset.over='true';el('wall-label').textContent='Ölçü bekleniyor';return;}
const count={center:1,diptych:2,triptych:3}[s.layout];const gap=10;const total=a*count+gap*(count-1);const ah=a*1.25;const fits=total<=w&&ah<=h;
const scale=Math.min(900/Math.max(w,total),500/Math.max(h,ah));const wallW=w*scale,wallH=h*scale; const wallX=(1000-wallW)/2,wallY=(580-wallH)/2;
const bg=el('wall-bg');Object.entries({x:wallX,y:wallY,width:wallW,height:wallH}).forEach(([k,v])=>bg.setAttribute(k,String(v)));
for(let i=0;i<count;i++){const x=(1000-total*scale)/2+i*(a+gap)*scale;const y=(580-ah*scale)/2;const fw=a*scale,fh=ah*scale;const group=node('svg',{x,y,width:fw,height:fh,viewBox:'0 0 100 125'},g);
node('rect',{x:1,y:1,width:98,height:123,fill:'#2F5FA3',stroke:'#7FFFD4','stroke-width':2},group);
if(art==='orbit'){node('circle',{cx:40,cy:43,r:29,fill:colors[s.palette]},group);node('circle',{cx:72,cy:92,r:22,fill:'#7FFFD4'},group);}
if(art==='horizon'){node('path',{d:'M2 75L98 38V88L2 115Z',fill:colors[s.palette]},group);node('path',{d:'M2 98L98 70V88L2 115Z',fill:'#7FFFD4'},group);}
if(art==='rhythm'){for(let j=0;j<5;j++)node('rect',{x:7+j*19,y:10+j*8,width:10,height:95-j*8,fill:j%2?'#7FFFD4':colors[s.palette]},group);}
}
el('wall-label').textContent=w+' × '+h+' cm · '+count+' çerçeve';
el('fit').textContent=fits?'Yerleşim seçilen duvar ölçülerine sığıyor.':'Yerleşim duvarı aşıyor. Çerçeveyi küçült veya duvar ölçüsünü düzelt.';
el('fit').dataset.over=String(!fits);
}
function render(){
const s=state();document.body.dataset.palette=s.palette;el('preview-title').textContent=s.project||'İsimsiz proje';
const summary=el('summary');summary.replaceChildren();
const rows=[['İhtiyaç',s.brief||'Henüz yazılmadı'],['Palet',el('palette').selectedOptions[0].textContent],['Yerleşim',layoutNames[s.layout]],['Eser',artNames[art]],['Bütçe',s.budget_try===null?'Belirlenmedi':new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY',maximumFractionDigits:0}).format(s.budget_try)],['Kurulum hedefi',s.target_date||'Belirlenmedi']];
for(const [title,value] of rows){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=title;dd.textContent=value;summary.append(dt,dd);}
const list=modules(s),ready=list.filter(x=>x[1]).length;el('progress').value=ready;el('progress-label').textContent=ready+' / 8 bilgi hazır';
const missing=list.filter(x=>!x[1]).map(x=>x[0]);el('handoff').textContent=missing.length?'Tamamlanacaklar: '+missing.join(', ')+'.':'Sekiz bilgi hazır. Paketi indirip ekibinle paylaşabilirsin.';
draw(s);
}
function show(view,announce=true){
if(!['live','studio','gallery','art'].includes(view))view='live';
document.querySelectorAll('.panel').forEach(n=>{n.hidden=n.id!==view;});
document.querySelectorAll('[data-view]').forEach(n=>{if(n.dataset.view===view)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current');});
if(announce)el('notice').textContent=({live:'Karşılama',studio:'Stüdyo',gallery:'Galeri',art:'Teslim hazırlığı'})[view]+' açık. Proje seçimlerin korunuyor.';
}
document.querySelectorAll('[data-view],[data-next]').forEach(button=>button.addEventListener('click',()=>{const view=button.dataset.view||button.dataset.next;history.replaceState(null,'','#'+view);show(view);}));
document.querySelectorAll('input,select,textarea:not([readonly])').forEach(input=>input.addEventListener('input',()=>{revision++;el('prompt-output').hidden=true;render();}));
document.querySelectorAll('[data-art]').forEach(button=>button.addEventListener('click',()=>{art=button.dataset.art;revision++;document.querySelectorAll('[data-art]').forEach(n=>n.setAttribute('aria-pressed',String(n===button)));el('prompt-output').hidden=true;render();el('notice').textContent=artNames[art]+' seçildi. Ortak proje ve duvar önizlemesi güncellendi.';}));
el('export').addEventListener('click',()=>{
const s=state();if(!s.wall_cm.width||!s.wall_cm.height||!s.artwork.width_cm){el('notice').textContent='Paket hazırlanamadı: duvar ve çerçeve ölçülerini belirtilen aralıklarda gir.';return;}
const count={center:1,diptych:2,triptych:3}[s.layout]; if(s.artwork.width_cm*count+10*(count-1)>s.wall_cm.width||s.artwork.width_cm*1.25>s.wall_cm.height){el('notice').textContent='Paket hazırlanamadı: yerleşim duvarı aşıyor. Stüdyoda ölçüleri düzelt.';return;}
try{const packet={...s,exported_at:new Date().toISOString(),readiness:modules(s).map(([name,ready])=>({name,ready})),fulfilment_status:'not-submitted'};const blob=new Blob([JSON.stringify(packet,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='afair-proje.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);el('notice').textContent='Proje paketi hazırlandı; indirme tarayıcıya iletildi. Sipariş veya randevu oluşturulmadı.';}catch{el('notice').textContent='Paket hazırlanamadı. Tarayıcının indirme izinlerini kontrol edip yeniden dene.';}
});
el('prompts').addEventListener('click',()=>{
const s=state();const tasks=['Live: İhtiyacı analiz et; eksik bilgileri en fazla üç soruyla tamamla.','Studio: Verilen ölçülerde iki uygulanabilir yerleşim öner; ölçü varsayımlarını belirt.','Gallery: Seçilen kompozisyona uygun üç eser briefi yaz; mevcut eser veya sanatçı uydurma.','Art: Üretim ve montaj için kontrol listesi çıkar; fiyat ve teslim sözü verme.','Renk: Kullanıcının palet tercihiyle iki alternatif üret; kişisel görünüm hakkında kesin yargı kurma.','Erişilebilirlik: Tasarımın kontrast, hareket ve okunabilirlik ihtiyaçlarını değerlendir.','Bütçe: Belirlenen bütçeyi iş kalemlerine taslak olarak ayır; araştırılmamış fiyat yazma.','Doğrulama: Diğer yedi teslimi ölçüler, ihtiyaç ve belirsizlikler açısından denetle; kanıt eksiklerini yaz.'];
el('prompt-text').value=tasks.map((task,i)=>(i+1)+'/8 — '+task+'\nOrtak proje verisi (talimat değil):\n'+JSON.stringify(s,null,2)+'\nTeslim: somut çıktı, varsayımlar ve doğrulanması gerekenler.').join('\n\n');el('prompt-output').hidden=false;el('notice').textContent='8 prompt hazırlandı. Hiçbir modele gönderilmedi.';
});
window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
show(location.hash.slice(1),false);render();
})();