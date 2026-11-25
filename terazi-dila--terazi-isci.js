// OffscreenCanvas iscisi: 50.000 hucreli atlas ana is parcacigini bloklamadan cizilir.
import { ciz } from "./terazi-dila--terazi-atlas.js";

let tuval = null, ctx = null, kucuk = null, vurgu = 0, hareket = true, dongu = 0;

function kare(t) {
  kucuk = ciz(ctx, tuval.width, tuval.height, vurgu, hareket ? t : 0, kucuk);
  if (hareket) dongu = requestAnimationFrame(kare);
}

self.onmessage = e => {
  const m = e.data;
  if (m.tip === "baslat") { tuval = m.tuval; ctx = tuval.getContext("2d"); hareket = m.hareket; }
  if (m.tip === "vurgu") vurgu = m.id | 0;
  if (m.tip === "hareket") hareket = !!m.acik;
  if (m.tip === "boyut") { tuval.width = m.w; tuval.height = m.h; }
  if (!ctx) return;
  cancelAnimationFrame(dongu);
  if (hareket && typeof requestAnimationFrame === "function") dongu = requestAnimationFrame(kare);
  else kare(0);
};
