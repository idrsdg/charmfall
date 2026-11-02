// node bake-cr.cjs [kinds...] : renders the map creatures' motion loops (the rigs in index.html, 60 fps) to prism/anim/cr-<kind>.webp,
// a grid of 176 px frames, 16 to a row, and cr.json ([frames, columns]). The map plays these files instead of making the strips on the phone.
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, ".."), SHEETS = process.env.SHEETS || path.join(__dirname, "contact");
const LIVE = ["rabbit", "fox", "hedgehog", "deer", "sheep", "bear", "penguin", "butterfly", "bee", "bat", "crab", "eagle", "magpie", "gritt", "corvin", "flock"];
(async () => { fs.mkdirSync(SHEETS, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 1800000 }); const page = await b.newPage();   // its own tab in the shared Chrome, closed at the end
  await page.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 });
  await page.goto((process.env.BAKE_BASE || "http://127.0.0.1:8771") + "/prism/index.html?bake&nocache=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 120000 }); await new Promise(r => setTimeout(r, 6000));
  const kinds = process.argv.slice(2).length ? process.argv.slice(2) : LIVE, meta = fs.existsSync(path.join(OUT, "cr.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "cr.json"))) : {};
  for (const k of kinds) {
    const r = await page.evaluate((k) => new Promise((res) => { window.__fast = 1; D3.strip(k, 176, (url) => { window.__fast = 0; if (!url) return res(null); const im = new Image(); im.onload = () => { const c = document.createElement("canvas"); c.width = im.width; c.height = im.height; c.getContext("2d").drawImage(im, 0, 0);
      const n = Math.round(im.width / im.height), per = 12, cw = 120, k2 = document.createElement("canvas"); k2.width = cw * per; k2.height = cw * Math.ceil(n / per); const y = k2.getContext("2d"); y.fillStyle = "#cfe9c8"; y.fillRect(0, 0, k2.width, k2.height);
      for (let i = 0; i < n; i++) { y.drawImage(im, i * im.height, 0, im.height, im.height, (i % per) * cw, Math.floor(i / per) * cw, cw, cw); y.fillStyle = "#000"; y.font = "11px sans-serif"; y.fillText(String(i), (i % per) * cw + 3, Math.floor(i / per) * cw + 11); }
      const cols = 16, rows = Math.ceil(n / cols), F = im.height, g = document.createElement("canvas"); g.width = F * cols; g.height = F * rows; const gx = g.getContext("2d"); for (let i = 0; i < n; i++) gx.drawImage(im, i * F, 0, F, F, (i % cols) * F, Math.floor(i / cols) * F, F, F);
      res({ n, cols, strip: g.toDataURL("image/webp", .86), contact: k2.toDataURL("image/png") }); }; im.src = url; }); }), k);
    if (!r) { console.log(k, "no rig"); continue; }
    fs.writeFileSync(path.join(OUT, "cr-" + k + ".webp"), Buffer.from(r.strip.split(",")[1], "base64"));
    fs.writeFileSync(path.join(SHEETS, "cr-" + k + ".png"), Buffer.from(r.contact.split(",")[1], "base64"));
    meta[k] = [r.n, r.cols]; console.log(k, r.n, "frames", Math.round(fs.statSync(path.join(OUT, "cr-" + k + ".webp")).size / 1024) + " KB");
  }
  fs.writeFileSync(path.join(OUT, "cr.json"), JSON.stringify(meta)); console.log("CR =", JSON.stringify(meta));
  await page.close(); b.disconnect(); })();
