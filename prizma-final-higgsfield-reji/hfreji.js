(function () {
  "use strict";

  var BARS = [
    { label: "DILA_01 (NVENC RTX 3090)", fps: 327.0, col: "#e4b66d" },
    { label: "DILA_02 (NVENC RTX 3090)", fps: 298.4, col: "#e4b66d" },
    { label: "DILA_03 (NVENC RTX 3090)", fps: 276.2, col: "#e4b66d" },
    { label: "DILA_04 Master (NVENC)", fps: 233.5, col: "#5de0a6" },
    { label: "Ryzen 9600X libx264 Ref", fps: 156.8, col: "#9e6b7c" }
  ];

  var POLICIES = [
    ["1 · Ücretli İstek Kilidi", "Yerel üretim politikası gereği new_paid_requests_blocked=true iken dış ücretli Higgsfield çağrısı yapılmaz."],
    ["2 · Mevcut 2 Higgsfield Klibi Onarıldı", "HF_01 ve HF_02 Seedance 2.5 klipleri kayıpsız +faststart (moov@36) yeniden paketlendi; anında HTTP 206 akar."],
    ["3 · Sıfır İstemci API Anahtarı", "Gelecekte HF_API_KEY tanımlandığında çağrı yalnız sunucu tarafı Vercel proxy ucundan geçer; tarayıcıya anahtar sızmaz."],
    ["4 · Yerel RTX 3090 Motoru", "33 saniyelik 4 film 5.54 saniyede (8.18 MB toplam) NVENC + Karplus-Strong akustik ses ile üretildi."]
  ];

  var cv = document.getElementById("bench-canvas");
  var ctx = cv.getContext("2d");
  ctx.fillStyle = "#12070a";
  ctx.fillRect(0, 0, cv.width, cv.height);

  BARS.forEach(function (b, i) {
    var y = 34 + i * 54;
    var w = (b.fps / 360) * (cv.width - 270);
    ctx.fillStyle = "#faf0ea";
    ctx.font = "600 12px ui-monospace, monospace";
    ctx.fillText(b.label, 18, y + 20);
    ctx.fillStyle = "#2b141c";
    ctx.fillRect(230, y + 4, cv.width - 260, 26);
    ctx.fillStyle = b.col;
    ctx.fillRect(230, y + 4, w, 26);
    ctx.fillStyle = "#12070a";
    ctx.fillText(b.fps.toFixed(1) + " FPS", 240, y + 21);
  });

  var pbox = document.getElementById("policy-list");
  POLICIES.forEach(function (p) {
    var d = document.createElement("div"); d.className = "pitem";
    var st = document.createElement("strong"); st.textContent = p[0];
    var sp = document.createElement("span"); sp.textContent = p[1];
    d.appendChild(st); d.appendChild(sp); pbox.appendChild(d);
  });

  var actx = null;
  function playTheme(notes) {
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!actx) actx = new Ctx();
    if (actx.state === "suspended") actx.resume();
    notes.forEach(function (f, i) {
      var len = Math.round(actx.sampleRate * 1.1);
      var buf = actx.createBuffer(1, len, actx.sampleRate);
      var out = buf.getChannelData(0);
      var N = Math.max(20, Math.round(actx.sampleRate / f));
      var ring = new Float32Array(N);
      for (var k = 0; k < N; k++) ring[k] = Math.random() * 2 - 1;
      var p = 0;
      for (var s = 0; s < len; s++) {
        var nx = (p + 1) % N;
        out[s] = ring[p] * 0.24;
        ring[p] = 0.993 * 0.5 * (ring[p] + ring[nx]);
        p = nx;
      }
      var src = actx.createBufferSource();
      src.buffer = buf; src.connect(actx.destination);
      src.start(actx.currentTime + i * 0.16);
    });
  }

  document.getElementById("b-guitar1").addEventListener("click", function () { playTheme([196, 246.9, 293.7, 392, 329.6, 293.7]); });
  document.getElementById("b-guitar2").addEventListener("click", function () { playTheme([220, 261.6, 329.6, 440, 392, 329.6]); });
})();
