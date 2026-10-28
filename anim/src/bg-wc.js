// The board's backdrops in watercolour (2026-10-28, İdris: "oyun ekranında tema illa koyu olmasına gerek yok, her levelde tema değişsin, farklı renklerde olabilir").
// One painted page per theme and time of day: a sky wash of two pigments with soft blooms, a sun or moon lifted out of the paper, far and near
// hills of the theme's own kind in thin glazes, a few painted trees, and the ground wash with the paper's tooth. Every palette is kept light and
// of low saturation, so the charms on the paper board stay the brightest thing on the screen. Needs charm-wc.js (window.WC) and the game's THEMES.
// bake-bg.cjs writes anim/bg-<k>-<v>.webp (v: 0 morning, 1 evening) at 480 x 1040.
(() => {
  const { wash, pencil, granulate, hexA, R, NOISE } = WC, W = 480, H = 1040;
  const hx = (h) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), toHex = (c) => "#" + c.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, t) => toHex(hx(a).map((v, i) => v + (hx(b)[i] - v) * t));
  // every pigment is lifted toward the paper and desaturated: a watercolour never reaches the screen's full colour
  const soften = (h, k = .45) => { const c = hx(h), l = (c[0] * .3 + c[1] * .59 + c[2] * .11); return toHex(c.map(v => v + (l - v) * .28).map(v => v + (246 - v) * k)); };
  const blob = (cx, cy, rx, ry, seed, wob = .12, n = 40) => { const r = R(seed), p = new Path2D(), ph = r() * 6; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, k = 1 + Math.sin(a * 3 + ph) * wob * .5 + (r() - .5) * wob; const X = cx + Math.cos(a) * rx * k, Y = cy + Math.sin(a) * ry * k; i ? p.lineTo(X, Y) : p.moveTo(X, Y); } p.closePath(); return p; };
  // a ridge: a wobbly skyline from x = -20 to W + 20 at height y0, with bumps of the land's own kind, closed down to the bottom
  function ridge(y0, amp, seed, kind) { const r = R(seed), p = new Path2D(); p.moveTo(-20, H + 20); p.lineTo(-20, y0); let x = -20; while (x < W + 20) { const w = 40 + r() * 80;
    if (kind === "pines" || kind === "jungle" || kind === "bamboo") { for (let k = 0; k < 3; k++) { const h = amp * (.6 + r() * .8), tw = w / 3; p.lineTo(x + k * tw + tw / 2, y0 - h); p.lineTo(x + (k + 1) * tw, y0 - h * .15); } }
    else if (kind === "mesa" || kind === "castle" || kind === "volcano") { const h = amp * (.5 + r() * .9); p.lineTo(x + w * .15, y0 - h); p.lineTo(x + w * .85, y0 - h * (kind === "volcano" ? .55 : 1)); p.lineTo(x + w, y0 - h * .1); }
    else if (kind === "shrooms") { const h = amp * (.6 + r() * .8); p.quadraticCurveTo(x + w * .5, y0 - h * 2.2, x + w, y0 - h * .2); }
    else if (kind === "sea" || kind === "reef" || kind === "pond" || kind === "clouds" || kind === "space") { p.quadraticCurveTo(x + w * .5, y0 - amp * .25 * r(), x + w, y0); }
    else { const h = amp * (.5 + r() * .8); p.quadraticCurveTo(x + w * .5, y0 - h * 1.6, x + w, y0 - h * .1); }
    x += w; } p.lineTo(W + 20, H + 20); p.closePath(); return p; }
  // a tree: round crown or pine, painted as a glaze with a pencil stem
  function tree(x, cx, cy, s, col, seed, pine) { const r = R(seed); x.strokeStyle = "rgba(90,66,50,.7)"; x.lineWidth = 3 * s; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx + (r() - .5) * 3, cy - 26 * s); x.stroke();
    if (pine) { for (let k = 0; k < 3; k++) { const p = new Path2D(), y = cy - 20 * s - k * 16 * s, w = (22 - k * 5) * s; p.moveTo(cx - w, y); p.lineTo(cx, y - 24 * s); p.lineTo(cx + w, y); p.closePath(); wash(x, p, col, seed + k, { a: .3, layers: 3, rw: 1.4, cx, cy: y - 10 * s, j: 1.2 }); } }
    else { const p = blob(cx, cy - 40 * s, 22 * s, 18 * s, seed, .16, 26); wash(x, p, col, seed + 1, { a: .3, layers: 4, rw: 1.6, cx, cy: cy - 40 * s, j: 1.2 }); x.save(); x.clip(p); x.filter = "blur(4px)"; x.fillStyle = hexA(mix(col, "#2a3a60", .4), .35); x.beginPath(); x.ellipse(cx + 8 * s, cy - 32 * s, 16 * s, 12 * s, 0, 0, 7); x.fill(); x.restore(); pencil(x, p, seed + 2, 1); } }
  window.paintBackdrop = function (k, v) { const T = THEMES[k], cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d"); x.lineJoin = x.lineCap = "round";
    const eve = v === 1, s1 = soften(T.s1, eve ? .3 : .45), s2 = soften(T.s2, eve ? .35 : .5), g = soften(T.g, eve ? .3 : .42), far = soften(T.far, eve ? .3 : .45), mid = soften(T.mid, eve ? .28 : .4), warm = eve ? "#f0b070" : "#ffe9a0";
    x.fillStyle = "#f5eddc"; x.fillRect(0, 0, W, H);
    // sky: two washes that meet wet, blooms of the second pigment, the evening gets a warm band at the horizon
    { const gr = x.createLinearGradient(0, 0, 0, H * .62); gr.addColorStop(0, hexA(s1, .55)); gr.addColorStop(.7, hexA(s2, .5)); gr.addColorStop(1, hexA(eve ? warm : s2, .55)); x.fillStyle = gr; x.fillRect(0, 0, W, H * .62);
      const r = R(k * 7 + v); for (let i = 0; i < 9; i++) { x.save(); x.filter = "blur(28px)"; x.fillStyle = hexA(i % 2 ? s1 : s2, .18); x.beginPath(); x.ellipse(r() * W, r() * H * .5, 90 + r() * 120, 50 + r() * 60, 0, 0, 7); x.fill(); x.restore(); } }
    // sun or moon: lifted out of the sky back to the paper, a faint warm halo
    if (T.sky !== "none" && T.sky !== "aurora") { const cx = k % 2 ? W * .86 : W * .14, cy = H * .215;   // beside the board, clear of the bars above it x.save(); x.filter = "blur(18px)"; x.fillStyle = hexA(warm, .35); x.beginPath(); x.arc(cx, cy, 70, 0, 7); x.fill(); x.restore();
      const p = blob(cx, cy, 34, 34, k + 50, .05, 30); x.save(); x.filter = "blur(1.2px)"; x.fillStyle = T.sky === "moon" || T.sky === "stars" || T.sky === "planet" ? "rgba(250,246,232,.92)" : hexA(warm, .85); x.fill(p); x.restore(); pencil(x, p, k + 51, 1); }
    if (T.sky === "stars" || T.sky === "planet" || T.sky === "space") { const r = R(k + 9); for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,252,240,${.4 + r() * .5})`; x.beginPath(); x.arc(r() * W, r() * H * .45, .8 + r() * 1.6, 0, 7); x.fill(); } }
    if (T.sky === "aurora") { for (let i = 0; i < 3; i++) { x.save(); x.filter = "blur(14px)"; x.strokeStyle = hexA(["#9ad8b0", "#b0a0e0", "#a0d0f0"][i], .35); x.lineWidth = 36; x.beginPath(); x.moveTo(-20, 120 + i * 60); x.bezierCurveTo(W * .3, 40 + i * 50, W * .6, 220 + i * 40, W + 20, 100 + i * 70); x.stroke(); x.restore(); } }
    if (T.sky === "rainbow") { for (let i = 0; i < 6; i++) { x.save(); x.filter = "blur(2px)"; x.strokeStyle = hexA(soften(["#ff5a5a", "#ffa63a", "#ffe04a", "#6ad860", "#4ab0ff", "#a070ff"][i], .5), .5); x.lineWidth = 10; x.beginPath(); x.arc(W * .5, H * .62, 300 - i * 11, Math.PI * 1.08, Math.PI * 1.92); x.stroke(); x.restore(); } }
    // far ridge, near ridge, ground
    wash(x, ridge(H * .5, 90, k * 3 + 1, T.land), far, k * 3 + 2, { a: .2, layers: 4, rw: 2.6, rim: .35, j: 2, cx: W / 2, cy: H * .5 });
    wash(x, ridge(H * .59, 60, k * 3 + 3, T.land), mid, k * 3 + 4, { a: .24, layers: 4, rw: 2.6, rim: .4, j: 2, cx: W / 2, cy: H * .59 });
    { const gp = new Path2D(); gp.moveTo(-20, H * .62); gp.quadraticCurveTo(W * .5, H * .60, W + 20, H * .63); gp.lineTo(W + 20, H + 20); gp.lineTo(-20, H + 20); gp.closePath(); wash(x, gp, g, k * 3 + 5, { a: .3, layers: 5, rw: 3, rim: .4, j: 2, cx: W / 2, cy: H * .8 });
      x.save(); x.clip(gp); x.filter = "blur(30px)"; x.fillStyle = hexA(mix(g, "#2a3a40", .4), .25); x.fillRect(0, H * .78, W, H * .3); x.restore(); }
    // a few trees of the theme's kind along the near ridge, smaller to the sides
    { const r = R(k * 11 + v), pine = /pines|tundra|snow|bamboo|jungle/.test(T.land), tc = /snow|tundra/.test(T.land) ? soften("#7aa090", .4) : /orchard|wheat/.test(T.land) ? soften("#d08a40", .4) : /blossom|castle/.test(T.land) ? soften("#e8a0c0", .4) : /mesa|volcano|cave|space|sea|reef|clouds/.test(T.land) ? null : mix(g, "#2a5a30", .35);
      if (tc) for (let i = 0; i < 6; i++) { const cx = 30 + r() * (W - 60), s = .6 + r() * .6; tree(x, cx, H * .6 + 6 + r() * 14, s, tc, k * 100 + i, pine); } }
    granulate(cv, 1.2); return cv; };
})();
