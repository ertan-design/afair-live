(function () {
  "use strict";

  var REELS = [
    { id: "hf1", title: "01 · Galeride İpek (Higgsfield Seedance 2.5)", file: "HF_01_GALERIDE_IPEK_FASTSTART.mp4", poster: "HF_01_GALERIDE_IPEK_FASTSTART.jpg", meta: "1.16 MB · +faststart · moov@36" },
    { id: "hf2", title: "02 · Terzinin Dokunuşu (Higgsfield Seedance 2.5)", file: "HF_02_TERZININ_DOKUNUSU_FASTSTART.mp4", poster: "HF_02_TERZININ_DOKUNUSU_FASTSTART.jpg", meta: "1.17 MB · +faststart · moov@36" },
    { id: "d1", title: "03 · İki Mezura Evde Terzi (RTX 3090 NVENC)", file: "DILA_01_IKI_MEZURA_TERZI.mp4", poster: "DILA_01_IKI_MEZURA_TERZI.jpg", meta: "1.51 MB · 720p 30fps · H.264+AAC" },
    { id: "d2", title: "04 · AFAIR Studio AI Galeri (RTX 3090 NVENC)", file: "DILA_02_AFAIR_STUDIO_AI_GALERI.mp4", poster: "DILA_02_AFAIR_STUDIO_AI_GALERI.jpg", meta: "1.63 MB · 720p 30fps · H.264+AAC" },
    { id: "d3", title: "05 · Yeni Siyah & Akustik (RTX 3090 NVENC)", file: "DILA_03_YENI_SIYAH_AKUSTIK.mp4", poster: "DILA_03_YENI_SIYAH_AKUSTIK.jpg", meta: "1.43 MB · 720p 30fps · H.264+AAC" },
    { id: "d4", title: "06 · Marka Filmi Master Reel (RTX 3090 NVENC)", file: "DILA_04_MARKA_FILMI_MASTER_REEL.mp4", poster: "DILA_04_MARKA_FILMI_MASTER_REEL.jpg", meta: "4.01 MB · 720p 30fps · Master" }
  ];

  var idx = 0;
  var speeds = [1.0, 1.25, 0.75];
  var spIdx = 0;
  var video = document.getElementById("stage-video");
  var metaEl = document.getElementById("pmeta");

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function selectReel(i, autoplay) {
    idx = i;
    var r = REELS[idx];
    video.poster = "./video/" + r.poster;
    metaEl.textContent = r.title + " · " + r.meta;
    renderList();
    if (autoplay) {
      video.src = "./video/" + r.file;
      video.playbackRate = speeds[spIdx];
      video.play().catch(function () {});
    }
  }

  function renderList() {
    var list = document.getElementById("reel-list");
    clear(list);
    REELS.forEach(function (r, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "rbtn" + (i === idx ? " is-on" : "");
      var st = document.createElement("strong");
      st.textContent = r.title;
      var sp = document.createElement("span");
      sp.textContent = r.meta;
      b.appendChild(st);
      b.appendChild(sp);
      b.addEventListener("click", function () { selectReel(i, true); });
      list.appendChild(b);
    });
  }

  document.getElementById("btn-load-play").addEventListener("click", function () {
    selectReel(idx, true);
  });
  document.getElementById("btn-speed").addEventListener("click", function () {
    spIdx = (spIdx + 1) % speeds.length;
    video.playbackRate = speeds[spIdx];
    document.getElementById("btn-speed").textContent = "Hız: " + speeds[spIdx].toFixed(2).replace(/0$/, "") + "x";
  });

  selectReel(0, false);
})();
