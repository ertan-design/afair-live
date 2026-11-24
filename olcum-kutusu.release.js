
"use strict";
const $=id=>document.getElementById(id), STEP=[50,500,5000,50000], BASE=[1,51,4051,44051];
const GROUP=[1,8,8,8], LABEL=["Kullanım","Hazır","Sergi","Bekleyen"], REF=72768276;
const FORMAT=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:6});
const CATALOG=[["AIOS","Süre ve veri tekrarını ölç","Duvar süresi, CPU süresi, okunan bayt, A/B medyanı","Aynı girdi ve aynı çıktı SHA’sı. Sıcak önbellek ayrıca etiketli.","aios_cas.py"],["CEVHER","Kaliteyi ve kabulü ayır","Kural profili, sürüm, bulgu, bağımsız karar","Üretenin ölçümü ile hakemin kabulü ayrı. V1 otomatik puan vermiyor.","CEVHER_CONSTANTS.js · aios_cevher_motor.py"],["RYTE","Özgün üretim miktarını ölç","Bayt, KiB, RYTE, çıktı SHA-256","1 RYTE = 72.768.276 bayt. Kopya, paket ve özgün ürün ayrı.","ASTRA RYTE Tek Okuma Kapısı"],["BOULDERDASH","Koşuyu yeniden sınanabilir kıl","İstek kimliği, girdi/çıktı SHA’sı, tekrar, sonuç","Aynı veri ve kabul ölçütüyle tekrar. SHA eşliği kaynak doğruluğu iddiası taşımaz.","parkur-saf/runner.mjs"],["NAMI","Savunmacı mühendisliği izle","Sınır kontrolü, hata yolu, satır sonu","Nami rolü burada Cevher motorunun yerelde tanımladığı savunma ölçütleriyle eşleşir.","Cevher NAMI ağırlığı ve AST denetimi"],["GAIA","Kapıdan hakeme geçişi izle","Kapı katmanı, iş sahibi, gönderim, kabul ve yayın","Kullanım kotası ile sergi sayısı ayrı. Üreten ve kabul eden farklı roller.","GAIA-02 Kovan · GAIA-05 Terazi · GAIA-11 Çekirdek"],["SCIENCE","Ölçümün güncelliğini denetle","Ölçülen kaynaklar, UTC kontrol zamanı, giriş KiB","Önce erişim ve tazelik. Örnekleme yaşı eskirse değer güncel sayılmaz.","Yerel Science ölçüm ucu"],["MODEL","Model kullanımını karşılaştır","Sağlayıcı, model sürümü, giriş/çıkış tokenı ve kredi","Makbuz yoksa token ve kredi bilinmiyor. Yerel bayt ölçümü ayrı.","Sağlayıcı makbuzu + kart alanları"]], SAMPLE={"a_b":{"equal_output_sha256":"a6e573d0e8f062821458a279544da1fb066b1a3680e960b50978f49733adc4a7","full_median_ms":1.3418,"full_ms":[0.8741,6.815,1.4849,1.3418,0.828,52.719,1.1979],"full_read_bytes_per_round":77922,"method":"fixed_manifest_full_vs_warm_delta","rounds":7,"wall_reduction_pct":69.288,"warm_median_ms":0.4121,"warm_ms":[0.2382,1.7967,0.4166,0.4121,0.216,0.2068,0.5518],"warm_read_bytes_per_round":0},"acceptance":{"method":"output_sha_equal","state":"mechanically_checked"},"actor":{"model":null,"station":"CODEX"},"ended_at_utc":"2026-11-24T15:05:59.681+00:00","input":{"bytes":77922,"digest_scope":"manifest","files":6,"sha256":"a6e573d0e8f062821458a279544da1fb066b1a3680e960b50978f49733adc4a7"},"kind":"reference_benchmark","output":{"bytes":696,"digest_scope":"manifest","sha256":"a6e573d0e8f062821458a279544da1fb066b1a3680e960b50978f49733adc4a7"},"request_id":"bf2a8e9cca054739b437a72599626b74","runtime":{"cpu_ms":46.875,"source":"perf_counter_ns/process_time_ns","wall_ms":70.3759},"ryte":{"input":0.0010708237749098247,"output":0.000009564607522102077,"reference_bytes":72768276},"schema":"aios.olcum.v1","usage":{"credits":null,"source":"unreported","tokens_in":null,"tokens_out":null},"work":{"method":"fixed_manifest_full_vs_warm_delta","outcome":"completed"}};
const HASH=/^[a-f0-9]{64}$/, KEY=/^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/, MAX=8192;
const PORTAL="https://www.selinahbap.com/selin-kapilar.html";
const value=(v,pattern)=>typeof v==="string"&&pattern.test(v)?v:null;
const number=v=>typeof v==="number"&&Number.isFinite(v)&&v>=0?v:null;
const sha=v=>value(v,HASH), key=v=>value(v,KEY), text=v=>v==null?"Ölçülmedi":FORMAT.format(v);
function element(tag,content){const n=document.createElement(tag);if(content!==undefined)n.textContent=content;return n}
function artifact(o){
 if(!o||!Number.isSafeInteger(o.bytes)||o.bytes<0)throw Error("Bayt ölçümü eksik veya geçersiz.");
 return {bytes:o.bytes,sha256:sha(o.sha256),digest_scope:key(o.digest_scope)};
}
function packet(s){
 if(new TextEncoder().encode(s).length>MAX)throw Error("Kart 8 KiB sınırını aşıyor.");
 const c=JSON.parse(s);
 if(c?.schema!=="aios.olcum.v1"||!key(c.request_id)||!key(c.work?.method)||!key(c.actor?.station))throw Error("Ölçüm kartı şeması veya istek kimliği geçersiz.");
 const input=artifact(c.input), output=artifact(c.output), usage=c.usage||{}, run=c.runtime||{};
 const receipt=sha(usage.receipt_sha256), accepted=["pending","mechanically_checked"].includes(c.acceptance?.state)?c.acceptance.state:"pending";
 const data={schema:c.schema,request_id:c.request_id,kind:key(c.kind),
    ended_at_utc:typeof c.ended_at_utc==="string"&&c.ended_at_utc.length<=40&&Number.isFinite(Date.parse(c.ended_at_utc))?
        new Date(c.ended_at_utc).toISOString():null,
    actor:{station:key(c.actor.station),model:key(c.actor.model)},work:{method:key(c.work.method),outcome:key(c.work.outcome),door_id:key(c.work.door_id)},
    input:{...input,files:Number.isSafeInteger(c.input.files)&&c.input.files>=0?c.input.files:null},output,
    runtime:{wall_ms:number(run.wall_ms),cpu_ms:number(run.cpu_ms),receipt_ms:number(run.receipt_ms),source:key(run.source)},
    usage:{tokens_in:receipt?number(usage.tokens_in):null,tokens_out:receipt?number(usage.tokens_out):null,
           credits:receipt?number(usage.credits):null,source:receipt?key(usage.source):"unreported",receipt_sha256:receipt},
    acceptance:{state:accepted,method:key(c.acceptance?.method)},
    ryte:{reference_bytes:REF,input:input.bytes/REF,output:output.bytes/REF}};
 if(c.a_b&&sha(c.a_b.equal_output_sha256)===output.sha256&&output.sha256){
   const a=c.a_b, reduced=number(a.full_median_ms)>0&&number(a.warm_median_ms)!==null?100*(1-a.warm_median_ms/a.full_median_ms):null;
   data.a_b={method:key(a.method),rounds:number(a.rounds),full_median_ms:number(a.full_median_ms),warm_median_ms:number(a.warm_median_ms),
      wall_reduction_pct:reduced,full_read_bytes_per_round:number(a.full_read_bytes_per_round),warm_read_bytes_per_round:number(a.warm_read_bytes_per_round),
      equal_output_sha256:output.sha256};
 }
 if(c.science&&["fresh","stale","partial","unavailable"].includes(c.science.status)){
   const checked=c.science.checked_at;
   const age=typeof checked==="string"?Date.now()-Date.parse(checked):NaN;
   data.science={status:c.science.status==="fresh"&&!(age>=0&&age<75000)?"stale":c.science.status,
      sample_files:number(c.science.sample_files),sample_bytes:number(c.science.sample_bytes),entry_target_kib:number(c.science.entry_target_kib),
      checked_at:Number.isFinite(age)?new Date(checked).toISOString():null};
 }
 return data;
}
let current=null;
function feedback(s,isError=false){$("status").textContent=s;$("status").classList.toggle("error",isError)}
function check(s){
 current=null;
 try{
   current=packet(s);const c=current;
   $("view").textContent=[c.actor.station+(c.actor.model?" · "+c.actor.model:""),c.work.method+" · "+c.request_id,
     "Duvar süresi "+text(c.runtime.wall_ms)+" ms · CPU "+(c.runtime.cpu_ms==null?"ölçülmedi":text(c.runtime.cpu_ms)+" ms"),
     text(c.input.bytes)+" bayt girdi → "+text(c.output.bytes)+" bayt çıktı",
     "Token "+text(c.usage.tokens_in)+" / "+text(c.usage.tokens_out)+" · kredi "+text(c.usage.credits),
     c.a_b?"A/B ortanca "+text(c.a_b.full_median_ms)+" → "+text(c.a_b.warm_median_ms)+" ms":"Eş koşullu A/B yok",
     "Kabul · "+(c.acceptance.state==="mechanically_checked"?"mekanik denetim kaydı":"bağımsız inceleme bekliyor")].join("\n");
   feedback("Kart biçimi doğrulandı. Paylaşıma hazır.");
 }catch(e){$("view").textContent="";feedback(e.message||"Kart okunamadı.",true)}
 for(const id of ["copy","download"])$(id).disabled=!current;
}
$("load").onclick=()=>check($("paste").value);
$("import").onchange=async e=>{
 const f=e.target.files[0];if(!f)return;
 if(f.size>MAX){check("");feedback("Kart 8 KiB sınırını aşıyor.",true);return}
 try{const s=await f.text();$("paste").value=s;check(s)}catch{check("");feedback("Dosya okunamadı.",true)}
};
$("sample").onclick=()=>{$("paste").value=JSON.stringify(SAMPLE);check($("paste").value)};
function share(){return JSON.stringify(current,null,2)+"\n"}
$("copy").onclick=async()=>{
 const s="Bu AIOS ölçüm kartını tek kez oku. Ölçülen süre ve baytı, bildirilen model kullanımını ve kabul durumunu ayrı ele al. null alanı bilinmiyor. Aynı istek kimliğini sonraki bulguya taşı.\n\n"+share();
 try{await navigator.clipboard.writeText(s);feedback("GPT’ye aktarılacak metin kopyalandı.")}
 catch{$("paste").value=s;$("paste").focus();$("paste").select();feedback("Metin seçildi. Ctrl+C ile al.")}
};
$("download").onclick=()=>{
 const url=URL.createObjectURL(new Blob([share()],{type:"application/json"}));
 const a=element("a");a.href=url;a.download="aios-olcum-"+current.request_id+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
};
for(const [name,job,signals,rule,source] of CATALOG){
 const n=element("article"), title=element("h3",name), intro=element("span",job), evidence=element("p",signals), constraint=element("p",rule), origin=element("p",source);
 origin.className="muted";n.append(title,intro,evidence,constraint,origin);$("tools").append(n)
}
let selected=4051,offset=0;
function grouping(){const l=Number($("level").value),r=Number($("ring").value||1),e=Number($("entry").value);return [l,r,e]}
function rings(l){$("ring").replaceChildren();for(let i=1;i<=GROUP[l];i++){const o=element("option",String(i));o.value=String(i);$("ring").append(o)}}
function render(){
 const [l,r,e]=grouping(), from=BASE[l]+(r-1)*STEP[l], to=Math.min(from+offset+e-1,from+STEP[l]-1);
 $("doors").replaceChildren();
 for(let k=from+offset;k<=to;k++){
   const b=element("button","K"+k);if(k===selected)b.setAttribute("aria-current","true");
   b.onclick=()=>door(k);$("doors").append(b)
 }
 $("range").textContent=FORMAT.format(from+offset)+"–"+FORMAT.format(to);
 $("prev").disabled=offset===0;$("next").disabled=offset+e>=STEP[l];
}
function door(k){
 if(!Number.isInteger(k)||k<1||k>444050)return;
 const l=BASE.findLastIndex(b=>b<=k), ring=Math.floor((k-BASE[l])/STEP[l])+1;
 if(Number($("level").value)!==l||$("ring").options.length!==GROUP[l]){$("level").value=String(l);rings(l)}
 $("ring").value=String(ring);const e=Number($("entry").value);offset=Math.floor(((k-BASE[l])%STEP[l])/e)*e;
 selected=k;$("door").value=String(k);
 $("picked").textContent="K"+FORMAT.format(k)+" · "+LABEL[l]+" · Halka "+ring;
 const a=$("start");a.hidden=l!==0;
 if(l===0)a.href=PORTAL+"#kapi-"+String(k).padStart(5,"0");
 else a.removeAttribute("href");
 history.replaceState(null,"","#kapi-"+k);render()
}
$("jump").onsubmit=e=>{e.preventDefault();door($("door").valueAsNumber)};
$("level").onchange=()=>door(BASE[Number($("level").value)]);
$("ring").onchange=()=>{const [l,r]=grouping();door(BASE[l]+(r-1)*STEP[l])};
$("entry").onchange=()=>door(selected);
$("prev").onclick=()=>{offset=Math.max(0,offset-Number($("entry").value));render()};
$("next").onclick=()=>{offset+=Number($("entry").value);render()};
function fromHash(){const m=/^#kapi-(\d{1,6})$/.exec(location.hash),n=m?Number(m[1]):0;door(n>=1&&n<=444050?n:4051)}
window.addEventListener("hashchange",fromHash);fromHash();
