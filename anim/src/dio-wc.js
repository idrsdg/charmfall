// The game screen as a pop-up book (2026-11-02, İdris: "suluboya kalsın, derinlik ekle"). Three cut-paper layers stand behind and below the board:
// a far one on the horizon, a middle one peeking from under the board, a near one the booster tray rests on. Each is painted here once, in grey only:
// a pale wash of paper with the pigment pooled at the cut edge, the darker marks of trees, tufts and stones, granulation, and a sepia pencil line
// along the top. The game tints every layer with its level's own colours at the start of a level (multiply), so one painting serves every theme
// and the colours stay those of the plain theme wash the owner chose (2026-10-29 "arka planı sadeleştir"). Needs charm-wc.js (window.WC).
// bake-dio.cjs writes anim/dio-<family>-<layer>.webp, 960 px wide.
(() => {
  const { pencil, granulate, R } = WC, W = 960;
  const HT = { far: 300, mid: 300, near: 380 };
  // top edges: a list of [x, y]; y is where the paper starts, measured from the top of the layer
  const humps = (r, n, y0, amp, wob) => { const out = [], ph = r() * 6.28, f2 = 2 + r() * 2; for (let x = -20; x <= W + 20; x += 8) { const u = x / W; out.push([x, y0 - amp * (.55 + .45 * Math.sin(u * Math.PI * n + ph)) - amp * .18 * Math.sin(u * Math.PI * n * f2 + ph * 2) + (r() - .5) * wob]); } return out; };
  const ridge = (r, n, y0, amp) => { const out = [[-20, y0]]; let x = -20; while (x < W + 20) { const w = W / n * (.6 + r() * .8); out.push([x + w * .5, y0 - amp * (.45 + r() * .55)]); out.push([x + w, y0 - amp * r() * .25]); x += w; } return out; };
  const mesa = (r, y0, amp) => { const out = [[-20, y0]]; let x = -20; while (x < W + 20) { const w = 90 + r() * 140, h = amp * (.4 + r() * .6); out.push([x + 16, y0 - h], [x + w - 16, y0 - h - (r() - .5) * 8], [x + w, y0 - amp * .1 * r()]); x += w + r() * 40; } return out; };
  const scallop = (r, y0, rad, amp) => { const out = []; let x = -30; while (x < W + 30) { const rr = rad * (.7 + r() * .6), cy = y0 - amp * r(); for (let a = Math.PI; a <= Math.PI * 2 + .01; a += .2) out.push([x + rr + Math.cos(a) * rr, cy + Math.sin(a) * rr * .8]); x += rr * 1.7; } return out; };
  const pathOf = (pts, h) => { const p = new Path2D(); p.moveTo(-30, h + 10); p.lineTo(pts[0][0], pts[0][1]); for (const [x, y] of pts) p.lineTo(x, y); p.lineTo(W + 30, pts[pts.length - 1][1]); p.lineTo(W + 30, h + 10); p.closePath(); return p; };
  const yAt = (pts, x) => { for (let i = 1; i < pts.length; i++) if (pts[i][0] >= x) { const a = pts[i - 1], b = pts[i], t = (x - a[0]) / Math.max(1, b[0] - a[0]); return a[1] + (b[1] - a[1]) * t; } return pts[pts.length - 1][1]; };
  // things that stand on a layer, cut from the same sheet (they join its silhouette)
  const tree = (p, x, y, s) => { p.moveTo(x + 30 * s, y - 46 * s); p.ellipse(x, y - 46 * s, 30 * s, 34 * s, 0, 0, 6.2832); p.rect(x - 4 * s, y - 20 * s, 8 * s, 24 * s); };
  const pine = (p, x, y, s) => { p.moveTo(x, y - 92 * s); p.lineTo(x + 30 * s, y - 30 * s); p.lineTo(x + 14 * s, y - 32 * s); p.lineTo(x + 38 * s, y + 2); p.lineTo(x - 38 * s, y + 2); p.lineTo(x - 14 * s, y - 32 * s); p.lineTo(x - 30 * s, y - 30 * s); p.closePath(); };
  const bush = (p, x, y, s) => { for (const [dx, dy, rr] of [[-22, -14, 20], [0, -26, 26], [24, -14, 19]]) { p.moveTo(x + (dx + rr) * s, y + dy * s); p.arc(x + dx * s, y + dy * s, rr * s, 0, 6.2832); } };
  const rock = (p, x, y, s) => { p.moveTo(x - 30 * s, y + 2); p.lineTo(x - 22 * s, y - 22 * s); p.lineTo(x - 2 * s, y - 34 * s); p.lineTo(x + 20 * s, y - 24 * s); p.lineTo(x + 32 * s, y + 2); p.closePath(); };
  const FAM = {
    hills: { far: (r) => ({ top: humps(r, 2.2, 150, 90, 1) }), mid: (r) => ({ top: humps(r, 3.1, 170, 70, 1), on: [[tree, .22, 1.1], [tree, .3, .8], [tree, .74, 1.2], [bush, .84, 1]] }), near: (r) => ({ top: humps(r, 1.4, 120, 40, 1.5), tufts: 26, on: [[bush, .06, 1.3], [bush, .95, 1.1]] }) },
    pines: { far: (r) => ({ top: ridge(r, 5, 200, 150) }), mid: (r) => ({ top: humps(r, 2.4, 190, 50, 1), on: [[pine, .1, 1.1], [pine, .17, .8], [pine, .26, 1], [pine, .7, 1.2], [pine, .79, .9], [pine, .88, 1.05]] }), near: (r) => ({ top: humps(r, 1.6, 140, 40, 1.5), tufts: 20, on: [[pine, .04, 1.3], [pine, .96, 1.2]] }) },
    bush: { far: (r) => ({ top: scallop(r, 170, 46, 50) }), mid: (r) => ({ top: humps(r, 3, 200, 40, 1), on: [[bush, .12, 1.6], [bush, .3, 1.1], [bush, .68, 1.3], [bush, .86, 1.7]] }), near: (r) => ({ top: humps(r, 1.5, 140, 36, 1.5), tufts: 30, on: [[bush, .03, 1.8], [bush, .97, 1.6]] }) },
    waves: { far: (r) => ({ top: humps(r, 1.2, 200, 40, .5).map(([x, y]) => [x, x > W * .55 && x < W * .85 ? y - 50 * Math.sin((x - W * .55) / (W * .3) * Math.PI) : y]) }), mid: (r) => ({ top: scallop(r, 170, 34, 16), crest: 1 }), near: (r) => ({ top: humps(r, 1.3, 130, 30, 1), tufts: 14, stones: 9, on: [[rock, .06, 1], [rock, .93, 1.3]] }) },
    rocks: { far: (r) => ({ top: mesa(r, 220, 130) }), mid: (r) => ({ top: ridge(r, 7, 220, 90), on: [[rock, .2, 1.2], [rock, .8, 1.4]] }), near: (r) => ({ top: humps(r, 1.4, 140, 34, 3), stones: 16, tufts: 8, on: [[rock, .05, 1.6], [rock, .95, 1.4]] }) },
    clouds: { far: (r) => ({ top: scallop(r, 200, 60, 60) }), mid: (r) => ({ top: scallop(r, 200, 48, 40) }), near: (r) => ({ top: scallop(r, 170, 64, 30) }) },
  };
  window.DIO_LIST = () => { const out = []; for (const f of Object.keys(FAM)) for (const l of ["far", "mid", "near"]) out.push([f, l]); return out; };
  window.paintDio = function (fam, layer) {
    const H = HT[layer], seed = [...(fam + layer)].reduce((a, c) => a * 31 + c.charCodeAt(0), 11) % 9973, r = R(seed), spec = FAM[fam][layer](r);
    const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const x = cv.getContext("2d");
    const sil = pathOf(spec.top, H); for (const [fn, u, s] of spec.on || []) fn(sil, u * W, yAt(spec.top, u * W) + 6, s * (layer === "far" ? .7 : 1));
    // 1. the cut sheet: a pale paper wash, a shade lower down, then the pigment pooled along the cut edge
    const mask = document.createElement("canvas"); mask.width = W; mask.height = H; const m = mask.getContext("2d"); m.fillStyle = "#000"; m.fill(sil);
    x.fillStyle = "#f4f0e8"; x.fill(sil);
    x.save(); x.clip(sil); const g = x.createLinearGradient(0, 40, 0, H); g.addColorStop(0, "rgba(140,128,112,0)"); g.addColorStop(1, `rgba(140,128,112,${layer === "near" ? .28 : .2})`); x.fillStyle = g; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 9; i++) { x.filter = "blur(18px)"; x.fillStyle = `rgba(150,138,120,${.05 + r() * .07})`; x.beginPath(); x.ellipse(r() * W, 60 + r() * (H - 60), 60 + r() * 120, 24 + r() * 40, 0, 0, 6.2832); x.fill(); } x.filter = "none"; x.restore();   // blooms where the wash dried unevenly
    { const t = document.createElement("canvas"); t.width = W; t.height = H; const y = t.getContext("2d"); y.drawImage(mask, 0, 0); y.globalCompositeOperation = "destination-out"; y.filter = `blur(${layer === "far" ? 7 : 5}px)`; y.drawImage(mask, 0, 0); y.drawImage(mask, 0, 0);
      y.filter = "none"; y.globalCompositeOperation = "source-in"; y.fillStyle = "rgba(96,84,70,.55)"; y.fillRect(0, 0, W, H); x.drawImage(t, 0, 0); }
    // 2. marks: grass tufts, stones, wave crests, in thicker grey
    x.save(); x.clip(sil); x.lineCap = "round";
    for (let i = 0; i < (spec.tufts || 0); i++) { const px = r() * W, py = yAt(spec.top, px) + 18 + r() * (H * .55), s = .7 + r() * .7; x.strokeStyle = `rgba(92,84,66,${.35 + r() * .25})`; x.lineWidth = 2.2; x.beginPath(); for (const a of [-.5, -.15, .2, .5]) { x.moveTo(px + a * 8 * s, py); x.quadraticCurveTo(px + a * 12 * s, py - 10 * s, px + a * 20 * s, py - 16 * s); } x.stroke(); }
    for (let i = 0; i < (spec.stones || 0); i++) { const px = r() * W, py = yAt(spec.top, px) + 30 + r() * (H * .5), s = 5 + r() * 9; x.fillStyle = "rgba(110,100,86,.35)"; x.beginPath(); x.ellipse(px, py, s * 1.4, s * .8, 0, 0, 6.2832); x.fill(); x.fillStyle = "rgba(255,252,244,.5)"; x.beginPath(); x.ellipse(px - s * .4, py - s * .3, s * .5, s * .22, 0, 0, 6.2832); x.fill(); }
    if (spec.crest) for (const [px, py] of spec.top.filter((_, i) => i % 9 === 4)) { x.strokeStyle = "rgba(255,255,255,.75)"; x.lineWidth = 3; x.beginPath(); x.arc(px, py + 12, 12, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); }
    for (const [fn, u, s] of spec.on || []) { if (fn === tree) { const px = u * W, py = yAt(spec.top, px) + 6, k = s * (layer === "far" ? .7 : 1); x.fillStyle = "rgba(96,80,60,.32)"; x.fillRect(px - 4 * k, py - 20 * k, 8 * k, 24 * k); x.filter = "blur(6px)"; x.fillStyle = "rgba(110,100,84,.25)"; x.beginPath(); x.ellipse(px + 10 * k, py - 38 * k, 20 * k, 24 * k, 0, 0, 6.2832); x.fill(); x.filter = "none"; }
      if (fn === pine) { const px = u * W, py = yAt(spec.top, px) + 6, k = s; x.strokeStyle = "rgba(96,84,66,.35)"; x.lineWidth = 2; x.beginPath(); x.moveTo(px - 18 * k, py - 30 * k); x.lineTo(px, py - 20 * k); x.lineTo(px + 18 * k, py - 30 * k); x.moveTo(px - 26 * k, py - 6 * k); x.lineTo(px, py + 2 * k); x.lineTo(px + 26 * k, py - 6 * k); x.stroke(); } }
    x.restore();
    // 3. the paper's tooth, then the pencil along the cut
    granulate(cv, layer === "far" ? .5 : .8);
    { const t = document.createElement("canvas"); t.width = W; t.height = H; const y = t.getContext("2d"); pencil(y, sil, seed + 5, layer === "far" ? 2.8 : 4.2); y.globalCompositeOperation = "destination-out"; y.drawImage(mask, 0, 0); x.drawImage(t, 0, 0); }   // the pencil on the outer cut only, not round every tree inside it
    if (layer === "far") { const t = document.createElement("canvas"); t.width = W; t.height = H; const y = t.getContext("2d"); y.filter = "blur(1.6px)"; y.drawImage(cv, 0, 0); x.clearRect(0, 0, W, H); x.drawImage(t, 0, 0); }   // the far sheet a little out of focus
    return cv;
  };
})();
