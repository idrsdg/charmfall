// node bake-charms.cjs : paints every charm in watercolour (charm-wc.js) to prism/anim/ch-<name>.webp (256 px) and a contact sheet
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, ".."), SHEETS = process.env.SHEETS || path.join(__dirname, "contact");
(async () => { fs.mkdirSync(SHEETS, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 600000 }); const page = (await b.pages())[0];
  await page.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:8771/prism/index.html?bake&t=" + Date.now(), { waitUntil: "load" }); await new Promise(r => setTimeout(r, 2500));
  await page.addScriptTag({ path: path.join(__dirname, "charm-wc.js") });
  const r = await page.evaluate(() => { const L = CHARM_LIST(), out = {}, per = 8, cs = 128, k = document.createElement("canvas"); k.width = cs * per; k.height = cs * Math.ceil(L.length / per); const y = k.getContext("2d"); y.fillStyle = "#f3ead8"; y.fillRect(0, 0, k.width, k.height);
    L.forEach(([name, slot], i) => { const cv = paintCharmWC(name, slot, 256); out[name] = cv.toDataURL("image/webp", .92); y.strokeStyle = "rgba(120,100,80,.25)"; y.strokeRect((i % per) * cs + .5, Math.floor(i / per) * cs + .5, cs - 1, cs - 1); y.drawImage(cv, (i % per) * cs + 4, Math.floor(i / per) * cs + 4, cs - 8, cs - 8); });
    return { out, contact: k.toDataURL("image/png") }; });
  for (const [n, u] of Object.entries(r.out)) fs.writeFileSync(path.join(OUT, "ch-" + n + ".webp"), Buffer.from(u.split(",")[1], "base64"));
  fs.writeFileSync(path.join(SHEETS, "charms.png"), Buffer.from(r.contact.split(",")[1], "base64")); console.log(Object.keys(r.out).length, "charms");
  await page.goto("about:blank"); b.disconnect(); })();
