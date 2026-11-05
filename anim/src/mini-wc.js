// The side games' art, painted as watercolour storybook pages (2026-11-05, İdris: "yan oyunlar veya ödüller için kısa oyunlar ekle"; the art
// direction of 2026-10-28: "Suluboya masal kitabı ... her şey"). Same hand as the charms and the board (charm-wc.js, board-wc.js): a wash put
// down in thin layers that never sit exactly on each other, pigment pooled at the rim where it dried, a darker wash on the shadow side, the
// light lifted back to the paper, granulation in the paper's tooth and a sepia pencil line that wanders and breaks.
// Every moving piece is drawn frame by frame from hand-set keys (MINI_SHEETS[*].keys): the mole's blink and laugh, the firefly's wing beat
// and glow, the ripple, the splash. bake-mini.cjs renders them to prism/anim/mini-<name>.webp and writes anim/mini-art.js (the sheet sizes).
(() => {
  const SEPIA = "rgba(66,44,30,", PAPER = "#f6efe0";
  const R = (n) => { let s = (Math.abs(n * 9301 + 49297) | 0) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const NOISE = (() => { const N = 128, g = new Float32Array(N * N), r = R(41); for (let i = 0; i < g.length; i++) g[i] = r();
    const at = (xi, yi) => g[((yi % N + N) % N) * N + ((xi % N + N) % N)];
    const sm = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = at(xi, yi), b = at(xi + 1, yi), c = at(xi, yi + 1), d = at(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
    return (x, y) => sm(x / 14, y / 14) * .5 + sm(x / 4 + 40, y / 4) * .32 + sm(x * .8 + 9, y * .8) * .18; })();
  const rgb = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; };
  const hexA = (h, a) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
  const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  const P = (f) => { const p = new Path2D(); f(p); return p; };
  const ell = (cx, cy, rx, ry, rot = 0) => P(p => p.ellipse(cx, cy, rx, ry, rot, 0, 6.2832));
  // a closed blob through points with a little wobble: the painter's hand never draws a perfect curve
  const blob = (pts, seed, wob = 0) => { const r = R(seed), q = pts.map(([x, y]) => [x + (r() - .5) * wob, y + (r() - .5) * wob]), n = q.length;
    return P(p => { for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; if (!i) { const z = q[n - 1]; p.moveTo((z[0] + a[0]) / 2, (z[1] + a[1]) / 2); } p.quadraticCurveTo(a[0], a[1], m[0], m[1]); } p.closePath(); }); };
  // ---- the brush
  function wash(x, path, col, seed, o = {}) { const r = R(seed), L = o.layers || 5, cx = o.cx || 0, cy = o.cy || 0;
    for (let i = 0; i < L; i++) { x.save(); const s = 1 + (r() - .5) * (o.wob || .025); x.translate(cx + (r() - .5) * (o.j || 2.4), cy + (r() - .5) * (o.j || 2.4)); x.scale(s, s); x.translate(-cx, -cy); x.fillStyle = hexA(col, o.a || .3); x.fill(path); x.restore(); }
    if (o.rim !== 0) { x.save(); x.clip(path); x.filter = `blur(${o.rb || 1}px)`; x.strokeStyle = hexA(mix(col, "#140c0c", .32), o.rim || .5); x.lineWidth = o.rw || 4; x.stroke(path); x.restore(); } }
  function shade(x, path, col, ex, ey, rx, ry, a = .34, blur = 6) { x.save(); x.clip(path); x.filter = `blur(${blur}px)`; x.fillStyle = hexA(mix(col, "#1a1010", .38), a); x.beginPath(); x.ellipse(ex, ey, rx, ry, 0, 0, 6.2832); x.fill(); x.restore(); }
  function lift(x, path, ex, ey, rx, ry, a = .5, rot = -.5) { x.save(); x.clip(path); x.filter = `blur(${Math.max(1.5, rx * .18)}px)`; x.globalCompositeOperation = "destination-out"; x.fillStyle = `rgba(0,0,0,${a})`; x.beginPath(); x.ellipse(ex, ey, rx, ry, rot, 0, 6.2832); x.fill(); x.restore();
    x.save(); x.clip(path); x.filter = `blur(${Math.max(1, rx * .12)}px)`; x.fillStyle = `rgba(255,252,242,${Math.min(.5, a * .8)})`; x.beginPath(); x.ellipse(ex - rx * .2, ey - ry * .2, rx * .22, ry * .16, rot, 0, 6.2832); x.fill(); x.restore(); }
  function pencil(x, path, seed, w = 1.8, a = .9) { const r = R(seed); for (let pass = 0; pass < 2; pass++) { x.save(); x.translate(pass * .6, -pass * .5); x.strokeStyle = pass ? SEPIA + (a * .4) + ")" : SEPIA + a + ")"; x.lineWidth = w * (pass ? .7 : 1); x.lineCap = "round"; x.lineJoin = "round";
    const dash = []; for (let i = 0; i < 12; i++) dash.push(26 + r() * 80, r() < .5 ? 1 + r() * 2.5 : .01); x.setLineDash(dash); x.lineDashOffset = r() * 60; x.stroke(path); x.restore(); } }
  function gran(x, path, col, a, seed, n = 220, size = 1.6) { const r = R(seed), b = x.canvas; x.save(); x.clip(path); x.fillStyle = hexA(col, a); for (let i = 0; i < n; i++) { const px = r() * b.width, py = r() * b.height; x.beginPath(); x.arc(px, py, size * (.4 + r()), 0, 6.2832); x.fill(); } x.restore(); }
  function line(x, pts, col, w, a = .9, seed = 1) { const p = P(q => { q.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) { const m = pts[i], prev = pts[i - 1]; q.quadraticCurveTo(prev[0], prev[1], (prev[0] + m[0]) / 2, (prev[1] + m[1]) / 2); } const l = pts[pts.length - 1]; q.lineTo(l[0], l[1]); });
    x.save(); x.strokeStyle = hexA(col, a); x.lineWidth = w; x.lineCap = "round"; x.lineJoin = "round"; x.stroke(p); x.restore(); return p; }
  // the sheet of paper under a whole page: warm, with its tooth
  function paper(x, W, H, tone = PAPER) { x.fillStyle = tone; x.fillRect(0, 0, W, H); const im = x.getImageData(0, 0, W, H), d = im.data;
    for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) { const k = (y * W + X) * 4, n = (NOISE(X, y) - .5) * 22; d[k] += n; d[k + 1] += n; d[k + 2] += n * .9; }
    x.putImageData(im, 0, 0); }
  // a wash over a whole band with a soft vertical gradient (sky)
  function sky(x, W, y0, y1, top, bot) { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, top); g.addColorStop(1, bot); x.save(); x.filter = "blur(10px)"; x.fillStyle = g; x.fillRect(-30, y0 - 30, W + 60, y1 - y0 + 60); x.restore(); }
  // the tooth shows through every wash once more at the end (pigment settles in the dips)
  function tooth(x, W, H, a = .07) { const im = x.getImageData(0, 0, W, H), d = im.data; for (let y = 0; y < H; y++) for (let X = 0; X < W; X++) { const k = (y * W + X) * 4; if (!d[k + 3]) continue; const n = 1 - (NOISE(X * 1.7, y * 1.7) - .5) * a * 2; d[k] *= n; d[k + 1] *= n; d[k + 2] *= n; } x.putImageData(im, 0, 0); }
  // a periodic hill line (so a panorama tiles), for the pond and the field
  const hills = (W, y, amp, waves, ph, H) => P(p => { p.moveTo(-10, H); for (let X = -10; X <= W + 10; X += 6) { let v = 0; waves.forEach(([n, a], i) => { v += Math.sin(X / W * 6.2832 * n + ph * (i + 1)) * a; }); p.lineTo(X, y + v * amp); } p.lineTo(W + 10, H); p.closePath(); });
  function tree(x, cx, by, s, col, seed) { const r = R(seed); const trunk = P(p => { p.moveTo(cx - 5 * s, by); p.lineTo(cx - 3 * s, by - 40 * s); p.lineTo(cx + 3 * s, by - 40 * s); p.lineTo(cx + 5 * s, by); p.closePath(); });
    wash(x, trunk, "#8a6446", seed, { a: .45, layers: 3, rw: 2 }); pencil(x, trunk, seed, 1.4, .7);
    const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * 6.2832, rr = (34 + r() * 10) * s; pts.push([cx + Math.cos(a) * rr, by - 62 * s + Math.sin(a) * rr * .9]); } const crown = blob(pts, seed + 1, 4 * s);
    wash(x, crown, col, seed + 2, { a: .4, layers: 5, cx, cy: by - 62 * s }); shade(x, crown, col, cx + 14 * s, by - 50 * s, 30 * s, 26 * s, .35, 8 * s); lift(x, crown, cx - 12 * s, by - 76 * s, 14 * s, 10 * s, .45); pencil(x, crown, seed + 3, 1.5, .75); }
  function tuft(x, cx, by, s, col, seed) { const r = R(seed); for (let i = 0; i < 7; i++) { const a = -1.9 + i * .27 + (r() - .5) * .2, L = (22 + r() * 18) * s; line(x, [[cx + (i - 3) * 2 * s, by], [cx + Math.cos(a) * L * .5 + (i - 3) * 2 * s, by + Math.sin(a) * L * .55], [cx + Math.cos(a) * L, by + Math.sin(a) * L]], mix(col, "#173016", r() * .35), 3.2 * s, .75); } }
  function daisy(x, cx, cy, s, col, seed) { for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832, pt = ell(cx + Math.cos(a) * 7 * s, cy + Math.sin(a) * 4.5 * s, 6 * s, 3 * s, a); wash(x, pt, col, seed + i, { a: .55, layers: 2, rw: 1.2, rim: .25, j: .6 }); } const c = ell(cx, cy, 4 * s, 3 * s); wash(x, c, "#f0b21a", seed, { a: .8, layers: 2, rw: 1, j: .4 }); }

  // ---------------------------------------------------------------- the pages
  const BG = {
    // Carrot Patch: a morning garden, a fence, a dug bed of dark soil with furrows; the nine holes are set into the bed by the game
    field(x, W, H) { paper(x, W, H); sky(x, W, 0, H * .36, "#a9d6ef", "#fbf1d8");
      const far = hills(W, H * .3, 1, [[2, 14], [5, 6]], .7, H); wash(x, far, "#9cc79a", 3, { a: .34, layers: 4, rw: 3 }); pencil(x, far, 4, 1.4, .5);
      const near = hills(W, H * .36, 1, [[1, 18], [3, 8]], 2.2, H); wash(x, near, "#7db46b", 5, { a: .4, layers: 5, rw: 4 }); pencil(x, near, 6, 1.6, .6);
      [[.12, .37, .9], [.3, .355, .7], [.82, .36, 1.05], [.95, .375, .8]].forEach(([fx, fy, s], i) => tree(x, W * fx, H * fy, s * W / 520, i % 2 ? "#4f9a4a" : "#3f8a48", 20 + i));
      // the fence: posts and two rails, weathered
      for (let i = 0; i < 9; i++) { const px = W * (i + .4) / 9, post = P(p => p.rect(px - 7, H * .395, 14, H * .065)); wash(x, post, "#a07a52", 40 + i, { a: .5, layers: 3, rw: 2 }); pencil(x, post, 50 + i, 1.3, .7); }
      for (const ry of [.408, .436]) { const rail = P(p => { p.moveTo(-10, H * ry); p.bezierCurveTo(W * .3, H * ry - 6, W * .7, H * ry + 6, W + 10, H * ry); p.lineTo(W + 10, H * ry + 9); p.bezierCurveTo(W * .7, H * ry + 15, W * .3, H * ry + 3, -10, H * ry + 9); p.closePath(); }); wash(x, rail, "#b08a60", 60 + ry * 100, { a: .55, layers: 3, rw: 2 }); pencil(x, rail, 70, 1.2, .6); }
      // grass verge and the dug bed
      const verge = P(p => { p.moveTo(-10, H * .455); p.bezierCurveTo(W * .3, H * .44, W * .7, H * .47, W + 10, H * .45); p.lineTo(W + 10, H); p.lineTo(-10, H); p.closePath(); }); wash(x, verge, "#86bf62", 80, { a: .45, layers: 5, rw: 4 });
      const bed = P(p => { p.moveTo(W * .03, H * .5); p.bezierCurveTo(W * .3, H * .48, W * .7, H * .49, W * .97, H * .5); p.bezierCurveTo(W * 1.01, H * .7, W * .99, H * .86, W * .95, H * .95); p.bezierCurveTo(W * .6, H * .97, W * .35, H * .965, W * .05, H * .95); p.bezierCurveTo(W * .0, H * .8, W * .01, H * .65, W * .03, H * .5); p.closePath(); });
      wash(x, bed, "#8a5a3a", 90, { a: .5, layers: 6, rw: 5, rim: .55 }); shade(x, bed, "#8a5a3a", W * .7, H * .85, W * .5, H * .2, .3, 20); gran(x, bed, "#3a2214", .35, 91, 2600, 1.4);
      for (let i = 0; i < 7; i++) { const fy = H * (.53 + i * .06); line(x, [[W * .06, fy + 4], [W * .3, fy - 3], [W * .6, fy + 3], [W * .94, fy - 2]], "#5a3420", 5, .28); line(x, [[W * .07, fy + 8], [W * .5, fy + 7], [W * .93, fy + 6]], "#c89a70", 2.5, .25); }
      pencil(x, bed, 92, 1.8, .75);
      for (let i = 0; i < 14; i++) { const r = R(100 + i), fx = r() < .5 ? r() * .07 : .93 + r() * .07; tuft(x, W * fx, H * (.5 + r() * .48), W / 520, "#5aa84a", 110 + i); }
      for (let i = 0; i < 9; i++) { const r = R(140 + i); tuft(x, W * r(), H * (.462 + r() * .02), W / 700, "#5aa84a", 150 + i); }
      [[.06, .47, "#fffaf0"], [.2, .462, "#f6a8c0"], [.74, .468, "#fffaf0"], [.9, .46, "#f6d040"]].forEach(([fx, fy, c], i) => daisy(x, W * fx, H * fy, W / 520, c, 170 + i));
      tooth(x, W, H); },
    // Firefly Catch: a summer night over a meadow, a big moon, a line of dark trees and tall grass
    night(x, W, H) { paper(x, W, H, "#ece4d4"); sky(x, W, 0, H * .7, "#1c2656", "#4a4a86");
      const r = R(7); for (let i = 0; i < 90; i++) { const sx = r() * W, sy = r() * H * .5, s = .6 + r() * 1.8; x.fillStyle = `rgba(255,250,228,${.35 + r() * .55})`; x.beginPath(); x.arc(sx, sy, s, 0, 6.2832); x.fill(); }
      const moon = ell(W * .76, H * .14, W * .1, W * .1); x.save(); x.filter = "blur(26px)"; x.fillStyle = "rgba(255,240,190,.35)"; x.fill(ell(W * .76, H * .14, W * .18, W * .18)); x.restore();
      wash(x, moon, "#fbefc4", 8, { a: .7, layers: 4, rw: 3, rim: .25, cx: W * .76, cy: H * .14 }); for (const [dx, dy, s] of [[-.03, -.02, .022], [.03, .025, .016], [.0, .04, .012]]) wash(x, ell(W * (.76 + dx), H * .14 + W * dy, W * s, W * s * .85), "#d9c890", 9, { a: .35, layers: 2, rw: 1, rim: .2 }); pencil(x, moon, 10, 1.4, .5);
      const far = hills(W, H * .52, 1, [[2, 12], [7, 4]], 1.3, H); wash(x, far, "#2c3d64", 11, { a: .55, layers: 4, rw: 3, rim: .3 });
      for (let i = 0; i < 9; i++) { const rr = R(20 + i); tree(x, W * (i / 8) + (rr() - .5) * 40, H * (.58 + rr() * .02), (.8 + rr() * .5) * W / 520, "#1e3b44", 30 + i); }
      const meadow = hills(W, H * .6, 1, [[1, 10], [4, 5]], .4, H); wash(x, meadow, "#284a3e", 40, { a: .6, layers: 5, rw: 4, rim: .35 }); shade(x, meadow, "#284a3e", W * .5, H * .95, W * .7, H * .25, .35, 30);
      for (let i = 0; i < 26; i++) { const rr = R(60 + i); tuft(x, W * rr(), H * (.62 + rr() * .36), (1 + rr() * .8) * W / 520, "#3a6a50", 70 + i); }
      for (let i = 0; i < 6; i++) { const rr = R(120 + i); daisy(x, W * rr(), H * (.66 + rr() * .3), W / 600, "#c9c2ff", 130 + i); }
      tooth(x, W, H, .05); },
    // Lily Hop: a pond seen from its bank, low; tiles left to right (twice the screen's width) so the game can scroll it
    pond(x, W, H) { paper(x, W, H); sky(x, W, 0, H * .42, "#9fd2ea", "#fdf3dc");
      const far = hills(W, H * .38, 1, [[2, 16], [6, 5]], .3, H); wash(x, far, "#8fc08e", 3, { a: .36, layers: 4, rw: 3 }); pencil(x, far, 4, 1.3, .5);
      for (let i = 0; i < 6; i++) tree(x, W * (i + .5) / 6, H * (.4 + (i % 2) * .01), (.75 + (i % 3) * .15) * W / 1040, i % 2 ? "#4f9a4a" : "#5aa858", 10 + i);
      const bank = hills(W, H * .44, 1, [[3, 6], [8, 2]], 1.1, H); wash(x, bank, "#6aa85a", 20, { a: .45, layers: 5, rw: 4 }); pencil(x, bank, 21, 1.5, .6);
      const water = hills(W, H * .47, 1, [[4, 3], [10, 1.5]], 2.4, H); wash(x, water, "#5aa6c8", 30, { a: .45, layers: 6, rw: 5, rim: .35 });
      x.save(); x.clip(water); const g = x.createLinearGradient(0, H * .47, 0, H); g.addColorStop(0, "rgba(160,215,235,.0)"); g.addColorStop(1, "rgba(30,80,120,.45)"); x.fillStyle = g; x.fillRect(0, H * .45, W, H * .6); x.restore();
      for (let i = 0; i < 40; i++) { const rr = R(40 + i), ly = H * (.5 + rr() * .47), lx = W * rr(), L = W * (.03 + rr() * .07); line(x, [[lx, ly], [lx + L * .5, ly - 1.5], [lx + L, ly]], "#fffaf0", 2 + rr() * 2, .35 + rr() * .3); }
      for (let i = 0; i < 12; i++) { const rr = R(90 + i); tuft(x, W * (i + rr() * .6) / 12, H * (.47 + rr() * .01), W / 1100, "#4e9a48", 100 + i); }
      tooth(x, W, H); },
    // Mordo's Nests: dusk in a tall tree, a branch across the page; the nests sit on it
    tree(x, W, H) { paper(x, W, H); sky(x, W, 0, H, "#f5c9a2", "#b6a2d6");
      const far = hills(W, H * .78, 1, [[2, 20], [5, 9]], 1, H); wash(x, far, "#8e86b8", 3, { a: .4, layers: 4, rw: 3, rim: .3 });
      for (let i = 0; i < 7; i++) { const rr = R(5 + i); tree(x, W * (i / 6), H * (.82 + rr() * .02), (1 + rr() * .6) * W / 520, "#6a6aa0", 10 + i); }
      const near = hills(W, H * .9, 1, [[1, 10], [3, 6]], 2, H); wash(x, near, "#5e5a8e", 20, { a: .45, layers: 4, rw: 3 });
      // the branch, from the left edge into the page, thinning, with two twigs
      const by = H * .6, br = P(p => { p.moveTo(-20, by - 34); p.bezierCurveTo(W * .35, by - 40, W * .7, by - 20, W + 20, by - 26); p.lineTo(W + 20, by + 2); p.bezierCurveTo(W * .7, by + 8, W * .35, by + 26, -20, by + 30); p.closePath(); });
      wash(x, br, "#7a5638", 30, { a: .55, layers: 6, rw: 5, rim: .55 }); shade(x, br, "#7a5638", W * .5, by + 24, W * .8, 20, .4, 8); gran(x, br, "#2e1c10", .3, 31, 900, 1.3);
      for (let i = 0; i < 16; i++) { const rr = R(32 + i), bx = W * rr(); line(x, [[bx, by - 20 + rr() * 30], [bx + 20 + rr() * 40, by - 18 + rr() * 30]], "#4a3020", 2, .35); }
      lift(x, br, W * .4, by - 26, W * .3, 6, .35, 0); pencil(x, br, 33, 2, .8);
      for (const [tx, dir] of [[.18, -1], [.84, 1]]) { const tw = P(p => { p.moveTo(W * tx - 8, by - 28); p.quadraticCurveTo(W * tx + dir * 30, by - 120, W * tx + dir * 70, by - 190); p.lineTo(W * tx + dir * 74, by - 186); p.quadraticCurveTo(W * tx + dir * 38, by - 110, W * tx + 8, by - 28); p.closePath(); }); wash(x, tw, "#7a5638", 40 + tx * 10, { a: .5, layers: 4, rw: 2 }); pencil(x, tw, 41, 1.4, .7);
        for (let j = 0; j < 7; j++) { const rr = R(50 + j + tx * 10), lx = W * tx + dir * (20 + j * 9), ly = by - 60 - j * 20, a = dir * (.6 + rr() * .6) - 1.57, leaf = P(p => { p.moveTo(lx, ly); p.quadraticCurveTo(lx + Math.cos(a - .5) * 22, ly + Math.sin(a - .5) * 22, lx + Math.cos(a) * 40, ly + Math.sin(a) * 40); p.quadraticCurveTo(lx + Math.cos(a + .5) * 22, ly + Math.sin(a + .5) * 22, lx, ly); });
          wash(x, leaf, j % 2 ? "#5aa858" : "#7cbc5a", 60 + j, { a: .55, layers: 3, rw: 1.6, j: 1 }); pencil(x, leaf, 61 + j, 1.1, .6); } }
      const trunk = P(p => { p.moveTo(-20, 0); p.lineTo(W * .1, 0); p.bezierCurveTo(W * .12, H * .3, W * .08, H * .5, W * .14, H * .62); p.lineTo(W * .1, H); p.lineTo(-20, H); p.closePath(); }); wash(x, trunk, "#6a4a32", 80, { a: .6, layers: 5, rw: 5 }); gran(x, trunk, "#2e1c10", .3, 81, 700, 1.4); for (let i = 0; i < 14; i++) line(x, [[W * .02 + (i % 3) * 18, H * i / 14], [W * .04 + (i % 3) * 18, H * (i + .7) / 14]], "#3a2414", 2.4, .4); pencil(x, trunk, 82, 1.8, .8);
      for (let i = 0; i < 9; i++) { const rr = R(200 + i), lx = i < 5 ? W * (.05 + i * .2) : W * (.55 + (i - 5) * .14), ly = i < 5 ? H * (.03 + rr() * .07) : H * (.0 + rr() * .05), pts = []; for (let j = 0; j < 10; j++) { const a = j / 10 * 6.2832, r2 = W * (.12 + rr() * .05); pts.push([lx + Math.cos(a) * r2 * 1.2, ly + Math.sin(a) * r2 * .8]); }
        const m = blob(pts, 210 + i, 8), col = i % 3 ? "#4e8a4a" : "#6aa65a"; wash(x, m, col, 220 + i, { a: .5, layers: 5, rw: 3, cx: lx, cy: ly }); shade(x, m, col, lx + 20, ly + 30, W * .1, W * .06, .4, 10); pencil(x, m, 230 + i, 1.4, .55); }
      tooth(x, W, H); }
  };

  // ---------------------------------------------------------------- the pieces (one frame each unless keyed)
  const S = {
    // a hole dug in the bed: dark opening inside a ring of thrown-up soil (drawn under whatever comes out of it)
    hole(x, W, H) { const cx = W / 2, cy = H * .56, ring = ell(cx, cy, W * .44, H * .34), pit = ell(cx, cy - 2, W * .33, H * .2);
      x.save(); x.filter = "blur(5px)"; x.fillStyle = "rgba(40,20,10,.25)"; x.fill(ell(cx + 4, cy + 8, W * .44, H * .32)); x.restore();
      wash(x, ring, "#9a6a46", 1, { a: .55, layers: 5, rw: 3, cx, cy }); gran(x, ring, "#3a2214", .35, 2, 260, 1.3); lift(x, ring, cx - W * .18, cy - H * .16, W * .12, H * .06, .35, 0);
      wash(x, pit, "#2a170c", 3, { a: .7, layers: 4, rw: 3, rim: .3, cx, cy }); shade(x, pit, "#2a170c", cx, cy + H * .1, W * .3, H * .12, .5, 4); pencil(x, ring, 4, 1.5, .7); pencil(x, pit, 5, 1.3, .6); },
    // the front lip of the same hole, drawn over what comes up so it seems to rise out of the ground
    lip(x, W, H) { const cx = W / 2, cy = H * .56, lip = P(p => { p.ellipse(cx, cy, W * .44, H * .34, 0, 0, Math.PI); p.lineTo(cx - W * .33, cy - 2); p.ellipse(cx, cy - 2, W * .33, H * .2, 0, Math.PI, 0, true); p.closePath(); });
      wash(x, lip, "#9a6a46", 1, { a: .6, layers: 5, rw: 3, cx, cy }); gran(x, lip, "#3a2214", .35, 2, 260, 1.3); shade(x, lip, "#9a6a46", cx, cy + H * .3, W * .4, H * .12, .3, 5); pencil(x, P(p => p.ellipse(cx, cy, W * .44, H * .34, 0, 0, Math.PI)), 4, 1.5, .7); },
    // a carrot pulled whole: the orange root with its rings and a fan of tops (gold for the lucky one)
    carrot(x, W, H, f, o) { const gold = o && o.gold, cx = W / 2, top = H * .42, col = gold ? "#f3c22e" : "#f07a22", body = P(p => { p.moveTo(cx - W * .26, top); p.bezierCurveTo(cx - W * .3, top + H * .18, cx - W * .1, top + H * .42, cx + 2, H * .97); p.bezierCurveTo(cx + W * .1, top + H * .42, cx + W * .3, top + H * .18, cx + W * .26, top); p.bezierCurveTo(cx + W * .14, top - H * .04, cx - W * .14, top - H * .04, cx - W * .26, top); p.closePath(); });
      for (let i = 0; i < 5; i++) { const a = -1.57 + (i - 2) * .32, L = H * (.34 + (i % 2) * .06), sx = cx + (i - 2) * W * .05, st = [[sx, top], [sx + Math.cos(a) * L * .45, top + Math.sin(a) * L * .45], [sx + Math.cos(a) * L, top + Math.sin(a) * L]];
        line(x, st, "#4e9a3a", W * .028, .9); for (let j = 1; j <= 4; j++) { const t = .35 + j * .15, px = sx + Math.cos(a) * L * t, py = top + Math.sin(a) * L * t; for (const k of [-1, 1]) { const la = a + k * .9, lf = ell(px + Math.cos(la) * W * .05, py + Math.sin(la) * W * .05, W * .065, W * .026, la); wash(x, lf, j > 2 ? "#7cc65a" : "#5aa846", 30 + i * 9 + j * 2 + k, { a: .6, layers: 2, rw: 1.2, j: .6 }); } } }
      wash(x, body, col, 3, { a: .58, layers: 5, rw: 3.5, cx, cy: top + H * .2 }); shade(x, body, col, cx + W * .14, top + H * .25, W * .16, H * .3, .4, 6); lift(x, body, cx - W * .1, top + H * .12, W * .07, H * .12, .5, -.1);
      for (let i = 0; i < 6; i++) { const yy = top + H * (.06 + i * .075), hw = W * (.24 - i * .033); line(x, [[cx - hw * .9, yy], [cx - hw * .2, yy + 3], [cx + hw * .4, yy + 1]], gold ? "#b07a10" : "#a8441a", 2.2, .55); }
      if (gold) { x.save(); x.clip(body); x.fillStyle = "rgba(255,252,230,.9)"; for (const [dx, dy, s] of [[-.08, .2, 4], [.06, .34, 3], [-.02, .5, 2.6]]) { x.beginPath(); const sx = cx + W * dx, sy = top + H * dy; for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, rr = k % 2 ? s * .35 : s * 2.4; x.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } x.fill(); } x.restore(); }
      pencil(x, body, 5, 1.6, .8); },
    // a painted star (the prize of the patch's lucky holes and of the reward card)
    star(x, W, H) { const cx = W / 2, cy = H / 2, st = P(p => { for (let i = 0; i < 10; i++) { const a = -1.5708 + i * Math.PI / 5, r = i % 2 ? W * .2 : W * .44; i ? p.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r) : p.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } p.closePath(); });
      x.save(); x.filter = "blur(4px)"; x.translate(3, 5); x.fillStyle = "rgba(60,30,0,.25)"; x.fill(st); x.restore(); wash(x, st, "#f6c021", 1, { a: .6, layers: 5, rw: 3, cx, cy }); shade(x, st, "#f6a010", cx + W * .14, cy + H * .14, W * .25, H * .22, .4, 5); lift(x, st, cx - W * .12, cy - H * .14, W * .1, H * .07, .5); pencil(x, st, 2, 1.6, .8); },
    // the glass jar for the fireflies, with a cork and a string; the glow inside is the game's
    jar(x, W, H) { const cx = W / 2, glass = P(p => { p.moveTo(cx - W * .3, H * .2); p.bezierCurveTo(cx - W * .44, H * .3, cx - W * .44, H * .86, cx - W * .3, H * .95); p.lineTo(cx + W * .3, H * .95); p.bezierCurveTo(cx + W * .44, H * .86, cx + W * .44, H * .3, cx + W * .3, H * .2); p.closePath(); });
      x.save(); x.filter = "blur(6px)"; x.fillStyle = "rgba(0,0,20,.3)"; x.fill(ell(cx + 6, H * .96, W * .38, H * .03)); x.restore();
      wash(x, glass, "#bfe3f0", 1, { a: .18, layers: 4, rw: 4, rim: .35, cx, cy: H * .6 }); lift(x, glass, cx - W * .22, H * .45, W * .05, H * .2, .3, 0);
      x.save(); x.clip(glass); x.fillStyle = "rgba(255,255,255,.55)"; x.fillRect(cx - W * .28, H * .3, W * .04, H * .5); x.fillStyle = "rgba(255,255,255,.3)"; x.fillRect(cx + W * .2, H * .35, W * .025, H * .38); x.restore();
      const neck = P(p => p.rect(cx - W * .3, H * .14, W * .6, H * .07)); wash(x, neck, "#d6eef6", 2, { a: .35, layers: 3, rw: 2 }); pencil(x, neck, 3, 1.3, .7);
      const cork = P(p => { p.moveTo(cx - W * .24, H * .15); p.lineTo(cx - W * .2, H * .03); p.lineTo(cx + W * .2, H * .03); p.lineTo(cx + W * .24, H * .15); p.closePath(); }); wash(x, cork, "#c08a58", 4, { a: .6, layers: 4, rw: 2 }); gran(x, cork, "#5a3a1a", .4, 5, 120, 1.3); pencil(x, cork, 6, 1.4, .8);
      line(x, [[cx - W * .31, H * .175], [cx, H * .19], [cx + W * .31, H * .175]], "#8a5a3a", 3, .8); pencil(x, glass, 7, 1.7, .75); },
    // a lily pad seen low across the water, with its notch; variant 1 carries a flower
    pad(x, W, H, f, o) { const v = (o && o.v) || 0, cx = W / 2, cy = H * .6, rx = W * .46, ry = H * .32, nt = .2 + v * .7, pad = P(p => { p.moveTo(cx, cy); p.ellipse(cx, cy, rx, ry, 0, nt + .22, nt + 6.0832); p.closePath(); });
      x.save(); x.filter = "blur(5px)"; x.fillStyle = "rgba(10,50,70,.3)"; x.fill(ell(cx + 4, cy + 7, rx, ry * .9)); x.restore();
      wash(x, pad, v === 2 ? "#4c9a50" : "#5cae4a", 1 + v, { a: .6, layers: 5, rw: 3.5, cx, cy }); shade(x, pad, "#5cae4a", cx + rx * .3, cy + ry * .4, rx * .6, ry * .5, .35, 6);
      for (let i = 0; i < 7; i++) { const a = nt + .4 + i * .8; line(x, [[cx, cy], [cx + Math.cos(a) * rx * .5, cy + Math.sin(a) * ry * .5], [cx + Math.cos(a) * rx * .9, cy + Math.sin(a) * ry * .9]], "#2e6a2a", 1.8, .4); }
      lift(x, pad, cx - rx * .35, cy - ry * .3, rx * .25, ry * .2, .35, 0); pencil(x, pad, 3 + v, 1.6, .75);
      if (v === 1) { const fx = cx + rx * .25, fy = cy - ry * .2; for (let i = 0; i < 7; i++) { const a = -1.57 + (i - 3) * .42, pt = P(p => { p.moveTo(fx, fy); p.quadraticCurveTo(fx + Math.cos(a - .3) * 26, fy + Math.sin(a - .3) * 26, fx + Math.cos(a) * 38, fy + Math.sin(a) * 34); p.quadraticCurveTo(fx + Math.cos(a + .3) * 26, fy + Math.sin(a + .3) * 26, fx, fy); });
        wash(x, pt, i % 2 ? "#f6a8c8" : "#f48ab6", 20 + i, { a: .6, layers: 3, rw: 1.4, j: .6, cx: fx, cy: fy }); pencil(x, pt, 30 + i, 1.1, .6); } wash(x, ell(fx, fy - 4, 7, 5), "#f6c021", 40, { a: .8, layers: 2, rw: 1 }); } },
    reeds(x, W, H, f, o) { const v = (o && o.v) || 0, r = R(5 + v); for (let i = 0; i < 7; i++) { const bx = W * (.2 + r() * .6), lean = (r() - .5) * W * .5, top = H * (.08 + r() * .35); line(x, [[bx, H], [bx + lean * .3, H * .6], [bx + lean, top]], mix("#4e8a3a", "#7cb04a", r()), 5 + r() * 4, .85);
        if (i % 3 === 0) { const cat = ell(bx + lean * .97, top + 24, 8, 26, Math.atan2(lean, H) * -.3); wash(x, cat, "#7a4a2a", 10 + i, { a: .7, layers: 3, rw: 2 }); pencil(x, cat, 11 + i, 1.2, .7); } } },
    // twig nests in two halves, the back drawn under the charm and the front over it
    nestBack(x, W, H) { const cx = W / 2, cy = H * .5, b = ell(cx, cy, W * .44, H * .3); wash(x, b, "#5a3a24", 1, { a: .65, layers: 4, rw: 3, cx, cy }); shade(x, b, "#5a3a24", cx, cy + H * .1, W * .38, H * .18, .5, 6);
      for (let i = 0; i < 26; i++) { const r = R(10 + i), a = r() * 6.2832, L = W * (.12 + r() * .2); line(x, [[cx + Math.cos(a) * W * .3, cy + Math.sin(a) * H * .2 - 4], [cx + Math.cos(a + .6) * W * .38, cy + Math.sin(a + .6) * H * .25 - 4]], "#3a2414", 2, .45); void L; } },
    nestFront(x, W, H) { const cx = W / 2, cy = H * .5, f = P(p => { p.ellipse(cx, cy, W * .48, H * .44, 0, 0, Math.PI); p.lineTo(cx - W * .44, cy); p.ellipse(cx, cy + 2, W * .44, H * .18, 0, Math.PI, 0, true); p.closePath(); });
      x.save(); x.filter = "blur(5px)"; x.fillStyle = "rgba(40,20,30,.3)"; x.fill(ell(cx + 4, cy + H * .4, W * .46, H * .1)); x.restore();
      wash(x, f, "#a6784e", 1, { a: .6, layers: 5, rw: 3, cx, cy }); shade(x, f, "#a6784e", cx + W * .2, cy + H * .35, W * .4, H * .2, .38, 6);
      const r = R(3); x.save(); x.clip(f); for (let i = 0; i < 70; i++) { const yy = cy + r() * H * .45, a = (r() - .5) * .8, L = W * (.1 + r() * .25), sx = cx + (r() - .5) * W * .9; line(x, [[sx - Math.cos(a) * L / 2, yy - Math.sin(a) * L / 2], [sx, yy + (r() - .5) * 4], [sx + Math.cos(a) * L / 2, yy + Math.sin(a) * L / 2]], r() < .5 ? "#6a4426" : "#d9b07a", 1.6 + r() * 1.6, .55); } x.restore();
      for (let i = 0; i < 9; i++) { const rr = R(40 + i), a = Math.PI * (.05 + rr() * .9), sx = cx + Math.cos(a) * W * .46, sy = cy + Math.sin(a) * H * .4; line(x, [[sx, sy], [sx + Math.cos(a + 1.2) * 18, sy + Math.sin(a + 1.2) * 12]], "#6a4426", 2, .6); }
      pencil(x, f, 5, 1.6, .8); }
  };

  // ---------------------------------------------------------------- keyed pieces
  // key helper: values between two keys eased with a smoothstep, held keys with "h"
  const keyAt = (keys, f, prop) => { let a = keys[0], b = keys[keys.length - 1]; for (let i = 0; i < keys.length - 1; i++) if (f >= keys[i][0] && f <= keys[i + 1][0]) { a = keys[i]; b = keys[i + 1]; break; }
    const va = a[1][prop] ?? 0, vb = b[1][prop] ?? va; if (f >= b[0]) return vb; if (b[0] === a[0] || b[2] === "h") return va; let u = (f - a[0]) / (b[0] - a[0]); u = b[2] === "o" ? 1 - (1 - u) ** 2 : b[2] === "i" ? u * u : u * u * (3 - 2 * u); return va + (vb - va) * u; };
  // The mole, nine drawings: 0 looks, 1-2 the blink, 3-6 the laugh (head back, paws on the belly, shoulders shaking), 7-8 a smug grin with a wink.
  const MOLE_KEYS = [[0, { eye: 1, mo: 0, hx: 0, sh: 0, paw: 0 }], [1, { eye: .1, mo: 0 }, "h"], [2, { eye: 1 }],
    [3, { eye: .25, mo: .8, hx: -6, sh: -3, paw: 1 }], [4, { eye: .1, mo: 1, hx: -9, sh: 3, paw: 1 }], [5, { eye: .25, mo: .7, hx: -7, sh: -3, paw: 1 }], [6, { eye: .1, mo: 1, hx: -9, sh: 3, paw: 1 }],
    [7, { eye: 1, mo: .35, hx: 0, sh: 0, paw: 0, wink: 0 }], [8, { eye: 1, mo: .4, wink: 1 }, "h"]];
  function mole(x, W, H, f) { const k = (p) => keyAt(MOLE_KEYS, f, p), eye = k("eye"), mo = k("mo"), hx = k("hx"), sh = k("sh"), paw = k("paw"), wink = f === 8 ? 1 : 0;
    const cx = W / 2 + sh, cy = H * .62, body = P(p => { p.moveTo(cx - W * .34, H); p.bezierCurveTo(cx - W * .4, cy - H * .1, cx - W * .3, cy - H * .38, cx, cy - H * .4 + hx * .5); p.bezierCurveTo(cx + W * .3, cy - H * .38, cx + W * .4, cy - H * .1, cx + W * .34, H); p.closePath(); });
    wash(x, body, "#6e5a56", 1, { a: .6, layers: 5, rw: 3.5, cx, cy }); gran(x, body, "#2a1e1c", .25, 2, 340, 1.2); shade(x, body, "#6e5a56", cx + W * .18, cy + H * .1, W * .2, H * .35, .4, 6); lift(x, body, cx - W * .15, cy - H * .25, W * .06, H * .05, .3);
    const belly = ell(cx, cy + H * .2, W * .2, H * .2); wash(x, belly, "#b7a49a", 3, { a: .45, layers: 3, rw: 2, rim: .25 });
    const hy = cy - H * .2 + hx, snout = ell(cx, hy + H * .1, W * .1, H * .065); wash(x, snout, "#c6aaa0", 4, { a: .55, layers: 3, rw: 2 });
    const nose = ell(cx, hy + H * .055, W * .055, H * .04); wash(x, nose, "#e56a8a", 5, { a: .8, layers: 3, rw: 2, rim: .4 }); lift(x, nose, cx - 3, hy + H * .045, 4, 2.5, .6); pencil(x, nose, 6, 1.2, .8);
    for (const s of [-1, 1]) { const ex = cx + s * W * .1, ey = hy - H * .02; if (eye > .5 && !(wink && s > 0)) { x.fillStyle = "#22160f"; x.beginPath(); x.ellipse(ex, ey, W * .02, H * .026 * eye, 0, 0, 6.2832); x.fill(); x.fillStyle = "rgba(255,252,240,.95)"; x.beginPath(); x.arc(ex - 1.5, ey - 2.5, 1.8, 0, 6.2832); x.fill(); }
      else line(x, [[ex - W * .025, ey + 1], [ex, ey - 3], [ex + W * .025, ey + 1]], "#22160f", 3, .9); }
    if (mo > .05) { const m = ell(cx, hy + H * .155, W * .05 + mo * W * .02, H * .02 + mo * H * .04); wash(x, m, "#6a1e2a", 7, { a: .85, layers: 2, rw: 1.5 }); x.save(); x.clip(m); x.fillStyle = "#fffaf0"; x.fillRect(cx - 7, hy + H * .155 - H * .06, 14, H * .03); x.restore(); }
    else line(x, [[cx - W * .04, hy + H * .145], [cx, hy + H * .155], [cx + W * .04, hy + H * .145]], "#3a2220", 2.5, .8);
    for (const s of [-1, 1]) for (let i = -1; i <= 1; i++) line(x, [[cx + s * W * .08, hy + H * .1 + i * 5], [cx + s * W * .2, hy + H * .09 + i * 9]], "#2a1e1c", 1.4, .55);
    for (const s of [-1, 1]) { const px = cx + s * (paw ? W * .1 : W * .25), py = paw ? cy + H * .18 : cy + H * .08, pw = ell(px, py, W * .09, H * .06, s * .4); wash(x, pw, "#e8a0a8", 8 + s, { a: .7, layers: 3, rw: 2 }); for (let i = -1; i <= 1; i++) line(x, [[px + i * W * .03, py - H * .05], [px + i * W * .035, py - H * .085]], "#f6efe0", 3, .95); pencil(x, pw, 9 + s, 1.2, .7); }
    pencil(x, body, 10, 1.7, .8); }
  // The firefly, eight drawings of one wing beat; the lantern of its tail swells and dims over the beat
  const FLY_KEYS = [[0, { w: -.2, g: .7 }], [2, { w: .9, g: .85 }, "o"], [4, { w: -.25, g: 1 }, "i"], [6, { w: .85, g: .85 }, "o"], [8, { w: -.2, g: .7 }, "i"]];
  function firefly(x, W, H, f) { const w = keyAt(FLY_KEYS, f, "w"), g = keyAt(FLY_KEYS, f, "g"), cx = W * .5, cy = H * .52;
    const halo = x.createRadialGradient(cx, cy + H * .1, 0, cx, cy + H * .1, W * .48); halo.addColorStop(0, `rgba(240,255,150,${.75 * g})`); halo.addColorStop(.35, `rgba(220,255,120,${.3 * g})`); halo.addColorStop(1, "rgba(200,255,120,0)"); x.fillStyle = halo; x.fillRect(0, 0, W, H);
    for (const s of [-1, 1]) { const wing = ell(cx + s * W * .14, cy - H * .08 - w * H * .05, W * .17, H * .07, s * (.5 - w * .9)); x.save(); x.fillStyle = "rgba(230,240,255,.5)"; x.fill(wing); x.strokeStyle = SEPIA + ".55)"; x.lineWidth = 1.2; x.stroke(wing); x.restore(); }
    const tail = ell(cx, cy + H * .12, W * .085, H * .12); wash(x, tail, "#e8f86a", 1, { a: .8, layers: 3, rw: 2, rim: .2, cx, cy }); x.save(); x.globalAlpha = g; x.fillStyle = "rgba(255,255,220,.9)"; x.fill(ell(cx - 2, cy + H * .1, W * .04, H * .06)); x.restore();
    const body = ell(cx, cy - H * .02, W * .075, H * .1); wash(x, body, "#3a2e3a", 2, { a: .8, layers: 3, rw: 2 }); const head = ell(cx, cy - H * .14, W * .055, H * .05); wash(x, head, "#d8503a", 3, { a: .8, layers: 2, rw: 1.5 });
    for (const s of [-1, 1]) line(x, [[cx + s * 3, cy - H * .18], [cx + s * W * .08, cy - H * .28]], "#2a2028", 1.6, .8); pencil(x, body, 4, 1.1, .7); }
  // A ripple, eight drawings: two rings that open out and thin away
  function ripple(x, W, H, f) { const u = f / 7; for (const [d, a] of [[0, 1], [.28, .7]]) { const k = Math.max(0, Math.min(1, (u - d) / (1 - d))); if (k <= 0) continue; const rx = W * (.2 + .28 * k), ry = H * (.16 + .26 * k);
    x.save(); x.strokeStyle = `rgba(255,252,240,${(1 - k) * .85 * a})`; x.lineWidth = 5 * (1 - k) + 1; x.beginPath(); x.ellipse(W / 2, H / 2, rx, ry, 0, 0, 6.2832); x.stroke(); x.strokeStyle = `rgba(40,100,140,${(1 - k) * .35 * a})`; x.lineWidth = 2; x.beginPath(); x.ellipse(W / 2, H / 2 + 3, rx, ry, 0, 0, 6.2832); x.stroke(); x.restore(); } }
  // A splash, ten drawings: the crown jumps up, drops fall on arcs, the water closes; keyed drop heights
  const SPL_KEYS = [[0, { c: 0, d: 0 }], [2, { c: 1, d: .2 }, "o"], [5, { c: .55, d: .8 }], [9, { c: 0, d: 1 }, "i"]];
  function splash(x, W, H, f) { const c = keyAt(SPL_KEYS, f, "c"), d = keyAt(SPL_KEYS, f, "d"), cx = W / 2, by = H * .82;
    // the plume: a rounded column of water that rises and falls back, with a ring of curling lips at its foot
    if (c > .02) { const ph = H * .62 * c, pw = W * (.1 + .05 * (1 - c)), plume = P(p => { p.moveTo(cx - pw * 1.6, by); p.bezierCurveTo(cx - pw * 1.1, by - ph * .3, cx - pw * .9, by - ph * .8, cx, by - ph); p.bezierCurveTo(cx + pw * .9, by - ph * .8, cx + pw * 1.1, by - ph * .3, cx + pw * 1.6, by); p.closePath(); });
      wash(x, plume, "#8ccbe6", 1, { a: .5, layers: 4, rw: 2.5, rim: .35, cx, cy: by }); lift(x, plume, cx - pw * .4, by - ph * .55, pw * .35, ph * .25, .5, 0); x.save(); x.clip(plume); x.fillStyle = "rgba(255,255,255,.55)"; x.beginPath(); x.ellipse(cx - pw * .3, by - ph * .6, pw * .15, ph * .28, 0, 0, 6.2832); x.fill(); x.restore(); pencil(x, plume, 2, 1.2, .55);
      for (const s2 of [-1, 1]) for (let i = 0; i < 3; i++) { const bx = cx + s2 * W * (.14 + i * .08), h = H * .22 * c * (1 - i * .25), lipP = P(p => { p.moveTo(bx - s2 * 12, by); p.quadraticCurveTo(bx, by - h, bx + s2 * (14 + i * 4), by - h * .9); p.quadraticCurveTo(bx + s2 * 4, by - h * .55, bx + s2 * 10, by); p.closePath(); }); wash(x, lipP, "#a6daee", 5 + i + s2, { a: .55, layers: 3, rw: 1.6, rim: .3, cx: bx, cy: by }); pencil(x, lipP, 7 + i, 1, .45); } }
    for (let i = 0; i < 11; i++) { const r = R(10 + i), a = -1.57 + (r() - .5) * 2.4, v = .5 + r() * .5, px = cx + Math.cos(a) * W * .46 * d * v, py = by - H * .75 * v * d * (1 - d) * 2.2 + Math.sin(a + 1.57) * 0, s = (5 + r() * 5) * (1 - d * .4);
      if (d > .04 && d < .98) { const dr = P(p => { p.moveTo(px, py - s * 1.5); p.quadraticCurveTo(px + s, py, px, py + s); p.quadraticCurveTo(px - s, py, px, py - s * 1.5); }); wash(x, dr, "#7ec4e4", 20 + i, { a: .75, layers: 2, rw: 1.2, rim: .35, cx: px, cy: py }); x.fillStyle = "rgba(255,255,255,.85)"; x.beginPath(); x.arc(px - s * .25, py - s * .1, s * .25, 0, 6.2832); x.fill(); } }
    for (const [k, a] of [[0, .9], [.35, .6]]) { const e = Math.max(0, Math.min(1, (d - k) / (1 - k))); if (!e && d) continue; x.save(); x.strokeStyle = `rgba(255,252,240,${a * (1 - e * .8)})`; x.lineWidth = 3.5 * (1 - e * .6); x.beginPath(); x.ellipse(cx, by, W * (.2 + e * .26), H * (.04 + e * .05), 0, 0, 6.2832); x.stroke(); x.restore(); } }
  // The reward chest (2026-11-06, the story and rewards stage): an old wooden chest with iron bands and a brass lock, eight drawings of the lid
  // opening on hand-set keys: shut, a first pop against the lock, a creak, then up and back past upright with a little overshoot, and the gold
  // light inside spilling out. Seen from the front and a little above; the lid turns on its back hinge, so its face shortens and then shows its inside.
  const CHEST_KEYS = [[0, { o: 0, g: 0 }], [1, { o: .07, g: .15 }, "o"], [2, { o: .2, g: .3 }], [3, { o: .45, g: .55 }], [4, { o: .72, g: .8 }], [5, { o: .95, g: 1 }, "o"], [6, { o: 1.06, g: 1 }, "o"], [7, { o: 1, g: 1 }, "i"]];
  function chest(x, W, H, f) { const o = keyAt(CHEST_KEYS, f, "o"), g = keyAt(CHEST_KEYS, f, "g"), cx = W / 2, bw = W * .74, bh = H * .3, by = H * .86, top = by - bh, dep = H * .07, lh = H * .17;
    x.save(); x.filter = "blur(7px)"; x.fillStyle = "rgba(60,30,10,.32)"; x.fill(ell(cx + 8, by + 6, bw * .56, H * .045)); x.restore();
    const th = o * Math.PI * .62, c = Math.cos(th), sN = Math.sin(th), hingeY = top - dep * .6;
    // the open mouth of the box and the light in it (drawn first: the box front and the lid go over it)
    if (o > .01) { const mouth = P(p => { p.moveTo(cx - bw / 2 + 6, top + 2); p.lineTo(cx - bw / 2 + 16, hingeY + 2); p.lineTo(cx + bw / 2 - 16, hingeY + 2); p.lineTo(cx + bw / 2 - 6, top + 2); p.closePath(); });
      wash(x, mouth, "#3a2014", 1, { a: .8, layers: 3, rw: 2, rim: .2 }); x.save(); x.clip(mouth); const gl = x.createRadialGradient(cx, top, 2, cx, top, bw * .55); gl.addColorStop(0, `rgba(255,236,150,${.95 * g})`); gl.addColorStop(.5, `rgba(255,190,70,${.6 * g})`); gl.addColorStop(1, "rgba(255,160,40,0)"); x.fillStyle = gl; x.fillRect(0, 0, W, H); x.restore();
      // coins and a charm glint in the gold
      for (let i = 0; i < 7; i++) { const r = R(30 + i), px = cx + (r() - .5) * bw * .7, py = top - dep * .1 - r() * dep * .4; if (g < .3) continue; const cn = ell(px, py, 9, 5, (r() - .5) * .6); wash(x, cn, "#f2c23a", 31 + i, { a: .8 * g, layers: 2, rw: 1.2, rim: .35, j: .5 }); } }
    // the box: front face with planks, two iron bands and a shadow side
    const box = P(p => { p.moveTo(cx - bw / 2, top); p.lineTo(cx + bw / 2, top); p.lineTo(cx + bw / 2 - 4, by); p.lineTo(cx - bw / 2 + 4, by); p.closePath(); });
    wash(x, box, "#a8663a", 2, { a: .55, layers: 5, rw: 3, cx, cy: top + bh / 2 }); gran(x, box, "#5a2e14", .18, 3, 260, 1.3); shade(x, box, "#a8663a", cx + bw * .34, top + bh * .6, bw * .22, bh * .7, .4, 8); lift(x, box, cx - bw * .25, top + bh * .3, bw * .1, bh * .14, .35);
    for (let i = 1; i < 3; i++) line(x, [[cx - bw / 2 + 5, top + bh * i / 3], [cx, top + bh * i / 3 + 1.5], [cx + bw / 2 - 5, top + bh * i / 3]], "#5a2e14", 2, .55, 10 + i);
    for (const s of [-1, 1]) { const band = P(p => p.rect(cx + s * bw * .3 - 9, top, 18, bh)); wash(x, band, "#5a5a66", 20 + s, { a: .7, layers: 3, rw: 2, rim: .35 }); lift(x, band, cx + s * bw * .3 - 3, top + bh * .3, 3, bh * .2, .3, 0); for (const yy of [.2, .8]) { x.fillStyle = "rgba(40,36,44,.85)"; x.beginPath(); x.arc(cx + s * bw * .3, top + bh * yy, 2.6, 0, 6.2832); x.fill(); } pencil(x, band, 22 + s, 1.2, .7); }
    pencil(x, box, 4, 1.8, .85);
    // the lid: a rounded top seen from the front; it turns on the hinge: its face shortens (cos), and past upright its inside shows
    const face = lh * c, liftY = hingeY - (top - hingeY), lidBot = o < .01 ? top : hingeY + (top - hingeY) * c - lh * .0;
    if (c > 0.02) { const y1 = hingeY + (top - hingeY) * c, y0 = y1 - face - (dep * .9) * sN, lid = P(p => { p.moveTo(cx - bw / 2 - 3, y1); p.lineTo(cx - bw / 2 - 3, y0 + face * .45); p.bezierCurveTo(cx - bw / 2, y0 - face * .15, cx + bw / 2, y0 - face * .15, cx + bw / 2 + 3, y0 + face * .45); p.lineTo(cx + bw / 2 + 3, y1); p.closePath(); });
      wash(x, lid, "#b4703f", 5, { a: .55, layers: 5, rw: 3, cx, cy: (y0 + y1) / 2 }); gran(x, lid, "#5a2e14", .16, 6, 200, 1.2); shade(x, lid, "#b4703f", cx + bw * .3, y1 - face * .2, bw * .25, face * .6, .35, 7); lift(x, lid, cx - bw * .2, y0 + face * .3, bw * .14, Math.max(2, face * .14), .45);
      for (const s of [-1, 1]) { const band = P(p => { p.moveTo(cx + s * bw * .3 - 9, y1); p.lineTo(cx + s * bw * .3 - 9, y0 + face * .2); p.quadraticCurveTo(cx + s * bw * .3, y0 + face * .05, cx + s * bw * .3 + 9, y0 + face * .2); p.lineTo(cx + s * bw * .3 + 9, y1); p.closePath(); }); wash(x, band, "#5a5a66", 26 + s, { a: .7, layers: 3, rw: 2, rim: .35 }); pencil(x, band, 28 + s, 1.1, .65); }
      pencil(x, lid, 7, 1.8, .85); }
    else { const y1 = hingeY - (top - hingeY) * -c, inner = P(p => { const hh = lh * -c + dep * sN * .9; p.moveTo(cx - bw / 2 - 3, hingeY); p.lineTo(cx - bw / 2 - 3, hingeY - hh); p.bezierCurveTo(cx - bw / 2, hingeY - hh * 1.25, cx + bw / 2, hingeY - hh * 1.25, cx + bw / 2 + 3, hingeY - hh); p.lineTo(cx + bw / 2 + 3, hingeY); p.closePath(); }); void y1;
      wash(x, inner, "#6a3a20", 8, { a: .6, layers: 4, rw: 3 }); x.save(); x.clip(inner); const gl = x.createLinearGradient(0, hingeY, 0, hingeY - lh); gl.addColorStop(0, `rgba(255,214,110,${.55 * g})`); gl.addColorStop(1, "rgba(255,214,110,0)"); x.fillStyle = gl; x.fillRect(0, 0, W, H); x.restore(); pencil(x, inner, 9, 1.7, .8); }
    // the brass lock on the front of the box (the hasp lifts away with the lid)
    const lock = P(p => { p.moveTo(cx - 15, top + 4); p.lineTo(cx + 15, top + 4); p.lineTo(cx + 13, top + 34); p.quadraticCurveTo(cx, top + 42, cx - 13, top + 34); p.closePath(); });
    wash(x, lock, "#e0a630", 11, { a: .75, layers: 3, rw: 2, rim: .45 }); lift(x, lock, cx - 5, top + 13, 5, 6, .55, 0); x.fillStyle = "rgba(50,28,10,.9)"; x.beginPath(); x.arc(cx, top + 19, 3.4, 0, 6.2832); x.fill(); x.fillRect(cx - 1.3, top + 19, 2.6, 8); pencil(x, lock, 12, 1.3, .8);
    // the light that spills over the rim once the lid is up
    if (g > .2 && o > .4) { x.save(); x.globalCompositeOperation = "lighter"; const sp = x.createRadialGradient(cx, top - 6, 4, cx, top - 6, bw * .7); sp.addColorStop(0, `rgba(255,230,140,${.5 * g})`); sp.addColorStop(1, "rgba(255,200,80,0)"); x.fillStyle = sp; x.fillRect(0, 0, W, top + 20); x.restore();
      for (let i = 0; i < 5; i++) { const r = R(60 + i), a = -Math.PI / 2 + (r() - .5) * 1.6, L = H * (.18 + r() * .2) * g; line(x, [[cx + Math.cos(a) * 20, top - 8 + Math.sin(a) * 20], [cx + Math.cos(a) * L, top - 8 + Math.sin(a) * L]], "#fff1b0", 3, .5 * g); } }
    void liftY; void lidBot; }
  // the list the bake walks: [name, width, height, frames, painter, options]
  window.MINI_SHEETS = [
    ["bg-field", 780, 1300, 1, BG.field], ["bg-night", 780, 1300, 1, BG.night], ["bg-pond", 1560, 1300, 1, BG.pond], ["bg-tree", 780, 1300, 1, BG.tree],
    ["hole", 240, 150, 1, S.hole], ["lip", 240, 150, 1, S.lip], ["carrot", 170, 330, 1, S.carrot], ["gcarrot", 170, 330, 1, S.carrot, { gold: 1 }], ["star", 128, 128, 1, S.star],
    ["mole", 220, 230, 9, mole], ["jar", 300, 360, 1, S.jar], ["fly", 120, 120, 8, firefly],
    ["pad0", 340, 150, 1, S.pad, { v: 0 }], ["pad1", 340, 150, 1, S.pad, { v: 1 }], ["pad2", 340, 150, 1, S.pad, { v: 2 }], ["reeds0", 170, 440, 1, S.reeds, { v: 0 }], ["reeds1", 170, 440, 1, S.reeds, { v: 1 }],
    ["ripple", 320, 120, 8, ripple], ["splash", 280, 280, 10, splash], ["nestB", 280, 170, 1, S.nestBack], ["nestF", 280, 170, 1, S.nestFront], ["chest", 320, 320, 8, chest]];
  // paints one sheet: frames side by side (up to 10 a row)
  window.paintMini = function (name) { const sp = MINI_SHEETS.find(s => s[0] === name), [, w, h, n, fn, o] = sp, cols = Math.min(n, 10), rows = Math.ceil(n / cols), cv = document.createElement("canvas"); cv.width = w * cols; cv.height = h * rows; const X = cv.getContext("2d");
    for (let i = 0; i < n; i++) { const f = document.createElement("canvas"); f.width = w; f.height = h; const x = f.getContext("2d", { willReadFrequently: true }); x.lineJoin = "round"; x.lineCap = "round"; fn(x, w, h, i, o); X.drawImage(f, (i % cols) * w, Math.floor(i / cols) * h); }
    return { cv, n, cols, w, h }; };
})();
