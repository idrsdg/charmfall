// The charms painted as watercolour storybook illustrations (2026-10-28, İdris: "Suluboya masal kitabı... tüm taşlar").
// Each charm is laid down the way a watercolourist would: a soft cast shadow, a first wash put down in several thin layers that never sit
// exactly on top of each other (so the edge is alive), pigment pooled darker at the rim where the water dried, a shadow wash on the far side,
// the light lifted out back to the paper, the details in thicker pigment and white gouache, granulation in the paper's tooth, and last a sepia
// pencil line that wanders and breaks. Uses the game's own shapes (BL, BLA, glowPart, mixc). bake-charms.cjs writes anim/ch-<name>.webp.
(() => {
  // watercolour pigments for the six colour families (rose madder, cadmium orange, gamboge, sap green, cerulean, violet)
  const WCHUE = ["#f2456e", "#ff8731", "#ffca2c", "#35bf5e", "#3192f2", "#a450f2"];   // 2026-11-18 İdris "taşları daha belirgin yap, daha canlı olsunlar": the full pigments with only a tenth of white, a denser first wash and a firmer dried rim;   // 2026-11-11 İdris "biraz daha pastel", picked B from the side-by-side (full pigments f0305e ff7a1a ffc414 1fb84c 1a86f0 9a3cf0 mixed 30% to white);   // 2026-10-28 İdris "taşlar çok soluk, belirgin ve parlak yap": full-strength pigments
  const SEPIA = "rgba(74,52,40,", PAPER = [246, 239, 224];
  const R = (n) => { let s = (n * 9301 + 49297) % 233280; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  // value noise for granulation and the paper's tooth
  const NOISE = (() => { const N = 128, g = new Float32Array(N * N), r = R(77); for (let i = 0; i < g.length; i++) g[i] = r();
    const sm = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, a = g[((yi % N + N) % N) * N + ((xi % N + N) % N)], b = g[((yi % N + N) % N) * N + (((xi + 1) % N + N) % N)], c = g[(((yi + 1) % N + N) % N) * N + ((xi % N + N) % N)], d = g[(((yi + 1) % N + N) % N) * N + (((xi + 1) % N + N) % N)], u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
    return (x, y) => sm(x / 9, y / 9) * .55 + sm(x / 3.2 + 40, y / 3.2) * .3 + sm(x * .9 + 9, y * .9) * .15; })();
  const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; };
  // a wash: the path filled several times, each time nudged and scaled a hair, thin each time; then the pooled rim
  function wash(x, path, col, seed, o = {}) { const r = R(seed), L = o.layers || 5, cx = o.cx || 50, cy = o.cy || 50;
    for (let i = 0; i < L; i++) { x.save(); const s = 1 + (r() - .5) * (o.wob || .035); x.translate(cx + (r() - .5) * (o.j || 1.6), cy + (r() - .5) * (o.j || 1.6)); x.scale(s, s * (1 + (r() - .5) * .02)); x.translate(-cx, -cy); x.fillStyle = hexA(col, o.a || .26); x.fill(path); x.restore(); }
    x.save(); x.clip(path); x.filter = "blur(.7px)"; x.strokeStyle = hexA(mixc0(col, "#140c0c", .3), o.rim || .55); x.lineWidth = o.rw || 3; x.stroke(path); x.restore(); }
  // the shadow side: a second, darker wash clipped to the shape, with a soft inner edge and a firmer dried line
  function shadowWash(x, path, col, cx, cy, Rr, seed) { x.save(); x.clip(path); const d = mixc0(col, "#1a1010", .32);   /* 2026-10-29 İdris "renkler karışmış": the shade is the same pigment, darker, never violet */
    x.filter = "blur(3px)"; x.fillStyle = hexA(d, .3); x.beginPath(); x.ellipse(cx + Rr * .42, cy + Rr * .48, Rr * 1.0, Rr * .92, -.5, 0, 6.2832); x.fill();
    x.filter = "none"; x.strokeStyle = hexA(d, .16); x.lineWidth = 1.2; x.beginPath(); x.ellipse(cx + Rr * .42, cy + Rr * .48, Rr * 1.0, Rr * .92, -.5, 0, 6.2832); x.stroke(); x.restore(); }
  // the light: pigment lifted out with a damp brush, back to the paper
  function lift(x, path, cx, cy, Rr) { x.save(); x.clip(path); x.filter = "blur(2.2px)"; x.globalCompositeOperation = "destination-out"; x.fillStyle = "rgba(0,0,0,.55)"; x.beginPath(); x.ellipse(cx - Rr * .34, cy - Rr * .4, Rr * .3, Rr * .17, -.6, 0, 6.2832); x.fill(); x.restore();
    x.save(); x.clip(path); x.filter = "blur(.6px)"; x.fillStyle = "rgba(255,252,242,.85)"; x.beginPath(); x.ellipse(cx - Rr * .44, cy - Rr * .48, Rr * .09, Rr * .05, -.6, 0, 6.2832); x.fill(); x.restore(); }
  // the pencil: two passes, the second a hair off; long dashes with small gaps where the lead skipped
  function pencil(x, path, seed, w) { const r = R(seed); for (let pass = 0; pass < 2; pass++) { x.save(); x.translate(pass * .45, -pass * .35); x.strokeStyle = pass ? "rgba(58,36,24,.4)" : "rgba(44,26,16,.95)"; x.lineWidth = (w || 1.5) * (pass ? .7 : 1); x.lineCap = "round"; x.lineJoin = "round";
    const dash = []; for (let i = 0; i < 12; i++) { dash.push(18 + r() * 60, r() < .5 ? .8 + r() * 1.6 : .01); } x.setLineDash(dash); x.lineDashOffset = r() * 50; x.stroke(path); x.restore(); } }
  function bbox(q) { const bb = [100, 100, 0, 0]; const pts = typeof q === "string" ? (q.match(/-?\d+(\.\d+)?/g) || []).map(Number) : q[0] === "c" || q[0] === "e" ? [q[1] - q[3], q[2] - (q[4] || q[3]), q[1] + q[3], q[2] + (q[4] || q[3])] : q[1].flat();
    for (let i = 0; i + 1 < pts.length; i += 2) { bb[0] = Math.min(bb[0], pts[i]); bb[2] = Math.max(bb[2], pts[i]); bb[1] = Math.min(bb[1], pts[i + 1]); bb[3] = Math.max(bb[3], pts[i + 1]); } return bb; }
  // painted volume (2026-11-02, "derinlik"): a core shadow where the form turns from the light, paper light bounced into the far rim, the near rim lit.
  // Everything stays inside the silhouette and in the charm's own pigment, so the colour stays clean (2026-10-29 "renkler karışmış").
  function volume(x, body, hue, seed) {
    const px = x.canvas.width, T = x.getTransform(), k = px / 256, d = mixc0(hue, "#1a0c0a", .55);
    x.save(); x.clip(body); const g = x.createRadialGradient(36, 30, 4, 46, 44, 62);
    g.addColorStop(0, hexA(d, 0)); g.addColorStop(.5, hexA(d, 0)); g.addColorStop(.8, hexA(d, .34)); g.addColorStop(1, hexA(d, .62)); x.fillStyle = g; x.fillRect(-20, -20, 140, 140); x.restore();
    const rim = (dx, dy, col, a, blur) => { const t = document.createElement("canvas"); t.width = t.height = px; const y = t.getContext("2d"); y.setTransform(T); y.fillStyle = col; y.fill(body); y.globalCompositeOperation = "destination-out"; y.translate(dx, dy); y.fill(body);
      x.save(); x.clip(body); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = a; x.filter = `blur(${blur * k}px)`; x.drawImage(t, 0, 0); x.restore(); };
    rim(-3, -3.6, mixc0(hue, "#fff6e8", .42), .5, 1.3);   // bounce light from the paper, low on the right
    rim(2.2, 2.8, "#fffaf0", .6, .9);                     // the lit rim, high on the left
  }
  // the charm as a die-cut card piece of a pop-up book: the sticker lies on a sheet of card whose cut edge shows below it, lit from above
  function card(x, o, px) {
    const k = px / 256, T = Math.max(2, Math.round(8 * k)), up = Math.round(T * .5), sh = .28;
    const sil = (col) => { const t = document.createElement("canvas"); t.width = t.height = px; const y = t.getContext("2d"); y.drawImage(o, 0, 0); y.globalCompositeOperation = "source-in"; y.fillStyle = col; y.fillRect(0, 0, px, px); return t; };
    const ink = sil("#1a0e08"), lite = sil("#e8dfcc"), dark = sil("#9c8d76");
    x.drawImage(ink, (T + 1.6 * k) * sh, T + 1.6 * k - up);   // the cut edge's bottom line
    for (let i = T; i >= 1; i--) { const f = i / T; x.globalAlpha = 1; x.drawImage(lite, i * sh, i - up); x.globalAlpha = .25 + .75 * f; x.drawImage(dark, i * sh, i - up); }
    x.globalAlpha = 1; x.drawImage(o, 0, -up);
  }
  // 2026-11-22 İdris: "taşlar jel gibi, şekerli jel gibi duruyor; jel görünümünü ve etrafındaki gri dumanı kaldır, daha net olsunlar, daha 3 boyutlu
  // olsunlar, renkleri de değiştir, beni şaşırt". The charms are no longer glossy stickers on a grey card: each one is a small carved, matte figure.
  // One light, high on the left. The face runs from a light tone to a deeper neighbouring hue (never to grey), a hard crescent of light sits on the
  // near edge and a hard crescent of shade on the far one, every part is cut from the next by a line in the charm's own dark, the piece has a side
  // wall in its own deep colour and one small, tight shadow under it. No gloss spot, no white sticker edge, no card, no blur haze, no paper grain.
  // SCULPT[slot] = [light, base, deep, ink]: coral rose, tangerine, sun yellow, lagoon turquoise, ocean blue, urchin violet.
  const SCULPT = [["#ffa79a", "#ff4f72", "#cf1f5f", "#6b0f3c"], ["#ffc963", "#ff8a1f", "#dc531a", "#7a2a0a"], ["#fff486", "#ffd21f", "#eb9b12", "#7d4706"],
    ["#8df5cf", "#14caa2", "#0b8f88", "#064650"], ["#86ccff", "#2e7dff", "#2348cc", "#131f6b"], ["#dcadff", "#a550ff", "#6c2bc8", "#36126b"]];
  window.CHARM_HUES = SCULPT.map(c => c[1]);
  window.paintCharmWC = function (name, slot, px) {
    const A = BLA[name], [LT, BASE, DEEP, INK] = SCULPT[slot % 6], k = px * .76 / 100, K = px / 256, TH = Math.round(11 * K), OL = 4.6 * K;
    const mk = () => { const c = document.createElement("canvas"); c.width = c.height = px; return c; };
    const face = mk(), x = face.getContext("2d"); x.translate(px / 2, px / 2 - TH * .55); x.scale(k, k); x.translate(-50, -50); x.lineJoin = "round"; x.lineCap = "round"; const T = x.getTransform();
    const parts = A.b.map(glowPart), body = new Path2D(); for (const p of parts) body.addPath(p);
    // the face: light to a deeper neighbouring hue across the form
    { const g = x.createLinearGradient(18, 12, 84, 92); g.addColorStop(0, LT); g.addColorStop(.42, BASE); g.addColorStop(1, mixc0(BASE, DEEP, .8)); x.fillStyle = g; x.fill(body); }
    // a crescent cut from the silhouette: the body minus the body moved by (dx, dy), hard edged
    const crescent = (dx, dy, col, a, path) => { const t = mk(), y = t.getContext("2d"); y.setTransform(T); y.fillStyle = col; y.fill(path || body); y.globalCompositeOperation = "destination-out"; y.translate(dx, dy); y.fill(path || body);
      x.save(); x.clip(body); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = a; x.drawImage(t, 0, 0); x.restore(); };
    crescent(-5.5, -6.5, DEEP, .62);                       // the far side turns away from the light
    crescent(-2.4, -2.8, INK, .28);                        // and is darkest right at the edge
    for (const p of parts) if (parts.length > 1) crescent(3.2, 3.8, LT, .5, p);   // each part catches the light on its own near edge
    crescent(3.4, 4, "#fffdf2", .78);                      // the lit edge of the whole piece
    // the parts are cut from each other
    if (parts.length > 1) { x.save(); x.clip(body); x.strokeStyle = INK; x.globalAlpha = .2; x.lineWidth = 1.1; for (const p of parts) x.stroke(p); x.restore(); }
    // details, flat and crisp
    const line = mixc0(DEEP, INK, .6);
    for (const o of A.d) { const t = o[0]; x.save();
      if (t === "s") { const P2 = new Path2D(o[1]); x.strokeStyle = mixc0(LT, "#ffffff", .55); x.lineWidth = (o[2] || 3) * .78; x.stroke(P2); }
      else if (t === "S") { const P2 = new Path2D(o[1]); x.strokeStyle = line; x.lineWidth = (o[2] || 3) * .8; x.stroke(P2); }
      else if (t === "d") { x.fillStyle = "#fffdf5"; x.beginPath(); x.arc(o[1], o[2], o[3], 0, 6.2832); x.fill(); }
      else if (t === "k") { x.fillStyle = "#241426"; x.beginPath(); x.arc(o[1], o[2], o[3], 0, 6.2832); x.fill(); x.fillStyle = "#fffdf5"; x.beginPath(); x.arc(o[1] - o[3] * .3, o[2] - o[3] * .34, Math.max(.8, o[3] * .34), 0, 6.2832); x.fill(); }
      else if (t === "w") { const p = glowPart(o[1]); x.fillStyle = "#fffaf0"; x.fill(p); x.save(); x.clip(p); x.translate(-2.2, -2.6); x.strokeStyle = "rgba(120,96,120,.45)"; x.lineWidth = 3; x.stroke(p); x.restore(); x.strokeStyle = INK; x.lineWidth = 1.5; x.stroke(p); }
      else if (t === "y") { x.fillStyle = "#e9b23c"; x.beginPath(); x.ellipse(o[1], o[2], 2, 3.1, 0, 0, 6.2832); x.fill(); x.fillStyle = "#fff1b8"; x.beginPath(); x.ellipse(o[1] - .5, o[2] - .9, .8, 1.2, 0, 0, 6.2832); x.fill(); }
      else if (t === "o") { x.fillStyle = line; x.globalAlpha = .7; x.beginPath(); x.arc(o[1], o[2], 1.6, 0, 6.2832); x.fill(); }
      else if (t === "f") { const p = glowPart(o[1]), solid = /^#/.test(o[2]);
        if (solid) { const six = /^#[0-9a-f]{6}$/i.test(o[2]), n = six ? parseInt(o[2].slice(1), 16) : 0, lum = six ? ((n >> 16) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11) / 255 : .5, col = !six ? o[2] : lum < .3 ? mixc0(o[2], INK, .55) : o[2];
          x.fillStyle = col; x.fill(p); x.save(); x.clip(p); x.translate(-1.8, -2.1); x.strokeStyle = six ? hexA(mixc0(col, "#1a0c1c", .55), .5) : "rgba(30,14,30,.3)"; x.lineWidth = 2.6; x.stroke(p); x.restore();   // its own small shade on the far side
          x.strokeStyle = INK; x.globalAlpha = .8; x.lineWidth = 1.2; x.stroke(p); }
        else { x.fillStyle = o[2]; x.fill(p); } }
      x.restore(); }
    // the outline, in the charm's own dark
    const sil = (src, col) => { const t = mk(), y = t.getContext("2d"); y.drawImage(src, 0, 0); y.globalCompositeOperation = "source-in"; y.fillStyle = col; y.fillRect(0, 0, px, px); return t; };
    const lined = mk(), lx = lined.getContext("2d"); { const ink = sil(face, INK); for (let i = 0; i < 32; i++) { const a2 = i / 32 * Math.PI * 2; lx.drawImage(ink, Math.cos(a2) * OL, Math.sin(a2) * OL); } lx.drawImage(face, 0, 0); }
    // the piece: a tight shadow, the side wall in the deep colour (darker toward the table), the face on top
    const cv = mk(), c = cv.getContext("2d"), wallA = sil(lined, mixc0(DEEP, INK, .35)), wallB = sil(lined, INK), dark = sil(lined, "#170a1c");
    c.save(); c.filter = `blur(${2.2 * K}px)`; c.globalAlpha = .42; c.drawImage(dark, 1.5 * K, TH + 3.5 * K); c.restore();
    c.drawImage(wallB, 0, TH); for (let i = TH - 1; i >= 1; i--) { c.globalAlpha = 1; c.drawImage(wallA, 0, i); c.globalAlpha = .55 * (i / TH); c.drawImage(wallB, 0, i); }
    c.globalAlpha = 1; c.drawImage(lined, 0, 0);
    return cv; };
  // granulation and the paper's tooth on a finished picture: pigment settles in the hollows, more where the wash is darker; a tenth of paper shows through
  function granulate(cv, amt) { const x = cv.getContext("2d"), px = cv.width, py = cv.height; x.setTransform(1, 0, 0, 1, 0, 0); const id = x.getImageData(0, 0, px, py), dd = id.data, sc = 256 / Math.max(px, 256) * (amt || 1);
    for (let y = 0; y < py; y++) for (let xx = 0; xx < px; xx++) { const i = (y * px + xx) * 4, a = dd[i + 3]; if (!a) continue; const lum = (dd[i] * .3 + dd[i + 1] * .59 + dd[i + 2] * .11) / 255, nz = NOISE(xx * sc, y * sc), g = 1 + (nz - .5) * (.03 + (1 - lum) * .06);
      for (let c = 0; c < 3; c++) dd[i + c] = Math.max(0, Math.min(255, dd[i + c] * g)); }   // a tenth of paper shines through every wash
    x.putImageData(id, 0, 0); return cv; }
  window.WC = { wash, shadowWash, lift, pencil, granulate, hexA, R, NOISE, bbox, SEPIA, PAPER, WCHUE };
  window.CHARM_LIST = () => { const out = []; BL.forEach((row, slot) => row.forEach((name, v) => out.push([name, slot, v]))); return out; };
})();
