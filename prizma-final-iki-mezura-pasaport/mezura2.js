(function () {
  "use strict";

  function update() {
    var omuz = Number(document.getElementById("a-omuz").value);
    var gogus = Number(document.getElementById("a-gogus").value);
    var bel = Number(document.getElementById("a-bel").value);
    var har = Number(document.getElementById("b-hareket").value) / 10;
    var kol = Number(document.getElementById("b-kol").value);
    var kumas = document.getElementById("b-kumas").value;

    document.getElementById("va-omuz").textContent = omuz + " cm";
    document.getElementById("va-gogus").textContent = gogus + " cm";
    document.getElementById("va-bel").textContent = bel + " cm";
    document.getElementById("vb-hareket").textContent = "+" + har.toFixed(1) + " cm";
    document.getElementById("vb-kol").textContent = kol + " cm";

    var sh = 46 + (omuz - 36) * 2.2 + har * 1.4;
    var w = 36 + (bel - 60) * 1.15 + har * 1.6;
    var hem = 48 + (gogus - 78) * 1.2 + har * 1.8;

    document.getElementById("svg-front").setAttribute("points", [
      (155 - sh).toFixed(1) + ",46", (155 + sh).toFixed(1) + ",46",
      (155 + w).toFixed(1) + ",132", (155 + hem).toFixed(1) + ",218",
      (155 - hem).toFixed(1) + ",218", (155 - w).toFixed(1) + ",132"
    ].join(" "));
    document.getElementById("svg-back").setAttribute("points", [
      (455 - sh * 0.96).toFixed(1) + ",46", (455 + sh * 0.96).toFixed(1) + ",46",
      (455 + w * 0.92).toFixed(1) + ",132", (455 + hem * 0.95).toFixed(1) + ",218",
      (455 - hem * 0.95).toFixed(1) + ",218", (455 - w * 0.92).toFixed(1) + ",132"
    ].join(" "));
    document.getElementById("svg-sleeve").setAttribute("height", String(Math.round(115 + (kol - 54) * 3.8)));

    var metraj = (1.65 + (gogus - 78) * 0.008 + (kol - 54) * 0.014 + har * 0.04).toFixed(2);
    document.getElementById("svg-meta").textContent = "Tahmini Metraj: " + metraj + " m · Drop: " + (gogus - bel) + " cm · Hareket Payı: +" + har.toFixed(1) + " cm";

    var rec = JSON.stringify({ tip: "IKI_MEZURA_TASLAK", omuz: omuz, gogus: gogus, bel: bel, hareket_cm: har, kol: kol, metraj_m: Number(metraj), kumas: kumas });
    var out = document.getElementById("seal-out");
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(rec)).then(function (buf) {
        var b = new Uint8Array(buf), h = "";
        for (var i = 0; i < b.length; i++) h += b[i].toString(16).padStart(2, "0");
        out.textContent = "SHA-256 : " + h + "\nMETRAJ  : " + metraj + " m\nKUMAŞ   : " + kumas + "\nKAYIT   : " + rec;
      });
    } else { out.textContent = "KAYIT: " + rec; }
  }

  ["a-omuz", "a-gogus", "a-bel", "b-hareket", "b-kol", "b-kumas"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", update);
  });
  update();
})();
