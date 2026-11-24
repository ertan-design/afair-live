"use strict";

const NAMES={"özerk":"Özerk","özel":"Özel","internet":"İnternet"};
const ROLES=["Keşif","Kaynak","Tasarım","Üretim","Ölçüm","Kontrol","Paket","Devir"];
const STATES={
 empty:"Amaç ve kabul ölçütünü belirle.",
 draft:"Taslağın dayanağını seç ve teslimi hazırla.",
 ready:"Teslimi farklı bir istasyonun kontrolüne ver.",
 accepted:"Kabul kanıtını ölçüm kaydına bağla."
};
const MAX_TICKS=24, MAX_WEB_TICKS=4, MAX_BODY=1024*1024;
const number=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:2});

function parseCombo(input){
 const text=input.normalize("NFC").toLocaleLowerCase("tr-TR").replaceAll("ınternet","internet").trim();
 if(!text)throw Error("En az bir tetik gir.");
 const parts=text.split("+");
 if(parts.shift().trim())throw Error("Her tetik + işareti ve bir adetle başlamalı.");
 const kinds=[];
 for(const raw of parts){
   const match=raw.trim().match(/^([1-9]\d?)\s+(?:(?:tetik|tetiği)\s+)?([a-zçğıöşü]+)(?:\s+(?:tetik|tetiği))?$/);
   if(!match)throw Error("Kombo biçimi geçersiz. Örnek: +1 özerk tetik");
   const [,qty,kind]=match;
   if(!Object.hasOwn(NAMES,kind))throw Error("“"+kind+"” tetiği henüz tanımlı değil.");
   if(kinds.length+Number(qty)>MAX_TICKS)throw Error("Bir komboda en çok "+MAX_TICKS+" tetik çalışır.");
   for(let i=0;i<Number(qty);i++)kinds.push(kind);
 }
 if(kinds.filter(kind=>kind==="internet").length>MAX_WEB_TICKS)throw Error("Bir komboda en çok "+MAX_WEB_TICKS+" internet tetiği çalışır.");
 return kinds;
}

function resolveGate(id){
 if(!Number.isInteger(id)||id<1||id>50000)throw Error("Kapı numarası 1–50.000 arasında olmalı.");
 const code="k"+String(id).padStart(6,"0");
 return {number:id,code,role:ROLES[Math.floor((id-1)/6250)],path:"/kapilar/"+code};
}

function nextStep(gate,state){
 if(!Object.hasOwn(STATES,state))throw Error("Geçerli bir iş durumu seç.");
 const href=state==="accepted"?"/olcumler":state==="ready"?"/yaklasim":"/calisma-alani?gate="+gate.code;
 return {status:"hazırlandı",ok:true,description:STATES[state],evidence:{bildirilen_durum:state,rol:gate.role,sonraki_adres:href}};
}

function checkRole(gate,expected){
 if(!ROLES.includes(expected))throw Error("Geçerli bir rol seç.");
 const ok=expected===gate.role;
 return {status:ok?"geçti":"kaldı",ok,description:ok?"Kapı, seçilen role ait.":"Kapı beklenen role ait değil.",
   evidence:{beklenen_rol:expected,gercek_rol:gate.role,kapı:gate.code}};
}

function urlFor(gate,selection,origin){
 const path=selection==="gate"?gate.path:selection==="work"?"/calisma-alani":selection==="home"?"/":null;
 if(!path)throw Error("Geçerli bir internet hedefi seç.");
 const base=new URL(origin), url=new URL(path,base);
 if(base.protocol!=="https:"||url.origin!==base.origin)throw Error("İnternet tetiği aynı kökende HTTPS gerektirir.");
 return url;
}

async function readBody(response){
 const declared=response.headers.get("content-length");
 if(declared!==null&&Number(declared)>MAX_BODY)throw Error("Yanıt 1 MiB sınırını aşıyor.");
 if(!response.body)throw Error("Yanıt gövdesi boş.");
 const reader=response.body.getReader(), pieces=[];
 let size=0;
 while(true){
   const {done,value}=await reader.read();
   if(done)break;
   size+=value.byteLength;
   if(size>MAX_BODY){await reader.cancel();throw Error("Yanıt 1 MiB sınırını aşıyor.")}
   pieces.push(value);
 }
 const all=new Uint8Array(size);
 let offset=0;
 for(const piece of pieces){all.set(piece,offset);offset+=piece.byteLength}
 return all;
}

