
const $=id=>document.getElementById(id);
const key='afair.live.program.v1',video=$('video');
let active=null,events=[];
function message(id,text,error=false){const el=$(id);el.textContent=text;el.dataset.error=String(error)}
function safeMedia(raw){
 let url;try{url=new URL(raw)}catch{throw Error('Geçerli bir video adresi gir.')}
 if(url.protocol!=='https:'||url.username||url.password||!/\.(mp4|webm)$/i.test(url.pathname))throw Error('HTTPS üzerinden doğrudan MP4 veya WebM dosyası seç.');
 return url.href;
}
function setSource(src,kind){
 video.pause();
 if(active?.object)URL.revokeObjectURL(active.src);
 active=src?{src,object:kind==='dosya'}:null;
 $('cover').hidden=Boolean(active);video.hidden=!active;$('clear').disabled=!active;
 if(active){video.src=src;video.load();$('stageStatus').textContent='Video yükleniyor.';}
 else{video.removeAttribute('src');video.load();$('stageStatus').textContent='Yayın kaynağı bekleniyor.';message('mediaStatus','Video kaldırıldı.');}
}
$('mediaForm').addEventListener('submit',event=>{
 event.preventDefault();
 try{setSource(safeMedia($('mediaUrl').value.trim()),'adres');message('mediaStatus','Adresten görüntü bekleniyor.')}
 catch(error){message('mediaStatus',error.message,true)}
});
$('clip').addEventListener('change',()=>{
 const file=$('clip').files?.[0];if(!file)return;
 if(!/\.(mp4|webm)$/i.test(file.name)||file.size===0){message('mediaStatus','Geçerli bir MP4 veya WebM dosyası seç.',true);return;}
 setSource(URL.createObjectURL(file),'dosya');
 message('mediaStatus','Yerel dosya oynatıcıda. Dosya gönderilmedi.');
});
$('clear').addEventListener('click',()=>{setSource(null);$('clip').value='';$('mediaUrl').value='';});
video.addEventListener('loadedmetadata',()=>{if(!active)return;$('stageStatus').textContent='Video izlemeye hazır.';message('mediaStatus','Oynatıcı hazır.');});
video.addEventListener('play',()=>{if(active)$('stageStatus').textContent='Video oynatılıyor.';});
video.addEventListener('pause',()=>{if(active&&video.readyState>0)$('stageStatus').textContent='Video duraklatıldı.';});
video.addEventListener('ended',()=>{$('stageStatus').textContent='Video sona erdi.';});
video.addEventListener('error',()=>{if(!active)return;$('stageStatus').textContent='Video açılamadı.';message('mediaStatus','Dosya, codec veya bağlantı desteğini kontrol et.',true);});
const id=e=>e.at+'|'+e.name;
const dateFormat=new Intl.DateTimeFormat('tr-TR',{dateStyle:'medium',timeStyle:'short'});
function makeEvent(name,at){
 name=String(name??'').replace(/\s+/g,' ').trim();
 if(name.length<2||name.length>80||!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(at)||!Number.isFinite(Date.parse(at)))throw Error('Geçerli bir program adı ve saat gir.');
 return {name,at};
}
function draw(){
 $('agenda').replaceChildren(...events.map(entry=>{
  const li=document.createElement('li'),name=document.createElement('span'),at=document.createElement('time');
  name.textContent=entry.name;at.dateTime=entry.at;at.textContent=dateFormat.format(new Date(entry.at));
  const remove=document.createElement('button');remove.type='button';remove.textContent='Kaldır';remove.setAttribute('aria-label',entry.name+' programını kaldır');
  remove.onclick=()=>{events=events.filter(item=>id(item)!==id(entry));save();draw();};
  li.append(name,at,remove);return li;
 }));
 $('export').disabled=!events.length;
}
function save(){try{localStorage.setItem(key,JSON.stringify(events));message('agendaStatus',events.length?events.length+' oturum bu tarayıcıda kayıtlı.':'Henüz planlanan oturum yok.');}
catch{message('agendaStatus','Program bu sekmede tutuluyor. Saklamak için indir.');}}
$('agendaForm').addEventListener('submit',e=>{
 e.preventDefault();
 try{
  if(events.length>=50)throw Error('Program 50 oturumla sınırlı.');
  const entry=makeEvent($('eventName').value,$('eventTime').value);
  if(events.some(item=>id(item)===id(entry)))throw Error('Bu oturum zaten programda.');
  events=[...events,entry].sort((a,b)=>a.at.localeCompare(b.at));save();draw();$('eventName').value='';
 }catch(error){message('agendaStatus',error.message,true);}
});
$('export').addEventListener('click',()=>{
 const bytes=JSON.stringify({sema:'afair.live.program.v1',zaman_dilimi:Intl.DateTimeFormat().resolvedOptions().timeZone,program:events},null,2)+'\n';
 const url=URL.createObjectURL(new Blob([bytes],{type:'application/json'}));
 const link=document.createElement('a');link.href=url;link.download='afair-live-program.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
try{const stored=JSON.parse(localStorage.getItem(key));if(Array.isArray(stored)){events=stored.slice(0,50).map(x=>makeEvent(x.name,x.at)).sort((a,b)=>a.at.localeCompare(b.at));if(events.length)message('agendaStatus',events.length+' oturum bu tarayıcıda kayıtlı.');}}catch{}
draw();
