// node bake-board.cjs : paints the board's paper, cell washes and obstacles (board-wc.js) to prism/anim/ and a contact sheet
const pp = require("/Users/aatiii/.npm/_npx/0f94ee7615faf582/node_modules/puppeteer-core"), fs = require("fs"), path = require("path");
const OUT = path.join(__dirname, ".."), SHEETS = process.env.SHEETS || path.join(__dirname, "contact");
(async () => { fs.mkdirSync(SHEETS, { recursive: true });
  const b = await pp.connect({ browserURL: "http://127.0.0.1:9333", defaultViewport: null, protocolTimeout: 600000 }); const page = (await b.pages())[0];
  await page.setViewport({ width: 900, height: 400, deviceScaleFactor: 1 });
  await page.goto("http://127.0.0.1:8771/prism/index.html?bake&t=" + Date.now(), { waitUntil: "load" }); await new Promise(r => setTimeout(r, 2500));
  await page.addScriptTag({ path: path.join(__dirname, "charm-wc.js") }); await page.addScriptTag({ path: path.join(__dirname, "board-wc.js") });
  const r = await page.evaluate(() => { const out = {}, names = Object.keys(BOARD_WC), cs = 160, k = document.createElement("canvas"); k.width = cs * names.length; k.height = cs; const y = k.getContext("2d");
    const paper = BOARD_WC.paper(); y.fillStyle = y.createPattern(paper, "repeat"); y.fillRect(0, 0, k.width, k.height);
    names.forEach((n, i) => { const cv = n === "paper" ? paper : BOARD_WC[n](); out[n] = cv.toDataURL("image/webp", n === "paper" ? .95 : .9); y.drawImage(cv, i * cs + 8, 8, cs - 16, cs - 16); y.fillStyle = "#333"; y.font = "12px sans-serif"; y.fillText(n, i * cs + 8, cs - 2); });
    return { out, contact: k.toDataURL("image/png") }; });
  for (const [n, u] of Object.entries(r.out)) fs.writeFileSync(path.join(OUT, (n === "paper" || n === "ground" || /^cell/.test(n) ? "" : "ob-") + n + ".webp"), Buffer.from(u.split(",")[1], "base64"));
  fs.writeFileSync(path.join(SHEETS, "board.png"), Buffer.from(r.contact.split(",")[1], "base64")); console.log(Object.keys(r.out).join(" "));
  await page.goto("about:blank"); b.disconnect(); })();
