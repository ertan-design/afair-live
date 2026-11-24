
"use strict";
const MAX_ID = 50000, CAP = 50, REF = 72768276, LIMIT = 64 * 1024 * 1024, LEASE = 120000;
const TYPES = Object.freeze([
  ["SHA-256","Bir dosyanın tam SHA-256 özetini çıkar."],
  ["Bayt ve RYTE","Bir dosyanın baytını, KiB ve RYTE karşılığını hesapla."],
  ["UTF-8 metin","Bir UTF-8 dosyasının satır ve karakter sayısını ölç."],
  ["Satır sonları","LF, CRLF ve tek CR kayıtlarını ayrı say."],
  ["JSON denetimi","Bir UTF-8 JSON dosyasını ayrıştır. Üst öğenin türünü ve eleman sayısını göster."],
  ["CSV denetimi","RFC tarzı tırnaklı CSV satırlarını say. Virgül veya noktalı virgül seç."],
  ["Dosya kıyası","İki dosyanın SHA-256 özetini karşılaştır."],
  ["Tekrarlanan satırlar","Bir UTF-8 dosyasındaki aynı satırları ve tekil satır sayısını ölç."]
]);
const tur=new Intl.NumberFormat("tr-TR");
const num=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:8});
const byId=id=>document.getElementById(id);
const tier=byId("tier"), entry=byId("entry"), grid=byId("grid"), detail=byId("detail"), go=byId("goto");
let selected = 1, offset = 0, version = 0, dbPromise;
const opening = /^#kapi-(\d{1,5})$/.exec(location.hash);
if (opening && validId(Number(opening[1]))) {
  selected = Number(opening[1]);
  tier.value = [50,500,5000,50000].find(n=>n>=selected);
}
function validId(id){return Number.isInteger(id)&&id>=1&&id<=MAX_ID}
function lane(id){return (id-1)%TYPES.length}
function code(id){return "K"+String(id).padStart(5,"0")}
function node(tag,text){const element=document.createElement(tag); if(text!==undefined)element.textContent=text; return element}
function action(label,fn,style){const btn=node("button",label); btn.type="button"; btn.className=style||""; btn.onclick=fn; return btn}
function message(text,error){const p=node("p",text); p.className=error?"error":"muted"; p.setAttribute("role","status"); return p}

function database(){
 if (!dbPromise) dbPromise=new Promise((resolve,reject)=>{
   const req=indexedDB.open("selinahbap-kapilar-v1",1);
   req.onupgradeneeded=()=>req.result.createObjectStore("doors",{keyPath:"id"});
   req.onsuccess=()=>resolve(req.result);
   req.onerror=()=>reject(req.error);
 });
 return dbPromise;
}
async function dbRead(id){
 const db=await database();
 return new Promise((res,rej)=>{
   const tx=db.transaction("doors","readonly");const req=tx.objectStore("doors").get(id);
   req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);
 });
}
async function count(){
 const db=await database();
 return new Promise((res,rej)=>{
  const req=db.transaction("doors","readonly").objectStore("doors").count();
  req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error);
 });
}
async function edit(id,command,value={}){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction("doors","readwrite"), store=tx.objectStore("doors");
  let failure=null,current;
  const stop=reason=>{failure=new Error(reason);tx.abort()};
  const find=store.get(id);
  find.onsuccess=()=>{
   current=find.result;
   if (command==="release") {
     if(current?.state==="running" && Date.now()-current.updated<LEASE){stop("İş hâlâ sürüyor.");return}
     store.delete(id);return;
   }
   if (command==="complete") {
     if(current?.job!==value.job || current.state!=="running"){stop("İş artık etkin değil.");return}
     store.put({...current,state:value.state,result:value.result,receipt:value.receipt,updated:Date.now()});return;
   }
   if (command==="reserve" && current)return;
   if (command==="run" && current?.state==="running" && Date.now()-current.updated<LEASE){
     stop("Bu kapıda iş sürüyor.");return;
   }
   const put=()=>store.put({id,state:command==="run"?"running":"reserved",
                            job:value.job||null,result:null,updated:Date.now()});
   if(current)put();
   else{
     const total=store.count();
     total.onsuccess=()=>total.result>=CAP?stop("50 kapılık havuz dolu. Bir kapıyı beklemeye al."):put();
   }
  };
  tx.oncomplete=()=>resolve(); tx.onabort=()=>reject(failure||tx.error||new Error("Kayıt tamamlanamadı."));
  tx.onerror=()=>reject(tx.error);
 });
}

