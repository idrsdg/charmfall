// The charms painted as watercolour storybook illustrations (2026-10-28, İdris: "Suluboya masal kitabı... tüm taşlar").
// Each charm is laid down the way a watercolourist would: a soft cast shadow, a first wash put down in several thin layers that never sit
// exactly on top of each other (so the edge is alive), pigment pooled darker at the rim where the water dried, a shadow wash on the far side,
// the light lifted out back to the paper, the details in thicker pigment and white gouache, granulation in the paper's tooth, and last a sepia
// pencil line that wanders and breaks. Uses the game's own shapes (BL, BLA, glowPart, mixc). bake-charms.cjs writes anim/ch-<name>.webp.
(() => {
  // watercolour pigments for the six colour families (rose madder, cadmium orange, gamboge, sap green, cerulean, violet)
  const WCHUE = ["#f0305e", "#ff7a1a", "#ffc414", "#1fb84c", "#1a86f0", "#9a3cf0"];   // 2026-10-28 İdris "taşlar çok soluk, belirgin ve parlak yap": full-strength pigments
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
    x.save(); x.clip(path); x.filter = "blur(.7px)"; x.strokeStyle = hexA(mixc0(col, "#3a2436", .35), o.rim || .55); x.lineWidth = o.rw || 3; x.stroke(path); x.restore(); }
  // the shadow side: a second, darker wash clipped to the shape, with a soft inner edge and a firmer dried line
  function shadowWash(x, path, col, cx, cy, Rr, seed) { x.save(); x.clip(path); const d = mixc0(col, "#3a2848", .38);
    x.filter = "blur(3px)"; x.fillStyle = hexA(d, .3); x.beginPath(); x.ellipse(cx + Rr * .42, cy + Rr * .48, Rr * 1.0, Rr * .92, -.5, 0, 6.2832); x.fill();
    x.filter = "none"; x.strokeStyle = hexA(d, .16); x.lineWidth = 1.2; x.beginPath(); x.ellipse(cx + Rr * .42, cy + Rr * .48, Rr * 1.0, Rr * .92, -.5, 0, 6.2832); x.stroke(); x.restore(); }
  // the light: pigment lifted out with a damp brush, back to the paper
  function lift(x, path, cx, cy, Rr) { x.save(); x.clip(path); x.filter = "blur(2.2px)"; x.globalCompositeOperation = "destination-out"; x.fillStyle = "rgba(0,0,0,.55)"; x.beginPath(); x.ellipse(cx - Rr * .34, cy - Rr * .4, Rr * .3, Rr * .17, -.6, 0, 6.2832); x.fill(); x.restore();
    x.save(); x.clip(path); x.filter = "blur(.6px)"; x.fillStyle = "rgba(255,252,242,.85)"; x.beginPath(); x.ellipse(cx - Rr * .44, cy - Rr * .48, Rr * .09, Rr * .05, -.6, 0, 6.2832); x.fill(); x.restore(); }
  // the pencil: two passes, the second a hair off; long dashes with small gaps where the lead skipped
  function pencil(x, path, seed, w) { const r = R(seed); for (let pass = 0; pass < 2; pass++) { x.save(); x.translate(pass * .45, -pass * .35); x.strokeStyle = SEPIA + (pass ? ".32)" : ".82)"); x.lineWidth = (w || 1.5) * (pass ? .7 : 1); x.lineCap = "round"; x.lineJoin = "round";
    const dash = []; for (let i = 0; i < 12; i++) { dash.push(18 + r() * 60, r() < .5 ? .8 + r() * 1.6 : .01); } x.setLineDash(dash); x.lineDashOffset = r() * 50; x.stroke(path); x.restore(); } }
  function bbox(q) { const bb = [100, 100, 0, 0]; const pts = typeof q === "string" ? (q.match(/-?\d+(\.\d+)?/g) || []).map(Number) : q[0] === "c" || q[0] === "e" ? [q[1] - q[3], q[2] - (q[4] || q[3]), q[1] + q[3], q[2] + (q[4] || q[3])] : q[1].flat();
    for (let i = 0; i + 1 < pts.length; i += 2) { bb[0] = Math.min(bb[0], pts[i]); bb[2] = Math.max(bb[2], pts[i]); bb[1] = Math.min(bb[1], pts[i + 1]); bb[3] = Math.max(bb[3], pts[i + 1]); } return bb; }
  window.paintCharmWC = function (name, slot, px) {
    const A = BLA[name], hue = WCHUE[slot % 6], cv = document.createElement("canvas"); cv.width = cv.height = px; const x = cv.getContext("2d"), k = px * .84 / 100;
    x.translate(px / 2, px / 2 - px * .02); x.scale(k, k); x.translate(-50, -50); x.lineJoin = "round"; x.lineCap = "round";
    const parts = A.b.map(glowPart), body = new Path2D(); for (const p of parts) body.addPath(p); const seed = [...name].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) % 9973;
    // the cast shadow: a cool grey wash on the paper, soft
    x.save(); x.filter = "blur(2.5px)"; x.translate(2.5, 5); x.fillStyle = "rgba(70,78,110,.2)"; x.fill(body); x.restore();
    // first wash, shadow side, light lifted
    wash(x, body, hue, seed, { a: .45, layers: 5, rw: 2.6, rim: .55 }); for (const p of parts) shadowWash(x, p, hue, 50, 50, 46, seed + 1); lift(x, body, 50, 50, 46);
    // a second, smaller glaze in the middle tones so the colour has depth
    x.save(); x.clip(body); x.filter = "blur(4px)"; x.fillStyle = hexA(hue, .14); x.beginPath(); x.ellipse(54, 56, 30, 26, .3, 0, 6.2832); x.fill(); x.restore();
    // details
    for (const o of A.d) { const t = o[0]; x.save();
      if (t === "s" || t === "S") { const P2 = new Path2D(o[1]); if (t === "s") { x.strokeStyle = "rgba(255,252,242,.88)"; x.lineWidth = (o[2] || 3) * .8; x.stroke(P2); } else { x.strokeStyle = hexA(mixc0(hue, "#3a2436", .55), .75); x.lineWidth = (o[2] || 3) * .8; x.stroke(P2); x.filter = "blur(.6px)"; x.strokeStyle = SEPIA + ".35)"; x.lineWidth = .9; x.stroke(P2); } }
      else if (t === "d") { x.fillStyle = "rgba(255,252,242,.95)"; x.beginPath(); x.arc(o[1], o[2], o[3], 0, 6.2832); x.fill(); }
      else if (t === "k") { x.fillStyle = "#4a362c"; x.beginPath(); x.arc(o[1], o[2], o[3] * .95, 0, 6.2832); x.fill(); x.fillStyle = "rgba(255,252,242,.92)"; x.beginPath(); x.arc(o[1] - o[3] * .32, o[2] - o[3] * .36, Math.max(.7, o[3] * .3), 0, 6.2832); x.fill(); }
      else if (t === "w") { const p = glowPart(o[1]); wash(x, p, "#fffaf0", seed + 7, { a: .5, layers: 3, rw: 1.2, rim: .2, j: .8 }); pencil(x, p, seed + 8, 1); }
      else if (t === "y") { x.fillStyle = "rgba(196,150,60,.85)"; x.beginPath(); x.ellipse(o[1], o[2], 2, 3.1, 0, 0, 6.2832); x.fill(); x.fillStyle = "rgba(255,240,190,.7)"; x.beginPath(); x.ellipse(o[1] - .5, o[2] - .9, .8, 1.2, 0, 0, 6.2832); x.fill(); }
      else if (t === "o") { x.fillStyle = hexA(mixc0(hue, "#3a2436", .45), .55); x.beginPath(); x.arc(o[1], o[2], 1.6, 0, 6.2832); x.fill(); }
      else if (t === "f") { const p = glowPart(o[1]), solid = /^#/.test(o[2]);
        if (solid) { const bb = bbox(o[1]), cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2, Rr = Math.max(4, Math.max(bb[2] - bb[0], bb[3] - bb[1]) / 2), six = /^#[0-9a-f]{6}$/i.test(o[2]), n = six ? parseInt(o[2].slice(1), 16) : 0, lum = six ? ((n >> 16) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11) / 255 : .5;
          const col = !six ? o[2] : lum < .3 ? mixc0(o[2], "#7a6050", .6) : mixc0(o[2], "#a08070", .15);   // the cel's near-black parts become a brown-sepia wash, never black
          wash(x, p, col, seed + 3 + cx, { a: lum < .3 ? .5 : .5, layers: 4, cx, cy, rw: 1.8, j: 1 }); shadowWash(x, p, col, cx, cy, Rr, seed + 4); pencil(x, p, seed + 5 + cy, 1.1); }
        else { x.fillStyle = o[2]; x.fill(p); } }
      x.restore(); }
    // warm light, cool shade: two faint glazes of other pigments, the way a painter shifts temperature across a form
    x.save(); x.clip(body); x.filter = "blur(6px)"; x.fillStyle = "rgba(240,190,110,.12)"; x.beginPath(); x.ellipse(36, 32, 30, 22, -.5, 0, 6.2832); x.fill(); x.fillStyle = "rgba(90,100,160,.1)"; x.beginPath(); x.ellipse(66, 74, 34, 24, -.5, 0, 6.2832); x.fill(); x.restore();
    // the pencil round the whole charm, on its silhouette only: drawn twice as wide on a sheet of its own, the inside rubbed out
    { const t = document.createElement("canvas"); t.width = t.height = px; const y = t.getContext("2d"); y.setTransform(x.getTransform()); for (let i = 0; i < parts.length; i++) pencil(y, parts[i], seed + 11 + i, 4.6);
      y.globalCompositeOperation = "destination-out"; y.fillStyle = "#000"; y.fill(body); x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(t, 0, 0); x.restore(); }
    // granulation and the paper's tooth: pigment settles in the hollows, more of it where the wash is darker
    granulate(cv, 1);
    return cv; };
  // granulation and the paper's tooth on a finished picture: pigment settles in the hollows, more where the wash is darker; a tenth of paper shows through
  function granulate(cv, amt) { const x = cv.getContext("2d"), px = cv.width, py = cv.height; x.setTransform(1, 0, 0, 1, 0, 0); const id = x.getImageData(0, 0, px, py), dd = id.data, sc = 256 / Math.max(px, 256) * (amt || 1);
    for (let y = 0; y < py; y++) for (let xx = 0; xx < px; xx++) { const i = (y * px + xx) * 4, a = dd[i + 3]; if (!a) continue; const lum = (dd[i] * .3 + dd[i + 1] * .59 + dd[i + 2] * .11) / 255, nz = NOISE(xx * sc, y * sc), g = 1 + (nz - .5) * (.03 + (1 - lum) * .06);
      for (let c = 0; c < 3; c++) dd[i + c] = Math.max(0, Math.min(255, dd[i + c] * g)); }   // a tenth of paper shines through every wash
    x.putImageData(id, 0, 0); return cv; }
  window.WC = { wash, shadowWash, lift, pencil, granulate, hexA, R, NOISE, bbox, SEPIA, PAPER, WCHUE };
  window.CHARM_LIST = () => { const out = []; BL.forEach((row, slot) => row.forEach((name, v) => out.push([name, slot, v]))); return out; };
})();
