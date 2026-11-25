// 50.000 kapi atlasi cizimi: ana is parcacigi ve OffscreenCanvas iscisi ayni kodu kullanir.
export const SUTUN = 250, SATIR = 200, TOPLAM = 50000, BLOK = 6250;
export const ROL_RENK = ["#ff6f61", "#0f4c81", "#f5df4d", "#6667ab", "#bb2649", "#88b04b", "#ffbe98", "#939597"];

export const rolu = id => Math.floor((id - 1) / BLOK);
export const konum = id => ({ x: (id - 1) % SUTUN, y: Math.floor((id - 1) / SUTUN) });
export const idAt = (x, y) => (x < 0 || y < 0 || x >= SUTUN || y >= SATIR) ? 0 : y * SUTUN + x + 1;

const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const RGB = ROL_RENK.map(rgb);

// Tum hucreleri tek ImageData'ya yaz (50.000 fillRect yerine), sonra olcekle.
let taban = null;
function tabanUret(ctx) {
  const img = ctx.createImageData(SUTUN, SATIR), d = img.data;
  for (let id = 1; id <= TOPLAM; id++) {
    const [r, g, b] = RGB[rolu(id)];
    let h = Math.imul(id ^ 0x9e3779b9, 0x85ebca6b); h ^= h >>> 13;
    const k = 0.55 + ((h >>> 0) % 1000) / 2500;  // 0.55 - 0.95 parlaklik: dokulu yuzey
    const i = (id - 1) * 4;
    d[i] = r * k; d[i + 1] = g * k; d[i + 2] = b * k; d[i + 3] = 255;
  }
  return img;
}

export function ciz(ctx, W, H, vurgu = 0, t = 0, Kucuk = null) {
  if (!taban) taban = tabanUret(ctx);
  if (!Kucuk) {
    Kucuk = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(SUTUN, SATIR) : Object.assign(document.createElement("canvas"), { width: SUTUN, height: SATIR });
    Kucuk.getContext("2d").putImageData(taban, 0, 0);
  }
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(Kucuk, 0, 0, W, H);
  const cw = W / SUTUN, ch = H / SATIR;
  // tarama isigi: rol bloklari boyunca yavasca kayan parlama (t ms)
  if (t) {
    const y = ((t / 40) % (H + 120)) - 60;
    const g = ctx.createLinearGradient(0, y - 60, 0, y + 60);
    g.addColorStop(0, "#ffffff00"); g.addColorStop(.5, "#ffffff22"); g.addColorStop(1, "#ffffff00");
    ctx.fillStyle = g; ctx.fillRect(0, y - 60, W, 120);
  }
  // rol sinirlari
  ctx.fillStyle = "#050a13";
  for (let r = 1; r < 8; r++) ctx.fillRect(0, Math.round(r * (BLOK / SUTUN) * ch) - 1, W, 2);
  if (vurgu >= 1 && vurgu <= TOPLAM) {
    const { x, y } = konum(vurgu);
    // once koyu kalin kontur, sonra acik ince cizgi: her rol renginde >= 3:1 ayrisir
    const kutu = (k, renk, en) => { ctx.lineWidth = en; ctx.strokeStyle = renk; ctx.strokeRect(x * cw - cw * k, y * ch - ch * k, cw * (2 * k + 1), ch * (2 * k + 1)); };
    const ince = Math.max(2, cw * .6);
    kutu(1, "#050a13", ince * 2.6); kutu(1, "#ffffff", ince);
    kutu(3, "#050a13", ince * 2.6); kutu(3, "#7fffd4", ince);
  }
  return Kucuk;
}
