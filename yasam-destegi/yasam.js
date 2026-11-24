'use strict';
(() => {
  const services = Object.freeze({terzi:{label:'Terzi görüşmesi',description:'Prova, tadilat veya kumaş görüşmesi için tercih ettiğin zamanı seç.',url:'https://www.afair.studio/',link:'Dila atölyesini incele ↗'},tarim:{label:'Tarım danışmanı görüşmesi',description:'Balkon, saksı veya ortak bahçe için bir görüşme isteği hazırla. Yerinde teşhis veya danışmanlık henüz verilmez.',url:'https://tarim.online/',link:'Tarım bilgi sayfasını incele ↗'},sanat:{label:'Sanat ve kürasyon görüşmesi',description:'Yaşam alanına uygun bir eser veya seçki üzerine görüşme isteği hazırla.',url:'https://www.afair.studio/lif-atolyesi/',link:'Malzeme ve seçki atölyesini incele ↗'},teknoloji:{label:'Teknoloji desteği görüşmesi',description:'Yeni evindeki cihazlar ve dijital kullanım için destek görüşmesi isteği hazırla. Uzaktan erişim veya bağlantı başlatılmaz.',url:'https://www.xn--ataehirmodern-ktc.com/uc-yon/',link:'Ataşehir yaşam deneyimine dön ↗'}});
  const periods = Object.freeze({sabah:'Sabah · 09.00–12.00',ogle:'Öğle · 12.00–15.00',aksamustu:'Öğleden sonra · 15.00–18.00',esnek:'Esnek · Birlikte belirleyelim'});
  const byId = id => document.getElementById(id);
  const form = byId('request-form');
  const service = byId('service');
  const block = byId('block');
  const date = byId('date');
  const period = byId('period');
  const status = byId('draft-status');
  const preview = byId('draft-preview');
  const storageKey = 'afair.yasam-destegi.draft.v1';
  let draft = null;
  const today = () => { const now = new Date(); return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-'); };
  date.min = today();
  const validDate = value => { if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const parsed = new Date(value+'T12:00:00'); return Number.isFinite(parsed.getTime()) && [parsed.getFullYear(),String(parsed.getMonth()+1).padStart(2,'0'),String(parsed.getDate()).padStart(2,'0')].join('-') === value && value >= today(); };
  const validateDraft = value => {
    if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema !== 'afair.service-request.v1' || !Object.hasOwn(services,value.service) || !['A','B','C'].includes(value.block) || !Object.hasOwn(periods,value.period) || !validDate(value.preferredDate)) throw new Error('Taslak geçersiz veya tercih edilen gün geçmiş. Yeni bir gün seç.');
    return {schema:'afair.service-request.v1',status:'local-draft-not-sent',service:value.service,block:value.block,preferredDate:value.preferredDate,period:value.period,availability:'unknown',providerConfirmed:false};
  };
  const summary = value => ['AFAIR · YAŞAM MASASI','TALEP TASLAĞI — GÖNDERİLMEDİ','Hizmet: '+services[value.service].label,'Başlangıç kapısı: '+value.block+' · Blok','Tercih edilen gün: '+value.preferredDate,'Tercih edilen zaman: '+periods[value.period],'Müsaitlik: bilinmiyor','Randevu onayı: yok','Bu taslak kişisel bilgi veya daire numarası içermez.'].join('\n');
  const enableDraftActions = enabled => ['copy','export','save'].forEach(id => { byId(id).disabled = !enabled; });
  const renderService = () => {
    const selected = services[service.value];
    if (!selected) return;
    document.querySelectorAll('[data-service]').forEach(button => { const active = button.dataset.service === service.value; button.classList.toggle('selected',active); button.setAttribute('aria-pressed',String(active)); });
    byId('service-description').textContent = selected.description;
    byId('service-link').textContent = selected.link;
    byId('service-link').href = selected.url;
  };
  const invalidate = () => { draft = null; enableDraftActions(false); preview.textContent = 'Seçimlerin değişti. Güncel talep taslağını yeniden hazırla.'; status.textContent = 'Taslak güncel değil; henüz hiçbir yere gönderilmedi.'; };
  service.addEventListener('change',() => { renderService(); invalidate(); });
  [block,date,period].forEach(control => control.addEventListener('change',invalidate));
  document.querySelectorAll('[data-service]').forEach(button => button.addEventListener('click',() => { service.value = button.dataset.service; renderService(); invalidate(); }));
  form.addEventListener('submit',event => {
    event.preventDefault();
    date.min = today();
    try { draft = validateDraft({schema:'afair.service-request.v1',service:service.value,block:block.value,preferredDate:date.value,period:period.value}); preview.textContent = summary(draft); enableDraftActions(true); status.textContent = 'Taslak hazır. Gönderilmedi, randevu alınmadı; karşı tarafın müsaitliği bilinmiyor.'; }
    catch (error) { draft = null; enableDraftActions(false); status.textContent = error.message; }
  });
  byId('copy').addEventListener('click',async () => {
    try { if (!draft) return; const current = validateDraft(draft); if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Kopyalama bu tarayıcıda kullanılamıyor. Taslak metnini seçip kopyalayabilir veya JSON indirebilirsin.'); await navigator.clipboard.writeText(summary(current)); status.textContent = 'Taslak panoya kopyalandı. Herhangi bir sağlayıcıya gönderilmedi.'; }
    catch (error) { status.textContent = error.message || 'Kopyalama tamamlanamadı.'; }
  });
  byId('export').addEventListener('click',() => {
    let url = null;
    try { if (!draft) return; const current = validateDraft(draft); const blob = new Blob([JSON.stringify(current,null,2)],{type:'application/json;charset=utf-8'}); url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'afair-talep-'+current.preferredDate+'.json'; document.body.appendChild(link); link.click(); link.remove(); status.textContent = 'JSON indirme başlatıldı. Bu bir yerel taslaktır, randevu onayı değildir.'; }
    catch (error) { status.textContent = error.message || 'İndirme başlatılamadı.'; }
    finally { if (url) setTimeout(() => URL.revokeObjectURL(url),2000); }
  });
  byId('save').addEventListener('click',() => { try { if (!draft) return; const current = validateDraft(draft); localStorage.setItem(storageKey,JSON.stringify(current)); status.textContent = 'Taslak yalnız bu tarayıcıda saklandı. Ortak cihazda yerel kaydı silebilirsin.'; } catch (error) { status.textContent = error.message || 'Tarayıcıda saklama kullanılamıyor.'; } });
  byId('restore').addEventListener('click',() => {
    try { const raw = localStorage.getItem(storageKey); if (!raw) { status.textContent = 'Bu tarayıcıda saklanmış taslak bulunamadı.'; return; } if (raw.length > 4096) throw new Error('Saklanan taslak beklenen boyutu aşıyor. Yerel kaydı silip yeniden hazırla.'); const restored = validateDraft(JSON.parse(raw)); draft = restored; service.value = draft.service; block.value = draft.block; date.value = draft.preferredDate; period.value = draft.period; renderService(); preview.textContent = summary(draft); enableDraftActions(true); status.textContent = 'Yerel taslak açıldı. Müsaitlik doğrulanmadı ve gönderim yapılmadı.'; }
    catch (error) { draft = null; enableDraftActions(false); status.textContent = error.message || 'Saklanan taslak açılamadı.'; }
  });
  byId('erase').addEventListener('click',() => { try { localStorage.removeItem(storageKey); status.textContent = 'Bu sayfaya ait yerel kayıt silindi. Ekrandaki taslak gönderilmedi.'; } catch { status.textContent = 'Tarayıcı yerel kayda erişime izin vermiyor.'; } });
  const requestedService = new URLSearchParams(window.location.search).get('konu');
  service.value = requestedService !== null && Object.hasOwn(services,requestedService) ? requestedService : 'terzi';
  renderService();
})();
