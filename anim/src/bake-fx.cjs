// node bake-fx.cjs [names...] : renders the board effects of fx-anim.js to prism/anim/fx-<name>.webp (ink and fixed colours), fx-<name>-c.webp
// (the mask the game tints with a charm's colour), fx.json ([frames, columns, width, height]) and a contact sheet per effect (tinted blue, on the board's dark)
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, ".."), SHEETS = process.env.SHEETS || path.join(__dirname, "contact");
(async () => { fs.mkdirSync(SHEETS, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 300000 }); const page = (await b.pages())[0];
  await page.goto("about:blank"); await page.addScriptTag({ path: path.join(__dirname, "fx-anim.js") });
  const names = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => Object.keys(FX_LIST)), meta = {};
  for (const name of names) {
    const r = await page.evaluate((name) => { const fr = bakeFx(name), { n, w, h } = FX_LIST[name], cols = Math.min(n, Math.floor(16000 / w)), rows = Math.ceil(n / cols);
      const sheet = (k) => { const s = document.createElement("canvas"); s.width = w * cols; s.height = h * rows; const x = s.getContext("2d"); fr.forEach((p, i) => x.drawImage(p[k], (i % cols) * w, Math.floor(i / cols) * h)); return s.toDataURL("image/webp", .9); };
      const per = 8, cw = Math.min(200, w), ch = Math.round(cw * h / w), k = document.createElement("canvas"); k.width = cw * per; k.height = ch * Math.ceil(n / per); const y = k.getContext("2d"); y.fillStyle = "#2a2346"; y.fillRect(0, 0, k.width, k.height);
      const t = document.createElement("canvas"); t.width = w; t.height = h; const tx = t.getContext("2d");
      fr.forEach((p, i) => { tx.globalCompositeOperation = "source-over"; tx.clearRect(0, 0, w, h); tx.drawImage(p[1], 0, 0); tx.globalCompositeOperation = "source-in"; tx.fillStyle = "#4ab0ff"; tx.fillRect(0, 0, w, h);
        const X = (i % per) * cw, Y = Math.floor(i / per) * ch; y.drawImage(t, X, Y, cw, ch); y.drawImage(p[0], X, Y, cw, ch); y.fillStyle = "#fff"; y.font = "12px sans-serif"; y.fillText(String(i), X + 3, Y + 12); });
      return { n, cols, w, h, a: sheet(0), c: sheet(1), contact: k.toDataURL("image/png") }; }, name);
    fs.writeFileSync(path.join(OUT, "fx-" + name + ".webp"), Buffer.from(r.a.split(",")[1], "base64"));
    fs.writeFileSync(path.join(OUT, "fx-" + name + "-c.webp"), Buffer.from(r.c.split(",")[1], "base64"));
    fs.writeFileSync(path.join(SHEETS, "fx-" + name + ".png"), Buffer.from(r.contact.split(",")[1], "base64"));
    meta[name] = [r.n, r.cols, r.w, r.h]; console.log(name, r.n, "frames");
  }
  if (process.argv.length <= 2) { fs.writeFileSync(path.join(OUT, "fx.json"), JSON.stringify(meta)); console.log("FXS =", JSON.stringify(meta)); }
  await page.goto("about:blank"); b.disconnect(); })();
