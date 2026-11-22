// Board effects, drawn frame by frame (2026-10-28, İdris: "animasyonları aşırı detaylı ve profesyonel yap, bilgisayarımda geliştir, kaydet, onları kullan").
// Anime effect language instead of soft glows: an impact frame first, hard-edged shapes in flat colour with an ink line, shards that fly on an
// ease-out and spin, cel smoke in two tones that breaks up into smaller puffs instead of fading. Every effect is two layers:
//   fx-<name>.webp     ink, white and fixed colours (drawn on top)
//   fx-<name>-c.webp   a white mask of the parts that take the charm's colour (the game tints it, then draws the first layer over it)
// Keyed on a 24 fps timeline. The game draws them live at the display's rate (60 or 120 a second) with a fractional frame; held drawings
// (the impact frames, the boiling of the fireball, the speed streaks) still change on whole frames, the way they are drawn. bake-fx.cjs writes sheets for review.
(() => {
  const INK = "#1d1424", CREAM = "#fffaf1", SHADE = "#e3d6c4";
  const R = (n) => { let s = (n * 7919 + 104729) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  const eo = (u) => 1 - (1 - u) ** 3, ei = (u) => u * u * u, cl = (u) => Math.max(0, Math.min(1, u));
  function star(x, cx, cy, r1, r2, n, rot) { x.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); }
  function ink(x, w) { x.lineJoin = "round"; x.lineCap = "round"; x.lineWidth = w; x.strokeStyle = INK; x.stroke(); }
  // a shard: a long diamond; its colour goes on the mask, its ink and a white edge on the top layer
  function shard(L, M, cx, cy, a, len, wid) { const pts = [[len, 0], [0, wid], [-len * .6, 0], [0, -wid]].map(([px, py]) => [cx + px * Math.cos(a) - py * Math.sin(a), cy + px * Math.sin(a) + py * Math.cos(a)]);
    const path = (x) => { x.beginPath(); pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); };
    path(M); M.fillStyle = "#fff"; M.fill(); path(L); ink(L, Math.max(1.5, wid * .35)); L.beginPath(); L.moveTo(pts[3][0], pts[3][1]); L.lineTo(pts[0][0], pts[0][1]); L.strokeStyle = "rgba(255,255,255,.9)"; L.lineWidth = Math.max(1, wid * .25); L.stroke(); }
  // a cel puff: cream with a shade crescent and an ink line
  // a cel puff of smoke: lumps under one ink silhouette (the ink is stroked wide first, the fill covers its inner half), a shade on the lower side
  function puff(L, cx, cy, r, seed = 0) { if (r < 1.2) return; const q = R(seed + 1), lumps = [[0, 0, r], [-r * .62, r * .22, r * (.62 + q() * .12)], [r * .58, r * .18, r * (.58 + q() * .14)], [r * .2, -r * .42, r * (.5 + q() * .12)]];
    const all = (x) => { x.beginPath(); for (const [dx, dy, rr] of lumps) { x.moveTo(cx + dx + rr, cy + dy); x.arc(cx + dx, cy + dy, rr, 0, 7); } };
    all(L); L.lineWidth = Math.max(3, r * .3); L.strokeStyle = INK; L.lineJoin = "round"; L.stroke(); all(L); L.fillStyle = CREAM; L.fill();
    L.beginPath(); for (const [dx, dy, rr] of lumps) { L.moveTo(cx + dx + rr * .9, cy + dy + rr * .35); L.arc(cx + dx, cy + dy + rr * .35, rr * .62, 0, 7); } L.fillStyle = SHADE; L.fill(); }   // the shade is a smaller lump low in each lump: no clip, so it costs nothing on the phone
  function ring(L, M, cx, cy, r, w) { if (w <= .5) return; M.beginPath(); M.arc(cx, cy, r, 0, 7); M.lineWidth = w; M.strokeStyle = "#fff"; M.stroke(); if (w < 6) return; L.beginPath(); L.arc(cx, cy, r + w / 2, 0, 7); ink(L, 2.5); L.beginPath(); L.arc(cx, cy, Math.max(.5, r - w / 2), 0, 7); ink(L, 2.5); }
  const FX = {
    // a charm cleared: impact star, a ring of its colour, six shards, three puffs that split, a few twinkles
    pop: { n: 14, w: 192, h: 192, draw(L, M, f) { const c = 96, u = f / 13, rr = R(3);
      if (f <= 2) { const s = [1, .8, .45][Math.floor(f)]; star(L, c, c, 62 * s, 16 * s, 8, .2); L.fillStyle = "#fff"; L.fill(); ink(L, 3.5); }
      if (f >= 1 && f <= 6) { const k = (f - 1) / 5; ring(L, M, c, c, 26 + eo(k) * 52, 16 * (1 - k) + 2); }
      for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + .3 + rr() * .3, k = cl((f - 1) / 11), d = 18 + eo(k) * 70, s = 1 - ei(k); if (f >= 1 && s > .08) shard(L, M, c + Math.cos(a) * d, c + Math.sin(a) * d + k * k * 18, a + k * 3, 16 * s + 2, 7 * s + 1.5); }
      for (let i = 0; i < 3; i++) { const a = i * 2.1 + 1, k = cl((f - 2) / 11); if (f < 2 || k >= 1) continue; const d = 20 + eo(k) * 30, r = k < .45 ? 7 + k / .45 * 10 : 17 * (1 - (k - .45) / .55);
        if (k < .55) puff(L, c + Math.cos(a) * d, c + Math.sin(a) * d - k * 14, r, i); else { for (const s of [-1, 1]) puff(L, c + Math.cos(a + s * .35) * (d + 6), c + Math.sin(a + s * .35) * (d + 6) - k * 18, r * .62, i * 2 + s); } }
      for (let i = 0; i < 4; i++) { const k = (f - 3 - i) / 6; if (k <= 0 || k >= 1) continue; const a = i * 1.7 + .6, d = 50 + i * 8, s = Math.sin(k * Math.PI) * 9; star(L, c + Math.cos(a) * d, c + Math.sin(a) * d, s, s * .28, 4, 0); L.fillStyle = "#fff"; L.fill(); ink(L, 1.6); } } },
    // a bomb: one inverted impact frame, a white flash, a three-tone fireball that boils outward and breaks into smoke, a shock ring, flying chunks, speed lines
    blast: { n: 22, w: 384, h: 384, draw(L, M, f) { const c = 192, rr = R(11);
      if (f < 1) { L.beginPath(); L.arc(c, c, 168, 0, 7); L.fillStyle = INK; L.fill(); L.strokeStyle = "#fff"; L.lineCap = "round"; for (let i = 0; i < 26; i++) { const a = rr() * Math.PI * 2, r0 = 20 + rr() * 30; L.lineWidth = 2 + rr() * 5; L.beginPath(); L.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); L.lineTo(c + Math.cos(a) * 165, c + Math.sin(a) * 165); L.stroke(); } star(L, c, c, 70, 20, 8, .3); L.fillStyle = "#fff"; L.fill(); return; }
      if (f >= 1 && f < 2) { star(L, c, c, 150, 70, 12, .1); L.fillStyle = "#fff"; L.fill(); ink(L, 5); }
      if (f >= 1 && f <= 5) { L.strokeStyle = INK; L.lineCap = "round"; const r3 = R(20); for (let i = 0; i < 18; i++) { const a = r3() * Math.PI * 2, r0 = 120 + (f - 1) * 14 + r3() * 20; L.lineWidth = 2 + r3() * 4; L.beginPath(); L.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0); L.lineTo(c + Math.cos(a) * (r0 + 30 + r3() * 25), c + Math.sin(a) * (r0 + 30 + r3() * 25)); L.stroke(); } }
      if (f >= 2 && f <= 9) { const k = (f - 2) / 7; ring(L, M, c, c, 70 + eo(k) * 110, 22 * (1 - k) + 2); }
      // fireball: three tones, each one silhouette; the outer one carries the ink line. It swells fast, boils, then sinks back into the smoke.
      if (f >= 2 && f <= 13) { const k = (f - 2) / 11, grow = eo(Math.min(1, k * 2)), shrink = k > .55 ? ei((k - .55) / .45) : 0, R0 = (54 + grow * 56) * (1 - shrink * .85), rl = R(5);
        const blob = (x, rad, rise) => { const q = R(5); x.beginPath(); for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9 + k * .8, off = rad * .55, rr2 = rad * (.5 + q() * .18); x.moveTo(c + Math.cos(a) * off + rr2, c + Math.sin(a) * off - rise); x.arc(c + Math.cos(a) * off, c + Math.sin(a) * off - rise, rr2, 0, 7); } x.moveTo(c + rad * .8, c - rise); x.arc(c, c - rise, rad * .8, 0, 7); };
        const rise = shrink * 30; blob(L, R0, rise); L.lineWidth = 9; L.strokeStyle = INK; L.lineJoin = "round"; L.stroke(); blob(L, R0, rise); L.fillStyle = "#ff7a2a"; L.fill();
        if (shrink < .7) { blob(L, R0 * .72, rise + 4); L.fillStyle = "#ffc23a"; L.fill(); } if (shrink < .4) { blob(L, R0 * .4, rise + 8); L.fillStyle = "#fff6c8"; L.fill(); } void rl; }
      // smoke takes over: nine puffs of different sizes that drift up, split and shrink
      { const rs = R(17); for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9 + rs() * .5, k = cl((f - 7 - rs() * 2) / 13), big = 22 + rs() * 18, dd = 60 + rs() * 50; if (f < 7 || k <= 0 || k >= 1) continue; const d = 50 + eo(k) * dd, r = (k < .3 ? big * (.5 + k / .3 * .5) : big * (1 - (k - .3) / .7)), y = c + Math.sin(a) * d * .8 - k * (40 + i * 4);
        if (k < .6) puff(L, c + Math.cos(a) * d, y, r, i + 30); else for (const s2 of [-1, 1]) puff(L, c + Math.cos(a) * d + s2 * r * .7, y - 6, r * .6, i * 3 + s2 + 40); } }
      // chunks
      for (let i = 0; i < 10; i++) { const a = rr() * Math.PI * 2, sp = 120 + rr() * 80, k = cl((f - 2) / 14); if (f < 2 || k >= 1) continue; const d = eo(k) * sp, s = 1 - ei(k); shard(L, M, c + Math.cos(a) * (40 + d), c + Math.sin(a) * (40 + d) + k * k * 60, a + k * 6, 22 * s + 3, 9 * s + 2); } } },
    // a line charm: a spark at the start, the beam shoots out both ways with speed streaks, then thins and breaks into dashes and twinkles
    beam: { n: 16, w: 1024, h: 128, draw(L, M, f) { const c = 512, cy = 64, rr = R(7);
      if (f <= 2) { const s = [1, .85, .5][Math.floor(f)]; star(L, c, cy, 60 * s, 14 * s, 8, .2); L.fillStyle = "#fff"; L.fill(); ink(L, 3.5); }
      const ext = eo(cl(f / 5)) * 500, th = f < 6 ? 22 + (f / 6) * 14 : 36 * (1 - cl((f - 6) / 8));
      if (th > 1 && f < 14) { const tip = th * 1.6, body = (x) => { x.beginPath(); x.moveTo(c - ext - tip, cy); x.lineTo(c - ext, cy - th); x.lineTo(c + ext, cy - th); x.lineTo(c + ext + tip, cy); x.lineTo(c + ext, cy + th); x.lineTo(c - ext, cy + th); x.closePath(); };
        body(M); M.fillStyle = "#fff"; M.fill(); body(L); ink(L, 4);
        L.beginPath(); L.moveTo(c - ext, cy - th * .3); L.lineTo(c + ext, cy - th * .3); L.lineTo(c + ext + tip * .5, cy); L.lineTo(c + ext, cy + th * .3); L.lineTo(c - ext, cy + th * .3); L.lineTo(c - ext - tip * .5, cy); L.closePath(); L.fillStyle = "#fff"; L.fill();
        L.strokeStyle = "rgba(255,255,255,.95)"; L.lineCap = "round"; const r2 = R(9); for (let i = 0; i < 10; i++) { const sd = r2() - .5, sx = Math.max(-1, Math.min(1, sd * 2 + f * .08 * Math.sign(sd))) * ext, yy = cy + (r2() - .5) * th * 1.6, l = 30 + r2() * 60; L.lineWidth = 2 + r2() * 2; L.beginPath(); L.moveTo(c + sx, yy); L.lineTo(c + sx + Math.sign(sx || 1) * l, yy); L.stroke(); } }
      if (f >= 8) { const k = (f - 8) / 7; for (let i = 0; i < 14; i++) { const sx = c + (i - 6.5) * 72 + (rr() - .5) * 20, s = (1 - k) * (6 + rr() * 6); if (s < 1) continue; if (i % 2) { star(L, sx, cy + (rr() - .5) * 40, s * 1.6, s * .45, 4, 0); L.fillStyle = "#fff"; L.fill(); ink(L, 1.6); } else { L.beginPath(); L.ellipse(sx, cy + (rr() - .5) * 30, s * 2.2, s * .8, 0, 0, 7); M.beginPath(); M.ellipse(sx, cy + (rr() - .5) * 30, s * 2.2, s * .8, 0, 0, 7); M.fillStyle = "#fff"; M.fill(); ink(L, 1.6); } } } } },
    // a special charm made, or a gift: a ring of its colour and three gold twinkles that pop in turn
    twinkle: { n: 16, w: 160, h: 160, draw(L, M, f) { const c = 80;
      if (f <= 7) { const k = f / 7; ring(L, M, c, c, 22 + eo(k) * 44, 12 * (1 - k) + 1.5); }
      [[c, c, 0, 40], [c - 38, c - 30, 3, 22], [c + 36, c - 22, 6, 26]].forEach(([x0, y0, d, r]) => { const k = (f - d) / 9; if (k <= 0 || k >= 1) return; const s = (k < .3 ? eo(k / .3) * 1.15 : 1.15 - (k - .3) / .7 * 1.15) * r; if (s < 2) return; star(L, x0, y0, s, s * .26, 4, k * .4); L.fillStyle = "#ffe066"; L.fill(); ink(L, 2.5); star(L, x0, y0, s * .45, s * .12, 4, k * .4); L.fillStyle = "#fff"; L.fill(); }); } },
    // the colour charm: rainbow ribbons wind inward, the centre pops, stars spray out
    whirl: { n: 24, w: 384, h: 384, draw(L, M, f) { const c = 192, cols = ["#ff5a6a", "#ffa63a", "#ffe04a", "#6ad860", "#4ab0ff", "#a070ff"];
      if (f < 14) { const k = f / 13; cols.forEach((col, i) => { const a0 = i * Math.PI / 3 + k * 5, r0 = 110 * (1 - eo(k)) + 20; L.beginPath(); for (let s = 0; s <= 20; s++) { const t = s / 20, a = a0 + t * 2.2, r = r0 + t * 40 * (1 - k); L.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } L.lineWidth = 18 * (1 - k * .5) + 4; L.strokeStyle = INK; L.lineCap = "round"; L.stroke(); L.lineWidth = 18 * (1 - k * .5); L.strokeStyle = col; L.stroke(); }); }
      if (f >= 12 && f <= 16) { const s = [1, 1.25, 1.1, .7, .3][Math.floor(f) - 12]; star(L, c, c, 110 * s, 30 * s, 8, .2); L.fillStyle = "#fff"; L.fill(); ink(L, 4); }
      if (f >= 13) { const k = (f - 13) / 10, rr = R(4); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + rr() * .3, d = 40 + eo(k) * 150, s = (1 - ei(k)) * (16 + rr() * 10); if (s < 1.5) continue; star(L, c + Math.cos(a) * d, c + Math.sin(a) * d, s, s * .3, 4, k); L.fillStyle = cols[i % 6]; L.fill(); ink(L, 2); }
        const kr = cl(k * 2); ring(L, M, c, c, 60 + eo(kr) * 120, 18 * (1 - kr) + 1); } } },
    // a swap that does not match: a red cross pops and shakes
    nope: { n: 10, w: 128, h: 128, draw(L, M, f) { const c = 64, s = f < 3 ? eo(f / 2) * 1.2 : f < 5 ? 1.2 - (f - 3) * .1 : 1 - (f - 5) / 5 * .9, sh = f >= 2 && f <= 6 ? (Math.floor(f) % 2 ? 6 : -6) : 0;
      if (s <= .1) return; L.save(); L.translate(c + sh, c); L.rotate(.1); L.scale(s, s); for (const a of [Math.PI / 4, -Math.PI / 4]) { L.save(); L.rotate(a); L.beginPath(); L.roundRect(-34, -10, 68, 20, 8); L.fillStyle = "#ff3b5a"; L.fill(); ink(L, 4); L.restore(); } L.beginPath(); L.roundRect(-34, -10, 68, 20, 8); L.restore(); } },
  };
  // ---------- kingdoms (2026-11-23, İdris: "her 50 seviye bir krallık, her birinin animasyonları kendine has olsun") ----------
  // pop0..pop9 replace `pop` 1:1 (same box, same length); combo0..combo9 are a larger flourish for a chain. Index: 0 forest, 1 water, 2 fire,
  // 3 ice, 4 air, 5 sand, 6 crystal, 7 night, 8 storm, 9 star. Same two layers, same hand: an impact drawing held on whole frames, pieces on eases.
  const TAU = Math.PI * 2, hold = (f, a) => a[Math.max(0, Math.min(a.length - 1, Math.floor(f)))], sc2 = (s) => Array.isArray(s) ? s : [s, s];
  const back = (u) => { u = cl(u) - 1; return u * u * (2.70158 * u + 1.70158) + 1; };   // ease-out that overshoots, for things that pop open
  const K = (n, w, h, d) => ({ n, w, h, draw(L, M, f) { L.save(); M.save(); try { d(L, M, f); } finally { L.restore(); M.restore(); } } });
  const at = (x, cx, cy, rot, s, path) => { const [sx, sy] = sc2(s); x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(sx || 1e-3, sy || 1e-3); x.beginPath(); path(x); x.restore(); };
  // a piece in the charm's colour (mask) with an ink line; a piece in a fixed colour with an ink line
  const tint = (L, M, cx, cy, rot, s, path, lw = 2.5) => { at(M, cx, cy, rot, s, path); M.fillStyle = "#fff"; M.fill(); at(L, cx, cy, rot, s, path); ink(L, lw); };
  const flat = (L, cx, cy, rot, s, path, col, lw = 2.5) => { at(L, cx, cy, rot, s, path); L.fillStyle = col; L.fill(); if (lw) ink(L, lw); };
  const loc = (cx, cy, rot, s) => (px, py) => [cx + (px * Math.cos(rot) - py * Math.sin(rot)) * s, cy + (px * Math.sin(rot) + py * Math.cos(rot)) * s];
  const pen = (L, pts, w, col = INK) => { L.beginPath(); pts.forEach(([px, py], i) => i ? L.lineTo(px, py) : L.moveTo(px, py)); L.lineCap = "round"; L.lineJoin = "round"; L.lineWidth = w; L.strokeStyle = col; L.stroke(); };
  const pen2 = (L, pts, w, col) => { pen(L, pts, w + 4); pen(L, pts, w, col); };   // a coloured line with an ink edge
  const poly = (pts) => (x) => { pts.forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); };
  const mirror = (r) => poly(r.concat(r.slice(1, -1).reverse().map(([px, py]) => [-px, py])));
  // a tapered brush stroke as a closed shape: centre line points [x, y, half width]
  const brush = (pts) => (x) => { const l = [], r = []; for (let i = 0; i < pts.length; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1, w = pts[i][2]; l.push([pts[i][0] - dy / m * w, pts[i][1] + dx / m * w]); r.push([pts[i][0] + dy / m * w, pts[i][1] - dx / m * w]); }
    l.concat(r.reverse()).forEach(([px, py], i) => i ? x.lineTo(px, py) : x.moveTo(px, py)); x.closePath(); };
  const S = {
    dot: (x) => { x.arc(0, 0, 1, 0, 7); },
    leaf: (x) => { x.moveTo(-1, 0); x.quadraticCurveTo(0, -.95, 1, 0); x.quadraticCurveTo(0, .95, -1, 0); x.closePath(); },
    petal: (x) => { x.moveTo(0, 0); x.bezierCurveTo(.4, -.75, 1.25, -.5, 1.2, 0); x.bezierCurveTo(1.25, .5, .4, .75, 0, 0); x.closePath(); },
    drop: (x) => { x.moveTo(-1.5, 0); x.lineTo(.064, -.584); x.arc(.2, 0, .6, -1.8, 1.8); x.closePath(); },
    flame: (x) => { x.moveTo(.1, -1.6); x.bezierCurveTo(.1, -.9, .85, -.5, .75, .25); x.bezierCurveTo(.7, .95, -.7, .95, -.75, .25); x.bezierCurveTo(-.8, -.25, -.25, -.4, -.3, -.95); x.bezierCurveTo(-.1, -.8, 0, -1.2, .1, -1.6); x.closePath(); },
    feather: (x) => { x.moveTo(-1.2, 0); x.quadraticCurveTo(-.4, -.6, .5, -.4); x.lineTo(.35, -.14); x.quadraticCurveTo(.9, -.32, 1.25, 0); x.quadraticCurveTo(.6, .52, .1, .44); x.lineTo(0, .2); x.quadraticCurveTo(-.6, .5, -1.2, 0); x.closePath(); },
    fish: (x) => { x.moveTo(1, 0); x.bezierCurveTo(.5, -.6, -.5, -.45, -.9, -.06); x.lineTo(-1.55, -.55); x.lineTo(-1.35, 0); x.lineTo(-1.55, .55); x.lineTo(-.9, .06); x.bezierCurveTo(-.5, .45, .5, .6, 1, 0); x.closePath(); },
    moon: (t) => (x) => { x.moveTo(.62, .78); x.arc(0, 0, 1, .9, TAU - .9); x.quadraticCurveTo(-1.4 - t, 0, .62, .78); x.closePath(); },
    gem: poly([[1.3, 0], [.25, .55], [-.9, .3], [-.7, -.3], [.3, -.55]]),
    bolt: poly([[-.2, -1.5], [.55, -1.5], [.1, -.3], [.62, -.3], [-.38, 1.5], [-.05, .2], [-.58, .2]]),
    diamond: poly([[1, 0], [0, .5], [-1, 0], [0, -.5]]),
    kite: poly([[0, -1.2], [.78, -.2], [0, 1.3], [-.78, -.2]]),
    tri: poly([[1, 0], [-.7, .8], [-.7, -.8]]),
    sq: poly([[1, 0], [0, 1], [-1, 0], [0, -1]]),
  };
  const bat = (up) => mirror(up ? [[0, -.2], [.14, -.58], [.3, -.2], [1, -.9], [1.55, -.3], [1.15, -.12], [.85, .2], [.55, 0], [.28, .38], [0, .28]] : [[0, -.2], [.14, -.58], [.3, -.2], [.95, -.15], [1.4, .55], [1.02, .4], [.78, .65], [.52, .3], [.28, .48], [0, .28]]);
  // cel smoke in any two tones, and the same smoke on a little life of its own: it swells, drifts on an ease-out, splits in two and is gone
  function puffC(L, cx, cy, r, seed, fill, shade) { if (r < 1.2) return; const q = R(seed + 1), ls = [[0, 0, r], [-r * .62, r * .22, r * (.62 + q() * .12)], [r * .58, r * .18, r * (.58 + q() * .14)], [r * .2, -r * .42, r * (.5 + q() * .12)]];
    const all = (k, o) => { L.beginPath(); for (const [dx, dy, rr] of ls) { L.moveTo(cx + dx + rr * k, cy + dy + rr * o); L.arc(cx + dx, cy + dy + rr * o, rr * k, 0, 7); } };
    all(1, 0); L.lineWidth = Math.max(3, r * .3); L.strokeStyle = INK; L.lineJoin = "round"; L.stroke(); all(1, 0); L.fillStyle = fill; L.fill(); all(.62, .35); L.fillStyle = shade; L.fill(); }
  const drift = (L, f, f0, dur, x, y, dx, dy, big, seed, fill = CREAM, shade = SHADE) => { const k = cl((f - f0) / dur); if (f < f0 || k >= 1) return; const r = k < .35 ? big * (.45 + k / .35 * .55) : big * (1 - (k - .35) / .65), px = x + eo(k) * dx, py = y + eo(k) * dy;
    if (k < .6) puffC(L, px, py, r, seed, fill, shade); else for (const s of [-1, 1]) puffC(L, px + s * r * .75, py - 5, r * .6, seed * 2 + s + 3, fill, shade); };
  // a burst of dust or cloud: a ring of lumps under one ink silhouette
  function lumps(L, cx, cy, r, n, seed, fill, shade, rot = 0) { const q = R(seed), ls = [[0, 0, r * .72]]; for (let i = 0; i < n; i++) { const a = rot + i * TAU / n + (q() - .5) * .5, d = r * (.56 + q() * .2); ls.push([Math.cos(a) * d, Math.sin(a) * d, r * (.26 + q() * .2)]); }
    const all = (k, o) => { L.beginPath(); for (const [dx, dy, rr] of ls) { L.moveTo(cx + dx + rr * k, cy + dy + o); L.arc(cx + dx, cy + dy + o, rr * k, 0, 7); } };
    all(1, 0); L.lineWidth = Math.max(4, r * .14); L.strokeStyle = INK; L.lineJoin = "round"; L.stroke(); all(1, 0); L.fillStyle = fill; L.fill(); L.beginPath(); for (const [dx, dy, rr] of ls) if (dy >= 0) { L.moveTo(cx + dx + rr * .6, cy + dy + rr * .3); L.arc(cx + dx, cy + dy + rr * .3, rr * .6, 0, 7); } L.fillStyle = shade; L.fill(); }
  // n pieces thrown from a point: out on an ease-out, shrinking on an ease-in, with some gravity. cb(x, y, angle, size 1..0, k, i)
  const burst = (f, cx, cy, n, f0, dur, seed, d0, d1, grav, cb) => { const q = R(seed); for (let i = 0; i < n; i++) { const a = i * TAU / n + q() * .5 + seed, sp = d1 * (.75 + q() * .25), k = cl((f - f0) / dur); if (f < f0 || k >= 1) continue; const d = d0 + eo(k) * sp, s = 1 - ei(k); if (s > .06) cb(cx + Math.cos(a) * d, cy + Math.sin(a) * d + k * k * grav, a, s, k, i); } };
  // a star whose points lean and curl one way: fire
  function flameStar(x, cx, cy, r, n, rot) { x.beginPath(); for (let i = 0; i < n; i++) { const a = rot + i * TAU / n, b = a + TAU / n, P = (an, rr) => [cx + Math.cos(an) * rr, cy + Math.sin(an) * rr]; if (!i) x.moveTo(...P(a, r * .45)); x.quadraticCurveTo(...P(a + .05, r * .8), ...P(a + .35, r)); x.quadraticCurveTo(...P(a + .5, r * .5), ...P(b, r * .45)); } x.closePath(); }
  const fire3 = (L, x, y, r, rot) => { flameStar(L, x, y, r, 7, rot); L.fillStyle = "#ff7a2a"; L.fill(); ink(L, 3.5); flameStar(L, x, y, r * .68, 7, rot + .2); L.fillStyle = "#ffc23a"; L.fill(); flameStar(L, x, y, r * .36, 7, rot + .4); L.fillStyle = "#fff6c8"; L.fill(); };
  const wstar = (L, x, y, r1, r2, n, rot, lw = 3, col = "#fff") => { star(L, x, y, r1, r2, n, rot); L.fillStyle = col; L.fill(); ink(L, lw); };
  // a splash crown in the charm's colour with white beads over its points, and the flat ripple under it
  const crownP = (x) => { x.moveTo(-44, 4); x.quadraticCurveTo(-50, -14, -56, -34); x.quadraticCurveTo(-40, 0, -30, -56); x.quadraticCurveTo(-15, -4, 0, -66); x.quadraticCurveTo(15, -4, 30, -56); x.quadraticCurveTo(40, 0, 56, -34); x.quadraticCurveTo(50, -14, 44, 4); x.quadraticCurveTo(0, 18, -44, 4); x.closePath(); };
  const crown = (L, M, cx, cy, s, up, wd) => { if (up < .06) return; tint(L, M, cx, cy, 0, [s * wd, s * up], crownP, 3); flat(L, cx, cy + 3 * s, 0, [34 * s * wd, 5 * s * Math.min(1, up * 2)], S.dot, "#fff", 2); for (const [tx, ty] of [[-56, -34], [-30, -56], [0, -66], [30, -56], [56, -34]]) flat(L, cx + tx * s * wd * 1.08, cy + (ty - 11) * s * up, 0, 4.5 * s * Math.min(1, up * 1.5), S.dot, "#fff", 2); };
  const ripple = (L, M, cx, cy, rx, w) => { if (w < .6) return; M.beginPath(); M.ellipse(cx, cy, rx, rx * .34, 0, 0, 7); M.lineWidth = w; M.strokeStyle = "#fff"; M.stroke(); if (w > 4) for (const o of [w / 2, -w / 2]) { L.beginPath(); L.ellipse(cx, cy, rx + o, Math.max(.5, rx * .34 + o), 0, 0, 7); ink(L, 2); } };
  const gonRing = (L, M, cx, cy, r, w, n, rot, r2 = r) => { if (w < .6) return; star(M, cx, cy, r, r2, n, rot); M.lineJoin = "miter"; M.lineWidth = w; M.strokeStyle = "#fff"; M.stroke(); if (w > 4) for (const o of [w / 2, -w / 2]) { star(L, cx, cy, r + o, r2 + o, n, rot); ink(L, 2); } };
  const SAND = "#f2d28c", SAND2 = "#d8a85c", GOLD = "#ffd84a", MOON = "#ffe9a8", NIGHT = "#2b2350", VIOLET = "#5a3fc0", PRISM = ["#ff6a8a", "#ffe04a", "#5ad0ff"];
  Object.assign(FX, {
    // forest: a seed pod bursts on a rosette of leaves; leaves in the charm's colour tumble out with green ones and a few petals
    pop0: K(14, 192, 192, (L, M, f) => { const c = 96;
      if (f < 3) { const s = hold(f, [1, .84, .5]); for (let i = 0; i < 5; i++) { const a = i * TAU / 5 - 1.1; flat(L, c + Math.cos(a) * 36 * s, c + Math.sin(a) * 36 * s, a, [32 * s, 17 * s], S.leaf, "#fff", 3.2); } }
      burst(f, c, c, 5, 1, 11, 2, 20, 50, 16, (x, y, a, s, k, i) => { const r = a + k * (i % 2 ? 4 : -3), l = 20 * s + 3; tint(L, M, x, y, r, [l, l * .62], S.leaf, 2.2); pen(L, [[x - Math.cos(r) * l * .7, y - Math.sin(r) * l * .7], [x + Math.cos(r) * l * .5, y + Math.sin(r) * l * .5]], 1.4); });
      burst(f, c, c, 3, 2, 10, 5, 14, 46, 22, (x, y, a, s, k) => flat(L, x, y, a - k * 5, [12 * s + 2, 7 * s + 1], S.leaf, "#6fcf4f", 2));
      burst(f, c, c, 4, 1, 9, 9, 10, 34, -8, (x, y, a, s, k) => flat(L, x, y, a + k * 7, 10 * s + 1, S.petal, "#ffd9e6", 1.8));
      { const k = cl(f / 9), s = 14 * (1 - ei(k)); if (s > 1.5) for (const d of [-1, 1]) flat(L, c + d * (2 + eo(k) * 40), c - eo(k) * 30 + k * k * 46, d * (.2 + k * 3), s, (x) => { x.arc(0, 0, 1, -Math.PI / 2, Math.PI / 2, d < 0); x.closePath(); }, "#a86b3c", 2.5); } }),
    // water: a crown splash rises and sinks into its ripple, droplets with ink rims arc away, foam beads
    pop1: K(14, 192, 192, (L, M, f) => { const c = 96, by = c + 20;
      if (f >= 1 && f < 9.5) { const k = (f - 1) / 8.5; ripple(L, M, c, by, 22 + eo(k) * 60, 9 * (1 - k) + 1); }
      if (f < 7) crown(L, M, c, by, 1, f < 3 ? hold(f, [.7, 1, 1.08]) : 1.08 * (1 - ei((f - 3) / 4)), 1 + cl(f / 6) * .22);
      burst(f, c, c, 6, 2, 10, 4, 14, 48, 26, (x, y, a, s, k) => { const r = Math.atan2(Math.sin(a) * (1 - k) + k * 1.2, Math.cos(a) * (1 - k * .6)); tint(L, M, x, y, r, 12 * s + 2, S.drop, 2.2); flat(L, x - 2.5 * s, y - 3 * s, 0, 2.8 * s + .4, S.dot, "#fff", 0); });
      burst(f, c, by, 5, 1, 8, 8, 16, 34, 12, (x, y, a, s) => flat(L, x, y - 14, 0, 5 * s + 1, S.dot, "#fff", 1.8)); }),
    // fire: a three-tone flame star, a lick in the charm's colour that rises, sways on whole frames and thins, embers that climb, two soot puffs
    pop2: K(14, 192, 192, (L, M, f) => { const c = 96;
      for (const d of [-1, 1]) drift(L, f, 4, 8.5, c + d * 20, c - 14, d * 12, -40, 13, d + 3, "#8a7890", "#5e4f68");
      if (f < 3) fire3(L, c, c, 72 * hold(f, [1, .86, .5]), Math.floor(f) * .3);
      burst(f, c, c, 7, 2, 10, 3, 16, 48, -22, (x, y, a, s, k, i) => i % 2 ? tint(L, M, x, y, Math.sin(i + Math.floor(f)) * .35, 10 * s + 2, S.flame, 2) : flat(L, x, y, a + k * 4, 9 * s + 2, S.diamond, "#ffc23a", 1.8));
      if (f >= 1 && f < 10) { const k = (f - 1) / 9, g = k < .3 ? eo(k / .3) : 1, thin = k < .3 ? 1 : 1 - ei((k - .3) / .7), sway = hold(f, [0, .18, -.2, .24, -.18, .22, -.24, .16, -.1, 0]), y = c + 20 - eo(k) * 34;
        tint(L, M, c, y, sway, [30 * g * thin, 32 * g * (.55 + thin * .45)], S.flame, 3); if (thin > .3) flat(L, c, y + 6, sway, [16 * g * thin, 17 * g], S.flame, "#ffc23a", 0); if (thin > .6) flat(L, c, y + 11, sway, [7.5 * g * thin, 8.5 * g], S.flame, "#fff6c8", 0); } }),
    // ice: a thin six-point crack star with crack lines, a hexagon ring, flat shards that skate straight out without tumbling, frost ticks
    pop3: K(14, 192, 192, (L, M, f) => { const c = 96, up = -Math.PI / 2;
      if (f >= 1 && f < 7.5) { const k = (f - 1) / 6.5; gonRing(L, M, c, c, 24 + eo(k) * 50, 11 * (1 - k) + 1, 3, up); }
      if (f < 3) { const s = hold(f, [1, .88, .5]); wstar(L, c, c, 84 * s, 10 * s, 6, up, 3); wstar(L, c, c, 32 * s, 19 * s, 6, up + Math.PI / 6, 2.5, "#bfe8ff"); }
      if (f < 4) for (let i = 0; i < 6; i++) { const a = up + Math.PI / 6 + i * Math.PI / 3, n = 2 + Math.floor(f), pts = []; for (let j = 0; j <= n; j++) { const r = 24 + j * 11, o = (j % 2 ? 5 : -5) * (j && j < n ? 1 : 0); pts.push([c + Math.cos(a) * r - Math.sin(a) * o, c + Math.sin(a) * r + Math.cos(a) * o]); } pen2(L, pts, 2, "#fff"); }
      burst(f, c, c, 6, 1, 11, 7, 18, 56, 0, (x, y, a, s, k, i) => { const l = 19 * s + 3, r = a + (i % 2 ? .5 : -.4) + k * .4, sy = l * (.55 + i % 3 * .15); tint(L, M, x, y, r, [l, sy], poly([[1.2, 0], [-.2, .7], [-1, .1], [-.5, -.6]]), 2.2); at(L, x, y, r, [l, sy], poly([[1.2, 0], [-.5, -.6], [-.1, -.08]])); L.fillStyle = "rgba(255,255,255,.85)"; L.fill(); });
      for (let i = 0; i < 5; i++) { const k = (f - 3 - i * 1.2) / 5; if (k <= 0 || k >= 1) continue; const a = i * 1.26 + .5, d = 50 + (i % 2) * 22, x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, s = Math.sin(k * Math.PI) * 11; for (const w of [[5.4, INK], [2.4, "#fff"]]) for (let j = 0; j < 3; j++) { const b = j * Math.PI / 3 + .26; pen(L, [[x - Math.cos(b) * s, y - Math.sin(b) * s], [x + Math.cos(b) * s, y + Math.sin(b) * s]], w[0], w[1]); } } }),
    // air: a twist of four wind strokes that spins outward and closes, three small clouds puffing apart, a feather rocking down
    pop4: K(14, 192, 192, (L, M, f) => { const c = 96;
      [[2.1, 26, -16], [4.2, -24, -12], [.4, 6, 24]].forEach(([a, dx, dy], i) => drift(L, f, 1.5, 10.5, c + Math.cos(a) * 16, c + Math.sin(a) * 16, dx * 1.7, dy * 1.5 - 8, 14, i + 60));
      if (f < 9) { const k = f / 9, rot = eo(k) * 4.4, span = 2.5 * (1 - ei(k)) + .15, w = (f < 1 ? 10 : 7.5) * (1 - ei(k)) + .4, r0 = 8 + eo(k) * 50, r1 = 70 + eo(k) * 12;
        for (let i = 0; i < 4; i++) { const p = []; for (let j = 0; j <= 12; j++) { const t = j / 12, a = rot + i * TAU / 4 + t * span, r = r0 + t * (r1 - r0); p.push([c + Math.cos(a) * r, c + Math.sin(a) * r, Math.sin(t * Math.PI) ** .6 * w]); } if (i % 2) tint(L, M, 0, 0, 0, 1, brush(p), 2.2); else flat(L, 0, 0, 0, 1, brush(p), "#fff", 2.2); } }
      { const k = cl((f - 2) / 10.5); if (f >= 2 && k < 1) { const s = (k < .2 ? back(k / .2) : 1 - ei((k - .2) / .8)) * 20, x = c + 20 + Math.sin(k * 7) * 16, y = c - 46 + k * 74, r = .7 + Math.cos(k * 7) * .55, p = loc(x, y, r, s); if (s > 1.5) { flat(L, x, y, r, s, S.feather, "#fff", 2.2); pen(L, [p(-1.7, 0), p(.9, 0)], 1.6); } } } }),
    // sand: a dust burst that breaks into low puffs, grains on arcs, a little dune swirl in the charm's colour that unwinds
    pop5: K(14, 192, 192, (L, M, f) => { const c = 96;
      { const k = cl((f - 2) / 9.5); if (f >= 2 && k < 1) { const p = [], turns = (1 - ei(k)) * 7 + .4, rot = -k * 5; for (let j = 0; j <= 18; j++) { const t = j / 18, a = rot + t * turns, r = 5 + t * (22 + eo(k) * 34); p.push([Math.cos(a) * r, Math.sin(a) * r, Math.sin(t * Math.PI) ** .6 * 6 * (1 - ei(k)) + .3]); } tint(L, M, c, c + 14, 0, [1.15, .6], brush(p), 2.2); } }
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + .5; drift(L, f, 2, 10.5, c + Math.cos(a) * 26, c + Math.sin(a) * 16 - 4, Math.cos(a) * 36, Math.sin(a) * 20 - 10, 15, i + 20, SAND, SAND2); }
      if (f < 3) lumps(L, c, c - 4, hold(f, [54, 62, 42]), 7, 3, SAND, SAND2, Math.floor(f) * .35);
      burst(f, c, c - 4, 9, 2, 10, 13, 30, 40, 26, (x, y, a, s, k, i) => i % 3 ? tint(L, M, x, y, 0, 4.6 * s + 1.8, S.dot, 1.6) : flat(L, x, y, k * 6, 4.8 * s + 1.8, S.sq, SAND, 1.6)); }),
    // crystal: the gem with a hard prism flash and three wedges of light, then faceted splinters and small hard triangles
    pop6: K(14, 192, 192, (L, M, f) => { const c = 96;
      if (f < 4) { const l = hold(f, [70, 88, 84, 56]), w = hold(f, [.13, .11, .07, .03]); PRISM.forEach((col, i) => { const a = .3 + i * .27; flat(L, 0, 0, 0, 1, poly([[c, c], [c + Math.cos(a - w) * l, c + Math.sin(a - w) * l], [c + Math.cos(a + w) * l, c + Math.sin(a + w) * l]]), col, 2); }); }
      if (f < 3) { const s = hold(f, [1, .8, .42]), rs = [86, 40, 62, 40]; L.beginPath(); for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + i * Math.PI / 8, r = (i % 2 ? 9 : rs[(i / 2) % 4]) * s; L.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } L.closePath(); L.fillStyle = "#fff"; L.fill(); ink(L, 3); }
      if (f < 1) { const hex = (r) => poly([0, 1, 2, 3, 4, 5].map((i) => [Math.sin(i * Math.PI / 3) * r, -Math.cos(i * Math.PI / 3) * r])); tint(L, M, c, c, 0, 1, hex(30), 3); flat(L, c, c, 0, 1, hex(15), "rgba(255,255,255,.8)", 1.6); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 2; pen(L, [[c + Math.cos(a) * 15, c + Math.sin(a) * 15], [c + Math.cos(a) * 30, c + Math.sin(a) * 30]], 1.6); } }
      burst(f, c, c, 6, 1, 11, 4, 18, 54, 12, (x, y, a, s, k, i) => { const l = 17 * s + 3, r = a + k * (i % 2 ? 3 : -2.5); tint(L, M, x, y, r, l, S.gem, 2.2); at(L, x, y, r, l, poly([[1.3, 0], [.3, -.55], [-.1, -.05]])); L.fillStyle = "rgba(255,255,255,.85)"; L.fill(); pen(L, [loc(x, y, r, l)(-.9, .3), loc(x, y, r, l)(-.1, -.05)], 1.2); });
      burst(f, c, c, 5, 2, 9.5, 12, 22, 44, 8, (x, y, a, s, k, i) => flat(L, x, y, a + k * 6, 9 * s + 1.5, S.tri, PRISM[i % 3], 1.8)); }),
    // night: a dark disc with a crescent that winks shut, bats in the charm's colour peeling away on flapping wings, dark sparkles
    pop7: K(14, 192, 192, (L, M, f) => { const c = 96;
      if (f < 4) { const s = hold(f, [1, 1.06, .8, .5]); tint(L, M, c, c, 0, 58 * s, S.dot, 3); flat(L, c, c, 0, 50 * s, S.dot, NIGHT, 0); flat(L, c - 3 * s, c, -.5, 38 * s, S.moon(hold(f, [0, .3, .9, 1.7])), MOON, 2.8); }
      burst(f, c, c, 4, 2, 10.5, 6, 22, 48, -14, (x, y, a, s, k, i) => { const sz = 18 * s + 3; tint(L, M, x, y, Math.cos(a) * .35, sz, bat((Math.floor(f) + i) % 2), 2.2); });
      for (let i = 0; i < 4; i++) { const k = (f - 3 - i * 1.3) / 5.5; if (k <= 0 || k >= 1) continue; const a = i * 1.6 + .9, d = 50 + (i % 2) * 18, x = c + Math.cos(a) * d, y = c + Math.sin(a) * d, s = Math.sin(k * Math.PI) * 12; star(L, x, y, s, s * .26, 4, 0); L.fillStyle = VIOLET; L.fill(); L.lineWidth = 1.8; L.strokeStyle = "#fff"; L.lineJoin = "round"; L.stroke(); star(L, x, y, s * .4, s * .12, 4, 0); L.fillStyle = "#fff"; L.fill(); } }),
    // storm: a forked bolt strikes the centre and is held for three drawings, a jagged ring, zigzag sparks that flip each frame, slanted rain
    pop8: K(14, 192, 192, (L, M, f) => { const c = 96;
      if (f >= 1 && f < 6.5) { const k = (f - 1) / 5.5, r = 26 + eo(k) * 48; gonRing(L, M, c, c, r, 9 * (1 - k) + 1, 7, Math.floor(f) * .4, r * .82); }
      { const q = R(31); for (let i = 0; i < 8; i++) { const t0 = 2 + q() * 6.5, x0 = 30 + q() * 150, y0 = 14 + q() * 80, k = (f - t0) / 4; if (k <= 0 || k >= 1) continue; const x = x0 - k * 22, y = y0 + k * 66, l = Math.sin(k * Math.PI) * 9 + 5; pen2(L, [[x, y], [x - l * .35, y + l]], 2, "#cfe6ff"); } }
      burst(f, c, c, 5, 1, 10.5, 8, 20, 50, 0, (x, y, a, s, k, i) => tint(L, M, x, y, a - Math.PI / 2, [(10 * s + 2.5) * ((Math.floor(f) + i) % 2 ? 1 : -1), 14 * s + 3], S.bolt, 2));
      if (f < 3) { const s = hold(f, [1, .8, .45]), w = hold(f, [1, .62, .28]); wstar(L, c, c + 2, 48 * s, 15 * s, 7, .3, 3); if (f < 2) flat(L, c - 30, c - 34, .75, [15 * w, 17], S.bolt, f < 1 ? "#ffe14a" : "#fff", 2.5); flat(L, c + 8, c - 43, 0, [34 * w, 30], S.bolt, f < 1 ? "#ffe14a" : "#fff", 3.2); if (f < 1) flat(L, c + 8, c - 43, 0, [15, 26], S.bolt, "#fff", 0); } }),
    // star: a gold five-point star swells and splits; five stars in the charm's colour fly from its points on curved gold trails
    pop9: K(14, 192, 192, (L, M, f) => { const c = 96, up = -Math.PI / 2, k = cl((f - 1.5) / 10.5), pos = (i, v) => { const a = up + i * TAU / 5 + eo(v) * .7, d = 20 + eo(v) * 56; return [c + Math.cos(a) * d, c + Math.sin(a) * d]; };
      if (f >= 1.5 && k < 1) for (let i = 0; i < 5; i++) { const s = 1 - ei(k), p = []; for (let j = 0; j <= 7; j++) { const t = j / 7, v = Math.max(0, k - .3 * (1 - t)); p.push([...pos(i, v), t * 7 * s + .2]); } flat(L, 0, 0, 0, 1, brush(p), GOLD, 2); }
      if (f < 3) { const s = hold(f, [.85, 1.12, .6]), rot = up + hold(f, [0, .12, .3]); wstar(L, c, c, 66 * s, 28 * s, 5, rot, 3.5, GOLD); star(L, c, c, 36 * s, 15 * s, 5, rot); L.fillStyle = "#fff"; L.fill(); }
      if (f >= 1.5 && k < 1) for (let i = 0; i < 5; i++) { const s = 1 - ei(k), [x, y] = pos(i, k), r = 18 * s + 2.5; if (s < .06) continue; star(M, x, y, r, r * .44, 5, up + k * 4); M.fillStyle = "#fff"; M.fill(); star(L, x, y, r, r * .44, 5, up + k * 4); ink(L, 2.4); star(L, x, y, r * .42, r * .19, 5, up + k * 4); L.fillStyle = "#fff"; L.fill(); }
      for (let i = 0; i < 3; i++) { const q = (f - 5 - i * 2) / 4; if (q <= 0 || q >= 1) continue; const a = up + (i + .5) * TAU / 5 * 1.7, s = Math.sin(q * Math.PI) * 8; wstar(L, c + Math.cos(a) * 40, c + Math.sin(a) * 40, s, s * .42, 5, up, 1.6); } }),

    // forest: a vine climbs the left side on an ease-out, leaves pop open behind its tip, a flower in the charm's colour blooms and sheds its petals
    combo0: K(22, 384, 384, (L, M, f) => { const c = 192, G = "#4fae3f", G2 = "#7bd257", g = eo(cl(f / 9)), h = ei(cl((f - 15) / 5.5)), fk = cl((f - 15) / 5.5);
      const P = (t) => { const a = 2.25 + t * 2.75, r = 128 + Math.sin(t * 8) * 10 - t * 6; return [c + Math.cos(a) * r, c + Math.sin(a) * r, a + Math.PI / 2]; };
      if (f < 2) { const [x, y] = P(0); wstar(L, x, y, hold(f, [40, 26]), hold(f, [11, 7]), 7, .3); }
      [.12, .3, .48, .66, .84].forEach((t, i) => { const s = back((g - t) / .14) * (1 - cl((h - t + .12) / .12)); if (g <= t || s < .08) return; const [x, y, ta] = P(t), la = ta + (i % 2 ? .75 : -.75), len = 30 * s, lx = x + Math.cos(la) * len, ly = y + Math.sin(la) * len; flat(L, lx, ly, la, [len, len * .5], S.leaf, G2, 2.5); pen(L, [[x, y], [lx + Math.cos(la) * len * .5, ly + Math.sin(la) * len * .5]], 1.8); });
      if (g - h > .03) { const pts = []; for (let j = 0; j <= 28; j++) { const t = h + (g - h) * j / 28, [x, y] = P(t); pts.push([x, y, (8 - 4 * t) * Math.min(1, (g - t) / .06 + .25) * Math.min(1, (t - h) / .06 + .25)]); } flat(L, 0, 0, 0, 1, brush(pts), G, 2.5); }
      if (f >= 8 && fk < 1) { const [x, y] = P(1), bk = back((f - 8) / 4), s = 1 - ei(fk); for (let i = 0; i < 5; i++) { const pa = i * TAU / 5 - 1.57 + (1 - bk) * 1.2, off = eo(fk) * 30; tint(L, M, x + Math.cos(pa) * off, y + Math.sin(pa) * off + fk * fk * 46, pa + fk * (i % 2 ? 3 : -3), 34 * bk * s, S.petal, 3); } flat(L, x, y, 0, 11 * bk * s, S.dot, GOLD, 2.5); }
      if (f >= 10 && fk < 1) { const [x, y, ta] = P(.57), bk = back((f - 10) / 3.5), s = 1 - ei(fk), bx = x + Math.cos(ta + 1.4) * 22, by = y + Math.sin(ta + 1.4) * 22; pen2(L, [[x, y], [bx, by]], 2.5, G); for (let i = 0; i < 4; i++) { const pa = i * TAU / 4 + .4 + (1 - bk), off = eo(fk) * 22; flat(L, bx + Math.cos(pa) * off, by + Math.sin(pa) * off + fk * fk * 40, pa + fk * 3, 17 * bk * s, S.petal, "#fff", 2.2); } flat(L, bx, by, 0, 6 * bk * s, S.dot, GOLD, 2); } }),
    // water: a splash, a fish in the charm's colour leaps a high arc over the board shedding drops, a second splash where it lands
    combo1: K(22, 384, 384, (L, M, f) => { const x0 = 78, x1 = 306, gy = 312, u = cl((f - 2) / 12), pos = (v) => [x0 + (x1 - x0) * v, gy - 920 * v * (1 - v)];
      if (f < 8.5) ripple(L, M, x0, gy + 4, 16 + eo(f / 8.5) * 44, 8 * (1 - f / 8.5) + .5);
      if (f >= 14) { const k = cl((f - 14) / 6.5); ripple(L, M, x1, gy + 4, 16 + eo(k) * 44, 8 * (1 - k)); }
      for (let i = 0; i < 7; i++) { const ui = .1 + i * .13, fi = 2 + ui * 12, k = cl((f - fi) / 5.5); if (f < fi || k >= 1) continue; const [sx, sy] = pos(ui), s = (1 - ei(k)) * (8 + i % 3 * 2) + 1.5, x = sx + (i % 2 ? 1 : -1) * 8 * k - 14 * k, y = sy + k * k * 46 + 6; if (i % 2) tint(L, M, x, y, Math.PI / 2, s, S.drop, 2); else flat(L, x, y, Math.PI / 2, s, S.drop, "#fff", 2); }
      if (f >= 2 && u < 1) { const [x, y] = pos(u), r = Math.atan2(-920 * (1 - 2 * u), x1 - x0) + (Math.floor(f) % 2 ? .12 : -.1), s = 46 * Math.min(1, .45 + u * 6) * Math.min(1, .45 + (1 - u) * 6), p = loc(x, y, r, s);
        tint(L, M, x, y, r, s, poly([[.3, -.38], [-.55, -.92], [-.45, -.3]]), 2.5); tint(L, M, x, y, r, s, S.fish, 3);
        at(L, x, y, r, s, (c) => { c.moveTo(.85, .1); c.bezierCurveTo(.45, .5, -.4, .4, -.8, .1); c.quadraticCurveTo(0, .25, .85, .1); }); L.fillStyle = "#fff"; L.fill();
        flat(L, ...p(.56, -.13), 0, s * .15, S.dot, "#fff", 1.8); flat(L, ...p(.6, -.13), 0, s * .065, S.dot, INK, 0); pen(L, [p(.22, -.3), p(.14, 0), p(.22, .26)], 1.6); }
      crown(L, M, x0, gy, .85, f < 2 ? hold(f, [.55, 1]) : 1 - ei(cl((f - 2) / 5)), 1 + cl(f / 7) * .2);
      if (f >= 14) { const g = f - 14; crown(L, M, x1, gy, .85, g < 2 ? hold(g, [.6, 1.05]) : 1.05 * (1 - ei(cl((g - 2) / 4.5))), 1 + cl(g / 6.5) * .2); }
      const dr = (x, y, a, s, k, i) => i % 2 ? tint(L, M, x, y, Math.atan2(Math.sin(a) + k, Math.cos(a)), 10 * s + 2, S.drop, 2) : flat(L, x, y, 0, 5.5 * s + 1.5, S.dot, "#fff", 1.8);
      burst(f, x0, gy - 16, 6, 1, 8, 21, 12, 34, 30, dr); burst(f, x1, gy - 16, 6, 14, 6.6, 22, 12, 34, 30, dr); }),
    // fire: a small phoenix in the charm's colour climbs round the right side on a three-tone flame tail, flares at the top and falls as embers
    combo2: K(22, 384, 384, (L, M, f) => { const c = 192, Y = "#ffc23a", u0 = cl((f - 1) / 11), u = 1 - (1 - u0) ** 1.5, th = (v) => 2.3 - v * 3.4, pos = (v) => { const r = 112 - v * 12; return [c + Math.cos(th(v)) * r, c + Math.sin(th(v)) * r, th(v) - Math.PI / 2]; }, E = pos(1), tl = .32 * (1 - cl((f - 11.5) / 3.5));
      if (f < 2) { const [x, y] = pos(0); fire3(L, x, y, hold(f, [46, 30]), 0); }
      if (f >= 1 && tl > .02 && u > .02) { const mk = (wd) => { const p = []; for (let j = 0; j <= 12; j++) { const t = j / 12, v = Math.max(0, u - tl * (1 - t)), [x, y] = pos(v), wob = Math.sin(j * 1.9 + Math.floor(f) * 2.3) * 5 * (1 - t); p.push([x + Math.cos(th(v)) * wob, y + Math.sin(th(v)) * wob, t ** .7 * wd]); } return brush(p); }; flat(L, 0, 0, 0, 1, mk(19), "#ff7a2a", 3); flat(L, 0, 0, 0, 1, mk(10), Y, 0); flat(L, 0, 0, 0, 1, mk(4), "#fff6c8", 0); }
      if (f >= 1 && f < 12.5) { const [x, y, hd] = pos(u), s = 30 * Math.min(1, .4 + (f - 1) * .6), ps = Math.floor(f) % 2 ? 1 : .45;
        for (const sg of [-1, 1]) { tint(L, M, x, y, hd, [s, s * sg], poly([[.5, .15], [-.1, 2.3 * ps], [-.9, 1.6 * ps], [-.55, .95 * ps], [-1.15, .8 * ps], [-.6, .15]]), 2.5); flat(L, x, y, hd, [s, s * sg], poly([[.2, .3], [-.2, 1.5 * ps], [-.6, .9 * ps]]), Y, 0); }
        tint(L, M, x, y, hd, [s * .95, s * .8], S.drop, 2.8); for (const sg of [-1, 0, 1]) flat(L, ...loc(x, y, hd, s)(-.1, sg * .2), hd + Math.PI / 2 - sg * .5, s * .2, S.flame, Y, 0); flat(L, x, y, hd, s, poly([[.72, -.2], [1.35, 0], [.72, .2]]), Y, 2); for (const sg of [-1, 1]) flat(L, ...loc(x, y, hd, s)(.48, sg * .24), 0, s * .1, S.dot, "#fff", 0); }
      if (f >= 12 && f < 16) fire3(L, E[0], E[1], hold(f - 12, [50, 72, 56, 30]), Math.floor(f) * .3);
      burst(f, E[0], E[1], 8, 13, 7.8, 3, 18, 52, 70, (x, y, a, s, k, i) => i % 2 ? tint(L, M, x, y, Math.sin(i + Math.floor(f)) * .35, 14 * s + 2, S.flame, 2.5) : flat(L, x, y, a + k * 5, 12 * s + 2, S.diamond, Y, 2)); }),
    // ice: a hollow snowflake grows arm by arm with an overshoot, glints once, then cracks: its arms break in three and skate out with shards
    combo3: K(22, 384, 384, (L, M, f) => { const c = 192, ICE = "#e6f7ff", up = -Math.PI / 2, g = back(f / 8), k = cl((f - 11) / 9.5), sh = f >= 11, s1 = 1 - ei(k), P = (a, r) => [c + Math.cos(a) * r, c + Math.sin(a) * r];
      gonRing(L, M, c, c, sh ? 46 + eo(k) * 18 : 46 * g, sh ? 10 * (1 - k) : 10 * cl(f / 2), 3, up);
      if (sh && f < 13) wstar(L, c, c, hold(f - 11, [74, 52]), 6, 6, up + Math.PI / 6, 2.5);
      if (f < 2) wstar(L, c, c, hold(f, [58, 36]), hold(f, [9, 6]), 6, up, 2.5);
      for (let i = 0; i < 6; i++) { const a = up + i * Math.PI / 3;
        if (!sh) { const r1 = 46 + g * 98; if (g > .05) pen2(L, [P(a, 46), P(a, r1)], 9, ICE);
          [[86, 32, 4], [118, 22, 6]].forEach(([rb, len, f0]) => { if (f < f0) return; const b = back((f - f0) / 3.5), [bx, by] = P(a, rb); for (const sg of [-1, 1]) pen2(L, [[bx, by], [bx + Math.cos(a + sg * 1.05) * len * b, by + Math.sin(a + sg * 1.05) * len * b]], 6, ICE); });
          if (f >= 6) tint(L, M, ...P(a, r1), a, 18 * back((f - 6) / 3), S.diamond, 2.5); }
        else { [[46, 80, 12], [80, 114, 22], [114, 144, 32]].forEach(([ra, rb, fl], j) => { const half = (rb - ra) / 2 * s1, rot = a + (j % 2 ? 1 : -1) * (i % 2 ? 1 : -1) * k * 1.4, [mx, my] = P(a, (ra + rb) / 2 + eo(k) * fl); if (half > 1.5) pen2(L, [[mx - Math.cos(rot) * half, my - Math.sin(rot) * half], [mx + Math.cos(rot) * half, my + Math.sin(rot) * half]], 9 * (1 - k * .5), ICE); });
          if (s1 > .08) { for (const sg of [-1, 1]) shard(L, M, ...P(a + sg * (.2 + k * .12), 100 + eo(k) * 48), a + sg * (1.05 + k * 3), 18 * s1 + 1, 7 * s1 + 1); tint(L, M, ...P(a, 144 + eo(k) * 24), a + k * 2, 18 * s1, S.diamond, 2.5); } } }
      { const q = (f - 8.5) / 2.5; if (q > 0 && q < 1) { const s = Math.sin(q * Math.PI) * 26; wstar(L, ...P(up, 146), s, s * .22, 4, 0, 2); } } }),
    // air: a whirlwind builds from the ground in rotating arcs and carries three kites in the charm's colour up and round it
    combo4: K(22, 384, 384, (L, M, f) => { const c = 192;
      if (f < 2) wstar(L, c, 340, hold(f, [34, 22]), hold(f, [10, 6]), 8, .2);
      drift(L, f, 0, 9, c - 10, 340, -42, -10, 13, 1); drift(L, f, .5, 9, c + 10, 340, 42, -14, 11, 2);
      const arcs = (front) => { for (let j = 0; j < 5; j++) { const f0 = j * 1.2, k = cl((f - f0) / 15); if (f < f0 || k >= 1) continue; const y = 336 - j * 66, rx = 34 + j * 28, span = Math.sin(k * Math.PI) ** .5 * 1.9, w = 3.5 + j * .7;
        for (const d of [0, 1]) { const a0 = f * .8 + j * 1.3 + d * Math.PI, p = []; if ((Math.sin(a0 + span / 2) > 0) !== front) continue; for (let t = 0; t <= 10; t++) { const a = a0 + t / 10 * span; p.push([c + Math.cos(a) * rx, y + Math.sin(a) * rx * .3, Math.sin(t / 10 * Math.PI) ** .6 * w]); } if ((j + d) % 2) tint(L, M, 0, 0, 0, 1, brush(p), 2); else flat(L, 0, 0, 0, 1, brush(p), "#fff", 2); } } };
      arcs(false);
      for (let i = 0; i < 3; i++) { const kk = cl((f - 2 - i * 2.5) / 13); if (f < 2 + i * 2.5 || kk >= 1) continue; const t = eo(kk), an = i * 2.1 + kk * 7, rx = 34 + t * 100, x = c + Math.cos(an) * rx, y = 292 - t * 212 + Math.sin(an) * rx * .3, s = 30 * Math.min(1, back(kk / .15)) * (1 - ei(cl((kk - .6) / .4))), rot = Math.sin(an) * .5, p = loc(x, y, rot, s); if (s < 1.5) continue;
        const tail = []; for (let m = 0; m <= 5; m++) tail.push(p(Math.sin(m * 1.4 + Math.floor(f) * 1.1) * .28, 1.3 + m * .3)); pen2(L, tail, 2, "#fff"); for (const m of [2, 4]) flat(L, ...tail[m], rot + m, s * .2, S.sq, "#fff", 1.6);
        tint(L, M, x, y, rot, s, S.kite, 3); pen(L, [p(0, -1.2), p(0, 1.3)], 1.8); pen(L, [p(-.78, -.2), p(.78, -.2)], 1.8); flat(L, x, y, rot, s, poly([[0, -1.2], [.78, -.2], [0, -.2]]), "rgba(255,255,255,.55)", 0); }
      arcs(true); }),
    // sand: a scarab in the charm's colour rolls its ball along the bottom kicking up dust, stops, squashes, then opens its wings and is gone; the ball bursts into grains
    combo5: K(22, 384, 384, (L, M, f) => { const gy = 304, wx = (v) => { const u = cl((v - 1) / 12); return 104 + u * u * (3 - 2 * u) * 134; }, fly = cl((f - 14.5) / 6), bx = wx(f) + 66;
      if (f < 2) lumps(L, wx(0) + 20, gy, hold(f, [40, 28]), 7, 9, SAND, SAND2, Math.floor(f) * .4);
      for (let i = 0; i < 5; i++) { const fi = 2 + i * 2.4; drift(L, f, fi, 8, wx(fi) - 42, gy + (i % 2 ? 16 : -12), -12, -16, 17, i + 50, SAND, SAND2); }
      if (f < 14.5) { const s = 30 * back(f / 2.5), an = wx(f) / 30; flat(L, bx, gy, 0, s, S.dot, SAND, 3); flat(L, bx + Math.cos(an) * s * .42, gy + Math.sin(an) * s * .42, 0, s * .3, S.dot, SAND2, 0); flat(L, bx - Math.cos(an) * s * .5, gy - Math.sin(an) * s * .5, 0, s * .16, S.dot, SAND2, 0); }
      else { if (f < 16.5) lumps(L, bx, gy, hold(f - 14.5, [42, 30]), 7, 7, SAND, SAND2, Math.floor(f) * .4); burst(f, bx, gy, 9, 14.5, 6, 31, 16, 40, 14, (x, y, a, s, k, i) => i % 3 ? tint(L, M, x, y, 0, 6 * s + 1.8, S.dot, 2) : flat(L, x, y, k * 6, 6 * s + 1.8, S.sq, SAND, 2)); }
      { const air = f >= 14.5, X = air ? wx(f) + eo(fly) * 40 : wx(f), Y = air ? gy - eo(fly) * 170 : gy, rot = air ? -eo(cl(fly * 3)) * 1.25 : (f > 1 && f < 13 ? (Math.floor(f) % 2 ? .07 : -.07) : 0), s = 38 * back(f / 2.5) * (1 - ei(fly)), sq = f >= 13 && f < 14.5 ? hold(f - 13, [1.16, .86]) : 1, p = loc(X, Y, rot, s), ps = Math.floor(f) % 2; if (s < 1.5) return;
        if (!air) for (const sg of [-1, 1]) [-.6, 0, .6].forEach((lx, j) => { const sw = (f > 1 && f < 13 ? ((j + ps + (sg > 0)) % 2 ? .32 : -.32) : 0); pen2(L, [p(lx, sg * .6), p(lx + sw * .6, sg * 1.25), p(lx + sw * 1.5 + .15, sg * 1.6)], 3.5, "#c98b3a"); });
        else for (const sg of [-1, 1]) flat(L, ...p(-.25, sg * 1.2), rot + sg * (1.3 + (ps ? .35 : -.1)), [s * 1.15 * Math.min(1, .5 + fly * 4), s * .48], S.leaf, "#fff", 2);
        if (!air) { tint(L, M, X, Y, rot, [s * 1.1 * sq, s * .82 / sq], S.dot, 3); pen(L, [p(-1.05 * sq, 0), p(.4, 0)], 1.8); }
        else for (const sg of [-1, 1]) tint(L, M, ...p(-.15, sg * .6), rot + sg * .5, [s, s * .42], S.dot, 2.5);
        flat(L, ...p(.68 * sq, 0), rot, [s * .36, s * .7 / sq], S.dot, "#c98b3a", 2.5); flat(L, ...p(1.18 * sq, 0), 0, s * .42, S.dot, "#4a3550", 2.5); for (const sg of [-1, 1]) flat(L, ...p(1.3 * sq, sg * .16), 0, s * .09, S.dot, "#fff", 0); } }),
    // crystal: a geode drops, lands with a squash, rattles while a crack runs down it, then splits on a flash: crystals in the charm's colour stand up out of it
    combo6: K(22, 384, 384, (L, M, f) => { const cx = 192, gy = 304, ROCK = "#8f8499", out = 1 - ei(cl((f - 16) / 5)), open = eo(cl((f - 7) / 4)), half = [[0, -1], [.5, -.95], [.9, -.55], [1.05, 0], [.85, .6], [.4, .95], [0, 1]];
      if (out <= .02) return;
      if (f >= 2) for (const d of [-1, 1]) drift(L, f, 2, 7, cx + d * 50, gy + 44, d * 40, -8, 12, d + 5);
      if (f < 7) { const y = gy - hold(f, [96, 36, 0]), [sx, sy] = hold(f, [[.86, 1.16], [.92, 1.1], [1.22, .78], [.95, 1.06], [1, 1]]), x = cx + hold(f, [0, 0, 0, 0, -5, 5, -4]), yy = y + 56 * (1 - sy);
        flat(L, x, yy, 0, [56 * sx, 56 * sy], mirror(half), ROCK, 3.5); flat(L, x - 8, yy + 24 * sy, 0, [30 * sx, 14 * sy], S.dot, "#6d6378", 0); flat(L, x + 20 * sx, yy - 26 * sy, .5, [10, 5], S.dot, "#b3a9bd", 0);
        if (f >= 3) pen2(L, [[0, -54], [-9, -30], [8, -12], [-7, 10], [6, 30], [0, 52]].slice(0, Math.min(6, 2 + Math.floor((f - 3) * 1.4))).map(([px, py]) => [x + px, yy + py]), 2.5, "#fff"); return; }
      if (f < 9) wstar(L, cx, gy - 16, hold(f - 7, [84, 56]), 12, 8, .2, 3);
      [-.95, -.5, 0, .5, .95].forEach((an, i) => { const len = [92, 134, 76, 142, 100][i] * back((f - 7.5 - i * .4) / 4) * out, w = 13 * Math.min(1, out * 1.5), bx = cx + an * 22, by = gy + 12; if (f < 7.5 + i * .4 || len < 4) return; const tip = Math.min(len, w * 1.4);
        tint(L, M, bx, by, an, 1, poly([[-w, 0], [-w, -len + tip], [0, -len], [w, -len + tip], [w, 0]]), 2.5); flat(L, bx, by, an, 1, poly([[-w, 0], [-w, -len + tip], [0, -len], [-w * .3, -len + tip], [-w * .3, 0]]), "rgba(255,255,255,.7)", 0); pen(L, [loc(bx, by, an, 1)(-w * .3, 0), loc(bx, by, an, 1)(-w * .3, -len + tip), loc(bx, by, an, 1)(0, -len)], 1.4);
        const q = (f - 11.5 - i * .7) / 3.5; if (q > 0 && q < 1) { const s = Math.sin(q * Math.PI) * 17; wstar(L, ...loc(bx, by, an, 1)(0, -len), s, s * .22, 4, 0, 1.8); } });
      for (const d of [-1, 1]) { const hx = cx + d * open * 36, rot = d * open * .55, s = 56 * out, p = loc(hx, gy, rot, s); flat(L, hx, gy, rot, [s * d, s], poly(half), ROCK, 3.5); tint(L, M, ...p(d * .21, 0), rot, [s * .3, s * .74], S.dot, 2.2); flat(L, hx, gy, rot, [s * d, s], poly([[.1, -.5], [.32, -.3], [.14, -.1], [.34, .1], [.14, .3], [.3, .5], [.1, .5]]), "rgba(255,255,255,.85)", 0); }
      burst(f, cx, gy - 30, 6, 7.5, 8, 6, 30, 50, 20, (x, y, a, s, k, i) => flat(L, x, y, a + k * 5, 9 * s + 2, S.tri, PRISM[i % 3], 2)); }),
    // night: a crescent moon pops out, an owl in the charm's colour swoops under the board on beating wings and up across the moon, the moon winks shut
    combo7: K(22, 384, 384, (L, M, f) => { const mx = 290, my = 96, u0 = cl((f - 2) / 13), u = u0 * u0 * (3 - 2 * u0) * .5 + u0 * .5, B = (v) => { const w = 1 - v; return [w * w * w * 112 + 3 * w * w * v * 112 + 3 * w * v * v * 290 + v * v * v * 298, w * w * w * 150 + 3 * w * w * v * 400 + 3 * w * v * v * 380 + v * v * v * 80]; };
      { const k = cl((f - 16) / 4.5), s = 56 * back((f - 1) / 3) * (1 - ei(k) * .6); if (f < 2) wstar(L, mx, my, hold(f, [30, 50]), hold(f, [7, 11]), 4, 0, 2.5); if (k < 1 && f >= 1) flat(L, mx, my, -.4, s, S.moon(-.5 + ei(k) * 3), MOON, 3.5); }
      [[204, 40, 3], [356, 168, 5], [236, 170, 7], [360, 34, 9], [170, 100, 11]].forEach(([x, y, f0]) => { const q = (f - f0) / 7; if (q <= 0 || q >= 1) return; const s = Math.sin(q * Math.PI) * 17; star(L, x, y, s, s * .26, 4, 0); L.fillStyle = VIOLET; L.fill(); L.lineWidth = 1.8; L.strokeStyle = "#fff"; L.lineJoin = "round"; L.stroke(); star(L, x, y, s * .4, s * .12, 4, 0); L.fillStyle = "#fff"; L.fill(); });
      if (f >= 2 && u0 < 1) { const [x, y] = B(u), [x2, y2] = B(Math.min(1, u + .02)), s = 40 * back(u0 / .15) * (1 - ei(cl((u0 - .78) / .22))), rot = Math.atan2(y2 - y, x2 - x) * .35, p = loc(x, y, rot, s), upw = Math.floor(f) % 2; if (s < 1.5) return;
        const wing = upw ? [[.35, -.25], [1.6, -1.15], [2.3, -.9], [2, -.42], [1.7, -.1], [1.3, .15], [.9, .3], [.35, .35]] : [[.35, -.3], [1.5, -.2], [2.2, .55], [1.8, .55], [1.5, .72], [1.1, .6], [.8, .7], [.35, .3]];
        for (const sg of [-1, 1]) tint(L, M, x, y, rot, [s * sg, s], poly(wing), 2.8);
        tint(L, M, x, y, rot, s, (c) => { c.moveTo(-.5, -.95); c.lineTo(-.3, -.72); c.quadraticCurveTo(0, -.85, .3, -.72); c.lineTo(.5, -.95); c.bezierCurveTo(.75, -.3, .7, .75, 0, .85); c.bezierCurveTo(-.7, .75, -.75, -.3, -.5, -.95); c.closePath(); }, 2.8);
        flat(L, ...p(0, .3), rot, [s * .34, s * .4], S.dot, CREAM, 0); for (const sg of [-1, 1]) { flat(L, ...p(sg * .25, -.36), 0, s * .24, S.dot, "#fff", 2); flat(L, ...p(sg * .23, -.34), 0, s * .1, S.dot, INK, 0); } flat(L, ...p(0, -.12), rot + Math.PI / 2, s * .16, S.tri, GOLD, 1.6); } }),
    // storm: a cloud swells in, tightens, then forks lightning down both sides for three held drawings; strike stars, sparks, rain, and the cloud breaks up
    combo8: K(22, 384, 384, (L, M, f) => { const c = 192, cy = 98, GREY = "#9aa0bd", GREY2 = "#6f7596", k = eo(cl(f / 6)), gone = cl((f - 15) / 5.5), hit = [[96, 304], [292, 300]];
      const paths = [[[184, 134], [152, 176], [174, 178], [124, 244], [144, 252], hit[0]], [[202, 134], [234, 170], [214, 172], [268, 236], [250, 246], hit[1]]];
      { const q = R(41); for (let i = 0; i < 12; i++) { const t0 = 9.5 + q() * 6, x0 = 70 + q() * 260, y0 = 124 + q() * 90, kk = (f - t0) / 4.5; if (kk <= 0 || kk >= 1) continue; const x = x0 - kk * 30, y = y0 + kk * 96, l = Math.sin(kk * Math.PI) * 12 + 6; pen2(L, [[x, y], [x - l * .32, y + l]], 3, "#cfe6ff"); } }
      if (f >= 9 && f < 12) { const w = hold(f - 9, [1, .6, .3]); paths.forEach((pp) => { const b = (m) => brush(pp.map(([x, y], i) => [x, y, (11 - i * 1.9) * w * m])); flat(L, 0, 0, 0, 1, b(1), f < 10 ? "#ffe14a" : "#fff", 3); if (f < 10) flat(L, 0, 0, 0, 1, b(.45), "#fff", 0); }); }
      hit.forEach(([x, y], j) => { if (f >= 9 && f < 12) wstar(L, x, y, hold(f - 9, [46, 36, 18]), hold(f - 9, [14, 10, 5]), 7, .3 + j, 3);
        burst(f, x, y, 4, 10, 8, 8 + j, 18, 34, 0, (sx, sy, a, s, kk, i) => tint(L, M, sx, sy, a - Math.PI / 2, [(13 * s + 2.5) * ((Math.floor(f) + i) % 2 ? 1 : -1), 17 * s + 3], S.bolt, 2.2)); });
      if (gone <= 0) { const s = 1.25 * (.3 + .7 * back(f / 5)) * (f >= 8 && f < 9 ? 1.12 : 1), sy = f >= 8 && f < 9 ? .82 : f >= 9 && f < 10 ? 1.12 : 1, x = 112 + k * 80, bo = (j) => 1 + .06 * ((Math.floor(f) + j) % 2), ls = [[-54, 8, 26], [-24, -10, 32], [14, -16, 36], [50, 2, 28], [0, 12, 30]];
        const all = (m, o) => { L.beginPath(); ls.forEach(([dx, dy, r], j) => { const rr = r * s * bo(j) * m; L.moveTo(x + dx * s + rr, cy + (dy + o) * s * sy); L.ellipse(x + dx * s, cy + (dy + o) * s * sy, rr, rr * sy, 0, 0, 7); }); };
        if (s > .05) { all(1, 0); L.lineWidth = 7; L.strokeStyle = INK; L.lineJoin = "round"; L.stroke(); all(1, 0); L.fillStyle = f >= 8 && f < 10 ? "#fff" : GREY; L.fill(); if (!(f >= 8 && f < 10)) { all(.6, 9); L.fillStyle = GREY2; L.fill(); } } }
      else [[-48, -30, -8, 22], [0, 0, -26, 26], [46, 34, -6, 22]].forEach(([dx, mx, my, r], i) => drift(L, f, 13, 7.6, c + dx * 1.3, cy, mx, my, r * 1.4, i + 70, GREY, GREY2)); }),
    // star: a glint, then a gold comet loops once round the board on a tail in the charm's colour, shedding sparkles, and bursts into small stars
    combo9: K(22, 384, 384, (L, M, f) => { const c = 192, u0 = cl((f - 1) / 14), u = u0 * u0 * (3 - 2 * u0) * .6 + u0 * .4, pos = (v) => { const a = 2.6 + v * TAU * 1.15, r = 142 - v * 22; return [c + Math.cos(a) * r, c + Math.sin(a) * r]; }, E = pos(1), tl = .42 * (1 - cl((f - 14.5) / 3));
      if (f < 2) { const [x, y] = pos(0); wstar(L, x, y, hold(f, [26, 42]), hold(f, [6, 9]), 4, 0, 2.5); }
      for (let i = 0; i < 7; i++) { const ui = .1 + i * .125, fi = 1 + 14 * ui * 1.05 + 1, q = (f - fi) / 5; if (q <= 0 || q >= 1) continue; const a = 2.6 + ui * TAU * 1.15, r = 142 - ui * 22 + (i % 2 ? 20 : -20), s = Math.sin(q * Math.PI) * (i % 2 ? 12 : 16); wstar(L, c + Math.cos(a) * r, c + Math.sin(a) * r, s, s * (i % 2 ? .42 : .26), i % 2 ? 5 : 4, -Math.PI / 2, 1.8, i % 2 ? GOLD : "#fff"); }
      if (f >= 1 && tl > .02 && u > .01) { const mk = (len, wd) => { const p = []; for (let j = 0; j <= 16; j++) { const t = j / 16; p.push([...pos(Math.max(0, u - len * (1 - t))), t ** .8 * wd]); } return brush(p); }; tint(L, M, 0, 0, 0, 1, mk(tl, 19), 3); flat(L, 0, 0, 0, 1, mk(tl * .55, 7), "#fff", 0); }
      if (f >= 1 && f < 17) { const [x, y] = pos(u), s = 34 * (f < 15 ? Math.min(1, .5 + (f - 1) * .5) : hold(f - 15, [1.25, 1.5])), rot = Math.floor(f * 2) * .31; wstar(L, x, y, s, s * .44, 5, rot, 3, GOLD); star(L, x, y, s * .5, s * .22, 5, rot); L.fillStyle = "#fff"; L.fill(); }
      burst(f, E[0], E[1], 5, 16, 4.8, 9, 18, 34, 20, (x, y, a, s, k) => { const r = 20 * s + 2; star(M, x, y, r, r * .44, 5, a + k * 4); M.fillStyle = "#fff"; M.fill(); star(L, x, y, r, r * .44, 5, a + k * 4); ink(L, 2.2); }); }),
  });
  window.FxLive = { has: (k) => !!FX[k], dur: (k) => FX[k].n / 24, size: (k) => [FX[k].w, FX[k].h], draw: (k, f, L, M) => FX[k].draw(L, M, f) };
  window.FX_LIST = Object.fromEntries(Object.entries(FX).map(([k, v]) => [k, { n: v.n, w: v.w, h: v.h }]));
  window.FX_KINGDOM = { pop: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => "pop" + k), combo: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => "combo" + k) };
  window.bakeFx = function (name) { const fx = FX[name], out = [];
    for (let f = 0; f < fx.n; f++) { const a = document.createElement("canvas"), b = document.createElement("canvas"); a.width = b.width = fx.w; a.height = b.height = fx.h; fx.draw(a.getContext("2d"), b.getContext("2d"), f); out.push([a, b]); }
    return out; };
})();
