// node bake-mini.cjs [names...] : paints the side games' art (mini-wc.js) in the shared Chrome's one tab (port 9333) and writes
// prism/anim/mini-<name>.webp plus prism/anim/mini-art.js (frames, columns, frame width and height of every sheet), and a PNG contact sheet per piece.
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, ".."), SHEETS = process.env.SHEETS || path.join(__dirname, "contact");
(async () => { fs.mkdirSync(SHEETS, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 600000 }); const page = (await b.pages())[0];
  await page.goto("about:blank"); await page.addScriptTag({ path: path.join(__dirname, "mini-wc.js") });
  const all = await page.evaluate(() => MINI_SHEETS.map(s => s[0])), names = process.argv.slice(2).length ? process.argv.slice(2) : all;
  const metaFile = path.join(OUT, "mini-art.js"); let meta = {}; if (fs.existsSync(metaFile)) { const m = /=\s*(\{.*\})/s.exec(fs.readFileSync(metaFile, "utf8")); if (m) meta = JSON.parse(m[1]); }
  for (const name of names) {
    const r = await page.evaluate((name) => { const { cv, n, cols, w, h } = paintMini(name); return { n, cols, w, h, webp: cv.toDataURL("image/webp", .9), png: cv.toDataURL("image/png") }; }, name);
    fs.writeFileSync(path.join(OUT, "mini-" + name + ".webp"), Buffer.from(r.webp.split(",")[1], "base64"));
    fs.writeFileSync(path.join(SHEETS, "mini-" + name + ".png"), Buffer.from(r.png.split(",")[1], "base64"));
    meta[name] = [r.n, r.cols, r.w, r.h]; console.log(name, r.n, "frames", Math.round(fs.statSync(path.join(OUT, "mini-" + name + ".webp")).size / 1024) + " KB");
  }
  const keep = {}; for (const k of all) if (meta[k]) keep[k] = meta[k];
  fs.writeFileSync(metaFile, "// written by anim/src/bake-mini.cjs: [frames, columns, frame width, frame height] of every side-game sheet (mini-<name>.webp)\nwindow.MINI_ART = " + JSON.stringify(keep) + ";\n");
  await page.goto("about:blank"); b.disconnect(); })();
