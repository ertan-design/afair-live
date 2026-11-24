
"use strict";
const $=id=>document.getElementById(id);
const STATIONS={CODEX:"Kod ve tarayıcı işleyişi",CLAUDE:"Bağımsız inceleme",GEMINI:"Sayfa akışı ve tasarım",SCIENCE:"Ölçüm ve karşılaştırma"};
const ROUTES=new Set(["/","/selin-kapilar.html","/olcum-kutusu.html","/ekip.html","/ekip-kapisi.html"]);
const REF=72768276, MAX_HTML=2*1024*1024, MAX_PACKET=32*1024;
const HEX=/^[a-f0-9]{64}$/, UUID=/^[a-f0-9-]{36}$/;
const SITE="https://www.selinahbap.com";
const doorValue=new URLSearchParams(location.search).get("kapi");
const doorNumber=typeof doorValue==="string"&&/^K\d{5}$/.test(doorValue)?Number(doorValue.slice(1)):0;
const fromDoor=doorNumber>=1&&doorNumber<=50000?doorValue:null;
const TASK_IDS=["yayin","yapi","rota","erisim","etkilesim","mobil","ryte","gaia"];
const utf8=new TextEncoder(), decoder=new TextDecoder("utf-8",{fatal:true}), format=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:3});
let current=null;
if(fromDoor)$("intro").textContent=fromDoor+" kapısından gelindi. Kaynak sayfayı ölçmek için alıcıyı seç.";
function element(tag,text){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;return el}
for(const i of ["sender","recipient"]){for(const key of Object.keys(STATIONS)){const option=element("option",key);option.value=key;$(i).append(option)}}
$("recipient").value="CLAUDE";
function status(text,bad=false){$("status").textContent=text;$("status").classList.toggle("warn",bad)}
function gates(one,two,three){$("gate1").textContent=one;$("gate2").textContent=two;$("gate3").textContent=three}
function clear(){
 $("return-use").disabled=true;
 current=null;$("jobs").replaceChildren();$("seal").textContent="";$("verified").textContent="";$("incoming").value="";
 $("intro").textContent="İşler hazırlandığında alıcı, ölçüm ve sonraki adım burada görünür.";
 for(const name of ["copy","json","jsonl"])$(name).disabled=true
}
function canonical(item){
 if(Array.isArray(item))return "["+item.map(canonical).join(",")+"]";
 if(item!==null&&typeof item==="object")return "{"+Object.keys(item).sort().map(key=>JSON.stringify(key)+":"+canonical(item[key])).join(",")+"}";
 return JSON.stringify(item);
}
async function hash(bytes){return [...new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))].map(x=>x.toString(16).padStart(2,"0")).join("")}
async function dig(item){return hash(utf8.encode(canonical(item)))}
function assure(valid,message){if(!valid)throw Error(message)}
function scope(){
 const sender=$("sender").value, recipient=$("recipient").value, path=$("route").value;
 assure(Object.hasOwn(STATIONS,sender)&&Object.hasOwn(STATIONS,recipient),"Geçerli istasyon seç.");
 assure(sender!==recipient,"Üreten ve alıcı farklı istasyon olmalı.");
 assure(ROUTES.has(path),"Bu sayfa ekip kapsamına dahil değil.");
 return {sender,recipient,path,local:$("local").files[0],prior:$("prior").files[0]};
}
async function verify(file){
 assure(file.size<=MAX_PACKET,"GAIA paketi 32 KiB sınırını aşıyor.");
 const packet=JSON.parse(await file.text());
 assure(packet&&typeof packet==="object","Geçerli bir GAIA paketi seç.");
 const {seal,...data}=packet;
 assure(data.schema==="gaia.web-handoff.v1"&&data.destination==="GAIA"&&data.acceptance==="pending"&&Object.hasOwn(STATIONS,data.sender)&&Object.hasOwn(STATIONS,data.recipient)&&data.sender!==data.recipient,
  "Paket istasyonları veya şeması geçersiz.");
 assure(ROUTES.has(data.source?.path)&&data.source?.site===SITE&&HEX.test(data.source?.sha256)&&Number.isSafeInteger(data.source?.bytes)&&data.source.bytes>0&&data.source.bytes<=MAX_HTML&&UUID.test(data.request_id),"Kaynak veya istek kimliği geçersiz.");
 assure(Array.isArray(data.tasks)&&data.tasks.length===TASK_IDS.length&&data.tasks.every((task,index)=>task?.id===TASK_IDS[index]&&task.recipient===data.recipient),
  "Sekiz işin kimliği veya alıcısı uyuşmuyor.");
 assure(HEX.test(seal)&&seal===await dig(data),"Paket SHA-256 mührü eşleşmedi.");
 return packet;
}
async function capture(spec){
 const started=performance.now();let raw,http=null,mime="text/html";
 if(spec.local){
   assure(spec.local.size<=MAX_HTML,"Yerel HTML 2 MiB sınırını aşıyor.");
   raw=new Uint8Array(await spec.local.arrayBuffer());
 }else{
   assure(location.protocol==="http:"||location.protocol==="https:","Canlı sayfayı aç ya da yerel HTML seç.");
   const response=await fetch(spec.path,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(9000)});
   http=response.status;mime=(response.headers.get("content-type")||"").split(";")[0].toLowerCase();
   assure(response.ok&&mime==="text/html","Web kaynağı HTML olarak açılamadı. Durum "+http+".");
   const declared=Number(response.headers.get("content-length"));
   assure(!Number.isFinite(declared)||declared<=MAX_HTML,"Web kaynağı 2 MiB sınırını aşıyor.");
   const reader=response.body.getReader(), chunks=[];let total=0;
   for(;;){
     const {done,value}=await reader.read();
     if(done)break;
     total+=value.length;
     if(total>MAX_HTML){await reader.cancel();throw Error("Web kaynağı 2 MiB sınırını aşıyor.")}
     chunks.push(value);
   }
   raw=new Uint8Array(total);let offset=0;for(const chunk of chunks){raw.set(chunk,offset);offset+=chunk.length}
 }
 assure(raw.length>0,"HTML boş.");
 const text=decoder.decode(raw);
 assure(/<(?:!doctype|html|head|body|main|section|article|h[1-6]|div|p|span|form|header|nav|footer)\b/i.test(text),"Bu kaynakta HTML işaretleri bulunamadı.");
 const evidence={site:SITE,path:spec.path,door_id:fromDoor,mode:spec.local?"local_draft":"site_fetch",http,mime,bytes:raw.length,sha256:await hash(raw),
  candidate_delta:null,observed_ms:Math.round((performance.now()-started)*1000)/1000};
 if(spec.prior){
   const previous=await verify(spec.prior);
   assure(previous.source.path===spec.path&&previous.source.mode===evidence.mode,"Önceki paket aynı sayfa ve aynı kaynak türüne ait olmalı.");
   evidence.candidate_delta={previous_sha256:previous.source.sha256,state:previous.source.sha256===evidence.sha256?"same":"changed",
     bytes_delta:evidence.bytes-previous.source.bytes};
 }
 return {evidence,text};
}
function inspect(spec,page){
 const {evidence,text}=page;
 const doc=new DOMParser().parseFromString(text,"text/html");
 const all=selector=>[...doc.querySelectorAll(selector)], count=selector=>doc.querySelectorAll(selector).length;
 const anchors=all("a"), ids=all("[id]").map(node=>node.id).filter(Boolean), unique=new Set(ids);
 const link={same_origin:0,external:0,anchor:0,other:0,invalid:0};
 const base=location.protocol==="file:"?"https://www.selinahbap.com/":location.origin;
 for(const a of anchors){
   const href=(a.getAttribute("href")||"").trim();
   if(!href){link.invalid++;continue}
   if(href.startsWith("#")){link.anchor++;continue}
   try{const url=new URL(href,new URL(spec.path,base));if(!["https:","http:"].includes(url.protocol))link.other++;
       else if(url.origin===new URL(base).origin)link.same_origin++;else link.external++}
   catch{link.invalid++}
 }
 const named=e=>["aria-label","aria-labelledby","title"].some(a=>Boolean(e.getAttribute(a)?.trim()))||Boolean(e.textContent.trim());
 const task=(id,title,evidence,action)=>({id,title,recipient:spec.recipient,evidence,action,state:"prepared"});
 return [
  task("yayin","Yayın yanıtı",{http:evidence.http,mime:evidence.mime,sha256:evidence.sha256},"Kesin yayın kararı için hedef rota ve gövde özetini bağımsız olarak eşleştir."),
  task("yapi","Başlık ve bölüm yapısı",{h1:count("h1"),main:count("main,[role=main]"),title:!!doc.title.trim(),lang:!!doc.documentElement.lang},
   "Başlık sırasını ve ana içerik bölümünü tarayıcıda incele."),
  task("rota","Bağlantı envanteri",link,"Temel kullanıcı yolundaki bağlantıları aç ve yönlendirme sonuçlarını kaydet."),
  task("erisim","Erişilebilirlik işaretleri",{missing_alt:count("img:not([alt])"),unnamed_buttons:all("button").filter(e=>!named(e)).length,
   unlinked_label:all("label[for]").filter(e=>!doc.getElementById(e.htmlFor)).length},"Klavye ve erişilebilir adları arayüzde kontrol et."),
  task("etkilesim","Etkileşim envanteri",{buttons:count("button"),forms:count("form"),duplicate_ids:ids.length-unique.size},
   "Birincil eylemi çalıştır ve geçerli sonuçla hata davranışını ayrı kaydet."),
  task("mobil","Mobil zemin",{viewport:!!doc.querySelector('meta[name="viewport"][content*="width=device-width"]'),
   media_queries:(text.match(/@media\s/g)||[]).length},"390 ve 5120 pikselde taşma ve düğme erişimini canlı ekranda dene."),
  task("ryte","Boyut ve değişiklik",{bytes:evidence.bytes,kib:Math.round(evidence.bytes/1024*1000)/1000,
   ryte:evidence.bytes/REF,delta:evidence.candidate_delta?.state||"unavailable"},
   "Yeni baytı önceki aynı kaynakla karşılaştır. Eşleşen SHA’da gövdeyi tekrar paketleme."),
  task("gaia","Teslim ve kabul",{input_sha256:evidence.sha256,review:"pending",binding:"request_id+recipient+source_sha256"},
   "Sonucu aynı istek kimliği, girdi SHA ve ayrı hakem kaydıyla GAIA’ya bağla.")
 ];
}
function summary(row){return Object.entries(row.evidence).map(([key,value])=>key+" "+(value===null?"ölçülmedi":typeof value==="boolean"?(value?"var":"yok"):typeof value==="number"?format.format(value):value)).join(" · ")}
function render(packet){
 $("return-use").disabled=false;
 $("intro").textContent=packet.sender+" → "+packet.recipient+" · "+STATIONS[packet.recipient];
 $("seal").textContent="İstek "+packet.request_id+" · SHA-256 "+packet.seal;
 for(const row of packet.tasks){
   const card=element("article");card.append(element("h3",row.title),element("p",summary(row)),element("p",row.action));$("jobs").append(card)
 }
 for(const name of ["copy","json","jsonl"])$(name).disabled=false;
}
$("send").onsubmit=async event=>{
 event.preventDefault();clear();gates("Kontrol ediliyor.","Dosya özeti bekleniyor.","Paket bekleniyor.");
 const fields=[...$("send").elements];for(const field of fields)field.disabled=true;
 try{
   const spec=scope();gates(spec.sender+" → "+spec.recipient+" · "+spec.path,"Ölçülüyor.","Paket bekleniyor.");
   status("Sekiz iş için kaynak ölçülüyor…");
   const page=await capture(spec), e=page.evidence;
   gates(spec.sender+" → "+spec.recipient,format.format(e.bytes)+" bayt · SHA-256 alındı","Paket mühürleniyor.");
   const body={schema:"gaia.web-handoff.v1",request_id:crypto.randomUUID(),issued_at:new Date().toISOString(),
     sender:spec.sender,recipient:spec.recipient,destination:"GAIA",source:e,acceptance:"pending",tasks:inspect(spec,page)};
   current={...body,seal:await dig(body)};
   gates(spec.sender+" → "+spec.recipient,format.format(e.bytes)+" bayt · SHA-256 alındı","8 iş · alıcıya hazır");
   render(current);status("Paket hazır. Seçili alıcıya aktarabilirsin.");
 }catch(error){clear();gates("Teslim tamamlanmadı.","Ölçüm kapalı.","Paket üretilmedi.");status(error.message||"Ölçüm alınamadı.",true)}
 finally{for(const field of fields)field.disabled=false}
};
function filename(ext){return "gaia-"+current.recipient.toLowerCase()+"-"+current.request_id+"."+ext}
function download(body,type,ext){
 const url=URL.createObjectURL(new Blob([body],{type})), a=element("a");
 a.href=url;a.download=filename(ext);a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
$("json").onclick=()=>download(JSON.stringify(current,null,2)+"\n","application/json","json");
$("jsonl").onclick=()=>{
 const {tasks,...envelope}=current;
 const header={kind:"manifest",task_count:tasks.length,...envelope}, rows=tasks.map(task=>({kind:"task",request_id:current.request_id,...task}));
 download([header,...rows].map(row=>JSON.stringify(row)).join("\n")+"\n","application/x-ndjson","jsonl");
};
$("copy").onclick=async()=>{
 const p=current;
 const text=[p.recipient+" için GAIA web teslimi","Kaynak "+p.source.site+p.source.path+(p.source.door_id?" · "+p.source.door_id:""),"İstek "+p.request_id,
   "Girdi SHA-256 "+p.source.sha256,"Paket SHA-256 "+p.seal,"Kabul bekliyor","",
   ...p.tasks.map((task,i)=>String(i+1)+". "+task.title+"\n"+summary(task)+"\n"+task.action)].join("\n");
 try{await navigator.clipboard.writeText(text);status("Alıcı metni kopyalandı.")}
 catch{const field=element("textarea");field.value=text;field.setAttribute("aria-label","Alıcıya aktarılacak metin");
    $("copy").parentElement.after(field);field.focus();field.select();status("Metin seçildi. Ctrl+C ile kopyala.")}
};
for(const name of ["sender","recipient","route","local","prior"]){$(name).onchange=()=>{clear();status("");gates("Alıcı ve kaynak seçilebilir.","Dosya özeti bekleniyor.","Paket bekleniyor.")}}
$("incoming").onchange=async()=>{
 const file=$("incoming").files[0], target=$("recipient").value; if(!file)return;
 try{const packet=await verify(file);assure(target===packet.recipient,"Paket seçili alıcıya ait değil.");
     assure(target===$("recipient").value,"Alıcı değişti. Paketi tekrar seç.");
     $("verified").textContent="Mühür eşleşti · "+packet.recipient+" · "+packet.request_id+" · 8 iş"}
 catch(error){$("verified").textContent=error.message||"Paket okunamadı."}
};

const RETURN_SCHEMA="gaia.web-return.v1", ARTIFACT_LIMIT=8*1024*1024;
const NEXT=[["ack"],["started"],["result","failed"],["accepted","rejected"]];
const EVENT_NAMES={ack:"Alındı",started:"Başladı",result:"Sonuç mühürlendi",failed:"Hata kaydedildi",accepted:"Kabul edildi",rejected:"Reddedildi"};
const REASONS=new Set(["evidence_missing","test_failed","scope_mismatch"]);
const returnOptions={
 "return-ack":"ack","return-start":"started","return-result":"result",
 "return-fail":"failed","return-accept":"accepted","return-reject":"rejected"
};
let handoff=null, chain=[], returnBusy=false;
function returnStatus(message,bad=false){
 $("return-status").textContent=message;
 $("return-status").classList.toggle("warn",bad);
}
function exactKeys(value,keys){
 return value!==null&&typeof value==="object"&&!Array.isArray(value)
  &&Object.keys(value).sort().join(",")===keys.slice().sort().join(",");
}
function nextEvents(events){
 if(events.some(event=>["failed","accepted","rejected"].includes(event.kind)))return [];
 return NEXT[events.length]||[];
}
function optionsFor(select,entries){
 select.replaceChildren(...entries.map(([value,label])=>{
   const opt=element("option",label);opt.value=value;return opt;
 }));
}
function returnRender(){
 const next=nextEvents(chain);
 $("return-task").disabled=!handoff||chain.length>0;
 $("return-import").disabled=!handoff;
 $("return-reviewer").disabled=!handoff||!next.includes("accepted");
 $("return-artifact").disabled=!handoff||!next.some(kind=>kind==="result"||kind==="accepted");
 $("return-reason").disabled=!handoff||!next.some(kind=>kind==="failed"||kind==="rejected");
 $("return-save").disabled=chain.length===0;
 $("return-use").disabled=!current;
 for(const [id,kind] of Object.entries(returnOptions))$(id).disabled=!handoff||!next.includes(kind);
 $("return-events").replaceChildren(...chain.map(event=>
   element("li",EVENT_NAMES[event.kind]+" · "+event.actor+" · "+event.at+
    (event.artifact?" · "+format.format(event.artifact.bytes)+" bayt · "+event.artifact.sha256:"")+
    (event.reason?" · "+event.reason:""))
 ));
}
function returnScope(){
 return {schema:RETURN_SCHEMA,request_id:handoff.request_id,handoff_seal:handoff.seal,
   source_sha256:handoff.source.sha256,sender:handoff.sender,worker:handoff.recipient,task_id:$("return-task").value};
}
function bindReturn(packet){
 handoff=packet;chain=[];
 $("return-artifact").value="";$("return-import").value="";
 optionsFor($("return-task"),packet.tasks.map((task,index)=>[task.id,TASK_TITLES[index]]));
 const reviewers=Object.keys(STATIONS).filter(actor=>actor!==packet.sender&&actor!==packet.recipient);
 optionsFor($("return-reviewer"),reviewers.map(actor=>[actor,actor]));
 $("return-meta").textContent=packet.recipient+" · İstek "+packet.request_id+" · Kaynak SHA-256 "+packet.source.sha256;
 returnRender();
}
function withReturn(run){
 if(returnBusy)return;
 returnBusy=true;$("return-lock").disabled=true;
 void (async()=>{
   try{await run()}
   catch(error){returnStatus(error.message||"Dönüş işlenemedi.",true)}
   finally{returnBusy=false;$("return-lock").disabled=false;returnRender()}
 })();
}
async function resultProof(file){
 assure(file&&file.size>0&&file.size<=ARTIFACT_LIMIT,"1 bayt ile 8 MiB arasında bir sonuç dosyası seç.");
 return {bytes:file.size,sha256:await hash(await file.arrayBuffer())};
}
function validArtifact(value){
 return exactKeys(value,["bytes","sha256"])&&Number.isSafeInteger(value.bytes)&&value.bytes>0
   &&value.bytes<=ARTIFACT_LIMIT&&typeof value.sha256==="string"&&HEX.test(value.sha256);
}
function matchArtifact(left,right){return left.bytes===right.bytes&&left.sha256===right.sha256}
function isReviewer(actor,scope){
 return Object.hasOwn(STATIONS,actor)&&actor!==scope.sender&&actor!==scope.worker;
}
async function eventSeal(scope,event){return dig({scope,event})}
async function addEvent(kind){
 assure(handoff&&nextEvents(chain).includes(kind),"Bu adım bu sırada işlenemez.");
 const scope=returnScope(), review=kind==="accepted"||kind==="rejected";
 const actor=review?$("return-reviewer").value:scope.worker;
 assure(!review||isReviewer(actor,scope),"Hakem üreten ve alıcıdan farklı bir istasyon olmalı.");
 let artifact=null, reason=null;
 if(kind==="result"||kind==="accepted"){
   artifact=await resultProof($("return-artifact").files[0]);
   if(kind==="accepted")assure(matchArtifact(artifact,chain.at(-1).artifact),"Kabul için seçilen dosya mühürlü sonuçla eşleşmiyor.");
 }
 if(kind==="failed"||kind==="rejected"){
   reason=$("return-reason").value;assure(REASONS.has(reason),"Geçerli bir neden seç.");
 }
 const at=new Date().toISOString();
 assure(!chain.length||at>=chain.at(-1).at,"Cihaz saati önceki olayın gerisinde.");
 const event={seq:chain.length+1,kind,actor,at,previous_sha256:chain.at(-1)?.sha256||scope.handoff_seal,artifact,reason};
 chain=[...chain,{...event,sha256:await eventSeal(scope,event)}];
 $("return-artifact").value="";
 returnStatus(EVENT_NAMES[kind]+". Dönüş kaydı indirilebilir.");
}
async function importReturn(file){
 assure(file&&file.size<=MAX_PACKET,"Dönüş kaydı 32 KiB sınırını aşıyor.");
 const body=JSON.parse(await file.text());
 assure(exactKeys(body,["schema","request_id","handoff_seal","source_sha256","sender","worker","task_id","events","head_sha256"]),
   "Dönüş kaydı şeması geçersiz.");
 const {events,head_sha256,...given}=body;
 const scope={...returnScope(),task_id:given.task_id};
 assure(TASK_IDS.includes(given.task_id)&&canonical(given)===canonical(scope),"Kayıt seçili pakete veya göreve ait değil.");
 assure(!chain.length||given.task_id===$("return-task").value,"Bu ekranda başka bir işin dönüşü açık.");
 assure(Array.isArray(events)&&events.length>=1&&events.length<=4,"Dönüş olay sayısı geçersiz.");
 const checked=[];
 for(const item of events){
   assure(exactKeys(item,["seq","kind","actor","at","previous_sha256","artifact","reason","sha256"]),"Olay alanları geçersiz.");
   const {sha256,...event}=item, before=checked.at(-1), time=Date.parse(event.at);
   assure(event.seq===checked.length+1&&nextEvents(checked).includes(event.kind)&&Number.isFinite(time)
    &&typeof event.at==="string"&&new Date(time).toISOString()===event.at&&(!before||time>=Date.parse(before.at)),
    "Olay sırası veya zamanı geçersiz.");
   const review=["accepted","rejected"].includes(event.kind);
   assure(review?isReviewer(event.actor,scope):event.actor===scope.worker,"Olay istasyonu geçersiz.");
   if(["result","accepted"].includes(event.kind)){
     assure(validArtifact(event.artifact),"Sonuç dosya kanıtı geçersiz.");
     if(event.kind==="accepted")assure(matchArtifact(event.artifact,before.artifact),"Kabul sonucu kayıttaki dosyayla uyuşmuyor.");
   }else assure(event.artifact===null,"Bu adımda dosya kanıtı beklenmiyor.");
   assure(["failed","rejected"].includes(event.kind)?REASONS.has(event.reason):event.reason===null,"Olay nedeni geçersiz.");
   assure(event.previous_sha256===(before?.sha256||scope.handoff_seal)&&sha256===await eventSeal(scope,event),"Dönüş zincirinin SHA-256 mührü eşleşmedi.");
   checked.push(item);
 }
 assure(head_sha256===checked.at(-1).sha256,"Son mühür eşleşmedi.");
 assure(chain.every((event,index)=>checked[index]?.sha256===event.sha256),"Açık olay zinciri farklı veya daha yeni.");
 $("return-task").value=scope.task_id;
 chain=checked;
 returnStatus("Zincir doğrulandı. "+EVENT_NAMES[checked.at(-1).kind]+".");
}
$("return-source").onchange=()=>withReturn(async()=>{
 const file=$("return-source").files[0];if(!file)return;
 handoff=null;chain=[];$("return-meta").textContent=""; $("return-import").value=""; $("return-artifact").value="";
 bindReturn(await verify(file));returnStatus("GAIA paketi doğrulandı. İş seç.");
});
$("return-use").onclick=()=>withReturn(async()=>{
 if(current){bindReturn(current);returnStatus("Hazırlanan paket açıldı. İş seç.")}
});
$("return-import").onchange=()=>withReturn(async()=>{
 const file=$("return-import").files[0];if(!file)return;
 try{await importReturn(file)}finally{$("return-import").value=""}
});
for(const [id,kind] of Object.entries(returnOptions))$(id).onclick=()=>withReturn(()=>addEvent(kind));
$("return-save").onclick=()=>{
 const scope=returnScope(), data={...scope,events:chain,head_sha256:chain.at(-1).sha256};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)+"\n"],{type:"application/json"}));
 const a=element("a");a.href=url;a.download="gaia-donus-"+scope.worker.toLowerCase()+"-"+scope.task_id+"-"+scope.request_id+".json";
 a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
const TASK_TITLES=["Yayın yanıtı","Başlık ve bölüm yapısı","Bağlantı envanteri","Erişilebilirlik işaretleri",
 "Etkileşim envanteri","Mobil zemin","Boyut ve değişiklik","Teslim ve kabul"];
