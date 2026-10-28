// node bake-bg.cjs : paints the forty board backdrops (bg-wc.js) to prism/anim/bg-<k>-<v>.webp and a contact sheet
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, ".."), SHEETS = process.env.SHEETS || path.join(__dirname, "contact");
(async () => { fs.mkdirSync(SHEETS, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 900000 }); const page = (await b.pages())[0];
  await page.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:8771/prism/index.html?bake&t=" + Date.now(), { waitUntil: "load" }); await new Promise(r => setTimeout(r, 2500));
  await page.addScriptTag({ path: path.join(__dirname, "charm-wc.js") }); await page.addScriptTag({ path: path.join(__dirname, "bg-wc.js") });
  const n = await page.evaluate(() => THEMES.length), cw = 120, ch = 260, k2 = [];
  for (let k = 0; k < n; k++) for (const v of [0, 1]) { const r = await page.evaluate((k, v) => { const cv = paintBackdrop(k, v); const t = document.createElement("canvas"); t.width = 120; t.height = 260; t.getContext("2d").drawImage(cv, 0, 0, 120, 260); return { full: cv.toDataURL("image/webp", .86), thumb: t.toDataURL() }; }, k, v);
    fs.writeFileSync(path.join(OUT, `bg-${k}-${v}.webp`), Buffer.from(r.full.split(",")[1], "base64")); k2.push(r.thumb); process.stdout.write(`bg-${k}-${v} `); }
  const sheet = await page.evaluate((thumbs, cw, ch) => new Promise(res => { const per = 10, k = document.createElement("canvas"); k.width = cw * per; k.height = ch * Math.ceil(thumbs.length / per); const y = k.getContext("2d"); let left = thumbs.length; thumbs.forEach((u, i) => { const im = new Image(); im.onload = () => { y.drawImage(im, (i % per) * cw, Math.floor(i / per) * ch); if (!--left) res(k.toDataURL()); }; im.src = u; }); }), k2, cw, ch);
  fs.writeFileSync(path.join(SHEETS, "backdrops.png"), Buffer.from(sheet.split(",")[1], "base64")); console.log("\ndone");
  await page.goto("about:blank"); b.disconnect(); })();