function lines(text){return text===""?[]:text.replace(/\r\n?/g,"\n").replace(/\n$/,"").split("\n")}
function csvRows(text,delimiter){
 let quoted=false, closed=false, start=true, rows=0, cols=1, first=null, varied=0, touched=false;
 const finish=()=>{if(first===null)first=cols; else if(cols!==first)varied++; rows++;cols=1;start=true;closed=false;touched=false};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){
    if(c==='"'){
      if(text[i+1]==='"')i++;
      else{quoted=false;closed=true}
    }
    continue;
  }
  if(c==="\n"||c==="\r"){
     if(c==="\r"&&text[i+1]==="\n")i++;
     finish();continue;
  }
  touched=true;
  if(c===delimiter){cols++;start=true;closed=false;continue}
  if(closed)throw new Error("Kapanan tırnaktan sonra beklenmeyen karakter.");
  if(c==='"'){
    if(!start)throw new Error("Alan içinde geçersiz tırnak.");
    quoted=true;
  }
  start=false;
 }
 if(quoted)throw new Error("CSV tırnağı kapanmamış.");
 if(touched)finish();
 return {rows,first:first||0,varied};
}
async function digest(bytes){
 const raw=await crypto.subtle.digest("SHA-256",bytes);
 return [...new Uint8Array(raw)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function processFiles(type,files,delimiter){
 if(files.length!==(type===6?2:1))throw new Error(type===6?"Tam iki dosya seç.":"Tam bir dosya seç.");
 if(files.some(file=>file.size>LIMIT))throw new Error("Dosya başına sınır 64 MiB.");
 const size=files[0].size;
 if(type===1)return [tur.format(size)+" bayt",num.format(size/1024)+" KiB",num.format(size/REF)+" RYTE"];
 const bytes=await files[0].arrayBuffer();
 if(type===0)return ["SHA-256",await digest(bytes),tur.format(size)+" bayt"];
 if(type===6){
   const a=await digest(bytes),b=await digest(await files[1].arrayBuffer());
   return [a===b?"İçerik aynı":"İçerik farklı","A · "+a,"B · "+b];
 }
 const text=new TextDecoder("utf-8",{fatal:true}).decode(bytes);
 if(type===2){
   let points=0;for(const _point of text)points++;
   return [tur.format(lines(text).length)+" satır",tur.format(points)+" Unicode kod noktası"];
 }
 if(type===3){
   let lf=0,crlf=0,cr=0;
   for(let i=0;i<text.length;i++)if(text[i]==="\r"){if(text[i+1]==="\n"){i++;crlf++}else cr++}else if(text[i]==="\n")lf++;
   return ["LF "+tur.format(lf),"CRLF "+tur.format(crlf),"Tek CR "+tur.format(cr)];
 }
 if(type===4){
   const x=JSON.parse(text),kind=Array.isArray(x)?"Dizi":x===null?"Null":typeof x==="object"?"Nesne":typeof x;
   return ["Geçerli JSON · "+kind,"Üst düzey öğe "+tur.format(Array.isArray(x)?x.length:x&&typeof x==="object"?Object.keys(x).length:0)];
 }
 if(type===5){
   const r=csvRows(text,delimiter);return ["Satır "+tur.format(r.rows),"İlk satır sütun "+tur.format(r.first),"Farklı sütun sayılı satır "+tur.format(r.varied)];
 }
 const textLines=lines(text), total=new Set(textLines).size;
 return ["Toplam "+tur.format(textLines.length),"Tekil "+tur.format(total),"Tekrar "+tur.format(textLines.length-total)];
}
const METHOD=["sha256","ryte_bytes","utf8_text","line_endings","json_shape","csv_shape","file_compare","repeat_lines"];
const elapsed=from=>Math.round((performance.now()-from)*1000)/1000;
async function receiptFor(id,job,files,result,outcome,wall){
 const start=performance.now(), encoder=new TextEncoder(), type=lane(id);
 const inputBytes=files.reduce((sum,file)=>sum+file.size,0);
 let factor=null,digestScope=null;
 if(outcome==="completed"&&type===0){factor=result[1];digestScope="file"}
 else if(outcome==="completed"&&type===6){
  const hashes=result.slice(1).map(line=>line.slice(4));
  factor=await digest(encoder.encode(JSON.stringify(hashes)));digestScope="ordered_sha256_array";
 }else if(outcome==="completed"&&files.length===1&&inputBytes<=8*1024*1024){
  factor=await digest(await files[0].arrayBuffer());digestScope="file";
 }
 const payload=encoder.encode(JSON.stringify(result)), outHash=await digest(payload);
 return {schema:"aios.olcum.v1",request_id:job,kind:"browser_operation",ended_at_utc:new Date().toISOString(),
  actor:{station:"SELIN",model:null},work:{method:METHOD[type],outcome,door_id:code(id)},
  input:{files:files.length,bytes:inputBytes,sha256:factor,digest_scope:digestScope},
  output:{bytes:payload.length,sha256:outHash,digest_scope:"result_array_utf8"},
  runtime:{wall_ms:wall,cpu_ms:null,receipt_ms:elapsed(start),source:"performance_now"},
  usage:{tokens_in:null,tokens_out:null,credits:null,source:"unreported"},
  acceptance:{state:"pending",method:null},
  ryte:{reference_bytes:REF,input:inputBytes/REF,output:payload.length/REF}};
}
async function shareReceipt(card, button){
 const body=JSON.stringify(card,null,2)+"\n";
 const prompt="AIOS ölçüm kartını bir kez oku. Ölçülen ve bilinmeyen alanları ayır. Aynı istek kimliğini sonraki bulguya taşı.\n\n";
 try{await navigator.clipboard.writeText(prompt+body);button.textContent="Ölçüm kopyalandı"}
 catch{const field=node("textarea");field.setAttribute("aria-label","GPT’ye aktarılacak ölçüm");field.value=prompt+body;
   field.style.cssText="width:100%;min-height:7em";button.parentElement.after(field);field.focus();field.select()}
}
function downloadReceipt(card){
 const link=node("a"), url=URL.createObjectURL(new Blob([JSON.stringify(card,null,2)+"\n"],{type:"application/json"}));
 link.href=url;link.download="aios-olcum-"+card.request_id+".json";link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}
async function run(id,files,delimiter){
 const versionAtStart=++version;
 const job=crypto.randomUUID();
 try{
  await edit(id,"run",{job});
  if(selected===id && versionAtStart===version) detail.append(message("İş başladı."));
 }catch(error){
  if(selected===id)detail.append(message(error.message,true));return;
 }
 const started=performance.now();
 let result,state,wall;
 try{result=await processFiles(lane(id),files,delimiter);state="done";wall=elapsed(started)}
 catch(error){wall=elapsed(started);result=[error.message];state="error"}
 let receipt=null;
 try{receipt=await receiptFor(id,job,files,result,state==="done"?"completed":"failed",wall)}
 catch{if(selected===id)detail.append(message("Ölçüm kartı oluşturulamadı.",true))}
 try{await edit(id,"complete",{job,state,result,receipt})}
 catch(problem){if(selected===id)detail.append(message(problem.message,true));return}
 if(selected===id)await display(id);
 else await updateCount();
}

async function updateCount(){try{byId("active").textContent=tur.format(await count())}catch{byId("active").textContent="—"}}
function showGrid(){
 const limit=Number(tier.value), step=Number(entry.value);
 byId("mode").textContent=tur.format(limit)+" kapı sergide";
 const items=[];
 for(let id=offset+1;id<=Math.min(offset+step,limit);id++){
   const b=action("",()=>openDoor(id),"door");
   b.append(node("strong",code(id)),node("small",TYPES[lane(id)][0]));
   if(id===selected)b.setAttribute("aria-current","true");
   items.push(b);
 }
 grid.replaceChildren(...items);
 byId("counter").textContent=tur.format(offset+1)+"–"+tur.format(Math.min(offset+step,limit))+" / "+tur.format(limit);
 byId("back").disabled=offset===0;byId("forward").disabled=offset+step>=limit;
}
async function display(id){
 const v=++version;
 detail.replaceChildren(node("h3",code(id)+" · "+TYPES[lane(id)][0]),message(TYPES[lane(id)][1]));
 try{
  const current=await dbRead(id);
  if(v!==version)return;
  const states={reserved:"Kullanıma ayrıldı",running:"İş sürüyor",done:"Sonuç hazır",error:"İş yüklenemedi"};
  detail.append(message(current?states[current.state]:"Açılmaya hazır"));
  if(current?.result){const result=node("div",current.result.join("\n"));result.className="result";result.id="job-result";detail.append(result)}
  if(current?.receipt){
   const share=node("div");share.className="actions";
   const copy=action("Ölçüm kartını kopyala",()=>void shareReceipt(current.receipt,copy));
   share.append(copy,action("Ölçüm JSON’unu indir",()=>downloadReceipt(current.receipt)));detail.append(share);
  }
  const bar=node("div");bar.className="actions";
  const work=node("input");work.type="file";work.id="job-files";work.multiple=lane(id)===6;
  const chooser=node("label",lane(id)===6?"İki dosya seç":"Dosya seç");chooser.htmlFor=work.id;
  const delimiter=node("select");delimiter.setAttribute("aria-label","CSV ayırıcı");
  for(const [value,label] of [[",","Virgül"],[";","Noktalı virgül"]]){const item=node("option",label);item.value=value;delimiter.append(item)}
  detail.append(chooser,work);if(lane(id)===5)detail.append(delimiter);
  const act=action("İşi başlat",()=>void run(id,[...work.files],delimiter.value),"primary");
  act.disabled=current?.state==="running"&&Date.now()-current.updated<LEASE;
  bar.append(act);
  const cmd=current?"release":"reserve";
  bar.append(action(current?"Beklemeye al":"Kullanıma ayır",async()=>{
     try{await edit(id,cmd);await display(id)}
     catch(error){detail.append(message(error.message,true))}
  }));
  detail.append(bar);await updateCount();
 }catch{if(v===version)detail.append(message("Bu tarayıcıda iş kaydı açılamadı.",true))}
}
function openDoor(id,fromHash=false){
 if(!validId(id)){detail.append(message("Kapı numarası 1–50.000 olmalı.",true));return}
 selected=id;go.value=String(id);
 byId("team-gate").href="ekip-kapisi.html?kapi="+code(id);
 if(id>Number(tier.value))tier.value=[50,500,5000,50000].find(num=>num>=id);
 offset=Math.floor((id-1)/Number(entry.value))*Number(entry.value);
 if(!fromHash)history.replaceState(null,"","#kapi-"+String(id).padStart(5,"0"));
 showGrid();void display(id);
}
byId("open").onclick=()=>openDoor(go.valueAsNumber);
go.onkeydown=e=>{if(e.key==="Enter")openDoor(go.valueAsNumber)};
entry.onchange=()=>openDoor(selected);
tier.onchange=()=>openDoor(Math.min(selected,Number(tier.value)));
byId("back").onclick=()=>{offset=Math.max(0,offset-Number(entry.value));showGrid()};
byId("forward").onclick=()=>{offset+=Number(entry.value);showGrid()};
window.addEventListener("hashchange",()=>{
 const m=/^#kapi-(\d{1,5})$/.exec(location.hash);if(m)openDoor(Number(m[1]),true);
});
const science=byId("science-state");
async function pollScience(){
 try{
  const response=await fetch("/api/science",{cache:"no-store"});
  if(!response.ok||!response.headers.get("content-type")?.startsWith("application/json"))throw new Error();
  const data=await response.json();
  if(!Number.isInteger(data.bytes)||!Number.isInteger(data.files)||!Number.isFinite(Date.parse(data.checked_at)))throw new Error();
  const age=Date.now()-Date.parse(data.checked_at);
  const status=age<0||age>=75000?"Son ölçüm":data.status==="ok"?"Canlı ölçüm":"Kısmi ölçüm";
  science.textContent=status+" · "+data.files+" dosya · "+tur.format(data.bytes)+
                      " bayt · "+data.suggested_format+" · "+data.entry_target_kib+" KiB giriş hedefi";
 }catch{science.textContent="Yerel Science ölçüm bağlantısı etkin değil."}
}
openDoor(selected,true);
if(location.hostname==="127.0.0.1"){void pollScience();setInterval(pollScience,15000)}
else science.textContent="Science ölçümü yerel çalışma alanında izlenir.";
