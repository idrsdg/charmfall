// The board in watercolour (2026-10-28, İdris: "Suluboya masal kitabı... ne var ne yok"): the sheet of paper the board is painted on,
// two soft cell washes, and every obstacle painted the same way as the charms (needs charm-wc.js for window.WC).
// bake-board.cjs writes anim/paper.webp, anim/cell-0.webp, anim/cell-1.webp and anim/ob-<name>.webp.
(() => {
  const { wash, pencil, granulate, hexA, R, NOISE } = WC;
  const S = 256;   // obstacles are painted in a 100 x 100 space on a 256 px tile
  const tile = () => { const cv = document.createElement("canvas"); cv.width = cv.height = S; const x = cv.getContext("2d"); x.scale(S / 100, S / 100); x.lineJoin = x.lineCap = "round"; return [cv, x]; };
  const rr = (x0, y0, w, h, r) => { const p = new Path2D(); p.roundRect(x0, y0, w, h, r); return p; };
  // a wobbly closed shape round (cx, cy): the edge of a hand-cut or hand-painted patch
  const blob = (cx, cy, rx, ry, seed, wob = .12, n = 28) => { const r = R(seed), p = new Path2D(), ph = r() * 6; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, k = 1 + Math.sin(a * 3 + ph) * wob * .5 + (r() - .5) * wob; const X = cx + Math.cos(a) * rx * k, Y = cy + Math.sin(a) * ry * k; i ? p.lineTo(X, Y) : p.moveTo(X, Y); } p.closePath(); return p; };
  const B = {};
  // ---- the paper: warm cold-press sheet with soft blooms of tone and a few fibres; drawn wrapped so it tiles
  B.paper = () => { const N = 512, cv = document.createElement("canvas"); cv.width = cv.height = N; const x = cv.getContext("2d"); x.fillStyle = "#f5eddc"; x.fillRect(0, 0, N, N); const r = R(3);
    const wrap = (f) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { x.save(); x.translate(dx, dy); f(); x.restore(); } };
    for (let i = 0; i < 40; i++) { const cx = r() * N, cy = r() * N, rad = 30 + r() * 90, col = r() < .5 ? "rgba(214,196,160," : "rgba(250,246,236,", a = .05 + r() * .07; wrap(() => { const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad); g.addColorStop(0, col + a + ")"); g.addColorStop(1, col + "0)"); x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2); }); }
    for (let i = 0; i < 90; i++) { const cx = r() * N, cy = r() * N, a = r() * 6.28, l = 6 + r() * 22; wrap(() => { x.strokeStyle = `rgba(150,128,96,${.08 + r() * .08})`; x.lineWidth = .6; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + Math.cos(a + .5) * l / 2, cy + Math.sin(a + .5) * l / 2, cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke(); }); }
    const id = x.getImageData(0, 0, N, N), d = id.data; for (let y = 0; y < N; y++) for (let xx = 0; xx < N; xx++) { const i = (y * N + xx) * 4, n = (NOISE(xx * .5, y * .5) - .5) * 16 + (NOISE(xx * 2.3, y * 2.3) - .5) * 9; d[i] += n; d[i + 1] += n; d[i + 2] += n - 1; } x.putImageData(id, 0, 0);
    // the noise does not wrap: blend the edges into each other so the tile has no seam
    const t = document.createElement("canvas"); t.width = t.height = N; const tx = t.getContext("2d"); tx.drawImage(cv, 0, 0); const band = 48;
    for (let i = 0; i < band; i++) { const a = 1 - i / band; x.globalAlpha = a * .5; x.drawImage(t, N - 1 - i, 0, 1, N, i, 0, 1, N); x.drawImage(t, 0, N - 1 - i, N, 1, 0, i, N, 1); } x.globalAlpha = 1; return cv; };
  // ---- cell washes: two very pale, slightly different washes laid on the paper, so the grid reads without a hard checker
  B["cell-0"] = () => { const [cv, x] = tile(); wash(x, blob(50, 50, 47, 47, 11, .05), "#c9b896", 21, { a: .07, layers: 4, rw: 2, rim: .22, j: 1.4 }); granulate(cv, 1.5); return cv; };
  B["cell-1"] = () => { const [cv, x] = tile(); wash(x, blob(50, 50, 47, 47, 12, .05), "#a9b8c4", 22, { a: .075, layers: 4, rw: 2, rim: .22, j: 1.4 }); granulate(cv, 1.5); return cv; };
  // ---- ash: a granulating grey wash (ash pigments settle hard), a scribbled pencil edge; two layers is darker, heaped, with ember dots
  for (const n of [1, 2]) B["ash" + n] = () => { const [cv, x] = tile(); const col = n === 2 ? "#5c5668" : "#8e8899";
    wash(x, blob(50, 52, 45, 44, 30 + n, .1), col, 31 + n, { a: n === 2 ? .3 : .24, layers: 5, rw: 3, rim: .6, j: 2 });
    if (n === 2) wash(x, blob(46, 58, 30, 24, 33, .2), "#4c4656", 34, { a: .14, layers: 3, rw: 2, rim: .35 });
    pencil(x, blob(50, 52, 44, 43, 35 + n, .12), 36 + n, 1.2); const r = R(40 + n);
    for (let i = 0; i < 18 + n * 10; i++) { const a = r() * 6.28, d = 12 + r() * 30; x.fillStyle = r() < .5 ? "rgba(255,250,240,.5)" : "rgba(60,50,60,.35)"; x.beginPath(); x.arc(50 + Math.cos(a) * d, 52 + Math.sin(a) * d, .6 + r() * (n === 2 ? 1.6 : 1), 0, 6.28); x.fill(); }
    if (n === 2) for (let i = 0; i < 6; i++) { const a = r() * 6.28, d = 20 + r() * 22; x.fillStyle = "rgba(226,120,60,.75)"; x.beginPath(); x.arc(50 + Math.cos(a) * d, 52 + Math.sin(a) * d, 1.4, 0, 6.28); x.fill(); }
    granulate(cv, 2.2); return cv; };
  // ---- brambles: a sap-green wash with brown briar strokes and thorns; one to three canes as it is cut back
  for (const hp of [1, 2, 3]) B["bramble" + hp] = () => { const [cv, x] = tile();
    wash(x, rr(5, 5, 90, 90, 14), ["#7fae6a", "#62965a", "#4c7e4a"][hp - 1], 50 + hp, { a: .22, layers: 5, rw: 3, rim: .55, j: 1.5 });
    const canes = [[8, 74, 30, 12, 92, 30], [10, 30, 56, 92, 92, 66], [24, 6, 92, 48, 34, 94]].slice(0, hp);
    for (const [x0, y0, cx, cy, x1, y1] of canes) { const p = new Path2D(); p.moveTo(x0, y0); p.quadraticCurveTo(cx, cy, x1, y1);
      x.strokeStyle = hexA("#7a5232", .7); x.lineWidth = 5; x.stroke(p); x.strokeStyle = hexA("#4a2e1a", .45); x.lineWidth = 1.6; x.stroke(p); pencil(x, p, 60 + x0, 1);
      for (let i = 1; i <= 5; i++) { const u = i / 6, v = 1 - u, px = v * v * x0 + 2 * v * u * cx + u * u * x1, py = v * v * y0 + 2 * v * u * cy + u * u * y1, dx = 2 * v * (cx - x0) + 2 * u * (x1 - cx), dy = 2 * v * (cy - y0) + 2 * u * (y1 - cy), m = Math.hypot(dx, dy) || 1, nx = -dy / m * (i % 2 ? 1 : -1), ny = dx / m * (i % 2 ? 1 : -1);
        const th = new Path2D(); th.moveTo(px + dx / m * 2.4, py + dy / m * 2.4); th.lineTo(px + nx * 7, py + ny * 7); th.lineTo(px - dx / m * 2.4, py - dy / m * 2.4); th.closePath(); x.fillStyle = hexA("#efe4cc", .9); x.fill(th); x.strokeStyle = "rgba(74,52,40,.75)"; x.lineWidth = .8; x.stroke(th); } }
    const lv = R(70 + hp); for (let i = 0; i < 2 + hp; i++) { const lx = 18 + lv() * 64, ly = 18 + lv() * 64, a = lv() * 6.28, lp = new Path2D(); lp.ellipse(lx, ly, 7, 3.6, a, 0, 6.28); wash(x, lp, "#5f9e4e", 80 + i, { a: .35, layers: 3, rw: 1.2, cx: lx, cy: ly, j: .6 }); pencil(x, lp, 90 + i, .8); }
    pencil(x, rr(5, 5, 90, 90, 14), 99 + hp, 1.4); granulate(cv, 1.6); return cv; };
  // ---- the toffee block (it was chocolate): a warm umber wash in a square of four, glazed darker at the seams, a lifted shine
  B.choc = () => { const [cv, x] = tile(); const body = rr(6, 6, 88, 88, 16);
    wash(x, body, "#8a5232", 101, { a: .3, layers: 5, rw: 3.4, rim: .6 }); for (const [qx, qy] of [[12, 12], [52, 12], [12, 52], [52, 52]]) { const q = rr(qx, qy, 36, 36, 8); wash(x, q, "#a8683e", 102 + qx + qy, { a: .2, layers: 3, rw: 1.6, cx: qx + 18, cy: qy + 18, rim: .4 }); }
    x.save(); x.clip(body); x.filter = "blur(2px)"; x.globalCompositeOperation = "destination-out"; x.fillStyle = "rgba(0,0,0,.45)"; x.beginPath(); x.ellipse(32, 24, 16, 6, -.4, 0, 6.28); x.fill(); x.restore();
    pencil(x, body, 104, 1.5); granulate(cv, 1.4); return cv; };
  // ---- stone: a cool grey with granulating blue and umber, cracks in pencil, a lighter top face
  B.stone = () => { const [cv, x] = tile(); const p = new Path2D(); [[22, 7], [78, 6], [96, 30], [95, 76], [74, 95], [24, 95], [5, 74], [6, 26]].forEach(([a, b], i) => i ? p.lineTo(a, b) : p.moveTo(a, b)); p.closePath();
    wash(x, p, "#8a90a8", 111, { a: .26, layers: 5, rw: 3.2, rim: .6 }); wash(x, blob(44, 36, 34, 20, 112, .15), "#c8cad8", 113, { a: .2, layers: 3, rw: 1.4, rim: .25 });
    x.save(); x.clip(p); x.filter = "blur(3px)"; x.fillStyle = "rgba(90,80,70,.18)"; x.beginPath(); x.ellipse(70, 78, 40, 26, 0, 0, 6.28); x.fill(); x.restore();
    const ck = new Path2D(); ck.moveTo(26, 42); ck.lineTo(46, 54); ck.lineTo(52, 80); ck.moveTo(46, 54); ck.lineTo(74, 44); pencil(x, ck, 114, 1.3); pencil(x, p, 115, 1.6); granulate(cv, 2.4); return cv; };
  // ---- the crate: ochre planks with pencil grain and nail heads; the charm it opens to is painted on in the game
  B.crate = () => { const [cv, x] = tile(); const body = rr(6, 6, 88, 88, 6);
    wash(x, body, "#c08a4e", 121, { a: .28, layers: 5, rw: 3, rim: .55 });
    for (const y of [36, 64]) { x.strokeStyle = "rgba(110,70,36,.55)"; x.lineWidth = 2.2; x.beginPath(); x.moveTo(8, y); x.lineTo(92, y); x.stroke(); }
    const g = R(122); for (let i = 0; i < 9; i++) { const y = 12 + g() * 76, p = new Path2D(); p.moveTo(10, y); p.bezierCurveTo(30, y + (g() - .5) * 4, 60, y + (g() - .5) * 4, 90, y + (g() - .5) * 3); x.strokeStyle = "rgba(120,80,40,.25)"; x.lineWidth = .7; x.stroke(p); }
    for (const [a, b] of [[13, 13], [87, 13], [13, 87], [87, 87]]) { x.fillStyle = "rgba(80,56,40,.8)"; x.beginPath(); x.arc(a, b, 1.8, 0, 6.28); x.fill(); }
    x.fillStyle = "rgba(250,244,230,.75)"; x.beginPath(); x.arc(50, 50, 24, 0, 6.28); x.fill(); pencil(x, (() => { const c = new Path2D(); c.arc(50, 50, 24, 0, 6.28); return c; })(), 123, 1.1);
    pencil(x, body, 124, 1.5); granulate(cv, 1.4); return cv; };
  // ---- the ground tile for the map's bands: a transparent 256 px tile with grass tufts and pebbles, wrapped so it repeats
  B.ground = () => { const N = 256, cv = document.createElement("canvas"); cv.width = cv.height = N; const x = cv.getContext("2d"); const r = R(9); x.lineCap = "round";
    const wrap = (f) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) { x.save(); x.translate(dx, dy); f(); x.restore(); } };
    for (let i = 0; i < 14; i++) { const cx = r() * N, cy = r() * N, s = .7 + r() * .7; wrap(() => { for (let b = 0; b < 4; b++) { const a = -1.9 + b * .55 + (r() - .5) * .3, l = (7 + r() * 6) * s; x.strokeStyle = `rgba(40,${90 + r() * 30 | 0},50,${.35 + r() * .2})`; x.lineWidth = 1.4 * s; x.beginPath(); x.moveTo(cx, cy); x.quadraticCurveTo(cx + Math.cos(a) * l * .5 - 2, cy + Math.sin(a) * l * .5, cx + Math.cos(a) * l, cy + Math.sin(a) * l); x.stroke(); } }); }
    for (let i = 0; i < 6; i++) { const cx = r() * N, cy = r() * N, s = .7 + r() * .6; wrap(() => { x.fillStyle = "rgba(246,240,226,.7)"; x.beginPath(); x.ellipse(cx, cy, 3.5 * s, 2.4 * s, 0, 0, 6.28); x.fill(); x.strokeStyle = "rgba(74,52,40,.45)"; x.lineWidth = .8; x.stroke(); x.fillStyle = "rgba(246,240,226,.55)"; x.beginPath(); x.ellipse(cx + 7 * s, cy + 2, 2.4 * s, 1.6 * s, 0, 0, 6.28); x.fill(); }); }
    return cv; };
  window.BOARD_WC = B;
})();
