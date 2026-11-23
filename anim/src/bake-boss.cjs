// node bake-boss.cjs [k...] : renders the ten kingdom bosses (boss-wc.js) to prism/anim/cr-boss<k>.webp, a grid of 176 px frames, 16 to a row, 96 frames
// (1.6 s at the player's 60 fps), the same layout as the creature sheets, drawn on twos: 48 drawings, each held for two frames.
// PREVIEW=1 writes only the contact sheets (to SHEETS, needed for any contact output) and leaves the game's files alone.
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, ".."), SHEETS = process.env.SHEETS, PREVIEW = !!process.env.PREVIEW, N = 96, COLS = 16, F = 176, Q = +(process.env.Q || .8);
(async () => { if (SHEETS) fs.mkdirSync(SHEETS, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 1800000 }), page = await b.newPage();   // one tab of its own, closed at the end
  try { await page.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 }); await page.goto((process.env.BAKE_BASE || "http://127.0.0.1:8771") + "/prism/anim/cr.json", { waitUntil: "domcontentloaded" });
    await page.addScriptTag({ content: fs.readFileSync(path.join(__dirname, "boss-wc.js"), "utf8") });
    const ks = process.argv.slice(2).length ? process.argv.slice(2).map(Number) : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], shots = {};
    for (const k of ks) {
      const r = await page.evaluate((k, N, COLS, F, Q, PREVIEW) => { const g = document.createElement("canvas"); g.width = F * COLS; g.height = F * Math.ceil(N / COLS); const y = g.getContext("2d"); let first = null, last = null, prev = null, maxStep = 0; const keep = [];
        const lum = (cv) => { const d = cv.getContext("2d").getImageData(0, 0, F, F).data, o = new Int16Array(F * F); for (let i = 0; i < o.length; i++) o[i] = d[i * 4 + 3] > 40 ? (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3 : -80; return o; }, diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
        for (let i = 0; i < N / 2; i++) { const f = paintBoss(k, i / (N / 2), F), l = lum(f); if (!i) first = l; if (prev) maxStep = Math.max(maxStep, diff(prev, l)); prev = l; last = l; if (i % 4 === 0) keep.push(f); for (const j of [i * 2, i * 2 + 1]) y.drawImage(f, (j % COLS) * F, Math.floor(j / COLS) * F); }
        const seam = diff(last, first), per = 6, cw = 150, m = document.createElement("canvas"); m.width = cw * per; m.height = cw * Math.ceil(keep.length / per); const c = m.getContext("2d"); c.fillStyle = "#8fc7a2"; c.fillRect(0, 0, m.width, m.height); keep.forEach((f, i) => c.drawImage(f, (i % per) * cw, Math.floor(i / per) * cw, cw, cw));
        return { strip: PREVIEW ? null : g.toDataURL("image/webp", Q), contact: m.toDataURL("image/png"), hero: keep[0].toDataURL("image/png"), seam: +seam.toFixed(2), maxStep: +maxStep.toFixed(2) }; }, k, N, COLS, F, Q, PREVIEW);
      let kb = "preview"; if (!PREVIEW) { const f = path.join(OUT, `cr-boss${k}.webp`); fs.writeFileSync(f, Buffer.from(r.strip.split(",")[1], "base64")); kb = Math.round(fs.statSync(f).size / 1024) + " KB"; }
      if (SHEETS) fs.writeFileSync(path.join(SHEETS, `boss${k}.png`), Buffer.from(r.contact.split(",")[1], "base64")); shots[k] = r.hero; console.log(`boss${k}`, N, "frames", kb, "seam", r.seam, "largest step", r.maxStep);
    }
    if (SHEETS) { const o = await page.evaluate(async (shots) => { const load = (u) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = u; }), ks = Object.keys(shots), bgs = ["#79b86c", "#4f9fd8", "#a9472f", "#a6d8ee", "#8fb9e8", "#e2bd78", "#5b4a9c", "#25234f", "#42507c", "#2d2a63"];
        const big = document.createElement("canvas"), C = 220; big.width = C * 5; big.height = C * Math.ceil(ks.length / 5); const a = big.getContext("2d"), real = document.createElement("canvas"), S = 112; real.width = S * 5 * 2; real.height = S * Math.ceil(ks.length / 5) * 2; const q = real.getContext("2d"); q.imageSmoothingQuality = "high";
        for (let n = 0; n < ks.length; n++) { const im = await load(shots[ks[n]]), X = n % 5, Y = Math.floor(n / 5); a.fillStyle = bgs[ks[n]]; a.fillRect(X * C, Y * C, C, C); a.drawImage(im, X * C + 22, Y * C + 22, 176, 176); q.fillStyle = bgs[ks[n]]; q.fillRect(X * S * 2, Y * S * 2, S * 2, S * 2); q.drawImage(im, X * S * 2 + 22, Y * S * 2 + 22, 180, 180); }
        return [big.toDataURL("image/png"), real.toDataURL("image/png")]; }, shots);
      fs.writeFileSync(path.join(SHEETS, "all.png"), Buffer.from(o[0].split(",")[1], "base64")); fs.writeFileSync(path.join(SHEETS, "real90.png"), Buffer.from(o[1].split(",")[1], "base64")); }
  } finally { await page.close(); b.disconnect(); } })().catch((e) => { console.error(e); process.exit(1); });
