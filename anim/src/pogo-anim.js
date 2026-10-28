// Pogo's animations, keyed by hand (2026-10-28, İdris: "oyun içi AI ile yapılmış gibi animasyon olmasın, gerçek animasyon yap, bilgisayarıma kaydet, onları kullan").
// Every animation is a list of key poses on a 24 fps timeline, with the ease into each key chosen by hand: an anticipation before every big move,
// fast-out snaps, held poses, squash on the landing, stretch on the push. It is shot "on twos" (every other frame, 12 drawings a second) the way
// TV anime is, and drawn effects (impact stars, sweat drops, gloom lines, speed lines, dust) are painted over the frames in the same ink and flat colour.
// bake.cjs renders each one to a sprite sheet in prism/anim/ (pogo-<name>.webp); the game only plays those files.
(() => {
  const W = 400, H = 440, PW = 320, PH = 352, OX = 40, OY = 88, GROUND = 408, CX = 200, HEADY = 250, UNIT = 76;   // output frame, Pogo's box inside it, landmarks
  const INK = "#1d1424";
  // the animations. Keys: [frame, {pose}, ease into this key]. Pose fields are the rig's (see P3 Z()); each key keeps what the one before set.
  const A = {
    hello: { len: 36, keys: [
      [0, {}],
      [4, { sq: .84, hx: .12, lx: .25, rx: .25 }, "o"],                       // anticipation: down before up
      [7, { sq: 1.12, y: .22, hx: -.08, ear: -.15, lx: 0, rx: 0 }, "o"],      // the push, stretched
      [11, { sq: 1, y: .42, rz: 2.5, rx: -.2, mo: .8, eye: .35 }, "o"],       // top of the hop, the paw already up
      [15, { sq: .8, y: 0 }, "i"],                                            // lands, squashed
      [18, { sq: 1.05 }, "o"], [20, { sq: 1, hz: .12, tz: -.04, rz: 2.95 }, "o"],
      [23, { rz: 1.85, hz: .02, tz: -.01 }, "io"], [26, { rz: 3.05, hz: .14, tz: -.05 }, "io"], [29, { rz: 1.85, hz: .02 }, "io"], [32, { rz: 2.95, hz: .12 }, "io"],
      [36, { rz: 2.6, hz: .1 }, "o"]],
      fx: [{ k: "dust", from: 15, to: 21 }, { k: "spark", from: 20, to: 34, x: 96, y: -96, follow: 1 }] },
    win: { len: 46, keys: [
      [0, {}],
      [5, { sq: .78, hx: .15, lx: .5, rx: .5, lz: -.55, rz: .55, eye: .7 }, "o"],
      [9, { sq: 1.18, y: .25, lz: -2.8, rz: 2.8, lx: 0, rx: 0, hx: -.1, mo: 1, eye: .3, spin: 1 }, "o"],
      [13, { y: .5, sq: 1, ry: 3.1416, spin: 1 }, "l"], [17, { y: .3, ry: 6.2832, spin: 1 }, "l"],
      [20, { y: 0, sq: .78, spin: 1 }, "i"],
      [23, { sq: 1.07, spin: 0 }, "o"], [26, { sq: 1, lz: -2.35, rz: 2.35, lx: -.2, rx: -.2, hz: -.08 }, "o"],
      [32, { y: .08, sq: 1.03, hz: .08 }, "io"], [36, { y: 0, sq: .97 }, "io"], [46, { sq: 1, hz: 0 }, "io"]],
      fx: [{ k: "dust", from: 20, to: 26 }, { k: "stars", from: 22, to: 46 }, { k: "speed", from: 9, to: 18, ring: 1 }] },
    yay: { len: 26, keys: [
      [0, {}],
      [3, { sq: .9, rz: 0, rx: .5, hx: .1 }, "o"],
      [6, { sq: 1.1, y: .12, rz: 2.5, rx: -.3, mo: 1, eye: .25, hz: .1, ear: -.1 }, "o"],
      [9, { y: .03, sq: .97, rz: 1.5, rx: .1 }, "i"], [12, { y: .12, sq: 1.08, rz: 2.6, rx: -.3 }, "o"],
      [15, { y: .03, sq: .97, rz: 1.5 }, "i"], [18, { y: .1, sq: 1.06, rz: 2.7, rx: -.35 }, "o"],
      [26, { y: 0, sq: 1, rz: 2.5 }, "io"]],
      fx: [{ k: "burst", from: 6, to: 10, x: 62, y: -92, follow: 1, s: .7 }, { k: "burst", from: 12, to: 16, x: 62, y: -92, follow: 1, s: .8 }, { k: "burst", from: 18, to: 24, x: 64, y: -96, follow: 1, s: 1 }] },
    clap: { len: 28, keys: [
      [0, {}],
      [2, { lx: -1.45, rx: -1.45, lz: -.45, rz: .45, eye: .3, mo: .9 }, "o"],
      [4, { lz: .42, rz: -.42, y: .04, sq: .97 }, "i"], [6, { lz: -.6, rz: .6, y: 0, sq: 1 }, "o"],
      [8, { lz: .42, rz: -.42, y: .04, sq: .97 }, "i"], [10, { lz: -.6, rz: .6, y: 0, sq: 1 }, "o"],
      [12, { lz: .42, rz: -.42, y: .04, sq: .97 }, "i"], [14, { lz: -.6, rz: .6, y: 0, sq: 1 }, "o"],
      [16, { lz: .42, rz: -.42, y: .04, sq: .97 }, "i"], [18, { lz: -.55, rz: .55, y: 0, sq: 1 }, "o"],
      [28, { lz: -.4, rz: .4, hz: .1 }, "io"]],
      fx: [4, 8, 12, 16].map(f => ({ k: "burst", from: f, to: f + 3, x: 0, y: 72, follow: 1, s: 1 })) },
    wow: { len: 30, keys: [
      [0, {}],
      [2, { sq: .9, hx: .1, eye: 1.2 }, "o"],
      [4, { y: .35, sq: 1.15, ear: -.18, eye: 1.35, mo: 1, lz: -1.4, rz: 1.4, lx: -.4, rx: -.4, hx: -.15 }, "o"],
      [8, { y: .42, sq: 1.05 }, "o"], [12, { y: 0, sq: .84 }, "i"], [15, { sq: 1.04 }, "o"], [18, { sq: 1 }, "io"],
      [30, { lz: -1.1, rz: 1.1 }, "io"]],
      fx: [{ k: "bang", from: 4, to: 28, x: 92, y: -120, follow: 1 }, { k: "shock", from: 4, to: 12, follow: 1 }, { k: "dust", from: 12, to: 18 }] },
    worry: { len: 24, loop: 1, jitter: .012, keys: [
      [0, { lx: -1.6, rx: -1.6, lz: -.08, rz: .08, ear: .45, eye: 1.1, hx: .08, hy: -.35, gx: -.2, mo: .2 }],
      [6, {}, "h"], [8, { hy: .35, gx: .2 }, "o"], [14, {}, "h"], [16, { hy: -.35, gx: -.2 }, "o"], [24, {}, "h"]],
      fx: [{ k: "sweat", from: 0, to: 24 }] },
    sad: { len: 34, keys: [
      [0, {}],
      [6, { ear: .5, hx: .32, eye: .55, lx: .25, rx: .25, lz: -.12, rz: .12 }, "io"],
      [12, { sq: .9, hx: .38 }, "io"], [18, { sq: .96 }, "io"], [26, { sq: .93 }, "io"], [34, { sq: .95 }, "io"]],
      fx: [{ k: "gloom", from: 8, to: 34 }, { k: "sigh", from: 12, to: 20 }] },
    dash: { len: 12, loop: 1, keys: [
      [0, { ry: 1.15, sq: .86, lx: .5, rx: .5, y: 0, hx: .05, mo: .6, eye: .8 }],
      [3, { sq: 1.12, y: .18, lx: -.7, rx: -.7 }, "o"], [6, { sq: 1, y: .3, lx: .7, rx: .7, fl: .15, fr: .15 }, "o"],
      [9, { sq: 1.02, y: .12 }, "i"], [12, { sq: .86, y: 0, lx: .5, rx: .5, fl: 0, fr: 0 }, "i"]],
      fx: [{ k: "speed", from: 0, to: 12 }] },
    idle: { len: 48, loop: 1, keys: [
      [0, {}], [6, { nz: 1.25 }, "h"], [8, { nz: 1 }, "h"], [10, { nz: 1.25 }, "h"], [12, { nz: 1 }, "h"],
      [16, { hz: .16, hy: .25, gx: .15 }, "o"], [24, {}, "h"],
      [28, { hz: 0, hy: -.2, gx: -.15, ef: .5 }, "o"], [30, { ef: 0 }, "o"],
      [32, { sq: .9 }, "o"], [35, { y: .14, sq: 1.06 }, "o"], [38, { y: 0, sq: .9 }, "i"], [40, { sq: 1, hy: 0, gx: 0 }, "o"],
      [42, { eye: .05 }, "h"], [44, { eye: 1 }, "h"], [48, {}, "io"]] },
  };
  const EASE = { l: u => u, o: u => 1 - (1 - u) ** 3, i: u => u * u * u, io: u => u < .5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2, h: u => u >= 1 ? 1 : 0 };
  function poseAt(an, f, Z) {
    const K = []; let acc = Z(); for (const [kf, p, e] of an.keys) { acc = Object.assign({}, acc, p); K.push([kf, acc, e || "io"]); }
    if (an.loop) { f = ((f % an.len) + an.len) % an.len; }
    if (f <= K[0][0]) return Object.assign({}, K[0][1]);
    for (let i = 1; i < K.length; i++) if (f <= K[i][0]) { const [f0, a] = K[i - 1], [f1, b, e] = K[i], u = EASE[e]((f - f0) / (f1 - f0)), o = {}; for (const q in b) o[q] = typeof b[q] === "number" ? a[q] + (b[q] - a[q]) * u : b[q]; o.spin = (a.spin || b.spin) ? 1 : 0; return o; }
    if (an.loop) { const [f0, a] = K[K.length - 1], b = K[0][1], u = EASE.io((f - f0) / (an.len - f0)), o = {}; for (const q in b) o[q] = a[q] + (b[q] - a[q]) * u; return o; }
    return Object.assign({}, K[K.length - 1][1]);
  }
  // ---- drawn effects, flat colour with an ink line, sized for the 400 x 440 frame
  const R = (n) => { let s = n * 9301 + 49297; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };
  function star(x, cx, cy, r1, r2, n, rot) { x.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; x.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } x.closePath(); }
  function inked(x, fill, w = 4) { x.fillStyle = fill; x.fill(); x.lineJoin = "round"; x.lineWidth = w; x.strokeStyle = INK; x.stroke(); }
  const FX = {
    burst(x, u, p, o) { const s = (o.s || 1) * (u < .35 ? .6 + u / .35 * .5 : 1.1 - (u - .35) / .65 * .9); if (s <= .05) return; star(x, p.x, p.y, 34 * s, 13 * s, 8, u * .6); inked(x, "#ffd23a", 3.5); star(x, p.x, p.y, 15 * s, 6 * s, 8, u * .6 + .2); x.fillStyle = "#fff"; x.fill(); },
    spark(x, u, p, o, f) { for (let k = 0; k < 3; k++) { const ph = ((f / 2 + k * 2) % 6) / 6, s = Math.sin(ph * Math.PI) * 12; if (s < 2) continue; star(x, p.x + [-20, 18, 2][k], p.y + [10, -6, -30][k], s, s * .3, 4, 0); inked(x, "#fff6b0", 2.5); } },
    stars(x, u, p, o, f) { const rr = R(7); for (let k = 0; k < 7; k++) { const a = -Math.PI / 2 + (k - 3) * .42, d = 120 + rr() * 50 + Math.min(1, u * 4) * 30, ph = ((f / 2 + k) % 5) / 5, s = (10 + rr() * 8) * (u < .1 ? u / .1 : 1) * (.65 + .35 * Math.sin(ph * Math.PI)); star(x, CX + Math.cos(a) * d, HEADY - 10 + Math.sin(a) * d * .8, s, s * .32, 4, 0); inked(x, ["#ffd23a", "#ff8ac8", "#7fd8ff"][k % 3], 2.5); } },
    dust(x, u) { for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { const d = 46 + u * 80 + k * 20, r = (20 - k * 4) * Math.sin(Math.min(1, u * 1.4) * Math.PI); if (r < 1.5) continue; x.beginPath(); x.arc(CX + sd * d, GROUND - 8 - k * 5 - u * 10, r, 0, 7); inked(x, "#fffaf1", 3); } },
    bang(x, u, p) { const s = u < .12 ? u / .12 * 1.25 : u < .2 ? 1.25 - (u - .12) / .08 * .25 : 1, w = Math.sin(u * 40) * .05; if (s <= .05) return; x.save(); x.translate(p.x, p.y); x.rotate(.18 + w); x.scale(s, s); x.beginPath(); x.moveTo(-11, -46); x.lineTo(11, -46); x.lineTo(5, 6); x.lineTo(-5, 6); x.closePath(); inked(x, "#ff3b4a", 4); x.beginPath(); x.arc(0, 22, 8, 0, 7); inked(x, "#ff3b4a", 4); x.restore(); },
    shock(x, u, p) { x.strokeStyle = INK; x.lineCap = "round"; x.lineWidth = 4; for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + (k - 3.5) * .3, r0 = 120 + u * 20, r1 = r0 + 26 - u * 18; x.beginPath(); x.moveTo(CX + Math.cos(a) * r0, p.y + 40 + Math.sin(a) * r0 * .9); x.lineTo(CX + Math.cos(a) * r1, p.y + 40 + Math.sin(a) * r1 * .9); x.stroke(); } },
    sweat(x, u) { const t = (u * 2) % 1, y = HEADY - 34 + t * 30, a = t < .85 ? 1 : (1 - t) / .15; if (a <= 0) return; x.save(); x.translate(CX + 64, y); x.scale(a, a); x.beginPath(); x.moveTo(0, -18); x.bezierCurveTo(10, -4, 12, 4, 12, 8); x.arc(0, 8, 12, 0, Math.PI); x.bezierCurveTo(-12, 4, -10, -4, 0, -18); inked(x, "#8fd8ff", 3); x.beginPath(); x.ellipse(-4, 6, 3, 5, -.3, 0, 7); x.fillStyle = "#fff"; x.fill(); x.restore(); },
    gloom(x, u, p, o, f) { const k0 = Math.min(1, u * 3); x.strokeStyle = "#5a4a8a"; x.lineCap = "round"; for (let k = 0; k < 5; k++) { const xx = CX - 60 + k * 30, top = 118 + (k % 2) * 10, len = (44 + (k % 3) * 8) * k0; x.lineWidth = 3.5; x.beginPath(); for (let s = 0; s <= 8; s++) { const yy = top + s / 8 * len; x.lineTo(xx + Math.sin(s * 1.6 + f * .5 + k) * 3, yy); } x.stroke(); } },
    sigh(x, u) { const r = 10 + u * 12, xx = CX + 46 + u * 46, yy = HEADY + 58 - u * 26; if (u > .9) return; x.beginPath(); x.arc(xx, yy, r, 0, 7); x.arc(xx + r * .9, yy + 3, r * .7, 0, 7); inked(x, "#eef2ff", 3); },
    speed(x, u, p, o, f) { const rr = R(Math.floor(f / 2) + 3); x.strokeStyle = INK; x.lineCap = "round";
      if (o.ring) { for (let k = 0; k < 14; k++) { const a = rr() * Math.PI * 2, r0 = 150 + rr() * 30; x.lineWidth = 2 + rr() * 3; x.beginPath(); x.moveTo(CX + Math.cos(a) * r0, 250 + Math.sin(a) * r0); x.lineTo(CX + Math.cos(a) * (r0 + 40), 250 + Math.sin(a) * (r0 + 40)); x.stroke(); } return; }
      for (let k = 0; k < 7; k++) { const y = 170 + rr() * 220, x0 = 6 + rr() * 60, l = 40 + rr() * 70; x.lineWidth = 2 + rr() * 3; x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + l, y); x.stroke(); } },
  };
  // renders one animation; returns the frames as canvases (on twos: every other 24 fps frame)
  window.bakePogo = function (name) {
    const P = window.__P3, an = A[name], frames = [], cv = document.createElement("canvas"); cv.className = "pogo"; cv.width = PW; cv.height = PH;
    const st = { x: cv.getContext("2d"), c: P.Z(), es: { a: 0, v: 0, b: 0, w: 0 }, py: 0, px: 0, pr: 0, t0: 0, ph: 0, mood: "", turn: 0 };
    const pose = (f) => Object.assign(P.Z(), poseAt(an, f, P.Z));
    const start = an.loop ? -an.len : -12;   // a run-up so the ears' springs are settled (a loop runs once before it is shot)
    for (let f = start; f < an.len; f++) {
      const p = pose(f); if (an.jitter) p.x += (Math.floor(f / 2) % 2 ? 1 : -1) * an.jitter;
      if (f < 0 && !an.loop) Object.assign(p, pose(0));
      P.draw(cv, st, f * 1000 / 24, 1 / 24, p);
      if (f < 0 || f % 2) continue;
      const out = document.createElement("canvas"); out.width = W; out.height = H; const x = out.getContext("2d"), lift = -p.y * UNIT;
      for (const e of an.fx || []) if (e.k === "speed" && f >= e.from && f <= e.to) FX.speed(x, (f - e.from) / Math.max(1, e.to - e.from), {}, e, f);
      x.drawImage(cv, OX, OY);
      for (const e of an.fx || []) { if (e.k === "speed" || f < e.from || f > e.to) continue; const u = (f - e.from) / Math.max(1, e.to - e.from), at = { x: CX + (e.x || 0), y: HEADY + (e.y || 0) + (e.follow ? lift : 0) }; x.save(); FX[e.k](x, u, at, e, f); x.restore(); }
      frames.push(out);
    }
    return frames;
  };
  window.POGO_ANIMS = Object.fromEntries(Object.entries(A).map(([k, v]) => [k, { n: Math.ceil(v.len / 2), loop: !!v.loop }]));
})();
