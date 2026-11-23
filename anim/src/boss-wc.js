// The ten kingdom bosses, painted as carved matte figures in the look of paintCharmWC (charm-wc.js): one light high on the left, a face running from a
// light tone to a deeper neighbouring hue, hard crescents of light and shade, every part cut from the next by a line in its own dark, a side wall and one
// tight shadow. No gloss, no blur haze. All of them look right (story.js mirrors a figure that stands on the right of a page).
// Motion is hand keyed: every value comes from a keyframe table [time 0-1, value, ease into this key], first and last keys equal, so the loop closes.
// window.paintBoss(k, t, px) returns one frame as a canvas; bake-boss.cjs writes anim/cr-boss<k>.webp.
(() => {
  const RAD = Math.PI / 180, TAU = Math.PI * 2, SS = 2, U = 176 / 200;   // design space is 200 x 200, painted at twice the cell and reduced
  const EASE = { l: (u) => u, i: (u) => u * u, o: (u) => 1 - (1 - u) * (1 - u), s: (u) => u * u * (3 - 2 * u), b: (u) => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); } };
  const key = (T, t) => { if (t <= T[0][0]) return T[0][1]; for (let i = 1; i < T.length; i++) if (t <= T[i][0]) { const A = T[i - 1], B = T[i], u = (t - A[0]) / (B[0] - A[0] || 1); return A[1] + (B[1] - A[1]) * EASE[B[2] || "s"](u); } return T[T.length - 1][1]; };
  const pose = (t, tracks) => { const o = {}; for (const n in tracks) o[n] = key(tracks[n], t); return o; };
  const BREATH = [[0, 0], [.46, 1, "s"], [1, 0, "s"]];
  const blinkAt = (s) => [[0, 0], [s, 0, "l"], [s + .025, 1, "i"], [s + .05, 1, "l"], [s + .09, 0, "o"], [1, 0, "l"]];
  // a thing that appears, travels and is gone again before the loop closes
  const flight = (t, s, e) => { const u = (t - s + 1) % 1, L = (e - s + 1) % 1; return u < L ? u / L : -1; };

  let x = null;
  const cache = new Map();
  const shape = (d) => { if (typeof d !== "string") return d; let s = cache.get(d); if (s) return s; const n = (d.match(/-?\d+(\.\d+)?/g) || []).map(Number); let a = 1e9, b = 1e9, c = -1e9, e = -1e9; for (let i = 0; i + 1 < n.length; i += 2) { a = Math.min(a, n[i]); c = Math.max(c, n[i]); b = Math.min(b, n[i + 1]); e = Math.max(e, n[i + 1]); } s = { p: new Path2D(d), b: [a, b, c, e] }; cache.set(d, s); return s; };
  const ell = (cx, cy, rx, ry, rot) => { const k = `e${cx},${cy},${rx},${ry},${rot || 0}`; let s = cache.get(k); if (s) return s; const p = new Path2D(); p.ellipse(cx, cy, rx, ry, (rot || 0) * RAD, 0, TAU); s = { p, b: [cx - rx * .8, cy - ry, cx + rx * .8, cy + ry] }; cache.set(k, s); return s; };
  // a screen direction in the current local space, so the light stays high on the left however a part is turned
  const toLocal = (dx, dy) => { const m = x.getTransform(), det = m.a * m.d - m.b * m.c || 1, wx = dx * SS * U, wy = dy * SS * U; return [(m.d * wx - m.c * wy) / det, (-m.b * wx + m.a * wy) / det]; };
  const crescent = (p, dx, dy, col, a) => { const [lx, ly] = toLocal(dx, dy), q = new Path2D(); q.rect(-900, -900, 2000, 2000); q.addPath(p, new DOMMatrix([1, 0, 0, 1, lx, ly])); x.globalAlpha = a; x.fillStyle = col; x.fill(q, "evenodd"); x.globalAlpha = 1; };
  // one carved part. pal = [light, base, deep, ink]
  function part(d, pal, o = {}) { const s = shape(d), [LT, BASE, DEEP, INK] = pal, [a, b, c, e] = s.b, g = x.createLinearGradient(a, b, c, e), k = o.c === undefined ? 1 : o.c;
    g.addColorStop(0, LT); g.addColorStop(.46, BASE); g.addColorStop(1, DEEP); x.fillStyle = g; x.fill(s.p);
    if (k > 0) { x.save(); x.clip(s.p); crescent(s.p, -4.6 * k, -5.4 * k, DEEP, .72); crescent(s.p, -1.8 * k, -2.1 * k, INK, .3); crescent(s.p, 2.6 * k, 3 * k, o.rim || LT, o.rimA === undefined ? .9 : o.rimA); x.restore(); }
    if (o.lw !== 0) { x.strokeStyle = INK; x.lineWidth = o.lw || 2.6; x.lineJoin = "round"; x.lineCap = "round"; x.stroke(s.p); } }
  const flat = (d, col, a) => { const s = shape(d); x.globalAlpha = a === undefined ? 1 : a; x.fillStyle = col; x.fill(s.p); x.globalAlpha = 1; };
  const line = (d, col, w, a) => { const s = shape(d); x.globalAlpha = a === undefined ? 1 : a; x.strokeStyle = col; x.lineWidth = w; x.lineCap = "round"; x.lineJoin = "round"; x.stroke(s.p); x.globalAlpha = 1; };
  const at = (px, py, deg, fn, sx, sy) => { x.save(); x.translate(px, py); if (deg) x.rotate(deg * RAD); if (sx !== undefined) x.scale(sx, sy === undefined ? sx : sy); x.translate(-px, -py); fn(); x.restore(); };
  const feather = (px, py, deg, len, w, pal, o = {}) => { x.save(); x.translate(px, py); x.rotate(deg * RAD); part(`M0,0 C${(len * .24).toFixed(1)},${(-w).toFixed(1)} ${(len * .74).toFixed(1)},${(-w * .86).toFixed(1)} ${len},0 C${(len * .74).toFixed(1)},${(w * .86).toFixed(1)} ${(len * .24).toFixed(1)},${w} 0,0Z`, pal, { lw: o.lw || 2.2, c: o.c === undefined ? .55 : o.c }); x.restore(); };
  const eye = (cx, cy, r, o = {}) => { const INK = o.ink || "#14101f", b = Math.max(o.blink || 0, o.squint || 0), lk = o.look || [.22, .05];
    x.save(); const c = new Path2D(); c.ellipse(cx, cy, r, r * (o.tall || 1.08), 0, 0, TAU); x.fillStyle = o.white || "#fff7dc"; x.fill(c); x.clip(c);
    x.fillStyle = "rgba(90,70,100,.32)"; x.beginPath(); x.ellipse(cx - r * .1, cy - r * .3, r * 1.08, r * .95, 0, Math.PI, TAU); x.fill();
    if (o.iris) { x.fillStyle = o.iris; x.beginPath(); x.arc(cx + lk[0] * r, cy + lk[1] * r, r * .72, 0, TAU); x.fill(); }
    x.fillStyle = "#120a16"; x.beginPath(); x.arc(cx + lk[0] * r * 1.25, cy + lk[1] * r * 1.2, r * (o.pupil || .42), 0, TAU); x.fill();
    x.fillStyle = "#fffdf5"; x.beginPath(); x.arc(cx + lk[0] * r - r * .12, cy + lk[1] * r - r * .34, r * .17, 0, TAU); x.fill();
    if (b > .01) { const y = cy - r * 1.15 + r * 2.3 * b; x.fillStyle = o.lid || "#333"; x.beginPath(); x.moveTo(cx - r * 1.3, cy - r * 1.4); x.lineTo(cx + r * 1.3, cy - r * 1.4); x.lineTo(cx + r * 1.3, y - r * .1); x.quadraticCurveTo(cx, y + r * .32, cx - r * 1.3, y - r * .1); x.closePath(); x.fill(); x.strokeStyle = INK; x.lineWidth = 2; x.beginPath(); x.moveTo(cx + r * 1.3, y - r * .1); x.quadraticCurveTo(cx, y + r * .32, cx - r * 1.3, y - r * .1); x.stroke(); }
    x.restore(); x.strokeStyle = INK; x.lineWidth = o.lw || 2.4; x.stroke(c);
    if (o.brow !== undefined) { x.save(); x.translate(cx, cy - r * 1.06 + (o.browY || 0)); x.rotate(o.brow * RAD); x.fillStyle = o.browCol || INK; x.beginPath(); x.moveTo(-r * 1.32, -r * .28); x.quadraticCurveTo(0, -r * .62, r * 1.34, -r * .02); x.lineTo(r * 1.12, r * .34); x.quadraticCurveTo(0, r * .02, -r * 1.2, r * .12); x.closePath(); x.fill(); x.restore(); } };
  // a beak hinged at (bx, by), pointing right
  const beak = (bx, by, len, h, open, top, low, o = {}) => { at(bx, by, 4 + open * 20, () => part(`M${bx - 3},${by - 1} L${bx + len * .78},${by + 1} Q${bx + len * .6},${by + h * .86} ${bx - 2},${by + h}Z`, low, { lw: 2.2, c: .45 }));
    if (open > .05) at(bx, by, 4 + open * 8, () => flat(`M${bx + 2},${by + 2} L${bx + len * .55},${by + 3} L${bx + 2},${by + h * .62}Z`, o.mouth || "#7c1d33"));
    at(bx, by, -open * 11, () => part(`M${bx - 4},${by - h} Q${bx + len * .55},${by - h * 1.02} ${bx + len},${by + (o.hook || 3)} Q${bx + len * .55},${by + 3.5} ${bx - 3},${by + 2.6}Z`, top, { lw: 2.4, c: .55 })); };
  const leg = (fx, fy, hx, hy, col, ink) => { const d = `M${hx},${hy} L${fx},${fy}`, t = `M${fx - 10},${fy + 3} L${fx},${fy} L${fx + 12},${fy + 3} M${fx},${fy} L${fx + 4},${fy + 6}`; line(d, ink, 8.2); line(t, ink, 7.4); line(d, col, 3.8); line(t, col, 3.2); };
  const star = (cx, cy, r, pal, deg) => at(cx, cy, deg || 0, () => part(`M${cx},${cy - r} Q${cx + r * .16},${cy - r * .16} ${cx + r},${cy} Q${cx + r * .16},${cy + r * .16} ${cx},${cy + r} Q${cx - r * .16},${cy + r * .16} ${cx - r},${cy} Q${cx - r * .16},${cy - r * .16} ${cx},${cy - r}Z`, pal, { lw: 1.6, c: 0 }));
  const drop = (cx, cy, r, pal) => part(`M${cx},${cy - r * 1.5} C${cx + r * .4},${cy - r * .7} ${cx + r},${cy - r * .2} ${cx + r},${cy + r * .3} C${cx + r},${cy + r} ${cx - r},${cy + r} ${cx - r},${cy + r * .3} C${cx - r},${cy - r * .2} ${cx - r * .4},${cy - r * .7} ${cx},${cy - r * 1.5}Z`, pal, { lw: 1.6, c: .28 });
  const bolt = (cx, cy, s, pal, deg) => at(cx, cy, deg || 0, () => part(`M${cx + 2 * s},${cy - 10 * s} L${cx - 5 * s},${cy + 1 * s} L${cx},${cy + 1 * s} L${cx - 2.5 * s},${cy + 10 * s} L${cx + 6 * s},${cy - 2.4 * s} L${cx + 1 * s},${cy - 2.4 * s}Z`, pal, { lw: 2, c: .25 }));

  const P = {
    night: ["#6d7ab3", "#2b3263", "#141738", "#070818"], white: ["#ffffff", "#f0f1fb", "#b4bbe2", "#25274f"], blue: ["#8fdcff", "#2f80ee", "#1d45b0", "#0b1a52"], gold: ["#fff0a0", "#f6bf2a", "#c97a12", "#5a2c06"], cap: ["#d9a06a", "#9a5a2c", "#5f3216", "#2d1608"], nut: ["#ffd289", "#e08f35", "#a9541b", "#4a2008"], beak: ["#7b7d96", "#3a3a52", "#1e1e30", "#0a0a16"], orange: ["#ffd070", "#ff9326", "#d65a14", "#5c2306"],
    teal: ["#a9f4ea", "#2fc0c4", "#1680a0", "#07384f"], foam: ["#ffffff", "#e4faf6", "#9fdcdc", "#0f4656"], yellow: ["#fff39a", "#ffc928", "#e88a14", "#6b3206"], wave: ["#9fe6ff", "#2aa3e8", "#1668bd", "#082c60"],
    ember: ["#ffd76a", "#ff6a1f", "#c8201e", "#4c0a10"], flame: ["#fff4a6", "#ffb020", "#f0471c", "#5c1208"], coal: ["#7a4a50", "#3b2028", "#1e0f16", "#0e060a"], hot: ["#fff7c0", "#ffcf40", "#ff7a1c", "#6a2206"],
    frost: ["#ffffff", "#c9f0ff", "#6fb6ec", "#14386e"], cloak: ["#c8e6ff", "#5ea2ee", "#2f5cc0", "#10245e"], cloak2: ["#e7f5ff", "#9fd0f6", "#5a8fdc", "#14306e"], ice: ["#ffffff", "#a8ecff", "#39a3e6", "#0d3a78"], ash: ["#c8c9e8", "#7f83b8", "#4b4e88", "#191b4a"],
    raven: ["#7c7da6", "#34355c", "#1a1a38", "#090818"], raven2: ["#9b9cc4", "#4d4e7c", "#27284e", "#0d0c22"], sack: ["#f4dcae", "#cf9f62", "#8f6233", "#3b2410"], sack2: ["#d6e9f5", "#92bcd8", "#5b83ab", "#1d3350"], rope: ["#ffe5a6", "#d59a3e", "#8c5a1c", "#3c2208"], grey: ["#f3f1ff", "#b9b8d6", "#7c7ba8", "#26264e"],
    robe: ["#ffe6a8", "#eeb35a", "#b96c2c", "#4f2a10"], robe2: ["#fff2cf", "#f6d48c", "#d29a4c", "#5a3514"], band: ["#ff9b7a", "#d9472f", "#9a2424", "#430c10"], sand: ["#fff0b4", "#f2c866", "#c98d32", "#5e3a10"],
    shade: ["#7f65c9", "#3c2a7e", "#1f1450", "#0b0626"], shade2: ["#5d48a8", "#2a1c60", "#160e3c", "#08041c"], gem: ["#ffffff", "#7cf6ff", "#22a8e8", "#0a3a78"], gem2: ["#ffd9ff", "#c77dff", "#7b35d8", "#2c0d62"],
    bat: ["#b08ae0", "#6a44b4", "#3c2480", "#190a40"], bat2: ["#8f6cce", "#4a2f92", "#2b1a64", "#120834"], moon: ["#fffdf0", "#ffeeaa", "#f2c65c", "#6b4a14"], crater: ["#f7dc8a", "#eec668", "#d9a544", "#8c6420"], pink: ["#ffd3e4", "#ff9ec2", "#e8628f", "#5e1636"],
    cloud: ["#a8b4dc", "#55608f", "#2f3766", "#10142f"], cloud2: ["#c5cfee", "#7a86b6", "#454f84", "#141a3c"], volt: ["#ffffff", "#fff066", "#ffb31f", "#6b3a06"], lamp: ["#fff6c8", "#ffd65a", "#f09a22", "#5e3208"], brass: ["#ffe9a0", "#d9a13a", "#8f5d1c", "#3a2208"], glass: ["#fff8d8", "#ffe89a", "#ffc94e", "#6a4310"]
  };

  // ---------------------------------------------------------------- k0, k8: Mordo
  function acornCrown(cx, cy, deg, dull) { at(cx, cy, deg, () => { const nut = dull ? ["#d6c7a8", "#9a8a78", "#5e5468", "#221c30"] : P.nut, cap = dull ? ["#8d8aa8", "#55536e", "#302f4a", "#14132a"] : P.cap, gold = dull ? ["#fff3b8", "#d9b95a", "#8f7032", "#3a2810"] : P.gold;
      for (const [ax, ay, r, sc] of [[cx - 21, cy - 11, -22, .9], [cx + 21, cy - 11, 20, .9], [cx, cy - 18, 0, 1.12]]) at(ax, ay, r, () => { at(ax, ay, 0, () => { part(`M${ax - 9},${ay - 4} Q${ax - 10},${ay + 11} ${ax},${ay + 18} Q${ax + 10},${ay + 11} ${ax + 9},${ay - 4}Z`, nut, { c: .55 }); part(`M${ax - 12},${ay - 3} Q${ax - 11},${ay - 14} ${ax},${ay - 14} Q${ax + 11},${ay - 14} ${ax + 12},${ay - 3} Q${ax},${ay + 3} ${ax - 12},${ay - 3}Z`, cap, { c: .5 }); line(`M${ax},${ay - 14} L${ax + 1.5},${ay - 20}`, cap[3], 5); line(`M${ax},${ay - 14} L${ax + 1.5},${ay - 20}`, cap[1], 2.2); }, sc); });
      part(`M${cx - 33},${cy - 3} L${cx - 22},${cy + 4} L${cx - 10},${cy - 4} L${cx},${cy + 3} L${cx + 11},${cy - 4} L${cx + 22},${cy + 4} L${cx + 33},${cy - 3} L${cx + 29},${cy + 15} Q${cx},${cy + 24} ${cx - 29},${cy + 15}Z`, gold, { c: .7 });
      for (const [gx, gy, c2] of [[cx - 17, cy + 12, "#e6395e"], [cx, cy + 15, "#2bc4d8"], [cx + 17, cy + 12, "#e6395e"]]) { x.fillStyle = c2; x.strokeStyle = gold[3]; x.lineWidth = 1.7; x.beginPath(); x.arc(gx, gy, 3.6, 0, TAU); x.fill(); x.stroke(); } }); }
  function mordo(t, storm) {
    const a = pose(t, { br: BREATH, blink: blinkAt(.3), tail: [[0, 0], [.14, -9, "s"], [.25, 4, "s"], [.36, -1, "s"], [.46, 0, "s"], [1, 0, "l"]], wing: [[0, 0], [.56, 0, "l"], [.66, -20, "o"], [.82, -15, "s"], [.95, 0, "s"], [1, 0, "l"]], head: [[0, 0], [.22, 3, "s"], [.56, 3, "l"], [.66, -7, "o"], [.84, -5, "s"], [1, 0, "s"]], crown: [[0, 0], [.6, 0, "l"], [.68, -8, "o"], [.76, 4, "s"], [.84, -1, "s"], [.92, 0, "s"], [1, 0, "l"]], open: [[0, 0], [.6, 0, "l"], [.66, 1, "o"], [.72, .55, "s"], [.77, 1, "s"], [.86, .9, "l"], [.94, 0, "s"], [1, 0, "l"]], sq: [[0, .22], [.6, .22, "l"], [.66, .42, "o"], [.86, .42, "l"], [.95, .22, "s"], [1, .22, "l"]] });
    const body = storm ? P.cloud : P.night, wingP = storm ? P.cloud2 : P.night, tip = storm ? P.volt : P.blue, belly = storm ? P.cloud2 : P.white;
    at(100, 178, 0, () => {
      at(54, 136, a.tail, () => { if (storm) { part("M58,128 L32,136 L38,146 L10,150 L24,158 L46,155 L42,166 L66,148Z", P.volt, { c: .5 }); feather(58, 138, 172, 46, 8, P.cloud); feather(58, 142, 150, 40, 8, P.cloud2); }
        else { feather(62, 132, 164, 64, 10, P.blue); feather(62, 142, 178, 54, 9, P.night); feather(62, 138, 153, 56, 9, P.night); } });
      leg(84, 172, 86, 150, storm ? "#ffd65a" : "#5e6390", storm ? "#3a2406" : "#0b0c24"); leg(112, 172, 108, 150, storm ? "#ffd65a" : "#5e6390", storm ? "#3a2406" : "#0b0c24");
      if (storm) { for (const [cx, cy, r] of [[58, 112, 17], [50, 134, 15], [70, 154, 15], [122, 148, 16], [136, 124, 15]]) part(ell(cx, cy, r, r), P.cloud, { c: .8 }); }
      part("M60,104 C60,74 92,62 116,72 C142,82 148,116 136,138 C126,158 100,164 82,158 C64,152 58,130 60,104Z", body, { lw: 3, c: 1.2 });
      part("M92,108 C110,96 136,106 136,126 C134,146 112,160 92,156 C78,150 78,122 92,108Z", belly, { lw: 2.4, c: .7, rimA: .7 });
      if (storm) for (const [cx, cy, r] of [[104, 126, 7], [120, 140, 6], [96, 146, 5]]) { x.save(); x.globalAlpha = .4; x.fillStyle = P.cloud[2]; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.restore(); }
      at(92, 92, a.wing, () => { for (const [d, l, w, p] of [[138, 62, 10, tip], [150, 66, 11, wingP], [162, 66, 11, tip], [174, 58, 10, wingP]]) feather(92, 94, d, l, w, p); part("M72,82 C88,74 110,84 110,98 C110,114 92,124 74,122 C62,118 58,94 72,82Z", storm ? P.cloud2 : P.white, { c: .75 }); if (!storm) line("M74,104 Q86,112 100,104", P.white[2], 2.2); });
      at(122, 80, a.head, () => { part("M92,58 C96,30 136,22 156,42 C172,58 168,92 146,102 C124,110 96,102 92,84 C90,74 90,66 92,58Z", body, { lw: 3, c: 1.1 });
        if (storm) { part(ell(100, 48, 11, 11), P.cloud, { c: .7 }); part(ell(108, 96, 11, 9), P.cloud, { c: .7 }); }
        flat("M146,76 Q156,88 148,98 Q136,102 128,96 Q140,92 146,76Z", storm ? P.cloud[0] : "#3d4580", .9);
        beak(158, 62, 34, 12, a.open, storm ? P.volt : P.beak, storm ? P.flame : ["#4d4e68", "#2c2c44", "#17172a", "#0a0a16"], { hook: 5 });
        eye(136, 59, 15, { iris: storm ? "#ffe24a" : "#ffb31f", blink: a.blink, squint: a.sq, lid: storm ? "#55608f" : "#2b3263", brow: 19, browCol: storm ? "#141839" : "#0a0b24", look: [.34, .12] });
        acornCrown(120, 28, -12 + a.crown, storm); });
      if (storm) { const sp = [[.02, .28, 158, 138, 176, 112], [.34, .6, 30, 100, 10, 72], [.66, .94, 172, 150, 188, 176]]; for (const [s, e, ax, ay, bx, by] of sp) { const u = flight(t, s, e); if (u >= 0) bolt(ax + (bx - ax) * EASE.o(u), ay + (by - ay) * EASE.o(u), .85 * key([[0, 0], [.2, 1.1, "o"], [.7, 1, "l"], [1, 0, "i"]], u), P.volt, 14); } }
    }, 1 + .012 * a.br, 1 + .03 * a.br);
  }

  // ---------------------------------------------------------------- k1: the flock, three wet cheeky birds
  function chick(cx, cy, s, a, o) { at(cx, cy + 32 * s, 0, () => { at(cx, cy, 0, () => { const pal = o.pal || P.teal;
      feather(cx - 24, cy + 14, 164 + a.tail, 28, 7, pal); feather(cx - 24, cy + 18, 188 + a.tail, 24, 6, P.wave);
      leg(cx - 9, cy + 34, cx - 8, cy + 22, "#ff9e2b", "#5a2506"); leg(cx + 12, cy + 34, cx + 10, cy + 22, "#ff9e2b", "#5a2506");
      part(ell(cx, cy, 34, 33), pal, { lw: 3, c: 1.05 }); part(`M${cx - 8},${cy + 4} C${cx + 6},${cy - 8} ${cx + 28},${cy + 2} ${cx + 26},${cy + 16} C${cx + 18},${cy + 32} ${cx - 2},${cy + 34} ${cx - 12},${cy + 24} C${cx - 16},${cy + 16} ${cx - 14},${cy + 8} ${cx - 8},${cy + 4}Z`, P.foam, { lw: 2, c: .45, rimA: .5 });
      at(cx - 14, cy + 2, a.wing, () => { feather(cx - 12, cy - 2, 138, 25, 8, P.wave); feather(cx - 12, cy, 112, 22, 8, pal); });
      part(`M${cx - 4},${cy - 33} Q${cx - 13},${cy - 49} ${cx - 2},${cy - 56} Q${cx + 1},${cy - 46} ${cx + 8},${cy - 45} Q${cx + 5},${cy - 37} ${cx + 8},${cy - 32}Z`, pal, { lw: 2.2, c: .6 });
      if (o.face === "wink") { eye(cx + 3, cy - 8, 11, { blink: Math.max(a.blink, .14), lid: pal[1], brow: 15, look: [.3, .1], iris: "#1a8ea8" }); line(`M${cx + 19},${cy - 11} Q${cx + 25},${cy - 15} ${cx + 30},${cy - 10}`, "#07384f", 3.4); beak(cx + 24, cy + 1, 22, 8, a.open, P.yellow, P.orange); }
      else if (o.face === "laugh") { const b = Math.max(a.blink, .3); eye(cx + 2, cy - 8, 11, { blink: b, lid: pal[1], brow: 22, look: [.2, .1], iris: "#1a8ea8" }); eye(cx + 21, cy - 9, 9.5, { blink: b, lid: pal[1], brow: 18, look: [.2, .1], iris: "#1a8ea8" }); beak(cx + 23, cy + 5, 22, 9, a.open, P.yellow, P.orange); }
      else { eye(cx + 3, cy - 8, 11, { blink: a.blink, lid: pal[1], brow: 10, look: [.36, .05], iris: "#1a8ea8" }); eye(cx + 23, cy - 8, 9.5, { blink: a.blink, lid: pal[1], brow: 8, look: [.36, .05], iris: "#1a8ea8" }); beak(cx + 26, cy + 3, 20, 8, a.open, P.yellow, P.orange); if (a.tongue > .03) at(cx + 38, cy + 8, 26, () => part(`M${cx + 30},${cy + 5} Q${cx + 50},${cy + 9 + 5 * a.tongue} ${cx + 38 + 10 * a.tongue},${cy + 15 + 7 * a.tongue} Q${cx + 30},${cy + 15} ${cx + 30},${cy + 5}Z`, P.pink, { lw: 1.8, c: .2 })); }
    }); }, s, s * (1 + .03 * a.br)); }
  function flock(t) {
    const hop = (s) => [[0, 0], [s, 0, "l"], [s + .05, 5, "o"], [s + .13, -13, "o"], [s + .2, 3, "b"], [s + .26, 0, "s"], [1, 0, "l"]], ph = (o) => ((t + o) % 1), b = (o) => key(BREATH, ph(o));
    const A = { br: b(.33), blink: key(blinkAt(.1), t), tail: key([[0, 0], [.24, 9, "s"], [.36, -6, "s"], [.5, 0, "s"], [1, 0, "l"]], t), wing: key([[0, 0], [.1, 0, "l"], [.17, -18, "o"], [.3, 0, "s"], [1, 0, "l"]], t), open: key([[0, .15], [.12, .15, "l"], [.2, .8, "o"], [.34, .15, "s"], [1, .15, "l"]], t), y: key(hop(.08), t) };
    const B = { br: b(.66), blink: key(blinkAt(.42), t), tail: key([[0, 0], [.52, 0, "l"], [.6, 12, "s"], [.7, -7, "s"], [.8, 0, "s"], [1, 0, "l"]], t), wing: key([[0, 0], [.4, 0, "l"], [.48, -22, "o"], [.6, 0, "s"], [1, 0, "l"]], t), open: key([[0, .35], [.4, .35, "l"], [.47, 1, "o"], [.52, .55, "s"], [.57, 1, "s"], [.66, .35, "s"], [1, .35, "l"]], t), y: key(hop(.4), t) };
    const C = { br: b(0), blink: key(blinkAt(.74), t), tail: key([[0, 0], [.72, 0, "l"], [.82, 14, "s"], [.9, -5, "s"], [1, 0, "s"]], t), wing: key([[0, 0], [.68, 0, "l"], [.76, -16, "o"], [.9, -9, "s"], [1, 0, "s"]], t), open: key([[0, .4], [.68, .4, "l"], [.75, .85, "o"], [.92, .85, "l"], [1, .4, "s"]], t), tongue: key([[0, 0], [.7, 0, "l"], [.76, 1, "b"], [.9, 1, "l"], [.97, 0, "s"], [1, 0, "l"]], t), y: key(hop(.68), t) };
    part("M12,176 C24,166 58,170 96,168 C136,166 172,166 188,176 C176,188 140,188 100,187 C60,188 22,188 12,176Z", P.wave, { lw: 2.4, c: .55, rimA: .7 });
    line("M34,178 Q50,174 66,178 M118,179 Q136,175 152,179", P.foam[0], 2.6, .85);
    chick(52, 88 + A.y * .85, .86, A, { face: "wink", pal: ["#c4f2e6", "#55cfba", "#208c94", "#093e4c"] });
    chick(140, 82 + B.y * .85, .9, B, { face: "laugh", pal: ["#c8e6ff", "#50a9ee", "#2268c2", "#0b2c68"] });
    chick(95, 123 + C.y, 1.1, C, { face: "tongue" });
    for (const [s, e, ax, ay, r] of [[.05, .4, 26, 62, 3.8], [.28, .62, 172, 50, 3.4], [.52, .9, 122, 72, 3.2], [.74, 1.06, 70, 48, 3.4]]) { const u = flight(t, s, e % 1); if (u >= 0) { const q = key([[0, 0], [.15, 1, "o"], [.75, 1, "l"], [1, 0, "i"]], u); drop(ax, ay + 66 * EASE.i(u), r * q, P.wave); } }
  }

  // ---------------------------------------------------------------- k2, k3: Gritt
  function gritt(t, ice) {
    const a = pose(t, { br: BREATH, blink: blinkAt(.18), crest: [[0, 0], [.48, 0, "l"], [.57, 15, "o"], [.66, 7, "s"], [.74, 12, "s"], [.92, 0, "s"], [1, 0, "l"]], wing: [[0, 0], [.46, 0, "l"], [.57, -24, "o"], [.75, -18, "s"], [.92, 0, "s"], [1, 0, "l"]], head: [[0, 0], [.46, 0, "l"], [.54, 5, "s"], [.62, -7, "o"], [.8, -4, "s"], [.96, 0, "s"], [1, 0, "l"]], open: [[0, .05], [.5, .05, "l"], [.6, 1, "o"], [.78, .85, "l"], [.92, .05, "s"], [1, .05, "l"]], tail: [[0, 0], [.2, 6, "s"], [.38, -3, "s"], [.5, 0, "s"], [1, 0, "l"]], cloak: [[0, 0], [.3, 2, "s"], [.6, -3, "s"], [.82, 1, "s"], [1, 0, "s"]] });
    const body = ice ? P.ash : P.ember, wingA = ice ? P.cloak : P.coal, wingB = ice ? P.frost : P.flame, crestA = ice ? P.ice : P.flame, crestB = ice ? P.frost : P.ember, leg0 = ice ? "#9ad5f5" : "#ffb340", legI = ice ? "#123066" : "#4c1408";
    at(100, 178, 0, () => {
      if (ice) at(60, 90, a.cloak, () => part("M70,74 C44,92 26,132 22,170 L44,160 L54,174 L70,160 L84,176 L100,160 L100,84Z", P.cloak, { lw: 3, c: 1 }));
      at(60, 140, a.tail, () => { feather(64, 130, 200, 54, 12, ice ? P.ice : P.flame); feather(64, 138, 178, 62, 13, ice ? P.frost : P.ember); feather(64, 146, 158, 52, 12, ice ? P.ice : P.coal); });
      leg(86, 172, 88, 150, leg0, legI); leg(116, 172, 112, 150, leg0, legI);
      part("M60,116 C58,84 86,66 112,68 C142,72 152,104 146,128 C140,152 118,164 94,162 C72,158 62,140 60,116Z", body, { lw: 3, c: 1.2 });
      part("M104,104 C122,98 142,110 142,128 C138,146 120,158 102,156 C92,146 90,114 104,104Z", ice ? P.frost : P.hot, { lw: 2.2, c: .55, rimA: .6 });
      for (const [cx, cy] of [[112, 122], [126, 130], [110, 140]]) line(`M${cx - 6},${cy - 2} Q${cx},${cy + 5} ${cx + 6},${cy - 2}`, ice ? P.frost[2] : P.ember[1], 2.6);
      if (ice) { part("M72,66 C96,54 128,62 138,82 L130,100 L120,90 L110,106 L98,92 L88,108 L78,92 L66,102 C60,88 62,74 72,66Z", P.cloak2, { lw: 3, c: .9 }); part(ell(116, 84, 8.5, 8.5), P.ice, { c: .6 }); }
      at(84, 92, a.wing, () => { for (const [d, l, w, p] of [[120, 56, 11, wingB], [134, 62, 12, wingA], [148, 62, 12, wingB], [162, 54, 11, wingA]]) feather(86, 94, d, l, w, p); part("M66,88 C76,76 100,80 102,96 C102,112 88,122 74,120 C62,114 60,98 66,88Z", wingA, { c: .85 }); });
      at(122, 76, a.head, () => {
        at(104, 42, a.crest, () => { if (ice) { for (const [px, py, l, d] of [[96, 42, 40, 224], [108, 34, 50, 246], [122, 30, 42, 268]]) at(px, py, d, () => part(`M${px},${py - 7} L${px + l},${py} L${px},${py + 7} Q${px - 5},${py} ${px},${py - 7}Z`, P.ice, { c: .5 })); } else for (const [px, py, l, d, p] of [[96, 46, 46, 214, P.ember], [102, 38, 54, 234, P.flame], [116, 32, 52, 256, P.hot], [130, 34, 34, 280, P.flame]]) feather(px, py, d, l, 10, p, { c: .5 }); });
        part("M94,62 C96,34 134,24 156,42 C172,56 170,90 150,100 C126,110 98,102 94,84 C92,76 93,68 94,62Z", ice ? P.ash : P.ember, { lw: 3, c: 1.05 });
        part("M128,74 C142,66 164,72 164,84 C160,96 146,102 132,100 C122,94 120,80 128,74Z", ice ? P.frost : P.hot, { lw: 0, c: .3, rimA: .4 });
        beak(160, 58, 30, 15, a.open, ice ? P.ice : P.gold, ice ? P.frost : P.orange, { hook: 7 });
        eye(136, 57, 15, { iris: ice ? "#28b6f0" : "#ff4a24", blink: a.blink, squint: .24, lid: ice ? "#7f83b8" : "#d0401c", brow: 24, browCol: ice ? "#141c52" : "#2e0a10", look: [.34, .14] });
      });
      if (ice) { for (const [s, e, ax, ay, bx, by] of [[.58, .8, 188, 72, 196, 58], [.62, .88, 184, 86, 198, 86], [.66, .92, 182, 62, 192, 40]]) { const u = flight(t, s, e); if (u >= 0) star(ax + (bx - ax) * u, ay + (by - ay) * u, 6.5 * key([[0, .2], [.3, 1, "o"], [1, 0, "i"]], u), P.frost, u * 60); }
        for (const [cx, cy, l] of [[46, 150, 11], [70, 156, 9], [92, 158, 10]]) part(`M${cx - 4},${cy} L${cx},${cy + l} L${cx + 4},${cy}Z`, P.ice, { lw: 1.6, c: 0 }); }
      else for (const [s, e, ax, ay, bx, by, r] of [[.06, .4, 36, 110, 18, 52, 5], [.3, .66, 170, 128, 186, 70, 4.5], [.56, .9, 74, 38, 52, 6, 5.5], [.76, 1.0, 150, 22, 172, 10, 4]]) { const u = flight(t, s, e % 1); if (u >= 0) { const q = r * key([[0, 0], [.2, 1, "o"], [.75, .9, "l"], [1, 0, "i"]], u); at(ax + (bx - ax) * u, ay + (by - ay) * u, 45 + u * 90, () => part(`M0,${-q * 1.3} L${q},0 L0,${q * 1.3} L${-q},0Z`, P.hot, { lw: 1.6, c: 0 })); } }
    }, 1 + .012 * a.br, 1 + .028 * a.br);
  }

  // ---------------------------------------------------------------- k4, k5: Corvin
  function sack(cx, cy, r, pal, sq, deg, tie) { at(cx, cy - r * .9, deg || 0, () => { const w = r * (1 + .1 * sq), h = r * (1 - .1 * sq);
      part(`M${cx - 6},${cy - h * .78} C${cx - w * .92},${cy - h * .58} ${cx - w * 1.08},${cy + h * .6} ${cx - w * .35},${cy + h * .92} C${cx},${cy + h * 1.04} ${cx + w * .44},${cy + h * .98} ${cx + w * .78},${cy + h * .55} C${cx + w * 1.06},${cy + h * .14} ${cx + w * .66},${cy - h * .58} ${cx + 6},${cy - h * .78}Z`, pal, { lw: 3, c: .95 });
      line(`M${cx - w * .36},${cy + h * .3} Q${cx - w * .08},${cy + h * .58} ${cx + w * .32},${cy + h * .36}`, pal[2], 2.4); line(`M${cx - w * .46},${cy - h * .12} L${cx - w * .3},${cy + h * .06}`, pal[3], 2, .7);
      part(`M${cx - 8},${cy - h * .78} L${cx - 11},${cy - h * 1.16} Q${cx},${cy - h * 1.04} ${cx + 11},${cy - h * 1.16} L${cx + 8},${cy - h * .78}Z`, pal, { lw: 2.4, c: .5 }); part(`M${cx - 9},${cy - h * .88} L${cx + 9},${cy - h * .88} L${cx + 8},${cy - h * .7} L${cx - 8},${cy - h * .7}Z`, tie || P.rope, { lw: 1.8, c: .3 }); }); }
  function corvin(t, sand) {
    const a = pose(t, { br: BREATH, blink: blinkAt(.08), head: [[0, 0], [.34, 3, "s"], [.52, 3, "l"], [.6, -5, "o"], [.76, -3, "s"], [.92, 0, "s"], [1, 0, "l"]], wing: [[0, 0], [.46, 0, "l"], [.56, 7, "s"], [.64, -13, "o"], [.8, -9, "s"], [.94, 0, "s"], [1, 0, "l"]], sq: [[0, 0], [.5, 0, "l"], [.58, -.2, "s"], [.65, 1, "o"], [.76, .25, "s"], [.92, 0, "s"], [1, 0, "l"]], swing: [[0, 0], [.22, 4, "s"], [.52, -2, "s"], [.66, 7, "o"], [.86, -2, "s"], [1, 0, "s"]], open: [[0, .05], [.52, .05, "l"], [.62, .95, "o"], [.76, .75, "l"], [.9, .05, "s"], [1, .05, "l"]], tail: [[0, 0], [.14, 4, "s"], [.34, -3, "s"], [.5, 0, "s"], [1, 0, "l"]] });
    const body = P.raven, wingP = sand ? P.raven2 : P.raven;
    at(100, 180, 0, () => {
      at(52, 144, a.tail, () => { feather(58, 136, 158, 50, 13, P.raven2); feather(58, 146, 178, 54, 13, P.raven); feather(58, 152, 198, 42, 11, P.raven2); });
      if (!sand) at(46, 104, a.swing, () => sack(35, 134, 26, P.sack2, a.sq, 0, P.rope));
      else at(46, 104, a.swing, () => sack(34, 136, 25, P.sack, a.sq, 0, P.band));
      leg(82, 174, 84, 152, "#8b8ca8", "#0c0c22"); leg(114, 174, 110, 152, "#8b8ca8", "#0c0c22");
      part("M52,118 C46,84 76,58 106,60 C138,62 154,92 150,124 C146,152 122,166 94,164 C70,162 56,144 52,118Z", body, { lw: 3.2, c: 1.25 });
      for (const [cx, cy] of [[104, 124], [122, 118], [114, 138], [96, 142], [132, 136]]) line(`M${cx - 7},${cy - 3} Q${cx},${cy + 5} ${cx + 7},${cy - 3}`, P.raven[0], 2.4, .75);
      if (sand) { part("M62,76 C40,104 32,144 40,172 L58,160 L72,174 L88,160 L104,172 L116,158 L134,166 L148,140 C150,112 140,90 122,74Z", P.robe, { lw: 3.2, c: 1 }); line("M58,120 Q94,142 146,122", P.robe[2], 2.6); line("M50,146 Q90,166 142,146", P.robe[2], 2.6); part("M58,100 Q96,122 148,100 L150,112 Q96,136 54,114Z", P.band, { lw: 2.2, c: .4 }); }
      at(84, 88, a.wing, () => { for (const [d, l, w, p] of [[116, 62, 13, wingP], [130, 68, 14, P.raven2], [144, 68, 14, wingP], [158, 58, 12, P.raven2]]) feather(86, 90, d, l, w, p); part("M60,84 C72,70 102,74 106,92 C106,112 88,124 72,122 C58,114 54,96 60,84Z", sand ? P.robe2 : P.raven2, { c: .85 }); });
      if (!sand) { at(118, 148, -a.swing * .6, () => sack(132, 170, 22, P.sack, a.sq * .5, 0, P.rope)); line("M112,74 Q70,92 46,108", "#3b2410", 6); line("M112,74 Q70,92 46,108", P.rope[1], 2.6); for (let q = 0; q < 3; q++) { const u = flight(t, .62 + q * .04, .9 + q * .03); if (u >= 0) { const X = 18 - u * 8 - q * 3, Y = 96 + q * 13, L = 14 + 22 * EASE.o(u); x.save(); x.globalAlpha = key([[0, 0], [.2, 1, "o"], [.6, .9, "l"], [1, 0, "i"]], u); line(`M${X + 8},${Y} Q${X - L * .4},${Y - 7} ${X - L * .7},${Y + 1}`, "#e5f6ff", 3.4); x.restore(); } } }
      else { at(118, 148, -a.swing * .6, () => sack(133, 170, 21, P.sack, a.sq * .5, 0, P.band)); line("M112,74 Q70,92 46,108", "#4f2a10", 6); line("M112,74 Q70,92 46,108", P.robe[1], 2.6);
        for (let i = 0; i < 9; i++) { const u = ((t * 2 + i / 9) % 1), px = 18 + i % 2 * 5 + 7 * Math.pow(u, 1.5) * (i % 3 - 1), py = 148 + u * 38, r = (i % 3 === 0 ? 2.6 : 2) * key([[0, .5], [.2, 1, "o"], [.8, 1, "l"], [1, 0, "i"]], u); x.fillStyle = P.sand[3]; x.beginPath(); x.arc(px, py, r + 1.1, 0, TAU); x.fill(); x.fillStyle = P.sand[1]; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); }
        for (let i = 0; i < 6; i++) { const u = ((t * 2 + i / 6 + .1) % 1), px = 150 + i % 3 * 4, py = 174 + u * 18, r = 2 * key([[0, .5], [.2, 1, "o"], [.8, 1, "l"], [1, 0, "i"]], u); x.fillStyle = P.sand[3]; x.beginPath(); x.arc(px, py, r + 1, 0, TAU); x.fill(); x.fillStyle = P.sand[1]; x.beginPath(); x.arc(px, py, r, 0, TAU); x.fill(); } }
      at(120, 78, a.head, () => {
        if (sand) part("M84,52 C92,18 146,10 166,42 C174,58 170,78 160,92 L150,84 L138,106 L122,94 L104,106 L92,88 C82,78 80,64 84,52Z", P.robe, { lw: 3.2, c: 1 });
        for (const [px, py, d, l] of [[100, 92, 118, 24], [112, 98, 100, 26], [126, 100, 84, 24], [140, 98, 66, 20]]) if (!sand) feather(px, py, d, l, 7, P.raven2, { c: .4 });
        part("M92,54 C98,30 136,24 156,42 C170,56 168,86 148,96 C126,104 100,98 94,80 C91,72 90,62 92,54Z", body, { lw: 3, c: 1.05 });
        if (sand) { part("M92,44 C106,22 146,20 162,42 C150,36 112,36 98,58 C94,54 91,50 92,44Z", P.band, { lw: 2.4, c: .45 }); part(ell(148, 34, 6.5, 6.5), P.gold, { c: .4 }); }
        beak(154, 58, 42, 17, a.open, P.beak, ["#5c5c76", "#33334c", "#1a1a30", "#0a0a18"], { hook: 11 });
        eye(134, 60, 13, { iris: "#ffcf3e", blink: a.blink, squint: .34, lid: "#34355c", brow: 18, browCol: "#e8e6fa", browY: -2, look: [.38, .14] });
        if (!sand) line("M108,50 L116,56 M106,62 L115,63", P.grey[1], 2.4);
      });
    }, 1 + .012 * a.br, 1 + .024 * a.br);
  }

  // ---------------------------------------------------------------- bat wing, shared by the shadow and Nyx
  function batWing(sx, sy, dir, spread, pal, big) { const s = big || 1; at(sx, sy, dir * spread, () => { const X = (v) => (sx + dir * v * s).toFixed(1), Y = (v) => (sy + v * s).toFixed(1);
      part(`M${X(0)},${Y(-10)} C${X(18)},${Y(-30)} ${X(44)},${Y(-38)} ${X(64)},${Y(-28)} Q${X(72)},${Y(-10)} ${X(66)},${Y(12)} Q${X(52)},${Y(2)} ${X(44)},${Y(22)} Q${X(30)},${Y(10)} ${X(20)},${Y(28)} Q${X(10)},${Y(16)} ${X(0)},${Y(22)}Z`, pal, { lw: 3, c: .85 });
      line(`M${X(4)},${Y(-6)} L${X(44)},${Y(20)} M${X(4)},${Y(-8)} L${X(62)},${Y(8)} M${X(4)},${Y(-2)} L${X(20)},${Y(26)}`, pal[3], 2, .55); part(`M${X(62)},${Y(-30)} L${X(70)},${Y(-40)} L${X(70)},${Y(-22)}Z`, pal, { lw: 2, c: 0 }); }); }

  // ---------------------------------------------------------------- k6: a shadow, a small hooded bat with crystal eyes
  function shadow(t) {
    const a = pose(t, { br: BREATH, blink: blinkAt(.7), w: [[0, 0], [.14, -11, "s"], [.28, 6, "o"], [.42, -5, "s"], [.56, 3, "s"], [.7, 0, "s"], [1, 0, "s"]], lean: [[0, 0], [.3, 3, "s"], [.56, -4, "s"], [.76, 3, "s"], [1, 0, "s"]], glow: [[0, 0], [.2, 0, "l"], [.3, 1, "o"], [.42, .25, "s"], [.52, 1, "s"], [.7, 0, "s"], [1, 0, "l"]], y: [[0, 0], [.5, -6, "s"], [1, 0, "s"]], hood: [[0, 0], [.22, 0, "l"], [.32, 8, "o"], [.54, 6, "s"], [.72, 0, "s"], [1, 0, "l"]] });
    for (const [s, e, ax, ay, bx, by, r] of [[.12, .5, 28, 150, 16, 104, 7], [.4, .78, 178, 148, 190, 100, 6], [.66, .96, 52, 72, 42, 26, 6]]) { const u = flight(t, s, e); if (u >= 0) { const q = r * key([[0, 0], [.22, 1, "o"], [.76, 1, "l"], [1, 0, "i"]], u), X = ax + (bx - ax) * u, Y = ay + (by - ay) * u; at(X, Y, u * 120, () => part(`M${X},${Y - q * 1.5} L${X + q},${Y} L${X},${Y + q * 1.5} L${X - q},${Y}Z`, P.gem, { lw: 1.8, c: .25 })); } }
    x.save(); x.translate(0, a.y); at(100, 150, a.lean, () => {
      batWing(66, 92, -1, a.w, P.shade2, .95); batWing(134, 92, 1, -a.w, P.shade2, .95);
      part("M62,88 C60,128 56,160 44,178 L66,168 L80,182 L100,170 L120,182 L134,168 L156,178 C144,160 140,128 138,88 C126,70 74,70 62,88Z", P.shade, { lw: 3.2, c: 1.2 });
      for (const [cx, cy, s] of [[84, 152, 1], [116, 148, .85], [100, 164, .72]]) part(`M${cx},${cy - 11 * s} L${cx + 7 * s},${cy} L${cx},${cy + 11 * s} L${cx - 7 * s},${cy}Z`, P.gem2, { lw: 1.8, c: .3 });
      at(100, 62, a.hood * .3, () => { for (const [ox, d] of [[-30, -10], [30, 10]]) at(100 + ox, 42, d, () => part(`M${100 + ox - 12},${44} L${100 + ox},${8} L${100 + ox + 12},${44}Z`, P.shade, { lw: 3, c: .55 }));
        part("M100,14 C140,14 154,52 150,86 C146,110 124,122 100,122 C76,122 54,110 50,86 C46,52 60,14 100,14Z", P.shade, { lw: 3.2, c: 1.1 });
        part(`M100,${44 + a.hood * .15} C126,${44 + a.hood * .15} 136,66 132,86 C126,102 112,108 100,108 C88,108 74,102 68,86 C64,66 74,${44 + a.hood * .15} 100,${44 + a.hood * .15}Z`, ["#1a1040", "#100a2c", "#080518", "#050310"], { lw: 2.6, c: 0 });
        const g = a.glow, b = a.blink; for (const [cx, sn] of [[85, -1], [117, 1]]) { const h = 15 * (1 - b * .92); x.save(); x.globalAlpha = .28 + .4 * g; x.fillStyle = "#7cf6ff"; const R = 16 + 6 * g; x.beginPath(); x.moveTo(cx, 76 - R); x.lineTo(cx + R * .82, 76); x.lineTo(cx, 76 + R); x.lineTo(cx - R * .82, 76); x.fill(); x.restore(); at(cx, 76, sn * 13, () => part(`M${cx},${76 - h} L${cx + 11},${76} L${cx},${76 + h} L${cx - 11},${76}Z`, P.gem, { lw: 2, c: .25 })); if (b < .6) { x.fillStyle = "#0a2054"; x.beginPath(); x.moveTo(cx + 2, 76 - h * .5); x.lineTo(cx + 5, 76); x.lineTo(cx + 2, 76 + h * .5); x.lineTo(cx - 1, 76); x.fill(); } }
        line("M90,96 L95,92 L100,97 L105,92 L110,96", "#7cf6ff", 2.4, .9);
      }); }); x.restore();
  }

  // ---------------------------------------------------------------- k7: Nyx hugging the moon
  function nyxFace(cx, cy, r, a, o = {}) { part(`M${cx - r * .92},${cy - r * .3} L${cx - r * .98},${cy - r * 1.4} L${cx - r * .24},${cy - r * .92}Z`, P.bat, { lw: 2.4, c: .5 }); part(`M${cx + r * .92},${cy - r * .3} L${cx + r * .98},${cy - r * 1.4} L${cx + r * .24},${cy - r * .92}Z`, P.bat, { lw: 2.4, c: .5 }); flat(`M${cx - r * .78},${cy - r * .55} L${cx - r * .84},${cy - r * 1.14} L${cx - r * .42},${cy - r * .82}Z`, P.pink[1], .9); flat(`M${cx + r * .78},${cy - r * .55} L${cx + r * .84},${cy - r * 1.14} L${cx + r * .42},${cy - r * .82}Z`, P.pink[1], .9);
    part(ell(cx, cy, r, r * .92), P.bat, { lw: 3, c: .95 }); flat(`M${cx - r * .62},${cy + r * .1} Q${cx},${cy - r * .34} ${cx + r * .62},${cy + r * .1} Q${cx + r * .54},${cy + r * .72} ${cx},${cy + r * .8} Q${cx - r * .54},${cy + r * .72} ${cx - r * .62},${cy + r * .1}Z`, P.bat[0], .55);
    const er = r * .34; eye(cx - r * .32, cy - r * .06, er, { blink: a.blink, squint: o.squint || 0, lid: P.bat[1], brow: o.brow, browCol: "#2b1464", iris: o.iris || "#ff5a8f", look: o.look || [.3, .15] }); eye(cx + r * .4, cy - r * .08, er * .92, { blink: a.blink, squint: o.squint || 0, lid: P.bat[1], brow: o.brow === undefined ? undefined : -o.brow * (o.mirror === undefined ? -1 : o.mirror), browCol: "#2b1464", iris: o.iris || "#ff5a8f", look: o.look || [.3, .15] });
    if (o.smile) line(`M${cx - r * .2},${cy + r * .46} Q${cx + r * .06},${cy + r * .68} ${cx + r * .34},${cy + r * .42}`, "#2b1464", 2.8); else line(`M${cx - r * .14},${cy + r * .56} Q${cx + r * .08},${cy + r * .4} ${cx + r * .3},${cy + r * .54}`, "#2b1464", 2.8);
    part(`M${cx - r * .08},${cy + r * .5} L${cx + r * .04},${cy + r * .78} L${cx + r * .14},${cy + r * .48}Z`, P.white, { lw: 1.4, c: 0 }); }
  function moonNyx(t) {
    const a = pose(t, { br: BREATH, blink: blinkAt(.34), rock: [[0, -2], [.5, 3, "s"], [1, -2, "s"]], hug: [[0, 0], [.2, 1, "s"], [.34, 1, "l"], [.5, 0, "s"], [1, 0, "l"]], w: [[0, 0], [.6, 0, "l"], [.68, -13, "o"], [.76, 2, "s"], [.84, -9, "s"], [.94, 0, "s"], [1, 0, "l"]], peek: [[0, 0], [.56, 0, "l"], [.64, -6, "o"], [.86, -6, "l"], [.96, 0, "s"], [1, 0, "l"]], tw: [[0, 0], [.5, 1, "s"], [1, 0, "s"]] });
    for (const [cx, cy, r, s, e] of [[24, 36, 7, .1, .5], [176, 28, 8, .46, .86], [182, 150, 6, .72, .12], [18, 148, 6, .28, .68]]) { const u = flight(t, s, e); if (u >= 0) star(cx, cy, r * key([[0, 0], [.4, 1, "o"], [1, 0, "i"]], u), P.moon, u * 40); }
    at(100, 104, a.rock, () => { const m = new Path2D(); m.arc(100, 104, 78, 0, TAU); const mo = { p: m, b: [34, 34, 166, 174] };
      part(mo, P.moon, { lw: 3.4, c: 1.7, rimA: 1 }); for (const [cx, cy, r] of [[56, 70, 12], [76, 148, 10], [146, 70, 8], [150, 132, 12], [116, 42, 6]]) part(ell(cx, cy, r, r), P.crater, { lw: 1.8, c: .4, rimA: .4 });
      x.save(); x.translate(0, a.hug * 1.4);
      // the bat clings to the front of the moon
      batWing(82, 110, -1, 18 + a.w, P.bat2, .86); batWing(118, 110, 1, -18 - a.w, P.bat2, .86);
      part("M72,108 C70,88 130,88 128,108 C130,136 118,152 100,152 C82,152 70,136 72,108Z", P.bat, { lw: 3, c: 1 });
      part("M86,114 Q100,106 114,114 Q116,134 100,142 Q84,134 86,114Z", P.bat2, { lw: 0, c: .3 });
      line("M90,120 Q100,126 110,120 M92,130 Q100,135 108,130", "#2b1464", 2, .6);
      leg(88, 158, 90, 146, "#c9a7ee", "#190a40"); leg(112, 158, 110, 146, "#c9a7ee", "#190a40");
      for (const [px, py, s] of [[58, 124, -1], [142, 124, 1]]) { part(ell(px, py, 8.5, 7.5), P.bat, { lw: 2.4, c: .5 }); line(`M${px + s * 3},${py + 1} L${px + s * 8},${py + 7} M${px},${py + 3} L${px + s * 2},${py + 9}`, "#190a40", 2); }
      at(100, 88, a.peek * .4, () => nyxFace(100 + a.peek * .25, 86, 28, a, { squint: .1, brow: 13, look: [.32 + a.peek * .03, .14], iris: "#ff4f8f" })); x.restore();
    });
  }

  // ---------------------------------------------------------------- k9: Nyx and the lantern of stars
  function lanternNyx(t) {
    const a = pose(t, { br: BREATH, blink: blinkAt(.56), w: [[0, 0], [.12, -10, "s"], [.25, 5, "o"], [.36, -3, "s"], [.48, 0, "s"], [1, 0, "l"]], arm: [[0, 0], [.22, 4, "s"], [.5, -7, "s"], [.76, 3, "s"], [1, 0, "s"]], glow: [[0, 0], [.3, .5, "s"], [.48, 1, "o"], [.7, .2, "s"], [1, 0, "s"]], head: [[0, 0], [.4, 0, "l"], [.5, 6, "o"], [.7, 4, "s"], [.86, 0, "s"], [1, 0, "l"]], y: [[0, 0], [.5, -6, "s"], [1, 0, "s"]] });
    x.save(); x.translate(0, a.y);
    batWing(56, 92, -1, 10 + a.w, P.bat2, .78);
    part("M38,104 C36,86 78,84 82,106 C86,136 78,158 60,160 C44,158 36,134 38,104Z", P.bat, { lw: 3, c: 1 }); part("M46,114 Q60,106 72,114 Q74,136 60,148 Q46,136 46,114Z", P.bat2, { lw: 0, c: .3 });
    leg(50, 170, 52, 154, "#c9a7ee", "#190a40"); leg(70, 170, 68, 154, "#c9a7ee", "#190a40");
    at(80, 104, a.arm, () => { line("M74,110 Q94,92 116,72", "#190a40", 11); line("M74,110 Q94,92 116,72", P.bat[1], 6); part(ell(118, 70, 8, 7.5), P.bat, { lw: 2.4, c: .45 });
      at(120, 66, -a.arm * 1.5, () => { line("M120,66 L132,44", "#3a2208", 5.4); line("M120,66 L132,44", P.brass[1], 2.4); const lx = 134, ly = 118; line(`M${lx},${ly - 66} Q${lx - 4},${ly - 76} ${lx - 2},${ly - 74}`, "#3a2208", 3);
        at(lx, ly - 76, 0, () => { line(`M${lx},${ly - 76} L${lx},${ly - 52}`, "#3a2208", 5); line(`M${lx},${ly - 76} L${lx},${ly - 52}`, P.brass[1], 2.2);
          x.save(); x.globalAlpha = .22 + .2 * a.glow; x.fillStyle = "#ffe89a"; x.beginPath(); x.arc(lx, ly, 52 + 7 * a.glow, 0, TAU); x.fill(); x.restore();
          part(`M${lx - 28},${ly - 34} L${lx + 28},${ly - 34} Q${lx + 42},${ly} ${lx + 28},${ly + 36} L${lx - 28},${ly + 36} Q${lx - 42},${ly} ${lx - 28},${ly - 34}Z`, P.glass, { lw: 3, c: .75, rimA: 1, rim: "#fffbe5" });
          for (const [sx, sy, r, ph2] of [[-14, -8, 9, 0], [12, -16, 6.5, .33], [8, 10, 9.5, .66], [-16, 18, 6, .15]]) { const u = (t + ph2) % 1, q = key([[0, .78], [.5, 1.12, "s"], [1, .78, "s"]], u); star(lx + sx, ly + sy, r * q, ["#ffffff", "#ffd23c", "#ff9c1e", "#7a4208"], u * 50); }
          for (let i = -1; i <= 1; i += 2) line(`M${lx + i * 12},${ly - 34} Q${lx + i * 18},${ly} ${lx + i * 12},${ly + 36}`, P.brass[3], 2.6, .55);
          part(`M${lx - 33},${ly - 46} L${lx + 33},${ly - 46} L${lx + 26},${ly - 32} L${lx - 26},${ly - 32}Z`, P.brass, { lw: 2.6, c: .55 }); part(`M${lx - 13},${ly - 58} Q${lx},${ly - 66} ${lx + 13},${ly - 58} L${lx + 17},${ly - 45} L${lx - 17},${ly - 45}Z`, P.brass, { lw: 2.2, c: .45 });
          part(`M${lx - 31},${ly + 34} L${lx + 31},${ly + 34} L${lx + 25},${ly + 47} L${lx - 25},${ly + 47}Z`, P.brass, { lw: 2.6, c: .5 });
        }, 1, 1); }); });
    for (const [s, e, ax, ay, bx, by, r] of [[.1, .5, 150, 60, 182, 12, 7], [.36, .74, 118, 56, 96, 8, 6], [.62, .98, 170, 62, 192, 38, 5.5]]) { const u = flight(t, s, e); if (u >= 0) star(ax + (bx - ax) * EASE.o(u), ay + (by - ay) * EASE.o(u), r * key([[0, .1], [.25, 1, "o"], [.75, .9, "l"], [1, 0, "i"]], u), ["#ffffff", "#ffe36a", "#ffaf28", "#7a4208"], u * 90); }
    at(58, 80, a.head, () => nyxFace(60, 72, 34, a, { smile: 1, brow: -6, mirror: 1, iris: "#ffb21e", look: [.45, .12] })); x.restore();
  }

  const ROSTER = [(t) => mordo(t, false), flock, (t) => gritt(t, false), (t) => gritt(t, true), (t) => corvin(t, false), (t) => corvin(t, true), shadow, moonNyx, (t) => mordo(t, true), lanternNyx];
  const INK = ["#070818", "#07283d", "#3e0a0e", "#10245e", "#090818", "#3a2008", "#080424", "#190a40", "#0d1030", "#190a40"];
  const mk = (w) => { const c = document.createElement("canvas"); c.width = c.height = w; return c; };
  const sil = (src, col) => { const c = mk(src.width), y = c.getContext("2d"); y.drawImage(src, 0, 0); y.globalCompositeOperation = "source-in"; y.fillStyle = col; y.fillRect(0, 0, c.width, c.height); return c; };
  // t runs 0-1 over the loop. Everything is painted large, cut out with its outline and side wall, and reduced once at the end.
  window.paintBoss = function (k, t, px) { const W = 352, face = mk(W); x = face.getContext("2d"); x.setTransform(W / 200, 0, 0, W / 200, 0, 0); x.imageSmoothingQuality = "high";
    const fit = .94; x.translate(100, 100); x.scale(fit, fit); x.translate(-100, -100); ROSTER[k](t); x.setTransform(1, 0, 0, 1, 0, 0);
    const ink = INK[k], lined = mk(W), l = lined.getContext("2d"), inked = sil(face, ink), OL = 3.2; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; l.drawImage(inked, Math.cos(a) * OL, Math.sin(a) * OL); } l.drawImage(face, 0, 0);
    const out = mk(W), c = out.getContext("2d"), wall = sil(lined, ink), dark = sil(lined, "#140a1c"), TH = 5; c.save(); c.globalAlpha = .34; c.filter = "blur(1.6px)"; c.drawImage(dark, 1.5, TH + 3); c.restore(); for (let i = TH; i >= 1; i--) c.drawImage(wall, 0, i); c.drawImage(lined, 0, 0);
    const res = mk(px), r = res.getContext("2d"); r.imageSmoothingEnabled = true; r.imageSmoothingQuality = "high"; r.drawImage(out, 0, 0, px, px); return res; };
  window.BOSS_COUNT = ROSTER.length;
})();
