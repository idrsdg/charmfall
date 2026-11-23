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
  // ---------- one animation language per kingdom (2026-11-23, İdris picked them from animasyon-secenekleri.html) ----------
  // 0 forest = wooden toy, 1 water = ink and water, 2 fire = cartoon spring, 3 ice = crystal shatter, 4 sky = soap bubble, 5 sand = origami,
  // 6 crystal = light trail, 7 night = paper cut, 8 storm = vortex, 9 star = stardust. Each language is one drawing routine P0..P9 (t = frame on the
  // pop's 14-frame timeline, z = size); the pop plays it at 1, the blast at 2 with twice the pieces and a shock of its own, the beam at .6 as its
  // centre spark under a body that runs along the row. White always carries an ink rim so it reads on the light boards too.
  const U = (t, a, b) => cl((t - a) / (b - a));
  S.rect = poly([[1, 1], [-1, 1], [-1, -1], [1, -1]]);
  const sp = (n, q, rot = 0) => (x) => { for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? q : 1; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); };
  // a charm-coloured patch let into a fixed-colour shape on the ink layer: the mask shows through a hole cut in what is already drawn there
  const hole = (L, M, cx, cy, rot, s, path, lw = 2.2) => { at(M, cx, cy, rot, s, path); M.fillStyle = "#fff"; M.fill(); at(L, cx, cy, rot, s, path); L.save(); L.globalCompositeOperation = "destination-out"; L.fillStyle = "#000"; L.fill(); L.restore(); if (lw) ink(L, lw); };
  // an ink blot in the charm's colour: circles under one ink rim
  const blot = (L, M, cs, lw = 3) => { const all = (x) => { x.beginPath(); for (const [bx, by, r] of cs) if (r > .5) { x.moveTo(bx + r, by); x.arc(bx, by, r, 0, 7); } }; all(M); M.fillStyle = "#fff"; M.fill(); all(L); L.lineJoin = "round"; L.lineWidth = lw * 2; L.strokeStyle = INK; L.stroke(); L.save(); L.globalCompositeOperation = "destination-out"; L.fillStyle = "#000"; L.fill(); L.restore(); };
  // a piece of cut paper: a white edge with a hair of ink outside it; fill = a fixed colour, or nothing for the charm's colour
  const cut = (L, M, cx, cy, rot, s, path, fill, ew = 4) => { at(L, cx, cy, rot, s, path); L.lineJoin = "round"; L.lineWidth = ew + 3; L.strokeStyle = INK; L.stroke(); L.lineWidth = ew; L.strokeStyle = "#fffdf6"; L.stroke(); if (fill) { L.fillStyle = fill; L.fill(); } else { L.save(); L.globalCompositeOperation = "destination-out"; L.fillStyle = "#000"; L.fill(); L.restore(); at(M, cx, cy, rot, s, path); M.fillStyle = "#fff"; M.fill(); } };
  const tick = (L, x, y, s) => { if (s < 1) return; for (const w of [[5.4, INK], [2.4, "#fff"]]) for (let j = 0; j < 3; j++) { const b = j * Math.PI / 3 + .26; pen(L, [[x - Math.cos(b) * s, y - Math.sin(b) * s], [x + Math.cos(b) * s, y + Math.sin(b) * s]], w[0], w[1]); } };
  const arcB = (cx, cy, r, a0, span, w, fy = 1) => { const p = []; for (let j = 0; j <= 8; j++) { const a = a0 + j / 8 * span; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r * fy, Math.sin(j / 8 * Math.PI) ** .6 * w]); } return brush(p); };
  const tw = (L, M, x, y, s, tinted, n = 4, rot = 0) => { if (s < 1) return; const q = n === 4 ? .26 : .44; if (tinted) { star(M, x, y, s, s * q, n, rot); M.fillStyle = "#fff"; M.fill(); star(L, x, y, s, s * q, n, rot); ink(L, 1.7); } else wstar(L, x, y, s, s * q, n, rot, 1.7); };
  const WOOD = "#e3b476", WOOD2 = "#a8743a", DUST = "#f3ead2", DUST2 = "#d9c9a4", PAPER = "#fbf3df", PAPER2 = "#e3d3aa", SHADE2 = "rgba(29,20,36,.2)", RAIN = "#cfe6ff";

  // forest, wooden toy: a wooden token rocks under two knock marks, turns edge-on and is gone; wood chips tumble heavily, sawdust rolls out low, leaves in the charm's colour
  const P0 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75;
    for (let i = 0; i < 4 * N; i++) { const a = i * TAU / (4 * N) + .4; drift(L, t, 2.5, 10, cx + Math.cos(a) * 24 * z, cy + 12 * z + Math.sin(a) * 12 * z, Math.cos(a) * 34 * z, Math.sin(a) * 14 * z - 8 * z, 11 * Z, i + 80, DUST, DUST2); }
    burst(t, cx, cy, 6 * N, 2, 10.6, 14, 18 * z, 46 * z, 22 * z, (x, y, a, s, k, i) => { const r = a * 2 + k * (i % 2 ? 2.4 : -2), l = (12 * s + 4) * Z, p = loc(x, y, r, l); flat(L, x, y, r, [l, l * (.34 + i % 3 * .06)], S.rect, i % 3 ? WOOD : WOOD2, 2.2); pen(L, [p(-.6, 0), p(.5, 0)], 1.3, "#8a5a2a"); });
    burst(t, cx, cy, 3 * N, 2.5, 10, 5, 16 * z, 48 * z, 14 * z, (x, y, a, s, k, i) => { const r = a + k * (i % 2 ? 4 : -3), l = (15 * s + 3) * Z, p = loc(x, y, r, l); tint(L, M, x, y, r, [l, l * .6], S.leaf, 2.2); pen(L, [p(-.7, 0), p(.5, 0)], 1.4); });
    if (t < 3) { const r = 42 * z, rot = hold(t, [.22, -.2, .06]), sy = hold(t, [1, 1, .26]), y = cy - hold(t, [0, 0, 6]) * z;
      flat(L, cx, y + 7 * z * sy, rot, [r, r * sy], S.dot, WOOD2, 3); flat(L, cx, y, rot, [r, r * sy], S.dot, WOOD, 3); at(L, cx, y, rot, [r * .76, r * .76 * sy], S.dot); L.lineWidth = 2; L.strokeStyle = WOOD2; L.stroke(); hole(L, M, cx, y, rot, [r * .46, r * .46 * sy], S.dot, 2.5);
      if (t < 2) for (const d of [-1, 1]) for (let j = 0; j < 3; j++) { const a = -Math.PI / 2 + d * (.72 + j * .3), r0 = r * 1.2, r1 = r * (1.42 + (j === 1) * .12 - Math.floor(t) * .08); pen2(L, [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]], 2.8, "#fff"); } } };
  // water, ink and water: a blot of the charm's colour opens under an ink rim and dries back, a thin ripple runs out, droplets with ink rims
  const P1 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75, q = R(23), e = eo(U(t, 0, 2.5)), dry = ei(U(t, 2.5, 7.5)), Rr = (18 + 28 * e) * z * (1 - dry), cs = [[cx, cy, Rr]];
    for (let i = 0; i < 9; i++) { const a = i * TAU / 9 + q() * .5, d = Rr * (.8 + .32 * q()) * (1 + dry * .5), r = Rr * (.3 + .26 * q()) * (1 - dry * .4); cs.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d, r]); }
    if (Rr > 1.5) { blot(L, M, cs, 3); if (Rr > 8 * z) flat(L, cx - Rr * .36, cy - Rr * .4, -.6, [Rr * .2, Rr * .11], S.dot, "#fff", 0); }
    if (t >= 1 && t < 9.5) { const k = U(t, 1, 9.5), r = (48 + eo(k) * 40) * z, w = 3.2 * (1 - k) + .7; for (const [lw, col] of [[w + 2.6, INK], [w, "#e4f6ff"]]) { L.beginPath(); L.arc(cx, cy, r, 0, 7); L.lineWidth = lw; L.strokeStyle = col; L.stroke(); } }
    burst(t, cx, cy, 7 * N, 2.5, 10, 4, 36 * z, 33 * z, 12 * z, (x, y, a, s, k) => { const r = Math.atan2(Math.sin(a) * (1 - k) + k * 1.2, Math.cos(a) * (1 - k * .6)), d = (10 * s + 2.5) * Z; tint(L, M, x, y, r, d, S.drop, 2.2); flat(L, x - d * .2, y - d * .25, 0, d * .22 + .3, S.dot, "#fff", 0); });
    burst(t, cx, cy, 5 * N, 3, 9.5, 9, 38 * z, 30 * z, 10 * z, (x, y, a, s) => tint(L, M, x, y, 0, (3.4 * s + 1.3) * Z, S.dot, 1.7)); };
  // fire, cartoon spring: it squashes, stretches, then a spiky white star with an ink line pops on an overshoot round a star of the charm's colour; speed lines, small stars on arcs, flame licks, embers
  const P2 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75;
    if (t >= 2 && t < 8.5) { const k = U(t, 2, 8.5), e = eo(k); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + .3, d0 = (50 + 26 * e) * z, d1 = d0 + 18 * z * (1 - k) + 1; pen2(L, [[cx + Math.cos(a) * d0, cy + Math.sin(a) * d0], [cx + Math.cos(a) * d1, cy + Math.sin(a) * d1]], 2.8, CREAM); } }
    for (let i = 0; i < 3 * N; i++) { const k = U(t, 2.5 + (i % 3) * .8, 9.6 + (i % 3) * .8); if (k <= 0 || k >= 1) continue; const a = i * TAU / (3 * N) + .9, s = Math.sin(k * Math.PI) ** .7 * 13 * Z, x = cx + Math.cos(a) * 46 * z, y = cy + Math.sin(a) * 38 * z - k * 14 * z, sw = ((Math.floor(t) + i) % 2 ? .25 : -.22); if (s < 1.5) continue; flat(L, x, y, sw, s, S.flame, "#ff7a2a", 2.2); flat(L, x, y + s * .25, sw, s * .5, S.flame, "#ffc23a", 0); }
    burst(t, cx, cy, 5 * N, 2.5, 10.2, 7, 22 * z, 50 * z, 26 * z, (x, y, a, s, k, i) => tw(L, M, x, y, (9 * s + 2.5) * Z, i % 2, 5, k * 5 + i));
    burst(t, cx, cy, 4 * N, 3, 9.5, 3, 20 * z, 44 * z, -18 * z, (x, y, a, s, k) => flat(L, x, y, a + k * 4, (7 * s + 2) * Z, S.diamond, "#ffc23a", 1.8));
    if (t < 8) { const [sx, sy, k] = t < 1 ? [1.4, .62, .7] : t < 2 ? [.72, 1.34, .8] : [1, 1, back(U(t, 1.2, 3.4)) * (1 - ei(U(t, 4.5, 8)))], r = 58 * z * k, rot = Math.floor(t) * .12; if (r > 2) { flat(L, cx, cy, rot, [r * sx, r * sy], sp(9, .5), "#fffdf0", 3.5); hole(L, M, cx, cy, -rot, [r * .56 * sx, r * .56 * sy], sp(9, .5), 2.2); } } };
  // ice, crystal shatter: a white four-point flash held three drawings, the charm breaks into hard flat wedges that fly straight out, frost ticks, ice chips
  const P3 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75, n = 8, h = TAU / n / 2, q = R(37), wedge = poly([[0, 0], [Math.cos(h), -Math.sin(h)], [Math.cos(h), Math.sin(h)]]), facet = poly([[0, 0], [Math.cos(h), -Math.sin(h)], [.8, -Math.sin(h) * .3]]);
    for (let g = 0; g < N; g++) for (let i = 0; i < n; i++) { const am = i * TAU / n + .2 + h + g * h, k = U(t, 1 + g * .6, 12.6), sp1 = (q() - .5) * 2.6, far = 30 + q() * 24; if (t < 1 || k >= 1) continue; const e = eo(k), d = (5 + e * far) * z * (1 + g * .3), Rr = (g ? 17 : 34) * z * (1 - ei(k) * .86), rot = am + sp1 * e, x = cx + Math.cos(am) * d, y = cy + Math.sin(am) * d + k * k * 10 * z; if (Rr < 2) continue;
      tint(L, M, x, y, rot, Rr, wedge, 2.2); at(L, x, y, rot, Rr, facet); L.fillStyle = "rgba(255,255,255,.85)"; L.fill(); }
    burst(t, cx, cy, 4 * N, 2, 10, 12, 24 * z, 44 * z, 6 * z, (x, y, a, s, k) => flat(L, x, y, a + k * 3, (7 * s + 2) * Z, S.diamond, "#bfe8ff", 1.8));
    for (let i = 0; i < 5 * N; i++) { const k = (t - 3 - (i % 5) * 1.1) / 5; if (k <= 0 || k >= 1) continue; const a = i * 1.26 + .5, d = (50 + (i % 2) * 22) * z; tick(L, cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.sin(k * Math.PI) * 10 * Z); }
    if (t < 3) wstar(L, cx, cy, hold(t, [84, 62, 30]) * z, hold(t, [11, 8, 4]) * z, 4, .3, 3); };
  // sky, soap bubble: a thin bubble swells and wobbles for three drawings, then bursts into short arcs and droplets; a feather floats up, small clouds
  const P4 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75, q = R(47);
    for (let i = 0; i < 2 * N; i++) { const a = i * TAU / (2 * N) + 2.4; drift(L, t, 3, 9.6, cx + Math.cos(a) * 30 * z, cy + Math.sin(a) * 24 * z, Math.cos(a) * 28 * z, Math.sin(a) * 16 * z - 8 * z, 12 * Z, i + 60); }
    if (t < 3) { const r = hold(t, [38, 50, 57]) * z, sx = hold(t, [1, 1.05, .96]), sy = 2 - sx; M.beginPath(); M.ellipse(cx, cy, r * sx, r * sy, 0, 0, 7); M.lineWidth = 6; M.strokeStyle = "#fff"; M.stroke();
      for (const [o, lw, col] of [[3, 2.4, INK], [-3, 1.5, INK], [.5, 1.6, "#fff"]]) { L.beginPath(); L.ellipse(cx, cy, r * sx + o, r * sy + o, 0, 0, 7); L.lineWidth = lw; L.strokeStyle = col; L.stroke(); }
      for (const [lw, col] of [[7, INK], [3.6, "#fff"]]) { L.beginPath(); L.arc(cx, cy, r * .72, -2.5, -1.75); L.lineCap = "round"; L.lineWidth = lw; L.strokeStyle = col; L.stroke(); } flat(L, cx + r * .5, cy + r * .28, 0, 3.4 * Z, S.dot, "#fff", 1.7); }
    else { const k = U(t, 3, 9.6);
      if (t < 5) for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + .2, r0 = hold(t - 3, [62, 72]) * z, r1 = r0 + hold(t - 3, [12, 7]) * z; pen2(L, [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]], 2.4, "#fff"); }
      if (k < 1) for (let i = 0; i < 12; i++) { const a = i * TAU / 12 + q() * .3, p = arcB(cx, cy, (56 + 30 * eo(k)) * z, a, .34 * (1 - k * .6), (3.6 * (1 - k) + .5) * Z); if (i % 2) tint(L, M, 0, 0, 0, 1, p, 1.7); else flat(L, 0, 0, 0, 1, p, "#fff", 1.7); } }
    burst(t, cx, cy, 7 * N, 3, 9.6, 8, 42 * z, 32 * z, 16 * z, (x, y, a, s, k, i) => i % 3 ? flat(L, x, y, 0, (3.4 * s + 1.2) * Z, S.dot, "#fff", 1.7) : tint(L, M, x, y, 0, (3.8 * s + 1.2) * Z, S.dot, 1.7));
    for (let j = 0; j < N; j++) { const k = U(t, 3 + j, 12.6); if (t < 3 + j || k >= 1) continue; const s = (k < .2 ? back(k / .2) : 1 - ei((k - .2) / .8)) * 19 * Z, x = cx + (j ? -26 : 4) * z + (j ? -1 : 1) * Math.sin(k * 6) * 14 * z, y = cy + 8 * z - k * 56 * z, r = .7 + Math.cos(k * 6) * .5 * (j ? -1 : 1), p = loc(x, y, r, s); if (s > 1.5) { flat(L, x, y, r, s, S.feather, "#fff", 2.2); pen(L, [p(-1.7, 0), p(.9, 0)], 1.6); } } };
  // sand, origami: a paper square folds in half, then in four, then paper darts shoot away straight behind short streaks; folded scraps and sand grains
  const P5 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75, a = 38 * z, dart = poly([[1.3, 0], [-.8, .7], [-.4, 0], [-.8, -.7]]), tri = poly([[1, -.75], [1, 1], [-.75, 1]]);
    burst(t, cx, cy, 7 * N, 3, 9.6, 13, 14 * z, 48 * z, 28 * z, (x, y, an, s, k, i) => flat(L, x, y, k * 6, (3.2 * s + 1.5) * Z, i % 2 ? S.dot : S.sq, i % 3 ? SAND : SAND2, 1.5));
    burst(t, cx, cy, 2 * N, 3, 9.6, 6, 16 * z, 40 * z, 10 * z, (x, y, an, s, k) => { const l = (7 * s + 2) * Z; flat(L, x, y, an + k * 5, l, S.rect, PAPER, 2); flat(L, x, y, an + k * 5, l, tri, PAPER2, 0); });
    burst(t, cx - a * .2, cy - a * .2, 6 * N, 2.5, 10.1, 2, 12 * z, 60 * z, 0, (x, y, an, s, k, i) => { const l = (11 * s + 4) * Z, ca = Math.cos(an), sa = Math.sin(an), tl = l + 20 * z * (1 - k); if (k < .75) pen2(L, [[x - ca * tl, y - sa * tl], [x - ca * l * .5, y - sa * l * .5]], 2, PAPER); if (i % 2) tint(L, M, x, y, an, l, dart, 2.2); else flat(L, x, y, an, l, dart, PAPER, 2.2); flat(L, x, y, an, l, poly([[1.3, 0], [-.4, 0], [-.8, .7]]), SHADE2, 0); });
    if (t < 3) { const [x, y, sx, sy, rot] = t < 1 ? [cx, cy, a, a, 0] : t < 2 ? [cx - a / 2, cy, a / 2, a, -.07] : [cx - a / 2, cy - a / 2, a / 2, a / 2, .16];
      flat(L, x, y, rot, [sx, sy], S.rect, PAPER, 0); flat(L, x, y, rot, [sx, sy], tri, PAPER2, 0); if (t < 1) pen(L, [[x - sx * .9, y + sy * .9], [x + sx * .9, y - sy * .9]], 1.6, "#b9a67c"); at(L, x, y, rot, [sx, sy], S.rect); ink(L, 3); hole(L, M, x, y, rot, [sx * .45, sy * .45], S.sq, 2.2); } };
  // crystal, light trail: a thin upright line of light closes while a level one opens sideways; motes rise in curls on tapering tails in the prism's colours
  const P6 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75, q = R(53);
    if (t >= .5 && t < 8.5) { const l = 86 * z * eo(U(t, .5, 4)), th = 10 * Z * (1 - ei(U(t, 3.5, 8.5))); if (th > .8) { tint(L, M, cx, cy, 0, [l, th * 2], S.diamond, 2); flat(L, cx, cy, 0, [l * .8, th * .7], S.diamond, "#fff", 0); } }
    if (t < 4) { const v = (t < 1 ? 82 : 82 * (1 - ei(U(t, 1, 4)))) * z, w = hold(t, [13, 10, 7, 4]) * Z; if (v > 3) { tint(L, M, cx, cy, Math.PI / 2, [v, w * 2], S.diamond, 2); flat(L, cx, cy, Math.PI / 2, [v * .82, w * .7], S.diamond, "#fff", 0); } }
    if (t < 2) wstar(L, cx, cy, hold(t, [26, 17]) * z, hold(t, [6, 4]) * z, 4, Math.PI / 4, 2);
    for (let i = 0; i < 9 * N; i++) { const ph = q() * TAU, sp1 = .7 + q() * .8, w = (16 + q() * 24) * z, t0 = 2 + (i % 3) * .4, k = U(t, t0, 12.6); if (t < t0 || k >= 1) continue; const e = eo(k), p = [];
      for (let j = 0; j <= 6; j++) { const v = Math.max(0, e - .24 * (1 - j / 6)); p.push([cx + Math.sin(ph + v * 5 * sp1) * w * (.4 + v), cy - v * 54 * z * sp1 - 2, (j / 6) ** .7 * (5.4 * (1 - k * k) + .5) * Z]); }
      if (i % 3 === 1) tint(L, M, 0, 0, 0, 1, brush(p), 1.6); else flat(L, 0, 0, 0, 1, brush(p), i % 3 ? PRISM[(i / 3 | 0) % 3] : "#fff", 1.6); }
    for (let i = 0; i < 2 * N; i++) { const k = (t - 5 - i * 1.1) / 4; if (k > 0 && k < 1) tw(L, M, cx + (i % 2 ? -34 : 30) * z * (1 + (i > 1) * .5), cy - (10 + i * 12) * z, Math.sin(k * Math.PI) * 9 * Z, 0); } };
  // night, paper cut: a paper disc of the charm's colour with a white edge lifts and flips edge-on, then scatters as confetti squares that turn as they fall; paper bats and a crescent flutter down
  const P7 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75, q = R(61);
    for (let i = 0; i < 12 * N; i++) { const a = q() * TAU, d = (.4 + q() * .7) * 66 * z, w = (6 + q() * 5) * Z, k = U(t, 2.5, 12.6); if (t < 2.5 || k >= 1) continue; const e = eo(k), x = cx + Math.cos(a) * d * e, y = cy - 8 * z + Math.sin(a) * d * e * .8 + k * k * 28 * z, fl = Math.max(.15, Math.abs(Math.cos(k * 9 + i))), s = w * (1 - ei(k)), rot = a + k * (4 + i % 3); if (s < .8) continue;
      if (i % 3 === 1) tint(L, M, x, y, rot, [s, s * fl], S.rect, 1.7); else flat(L, x, y, rot, [s, s * fl], S.rect, i % 3 ? MOON : "#fffdf6", 1.7); }
    for (let j = 0; j < 3 * N; j++) { const a = j * TAU / (3 * N) + .7, k = U(t, 2.5, 12.6); if (t < 2.5 || k >= 1) continue; const e = eo(k), d = (38 + (j % 3) * 10) * z, x = cx + Math.cos(a) * d * e + Math.sin(k * 6 + j) * 8 * z, y = cy - 6 * z + Math.sin(a) * d * e * .7 + k * k * 24 * z, fl = Math.cos(k * 7 + j * 2), sx = (fl < 0 ? -1 : 1) * Math.max(.14, Math.abs(fl)), s = 19 * Z * (1 - ei(k)); if (s < 2) continue;
      if (j % 3 === 2) cut(L, M, x, y, 0, [s * sx, s], S.moon(0), MOON, 3); else cut(L, M, x, y, Math.sin(k * 5 + j) * .3, [s * sx, s], bat((Math.floor(t) + j) % 2), null, 3); }
    if (t < 3) { const r = 42 * z * hold(t, [1, 1.12, 1.04]), sx = hold(t, [1, .14, .85]), y = cy - hold(t, [0, 8, 12]) * z; cut(L, M, cx, y, 0, [r * sx, r], S.dot, null, 5); flat(L, cx - 3 * z * sx, y, 0, [r * .6 * sx, r * .6], S.moon(0), MOON, 2.2); flat(L, cx + r * .55 * sx, y - r * .4, 0, [2.6 * Z * sx, 2.6 * Z], S.dot, "#fffdf6", 0); } };
  // storm, vortex: spiral arms and rain wind inward and tighten, a spark at the eye, then zigzag sparks, arcs and rain are flung out on a twist
  const P8 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75, q = R(71), q2 = R(72), na = N > 1 ? 5 : 3;
    if (t < 5) { const k = U(t, 0, 4.8), r1 = (76 * (1 - ei(k)) + 12) * z, span = 1.9 * (1 - k * .4), w = (7.5 * (1 - k * .6) + 1) * Z;
      for (let i = 0; i < 6 * N; i++) { const a = q() * TAU + k * k * 7, r = (86 * (1 - ei(k)) + 8) * z * (.6 + q() * .4), b = a + Math.PI / 2 + .5, l = (9 * (1 - k) + 3) * Z, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; pen2(L, [[x, y], [x + Math.cos(b) * l, y + Math.sin(b) * l]], 2, RAIN); }
      for (let i = 0; i < na; i++) { const a0 = k * k * 9 + i * TAU / na, p = []; for (let j = 0; j <= 12; j++) { const tt = j / 12, a = a0 + tt * span, r = r1 * (1 - tt * .55); p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, Math.sin(tt * Math.PI) ** .6 * w]); } if (i % 2) tint(L, M, 0, 0, 0, 1, brush(p), 2.2); else flat(L, 0, 0, 0, 1, brush(p), "#fff", 2.2); } }
    if (t >= 5) { const k = U(t, 5, 12.6), e = eo(k), s = 1 - ei(k), ka = U(t, 5, 10.5);
      if (ka < 1) for (let i = 0; i < 3; i++) { const p = arcB(cx, cy, (26 + eo(ka) * 50) * z, i * TAU / 3 + eo(ka) * 2.5, 1.5 * (1 - ka), (5 * (1 - ka) + .6) * Z); if (i % 2) flat(L, 0, 0, 0, 1, p, "#fff", 1.8); else tint(L, M, 0, 0, 0, 1, p, 1.8); }
      if (k < 1) { for (let i = 0; i < 7 * N; i++) { const a = q2() * TAU, d = (22 + e * (36 + q2() * 26)) * z, l = (13 * (1 - k) + 2) * Z; pen2(L, [[cx + Math.cos(a) * d, cy + Math.sin(a) * d], [cx + Math.cos(a) * (d + l), cy + Math.sin(a) * (d + l)]], 2, RAIN); }
        if (s > .06) for (let i = 0; i < 5 * N; i++) { const a = i * TAU / (5 * N) + e * 1.4, d = (12 + e * 60) * z; tint(L, M, cx + Math.cos(a) * d, cy + Math.sin(a) * d, a - Math.PI / 2 + .6, [(9 * s + 2.5) * Z * ((Math.floor(t) + i) % 2 ? 1 : -1), (13 * s + 3) * Z], S.bolt, 2); } } }
    if (t >= 4 && t < 7) wstar(L, cx, cy, hold(t - 4, [30, 48, 24]) * z, hold(t - 4, [8, 12, 6]) * z, 4, Math.floor(t) * .5, 2.5); };
  // star, stardust: a gold star with a heart of the charm's colour swells and bursts into a spray of fine dust and small twinkles that drift down on curved paths
  const P9 = (L, M, t, cx, cy, z, N) => { const Z = z ** .75, q = R(83), up = -Math.PI / 2;
    for (let i = 0; i < 22 * N; i++) { const a = q() * TAU, sp1 = (30 + q() * 46) * z, r0 = 2.6 + q() * 3, k = U(t, 1.5, 12.7); if (t < 1.5 || k >= 1) continue; const e = eo(k), x = cx + Math.cos(a) * sp1 * e + Math.sin(k * 5 + i) * 7 * z * k, y = cy + Math.sin(a) * sp1 * e * .85 + k * k * 22 * z, r = r0 * Z * (1 - ei(k)); if (r < .6) continue;
      if (i % 3 === 2) tint(L, M, x, y, 0, r, S.dot, 1.3); else flat(L, x, y, 0, r, S.dot, i % 3 ? "#fff" : GOLD, 1.3); }
    for (let i = 0; i < 6 * N; i++) { const a = i * TAU / (6 * N) + .5 + q() * .4, sp1 = (40 + q() * 26) * z, k = U(t, 2, 12.7); if (t < 2 || k >= 1) continue; const e = eo(k), x = cx + Math.cos(a) * sp1 * e + Math.sin(k * 4 + i * 2) * 10 * z * k, y = cy + Math.sin(a) * sp1 * e * .8 + k * k * 24 * z; tw(L, M, x, y, (1 - ei(k)) * (12 + (i % 2) * 4) * Z * (.65 + .35 * ((Math.floor(t) + i) % 2)), i % 2); }
    if (t < 3) { const s = hold(t, [.8, 1.12, .7]) * 60 * z, rot = up + hold(t, [0, .12, .3]); wstar(L, cx, cy, s, s * .42, 5, rot, 3.5, GOLD); hole(L, M, cx, cy, 0, s * .52, sp(5, .42, rot), 2); } };
  const KP = [P0, P1, P2, P3, P4, P5, P6, P7, P8, P9];
  Object.assign(FX, {
    // the ten pops: each kingdom's language at size 1 (see P0..P9)
    pop0: K(14, 192, 192, (L, M, f) => P0(L, M, f, 96, 96, 1, 1)), pop1: K(14, 192, 192, (L, M, f) => P1(L, M, f, 96, 96, 1, 1)), pop2: K(14, 192, 192, (L, M, f) => P2(L, M, f, 96, 96, 1, 1)), pop3: K(14, 192, 192, (L, M, f) => P3(L, M, f, 96, 96, 1, 1)), pop4: K(14, 192, 192, (L, M, f) => P4(L, M, f, 96, 96, 1, 1)),
    pop5: K(14, 192, 192, (L, M, f) => P5(L, M, f, 96, 96, 1, 1)), pop6: K(14, 192, 192, (L, M, f) => P6(L, M, f, 96, 96, 1, 1)), pop7: K(14, 192, 192, (L, M, f) => P7(L, M, f, 96, 96, 1, 1)), pop8: K(14, 192, 192, (L, M, f) => P8(L, M, f, 96, 96, 1, 1)), pop9: K(14, 192, 192, (L, M, f) => P9(L, M, f, 96, 96, 1, 1)),

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
  // ---------- blasts: the kingdom's language at twice the size with twice the pieces; its first three drawings play frame for frame, the flight is stretched over the rest ----------
  const BT = (f) => f < 3 ? f : 3 + (f - 3) * 11 / 19, BL = (k, extra) => K(22, 384, 384, (L, M, f) => { extra(L, M, f, 192); KP[k](L, M, BT(f), 192, 192, 2, 2); });
  // ---------- beams: the row is 1024 x 128 with the charm at (512, 64); the body runs out both ways on an ease-out and reaches EXT by frame 5 ----------
  const EXT = 470, bext = (f) => eo(cl(f / 5)) * EXT, arr = (d) => 5 * (1 - Math.cbrt(1 - cl(d / EXT)));
  // things standing along the row: cb(x, side, age in frames since the front passed, index, distance)
  const row = (f, n, cb, off = .6) => { for (const sd of [-1, 1]) for (let i = 0; i < n; i++) { const d = (i + off) / n * (EXT - 10), g = f - arr(d); if (g > 0) cb(512 + sd * d, sd, g, i + (sd > 0 ? n : 0), d); } };
  const BM = (k, body) => K(16, 1024, 128, (L, M, f) => { body(L, M, f, 512, 64, bext(f)); KP[k](L, M, f, 512, 64, .6, 1); });
  Object.assign(FX, {
    // forest: a hard shock ring under the knock
    blast0: BL(0, (L, M, f, c) => { if (f >= 2 && f < 9) { const k = (f - 2) / 7; ring(L, M, c, c, 80 + eo(k) * 96, 16 * (1 - k) + 2); } }),
    // water: two more ripples run out after the first
    blast1: BL(1, (L, M, f, c) => { for (const f0 of [3, 6]) { const k = U(f, f0, f0 + 11); if (f < f0 || k >= 1) continue; const r = 60 + eo(k) * 122, w = 3.4 * (1 - k) + .7; for (const [lw, col] of [[w + 2.6, INK], [w, "#e4f6ff"]]) { L.beginPath(); L.arc(c, c, r, 0, 7); L.lineWidth = lw; L.strokeStyle = col; L.stroke(); } } }),
    // fire: a spiked ring of the charm's colour that turns on whole frames
    blast2: BL(2, (L, M, f, c) => { if (f >= 2 && f < 10) { const k = (f - 2) / 8, r = 90 + eo(k) * 86; gonRing(L, M, c, c, r, 15 * (1 - k) + 1, 12, Math.floor(f) * .2, r * .84); } }),
    // ice: a hexagon ring
    blast3: BL(3, (L, M, f, c) => { if (f >= 1 && f < 9) { const k = (f - 1) / 8; gonRing(L, M, c, c, 60 + eo(k) * 118, 15 * (1 - k) + 1, 3, -Math.PI / 2); } }),
    // sky: five small bubbles swim out and pop in turn
    blast4: BL(4, (L, M, f, c) => { for (let i = 0; i < 5; i++) { const f0 = 3 + i * .8, g = f - f0; if (g <= 0) continue; const a = i * TAU / 5 + .6, d = 92 + eo(U(g, 0, 6)) * 40, x = c + Math.cos(a) * d, y = c + Math.sin(a) * d - g * 1.5;
      if (g < 5) { const r = 17 * back(g / 2.5); M.beginPath(); M.arc(x, y, r, 0, 7); M.lineWidth = 4.5; M.strokeStyle = "#fff"; M.stroke(); for (const [o, lw] of [[2.3, 2], [-2.3, 1.3]]) { L.beginPath(); L.arc(x, y, Math.max(.5, r + o), 0, 7); ink(L, lw); } flat(L, x - r * .35, y - r * .4, 0, r * .16, S.dot, "#fff", 1.5); }
      else { const k = U(g, 5, 10); if (k < 1) for (let j = 0; j < 6; j++) { const p = arcB(x, y, 19 + eo(k) * 16, j * TAU / 6 + i, .5 * (1 - k * .6), 3 * (1 - k) + .4); if (j % 2) tint(L, M, 0, 0, 0, 1, p, 1.6); else flat(L, 0, 0, 0, 1, p, "#fff", 1.6); } } } }),
    // sand: a square ring, a sheet unfolding
    blast5: BL(5, (L, M, f, c) => { if (f >= 2 && f < 9.5) { const k = (f - 2) / 7.5, r = 80 + eo(k) * 100; gonRing(L, M, c, c, r, 14 * (1 - k) + 1, 2, Math.PI / 4 + eo(k) * .5); } }),
    // crystal: two slanted lines of light cross behind the upright one, in the prism's colours
    blast6: BL(6, (L, M, f, c) => { if (f >= 1 && f < 11) { const l = 172 * eo(U(f, 1, 5.5)), th = 7 * (1 - ei(U(f, 4.5, 11))); if (th > .7) [Math.PI / 4, -Math.PI / 4].forEach((a, i) => { tint(L, M, c, c, a, [l, th * 2], S.diamond, 2); flat(L, c, c, a, [l * .8, th * .6], S.diamond, PRISM[i * 2], 0); }); } }),
    // night: a scalloped paper ring
    blast7: BL(7, (L, M, f, c) => { if (f >= 3 && f < 11) { const k = (f - 3) / 8, r = 84 + eo(k) * 92; gonRing(L, M, c, c, r, 13 * (1 - k) + 1, 10, Math.floor(f) * .16, r * .9); } }),
    // storm: a ring thrown off when the eye lets go
    blast8: BL(8, (L, M, f, c) => { if (f >= 6.5 && f < 14) { const k = (f - 6.5) / 7.5; ring(L, M, c, c, 40 + eo(k) * 136, 15 * (1 - k) + 1); } }),
    // star: five gold stars fly from the points on trails of the charm's colour
    blast9: BL(9, (L, M, f, c) => { const k = U(f, 2, 15), up = -Math.PI / 2, pos = (i, v) => { const a = up + i * TAU / 5 + eo(v) * .7, d = 40 + eo(v) * 118; return [c + Math.cos(a) * d, c + Math.sin(a) * d]; }; if (f < 2 || k >= 1) return;
      for (let i = 0; i < 5; i++) { const s = 1 - ei(k), p = []; for (let j = 0; j <= 7; j++) p.push([...pos(i, Math.max(0, k - .3 * (1 - j / 7))), j / 7 * 9 * s + .2]); tint(L, M, 0, 0, 0, 1, brush(p), 2.2); const [x, y] = pos(i, k); if (s > .06) { wstar(L, x, y, 22 * s + 3, (22 * s + 3) * .44, 5, up + k * 4, 2.6, GOLD); star(L, x, y, 9 * s + 1, (9 * s + 1) * .44, 5, up + k * 4); L.fillStyle = "#fff"; L.fill(); } } }),

    // forest: the knock runs along a row of wooden pegs that stand up and topple outward like dominoes behind a rolling log; chips hop, sawdust
    beam0: BM(0, (L, M, f, c, cy, ext) => {
      row(f, 5, (x, sd, g, i) => drift(L, g, 1.5, 8, x, cy + 30, sd * 16, -10, 10, i + 90, DUST, DUST2), .3);
      row(f, 11, (x, sd, g, i) => { const s = back(g / 1.5) * (1 - ei(U(g, 5.5, 9))), rot = sd * eo(U(g, 2, 4.5)) * 1.42, h = 44 * s, w = 8 * s, p = loc(x, cy + 26, rot, 1); if (s < .08) return; flat(L, ...p(0, -h / 2), rot, [w, h / 2], S.rect, i % 2 ? WOOD : "#d39d5c", 2.2); hole(L, M, ...p(0, -h * .8), rot, [w, h * .2], S.rect, 2); });
      row(f, 4, (x, sd, g, i) => { const k = U(g, 0, 8), s = 10 * (1 - ei(U(g, 3, 8))); if (k < 1 && s > 1) flat(L, x + sd * k * 30, cy - 4 - Math.sin(k * Math.PI) * 34, g * .9 * sd, [s, s * .4], S.rect, WOOD2, 2); }, .85);
      if (f < 7.5) for (const sd of [-1, 1]) { const x = c + sd * ext, s = 21 * Math.min(1, .4 + f * .4) * (1 - ei(U(f, 5.5, 7.5))), y = cy + 6 - Math.abs(Math.sin(ext / 38)) * 8, an = sd * ext / 21; if (s < 1.5) continue; flat(L, x, y, 0, s, S.dot, WOOD2, 3); flat(L, x, y, 0, s * .76, S.dot, WOOD, 0); at(L, x, y, 0, s * .42, S.dot); L.lineWidth = 2; L.strokeStyle = WOOD2; L.stroke(); pen(L, [[x, y], [x + Math.cos(an) * s * .76, y + Math.sin(an) * s * .76]], 2, WOOD2); } }),
    // water: a wave of the charm's colour rolls out both ways under an ink rim with a white crest line; droplets jump from it
    beam1: BM(1, (L, M, f, c, cy, ext) => { const th = f < 6 ? 14 + f * 2.6 : 29.6 * (1 - ei(U(f, 6, 13)));
      if (th > 1.2 && ext > 20) { const top = [], bot = []; for (let j = -30; j <= 30; j++) { const x = ext * j / 30, tp = Math.min(1, (ext - Math.abs(x)) / 70 + .04), ph = Math.abs(x) * .05 - f * 1.2; top.push([c + x, cy - th * tp * (1 + .36 * Math.sin(ph))]); bot.push([c + x, cy + th * tp * (1 + .36 * Math.sin(ph + 2))]); }
        tint(L, M, 0, 0, 0, 1, poly(top.concat(bot.slice().reverse())), 3); pen(L, top.slice(3, -3).map(([x, y]) => [x, y + th * .3]), Math.max(1, th * .1), "#fff"); }
      row(f, 7, (x, sd, g, i) => { const k = U(g, 0, 8), up = i % 2 ? 1 : -1, s = (7 * (1 - ei(k)) + 1.5); if (k >= 1 || s < 1.8) return; const px = x + sd * k * 14, py = cy + up * (22 + eo(k) * 16) + k * k * 10; tint(L, M, px, py, up * Math.PI / 2 * (1 - k) + k * Math.PI / 2, s, S.drop, 2); flat(L, px - s * .2, py - s * .25, 0, s * .22, S.dot, "#fff", 0); }); }),
    // fire: a streak of flame in the charm's colour with teeth that flicker on whole frames, a yellow and a white core; speed lines, small stars hop off it
    beam2: BM(2, (L, M, f, c, cy, ext) => { const th = f < 6 ? 15 + f * 3 : 33 * (1 - ei(U(f, 6, 13)));
      if (f >= 1 && f < 8) { const q = R(29); for (let i = 0; i < 10; i++) { const sd = i % 2 ? 1 : -1, d = ext * (.25 + q() * .7), y = cy + (q() - .5) * 104, l = 26 + q() * 40; pen2(L, [[c + sd * d, y], [c + sd * Math.min(EXT + 20, d + l), y]], 2.4, CREAM); } }
      if (th > 1.5 && ext > 30) { const J = Math.floor(ext / 38), edge = (sg) => { const p = []; for (let j = -J; j <= J; j++) { const d = Math.abs(j) * 38, sd = j < 0 ? -1 : 1, fl = 1 + .3 * (((Math.abs(j) * 7 + Math.floor(f) * 3 + (sg > 0 ? 2 : 0)) % 5) / 4), pk = [c + sd * Math.min(ext, d + 12), cy + sg * th * fl], va = [c + sd * d, cy + sg * th * .52]; if (j < 0) p.push(pk, va); else if (j > 0) p.push(va, pk); else p.push(va); } return p; }, tip = Math.min(th * 1.5, 504 - ext);
        tint(L, M, 0, 0, 0, 1, poly([[c - ext - tip, cy], ...edge(-1), [c + ext + tip, cy], ...edge(1).reverse()]), 3);
        for (const [m, col] of [[.42, "#ff7a2a"], [.27, "#ffc23a"], [.11, "#fff6c8"]]) flat(L, 0, 0, 0, 1, poly([[c - ext, cy - th * m], [c + ext, cy - th * m], [c + ext + tip * m * 2, cy], [c + ext, cy + th * m], [c - ext, cy + th * m], [c - ext - tip * m * 2, cy]]), col, 0); }
      row(f, 5, (x, sd, g, i) => { const k = U(g, 0, 8.5); if (k < 1) tw(L, M, x + sd * k * 20, cy + (i % 2 ? -1 : 1) * (30 + eo(k) * 14), 10 * (1 - ei(k)) + 1, i % 3 === 0, 5, k * 4 + i); }); }),
    // ice: a crack races out both ways as a zigzag of the charm's colour with a white core and side cracks; flat shards jump off it, frost ticks
    beam3: BM(3, (L, M, f, c, cy, ext) => { const w = 9 * (1 - ei(U(f, 6.5, 13))), zz = (j) => j ? (j % 2 ? 1 : -1) * (7 + (j * 37 % 5)) : 0, J = Math.floor(ext / 34);
      if (w > .6 && ext > 20) { const pts = [[c - ext, cy, 0]]; for (let j = -J; j <= J; j++) pts.push([c + j * 34, cy + zz(Math.abs(j)) * (j < 0 ? -1 : 1), w * Math.min(1, (ext - Math.abs(j) * 34) / 60 + .15)]); pts.push([c + ext, cy, 0]);
        for (let j = 1; j <= J; j += 2) for (const sd of [-1, 1]) { const g = f - arr(j * 34), up = zz(j) * sd > 0 ? 1 : -1, l = 20 * eo(U(g, 0, 2)) * (1 - ei(U(g, 4, 7))); if (l > 2) pen2(L, [[c + sd * j * 34, cy + zz(j) * sd], [c + sd * (j * 34 + l * .7), cy + zz(j) * sd + up * l]], 2, "#fff"); }
        tint(L, M, 0, 0, 0, 1, brush(pts), 2.5); pen(L, pts.map((p) => [p[0], p[1]]), Math.max(1, w * .3), "#fff"); }
      row(f, 8, (x, sd, g, i) => { const k = U(g, 0, 8.5), up = i % 2 ? 1 : -1, s = 14 * (1 - ei(k)); if (k >= 1 || s < 2) return; const rot = up * Math.PI / 2 + sd * (.3 + k * .8), px = x + sd * k * 16, py = cy + up * (14 + eo(k) * 30), sh = poly([[1.2, 0], [-.2, .7], [-1, .1], [-.5, -.6]]); tint(L, M, px, py, rot, [s, s * .7], sh, 2.2); at(L, px, py, rot, [s, s * .7], poly([[1.2, 0], [-.5, -.6], [-.1, -.08]])); L.fillStyle = "rgba(255,255,255,.85)"; L.fill(); });
      row(f, 4, (x, sd, g, i) => { const k = (g - 1) / 6; if (k > 0 && k < 1) tick(L, x, cy + (i % 2 ? 34 : -34), Math.sin(k * Math.PI) * 9); }, .2); }),
    // sky: three wind strokes sweep out and curl, small bubbles swell behind the gust and pop into arcs, feathers tumble along
    beam4: BM(4, (L, M, f, c, cy, ext) => {
      [-26, 2, 28].forEach((oy, li) => { const st = ext * ei(U(f, 2.5 + li * .6, 11.5 + li * .6)); if (ext - st < 14) return; for (const sd of [-1, 1]) { const p = []; for (let j = 0; j <= 20; j++) { const tt = j / 20, d = st + (ext - st) * tt; p.push([c + sd * d, cy + oy + Math.sin(d * .02 + li) * 6 - (tt > .8 ? ((tt - .8) / .2) ** 2 * 14 * (li % 2 ? -1 : 1) : 0), Math.sin(tt * Math.PI) ** .5 * (4.8 - li * .5)]); } if (li === 1) tint(L, M, 0, 0, 0, 1, brush(p), 2); else flat(L, 0, 0, 0, 1, brush(p), "#fff", 2); } });
      row(f, 6, (x, sd, g, i) => { const y = cy + (i % 2 ? -15 : 13); if (g < 3.2) { const r = 13 * back(g / 2); if (r < 1.5) return; M.beginPath(); M.arc(x, y, r, 0, 7); M.lineWidth = 4; M.strokeStyle = "#fff"; M.stroke(); for (const [o, lw] of [[2, 1.9], [-2, 1.2]]) { L.beginPath(); L.arc(x, y, Math.max(.5, r + o), 0, 7); ink(L, lw); } flat(L, x - r * .35, y - r * .4, 0, r * .17, S.dot, "#fff", 1.4); }
        else { const k = U(g, 3.2, 8.2); if (k < 1) for (let j = 0; j < 6; j++) { const p = arcB(x, y, 15 + eo(k) * 13, j * TAU / 6 + i, .55 * (1 - k * .6), 2.8 * (1 - k) + .4); if (j % 2) tint(L, M, 0, 0, 0, 1, p, 1.5); else flat(L, 0, 0, 0, 1, p, "#fff", 1.5); } } });
      row(f, 3, (x, sd, g, i) => { const k = U(g, .5, 9), s = 15 * (k < .15 ? k / .15 : 1 - ei((k - .15) / .85)); if (k <= 0 || k >= 1 || s < 1.5) return; const px = x + sd * k * 44, py = cy + Math.sin(k * 5 + i * 2) * 22, r = k * 5 * sd + i, p = loc(px, py, r, s); flat(L, px, py, r, s, S.feather, "#fff", 2); pen(L, [p(-1.6, 0), p(.9, 0)], 1.5); }, .3); }),
    // sand: a folded paper strip unrolls panel by panel with a band of the charm's colour, then folds shut from the middle outward; darts and grains jump off it
    beam5: BM(5, (L, M, f, c, cy, ext) => { const PW = 40, jy = (j) => (j % 2 ? 6 : -6), off = (j, d) => jy(j) + (jy(j + 1) - jy(j)) * (d - j * PW) / PW;
      row(f, 6, (x, sd, g, i) => { const k = U(g, 0, 7); if (k < 1) flat(L, x + sd * k * 12, cy + (i % 2 ? -1 : 1) * (24 + eo(k) * 18) + k * k * 8, k * 6, 3.4 * (1 - ei(k)) + 1.2, i % 2 ? S.dot : S.sq, i % 3 ? SAND : SAND2, 1.5); }, .2);
      for (const sd of [-1, 1]) for (let j = 0; j < 12; j++) { const vis = cl((ext - j * PW) / PW), fold = ei(U(f, 7 + j * .4, 9.5 + j * .4)), d0 = j * PW + PW * fold, d1 = j * PW + PW * vis; if (d1 - d0 < 2) continue; const x0 = c + sd * d0, x1 = c + sd * d1, o0 = off(j, d0), o1 = off(j, d1), band = (h) => poly([[x0, cy - h + o0], [x1, cy - h + o1], [x1, cy + h + o1], [x0, cy + h + o0]]);
        flat(L, 0, 0, 0, 1, band(17), j % 2 ? PAPER2 : PAPER, 2.2); hole(L, M, 0, 0, 0, 1, band(5.5), 1.6); }
      row(f, 4, (x, sd, g, i) => { const k = U(g, 1, 8.5), s = 1 - ei(k); if (k <= 0 || k >= 1 || s < .08) return; const an = (sd > 0 ? 0 : Math.PI) + (i % 2 ? -1 : 1) * sd * .95, l = 11 * s + 3, d = 10 + eo(k) * 36, px = x + Math.cos(an) * d, py = cy + Math.sin(an) * d, tl = l + 16 * (1 - k); if (k < .75) pen2(L, [[px - Math.cos(an) * tl, py - Math.sin(an) * tl], [px - Math.cos(an) * l * .5, py - Math.sin(an) * l * .5]], 2, PAPER);
        const dart = poly([[1.3, 0], [-.8, .7], [-.4, 0], [-.8, -.7]]); if (i % 2) tint(L, M, px, py, an, l, dart, 2.2); else flat(L, px, py, an, l, dart, PAPER, 2.2); flat(L, px, py, an, l, poly([[1.3, 0], [-.4, 0], [-.8, .7]]), SHADE2, 0); }, .5); }),
    // crystal: a thin ray of the charm's colour with a white core, three hair lines in the prism's colours above and below it, motes curling upward on tails
    beam6: BM(6, (L, M, f, c, cy, ext) => { const th = f < 5 ? 3 + f * 2 : 13 * (1 - ei(U(f, 5, 12.5)));
      PRISM.forEach((col, j) => { const k = U(f, 1.5 + j * .5, 11 + j * .5); if (k <= 0 || k >= 1) return; const x0 = ext * (.1 + ei(k) * .86), x1 = ext * Math.min(1, .2 + eo(cl(k * 2.5)) * .8) * .96, sg = j % 2 ? 1 : -1, y = cy + sg * (th * .5 + 9 + j * 3); if (x1 > x0 + 6) for (const sd of [-1, 1]) { const pp = [[c + sd * x0, y], [c + sd * x1, y]]; pen(L, pp, 4.2); pen(L, pp, 1.8, col); } });
      if (th > .7 && ext > 10) { tint(L, M, c, cy, 0, [ext, th * 2], S.diamond, 2); flat(L, c, cy, 0, [ext * .9, th * .7], S.diamond, "#fff", 0); }
      row(f, 9, (x, sd, g, i) => { const k = U(g, 0, 9.5); if (k >= 1) return; const e = eo(k), p = []; for (let j = 0; j <= 6; j++) { const v = Math.max(0, e - .26 * (1 - j / 6)); p.push([x + Math.sin(i * 1.9 + v * 5) * 13 * (.4 + v), cy - v * 42 - 2, (j / 6) ** .7 * (5 * (1 - k * k) + .5)]); }
        if (i % 3 === 1) tint(L, M, 0, 0, 0, 1, brush(p), 1.5); else flat(L, 0, 0, 0, 1, brush(p), i % 3 ? PRISM[(i / 3 | 0) % 3] : "#fff", 1.5); }); }),
    // night: a string runs out with paper pennants, bats and crescents that flip open along it, swing once, then turn edge-on and fall as confetti
    beam7: BM(7, (L, M, f, c, cy, ext) => { const sy0 = (d) => cy - 22 + 9 * Math.sin((d % 157) / 157 * Math.PI), st = ext * ei(U(f, 9.5, 14.2));
      if (ext - st > 8) for (const sd of [-1, 1]) { const p = []; for (let j = 0; j <= 30; j++) { const d = st + (ext - st) * j / 30; p.push([c + sd * d, sy0(d)]); } pen2(L, p, 1.8, "#fffdf6"); }
      row(f, 10, (x, sd, g, i, d) => { const fk = U(f, 7.5 + (i % 10) * .25, 12 + (i % 10) * .25), s = back(g / 2) * (1 - ei(fk)); if (s < .06) return; const y = sy0(d) + fk * fk * 30, fl = fk > 0 ? Math.cos(fk * 8 + i) : 1, sx = (fl < 0 ? -1 : 1) * Math.max(.14, Math.abs(fl)), rot = Math.sin(g * 1.2 + i) * .22 * (1 - U(g, 0, 6)) + fk * (i % 2 ? 1.5 : -1.5), kind = i % 5;
        if (kind === 3) cut(L, M, x, y + 13 * s, rot, [15 * s * sx, 15 * s], bat(0), null, 3); else if (kind === 1) cut(L, M, x, y + 14 * s, rot, [13 * s * sx, 13 * s], S.moon(0), MOON, 3); else cut(L, M, x, y, rot, [s * sx, s], poly([[-13, 0], [13, 0], [0, 30]]), kind === 0 ? null : kind === 2 ? VIOLET : "#fffdf6", 3); }); }),
    // storm: a twister lying on its side: turning arcs that widen along the row round a wavering thread, zigzag sparks and rain thrown off
    beam8: BM(8, (L, M, f, c, cy, ext) => { const st = ext * ei(U(f, 6, 12.5));
      row(f, 6, (x, sd, g, i) => { const k = U(g, 0, 6); if (k < 1) { const px = x + sd * k * 40, y = cy + (i % 3 - 1) * 30; pen2(L, [[px, y], [px - sd * (12 * (1 - k) + 3), y + 4]], 2, RAIN); } }, .85);
      if (ext - st > 10) for (const sd of [-1, 1]) { const p = []; for (let j = 0; j <= 30; j++) { const d = st + (ext - st) * j / 30; p.push([c + sd * d, cy + Math.sin(d * .07 - f * 1.5) * 5 * (d / EXT * 1.5 + .3)]); } pen2(L, p, 2, "#fff"); }
      row(f, 8, (x, sd, g, i, d) => { const k = U(g, 0, 8.5); if (k >= 1) return; const ry = 16 + d / EXT * 30, rx = 8 + d / EXT * 5, span = Math.sin(k * Math.PI) ** .5 * 2, w = 3 + d / EXT * 2; for (const h of [0, 1]) { const pts = []; for (let j = 0; j <= 10; j++) { const a = f * .9 * sd + i * 1.1 + h * Math.PI + j / 10 * span; pts.push([x + Math.cos(a) * rx, cy + Math.sin(a) * ry, Math.sin(j / 10 * Math.PI) ** .6 * w]); } if ((i + h) % 2) tint(L, M, 0, 0, 0, 1, brush(pts), 2); else flat(L, 0, 0, 0, 1, brush(pts), "#fff", 2); } });
      row(f, 4, (x, sd, g, i) => { const k = U(g, .5, 8.5), s = 1 - ei(k); if (k > 0 && k < 1 && s > .06) tint(L, M, x + sd * eo(k) * 26, cy + (i % 2 ? -1 : 1) * (10 + eo(k) * 30), (i % 2 ? -1 : 1) * sd * .5, [(8 * s + 2.5) * ((Math.floor(f) + i) % 2 ? 1 : -1), 12 * s + 3], S.bolt, 2); }, .35); }),
    // star: two gold stars shoot out on tails of the charm's colour that close up behind them, shedding dust and twinkles that drift down; the stars burst at the ends
    beam9: BM(9, (L, M, f, c, cy) => { const E9 = 450, ext = eo(cl(f / 5)) * E9, st = ext * ei(U(f, 2, 10.5));
      row(f, 10, (x, sd, g, i) => { const k = U(g, 0, 9); if (k >= 1) return; const s = 1 - ei(k); for (const m of [0, 1]) { const px = x + m * 22 * sd + Math.sin(k * 5 + i + m) * 7 * k, py = cy + ((i + m) % 2 ? -9 : 9) + k * k * (26 + m * 8), r = (3.4 - m) * s; if (r < .6) continue; if ((i + m) % 3 === 2) tint(L, M, px, py, 0, r, S.dot, 1.3); else flat(L, px, py, 0, r, S.dot, (i + m) % 3 ? "#fff" : GOLD, 1.3); }
        if (i % 3 === 1) tw(L, M, x + Math.sin(k * 4 + i) * 9 * k, cy - 20 + k * k * 30, s * 9 * (.65 + .35 * ((Math.floor(f) + i) % 2)), i % 2); });
      if (ext - st > 8) for (const sd of [-1, 1]) { const mk = (len, wd) => { const p = []; for (let j = 0; j <= 12; j++) { const tt = j / 12, d = ext - len * (1 - tt); p.push([c + sd * d, cy + Math.sin(d * .012) * 5 * sd, tt ** .8 * wd]); } return brush(p); }; tint(L, M, 0, 0, 0, 1, mk(ext - st, 13), 2.5); flat(L, 0, 0, 0, 1, mk((ext - st) * .5, 5), "#fff", 0); }
      for (const sd of [-1, 1]) { if (f < 7) { const x = c + sd * ext, y = cy + Math.sin(ext * .012) * 5 * sd, s = 20 * Math.min(1, .4 + f * .4) * (f < 5 ? 1 : hold(f - 5, [1.3, 1.6])), rot = Math.floor(f * 2) * .31 * sd; wstar(L, x, y, s, s * .44, 5, rot, 3, GOLD); star(L, x, y, s * .5, s * .22, 5, rot); L.fillStyle = "#fff"; L.fill(); }
        burst(f, c + sd * E9, cy, 7, 6.5, 7, 9, 8, 30, 14, (x, y, a, s, k, i) => i % 2 ? tw(L, M, x, y, 9 * s + 1, i % 4 === 1) : flat(L, x, y, 0, 3.2 * s + .8, S.dot, i % 4 ? "#fff" : GOLD, 1.3)); } }),
  });
  window.FxLive = { has: (k) => !!FX[k], dur: (k) => FX[k].n / 24, size: (k) => [FX[k].w, FX[k].h], draw: (k, f, L, M) => FX[k].draw(L, M, f) };
  window.FX_LIST = Object.fromEntries(Object.entries(FX).map(([k, v]) => [k, { n: v.n, w: v.w, h: v.h }]));
  { const ten = (n) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => n + k); window.FX_KINGDOM = { pop: ten("pop"), combo: ten("combo"), blast: ten("blast"), beam: ten("beam") }; }
  window.bakeFx = function (name) { const fx = FX[name], out = [];
    for (let f = 0; f < fx.n; f++) { const a = document.createElement("canvas"), b = document.createElement("canvas"); a.width = b.width = fx.w; a.height = b.height = fx.h; fx.draw(a.getContext("2d"), b.getContext("2d"), f); out.push([a, b]); }
    return out; };
})();
