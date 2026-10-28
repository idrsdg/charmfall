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
  window.FxLive = { has: (k) => !!FX[k], dur: (k) => FX[k].n / 24, size: (k) => [FX[k].w, FX[k].h], draw: (k, f, L, M) => FX[k].draw(L, M, f) };
  window.FX_LIST = Object.fromEntries(Object.entries(FX).map(([k, v]) => [k, { n: v.n, w: v.w, h: v.h }]));
  window.bakeFx = function (name) { const fx = FX[name], out = [];
    for (let f = 0; f < fx.n; f++) { const a = document.createElement("canvas"), b = document.createElement("canvas"); a.width = b.width = fx.w; a.height = b.height = fx.h; fx.draw(a.getContext("2d"), b.getContext("2d"), f); out.push([a, b]); }
    return out; };
})();
