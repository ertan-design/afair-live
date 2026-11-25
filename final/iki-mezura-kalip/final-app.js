

  const STORAGE_KEY = 'dila_afair_sync_state_v1';
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('dila_afair_8sync') : null;
  const defaultState = {
    blackForbidden: true,
    undertone: 'sicak_altin',
    darkSignatureName: 'Yanik Espreso',
    darkSignatureHex: '#241914',
    kelvin: 3400,
    m1_shoulder: 41,
    m1_waist: 68,
    m1_height: 168,
    m1_ratio: 1.62,
    m2_wall_cm: 240,
    m2_gaze_cm: 85,
    selectedArt: 'Kehribar Ufuk #04',
    selectedFabric: 'Ham Ipek 190g/m2',
    jumps: 1
  };
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign({}, defaultState, JSON.parse(raw));
    } catch (e) {}
    return Object.assign({}, defaultState);
  }
  let state = loadState();
  function saveAndBroadcast(reason) {
    state.jumps = (state.jumps || 1) + 1;
    const packet = Object.assign({ sema: 'dila.sicrama.v1', zaman: new Date().toISOString(), neden: reason }, state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    if (channel) channel.postMessage(packet);
    appendLog(packet);
  }
  function appendLog(pkt) {
    const box = document.getElementById('logBox');
    if (!box) return;
    const row = document.createElement('div');
    row.textContent = JSON.stringify({ sicrama: pkt.jumps, neden: pkt.neden, siyah_yasak: pkt.blackForbidden, imza: pkt.darkSignatureHex, m1: pkt.m1_ratio, m2_duvar: pkt.m2_wall_cm, eser: pkt.selectedArt });
    box.prepend(row);
  }
  if (channel) {
    channel.onmessage = (ev) => {
      if (ev && ev.data) {
        state = Object.assign({}, state, typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data);
        if (typeof render === 'function') render();
        appendLog({ jumps: state.jumps, neden: 'Diger Front sekmesinden canli sicrama alindi', ...state });
      }
    };
  }
  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEY && ev.newValue) {
      try { state = Object.assign({}, state, JSON.parse(ev.newValue)); if (typeof render === 'function') render(); } catch (e) {}
    }
  });

  function render() {
    document.body.classList.toggle('black-allowed', !state.blackForbidden);
    document.getElementById('shIn').value = state.m1_shoulder;
    document.getElementById('waIn').value = state.m1_waist;
    document.getElementById('heIn').value = state.m1_height;
    document.getElementById('wlIn').value = state.m2_wall_cm;
    document.getElementById('gzIn').value = state.m2_gaze_cm;

    document.getElementById('shVal').textContent = state.m1_shoulder + ' cm';
    document.getElementById('waVal').textContent = state.m1_waist + ' cm';
    document.getElementById('heVal').textContent = state.m1_height + ' cm';
    document.getElementById('wlVal').textContent = state.m2_wall_cm + ' cm';
    document.getElementById('gzVal').textContent = state.m2_gaze_cm + ' cm';

    state.m1_ratio = Number((state.m1_height / (state.m1_shoulder + state.m1_waist)).toFixed(2));
    const metraj = ((state.m1_height * 0.014) + (state.m1_shoulder * 0.018)).toFixed(2);
    const artW = Math.round(state.m2_wall_cm * 0.38);
    const artH = Math.round(artW / Math.max(1.2, state.m1_ratio));

    document.getElementById('f2Status').textContent = 'ORAN: ' + state.m1_ratio + ' · İMZA KOYU: ' + state.darkSignatureHex;
    document.getElementById('yardTxt').textContent = metraj + ' metre';
    document.getElementById('fabTxt').textContent = state.selectedFabric;
    document.getElementById('artDimTxt').textContent = artW + ' × ' + artH + ' cm';

    const stroke = state.blackForbidden ? state.darkSignatureHex : '#F5F5F5';
    const shPx = state.m1_shoulder * 2.4;
    const waPx = state.m1_waist * 1.15;
    const hPx = state.m1_height * 1.05;
    const cx = 135;
    const topY = 28;
    const botY = Math.min(235, topY + hPx);
    const midY = topY + (botY - topY) * 0.52;

    const tw = Math.min(165, artW * 1.05);
    const th = Math.min(185, artH * 1.35);
    const tx = 290;
    const ty = 40;

    document.getElementById('patternSvg').innerHTML = `
      <polygon points="${cx - shPx/2},${topY} ${cx + shPx/2},${topY} ${cx + waPx/2},${midY} ${cx + shPx*0.46},${botY} ${cx - shPx*0.46},${botY} ${cx - waPx/2},${midY}"
        fill="rgba(166,75,42,0.14)" stroke="${stroke}" stroke-width="2.2"/>
      <line x1="${cx}" y1="${topY}" x2="${cx}" y2="${botY}" stroke="${stroke}" stroke-dasharray="4 3"/>
      <text x="${cx}" y="18" text-anchor="middle" font-size="11" fill="${stroke}" font-family="monospace">TERZİ KALIBI (${state.m1_shoulder}/${state.m1_waist})</text>
      <rect x="${tx}" y="${ty}" width="${tw}" height="${th}" fill="rgba(47,93,80,0.16)" stroke="${stroke}" stroke-width="4"/>
      <circle cx="${tx + tw/2}" cy="${ty + th/2}" r="${Math.max(12, state.m2_gaze_cm * 0.22)}" fill="none" stroke="#A64B2A" stroke-dasharray="3 3"/>
      <text x="${tx + tw/2}" y="24" text-anchor="middle" font-size="11" fill="${stroke}" font-family="monospace">İKİZ GALERİ TUVALİ (${artW}×${artH}cm)</text>
    `;
  }
  ['shIn','waIn','heIn','wlIn','gzIn'].forEach(id => {
    document.getElementById(id).oninput = () => {
      state.m1_shoulder = Number(document.getElementById('shIn').value);
      state.m1_waist = Number(document.getElementById('waIn').value);
      state.m1_height = Number(document.getElementById('heIn').value);
      state.m2_wall_cm = Number(document.getElementById('wlIn').value);
      state.m2_gaze_cm = Number(document.getElementById('gzIn').value);
      render();
      saveAndBroadcast('Front-02 Iki Mezura olculeri guncellendi');
    };
  });
  document.getElementById('sealBtn').onclick = () => {
    const rec = JSON.stringify({ sema: 'dila.randevu.v1', terzi: 'Affair Dila', ...state });
    if (navigator.clipboard) navigator.clipboard.writeText(rec);
    appendLog({ jumps: state.jumps, neden: 'Terzi olcu fisi (.jsonl) panoya kopyalandi', ...state });
  };
  render();
  appendLog({ jumps: state.jumps, neden: 'Front-02 Iki Mezura tezgahi acildi', ...state });

