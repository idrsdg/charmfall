// node bake.cjs [names...]  : renders Pogo's keyed animations to prism/anim/pogo-<name>.webp (a grid of frames, 16 to a row), pogo.json (frames, columns, fps, loop) and a contact sheet per animation
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, ".."), SHEETS = process.env.SHEETS || path.join(__dirname, "contact");
(async () => { fs.mkdirSync(SHEETS, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 1800000 }); const page = await b.newPage();   // its own tab in the shared Chrome, closed at the end
  await page.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 });
  await page.goto((process.env.BAKE_BASE || "http://127.0.0.1:8771") + "/prism/index.html?bake&t=" + Date.now(), { waitUntil: "domcontentloaded", timeout: 120000 }); await new Promise(r => setTimeout(r, 6000));
  await page.addScriptTag({ path: path.join(__dirname, "..", "pogo-anim.js") });
  const names = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => Object.keys(POGO_ANIMS));
  const meta = {};
  for (const name of names) {
    const r = await page.evaluate((name) => { const fr = bakePogo(name), [W, H] = POGO_FRAME, cols = Math.min(fr.length, 16), rows = Math.ceil(fr.length / cols), s = document.createElement("canvas"); s.width = W * cols; s.height = H * rows; const x = s.getContext("2d"); fr.forEach((c, i) => x.drawImage(c, (i % cols) * W, Math.floor(i / cols) * H));
      const per = 8, cw = 150, ch = 165, krows = Math.ceil(fr.length / per), k = document.createElement("canvas"); k.width = cw * per; k.height = ch * krows; const y = k.getContext("2d"); y.fillStyle = "#cfe9c8"; y.fillRect(0, 0, k.width, k.height);
      fr.forEach((c, i) => { y.drawImage(c, (i % per) * cw, Math.floor(i / per) * ch, cw, ch); y.fillStyle = "#000"; y.font = "14px sans-serif"; y.fillText(String(i), (i % per) * cw + 4, Math.floor(i / per) * ch + 16); });
      return { n: fr.length, cols, fps: POGO_ANIMS[name].fps, loop: POGO_ANIMS[name].loop, sheet: s.toDataURL("image/webp", .86), contact: k.toDataURL("image/png") }; }, name);
    fs.writeFileSync(path.join(OUT, "pogo-" + name + ".webp"), Buffer.from(r.sheet.split(",")[1], "base64"));
    fs.writeFileSync(path.join(SHEETS, name + ".png"), Buffer.from(r.contact.split(",")[1], "base64"));
    meta[name] = [r.n, r.cols, r.fps, r.loop ? 1 : 0]; console.log(name, r.n, "frames", Math.round(fs.statSync(path.join(OUT, "pogo-" + name + ".webp")).size / 1024) + " KB");
  }
  if (process.argv.length <= 2) { fs.writeFileSync(path.join(OUT, "pogo.json"), JSON.stringify(meta)); console.log("PA =", JSON.stringify(meta)); }
  await page.close(); b.disconnect(); })();
