// Charmfall side games (2026-11-05, İdris: "yan oyunlar veya ödüller için kısa oyunlar ekle"; he picked all four):
//   carrots    Carrot Patch  nine holes in a dug bed; pull carrots, stop with Keep whenever you like; one hole hides the mole, who takes half
//   fireflies  Firefly Catch fifteen seconds on a summer night: tap the fireflies into the jar
//   lilypads   Lily Hop      hold to crouch, let go to jump; Pogo hops from pad to pad across the pond, a miss ends in a splash
//   nests      Mordo's Nests Mordo drops a charm into one of three nests and shuffles them, faster each round; find it, or keep what you have
// MINI.open(name, { reward }) shows the game in its own layer over the page and resolves { reward } when it is closed:
//   { game, tier 0-3, score, practice, stars, carrots, boost: { name: count } }. Only `reward: true` pays into the save (MINI_REWARD),
//   the playground on the map opens them as practice. The art is painted (anim/src/mini-wc.js -> anim/mini-*.webp, sizes in anim/mini-art.js),
//   Pogo is the game's own keyed rig (paHtml / paPlay), Mordo is the map's magpie loop (anim/cr-magpie.webp). Every motion here is a keyed table
//   (MK below, the same [ms, values, ease] format as anim/ui-keys.js) sampled each frame; nothing runs while the layer is closed.
(() => {
  "use strict";
  // ---------------------------------------------------------------- rewards: one table, tuned in one place
  // A game ends on a tier from 0 to 3; the thresholds are the score each tier needs. Boosters count through the save's booster multiplier
  // (BXM), carrots through RWM, so a tier-2 game is worth about one booster handout. Practice games pay nothing.
  const MINI_REWARD = {
    tiers: [{}, { stars: 1 }, { stars: 1, boost: 1 }, { stars: 2, boost: 1, carrots: 1 }],
    need: { carrots: [3, 5, 7], fireflies: [8, 15, 22], lilypads: [4, 8, 12], nests: [1, 2, 3] },
    boosters: ["hammer", "moves", "switch", "cross"]
  };
  window.MINI_REWARD = MINI_REWARD;

  // ---------------------------------------------------------------- words (English in the code, Turkish beside it)
  const TRM = {
    "Carrot Patch": "Havuç Tarlası", "Firefly Catch": "Ateşböceği Avı", "Lily Hop": "Nilüfer Zıplama", "Mordo's Nests": "Mordo'nun Yuvaları",
    "Pull carrots from the holes. One hole hides the mole: he takes half. Stop with Keep whenever you like.": "Deliklerden havuç çek. Bir delikte köstebek saklanıyor: yarısını alır. İstediğin an Bırak'a bas.",
    "Tap the fireflies to catch them in the jar. You have 15 seconds.": "Ateşböceklerine dokun, kavanoza topla. 15 saniyen var.",
    "Hold to crouch, let go to jump. Land on the next pad. Twelve pads to the far bank.": "Basılı tut, eğil; bırak, zıpla. Bir sonraki yaprağa kon. Karşı kıyıya on iki yaprak.",
    "Mordo hides a charm in a nest and shuffles them. Find it three times. A miss keeps half of what you won.": "Mordo bir tılsımı yuvaya saklayıp yuvaları karıştırıyor. Üç kez bul. Iskalarsan kazandığının yarısı kalır.",
    "Play": "Oyna", "Keep": "Bırak", "Next round": "Sonraki tur", "Collect": "Topla", "Close": "Kapat", "Practice: no rewards": "Antrenman: ödül yok",
    "The mole!": "Köstebek!", "He took half.": "Yarısını aldı.", "All carrots out!": "Bütün havuçlar çıktı!", "Time!": "Süre doldu!", "Splash!": "Şap!", "The far bank!": "Karşı kıyı!",
    "Found it!": "Buldun!", "Not there…": "Orada değil…", "Watch the charm…": "Tılsımı izle…", "Which nest?": "Hangi yuva?", "Round {0}/3": "Tur {0}/3",
    "Pads {0}/12": "Yaprak {0}/12", "Caught {0}": "Yakalanan {0}", "Carrots {0}": "Havuç {0}", "No reward this time.": "Bu sefer ödül yok.", "Well played!": "İyi oynadın!", "Great run!": "Harika!", "Perfect!": "Kusursuz!",
    "Playground": "Oyun parkı", "Short games with Pogo. In the playground they are practice, no rewards.": "Pogo ile kısa oyunlar. Oyun parkında antrenman olarak oynanır, ödül yok.",
    "Stars": "Yıldız", "Carrots": "Havuç", "Woodpecker": "Ağaçkakan", "+10 Moves": "+10 Hamle", "Free Switch": "Serbest Değiş", "Cross Blast": "Haç Patlaması", "Undo": "Geri al"
  };
  const T = (s, ...a) => { let o = (typeof save === "object" && save && save.lang === "tr" && TRM[s]) || s; a.forEach((v, i) => { o = o.replace("{" + i + "}", v); }); return o; };

  // ---------------------------------------------------------------- the keyed motions: [ms, values, ease into this key]
  const SNAP = "cubic-bezier(.18,.9,.32,1)", SETTLE = "cubic-bezier(.45,0,.55,1)", LIFT = "cubic-bezier(.3,0,.7,.4)", DROP = "cubic-bezier(.55,0,.9,.55)", OUT = "cubic-bezier(.2,.7,.3,1)";
  const MK = {
    // a carrot tugged twice, then out of the ground with a snap, a little overshoot and a settle
    pull: [[0, { y: 0, r: 0, sx: 1, sy: 1 }], [110, { y: -.07, r: -.07, sx: 1.06, sy: .92 }, SETTLE], [230, { y: -.04, r: .08, sx: 1.04, sy: .95 }, SETTLE], [350, { y: -.13, r: -.06, sx: 1.07, sy: .91 }, SETTLE],
      [500, { y: -1.0, r: .1, sx: .9, sy: 1.12 }, SNAP], [660, { y: -1.12, r: -.05, sx: 1.03, sy: .97 }, SETTLE], [800, { y: -1.05, r: 0, sx: 1, sy: 1 }, SETTLE]],
    // the mole: up through the soil with a stretch, a squash at the top and a settle
    mole: [[0, { y: 0, sy: 1 }], [150, { y: -.78, sy: 1.16 }, SNAP], [250, { y: -.66, sy: .9 }, SETTLE], [360, { y: -.7, sy: 1.02 }, SETTLE], [440, { y: -.7, sy: 1 }, SETTLE]],
    // a clod of soil thrown by a pull: up, an arc, a bounce
    clod: [[0, { x: 0, y: 0, a: 1 }], [260, { x: .6, y: -1, a: 1 }, OUT], [520, { x: 1, y: .2, a: 1 }, DROP], [620, { x: 1.08, y: .05, a: .8 }, SETTLE], [760, { x: 1.12, y: .2, a: 0 }, DROP]],
    // something caught going to its counter or jar (p along the line, h lift, s scale, r turn, a alpha): the same flight as the HUD's icons
    fly: [[0, { p: 0, h: 0, s: 1, r: 0, a: 1 }], [160, { p: -.05, h: .1, s: 1.25, r: -.05, a: 1 }, LIFT], [520, { p: .62, h: .3, s: 1.05, r: .08, a: 1 }, SNAP], [720, { p: 1, h: 0, s: .5, r: 0, a: .9 }, DROP]],
    // a miss on the night meadow: a small ring opens and fades
    miss: [[0, { s: .3, a: .9 }], [260, { s: 1, a: .4 }, OUT], [420, { s: 1.15, a: 0 }, SETTLE]],
    // Lily Hop: the crouch while the finger is down (sampled by power, 0-1000), the jump (p along, h height as a share of the arc, sq squash),
    // and the landing
    crouch: [[0, { sq: 1 }], [180, { sq: .9 }, SETTLE], [1000, { sq: .74 }, SETTLE]],
    hop: [[0, { p: 0, h: 0, sq: .8 }], [90, { p: .04, h: .14, sq: 1.18 }, SNAP], [330, { p: .5, h: 1, sq: 1.02 }, OUT], [560, { p: .96, h: .1, sq: 1.06 }, DROP], [600, { p: 1, h: 0, sq: 1.08 }, DROP]],
    land: [[0, { sq: 1.08 }], [70, { sq: .82 }, DROP], [190, { sq: 1.06 }, SNAP], [300, { sq: .98 }, SETTLE], [380, { sq: 1 }, SETTLE]],
    sink: [[0, { y: 0, a: 1 }], [160, { y: .25, a: 1 }, DROP], [420, { y: .7, a: 0 }, SETTLE]],
    padBob: [[0, { y: 0 }], [80, { y: 6 }, DROP], [240, { y: -2 }, SETTLE], [380, { y: 0 }, SETTLE]],
    // Mordo's Nests: the charm dropped from his beak; two nests trading places (one over, one under); a nest tipped to show what is inside
    drop: [[0, { y: 0, s: 1, r: 0 }], [330, { y: 1, s: .96, r: .1 }, DROP], [420, { y: .9, s: 1.04, r: 0 }, SETTLE], [500, { y: 1, s: 1, r: 0 }, SETTLE]],
    swap: [[0, { p: 0, h: 0, s: 1 }], [120, { p: .08, h: .25, s: 1.04 }, LIFT], [420, { p: .9, h: .9, s: 1.06 }, SNAP], [520, { p: 1, h: 0, s: 1 }, DROP], [600, { p: 1, h: 0, s: 1 }, SETTLE]],
    peek: [[0, { y: 0, r: 0 }], [140, { y: 10, r: 0 }, SETTLE], [320, { y: -80, r: -.35 }, SNAP], [1100, { y: -80, r: -.35 }, SETTLE], [1300, { y: 0, r: 0 }, DROP]],
    // the result card's stars land one by one
    star: [[0, { s: 0, r: -.4, a: 0 }], [180, { s: 1.35, r: .1, a: 1 }, SNAP], [300, { s: .92, r: -.03, a: 1 }, SETTLE], [400, { s: 1, r: 0, a: 1 }, SETTLE]]
  };
  const bez = (x1, y1, x2, y2) => { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, DX = (t) => (3 * ax * t + 2 * bx) * t + cx, Y = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const d = DX(t); if (d < 1e-6) break; const e = X(t) - x; if (Math.abs(e) < 1e-5) break; t -= e / d; } return Y(t); }; };
  const SAMP = {}; for (const [k, keys] of Object.entries(MK)) SAMP[k] = { t: keys.map(q => q[0]), v: keys.map(q => q[1]), e: keys.map(q => { const m = /\(([^)]+)\)/.exec(q[2] || ""); if (!m) return (u) => u; const [a, b, c, d] = m[1].split(",").map(Number); return bez(a, b, c, d); }), len: keys.at(-1)[0], props: Object.keys(keys[0][1]) };
  function K(name, ms, out) { const S = SAMP[name], t = S.t, n = t.length; out = out || {}; if (ms <= 0) { Object.assign(out, S.v[0]); return out; } if (ms >= S.len) { Object.assign(out, S.v[n - 1]); return out; }
    let i = 1; while (t[i] <= ms) i++; const a = S.v[i - 1], b = S.v[i], k = S.e[i]((ms - t[i - 1]) / (t[i] - t[i - 1])); for (const p of S.props) out[p] = a[p] + ((b[p] ?? a[p]) - a[p]) * k; return out; }
  const KLEN = (n) => SAMP[n].len;

  // ---------------------------------------------------------------- art
  const Q = location.protocol === "file:" ? "" : "?v=1106a", IMG = {};
  const img = (src) => IMG[src] || (IMG[src] = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  const art = (name) => img("anim/mini-" + name + ".webp" + Q);
  const NEED = { carrots: ["bg-field", "hole", "lip", "carrot", "gcarrot", "mole", "star"], fireflies: ["bg-night", "jar", "fly", "star"], lilypads: ["bg-pond", "pad0", "pad1", "pad2", "reeds0", "reeds1", "ripple", "splash", "star"], nests: ["bg-tree", "nestB", "nestF", "star"] };
  const EXTRA = { nests: { mag: "anim/cr-magpie.webp", charm: "anim/ch-star.webp" } };
  async function loadArt(name) { const A = {}; await Promise.all(NEED[name].map(async (k) => { A[k] = await art(k); }).concat(Object.entries(EXTRA[name] || {}).map(async ([k, src]) => { A[k] = await img(src + Q); }))); return A; }
  // one frame of a sheet, centred on (x, y) at width w (keeps the frame's aspect)
  function spr(x, A, name, f, cx, cy, w, o) { const im = A[name]; if (!im) return; const m = (window.MINI_ART || {})[name] || [1, 1, im.width, im.height], [n, cols, fw, fh] = m, i = ((f | 0) % n + n) % n, sx = (i % cols) * fw, sy = Math.floor(i / cols) * fh, h = w * fh / fw;
    if (o) { x.save(); x.translate(cx, cy); if (o.r) x.rotate(o.r); x.scale(o.sx || 1, o.sy || 1); if (o.a !== undefined) x.globalAlpha = o.a; x.drawImage(im, sx, sy, fw, fh, -w / 2, -h * (o.oy ?? .5), w, h); x.restore(); }
    else x.drawImage(im, sx, sy, fw, fh, cx - w / 2, cy - h / 2, w, h); }

  // ---------------------------------------------------------------- the layer
  const css = `
  #miniOv { position: fixed; inset: 0; z-index: 60; background: #2a2018; display: flex; justify-content: center; touch-action: none; user-select: none; -webkit-user-select: none; }
  #miniOv[hidden] { display: none; }
  #miniOv .mst { position: relative; width: min(100vw, 520px); height: 100%; overflow: hidden; background: #f6efe0; }
  #miniOv canvas.mcv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  #miniOv .mpogo { position: absolute; pointer-events: none; transform-origin: 50% 100%; }
  #miniOv .mpogo .pa { width: 100%; height: 100%; }
  #miniOv .mhud { position: absolute; left: 0; right: 0; top: 0; padding: max(10px, env(safe-area-inset-top)) 12px 0; display: flex; align-items: center; gap: 8px; pointer-events: none; }
  #miniOv .mhud > * { pointer-events: auto; }
  #miniOv .mx { width: 42px; height: 42px; border-radius: 50%; border: 0; font-family: inherit; font-weight: 900; font-size: 24px; line-height: 1; color: #4a2a14; background: #fff8e6; box-shadow: 0 3px 0 #b8925e, 0 6px 14px rgba(0,0,0,.25); cursor: pointer; }
  #miniOv .mtitle { flex: 1; text-align: center; font-weight: 900; font-size: 17px; color: #4a2a14; background: rgba(255,248,230,.92); border-radius: 14px; padding: 8px 10px; box-shadow: 0 3px 0 #b8925e, 0 6px 14px rgba(0,0,0,.2); }
  #miniOv .mstat { min-width: 84px; text-align: center; font-weight: 900; font-size: 16px; color: #4a2a14; background: rgba(255,248,230,.92); border-radius: 14px; padding: 8px 10px; box-shadow: 0 3px 0 #b8925e, 0 6px 14px rgba(0,0,0,.2); }
  #miniOv .mstat:empty { visibility: hidden; }
  #miniOv .mbtns { position: absolute; left: 0; right: 0; bottom: max(18px, env(safe-area-inset-bottom)); display: flex; justify-content: center; gap: 10px; pointer-events: none; }
  #miniOv .mbtns .btn { pointer-events: auto; }
  #miniOv .msay { position: absolute; left: 50%; top: 18%; transform: translateX(-50%); white-space: nowrap; font-weight: 900; font-size: 26px; color: #fff8e6; text-shadow: 0 3px 0 #6a3a14, 0 0 18px rgba(0,0,0,.35); pointer-events: none; }
  #miniOv .mcard { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(70,52,34,.45); padding: 16px; }
  #miniOv .mcard[hidden] { display: none; }
  #miniOv .mcard .card { position: relative; }
  #miniOv .mcard p { margin: 8px 0 14px; }
  #miniOv .mprac { font-size: 13px; opacity: .85; margin-top: -6px !important; }
  #miniOv .mstars { display: flex; justify-content: center; gap: 6px; margin: 6px 0 10px; height: 60px; }
  #miniOv .mstars img { width: 56px; height: 56px; }
  #miniOv .mstars img.off { filter: grayscale(1) opacity(.35); }
  #miniOv .mgot { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin: 4px 0 12px; }
  #miniOv .mgot span { display: inline-flex; align-items: center; gap: 4px; font-weight: 900; font-size: 18px; background: rgba(255,248,230,.25); border-radius: 12px; padding: 6px 10px; }
  #miniOv .mgot i.ico { width: 26px; height: 26px; display: inline-block; }
  #miniOv .mbank { display: flex; justify-content: center; gap: 8px; margin-bottom: 6px; }
  #miniOv .mbank span { display: inline-flex; align-items: center; gap: 4px; font-weight: 900; font-size: 15px; background: rgba(0,0,0,.18); border-radius: 999px; padding: 4px 10px; }
  #miniOv .mbank i.ico { width: 20px; height: 20px; display: inline-block; }
  #miniOv .mflyi { position: absolute; width: 30px; height: 30px; pointer-events: none; z-index: 2; }
  #miniOv .mmeter { position: absolute; width: 14px; height: 90px; border-radius: 8px; background: rgba(255,248,230,.85); box-shadow: 0 0 0 3px #6a4426; overflow: hidden; pointer-events: none; }
  #miniOv .mmeter b { position: absolute; left: 0; right: 0; bottom: 0; background: linear-gradient(#ff7a1a, #ffc414); }
  .mpgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0 14px; }
  .mpgrid button { border: 0; border-radius: 16px; padding: 10px 6px 8px; font: inherit; font-weight: 900; font-size: 14px; color: #4a2a14; background: #fff8e6; box-shadow: 0 4px 0 #b8925e, 0 8px 16px rgba(0,0,0,.2); cursor: pointer; }
  .mpgrid img { display: block; width: 100%; height: 74px; object-fit: cover; border-radius: 10px; margin-bottom: 6px; }`;
  let ov = null, cv, X, pogoEl, hud, btns, cardEl, say, run = null;
  function build() { if (ov) return; const st = document.createElement("style"); st.id = "miniCss"; st.textContent = css; document.head.appendChild(st);
    ov = document.createElement("div"); ov.id = "miniOv"; ov.hidden = true; ov.innerHTML = `<div class="mst"><canvas class="mcv"></canvas><div class="mpogo"></div><div class="mhud"><button type="button" class="mx" aria-label="Close">×</button><div class="mtitle"></div><div class="mstat"></div></div><div class="msay"></div><div class="mbtns"></div><div class="mcard" hidden></div></div>`;
    document.body.appendChild(ov); cv = ov.querySelector("canvas"); X = cv.getContext("2d"); pogoEl = ov.querySelector(".mpogo"); hud = { title: ov.querySelector(".mtitle"), stat: ov.querySelector(".mstat") }; btns = ov.querySelector(".mbtns"); cardEl = ov.querySelector(".mcard"); say = ov.querySelector(".msay");
    ov.querySelector(".mx").addEventListener("click", () => run && run.quit());
    cv.addEventListener("pointerdown", (e) => { if (run && run.g.down) { e.preventDefault(); run.g.down(pt(e), e); } });
    cv.addEventListener("pointerup", (e) => { if (run && run.g.up) run.g.up(pt(e), e); }); cv.addEventListener("pointercancel", (e) => { if (run && run.g.up) run.g.up(pt(e), e); });
    addEventListener("resize", () => run && fit()); }
  // the page is laid out in the art's own units: VW x VH (780 x 1300, portrait), shown "cover" and anchored to the bottom
  const VW = 780, VH = 1300; let view = { s: 1, ox: 0, oy: 0, w: 0, h: 0, d: 1 };
  function fit() { const r = ov.querySelector(".mst").getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); const s = Math.max(r.width / VW, r.height / VH);
    view = { s, ox: (r.width - VW * s) / 2, oy: r.height - VH * s, w: r.width, h: r.height, d }; if (run && run.g.fit) run.g.fit(); }
  const pt = (e) => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left - view.ox) / view.s, y: (e.clientY - r.top - view.oy) / view.s, sx: e.clientX - r.left, sy: e.clientY - r.top }; };
  const toScreen = (x, y) => ({ x: view.ox + x * view.s, y: view.oy + y * view.s });
  // the top of the page in art units (what is under the HUD), so pieces can avoid it
  const topY = () => -view.oy / view.s;
  // the part of the page that is on screen, in art units (a phone shows less of the width than a wide window)
  const vis = () => ({ x0: Math.max(0, -view.ox / view.s), x1: Math.min(VW, (view.w - view.ox) / view.s), y0: Math.max(0, topY()), y1: VH });
  function pogo(name, x, y, h, then) { const p = toScreen(x, y), H = h * view.s, W = H * 400 / 440; pogoEl.style.cssText = `left:${(p.x - W / 2).toFixed(1)}px;top:${(p.y - H).toFixed(1)}px;width:${W.toFixed(1)}px;height:${H.toFixed(1)}px`;
    if (name) { if (!pogoEl.firstElementChild && typeof paHtml === "function") pogoEl.innerHTML = paHtml(name); const el = pogoEl.firstElementChild; if (el && typeof paPlay === "function") paPlay(el, name, then); } }
  function pogoMove(x, y, h, sq, a) { const p = toScreen(x, y), H = h * view.s, W = H * 400 / 440; pogoEl.style.left = (p.x - W / 2).toFixed(1) + "px"; pogoEl.style.top = (p.y - H).toFixed(1) + "px"; pogoEl.style.width = W.toFixed(1) + "px"; pogoEl.style.height = H.toFixed(1) + "px"; pogoEl.style.transform = sq && sq !== 1 ? `scale(${(2 - sq).toFixed(3)}, ${sq.toFixed(3)})` : ""; pogoEl.style.opacity = a === undefined ? "" : a; }
  // a reaction, then back to idling (the rig's one-shot clips end on their last pose)
  function pogoAct(name, then) { const el = pogoEl.firstElementChild; if (!el || typeof paPlay !== "function") return; const loopOK = name === "idle" || name === "worry" || name === "dash"; paPlay(el, name, then || (loopOK || name === "sad" || name === "win" ? null : () => { if (run && el.isConnected) paPlay(el, "idle"); })); }
  let sayT = 0; function shout(t, ms) { say.textContent = t; clearTimeout(sayT); const k = typeof KF === "function" ? KF("toast") : null; if (k && say.animate) say.animate(k.frames, { duration: k.duration }); say.style.opacity = 1; sayT = setTimeout(() => { say.style.opacity = 0; }, ms || 1100); }
  const sfx = (k, ...a) => { try { if (typeof SFX === "object" && SFX[k]) SFX[k](...a); } catch (e) {} }, hap = (p) => { try { if (typeof buzz === "function") buzz(p); } catch (e) {} };
  function setBtns(list) { btns.innerHTML = ""; for (const [label, fn, ghost] of list) { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (ghost ? " ghost" : ""); b.textContent = T(label); b.addEventListener("click", fn); btns.appendChild(b); } }

  // ---------------------------------------------------------------- the frame loop (only while a game is open, and not while the page is hidden)
  let raf = 0, last = 0;
  function loop(now) { raf = 0; if (!run) return; if (document.hidden) { last = 0; raf = requestAnimationFrame(loop); return; } const dt = last ? Math.min(50, now - last) : 16.7; last = now; run.t += dt;
    const x = X; x.setTransform(view.d, 0, 0, view.d, 0, 0); x.clearRect(0, 0, view.w, view.h); x.save(); x.translate(view.ox, view.oy); x.scale(view.s, view.s); run.g.draw(x, run.t, dt); x.restore();
    for (let i = run.fx.length - 1; i >= 0; i--) { const f = run.fx[i]; f.t += dt; if (f.draw(x, f.t) === false) run.fx.splice(i, 1); }
    if (run) raf = requestAnimationFrame(loop); }
  const start = () => { last = 0; if (!raf) raf = requestAnimationFrame(loop); };

  // ---------------------------------------------------------------- the games. Each returns { draw, down?, up?, fit?, score(), tier(), begin() }
  const GAMES = {};
  const tierOf = (name, score) => { const n = MINI_REWARD.need[name]; return score >= n[2] ? 3 : score >= n[1] ? 2 : score >= n[0] ? 1 : 0; };

  // ---- Carrot Patch
  GAMES.carrots = (A, end) => {
    const HOLES = [], rows = [730, 900, 1070]; for (const y of rows) for (let c = 0; c < 3; c++) HOLES.push({ c, x: 0, y, kind: "carrot", t: -1 });
    let HW = 200, PX = 690; const lay = () => { const v = vis(), cx = (v.x0 + v.x1) / 2, sp = Math.min(215, (v.x1 - v.x0) * .32); HW = Math.min(200, sp * .9); for (const h of HOLES) h.x = cx + (h.c - 1) * sp; PX = v.x1 - 70; };
    const bag = ["mole", "gold"].concat(Array(7).fill("carrot")); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } HOLES.forEach((h, i) => { h.kind = bag[i]; });
    let got = 0, over = false, busy = 0, clods = [];
    const stat = () => { hud.stat.textContent = "🥕 " + got; };
    const o = { k: {} };
    return {
      begin() { lay(); stat(); pogo("idle", PX, 640, 170); setBtns([["Keep", () => { if (!over && !busy) finish(false); }]]); },
      fit() { lay(); pogo(null, PX, 640, 170); },
      score: () => got, tier: () => tierOf("carrots", got), peek: () => HOLES.map(h => ({ x: h.x, y: h.y, kind: h.kind, open: h.t >= 0 })),
      down(p) { if (over || busy) return; const h = HOLES.find(q => q.t < 0 && Math.abs(q.x - p.x) < HW * .5 && Math.abs(q.y - p.y) < 85); if (!h) return; h.t = run.t; busy = 1; sfx("swap"); hap(10);
        for (let i = 0; i < 4; i++) clods.push({ x: h.x, y: h.y - 10, dx: (i - 1.5) * 50 + (Math.random() - .5) * 20, dy: 70 + Math.random() * 30, t0: run.t + (h.kind === "mole" ? 0 : 380) });
        if (h.kind === "mole") { setTimeout(() => { sfx("bad"); hap([30, 40, 30]); shout(T("The mole!"), 1400); pogoAct("sad"); }, 260); setTimeout(() => { got = Math.floor(got / 2); stat(); finish(true); }, 1500); return; }
        setTimeout(() => { got += h.kind === "gold" ? 2 : 1; stat(); sfx("pop", got + 2); h.fly = run.t; busy = 0; if (h.kind === "gold") { shout("+2", 800); pogoAct("yay"); } else if (got % 3 === 0) pogoAct("nice");
          if (HOLES.every(q => q.t >= 0 || q.kind === "mole")) { shout(T("All carrots out!"), 1400); pogoAct("win"); setTimeout(() => finish(false), 1300); } }, KLEN("pull") - 200); },
      draw(x, t) {
        x.drawImage(A["bg-field"], 0, 0, VW, VH);
        for (const h of HOLES) { spr(x, A, "hole", 0, h.x, h.y, HW);
          if (h.t >= 0) { const e = t - h.t;
            x.save(); x.beginPath(); x.rect(h.x - 150, h.y - 400, 300, 404); x.clip();
            if (h.kind === "mole") { K("mole", e, o.k); const f = e < 600 ? 0 : e < 700 ? 1 : e < 820 ? 2 : e < 900 ? 0 : 3 + Math.floor((e - 900) / 110) % 4; const mw = HW * .95, mh = mw * 230 / 220, rise = -o.k.y / .7; spr(x, A, "mole", f, h.x, h.y + 30 + (1 - rise) * mh * .9, mw, { sy: o.k.sy, oy: 1 }); }
            else if (!h.fly || t - h.fly < 60) { K("pull", e, o.k); const w = HW * .6; spr(x, A, h.kind === "gold" ? "gcarrot" : "carrot", 0, h.x, h.y + 120 + o.k.y * 250, w, { r: o.k.r, sx: o.k.sx, sy: o.k.sy, oy: .62 }); }
            x.restore(); }
          spr(x, A, "lip", 0, h.x, h.y, HW);
          if (h.fly) { const e = t - h.fly; if (e < KLEN("fly")) { K("fly", e, o.k); const tx = vis().x1 - 60, ty = topY() + 50, d = Math.hypot(tx - h.x, ty - h.y), px = h.x + (tx - h.x) * o.k.p, py = h.y - 130 + (ty - h.y + 130) * o.k.p - d * o.k.h * .5; spr(x, A, h.kind === "gold" ? "gcarrot" : "carrot", 0, px, py, 110 * o.k.s, { r: o.k.r + .4, a: o.k.a }); } } }
        for (let i = clods.length - 1; i >= 0; i--) { const c = clods[i], e = t - c.t0; if (e < 0) continue; if (e > KLEN("clod")) { clods.splice(i, 1); continue; } K("clod", e, o.k); x.globalAlpha = o.k.a; x.fillStyle = "#6a4426"; x.beginPath(); x.ellipse(c.x + c.dx * o.k.x, c.y - 30 + c.dy * o.k.y, 9, 7, 0, 0, 6.2832); x.fill(); x.globalAlpha = 1; } }
    };
    function finish(mole) { if (over) return; over = true; setBtns([]); if (mole) shout(T("He took half."), 1200); setTimeout(() => end(), mole ? 900 : 300); }
  };

  // ---- Firefly Catch
  // flight paths: four hand-set loops of control points over the meadow, closed Catmull-Rom curves; each firefly runs one, offset and at its own pace
  const PATHS = [[[120, 420], [300, 300], [520, 380], [640, 560], [470, 700], [250, 640]], [[650, 300], [520, 520], [330, 480], [180, 640], [360, 820], [600, 700]], [[200, 900], [380, 700], [600, 820], [680, 1000], [430, 1080], [260, 1040]], [[400, 260], [640, 420], [560, 640], [380, 560], [160, 500], [230, 330]]];
  const cr = (P, u) => { const n = P.length, f = ((u % 1) + 1) % 1 * n, i = Math.floor(f), t = f - i, p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n], q = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); return [q(p0[0], p1[0], p2[0], p3[0]), q(p0[1], p1[1], p2[1], p3[1])]; };
  GAMES.fireflies = (A, end) => {
    const LEN = 15000, flies = [], misses = [], jar = { x: 250, y: 1150 }; let caught = 0, over = false, t0 = -1, next = 0, glow = 0;
    const o = { k: {} }, spawn = (t) => { const P = PATHS[Math.floor(Math.random() * PATHS.length)]; flies.push({ P, u: Math.random(), sp: (.05 + Math.random() * .05) * (Math.random() < .5 ? 1 : -1), ph: Math.random() * 8, born: t, jit: [(Math.random() - .5) * 120, (Math.random() - .5) * 120] }); };
    const stat = (t) => { const left = Math.max(0, Math.ceil((LEN - (t0 < 0 ? 0 : t - t0)) / 1000)); hud.stat.textContent = "✨ " + caught + " · " + left + "s"; };
    return {
      peek() { const f = flies.find(q => !q.got && q.x > vis().x0 + 30 && q.x < vis().x1 - 30 && q.y > topY() + 120); return f ? [f.x, f.y] : null; },
      begin() { t0 = run.t; for (let i = 0; i < 5; i++) spawn(run.t); stat(run.t); pogo("idle", 500, 1210, 170); setBtns([]); },
      fit() { pogo(null, 500, 1210, 170); }, score: () => caught, tier: () => tierOf("fireflies", caught),
      down(p) { if (over) return; let best = null, bd = 90; for (const f of flies) { if (f.got) continue; const d = Math.hypot(f.x - p.x, f.y - p.y); if (d < bd) { bd = d; best = f; } }
        if (!best) { misses.push({ x: p.x, y: p.y, t: run.t }); return; } best.got = run.t; best.gx = best.x; best.gy = best.y; caught++; sfx("pop", Math.min(14, caught)); hap(8); stat(run.t); if (caught % 5 === 0) pogoAct("clap"); },
      draw(x, t, dt) {
        x.drawImage(A["bg-night"], 0, 0, VW, VH);
        if (!over && t0 >= 0) { if (t - t0 >= LEN) { over = true; shout(T("Time!"), 1200); pogoAct(caught >= MINI_REWARD.need.fireflies[1] ? "win" : "nice"); setTimeout(() => end(), 1300); }
          if (flies.filter(f => !f.got).length < 6 && t >= next) { spawn(t); next = t + 380 + Math.random() * 500; } if (Math.floor(t / 250) !== Math.floor((t - dt) / 250)) stat(t); }
        // the jar's glow grows with the catch
        glow += ((Math.min(1, caught / 22)) - glow) * Math.min(1, dt / 300); const jx = jar.x, jy = jar.y;
        if (glow > .01) { const g = x.createRadialGradient(jx, jy - 110, 10, jx, jy - 110, 230); g.addColorStop(0, `rgba(240,255,150,${.55 * glow})`); g.addColorStop(1, "rgba(240,255,150,0)"); x.fillStyle = g; x.fillRect(jx - 240, jy - 340, 480, 460); }
        spr(x, A, "jar", 0, jx, jy - 120, 200);
        for (let i = 0; i < Math.min(caught, 24); i++) { const a = i * 2.4 + t / 900, r = 14 + (i % 4) * 14, fx = jx + Math.cos(a) * r * 1.4, fy = jy - 90 + Math.sin(a * 1.3) * r; x.fillStyle = `rgba(250,255,170,${.7 + .3 * Math.sin(t / 200 + i)})`; x.beginPath(); x.arc(fx, fy, 5, 0, 6.2832); x.fill(); }
        for (let i = flies.length - 1; i >= 0; i--) { const f = flies[i];
          if (f.got) { const e = t - f.got; if (e > KLEN("fly")) { flies.splice(i, 1); continue; } K("fly", e, o.k); const tx = jx, ty = jy - 110, d = Math.hypot(tx - f.gx, ty - f.gy); spr(x, A, "fly", t / 42, f.gx + (tx - f.gx) * o.k.p, f.gy + (ty - f.gy) * o.k.p - d * o.k.h * .4, 96 * o.k.s, { a: o.k.a }); continue; }
          f.u += f.sp * dt / 1000; const [px, py] = cr(f.P, f.u), w = Math.sin(t / 700 + f.ph); f.x = px + f.jit[0] * w; f.y = py + f.jit[1] * Math.cos(t / 900 + f.ph); const fade = Math.min(1, (t - f.born) / 400);
          spr(x, A, "fly", t / 42 + f.ph * 3, f.x, f.y, 100, { a: fade }); }
        for (let i = misses.length - 1; i >= 0; i--) { const m = misses[i], e = t - m.t; if (e > KLEN("miss")) { misses.splice(i, 1); continue; } K("miss", e, o.k); x.strokeStyle = `rgba(255,250,220,${o.k.a})`; x.lineWidth = 4; x.beginPath(); x.arc(m.x, m.y, 40 * o.k.s, 0, 6.2832); x.stroke(); } }
    };
  };

  // ---- Lily Hop
  GAMES.lilypads = (A, end) => {
    const WY = 900, D = 420, GOAL = 12, pads = [{ x: 200, v: 0, w: 250 }]; for (let i = 1; i <= GOAL; i++) { const gap = 190 + Math.random() * 190 + i * 4; pads.push({ x: pads[i - 1].x + gap, v: i === GOAL ? 1 : Math.floor(Math.random() * 3) === 1 ? 2 : Math.floor(Math.random() * 2) * 2, w: i === GOAL ? 300 : 230 - Math.min(60, i * 4), bob: -1 }); }
    const reeds = []; for (let i = 0; i < 9; i++) reeds.push({ x: 100 + i * 520 + Math.random() * 200, v: i % 2, y: WY - 40 - Math.random() * 30 });
    let at = 0, cam = 0, hold = -1, jump = null, over = false, sunk = null; const o = { k: {} }, PH = 190;
    const meter = document.createElement("div"); meter.className = "mmeter"; meter.innerHTML = "<b></b>"; meter.style.display = "none"; ov.querySelector(".mst").appendChild(meter);
    const stat = () => { hud.stat.textContent = T("Pads {0}/12", at); };
    const power = (ms) => { const c = ms % 2200, u = c < 1100 ? c / 1100 : 2 - c / 1100; return Math.max(.08, u); };   // up to full in 1.1 s, then back down: holding on is no free win
    const camX = () => pads[at].x - (vis().x0 + 120);
    return {
      begin() { stat(); cam = camX(); pogo("idle", pads[0].x - cam, WY - 10, PH); setBtns([]); },
      fit() {}, score: () => at, tier: () => tierOf("lilypads", at),
      peek() { if (over || jump || at >= GOAL) return null; const pw = (pads[at + 1].x - pads[at].x) / D; return Math.round(Math.max(.08, pw) * 1100); },
      down() { if (over || jump || sunk) return; hold = run.t; pogoAct("ready"); meter.style.display = ""; },
      up() { if (hold < 0 || over || jump) return; const pw = power(run.t - hold); hold = -1; meter.style.display = "none"; const from = pads[at].x, dist = D * pw, to = from + dist, nx = pads[at + 1];
        const ok = Math.abs(to - nx.x) <= nx.w * .42; jump = { t0: run.t, from, to: ok ? nx.x + (to - nx.x) * .35 : to, ok, h: 120 + dist * .45 }; sfx("swap"); pogoAct(typeof paLive === "function" && paLive() ? "leap" : "yay", () => {}); },   // the keyed leap (pogo-anim.js); a phone without WebGL has only the baked sheets, so it cheers instead
      draw(x, t, dt) {
        cam += (camX() - cam) * Math.min(1, dt / 260);
        // the far bank and the water scroll at a third of the pads' pace; the page tiles every 1560 units
        const bw = 1560, bx = -((cam * .35) % bw + bw) % bw; x.drawImage(A["bg-pond"], bx, 0, bw, VH); x.drawImage(A["bg-pond"], bx + bw, 0, bw, VH);
        for (const r of reeds) { const sx = r.x - cam * .8; if (sx > -200 && sx < VW + 200) spr(x, A, "reeds" + r.v, 0, sx, r.y - 150, 150); }
        let px = pads[at].x, py = WY - 10, sq = 1, alpha = 1;
        if (hold >= 0) { const pw = power(t - hold); sq = K("crouch", pw * 1000, o.k).sq; const p = toScreen(pads[at].x - cam + 70, WY - 170); meter.style.left = p.x + "px"; meter.style.top = (p.y - 90 * view.s) + "px"; meter.style.height = (90 * Math.min(1, view.s * 2)) + "px"; meter.firstElementChild.style.height = (pw * 100).toFixed(1) + "%"; }
        for (let i = 0; i < pads.length; i++) { const P = pads[i], sx = P.x - cam; if (sx < -300 || sx > VW + 300) continue; let by = 0;
          if (P.bob >= 0) { const e = t - P.bob; if (e < KLEN("padBob")) by = K("padBob", e, o.k).y; if (e < 8 * 50) spr(x, A, "ripple", Math.floor(e / 50), sx, WY + 22, P.w * 1.25); }
          spr(x, A, "pad" + P.v, 0, sx, WY + by, P.w * 1.3); if (i === GOAL) { spr(x, A, "star", 0, sx + 60, WY - 40 + Math.sin(t / 300) * 6, 70); } }
        if (jump) { const e = t - jump.t0, L = KLEN("hop"); K("hop", Math.min(e, L), o.k); px = jump.from + (jump.to - jump.from) * o.k.p; py = WY - 10 - jump.h * o.k.h; sq = o.k.sq;
          if (!jump.ok && e >= L) { // past the pad: down into the water
            const e2 = e - L; K("sink", e2, o.k); py = WY - 10 + 120 * o.k.y; alpha = o.k.a; if (!jump.sp) { jump.sp = t; sfx("bad"); hap([30, 40]); shout(T("Splash!"), 1200); pogoAct("sad"); }
            const se = t - jump.sp; if (se < 10 * 50) spr(x, A, "splash", Math.floor(se / 50), jump.to - cam, WY + 10, 260);
            if (e2 > KLEN("sink") + 600 && !over) { over = true; setTimeout(() => end(), 400); } }
          else if (jump.ok && e >= L) { at++; pads[at].bob = t; jump = null; stat(); sfx("pop", Math.min(14, at + 2)); hap(10); jumpLand = t;
            if (at >= GOAL) { over = true; shout(T("The far bank!"), 1500); pogoAct("win"); setTimeout(() => end(), 1600); } else if (at % 4 === 0) pogoAct("yay"); else pogoAct("idle"); } }
        if (jumpLand >= 0 && !jump && t - jumpLand < KLEN("land")) sq = K("land", t - jumpLand, o.k).sq;
        pogoMove(px - cam, py + (pads[at] && !jump && pads[at].bob >= 0 && t - pads[at].bob < KLEN("padBob") ? K("padBob", t - pads[at].bob, o.k).y : 0), PH, sq, alpha);
      },
      done() { meter.remove(); }
    };
  };
  let jumpLand = -1;

  // ---- Mordo's Nests
  GAMES.nests = (A, end) => {
    const BY = 760, SLOT = [200, 390, 580], place = () => { const v = vis(), cx = (v.x0 + v.x1) / 2, sp = Math.min(200, (v.x1 - v.x0) * .31); SLOT[0] = cx - sp; SLOT[1] = cx; SLOT[2] = cx + sp; }, nests = [0, 1, 2].map(i => ({ s: i, x: SLOT[i], y: BY, lift: -1 })), o = { k: {}, m: {} };
    let round = 1, correct = 0, phase = "intro", holder = null, swaps = [], pick = -1, mordo = null, charm = null, over = false;
    const stat = () => { hud.stat.textContent = T("Round {0}/3", round); };
    const SPEED = [1.0, .78, .6], COUNT = [4, 6, 8];
    function deal() { phase = "drop"; pick = -1; nests.forEach(q => { q.x = SLOT[q.s]; q.y = BY; q.lift = -1; }); const n = holder = nests[Math.floor(Math.random() * 3)]; mordo = { from: [900, topY() + 160], to: [n.x + 30, BY - 330], t0: run.t }; charm = { x: n.x, y0: BY - 300, y1: BY - 40, t0: run.t + 900 }; shout(T("Watch the charm…"), 1100);
      setTimeout(() => { sfx("pop", 4); phase = "show"; }, 1450); setTimeout(() => { phase = "shuffle"; shuffle(); }, 2300); }
    function shuffle() { const sp = SPEED[round - 1], n = COUNT[round - 1]; let t = run.t; swaps = []; for (let i = 0; i < n; i++) { const a = Math.floor(Math.random() * 3); let b = (a + 1 + Math.floor(Math.random() * 2)) % 3; swaps.push({ a, b, t0: t, len: KLEN("swap") * sp }); t += KLEN("swap") * sp + 60; }
      setTimeout(() => { settle(); phase = "pick"; shout(T("Which nest?"), 1000); }, t - run.t + 100); }
    // any swap the frames did not finish (a slow or hidden page) is finished here, so every nest stands on its place before the pick
    function settle() { for (const s of swaps) if (!s.done) { s.done = 1; const A1 = nests.find(q => q.s === s.a), B1 = nests.find(q => q.s === s.b); A1.s = s.b; B1.s = s.a; } nests.forEach(q => { q.x = SLOT[q.s]; q.y = BY; q.sc = 1; }); }
    return {
      begin() { place(); stat(); pogo("idle", vis().x1 - 110, 1150, 180); setBtns([]); deal(); },
      fit() { place(); if (phase === "pick" || phase === "choice" || phase === "show") nests.forEach(q => { q.x = SLOT[q.s]; }); pogo(null, vis().x1 - 110, 1150, 180); }, score: () => correct, tier: () => tierOf("nests", correct),
      peek() { const w = nests.find(q => q !== holder); return { phase, right: [holder ? holder.x : 0, BY], wrong: [w.x, BY] }; },
      down(p) { if (phase !== "pick" || over) return; const n = nests.find(q => Math.abs(q.x - p.x) < 110 && Math.abs(q.y - 20 - p.y) < 110); if (!n) return; phase = "peek"; pick = n.s; n.lift = run.t; sfx("swap");
        const hit = n === holder; setTimeout(() => { if (hit) { correct++; sfx("reward"); hap([20, 30]); shout(T("Found it!"), 1100); pogoAct("yay"); }
          else { sfx("bad"); hap([30, 40, 30]); shout(T("Not there…"), 1100); pogoAct("sad"); holder.lift = run.t; } }, 340);
        setTimeout(() => { if (!hit) { correct = Math.floor(correct / 2); return finish(); } if (round >= 3) return finish(); phase = "choice"; setBtns([["Keep", () => finish(), true], ["Next round", () => { setBtns([]); round++; stat(); deal(); }]]); }, 1500); },
      draw(x, t) {
        x.drawImage(A["bg-tree"], 0, 0, VW, VH);
        // the shuffle: each swap moves two nests between their places, one over the other
        if (phase === "shuffle") { for (const s of swaps) { const e = t - s.t0; if (e < 0 || e > s.len + 1) { continue; } const u = Math.min(s.len, e) / (s.len / KLEN("swap")); K("swap", u, o.k);
            const A1 = nests.find(q => q.s === s.a), B1 = nests.find(q => q.s === s.b), xa = SLOT[s.a], xb = SLOT[s.b]; A1.x = xa + (xb - xa) * o.k.p; A1.y = BY - 90 * o.k.h; B1.x = xb + (xa - xb) * o.k.p; B1.y = BY + 30 * o.k.h; A1.sc = o.k.s;
            if (e >= s.len && !s.done) { s.done = 1; A1.s = s.b; B1.s = s.a; A1.y = B1.y = BY; A1.x = SLOT[A1.s]; B1.x = SLOT[B1.s]; sfx("tick"); } } }
        const drawN = (n, back) => { let lx = 0, ly = 0, r = 0; if (n.lift >= 0) { K("peek", t - n.lift, o.k); ly = o.k.y; r = o.k.r; }
          if (back) spr(x, A, "nestB", 0, n.x + lx, n.y - 10 + ly, Math.min(230, (SLOT[1] - SLOT[0]) * 1.06), { r });   /* the whole nest lifts and tips; the charm stays on the branch */
          else spr(x, A, "nestF", 0, n.x + lx, n.y + ly, Math.min(250, (SLOT[1] - SLOT[0]) * 1.15), { r }); };
        const order = nests.slice().sort((a, b) => a.y - b.y);
        for (const n of order) { drawN(n, true);
          const showCharm = n === holder && (phase === "show" || phase === "drop" && charm && t >= charm.t0 + KLEN("drop") || n.lift >= 0);
          if (showCharm) { x.drawImage(A.charm, n.x - 50, n.y - 92, 100, 100); }
          else if (phase === "drop" && charm && n === holder && t >= charm.t0) { K("drop", t - charm.t0, o.k); x.save(); x.translate(n.x, charm.y0 + (charm.y1 - charm.y0) * o.k.y); x.rotate(o.k.r); x.drawImage(A.charm, -50, -50, 100, 100); x.restore(); }
          drawN(n, false); }
        // Mordo: flies in with the charm, lets it go, then hovers over the branch and watches
        if (mordo && A.mag) { const e = t - mordo.t0, u = Math.min(1, e / 900), k = 1 - (1 - u) ** 3, mx = mordo.from[0] + (mordo.to[0] - mordo.from[0]) * k, my = mordo.from[1] + (mordo.to[1] - mordo.from[1]) * k + Math.sin(t / 300) * 10;
          const hx = phase === "drop" ? mx : vis().x1 - 150 + Math.sin(t / 900) * 30, hy = phase === "drop" ? my : topY() + 210 + Math.sin(t / 400) * 12, f = Math.floor(t * .06) % 96;
          mordo.cur = [phase === "drop" ? hx : (mordo.cur ? mordo.cur[0] + (hx - mordo.cur[0]) * .05 : hx), phase === "drop" ? hy : (mordo.cur ? mordo.cur[1] + (hy - mordo.cur[1]) * .05 : hy)];
          x.save(); x.translate(mordo.cur[0], mordo.cur[1]); if (phase !== "drop") x.scale(-1, 1); x.drawImage(A.mag, (f % 16) * 176, Math.floor(f / 16) * 176, 176, 176, -110, -110, 220, 220); x.restore();
          if (phase === "drop" && charm && t < charm.t0) x.drawImage(A.charm, mordo.cur[0] - 30, mordo.cur[1] + 30, 70, 70); } }
    };
    function finish() { if (over) return; over = true; setBtns([]); setTimeout(() => end(), 500); }
  };

  // ---------------------------------------------------------------- cards: the rules before, the reward after
  const ICON = (k) => { let svg = ""; try { svg = (typeof ICO === "object" && ICO[k]) || (typeof BICON === "object" && BICON[k]) || ""; } catch (e) {} return `<i class="ico">${svg}</i>`; };
  const TITLE = { carrots: "Carrot Patch", fireflies: "Firefly Catch", lilypads: "Lily Hop", nests: "Mordo's Nests" };
  const RULE = { carrots: "Pull carrots from the holes. One hole hides the mole: he takes half. Stop with Keep whenever you like.", fireflies: "Tap the fireflies to catch them in the jar. You have 15 seconds.", lilypads: "Hold to crouch, let go to jump. Land on the next pad. Twelve pads to the far bank.", nests: "Mordo hides a charm in a nest and shuffles them. Find it three times. A miss keeps half of what you won." };
  function card(html) { cardEl.innerHTML = `<div class="card">${html}</div>`; cardEl.hidden = false; return cardEl.firstElementChild; }
  function intro(name, practice) { return new Promise((res) => { const c = card(`<h2>${T(TITLE[name])}</h2><p>${T(RULE[name])}</p>${practice ? `<p class="mprac">${T("Practice: no rewards")}</p>` : ""}<button class="btn" type="button">${T("Play")}</button>`); c.querySelector("button").addEventListener("click", () => { cardEl.hidden = true; res(); }); }); }
  // what a tier pays (as counts on the card), then into the save when it is paid
  function payout(name, tier, practice) { const R0 = MINI_REWARD.tiers[tier] || {}, out = { stars: R0.stars || 0, carrots: R0.carrots || 0, boost: {} };
    if (R0.boost) { const pool = MINI_REWARD.boosters, k = pool[Math.floor(Math.random() * pool.length)]; out.boost[k] = R0.boost; }
    if (practice || typeof save !== "object" || !save) return { stars: 0, carrots: 0, boost: {}, would: out };   // practice: nothing is paid (what it would have been is kept for the card)
    if (out.stars) save.starBonus = (save.starBonus || 0) + out.stars;
    for (const k in out.boost) { const before = save.boost[k] || 0; save.boost[k] = before + out.boost[k]; out.boost[k] = (save.boost[k] || 0) - before; }   // the save's booster multiplier applies: report what really landed
    if (out.carrots) { const n = (typeof RWM === "number" ? RWM : 1) * out.carrots; save.carrots = (save.carrots || 0) + n; out.carrots = n; try { carrotNew += n; } catch (e) {} }
    try { persist(); } catch (e) {} try { const s = document.getElementById("starsTotal"); if (s && typeof starsFree === "function") s.textContent = Math.max(0, starsFree()); const c = document.getElementById("carrots"); if (c) c.textContent = save.carrots || 0; } catch (e) {}
    return out; }
  const BN = { hammer: "Woodpecker", moves: "+10 Moves", switch: "Free Switch", cross: "Cross Blast", undo: "Undo" }, BICO = { hammer: "hammer", moves: "moves", switch: "switch", cross: "cross", undo: "undo" };   // booster icons are the tray's own (BICON)
  function result(name, tier, out, practice) { return new Promise((res) => {
    const head = tier >= 3 ? "Perfect!" : tier === 2 ? "Great run!" : tier === 1 ? "Well played!" : "No reward this time.", starSrc = "anim/mini-star.webp" + Q;
    const items = []; if (out.stars) items.push(["star", "+" + out.stars, "s"]); if (out.carrots) items.push(["carrot", "+" + out.carrots, "c"]); for (const k in out.boost) items.push([BICO[k], "+" + out.boost[k] + " " + T(BN[k]), "b"]);
    const bank = typeof save === "object" && save && !practice ? `<div class="mbank"><span data-b="s">${ICON("star")}<b>${typeof starsFree === "function" ? Math.max(0, starsFree() - (out.stars || 0)) : ""}</b></span><span data-b="c">${ICON("carrot")}<b>${(save.carrots || 0) - (out.carrots || 0)}</b></span></div>` : "";
    const c = card(`${bank}<h2>${T(head)}</h2><div class="mstars">${[0, 1, 2].map(i => `<img src="${starSrc}" class="${i < tier ? "" : "off"}" alt="">`).join("")}</div>${practice ? `<p class="mprac">${T("Practice: no rewards")}</p>` : items.length ? `<div class="mgot">${items.map(([i, t2, k]) => `<span data-k="${k}">${ICON(i)}${t2}</span>`).join("")}</div>` : ""}<button class="btn" type="button">${T(practice || !items.length ? "Close" : "Collect")}</button>`);
    c.querySelectorAll(".mstars img").forEach((im, i) => { if (i >= tier || !im.animate) return; const fr = MK.star.map(([ms, v, e], j, a) => Object.assign({ offset: ms / a.at(-1)[0], opacity: v.a, transform: `scale(${v.s}) rotate(${(v.r * 57).toFixed(1)}deg)` }, a[j + 1] ? { easing: a[j + 1][2] } : {})); im.style.opacity = 0; setTimeout(() => { im.style.opacity = ""; im.animate(fr, { duration: KLEN("star") }); sfx("pop", 6 + i * 3); }, 250 + i * 260); });
    const btn = c.querySelector("button"); let done = false;
    btn.addEventListener("click", () => { if (done) return; done = true; if (practice || !items.length || !window.UI_KEYS) { res(); return; }
      // the icons leave the card for the counters at its top, one after another, and the counters count up as they land
      const host = ov.querySelector(".mst"), hr = host.getBoundingClientRect(); let last = 0;
      c.querySelectorAll(".mgot span").forEach((sp, i) => { const kind = sp.dataset.k, tgt = c.querySelector(`.mbank [data-b="${kind === "b" ? "s" : kind}"]`) || c.querySelector(".mbank"), a = sp.querySelector("i").getBoundingClientRect(), b = tgt ? tgt.getBoundingClientRect() : a;
        const f = document.createElement("i"); f.className = "ico mflyi"; f.innerHTML = sp.querySelector("i").innerHTML; f.style.left = (a.left - hr.left) + "px"; f.style.top = (a.top - hr.top) + "px"; host.appendChild(f);
        const k = UI_KEYS.path("flyIcon", b.left - a.left, b.top - a.top); setTimeout(() => { const an = f.animate(k.frames, { duration: k.duration, fill: "forwards" }); an.onfinish = () => { f.remove(); if (tgt && kind !== "b") { const v = tgt.querySelector("b"); v.textContent = kind === "s" ? Math.max(0, starsFree()) : save.carrots || 0; } if (tgt && window.bump) bump(tgt); sfx("pop", 8 + i); }; }, i * 160); last = i * 160 + k.duration; });
      sfx("reward"); setTimeout(res, last + 350); }); }); }

  // ---------------------------------------------------------------- open
  async function open(name, opts = {}) { if (!GAMES[name]) throw new Error("no side game " + name); if (run) return run.promise; build(); const practice = !opts.reward;
    let resolve; const promise = new Promise(r => { resolve = r; }); run = { promise, t: 0, fx: [], g: { draw() {} }, quit: () => {} };
    ov.hidden = false; document.documentElement.classList.add("minigame"); hud.title.textContent = T(TITLE[name]); hud.stat.textContent = ""; say.style.opacity = 0; pogoEl.innerHTML = ""; pogoEl.style.cssText = ""; setBtns([]); fit();
    const A = await loadArt(name); let ended = false;
    const finish = async (quit) => { if (ended) return; ended = true; const g = run.g, score = quit ? 0 : g.score(), tier = quit ? 0 : g.tier(); if (g.done) g.done(); setBtns([]);
      const out = payout(name, tier, practice || quit); if (!quit) await result(name, tier, out, practice); close(); resolve({ reward: { game: name, tier, score, practice, stars: out.stars, carrots: out.carrots, boost: out.boost, quit: !!quit } }); };
    run.quit = () => finish(true);
    // the page is drawn behind the rules card; the game starts when Play is pressed
    run.g = GAMES[name](A, () => finish(false)); fit(); start();
    if (!opts.skipIntro) await intro(name, practice); if (ended) return promise; run.g.begin(); fit(); if (run.g.fit) run.g.fit();
    return promise; }
  function close() { if (!ov) return; ov.hidden = true; cardEl.hidden = true; pogoEl.innerHTML = ""; document.documentElement.classList.remove("minigame"); if (raf) cancelAnimationFrame(raf); raf = 0; run = null; jumpLand = -1; ov.querySelectorAll(".mmeter,.mflyi").forEach(e => e.remove()); }

  // ---------------------------------------------------------------- the playground (practice; the reward path is MINI.open(name, { reward: true }))
  function playground() { build(); const host = document.createElement("div"); host.className = "modal"; host.id = "mPlay";
    host.innerHTML = `<div class="card"><h2>${T("Playground")}</h2><p style="font-size:14px">${T("Short games with Pogo. In the playground they are practice, no rewards.")}</p><div class="mpgrid">${Object.keys(TITLE).map(k => `<button type="button" data-g="${k}"><img src="anim/mini-${{ carrots: "bg-field", fireflies: "bg-night", lilypads: "bg-pond", nests: "bg-tree" }[k]}.webp${Q}" alt="">${T(TITLE[k])}</button>`).join("")}</div><button class="btn ghost" type="button" data-x>${T("Close")}</button></div>`;
    document.body.appendChild(host); const shut = () => host.remove();
    host.addEventListener("click", (e) => { const b = e.target.closest("[data-g]"); if (b) { shut(); open(b.dataset.g, { reward: false }); return; } if (e.target.closest("[data-x]") || e.target === host) shut(); }); }

  window.MINI = { open, close, playground, games: Object.keys(GAMES), get running() { return !!run; }, keys: MK, sample: K, reward: MINI_REWARD };
  // test hook: open a game straight into play, read its state, poke it
  for (const k of ["carrot", "fly", "lily", "nest"]) window["__" + k + "Peek"] = () => run && run.g.peek ? run.g.peek() : null;
  window.__mini = { open: (n, o) => open(n, Object.assign({ skipIntro: true }, o)), get run() { return run; }, view: () => view, toScreen, tierOf };
})();
