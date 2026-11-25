(function () {
  "use strict";

  var CUES = [
    { no: 1, title: "Açılış Sessizliği", desc: "2900K loş spot, espresso yün açılış silueti", beam: [224, 174, 108], bpm: 78 },
    { no: 2, title: "İpek Akışı", desc: "3400K yan takip, mürdüm saten rüzgâr yürüyüşü", beam: [217, 123, 140], bpm: 92 },
    { no: 3, title: "Zümrüt Vurgu", desc: "4200K tepe ışığı, gece zümrüdü dimi geçişi", beam: [94, 189, 155], bpm: 98 },
    { no: 4, title: "İki-Mezura Kesit", desc: "4600K atölye kesit ışığı, omuz-bel kalıp vurgusu", beam: [232, 206, 165], bpm: 88 },
    { no: 5, title: "Bakır Final", desc: "3100K sıcak şelale ışığı, jakar kapanış", beam: [226, 134, 86], bpm: 104 },
    { no: 6, title: "Selamlama & Kayıt", desc: "3800K dengeli yayın çıkışı, arşiv mühür", beam: [240, 224, 204], bpm: 82 }
  ];

  var idx = 0;
  var playing = true;
  var phase = 0;
  var canvas = document.getElementById("runway-canvas");
  var ctx = canvas.getContext("2d");

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function renderCues() {
    var list = document.getElementById("cue-list");
    clear(list);
    CUES.forEach(function (c, i) {
      var li = document.createElement("li");
      li.className = "cue-item" + (i === idx ? " is-on" : "");
      var st = document.createElement("strong");
      st.textContent = "Perde " + c.no + " · " + c.title;
      var sp = document.createElement("span");
      sp.textContent = c.desc + " (" + c.bpm + " BPM)";
      li.appendChild(st);
      li.appendChild(sp);
      li.addEventListener("click", function () {
        idx = i;
        renderCues();
      });
      list.appendChild(li);
    });
    document.getElementById("cue-meta").textContent = "Perde " + CUES[idx].no + "/6 · " + CUES[idx].title + " · " + CUES[idx].bpm + " BPM";
  }

  function updateTailor() {
    var omuz = Number(document.getElementById("m-omuz").value);
    var gogus = Number(document.getElementById("m-gogus").value);
    var bel = Number(document.getElementById("m-bel").value);
    var boy = Number(document.getElementById("m-boy").value);

    document.getElementById("v-omuz").textContent = omuz + " cm";
    document.getElementById("v-gogus").textContent = gogus + " cm";
    document.getElementById("v-bel").textContent = bel + " cm";
    document.getElementById("v-boy").textContent = boy + " cm";

    var drop = gogus - bel;
    var fabricM = (1.35 + (boy / 100) * 1.15 + (gogus - 80) * 0.006).toFixed(2);
    var fitType = drop >= 16 ? "Atletik / Dar Bel" : (drop >= 10 ? "Klasik Terzi Kesim" : "Rahat Mimari Kesim");

    var halfSh = 42 + (omuz - 36) * 2.1;
    var halfW = 34 + (bel - 60) * 1.15;
    var halfHem = 44 + (gogus - 78) * 1.2;
    var botY = 128 + (boy - 58) * 2.0;
    var pts = [
      (160 - halfSh).toFixed(1) + ",36",
      (160 + halfSh).toFixed(1) + ",36",
      (160 + halfW).toFixed(1) + ",118",
      (160 + halfHem).toFixed(1) + "," + botY.toFixed(1),
      (160 - halfHem).toFixed(1) + "," + botY.toFixed(1),
      (160 - halfW).toFixed(1) + ",118"
    ].join(" ");
    document.getElementById("svg-jacket").setAttribute("points", pts);
    document.getElementById("svg-waist").setAttribute("x1", (160 - halfW).toFixed(1));
    document.getElementById("svg-waist").setAttribute("x2", (160 + halfW).toFixed(1));
    document.getElementById("svg-caption").textContent = "Tahmini Metraj: " + fabricM + " m · Drop: " + drop + " cm";

    var cards = document.getElementById("calc-cards");
    clear(cards);
    [
      ["Kumaş Metrajı", fabricM + " metre"],
      ["Kalıp Tipi", fitType],
      ["Göğüs − Bel", drop + " cm"],
      ["Prova Süresi", "2 Ziyaret (Taslak)"]
    ].forEach(function (pair) {
      var d = document.createElement("div");
      d.className = "ccard";
      var sp = document.createElement("span");
      sp.textContent = pair[0];
      var st = document.createElement("strong");
      st.textContent = pair[1];
      d.appendChild(sp);
      d.appendChild(st);
      cards.appendChild(d);
    });
  }

  function drawRunway() {
    var W = canvas.width, H = canvas.height;
    var cue = CUES[idx];
    ctx.fillStyle = "#14090c";
    ctx.fillRect(0, 0, W, H);

    // Perspective runway deck
    ctx.fillStyle = "#261218";
    ctx.beginPath();
    ctx.moveTo(W * 0.36, 56);
    ctx.lineTo(W * 0.64, 56);
    ctx.lineTo(W * 0.86, H - 18);
    ctx.lineTo(W * 0.14, H - 18);
    ctx.closePath();
    ctx.fill();

    // Moving spotlight beams
    for (var s = 0; s < 3; s++) {
      var sx = W * (0.28 + s * 0.22);
      var sweep = Math.sin(phase * 0.9 + s * 1.7) * 90;
      var g = ctx.createLinearGradient(sx, 0, sx + sweep, H);
      g.addColorStop(0, "rgba(" + cue.beam.join(",") + ",0.32)");
      g.addColorStop(1, "rgba(" + cue.beam.join(",") + ",0.0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(sx - 12, 0);
      ctx.lineTo(sx + 12, 0);
      ctx.lineTo(sx + sweep + 110, H);
      ctx.lineTo(sx + sweep - 110, H);
      ctx.closePath();
      ctx.fill();
    }

    // Center runway glow line & walking marker
    var walkT = (phase * 0.28) % 1;
    var wy = 70 + walkT * (H - 120);
    var r = 6 + walkT * 18;
    ctx.strokeStyle = "rgba(224,180,108,0.4)";
    ctx.beginPath();
    ctx.moveTo(W * 0.5, 56);
    ctx.lineTo(W * 0.5, H - 18);
    ctx.stroke();

    ctx.fillStyle = "rgb(" + cue.beam.join(",") + ")";
    ctx.beginPath();
    ctx.arc(W * 0.5, wy, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#f7ece4";
    ctx.font = "600 13px ui-monospace, monospace";
    ctx.fillText("PERDE 0" + cue.no + " // " + cue.title.toUpperCase() + " // " + cue.bpm + " BPM", 18, 28);

    if (playing) phase += 0.025;
    requestAnimationFrame(drawRunway);
  }

  document.getElementById("cue-play").addEventListener("click", function () {
    playing = !playing;
    document.getElementById("cue-play").classList.toggle("is-on", playing);
  });
  document.getElementById("cue-next").addEventListener("click", function () {
    idx = (idx + 1) % CUES.length;
    renderCues();
  });
  ["m-omuz", "m-gogus", "m-bel", "m-boy"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", updateTailor);
  });

  renderCues();
  updateTailor();
  drawRunway();
})();
