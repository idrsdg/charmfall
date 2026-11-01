// node bake-dio.cjs : paints the pop-up layers of the game screen (dio-wc.js) to prism/anim/dio-<family>-<far|mid|near>.webp and a contact sheet
// (its own tab in the shared Chrome on CDP 9333, closed after; BASE= the static server, default http://127.0.0.1:8771; OUT= another folder for trials)
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = process.env.OUT || path.join(__dirname, ".."), SHEETS = process.env.SHEETS || path.join(__dirname, "contact"), BASE = process.env.BASE || "http://127.0.0.1:8771";
(async () => { fs.mkdirSync(SHEETS, { recursive: true }); fs.mkdirSync(OUT, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 600000 }); const page = await b.newPage();
  try {
    await page.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 });
    await page.goto(BASE + "/prism/index.html?bake&t=" + Date.now(), { waitUntil: "load" }); await new Promise(r => setTimeout(r, 2500));
    await page.addScriptTag({ path: path.join(__dirname, "charm-wc.js") }); await page.addScriptTag({ path: path.join(__dirname, "dio-wc.js") });
    const r = await page.evaluate(() => { const L = DIO_LIST(), out = {}, k = document.createElement("canvas"), cw = 320; k.width = cw * 3; k.height = 140 * (L.length / 3); const y = k.getContext("2d"); y.fillStyle = "#dfe8f0"; y.fillRect(0, 0, k.width, k.height);
      L.forEach(([f, l], i) => { const cv = paintDio(f, l); out[f + "-" + l] = cv.toDataURL("image/webp", .86); const h = cw * cv.height / cv.width; y.drawImage(cv, (i % 3) * cw, Math.floor(i / 3) * 140 + 140 - h, cw, h); y.fillStyle = "#333"; y.font = "12px sans-serif"; y.fillText(f + " " + l, (i % 3) * cw + 4, Math.floor(i / 3) * 140 + 14); });
      return { out, contact: k.toDataURL("image/png") }; });
    for (const [n, u] of Object.entries(r.out)) fs.writeFileSync(path.join(OUT, "dio-" + n + ".webp"), Buffer.from(u.split(",")[1], "base64"));
    fs.writeFileSync(path.join(SHEETS, "dio.png"), Buffer.from(r.contact.split(",")[1], "base64")); console.log(Object.keys(r.out).length, "layers");
  } finally { await page.close(); b.disconnect(); } })();