async function probe(gate,selection){
 let url, status=null, responseType=null;
 try{
   url=urlFor(gate,selection,location.origin);
   const response=await fetch(url,{cache:"no-store",redirect:"error",credentials:"omit",signal:AbortSignal.timeout(7500)});
   status=response.status;responseType=(response.headers.get("content-type")||"").split(";")[0].toLowerCase();
   if(new URL(response.url).origin!==url.origin||response.redirected)throw Error("Yönlendirilmiş yanıt kabul edilmedi.");
   if(status!==200||responseType!=="text/html")throw Error("Web adresinden beklenen HTML yanıtı gelmedi.");
   const bytes=await readBody(response);
   if(!bytes.length)throw Error("Yanıt gövdesi boş.");
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes)),n=>n.toString(16).padStart(2,"0")).join("");
   return {status:"HTTP 200",ok:true,description:"HTML gövdesi alındı ve özetlendi. Uygulama davranışı ayrı bir tarayıcı testi gerektirir.",
     evidence:{adres:url.href,http:status,mime:responseType,bayt:bytes.length,sha256:sha}};
 }catch(error){
   const time=error.name==="TimeoutError"||error.name==="AbortError";
   return {status:"başarısız",ok:false,description:time?"HTTPS yanıtı zaman sınırını aştı.":error.message,
     evidence:{adres:url?.href??null,http:status,mime:responseType,bayt:null,sha256:null}};
 }
}

const $=id=>document.getElementById(id);
let last=null,lastKey=null,running=false;
function add(tag,text){
 const element=document.createElement(tag);element.textContent=text;return element;
}
function status(message,bad=false){
 $("run-status").textContent=message;
 $("run-status").classList.toggle("error",bad);
}
function present(record){
 const ok=record.results.filter(result=>result.ok).length;
 $("counts").textContent=record.results.length+" deneme · "+ok+" başarılı · "+(record.results.length-ok)+" başarısız · 0 model çağrısı";
 $("receipt").textContent=record.request_id+" · "+record.gate.code.toUpperCase();
 $("results").replaceChildren(...record.results.map(result=>{
   const li=add("li",""),title=add("h3",NAMES[result.mode]+" · "+result.status+" · "+number.format(result.ms)+" ms");
   title.className=result.ok?"ok":"failed";
   li.append(title,add("p",result.description));
   for(const [key,value] of Object.entries(result.evidence)){
     if(value!==null)li.append(add("p",key.replaceAll("_"," ")+": "+value));
   }
   if(result.mode==="özerk"&&result.evidence.sonraki_adres){
     const link=add("a","Sonraki adımı aç");link.href=result.evidence.sonraki_adres;li.append(link);
   }
   return li;
 }));
}
function clear(){
 last=null;lastKey=null;$("copy").disabled=true;$("again").hidden=true;$("copy-fallback").hidden=true;
 $("counts").textContent="0 deneme · 0 başarılı · 0 başarısız · 0 model çağrısı";
 $("receipt").textContent="";$("results").replaceChildren();status("");
}
for(const button of document.querySelectorAll("[data-mode]")){
 button.onclick=()=>{
   const cmd="+1 "+button.dataset.mode+" tetik";
   const field=$("combo");
   const next=field.value.trim()?field.value.trim()+"\n"+cmd:cmd;
   if(next.length<=440){field.value=next;clear()}
   else status("Kombo metni çok uzun.",true);
 };
}
$("again").onclick=clear;
$("run-form").addEventListener("input",()=>{if(!running)clear()});
$("run-form").onsubmit=async event=>{
 event.preventDefault();if(running)return;
 let modes,gate;
 const state=$("work-state").value,expectation=$("expected").value,target=$("endpoint").value;
 try{modes=parseCombo($("combo").value);gate=resolveGate($("gate").valueAsNumber)}
 catch(error){status(error.message,true);return}
 const key=JSON.stringify([gate.number,state,expectation,target,modes]);
 if(key===lastKey){status("Bu kombo tamamlandı. Tekrar etmek için Yeni koşu’yu seç.");return}
 clear();running=true;
 const record={schema:"aios.nami.combo.v1",request_id:crypto.randomUUID(),gate,trigger_count:modes.length,model_calls:0,results:[]};
 const controls=[...$("run-form").elements,...document.querySelectorAll("[data-mode]")];
 for(const control of controls)control.disabled=true;
 try{
   for(const [index,mode] of modes.entries()){
     status((index+1)+" / "+modes.length+" · "+NAMES[mode]+" tetiği işleniyor.");
     const started=performance.now();
     let result;
     try{result=mode==="özerk"?nextStep(gate,state):mode==="özel"?checkRole(gate,expectation):await probe(gate,target)}
     catch(error){result={status:"başarısız",ok:false,description:error.message,evidence:{}}}
     record.results.push({id:record.request_id+"-"+(index+1),mode,ms:Math.round((performance.now()-started)*100)/100,...result});
     present(record);
   }
   last=record;lastKey=key;$("copy").disabled=false;$("again").hidden=false;
   status("Kombo tamamlandı. Her tetiğin sonucu kaydedildi.");
 }finally{
   running=false;for(const control of controls)control.disabled=false;
 }
};
$("copy").onclick=async()=>{
 if(!last)return;
 const text=JSON.stringify(last,null,2);
 try{await navigator.clipboard.writeText(text);status("Sonuç JSON’u kopyalandı.")}
 catch{const field=$("copy-fallback");field.value=text;field.hidden=false;field.focus();field.select();status("Sonuç seçildi. Ctrl+C ile kopyala.")}
};

