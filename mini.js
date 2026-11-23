// Charmfall side games (2026-11-05, İdris: "yan oyunlar veya ödüller için kısa oyunlar ekle"; he picked all four). Each has two mechanics. 2026-11-23:
// the world is ten kingdoms and every game takes the look of the kingdom it is played in (KT and KW below: one row of pictures and one of words per
// kingdom): the kingdom a boss's chest was opened in, or the one the player has reached. MINI_REWARD pays the same everywhere. The names MINI.open
// takes are the old ones (the page and the save know them):
//   carrots    Buried Treasure  nine mounds of the kingdom's ground; dig its treasure (the big find counts two), stop with Keep whenever you like; one
//                               mound hides the kingdom's digger, who takes half. A dug mound puffs when he is in a mound next to it
//   fireflies  Glow Catch       fifteen seconds at dusk: tap what glows into the jar; the kingdom's hazard stings (two lost, the streak too), four in a
//                               row without a miss is one more, and twice a visitor darts by, worth three
//   lilypads   Turtle Hop       hold to crouch, let go to jump; Pogo hops to the Turnip over the kingdom's stepping places. One kind goes away soon after
//                               he lands, the other stays; a long jump over one of them counts two; a miss ends in whatever is below
//   nests      Mordo's Shells   Mordo the magpie drops a prize under one of three cups and shuffles them, faster each round and with feints from the
//                               second; find it, or keep what you have. A wrong cup has a small creature under it
// MINI.open(name, { reward, kingdom, level }) shows the game in its own layer over the page and resolves { reward } when it is closed:
//   { game, tier 0-3, score, practice, stars, carrots, boost: { name: count } }. Only `reward: true` pays into the save (MINI_REWARD), the playground on
//   the map opens them as practice. `kingdom` (0-9) or `level` says where it is played; without them, the kingdom the player has reached. The pieces are
//   the game's painted charms (anim/ch-*.webp) and map loops (anim/cr-*.webp), plus a few small things drawn here once; Pogo is the keyed rig (paHtml /
//   paPlay). The backgrounds are drawn here, once, into a canvas of their own and only copied each frame; MINI.thumb(name, kingdom) gives a small picture
//   as a URL. Every motion is a keyed table (MK below, the same [ms, values, ease] format as anim/ui-keys.js) sampled by time each frame; the loops (a
//   float, a pulse, a hover) are keyed tables too, whose last key is their first. Nothing runs while the layer is closed.
(() => {
  "use strict";
  // ---------------------------------------------------------------- rewards: one table, tuned in one place
  // A game ends on a tier from 0 to 3; the thresholds are the score each tier needs. Boosters count through the save's booster multiplier
  // (BXM), carrots through RWM, so a tier-2 game is worth about one booster handout. Practice games pay nothing.
  const MINI_REWARD = {
    // 2026-11-23 (İdris: "oyundaki booster ve ödül sayısını %25 azalt") every count is three quarters of what it was. A count with a fraction is
    // an expected value: its whole part always lands and the fraction is the chance of one more (0.75 = three games in four, 1.5 = one, and a
    // second every other game). was: tiers [{}, 1 star, 1 star + 1 booster, 2 stars + 1 booster + 1 carrot], ticket [{}, 1 star, 2 stars, 2 stars + 1 booster]
    tiers: [{}, { stars: .75 }, { stars: .75, boost: .75 }, { stars: 1.5, boost: .75, carrots: .75 }],
    // 2026-11-06 (story.js): a game bought in the Playground with a carrot (or a free game a boss left) pays stars and at most one booster handout,
    // never carrots back, so a carrot cannot buy more carrots; one carrot is worth about one tier-2 game
    ticket: [{}, { stars: .75 }, { stars: 1.5 }, { stars: 1.5, boost: .75 }],
    was: { tiers: [{}, { stars: 1 }, { stars: 1, boost: 1 }, { stars: 2, boost: 1, carrots: 1 }], ticket: [{}, { stars: 1 }, { stars: 2 }, { stars: 2, boost: 1 }] },
    price: 1,
    need: { carrots: [3, 5, 7], fireflies: [8, 15, 22], lilypads: [4, 8, 12], nests: [1, 2, 3] },
    boosters: ["hammer", "moves", "switch", "cross"]
  };
  window.MINI_REWARD = MINI_REWARD;
  // a count from the table as a whole number: the whole part, and one more with the chance of the fraction
  const roll = (n, rnd) => { n = +n || 0; const w = Math.floor(n), f = n - w; return w + (f > 1e-9 && (rnd || Math.random)() < f ? 1 : 0); };

  // ---------------------------------------------------------------- words (English in the code, Turkish beside it)
  const TRM = {
    "Buried Treasure": "Gömülü Hazine", "Glow Catch": "Işık Avı", "Turtle Hop": "Kaplumbağa Sekmesi", "Mordo's Shells": "Mordo'nun Kabukları",
    "The big find counts two. Stop with Keep whenever you like.": "Büyük olan iki sayılır. İstediğin an Bırak'a bas.",
    "Four in a row without a miss is one more. You have 15 seconds.": "Iskalamadan dört tane yakalarsan bir tane daha kazanırsın. 15 saniyen var.",
    "Hold to crouch, let go to jump. A long jump over one counts two.": "Basılı tut, eğil; bırak, zıpla. Birinin üstünden aşan uzun zıplayış iki sayılır.",
    "From round two he feints. Find it three times. A miss keeps half of what you won.": "İkinci turdan sonra şaşırtmaca da yapar. Üç kez bul. Iskalarsan kazandığının yarısı kalır.",
    "A game from the Sand Kingdom: the well-diggers play it while the tea brews.": "Kum Krallığı'ndan bir oyun: kuyucular çay demlenirken oynar.", "A game from the Night Kingdom: the lantern-lighters play it before bed.": "Gece Krallığı'ndan bir oyun: fenerciler yatmadan önce oynar.",
    "A game from the Water Kingdom: Barnacle taught it to Pogo. Sideways.": "Su Krallığı'ndan bir oyun: Pogo'ya Kıskaç öğretti. Yan yan.", "A game from the Forest Kingdom: Mordo plays it for buttons now, not charms.": "Orman Krallığı'ndan bir oyun: Mordo artık tılsımına değil, düğmesine oynuyor.",
    "Play": "Oyna", "Keep": "Bırak", "Next round": "Sonraki tur", "Collect": "Topla", "Close": "Kapat", "Practice: no rewards": "Antrenman: ödül yok",
    "Half gone!": "Yarısı gitti!", "All the treasure!": "Bütün hazine çıktı!",
    "Time!": "Süre doldu!", "Ouch! -2": "Ay! -2", "Streak! +1": "Seri! +1", "Caught {0}": "Yakalanan {0}",
    "The Turnip!": "Şalgam!", "Long jump! +2": "Uzun zıplayış! +2", "Hops {0}/12": "Sıçrama {0}/12",
    "Found it!": "Buldun!", "Not there…": "Orada değil…", "Which one?": "Hangisi?", "Round {0}/3": "Tur {0}/3",
    "No reward this time.": "Bu sefer ödül yok.", "Well played!": "İyi oynadın!", "Great run!": "Harika!", "Perfect!": "Kusursuz!",
    "Playground": "Oyun parkı", "For rewards": "Ödüllü", "Practice": "Antrenman", "Free games: {0}": "Bedava oyun: {0}", "One game: {0} carrot · you have {1}": "Bir oyun: {0} havuç · sende {1} var", "No carrots left. Win levels to earn more, or play for practice.": "Havuç kalmadı. Seviye kazanarak havuç topla ya da antrenman oyna.",
    "Stars": "Yıldız", "Carrots": "Havuç", "Sandpiper": "Kumkuşu", "+10 Moves": "+10 Hamle", "Free Switch": "Serbest Değiş", "Cross Blast": "Haç Patlaması", "Undo": "Geri al"
  };
  const T = (s, ...a) => { let o = (typeof save === "object" && save && save.lang === "tr" && TRM[s]) || s; a.forEach((v, i) => { o = o.replace("{" + i + "}", v); }); return o; };

  // ---------------------------------------------------------------- the keyed motions: [ms, values, ease into this key]
  const SNAP = "cubic-bezier(.18,.9,.32,1)", SETTLE = "cubic-bezier(.45,0,.55,1)", LIFT = "cubic-bezier(.3,0,.7,.4)", DROP = "cubic-bezier(.55,0,.9,.55)", OUT = "cubic-bezier(.2,.7,.3,1)";
  const MK = {
    // Buried Treasure. A mound patted flat, then thrown open; the coin under it: a nudge, out with a stretch, past its place and back
    dig: [[0, { sx: 1, sy: 1, a: 1 }], [90, { sx: 1.1, sy: .78, a: 1 }, SETTLE], [190, { sx: .92, sy: 1.2, a: 1 }, SNAP], [280, { sx: 1.3, sy: .25, a: 0 }, DROP]],
    unearth: [[0, { y: 0, s: .3, r: 0, sx: 1, sy: 1 }], [120, { y: -.25, s: .8, r: -.1, sx: .9, sy: 1.15 }, LIFT], [300, { y: -1.18, s: 1.1, r: .12, sx: .9, sy: 1.12 }, SNAP], [430, { y: -.9, s: 1, r: -.05, sx: 1.07, sy: .93 }, SETTLE], [540, { y: -1, s: 1, r: 0, sx: 1, sy: 1 }, SETTLE]],
    // the crab's mound: it shakes harder and harder before it opens; he comes up with a stretch; then a step back and off sideways in three hops
    rumble: [[0, { r: 0, sy: 1 }], [70, { r: -.04, sy: 1.02 }, SETTLE], [140, { r: .05, sy: .98 }, SETTLE], [210, { r: -.07, sy: 1.05 }, SETTLE], [280, { r: .08, sy: .96 }, SETTLE], [350, { r: -.05, sy: 1.1 }, SETTLE], [420, { r: 0, sy: 1.16 }, SNAP]],
    crabUp: [[0, { y: 0, sy: .6 }], [150, { y: -1.12, sy: 1.2 }, SNAP], [260, { y: -.9, sy: .88 }, SETTLE], [380, { y: -1, sy: 1 }, SETTLE]],
    scuttle: [[0, { x: 0, y: 0 }], [130, { x: -.07, y: 0 }, SETTLE], [300, { x: .22, y: -.1 }, SNAP], [420, { x: .34, y: 0 }, DROP], [560, { x: .58, y: -.08 }, SNAP], [680, { x: .7, y: 0 }, DROP], [900, { x: 1.2, y: -.05 }, LIFT]],
    // a clod of sand thrown by a dig: up, an arc, a bounce
    clod: [[0, { x: 0, y: 0, a: 1 }], [260, { x: .6, y: -1, a: 1 }, OUT], [520, { x: 1, y: .2, a: 1 }, DROP], [620, { x: 1.08, y: .05, a: .8 }, SETTLE], [760, { x: 1.12, y: .2, a: 0 }, DROP]],
    // a warning bubble (a loop): leaves the sand small, wobbles up, thins out
    bub: [[0, { y: 0, x: 0, s: .3, a: 0 }], [180, { y: -.12, x: .3, s: .7, a: 1 }, OUT], [620, { y: -.5, x: -.3, s: 1, a: 1 }, SETTLE], [1050, { y: -.86, x: .25, s: 1.08, a: .7 }, SETTLE], [1400, { y: -1, x: 0, s: 1.2, a: 0 }, LIFT]],
    // something caught going to its counter or jar (p along the line, h lift, s scale, r turn, a alpha): the same flight as the HUD's icons
    fly: [[0, { p: 0, h: 0, s: 1, r: 0, a: 1 }], [160, { p: -.05, h: .1, s: 1.25, r: -.05, a: 1 }, LIFT], [520, { p: .62, h: .3, s: 1.05, r: .08, a: 1 }, SNAP], [720, { p: 1, h: 0, s: .5, r: 0, a: .9 }, DROP]],
    // a tap on empty water: a small ring opens and fades. A win: eight short rays thrown out from a point
    miss: [[0, { s: .3, a: .9 }], [260, { s: 1, a: .4 }, OUT], [420, { s: 1.15, a: 0 }, SETTLE]],
    burst: [[0, { s: .15, a: 1 }], [200, { s: 1, a: 1 }, OUT], [380, { s: 1.16, a: .6 }, SETTLE], [540, { s: 1.24, a: 0 }, SETTLE]],
    // Glow Catch. A jellyfish swims (a loop): the bell gathers, pushes, and glides; an urchin rocks (a loop) and swells when it stings;
    // the lantern fish: in fast, a stop to show its light, and away
    pulse: [[0, { sx: 1, sy: 1, y: 0, g: .55 }], [260, { sx: 1.14, sy: .84, y: 4, g: .4 }, SETTLE], [470, { sx: .86, sy: 1.18, y: -16, g: 1 }, SNAP], [900, { sx: .97, sy: 1.04, y: -6, g: .75 }, SETTLE], [1300, { sx: 1, sy: 1, y: 0, g: .55 }, SETTLE]],
    roll: [[0, { r: -.2 }], [900, { r: .2 }, SETTLE], [1800, { r: -.2 }, SETTLE]],
    sting: [[0, { s: 1 }], [70, { s: 1.4 }, SNAP], [200, { s: .9 }, SETTLE], [320, { s: 1.05 }, SETTLE], [420, { s: 1 }, SETTLE]],
    dart: [[0, { p: 0, h: 0 }], [520, { p: .36, h: .5 }, OUT], [900, { p: .4, h: .38 }, SETTLE], [1040, { p: .37, h: .42 }, SETTLE], [1700, { p: 1, h: -.3 }, LIFT]],
    // Turtle Hop: the crouch while the finger is down (sampled by power, 0-1000), the jump (p along, h height as a share of the arc, sq squash),
    // the landing; a pad's float (a loop), its dip under a landing, a turtle's dive (a breath up first), the boat's rock when Pogo is aboard
    crouch: [[0, { sq: 1 }], [180, { sq: .9 }, SETTLE], [1000, { sq: .74 }, SETTLE]],
    hop: [[0, { p: 0, h: 0, sq: .8 }], [90, { p: .04, h: .14, sq: 1.18 }, SNAP], [330, { p: .5, h: 1, sq: 1.02 }, OUT], [560, { p: .96, h: .1, sq: 1.06 }, DROP], [600, { p: 1, h: 0, sq: 1.08 }, DROP]],
    land: [[0, { sq: 1.08 }], [70, { sq: .82 }, DROP], [190, { sq: 1.06 }, SNAP], [300, { sq: .98 }, SETTLE], [380, { sq: 1 }, SETTLE]],
    sink: [[0, { y: 0, a: 1 }], [160, { y: .25, a: 1 }, DROP], [420, { y: .7, a: 0 }, SETTLE]],
    padBob: [[0, { y: 0 }], [80, { y: 9 }, DROP], [240, { y: -3 }, SETTLE], [380, { y: 0 }, SETTLE]],
    float: [[0, { y: 0, r: 0 }], [800, { y: -5, r: .025 }, SETTLE], [1600, { y: 0, r: 0 }, SETTLE], [2400, { y: 4, r: -.025 }, SETTLE], [3200, { y: 0, r: 0 }, SETTLE]],
    dive: [[0, { y: 0, r: 0, a: 1 }], [160, { y: -.1, r: -.06, a: 1 }, SETTLE], [420, { y: .45, r: .2, a: 1 }, DROP], [640, { y: 1, r: .3, a: 0 }, LIFT]],
    rock: [[0, { y: 0, r: 0 }], [110, { y: 14, r: .07 }, DROP], [320, { y: -4, r: -.05 }, SETTLE], [540, { y: 3, r: .03 }, SETTLE], [760, { y: 0, r: -.01 }, SETTLE], [920, { y: 0, r: 0 }, SETTLE]],
    // Mordo's Shells: the starfish dropped from his beak; the shell held open for it and shut again with a clap; two shells trading places (one
    // over, one under); a feint (out, and back where it was); the shell a finger picked; the starfish found; the crab under a wrong one
    drop: [[0, { y: 0, s: 1, r: 0 }], [330, { y: 1, s: .96, r: .1 }, DROP], [420, { y: .9, s: 1.04, r: 0 }, SETTLE], [500, { y: 1, s: 1, r: 0 }, SETTLE]],
    lid: [[0, { y: 0, r: 0, sy: 1 }], [140, { y: 8, r: 0, sy: .94 }, SETTLE], [340, { y: -150, r: -.3, sy: 1.04 }, SNAP], [1500, { y: -150, r: -.3, sy: 1 }, SETTLE], [1660, { y: 0, r: 0, sy: 1.06 }, DROP], [1740, { y: 0, r: 0, sy: .86 }, SETTLE], [1880, { y: 0, r: 0, sy: 1 }, SNAP]],
    swap: [[0, { p: 0, h: 0, s: 1 }], [120, { p: .08, h: .25, s: 1.04 }, LIFT], [420, { p: .9, h: .9, s: 1.06 }, SNAP], [520, { p: 1, h: 0, s: 1 }, DROP], [600, { p: 1, h: 0, s: 1 }, SETTLE]],
    feint: [[0, { p: 0, h: 0, s: 1 }], [120, { p: .08, h: .25, s: 1.04 }, LIFT], [300, { p: .42, h: .8, s: 1.06 }, SNAP], [380, { p: .4, h: .8, s: 1.06 }, SETTLE], [540, { p: 0, h: 0, s: 1 }, DROP], [600, { p: 0, h: 0, s: 1 }, SETTLE]],
    peek: [[0, { y: 0, r: 0, sy: 1 }], [140, { y: 10, r: 0, sy: .93 }, SETTLE], [320, { y: -150, r: -.35, sy: 1.05 }, SNAP], [1100, { y: -150, r: -.35, sy: 1 }, SETTLE], [1300, { y: 0, r: 0, sy: 1 }, DROP]],
    hooray: [[0, { y: 0, s: 1, r: 0 }], [120, { y: 6, s: .88, r: 0 }, SETTLE], [300, { y: -74, s: 1.3, r: .3 }, SNAP], [470, { y: -8, s: 1.04, r: -.1 }, DROP], [570, { y: 0, s: 1, r: 0 }, SETTLE]],
    snap: [[0, { y: 30, s: .4, r: 0 }], [130, { y: -12, s: 1.15, r: -.12 }, SNAP], [230, { y: 0, s: 1, r: .14 }, SETTLE], [330, { y: -6, s: 1.06, r: -.14 }, SETTLE], [430, { y: 0, s: 1, r: .1 }, SETTLE], [540, { y: 0, s: 1, r: 0 }, SETTLE]],
    // Mordo: in from the side past his mark and back; his hover (a loop); a huff when the starfish is found, two pleased hops when it is not
    swoop: [[0, { k: 0 }], [640, { k: 1.05 }, SNAP], [900, { k: 1 }, SETTLE]],
    hover: [[0, { y: 0 }], [700, { y: -13 }, SETTLE], [1400, { y: 0 }, SETTLE]],
    huff: [[0, { y: 0, r: 0 }], [120, { y: 9, r: -.25 }, SNAP], [260, { y: -6, r: .18 }, SETTLE], [400, { y: 0, r: -.1 }, SETTLE], [520, { y: 0, r: 0 }, SETTLE]],
    gloat: [[0, { y: 0, r: 0 }], [140, { y: -28, r: .12 }, SNAP], [280, { y: 0, r: 0 }, DROP], [420, { y: -18, r: -.1 }, SNAP], [560, { y: 0, r: 0 }, DROP]],
    // the result card's stars land one by one
    star: [[0, { s: 0, r: -.4, a: 0 }], [180, { s: 1.35, r: .1, a: 1 }, SNAP], [300, { s: .92, r: -.03, a: 1 }, SETTLE], [400, { s: 1, r: 0, a: 1 }, SETTLE]]
  };
  const bez = (x1, y1, x2, y2) => { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, DX = (t) => (3 * ax * t + 2 * bx) * t + cx, Y = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const d = DX(t); if (d < 1e-6) break; const e = X(t) - x; if (Math.abs(e) < 1e-5) break; t -= e / d; } return Y(t); }; };
  const SAMP = {}; for (const [k, keys] of Object.entries(MK)) SAMP[k] = { t: keys.map(q => q[0]), v: keys.map(q => q[1]), e: keys.map(q => { const m = /\(([^)]+)\)/.exec(q[2] || ""); if (!m) return (u) => u; const [a, b, c, d] = m[1].split(",").map(Number); return bez(a, b, c, d); }), len: keys.at(-1)[0], props: Object.keys(keys[0][1]) };
  function K(name, ms, out) { const S = SAMP[name], t = S.t, n = t.length; out = out || {}; if (ms <= 0) { Object.assign(out, S.v[0]); return out; } if (ms >= S.len) { Object.assign(out, S.v[n - 1]); return out; }
    let i = 1; while (t[i] <= ms) i++; const a = S.v[i - 1], b = S.v[i], k = S.e[i]((ms - t[i - 1]) / (t[i] - t[i - 1])); for (const p of S.props) out[p] = a[p] + ((b[p] ?? a[p]) - a[p]) * k; return out; }
  const KLEN = (n) => SAMP[n].len, KL = (name, ms, out) => K(name, ((ms % SAMP[name].len) + SAMP[name].len) % SAMP[name].len, out);   // KL: a loop

  // ---------------------------------------------------------------- art: the painted sheets and charms
  const Q = location.protocol === "file:" ? "" : "?v=1106a", QC = typeof ART_Q === "string" ? ART_Q : Q, IMG = {};
  const img = (src) => IMG[src] || (IMG[src] = new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; }));
  const SRC = (k) => k.startsWith("ch-") || k.startsWith("cr-") ? "anim/" + k + ".webp" + QC : "anim/mini-" + k + ".webp" + Q;
  const NEED = { carrots: ["star"], fireflies: ["jar", "star"], lilypads: ["ripple", "splash", "star"], nests: ["star", "cr-magpie"] };
  // what a game needs in a kingdom, on top of its own sheets
  const ROLES = { carrots: (Z) => [Z.dig.coin, Z.dig.gold, Z.dig.foe], fireflies: (Z) => [Z.glow.get, Z.glow.bad, Z.glow.bonus], lilypads: (Z) => [Z.hop.pad, Z.hop.safe, "p:turnip"], nests: (Z) => [Z.cups.hide, Z.cups.foe, Z.cups.cup] };
  const SHEET = { "cr-crab": [72, 16, 176, 176], "cr-magpie": [96, 16, 176, 176] };   // the map's loops: [frames, columns, frame width, frame height], 24 drawings a second
  async function loadArt(name, Z) { const A = {}, list = NEED[name].concat(ROLES[name](Z)); await Promise.all(list.map(async (k) => { if (k.startsWith("ch-") || k.startsWith("cr-") || NEED[name].includes(k)) A[k] = await img(SRC(k)); else if (k.startsWith("p:")) A[k] = propArt(k.slice(2)); else if (PADS[k]) A[k] = propArt(k); }));
    if (name === "nests" && !Z.cups.cup.startsWith("ch-")) A[Z.cups.cup] = cupArt(Z); if (name === "lilypads" && Z.id !== "water") { A.splash = tinted(A.splash, "splash:" + Z.id, Z.pal.foam); A.ripple = tinted(A.ripple, "ripple:" + Z.id, Z.pal.foam); } return A; }
  // one frame of a sheet (or a whole charm), centred on (x, y) at width w (keeps the frame's aspect)
  function spr(x, A, name, f, cx, cy, w, o) { const im = A[name]; if (!im) return; const m = SHEET[name] || (window.MINI_ART || {})[name], n = m ? m[0] : 1, cols = m ? m[1] : 1, fw = m ? m[2] : im.width, fh = m ? m[3] : im.height, i = ((f | 0) % n + n) % n, sx = (i % cols) * fw, sy = Math.floor(i / cols) * fh, h = w * fh / fw;
    if (o) { x.save(); x.translate(cx, cy); if (o.r) x.rotate(o.r); x.scale(o.sx || 1, o.sy || 1); if (o.a !== undefined) x.globalAlpha = Math.max(0, Math.min(1, o.a)); x.drawImage(im, sx, sy, fw, fh, -w / 2, -h * (o.oy ?? .5), w, h); x.restore(); }
    else x.drawImage(im, sx, sy, fw, fh, cx - w / 2, cy - h / 2, w, h); }
  const O = { r: 0, sx: 1, sy: 1, a: 1, oy: .5 }, opt = (r, sx, sy, a, oy) => { O.r = r || 0; O.sx = sx || 1; O.sy = sy || 1; O.a = a === undefined ? 1 : a; O.oy = oy === undefined ? .5 : oy; return O; };   // one options object, reused by every draw

  // ---------------------------------------------------------------- the ten kingdoms: one row each, and the words of each game in each kingdom
  // pal: sky, far and near land, ground, ground lines; the dusk versions for Glow Catch; the liquid under Turtle Hop; the table of Mordo's game.
  // dig: the mound's colours [fill, edge, light, pit, pit depth, clod, puff, mark], what is in it, who is in it. glow: what to catch, what not to, the
  // visitor worth three, the colour of the light. hop: the place that goes away, the place that stays. cups: the cup, its colours, the prize, who is
  // under a wrong one. A name that starts ch- or cr- is a painted charm or loop; "p:x" is drawn here, once (PROP).
  const KT = [
    { id: "forest", deco: "forest", pal: { sky: ["#d8f0c0", "#8fd08a"], far: "#6bb071", near: "#478a55", gr: ["#8cc05f", "#5f8f3f"], line: "#4f7a35", dusk: ["#21404a", "#0f2427"], dfar: "#1c3a38", dnear: "#12282a", spark: "#d9ff9a", liq: ["#5aa6a0", "#2f7a78"], foam: "#cdeee0", tb: ["#a8743e", "#7c5228", "#c89858"] },
      dig: { c: ["#c98a3c", "#8a5a24", "#eab565", "#5a3e1e", "#34240f", "#b77a30", "#fff4d0", "#e25c2e"], mark: "leaf", coin: "ch-acorn", gold: "ch-mushroom", foe: "p:badger" }, glow: { get: "ch-butterfly", bad: "ch-pine", bonus: "ch-squirrel", rgb: "190,255,150" }, hop: { pad: "log", safe: "stump" }, cups: { cup: "acorn", c: ["#b97a3a", "#744820", "#dfa765"], hide: "ch-acorn", foe: "ch-fox" } },
    { id: "water", deco: "water", pal: { sky: ["#a5e6ee", "#58bcd9"], far: "#74cbe0", near: "#5ab6d2", gr: ["#f9e7b6", "#e7c47e"], line: "#d6b168", dusk: ["#2a3f8c", "#0d1640"], dfar: "#1c2c6c", dnear: "#111b4a", spark: "#bfe9ff", liq: ["#74c9e6", "#2f8fc4"], foam: "#d4f1fa", tb: ["#d39a5c", "#b07a45", "#e3b075"] },
      dig: { c: ["#f8dfa2", "#c2924c", "#fff3cf", "#9a7240", "#5e4020", "#d9b46c", "#ffffff", "#e6c078"], mark: "dot", coin: "ch-starfish", gold: "ch-seahorse", foe: "cr-crab" }, glow: { get: "ch-jellyfish", bad: "ch-urchin", bonus: "ch-angler", rgb: "206,170,255" }, hop: { pad: "ch-turtle", safe: "lily" }, cups: { cup: "ch-shell", c: ["#f4c9c0", "#b97a70", "#ffe8e0"], hide: "ch-starfish", foe: "ch-crab" } },
    { id: "fire", deco: "fire", pal: { sky: ["#ffc46b", "#e8603a"], far: "#a83c2e", near: "#6e2a2a", gr: ["#5a3a3a", "#2e1c22"], line: "#8a4a3a", dusk: ["#4a1622", "#1c0810"], dfar: "#3a1018", dnear: "#240a10", spark: "#ffc46a", liq: ["#ff9a2a", "#d63a14"], foam: "#ffe27a", tb: ["#5a4044", "#3c2a30", "#7a585a"] },
      dig: { c: ["#6f6468", "#3f383c", "#978c90", "#3a2226", "#1a0c10", "#8a8084", "#ffb64a", "#ff7a2a"], mark: "dot", coin: "ch-ember", gold: "ch-phoenix", foe: "ch-salamander" }, glow: { get: "ch-flame", bad: "ch-dragon", bonus: "ch-phoenix", rgb: "255,170,70" }, hop: { pad: "crust", safe: "basalt" }, cups: { cup: "pot", c: ["#c0623a", "#7a3820", "#e88f5e"], hide: "ch-ember", foe: "ch-salamander" } },
    { id: "ice", deco: "ice", pal: { sky: ["#e6f6ff", "#a8d8f2"], far: "#c2e4f5", near: "#94c8e6", gr: ["#f6fcff", "#cfe8f6"], line: "#a8cfe6", dusk: ["#27467e", "#101f44"], dfar: "#2a4e88", dnear: "#1a3260", spark: "#e2f6ff", liq: ["#6fb8da", "#2e76a8"], foam: "#eaf8ff", tb: ["#b8dcef", "#86b8d6", "#e4f4fc"] },
      dig: { c: ["#fbfeff", "#9cc8e2", "#ffffff", "#3f86b4", "#174a78", "#dff2fb", "#ffffff", "#bfe3f5"], mark: "dot", coin: "p:fish", gold: "p:goldfish", foe: "ch-seal" }, glow: { get: "ch-snowflake", bad: "p:shard", bonus: "ch-penguin", rgb: "190,235,255" }, hop: { pad: "floe", safe: "berg" }, cups: { cup: "ice", c: ["#cdeefa", "#6fb0d4", "#ffffff"], hide: "ch-snowflake", foe: "ch-seal" } },
    { id: "air", deco: "air", pal: { sky: ["#8fd0f6", "#dcf2ff"], far: "#d7eefc", near: "#b6dcf4", gr: ["#ffffff", "#d7ecf8"], line: "#bcdcf0", dusk: ["#3a4f9a", "#1c2860"], dfar: "#2f4288", dnear: "#22306c", spark: "#ffffff", liq: ["#cfeafa", "#8fc6ea"], foam: "#ffffff", tb: ["#e8d9b8", "#bfa984", "#f6ecd4"] },
      dig: { c: ["#ffffff", "#a9cce6", "#ffffff", "#bcd8ee", "#7fa8cc", "#eaf5fc", "#ffffff", "#e2f1fb"], mark: "puff", coin: "ch-kite", gold: "ch-balloon", foe: "ch-eagle" }, glow: { get: "ch-dragonfly", bad: "ch-eagle", bonus: "ch-sparrow", rgb: "190,240,255" }, hop: { pad: "wisp", safe: "puff" }, cups: { cup: "cloud", c: ["#ffffff", "#9fc4e0", "#ffffff"], hide: "ch-kite", foe: "ch-sparrow" } },
    { id: "sand", deco: "sand", pal: { sky: ["#ffe8a8", "#f7b860"], far: "#e8a858", near: "#d18e45", gr: ["#f6d592", "#dea85a"], line: "#c28c48", dusk: ["#3f2a62", "#1c1434"], dfar: "#352456", dnear: "#241a3e", spark: "#ffe9b0", liq: ["#e6bc6e", "#b88a44"], foam: "#fff0c4", tb: ["#b46a3a", "#8a4c28", "#d89058"] },
      dig: { c: ["#f1c877", "#b9843f", "#ffe4a8", "#9a6a32", "#5a3a1a", "#d8a85c", "#fff2c8", "#d9a55a"], mark: "dot", coin: "ch-scarab", gold: "ch-pyramid", foe: "ch-scorpion" }, glow: { get: "ch-scarab", bad: "ch-scorpion", bonus: "ch-lizard", rgb: "255,225,130" }, hop: { pad: "carpet", safe: "dune" }, cups: { cup: "jar", c: ["#d98a4e", "#8f5228", "#f4b583"], hide: "ch-scarab", foe: "ch-lizard" } },
    { id: "crystal", deco: "crystal", pal: { sky: ["#3d2a6e", "#1e1640"], far: "#4c3a8c", near: "#33276a", gr: ["#5e4aa8", "#2f2460"], line: "#7a66c8", dusk: ["#241a52", "#0e0a26"], dfar: "#2e2266", dnear: "#1c1644", spark: "#d0b8ff", liq: ["#5a7ce0", "#2a3aa0"], foam: "#cfe0ff", tb: ["#6f5cc0", "#4a3c8e", "#9a88e0"] },
      dig: { c: ["#7d6ac8", "#3f3080", "#b0a0f0", "#2a2058", "#140f34", "#8d7ce0", "#e4d8ff", "#d8c0ff"], mark: "gem", coin: "ch-emerald", gold: "ch-diamond", foe: "ch-snail" }, glow: { get: "ch-ruby", bad: "ch-cluster", bonus: "ch-crown", rgb: "255,150,190" }, hop: { pad: "shard", safe: "slab" }, cups: { cup: "geode", c: ["#77708c", "#433e56", "#a39cba"], hide: "ch-ruby", foe: "ch-snail" } },
    { id: "night", deco: "night", pal: { sky: ["#27306e", "#101538"], far: "#1e2558", near: "#141a42", gr: ["#2c4058", "#16243a"], line: "#3f5a70", dusk: ["#1b2158", "#090c26"], dfar: "#161c4a", dnear: "#0e1232", spark: "#fff3b0", liq: ["#27407c", "#121f4c"], foam: "#a8c4ff", tb: ["#4a4a70", "#2f2f4e", "#6a6a94"] },
      dig: { c: ["#3f6e66", "#20403c", "#6a9c8c", "#1c2c34", "#0c1620", "#476f66", "#fff3b0", "#a4d48c"], mark: "dot", coin: "ch-firefly", gold: "ch-moon", foe: "ch-cat" }, glow: { get: "ch-firefly", bad: "ch-bat", bonus: "ch-owl", rgb: "250,255,170" }, hop: { pad: "lantern", safe: "stone" }, cups: { cup: "lamp", c: ["#e8a040", "#94561e", "#ffd88a"], hide: "ch-firefly", foe: "ch-hedgehog" } },
    { id: "storm", deco: "storm", pal: { sky: ["#7c8aa0", "#48566e"], far: "#5a6880", near: "#3e4a60", gr: ["#5f6b62", "#343d3c"], line: "#7a8a80", dusk: ["#34405a", "#141a28"], dfar: "#2a3448", dnear: "#1c2434", spark: "#cfe8ff", liq: ["#5a7c94", "#2e4a60"], foam: "#dff0f8", tb: ["#7a6a58", "#54483c", "#9a8a74"] },
      dig: { c: ["#7e7866", "#45423a", "#a6a08c", "#3a3a38", "#1c1e20", "#7e7a6a", "#dcf2ff", "#7fb4d0"], mark: "dot", coin: "ch-drop", gold: "ch-bolt", foe: "ch-gull" }, glow: { get: "ch-drop", bad: "ch-bolt", bonus: "ch-pinwheel", rgb: "170,220,255" }, hop: { pad: "umbrella", safe: "barrel" }, cups: { cup: "bucket", c: ["#8fa2b2", "#4f6070", "#c4d4e0"], hide: "ch-drop", foe: "ch-gull" } },
    { id: "star", deco: "star", pal: { sky: ["#181a48", "#080a22"], far: "#262a6a", near: "#181c4c", gr: ["#9a9ac0", "#5a5a88"], line: "#7474a6", dusk: ["#141640", "#05061a"], dfar: "#20245c", dnear: "#12153e", spark: "#fff6c0", liq: ["#2a2c70", "#0e0f36"], foam: "#c8ccff", tb: ["#77779e", "#50507a", "#a0a0c4"] },
      dig: { c: ["#b6b6d6", "#6e6e9c", "#dcdcf2", "#4a4a78", "#22224a", "#9a9ac2", "#fff6c0", "#8a8ab8"], mark: "crater", coin: "ch-moonrock", gold: "ch-comet", foe: "ch-alien" }, glow: { get: "ch-star", bad: "ch-moonrock", bonus: "ch-rocket", rgb: "255,245,170" }, hop: { pad: "starlet", safe: "rock" }, cups: { cup: "moon", c: ["#c4c4dc", "#6e6e9c", "#ececf8"], hide: "ch-star", foe: "ch-alien" } }
  ];
  // the words: for each kingdom, each game's [title, what to do, a line about it] and what it shouts. Every entry is [English, Turkish].
  const KW = [
    /* forest */ { carrots: { t: ["Acorn Dig", "Palamut Kazısı"], r: ["Dig the leaf piles for acorns. One hides the badger: he takes half. Puffs over a dug pile mean he is next door.", "Yaprak yığınlarını kaz, palamut topla. Birinde porsuk saklanıyor: yarısını alır. Kazdığın yığından toz çıkıyorsa porsuk komşudadır."], f: ["The squirrels of the Forest Kingdom play it every autumn.", "Orman Krallığı'nın sincapları her sonbahar oynar."], foe: ["The badger!", "Porsuk!"], near: ["Puffs! The badger is near.", "Toz çıktı! Porsuk yakında."], gold: ["A toadstool! +2", "Mantar! +2"], stat: ["Acorns {0}", "Palamut {0}"] },
      fireflies: { t: ["Butterfly Catch", "Kelebek Avı"], r: ["Tap the bright butterflies into the jar. Leave the thorny pines alone: they prick.", "Parlak kelebeklere dokun, kavanoza topla. Dikenli çamlara dokunma: batar."], f: ["Hazel the fox plays it at dusk, and counts twice.", "Tilki Fındık akşamüstü oynar, iki kez sayar."], bonus: ["A squirrel! +3", "Sincap! +3"] },
      lilypads: { t: ["Log Hop", "Tomruk Sekmesi"], r: ["Logs roll over soon after you land, stumps stay. Twelve hops to the Turnip.", "Tomruklar konduktan az sonra döner, kütükler kalır. Şalgam'a on iki sıçrama."], f: ["Forest rangers cross the river this way. Hazel says it is faster.", "Orman korucuları dereyi böyle geçer. Fındık daha hızlı olduğunu söylüyor."], splash: ["Splash!", "Cumburlop!"], sink: ["The log rolled!", "Tomruk döndü!"] },
      nests: { t: ["Mordo's Acorn Cups", "Mordo'nun Palamut Kapları"], r: ["Mordo hides an acorn under a cup and shuffles them.", "Mordo bir palamudu kaplardan birinin altına saklayıp karıştırıyor."], f: ["Mordo plays it for buttons now, not charms.", "Mordo artık tılsımına değil, düğmesine oynuyor."], watch: ["Watch the acorn…", "Palamudu izle…"] } },
    /* water */ { carrots: { t: ["Shore Dig", "Kıyı Kazısı"], r: ["Dig the wet sand for starfish. One mound hides the crab: he takes half. Bubbles over a dug mound mean he is next door.", "Islak kumu kaz, denizyıldızı topla. Bir tepecikte yengeç saklanıyor: yarısını alır. Kazdığın yerden kabarcık çıkıyorsa yengeç komşudadır."], f: ["Barnacle says he invented it. Nobody asks how.", "Kıskaç bu oyunu kendisinin bulduğunu söylüyor. Kimse nasıl diye sormuyor."], foe: ["The crab!", "Yengeç!"], near: ["Bubbles! The crab is near.", "Kabarcık! Yengeç yakında."], gold: ["A seahorse! +2", "Denizatı! +2"], stat: ["Starfish {0}", "Denizyıldızı {0}"] },
      fireflies: { t: ["Glow Catch", "Işık Avı"], r: ["Tap the glowing jellyfish into the jar. Leave the urchins alone: they sting.", "Parlayan denizanalarına dokun, kavanoza topla. Deniz kestanelerine dokunma: batar."], f: ["Queen Mira watched it for a hundred years before she tried it.", "Kraliçe Mira yüz yıl izledikten sonra denedi."], bonus: ["Lantern fish! +3", "Fener balığı! +3"] },
      lilypads: { t: ["Turtle Hop", "Kaplumbağa Sekmesi"], r: ["Turtles dive soon after you land, lily pads stay. Twelve hops to the Turnip.", "Kaplumbağalar konduktan az sonra dalar, nilüfer yaprakları kalır. Şalgam'a on iki sıçrama."], f: ["Barnacle taught it to Pogo. Sideways.", "Pogo'ya Kıskaç öğretti. Yan yan."], splash: ["Splash!", "Cumburlop!"], sink: ["The turtle dived!", "Kaplumbağa daldı!"] },
      nests: { t: ["Mordo's Shells", "Mordo'nun Kabukları"], r: ["Mordo hides a starfish under a shell and shuffles them.", "Mordo bir denizyıldızını kabuklardan birinin altına saklayıp karıştırıyor."], f: ["The flock copies every move. Every move!", "Sürü her hareketi taklit eder. Her hareketi!"], watch: ["Watch the starfish…", "Denizyıldızını izle…"] } },
    /* fire */ { carrots: { t: ["Ember Dig", "Kor Kazısı"], r: ["Dig the ash heaps for warm embers. One hides the salamander: he takes half. Sparks over a dug heap mean he is next door.", "Kül yığınlarını kaz, sıcak kor topla. Birinde semender saklanıyor: yarısını alır. Kazdığın yığından kıvılcım çıkıyorsa semender komşudadır."], f: ["Brand the bear plays it on his lunch break, with tongs.", "Ayı Kor Usta öğle molasında maşayla oynar."], foe: ["The salamander!", "Semender!"], near: ["Sparks! The salamander is near.", "Kıvılcım! Semender yakında."], gold: ["A phoenix! +2", "Anka kuşu! +2"], stat: ["Embers {0}", "Kor {0}"] },
      fireflies: { t: ["Flame Catch", "Alev Avı"], r: ["Tap the floating flames into the jar. Leave the little dragons alone: they bite.", "Uçuşan alevlere dokun, kavanoza topla. Küçük ejderlere dokunma: ısırır."], f: ["The lantern makers of the market catch their flames this way.", "Çarşının fenercileri alevlerini böyle yakalar."], bonus: ["A phoenix! +3", "Anka kuşu! +3"] },
      lilypads: { t: ["Lava Hop", "Lav Sekmesi"], r: ["Crust stones sink soon after you land, black rocks stay. Twelve hops to the Turnip.", "Kabuk taşları konduktan az sonra batar, kara kayalar kalır. Şalgam'a on iki sıçrama."], f: ["Brand crossed it once in his socks. Never again.", "Kor Usta bir kez çoraplarıyla geçti. Bir daha asla."], splash: ["Sizzle!", "Cızzz!"], sink: ["The stone sank!", "Taş battı!"] },
      nests: { t: ["Mordo's Clay Pots", "Mordo'nun Çömlekleri"], r: ["Mordo hides an ember under a pot and shuffles them.", "Mordo bir koru çömleklerden birinin altına saklayıp karıştırıyor."], f: ["Gritt says it is easy. Gritt has never found it.", "Gritt kolay olduğunu söylüyor. Daha hiç bulamadı."], watch: ["Watch the ember…", "Koru izle…"] } },
    /* ice */ { carrots: { t: ["Ice Fishing", "Buzda Balık"], r: ["Dig the snow for fishing holes. One hides the seal: she takes half. Steam over a dug hole means she is next door.", "Karı kaz, balık deliklerini bul. Birinde fok saklanıyor: yarısını alır. Kazdığın delikten buhar çıkıyorsa fok komşudadır."], f: ["Captain Waddle's crew fish here between buckets.", "Paytak Kaptan'ın tayfası kova aralarında burada balık tutar."], foe: ["The seal!", "Fok!"], near: ["Steam! The seal is near.", "Buhar! Fok yakında."], gold: ["A golden fish! +2", "Altın balık! +2"], stat: ["Fish {0}", "Balık {0}"] },
      fireflies: { t: ["Snowflake Catch", "Kar Tanesi Avı"], r: ["Tap the snowflakes into the jar. Leave the icicles alone: they are sharp.", "Kar tanelerine dokun, kavanoza topla. Buz sarkıtlarına dokunma: keskindir."], f: ["The snowmen play it very slowly and very politely.", "Kardan adamlar bunu çok yavaş ve çok kibarca oynar."], bonus: ["A penguin! +3", "Penguen! +3"] },
      lilypads: { t: ["Floe Hop", "Buz Sekmesi"], r: ["Thin floes crack soon after you land, thick ones stay. Twelve hops to the Turnip.", "İnce buzlar konduktan az sonra çatlar, kalın buzlar kalır. Şalgam'a on iki sıçrama."], f: ["The one place Captain Waddle allows hopping.", "Paytak Kaptan'ın zıplamaya izin verdiği tek yer."], splash: ["Splash!", "Cumburlop!"], sink: ["The floe cracked!", "Buz çatladı!"] },
      nests: { t: ["Mordo's Ice Cups", "Mordo'nun Buz Kapları"], r: ["Mordo hides a snowflake under an ice cup and shuffles them.", "Mordo bir kar tanesini buz kaplarından birinin altına saklayıp karıştırıyor."], f: ["He plays it fast, before the cups melt.", "Kaplar erimeden hızlıca oynuyor."], watch: ["Watch the snowflake…", "Kar tanesini izle…"] } },
    /* sky */ { carrots: { t: ["Cloud Dig", "Bulut Kazısı"], r: ["Poke the clouds for lost kites. One hides the eagle: he takes half. Puffs over an opened cloud mean he is next door.", "Bulutları dürt, kayıp uçurtmaları bul. Birinde kartal saklanıyor: yarısını alır. Açtığın buluttan buğu çıkıyorsa kartal komşudadır."], f: ["King Gale pretends he does not play it.", "Kral Poyraz bu oyunu oynamıyormuş gibi yapar."], foe: ["The eagle!", "Kartal!"], near: ["Puffs! The eagle is near.", "Buğu! Kartal yakında."], gold: ["A balloon! +2", "Balon! +2"], stat: ["Kites {0}", "Uçurtma {0}"] },
      fireflies: { t: ["Dragonfly Catch", "Yusufçuk Avı"], r: ["Tap the dragonflies into the jar. Leave the eagles alone: they swoop.", "Yusufçuklara dokun, kavanoza topla. Kartallara dokunma: pençe atar."], f: ["The windmill keepers play it while they wait for wind.", "Değirmenciler rüzgâr beklerken oynar."], bonus: ["A sparrow! +3", "Serçe! +3"] },
      lilypads: { t: ["Cloud Hop", "Bulut Sekmesi"], r: ["Thin clouds melt soon after you land, fat clouds stay. Twelve hops to the Turnip.", "İnce bulutlar konduktan az sonra dağılır, tombul bulutlar kalır. Şalgam'a on iki sıçrama."], f: ["The balloon keepers call it the short way down.", "Balon bekçileri buna aşağı inmenin kısa yolu der."], splash: ["Whoosh!", "Vıııın!"], sink: ["The cloud melted!", "Bulut dağıldı!"] },
      nests: { t: ["Mordo's Cloud Cups", "Mordo'nun Bulut Kapları"], r: ["Mordo hides a kite under a cloud and shuffles them.", "Mordo bir uçurtmayı bulutlardan birinin altına saklayıp karıştırıyor."], f: ["Corvin taught him the feint. He denies it.", "Şaşırtmacayı ona Corvin öğretti. Kabul etmiyor."], watch: ["Watch the kite…", "Uçurtmayı izle…"] } },
    /* sand */ { carrots: { t: ["Sand Dig", "Kum Kazısı"], r: ["Dig the dunes for golden scarabs. One hides the scorpion: it takes half. Dust over a dug dune means it is next door.", "Kumulları kaz, altın böcek topla. Birinde akrep saklanıyor: yarısını alır. Kazdığın kumuldan toz çıkıyorsa akrep komşudadır."], f: ["The well-diggers play it while the tea brews.", "Kuyucular çay demlenirken oynar."], foe: ["The scorpion!", "Akrep!"], near: ["Dust! The scorpion is near.", "Toz! Akrep yakında."], gold: ["A pyramid! +2", "Piramit! +2"], stat: ["Scarabs {0}", "Böcek {0}"] },
      fireflies: { t: ["Scarab Catch", "Böcek Avı"], r: ["Tap the shining scarabs into the jar. Leave the scorpions alone: they sting.", "Parlayan böceklere dokun, kavanoza topla. Akreplere dokunma: sokar."], f: ["The caravans play it at night, when the sand cools.", "Kervanlar kum serinleyince, geceleri oynar."], bonus: ["A lizard! +3", "Kertenkele! +3"] },
      lilypads: { t: ["Carpet Hop", "Halı Sekmesi"], r: ["Carpets fly off soon after you land, dune tops stay. Twelve hops to the Turnip.", "Halılar konduktan az sonra uçup gider, kumul tepeleri kalır. Şalgam'a on iki sıçrama."], f: ["Barnacle bought a carpet for this. It goes sideways.", "Kıskaç bunun için halı aldı. Yan yan gidiyor."], splash: ["Poof!", "Puf!"], sink: ["The carpet flew off!", "Halı uçup gitti!"] },
      nests: { t: ["Mordo's Sand Jars", "Mordo'nun Kum Testileri"], r: ["Mordo hides a scarab under a jar and shuffles them.", "Mordo bir böceği testilerden birinin altına saklayıp karıştırıyor."], f: ["Thimble keeps the score and brews the tea.", "Yüksük hem skoru tutar hem çayı demler."], watch: ["Watch the scarab…", "Böceği izle…"] } },
    /* crystal */ { carrots: { t: ["Gem Dig", "Kristal Kazısı"], r: ["Chip the rock mounds for emeralds. One hides the cave snail: it takes half. Glints over a dug mound mean it is next door.", "Kaya tepeciklerini yont, zümrüt topla. Birinde mağara salyangozu saklanıyor: yarısını alır. Yonttuğun yerden pırıltı çıkıyorsa salyangoz komşudadır."], f: ["The miners play it by ear.", "Madenciler bunu kulaktan oynar."], foe: ["The snail!", "Salyangoz!"], near: ["Glints! The snail is near.", "Pırıltı! Salyangoz yakında."], gold: ["A diamond! +2", "Elmas! +2"], stat: ["Emeralds {0}", "Zümrüt {0}"] },
      fireflies: { t: ["Gem Catch", "Mücevher Avı"], r: ["Tap the glowing rubies into the jar. Leave the amethysts alone: they are sharp.", "Parlayan yakutlara dokun, kavanoza topla. Ametistlere dokunma: keskindir."], f: ["Prism says the trick is not to blink.", "Camkanat'a göre püf noktası gözünü kırpmamak."], bonus: ["A crown! +3", "Taç! +3"] },
      lilypads: { t: ["Crystal Hop", "Kristal Sekmesi"], r: ["Crystal shards crack soon after you land, flat slabs stay. Twelve hops to the Turnip.", "Kristal parçaları konduktan az sonra çatlar, düz taşlar kalır. Şalgam'a on iki sıçrama."], f: ["The lake under the mountain rings when you land.", "Dağın altındaki göl, her konuşunda çınlar."], splash: ["Plink!", "Çın!"], sink: ["The shard cracked!", "Parça çatladı!"] },
      nests: { t: ["Mordo's Geodes", "Mordo'nun Jeotları"], r: ["Mordo hides a ruby under a geode and shuffles them.", "Mordo bir yakutu jeotlardan birinin altına saklayıp karıştırıyor."], f: ["He says he only wants to look at them.", "Yalnızca bakmak istediğini söylüyor."], watch: ["Watch the ruby…", "Yakutu izle…"] } },
    /* night */ { carrots: { t: ["Moonlit Dig", "Ay Işığında Kazı"], r: ["Dig the mossy mounds for fireflies. One hides the cat: she takes half. Puffs over a dug mound mean she is next door.", "Yosunlu tepecikleri kaz, ateşböceği topla. Birinde kedi saklanıyor: yarısını alır. Kazdığın yerden toz çıkıyorsa kedi komşudadır."], f: ["The owls play it when the little ones are finally asleep.", "Baykuşlar, küçükler sonunda uyuyunca oynar."], foe: ["The cat!", "Kedi!"], near: ["Puffs! The cat is near.", "Toz! Kedi yakında."], gold: ["A crescent moon! +2", "Hilal! +2"], stat: ["Fireflies {0}", "Ateşböceği {0}"] },
      fireflies: { t: ["Firefly Catch", "Ateşböceği Avı"], r: ["Tap the fireflies into the jar. Leave the bats alone: they nip.", "Ateşböceklerine dokun, kavanoza topla. Yarasalara dokunma: ısırır."], f: ["The lantern-lighters play it before bed.", "Fenerciler yatmadan önce oynar."], bonus: ["An owl! +3", "Baykuş! +3"] },
      lilypads: { t: ["Lantern Hop", "Fener Sekmesi"], r: ["Paper lanterns sink soon after you land, stones stay. Twelve hops to the Turnip.", "Kâğıt fenerler konduktan az sonra batar, taşlar kalır. Şalgam'a on iki sıçrama."], f: ["Luna floats the lanterns on Moon Lake herself.", "Fenerleri Ay Gölü'ne Mehtap kendisi bırakır."], splash: ["Splash!", "Cumburlop!"], sink: ["The lantern sank!", "Fener battı!"] },
      nests: { t: ["Mordo's Lanterns", "Mordo'nun Fenerleri"], r: ["Mordo hides a firefly under a lantern and shuffles them.", "Mordo bir ateşböceğini fenerlerden birinin altına saklayıp karıştırıyor."], f: ["Even in the dark he knows where it is. Nearly.", "Karanlıkta bile yerini bilir. Neredeyse."], watch: ["Watch the firefly…", "Ateşböceğini izle…"] } },
    /* storm */ { carrots: { t: ["Mud Dig", "Çamur Kazısı"], r: ["Dig the muddy mounds for raindrops. One hides the gull: it takes half. Steam over a dug mound means it is next door.", "Çamur tepeciklerini kaz, yağmur damlası topla. Birinde martı saklanıyor: yarısını alır. Kazdığın yerden buhar çıkıyorsa martı komşudadır."], f: ["Nimbus says mud is only rain that sat down.", "Pamuk'a göre çamur, oturup dinlenen yağmurdur."], foe: ["The gull!", "Martı!"], near: ["Steam! The gull is near.", "Buhar! Martı yakında."], gold: ["A lightning bolt! +2", "Şimşek! +2"], stat: ["Drops {0}", "Damla {0}"] },
      fireflies: { t: ["Raindrop Catch", "Damla Avı"], r: ["Tap the raindrops into the jar. Leave the lightning alone: it bites.", "Yağmur damlalarına dokun, kavanoza topla. Şimşeklere dokunma: çarpar."], f: ["In Umbrella Town this counts as going outside.", "Şemsiye Kasabası'nda buna dışarı çıkmak denir."], bonus: ["A pinwheel! +3", "Fırıldak! +3"] },
      lilypads: { t: ["Umbrella Hop", "Şemsiye Sekmesi"], r: ["Umbrellas blow away soon after you land, barrels stay. Twelve hops to the Turnip.", "Şemsiyeler konduktan az sonra uçup gider, fıçılar kalır. Şalgam'a on iki sıçrama."], f: ["Nimbus knits a new umbrella for every fall.", "Pamuk her düşüş için yeni bir şemsiye örer."], splash: ["Splash!", "Cumburlop!"], sink: ["The umbrella blew away!", "Şemsiye uçtu!"] },
      nests: { t: ["Mordo's Buckets", "Mordo'nun Kovaları"], r: ["Mordo hides a raindrop under a bucket and shuffles them.", "Mordo bir yağmur damlasını kovalardan birinin altına saklayıp karıştırıyor."], f: ["He hates getting wet. He plays anyway.", "Islanmaktan nefret eder. Yine de oynar."], watch: ["Watch the raindrop…", "Damlayı izle…"] } },
    /* star */ { carrots: { t: ["Moon Dust Dig", "Ay Tozu Kazısı"], r: ["Dig the moon dust for moon rocks. One hides the little alien: it takes half. Stardust over a dug mound means it is next door.", "Ay tozunu kaz, ay taşı topla. Birinde minik uzaylı saklanıyor: yarısını alır. Kazdığın yerden yıldız tozu çıkıyorsa uzaylı komşudadır."], f: ["Grandma Clover played it as a girl, with real comets.", "Yonca Nine çocukken gerçek kuyrukluyıldızlarla oynardı."], foe: ["The alien!", "Uzaylı!"], near: ["Stardust! The alien is near.", "Yıldız tozu! Uzaylı yakında."], gold: ["A comet! +2", "Kuyrukluyıldız! +2"], stat: ["Rocks {0}", "Taş {0}"] },
      fireflies: { t: ["Star Catch", "Yıldız Avı"], r: ["Tap the falling stars into the jar. Leave the moon rocks alone: they bump.", "Kayan yıldızlara dokun, kavanoza topla. Ay taşlarına dokunma: çarpar."], f: ["Every star in the jar goes back up the stair.", "Kavanozdaki her yıldız merdivenden yukarı geri döner."], bonus: ["A rocket! +3", "Roket! +3"] },
      lilypads: { t: ["Comet Hop", "Kuyrukluyıldız Sekmesi"], r: ["Little stars fall soon after you land, moon rocks stay. Twelve hops to the Turnip.", "Küçük yıldızlar konduktan az sonra düşer, ay taşları kalır. Şalgam'a on iki sıçrama."], f: ["Nyx flies beside you, in case.", "Nyx yanında uçar, ne olur ne olmaz."], splash: ["Whoosh!", "Vıııın!"], sink: ["The star fell!", "Yıldız düştü!"] },
      nests: { t: ["Mordo's Moon Cups", "Mordo'nun Ay Kapları"], r: ["Mordo hides a star under a moon cup and shuffles them.", "Mordo bir yıldızı ay kaplarından birinin altına saklayıp karıştırıyor."], f: ["These days he gives back what he wins.", "Artık kazandığını geri veriyor."], watch: ["Watch the star…", "Yıldızı izle…"] } }
  ];
  const lang = () => (typeof save === "object" && save && save.lang === "tr" ? 1 : 0), L = (p, v) => { const s = p[lang()]; return v === undefined ? s : s.replace("{0}", v); };
  // which kingdom a game is played in: the one it was opened for (a boss's chest says), the level's, or the one the player has reached
  const reached = () => { try { if (typeof save === "object" && save && save.stars) { let h = 0; while (h < 499 && save.stars[h]) h++; return Math.floor(h / 50); } } catch (e) {} return -1; };
  const kingdomFor = (name, o) => { const n = o && Number.isFinite(o.kingdom) ? o.kingdom : o && Number.isFinite(o.level) ? Math.floor(o.level / 50) : reached(), k = n >= 0 ? n : (HOME[name] ?? 0); return Math.max(0, Math.min(9, Math.floor(k))); };

  // ---------------------------------------------------------------- the pictures, in the page's own units (780 x 1300; Turtle Hop's is two pages
  // wide and tiles). Flat cut-paper shapes over a wash, every one placed by rule: no noise, nothing random. Each is painted once, into a canvas.
  const VW = 780, VH = 1300, TAU = 6.2832;
  function blob(x, pts, fill) { const n = pts.length; x.beginPath(); for (let i = 0; i <= n; i++) { const a = pts[i % n], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if (!i) x.moveTo(mx, my); else x.quadraticCurveTo(a[0], a[1], mx, my); } x.closePath(); x.fillStyle = fill; x.fill(); }
  const wash = (x, y0, y1, c0, c1, w) => { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(0, y0, w || VW, y1 - y0); };
  const dot = (x, cx, cy, r, fill, a) => { x.globalAlpha = a === undefined ? 1 : a; x.fillStyle = fill; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.globalAlpha = 1; };
  const ell = (x, cx, cy, rx, ry, fill, stroke, lw, rot) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, rot || 0, 0, TAU); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw || 4; x.stroke(); } };
  const poly = (x, pts, fill, stroke, lw) => { x.beginPath(); pts.forEach(([a, b], i) => { if (i) x.lineTo(a, b); else x.moveTo(a, b); }); x.closePath(); if (fill) { x.fillStyle = fill; x.fill(); } if (stroke) { x.strokeStyle = stroke; x.lineWidth = lw || 4; x.lineJoin = "round"; x.stroke(); } };
  const line = (x, x0, y0, x1, y1, c, w) => { x.strokeStyle = c; x.lineWidth = w; x.lineCap = "round"; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); };
  // a rolling edge across the picture, filled down to `bottom`; a whole number of waves, so the two ends meet and the picture tiles
  const hills = (x, W, y, amp, n, ph, fill, bottom) => { const f = (px) => y + amp * Math.sin(px / W * Math.PI * 2 * n + ph) + amp * .4 * Math.sin(px / W * Math.PI * 4 * n + ph * 2); x.fillStyle = fill; x.beginPath(); x.moveTo(0, bottom); for (let px = 0; px < W; px += 12) x.lineTo(px, f(px)); x.lineTo(W, f(W)); x.lineTo(W, bottom); x.closePath(); x.fill(); };
  const kelp = (x, bx, by, blades, fill) => { x.strokeStyle = fill; x.lineCap = "round"; for (const [lean, h, w] of blades) { x.lineWidth = w; x.beginPath(); x.moveTo(bx, by); x.bezierCurveTo(bx - lean * .6, by - h * .35, bx + lean * 1.4, by - h * .65, bx + lean, by - h); x.stroke(); } };
  const arcs = (x, list, stroke, lw, a) => { x.strokeStyle = stroke; x.lineWidth = lw; x.lineCap = "round"; x.globalAlpha = a; for (const [cx, cy, w] of list) { x.beginPath(); x.moveTo(cx - w / 2, cy); x.quadraticCurveTo(cx, cy - w * .16, cx + w / 2, cy); x.stroke(); } x.globalAlpha = 1; };
  const spots = (W, n) => Array.from({ length: n }, (_, i) => W * (i + .5) / n);
  const specks = (x, W, y0, y1, n, c, r, a) => { for (let i = 1; i <= n; i++) dot(x, (i * .6180339 % 1) * W, y0 + (i * .7548777 % 1) * (y1 - y0), r * (.6 + (i % 3) * .3), c, a); };
  const puffs = (x, cx, cy, s, fill) => { for (const [a, b, r] of [[-62, 8, 34], [-22, -12, 46], [28, -6, 40], [66, 10, 28], [0, 16, 44]]) dot(x, cx + a * s, cy + b * s, r * s, fill); };
  const star5 = (cx, cy, ro, ri, rot) => Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? ri : ro, a = -Math.PI / 2 + (rot || 0) + i * Math.PI / 5; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
  // what stands on each kingdom's skyline (c the land's colour, a a lighter one, y the ground line, dusk for the dark version)
  const DECO = {
    forest(x, W, y, c, a) { spots(W, W > 1000 ? 8 : 4).forEach((cx, i) => { const h = 150 + (i % 3) * 46; if (i % 2) { line(x, cx, y + 10, cx, y - h * .5, c, 18); dot(x, cx, y - h * .7, h * .36, c); dot(x, cx - h * .22, y - h * .5, h * .24, a, .5); } else for (let j = 0; j < 3; j++) poly(x, [[cx - (74 - j * 16), y - j * h * .27], [cx, y - h * (.5 + j * .27)], [cx + (74 - j * 16), y - j * h * .27]], j === 1 ? a : c); }); },
    water(x, W, y, c, a) { spots(W, W > 1000 ? 6 : 3).forEach((cx, i) => { kelp(x, cx, y + 20, [[-28, 210 + i % 2 * 50, 18], [24, 270 - i % 2 * 40, 16], [46, 170, 14]], a); blob(x, [[cx - 90, y + 20], [cx - 60, y - 30], [cx + 10, y - 44], [cx + 70, y - 22], [cx + 96, y + 20]], c); }); },
    fire(x, W, y, c, a, dusk) { spots(W, W > 1000 ? 2 : 1).forEach((cx) => { poly(x, [[cx - 340, y + 20], [cx - 80, y - 330], [cx + 80, y - 330], [cx + 340, y + 20]], c); ell(x, cx, y - 330, 80, 18, dusk ? "#ff7a2a" : "#ffd25e"); poly(x, [[cx - 22, y - 330], [cx + 24, y - 330], [cx + 62, y - 150], [cx + 26, y - 40], [cx + 8, y - 170]], dusk ? "#e8501e" : "#ff8a2a"); for (let i = 0; i < 4; i++) dot(x, cx - 30 + i * 22, y - 386 - i * 34, 22 - i * 3, a, .45); }); },
    ice(x, W, y, c, a) { spots(W, W > 1000 ? 5 : 3).forEach((cx, i) => { const h = 210 + (i % 3) * 70; poly(x, [[cx - 150, y + 20], [cx - 30, y - h], [cx + 40, y - h * .7], [cx + 150, y + 20]], c); poly(x, [[cx - 30, y - h], [cx + 40, y - h * .7], [cx + 8, y - h * .5], [cx - 22, y - h * .62], [cx - 62, y - h * .5]], "#ffffff"); poly(x, [[cx + 40, y - h * .7], [cx + 150, y + 20], [cx + 40, y + 20]], a, null); }); },
    air(x, W, y, c, a) { spots(W, W > 1000 ? 6 : 3).forEach((cx, i) => { puffs(x, cx, y - 150 - (i % 3) * 110, 1 + (i % 2) * .4, "rgba(255,255,255,.85)"); }); spots(W, W > 1000 ? 2 : 1).forEach((cx) => { const m = cx + 120; poly(x, [[m - 26, y + 10], [m - 15, y - 150], [m + 15, y - 150], [m + 26, y + 10]], a); for (let i = 0; i < 4; i++) { const t = .5 + i * Math.PI / 2; line(x, m, y - 150, m + Math.cos(t) * 92, y - 150 + Math.sin(t) * 92, c, 13); } dot(x, m, y - 150, 11, "#8fa8c0"); }); },
    sand(x, W, y, c, a) { spots(W, W > 1000 ? 3 : 2).forEach((cx, i) => { const s = 1 - i % 2 * .3; poly(x, [[cx - 190 * s, y + 18], [cx, y - 230 * s], [cx + 190 * s, y + 18]], c); poly(x, [[cx, y - 230 * s], [cx + 190 * s, y + 18], [cx + 44 * s, y + 18]], a); const q = cx + 215 * s; line(x, q, y + 10, q, y - 100, "#5f9a58", 22); line(x, q - 34, y - 42, q, y - 42, "#5f9a58", 13); line(x, q - 34, y - 42, q - 34, y - 78, "#5f9a58", 13); line(x, q + 32, y - 58, q, y - 58, "#5f9a58", 13); line(x, q + 32, y - 58, q + 32, y - 92, "#5f9a58", 13); }); },
    crystal(x, W, y, c, a) { spots(W, W > 1000 ? 8 : 4).forEach((cx, i) => { const h = 140 + (i % 3) * 90, w = 44 + (i % 2) * 18; poly(x, [[cx - w, y + 16], [cx - w, y - h * .72], [cx, y - h], [cx + w, y - h * .72], [cx + w, y + 16]], c); poly(x, [[cx, y - h], [cx + w, y - h * .72], [cx + w, y + 16], [cx + 6, y + 16]], a); line(x, cx - w * .5, y - h * .66, cx - w * .5, y - h * .24, "rgba(255,255,255,.4)", 5); }); specks(x, W, 40, y - 240, 24, "#cdb8ff", 4, .7); },
    night(x, W, y, c, a) { specks(x, W, 30, y - 180, 34, "#fff3c0", 4, .8); dot(x, W * .72, 170, 62, "#fff3c0", .1); poly(x, [], null); spots(W, W > 1000 ? 8 : 4).forEach((cx, i) => { const h = 150 + (i % 3) * 56; for (let j = 0; j < 3; j++) poly(x, [[cx - (68 - j * 15), y - j * h * .27], [cx, y - h * (.5 + j * .27)], [cx + (68 - j * 15), y - j * h * .27]], c); if (i % 2 === 0) { x.fillStyle = a; x.fillRect(cx + 60, y - 44, 58, 50); poly(x, [[cx + 52, y - 42], [cx + 89, y - 74], [cx + 126, y - 42]], c); dot(x, cx + 89, y - 18, 9, "#ffd76a"); } }); },
    storm(x, W, y, c, a) { for (let i = 0; i < (W > 1000 ? 40 : 20); i++) { const px = (i * .6180339 % 1) * W, py = (i * .7548777 % 1) * (y - 120) + 60; line(x, px, py, px - 14, py + 46, "rgba(220,235,255,.32)", 4); } spots(W, W > 1000 ? 6 : 3).forEach((cx, i) => puffs(x, cx, 150 + (i % 2) * 60, 1.9, i % 2 ? c : a)); spots(W, W > 1000 ? 2 : 1).forEach((cx) => poly(x, [[cx + 20, 240], [cx - 42, 400], [cx - 4, 400], [cx - 34, 520], [cx + 58, 356], [cx + 16, 356], [cx + 54, 240]], "#ffe27a")); },
    star(x, W, y, c, a) { specks(x, W, 20, y - 60, 60, "#ffffff", 4, .85); spots(W, W > 1000 ? 2 : 1).forEach((cx) => { const py = 230; x.strokeStyle = "#e8c98a"; x.lineWidth = 11; x.beginPath(); x.ellipse(cx + 150, py, 128, 30, -.3, 0, TAU); x.stroke(); dot(x, cx + 150, py, 78, "#e39a6a"); dot(x, cx + 128, py - 24, 22, "#f2bb8c", .8); poly(x, star5(cx - 190, 170, 34, 14), "#ffe27a"); }); spots(W, W > 1000 ? 4 : 2).forEach((cx) => { ell(x, cx, y + 16, 150, 62, c); ell(x, cx - 44, y - 2, 22, 8, a); }); }
  };
  // the sky, the far land with the kingdom's skyline on it, the near land
  function scene(x, Z, W, y, dusk) { const P = Z.pal; wash(x, 0, y + 90, dusk ? P.dusk[0] : P.sky[0], dusk ? P.dusk[1] : P.sky[1], W); hills(x, W, y - 62, 24, W > 1000 ? 4 : 2, 1, dusk ? P.dfar : P.far, y + 90); DECO[Z.deco](x, W, y - 20, dusk ? P.dfar : P.far, dusk ? P.dnear : P.near, dusk); hills(x, W, y - 12, 15, W > 1000 ? 6 : 3, 2.4, dusk ? P.dnear : P.near, y + 90); }
  const PAINT = {
    // Buried Treasure: the kingdom's ground, nine places to dig in it
    carrots(x, Z) { const P = Z.pal; scene(x, Z, VW, 600, false); const g = x.createLinearGradient(0, 580, 0, VH); g.addColorStop(0, P.gr[0]); g.addColorStop(1, P.gr[1]); hills(x, VW, 604, 8, 3, .6, g, VH); arcs(x, [[150, 670, 90], [600, 690, 110], [395, 815, 80], [210, 985, 100], [585, 990, 90], [300, 1180, 120], [520, 1220, 100], [130, 1140, 70]], P.line, 5, .55); },
    // Glow Catch: the same land at dusk, so whatever glows can be seen
    fireflies(x, Z) { const P = Z.pal; wash(x, 0, VH, P.dusk[0], P.dusk[1]); specks(x, VW, 120, 900, 16, P.spark, 4, .45); x.save(); x.translate(0, 300); DECO[Z.deco](x, VW, 830, P.dfar, P.dnear, true); x.restore(); hills(x, VW, 1124, 16, 3, 1.2, P.dfar, VH); hills(x, VW, 1168, 12, 2, 2.6, P.dnear, VH); },
    // Turtle Hop: the far shore over what there is to fall into (two pages wide; nothing crosses the seam)
    lilypads(x, Z) { const P = Z.pal, W = 1560; scene(x, Z, W, 700, false); wash(x, 690, VH, P.liq[0], P.liq[1], W); x.fillStyle = P.foam; x.globalAlpha = .4; x.fillRect(0, 690, W, 5); x.globalAlpha = 1; arcs(x, [[140, 760, 70], [520, 790, 90], [860, 750, 80], [1250, 800, 90], [330, 850, 110], [1020, 870, 120], [700, 930, 130], [1400, 950, 110], [180, 1010, 120]], P.foam, 5, .6); },
    // Mordo's Shells: a plank table in the kingdom
    nests(x, Z) { const P = Z.pal, [top, dark, light] = P.tb; scene(x, Z, VW, 790, false); const g = x.createLinearGradient(0, 930, 0, VH); g.addColorStop(0, P.gr[0]); g.addColorStop(1, P.gr[1]); x.fillStyle = g; x.fillRect(0, 930, VW, VH - 930);
      x.fillStyle = top; x.fillRect(0, 786, VW, 110); x.fillStyle = dark; x.fillRect(0, 896, VW, 44); x.fillStyle = light; x.fillRect(0, 786, VW, 10); x.strokeStyle = dark; x.lineWidth = 4; for (const px of [70, 210, 350, 490, 630, 760]) { x.beginPath(); x.moveTo(px, 796); x.lineTo(px - 14, 896); x.stroke(); } for (const [px, py] of [[90, 812], [228, 812], [368, 812], [508, 812], [648, 812], [80, 880], [218, 880], [358, 880], [498, 880], [638, 880]]) dot(x, px, py, 5, dark);
      arcs(x, [[160, 1010, 100], [560, 1060, 110], [330, 1200, 120], [640, 1230, 80]], P.line, 5, .55); }
  };
  const BG = {}, canvasOf = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  // only one kingdom's big pictures are kept at a time (a page is 4 MB of memory); going to another kingdom paints that one's once
  let bgK = -1; function bg(name, Z) { if (bgK !== Z.k) { for (const n in BG) delete BG[n]; bgK = Z.k; } if (BG[name]) return BG[name]; const c = canvasOf(name === "lilypads" ? 1560 : VW, VH); PAINT[name](c.getContext("2d"), Z); return (BG[name] = c); }
  // a small picture of a game in a kingdom (the playground's grid, the invitation in a boss's chest): painted once at that size, kept as a URL
  const THUMB = {}, CROP = { carrots: [90, 330], fireflies: [90, 640], lilypads: [130, 360], nests: [20, 420] };
  const themeOf = (k) => Object.assign(KT[k], { k });
  function thumb(name, k) { if (!PAINT[name]) return ""; const n = kingdomFor(name, { kingdom: k }), id = name + n; if (THUMB[id] !== undefined) return THUMB[id]; let u = ""; try { if (typeof document === "object") { const c = canvasOf(300, 220), x = c.getContext("2d"), s = 300 / 600; x.setTransform(s, 0, 0, s, -CROP[name][0] * s, -CROP[name][1] * s); PAINT[name](x, themeOf(n)); u = c.toDataURL("image/jpeg", .85); } } catch (e) { u = ""; } return (THUMB[id] = u); }

  // the small things drawn in code, each once, into a canvas of its own. PROP: a badger, two fish, an icicle, the Turnip; PADS: what Pogo hops on (300 x 170)
  const PROP = {
    badger(x) { ell(x, 128, 170, 86, 66, "#6d6a70", "#3a383e", 6); ell(x, 128, 196, 52, 34, "#d8d4cc"); ell(x, 66, 72, 20, 22, "#3a383e"); ell(x, 190, 72, 20, 22, "#3a383e"); ell(x, 128, 112, 74, 62, "#fbf7ee", "#3a383e", 6); x.save(); x.beginPath(); x.ellipse(128, 112, 71, 59, 0, 0, TAU); x.clip(); for (const s of [-1, 1]) poly(x, [[128 + s * 20, 44], [128 + s * 56, 44], [128 + s * 44, 128], [128 + s * 22, 150], [128 + s * 13, 110]], "#2c2a30"); x.restore(); dot(x, 96, 104, 9, "#fff"); dot(x, 160, 104, 9, "#fff"); dot(x, 97, 105, 5, "#141216"); dot(x, 159, 105, 5, "#141216"); ell(x, 128, 146, 13, 9, "#141216"); line(x, 112, 164, 144, 164, "#3a383e", 4); },
    fish(x) { fishy(x, "#7fc4ea", "#3f88b8", "#d6f0fb"); }, goldfish(x) { fishy(x, "#ffcc4a", "#d0861c", "#fff0b0"); },
    shard(x) { poly(x, [[70, 26], [186, 26], [156, 96], [138, 232], [116, 150], [96, 92]], "#bfe6f8", "#5e9fc8", 7); poly(x, [[128, 26], [186, 26], [156, 96], [138, 232], [128, 120]], "#8ccbea"); line(x, 92, 44, 112, 104, "#fff", 8); },
    turnip(x) { x.fillStyle = "#6f6a72"; x.fillRect(20, 232, 340, 22); x.fillStyle = "#8f8a92"; x.fillRect(20, 232, 340, 7); for (const px of [70, 190, 310]) { x.fillStyle = "#57525a"; x.fillRect(px - 12, 254, 24, 46); }
      x.fillStyle = "#3f7d52"; x.beginPath(); x.roundRect(214, 66, 118, 132, 12); x.fill(); x.fillStyle = "#2f5f40"; x.fillRect(204, 56, 138, 16); x.fillStyle = "#cfeef2"; x.beginPath(); x.roundRect(240, 92, 66, 52, 8); x.fill(); x.fillStyle = "#b676c4"; x.beginPath(); x.roundRect(60, 112, 176, 88, 40); x.fill(); x.fillStyle = "#f3e9f2"; x.beginPath(); x.roundRect(60, 112, 100, 88, 40); x.fill(); x.fillStyle = "#b676c4"; x.fillRect(136, 112, 40, 88); for (const px of [100, 160, 214]) line(x, px, 116, px, 196, "#8f5a9c", 4);
      x.fillStyle = "#3a383e"; x.fillRect(84, 66, 34, 50); x.fillRect(76, 56, 50, 14); line(x, 186, 112, 180, 74, "#5fb06a", 13); line(x, 186, 112, 208, 78, "#74c47e", 11); dot(x, 52, 158, 15, "#ffe27a"); x.fillStyle = "#2f5f40"; x.fillRect(46, 198, 292, 16); for (const [px, r] of [[106, 32], [190, 32], [290, 40]]) { dot(x, px, 226 - (r - 32), r, "#2c2a30"); dot(x, px, 226 - (r - 32), r * .55, "#e0b050"); dot(x, px, 226 - (r - 32), r * .18, "#2c2a30"); } }
  };
  function fishy(x, c, d, l) { poly(x, [[196, 128], [246, 84], [236, 128], [246, 172]], d); ell(x, 118, 128, 92, 54, c, d, 6); ell(x, 104, 148, 56, 22, l); poly(x, [[112, 78], [150, 44], [168, 84]], d); dot(x, 62, 114, 13, "#fff"); dot(x, 59, 115, 7, "#141216"); line(x, 92, 96, 86, 160, d, 5); }
  const PADS = {
    log(x) { x.fillStyle = "#94643a"; x.beginPath(); x.roundRect(18, 60, 264, 76, 38); x.fill(); x.strokeStyle = "#5c3b1f"; x.lineWidth = 6; x.stroke(); for (const [a, b] of [[60, 78], [112, 110], [150, 84], [206, 116]]) line(x, a, b, a + 34, b, "#6e4826", 5); ell(x, 248, 98, 28, 36, "#e6bd84", "#5c3b1f", 6); ell(x, 248, 98, 14, 20, null, "#a87a48", 4); },
    stump(x) { ell(x, 150, 104, 116, 42, "#7a5230", "#4f341c", 6); x.fillStyle = "#7a5230"; x.fillRect(36, 72, 228, 34); ell(x, 150, 70, 114, 40, "#e6bd84", "#5c3b1f", 6); ell(x, 150, 70, 74, 25, null, "#b88a54", 4); ell(x, 150, 70, 34, 11, null, "#b88a54", 4); },
    lily(x) { ell(x, 150, 92, 132, 58, "#4faa62", "#2c7a44", 6); poly(x, [[150, 92], [268, 64], [282, 92]], "#3a8a55"); for (const a of [-2.5, -1.7, -.9, 2.4, 1.5, .7]) line(x, 150, 92, 150 + Math.cos(a) * 112, 92 + Math.sin(a) * 46, "#7cc98a", 4); for (const a of [-1.2, -.4, .4, 1.2]) ell(x, 104 + Math.sin(a) * 26, 64 - Math.cos(a) * 12, 12, 24, "#ffc4d6", null, 0, a); dot(x, 104, 62, 9, "#ffe27a"); },
    crust(x) { blob(x, [[20, 92], [62, 50], [150, 40], [246, 52], [284, 96], [230, 134], [120, 138], [46, 128]], "#54404a"); blob(x, [[46, 86], [84, 60], [150, 54], [228, 62], [258, 90], [214, 112], [120, 116], [66, 108]], "#7a5e62"); for (const [a, b, c, d] of [[96, 64, 124, 98], [124, 98, 170, 90], [170, 90, 210, 70], [124, 98, 112, 118]]) line(x, a, b, c, d, "#ff8a2a", 5); },
    basalt(x) { poly(x, [[36, 112], [58, 50], [128, 30], [212, 34], [266, 62], [270, 116], [200, 144], [90, 144]], "#2e2830", "#16121a", 6); poly(x, [[60, 62], [128, 40], [208, 44], [254, 68], [190, 86], [104, 84]], "#4a424e"); line(x, 128, 42, 104, 84, "#2e2830", 4); line(x, 208, 44, 190, 86, "#2e2830", 4); },
    floe(x) { poly(x, [[18, 96], [52, 58], [128, 46], [210, 52], [282, 84], [258, 118], [160, 132], [58, 126]], "#7fbfe0"); poly(x, [[18, 84], [52, 46], [128, 34], [210, 40], [282, 72], [258, 104], [160, 118], [58, 112]], "#f4fcff", "#8cc4e0", 5); line(x, 118, 54, 150, 90, "#a8d8ee", 4); line(x, 150, 90, 138, 112, "#a8d8ee", 4); line(x, 150, 90, 206, 78, "#a8d8ee", 4); },
    berg(x) { poly(x, [[24, 124], [40, 70], [98, 28], [176, 22], [250, 50], [278, 118], [160, 150]], "#6fb0d4"); poly(x, [[34, 96], [50, 56], [100, 22], [174, 16], [242, 42], [266, 92], [160, 122]], "#ffffff", "#8cc4e0", 5); poly(x, [[174, 16], [242, 42], [266, 92], [182, 74]], "#d4ecf8"); },
    wisp(x) { x.globalAlpha = .82; puffs(x, 150, 92, 1.34, "#ffffff"); x.globalAlpha = 1; arcs(x, [[92, 112, 64], [190, 118, 74]], "#bcdcf0", 4, 1); },
    puff(x) { puffs(x, 150, 96, 1.58, "#c5e2f4"); puffs(x, 150, 84, 1.56, "#ffffff"); ell(x, 116, 62, 30, 11, "#ffffff"); },
    carpet(x) { poly(x, [[34, 62], [266, 62], [286, 118], [14, 118]], "#c43e4e", "#7c2230", 5); poly(x, [[56, 72], [244, 72], [258, 108], [42, 108]], "#f0b84a"); poly(x, [[150, 76], [212, 90], [150, 104], [88, 90]], "#2f6fa0"); poly(x, [[150, 84], [182, 90], [150, 97], [118, 90]], "#fff0c8"); for (let i = 0; i < 14; i++) line(x, 20 + i * 20, 120, 18 + i * 20, 136, "#f0d48a", 4); },
    dune(x) { blob(x, [[6, 150], [60, 92], [128, 44], [190, 52], [250, 100], [296, 150]], "#d39a50"); blob(x, [[20, 148], [78, 90], [130, 50], [150, 52], [120, 104], [116, 148]], "#f6d592"); arcs(x, [[194, 110, 70], [216, 132, 60]], "#b9843f", 4, .7); },
    shard(x) { poly(x, [[22, 110], [76, 42], [150, 26], [232, 44], [280, 108], [200, 142], [90, 142]], "#6a4fd0", "#3b2a8c", 6); poly(x, [[76, 42], [150, 26], [150, 142], [90, 142], [22, 110]], "#a28cf4"); poly(x, [[150, 26], [232, 44], [196, 92], [150, 90]], "#d6c8ff"); line(x, 92, 62, 118, 110, "#fff", 5); },
    slab(x) { poly(x, [[52, 60], [248, 60], [282, 96], [248, 134], [52, 134], [18, 96]], "#4a3c8e", "#2a2060", 6); poly(x, [[60, 66], [240, 66], [268, 88], [240, 110], [60, 110], [32, 88]], "#8a78dc"); line(x, 60, 66, 240, 66, "#c8bcff", 5); },
    lantern(x) { poly(x, [[28, 104], [272, 104], [228, 142], [72, 142]], "#e9e2cf", "#a8987a", 5); poly(x, [[118, 104], [150, 86], [182, 104]], "#c8bc9e"); dot(x, 150, 58, 56, "#ffcf6a", .35); x.fillStyle = "#ffb84a"; x.beginPath(); x.roundRect(112, 26, 76, 72, 22); x.fill(); x.strokeStyle = "#a85a1e"; x.lineWidth = 5; x.stroke(); for (const px of [132, 150, 168]) line(x, px, 30, px, 94, "#d88a30", 3); x.fillStyle = "#6a3a1e"; x.fillRect(124, 18, 52, 9); x.fillRect(124, 96, 52, 9); },
    stone(x) { blob(x, [[20, 118], [50, 62], [120, 36], [210, 44], [272, 84], [270, 130], [150, 150], [50, 144]], "#3f4668"); blob(x, [[44, 96], [76, 58], [130, 46], [204, 56], [242, 86], [190, 104], [100, 108]], "#6a7498"); },
    umbrella(x) { x.save(); x.beginPath(); x.moveTo(16, 92); x.quadraticCurveTo(150, 186, 284, 92); x.quadraticCurveTo(150, 60, 16, 92); x.closePath(); x.fillStyle = "#e0505a"; x.fill(); x.clip(); x.fillStyle = "#ffe27a"; for (const px of [60, 150, 240]) x.fillRect(px - 20, 50, 40, 110); x.restore(); ell(x, 150, 92, 134, 30, "#a8323e", "#7a2030", 5); ell(x, 150, 90, 112, 21, "#d65660"); for (const a of [40, 95, 150, 205, 260]) line(x, 150, 92, a, a === 150 ? 72 : 88, "#7a2030", 3); dot(x, 150, 92, 7, "#fff"); },
    barrel(x) { ell(x, 150, 118, 112, 34, "#7c5230", "#4f341c", 6); x.fillStyle = "#94683f"; x.fillRect(38, 60, 224, 60); ell(x, 150, 60, 112, 34, "#c49660", "#4f341c", 6); ell(x, 150, 60, 84, 22, "#5e8cb0"); x.fillStyle = "#54484a"; x.fillRect(38, 88, 224, 9); x.fillRect(38, 110, 224, 7); },
    starlet(x) { poly(x, star5(150, 92, 92, 44), "#ffd84a", "#c88a1e", 6); poly(x, star5(150, 90, 56, 26), "#fff2a8"); },
    rock(x) { blob(x, [[20, 118], [44, 58], [118, 30], [212, 40], [276, 86], [268, 134], [150, 150], [50, 144]], "#8e8eb4"); blob(x, [[40, 92], [66, 54], [124, 40], [204, 50], [248, 84], [188, 104], [96, 106]], "#c0c0dc"); for (const [a, b, r] of [[104, 68, 16], [176, 62, 11], [206, 88, 8], [132, 92, 9]]) ell(x, a, b, r * 1.3, r * .7, "#8e8eb4"); }
  };
  const ART = {}, once = (id, w, h, draw) => { if (ART[id]) return ART[id]; const c = canvasOf(w, h); draw(c.getContext("2d")); return (ART[id] = c); };
  const propArt = (n) => n === "turnip" ? once("p:turnip", 380, 300, PROP.turnip) : PADS[n] ? once("pad:" + n, 300, 170, PADS[n]) : once("p:" + n, 256, 256, PROP[n]);
  // a cup of Mordo's game (260 x 260, standing on its rim)
  function cupArt(Z) { const { cup, c } = Z.cups, [b, d, l] = c; return once("cup:" + cup, 260, 260, (x) => {
    const dome = (fill, stroke) => { x.beginPath(); x.moveTo(34, 232); x.bezierCurveTo(30, 110, 70, 34, 130, 34); x.bezierCurveTo(190, 34, 230, 110, 226, 232); x.quadraticCurveTo(130, 262, 34, 232); x.closePath(); x.fillStyle = fill; x.fill(); if (stroke) { x.lineWidth = 7; x.strokeStyle = stroke; x.stroke(); } };
    if (cup === "cloud") { puffs(x, 130, 150, 1.5, d); puffs(x, 130, 138, 1.48, b); ell(x, 92, 104, 30, 14, l); return; }
    if (cup === "bucket") { poly(x, [[44, 52], [216, 52], [196, 240], [64, 240]], b, d, 7); x.strokeStyle = d; x.lineWidth = 6; x.beginPath(); x.arc(130, 60, 86, Math.PI, 0); x.stroke(); ell(x, 130, 52, 86, 17, d, d, 4); ell(x, 130, 52, 74, 11, "#3f4e5c"); for (const y of [108, 190]) { x.fillStyle = d; x.fillRect(52 + (y - 52) * .1, y, 156 - (y - 52) * .2, 8); } line(x, 80, 80, 90, 216, l, 9); return; }
    if (cup === "jar") { poly(x, [[100, 18], [160, 18], [152, 56], [108, 56]], d); x.beginPath(); x.moveTo(108, 54); x.bezierCurveTo(30, 76, 20, 190, 74, 240); x.lineTo(186, 240); x.bezierCurveTo(240, 190, 230, 76, 152, 54); x.closePath(); x.fillStyle = b; x.fill(); x.strokeStyle = d; x.lineWidth = 7; x.stroke(); x.fillStyle = d; x.fillRect(46, 122, 168, 8); x.fillRect(50, 160, 160, 8); for (let i = 0; i < 6; i++) poly(x, [[62 + i * 24, 132], [74 + i * 24, 158], [86 + i * 24, 132]], l); line(x, 76, 90, 62, 112, l, 8); return; }
    dome(b, d); x.save(); x.beginPath(); x.moveTo(34, 232); x.bezierCurveTo(30, 110, 70, 34, 130, 34); x.bezierCurveTo(190, 34, 230, 110, 226, 232); x.quadraticCurveTo(130, 262, 34, 232); x.closePath(); x.clip();
    if (cup === "acorn") { ell(x, 130, 58, 130, 76, d); for (let r = 0; r < 4; r++) for (let i = 0; i < 9; i++) ell(x, 22 + i * 27 + (r % 2) * 13, 26 + r * 25, 13, 10, r % 2 ? l : b, d, 3); x.fillStyle = l; x.globalAlpha = .55; x.fillRect(58, 150, 22, 70); x.globalAlpha = 1; }
    else if (cup === "pot") { x.fillStyle = d; x.fillRect(0, 96, 260, 9); x.fillRect(0, 168, 260, 9); for (let i = 0; i < 8; i++) poly(x, [[12 + i * 32, 164], [28 + i * 32, 110], [44 + i * 32, 164]], l); ell(x, 88, 62, 22, 11, l); }
    else if (cup === "ice") { poly(x, [[30, 240], [90, 40], [130, 130]], l); poly(x, [[130, 130], [200, 44], [240, 240]], "#a4dcf0"); poly(x, [[130, 130], [90, 40], [200, 44]], "#e8f8ff"); line(x, 76, 170, 104, 96, "#fff", 8); }
    else if (cup === "geode") { for (let i = 0; i < 7; i++) poly(x, [[20 + i * 34, 262], [34 + i * 34, 196 - (i % 3) * 16], [52 + i * 34, 262]], i % 2 ? "#c9a4ff" : "#8f6ae8"); for (const [a, e] of [[64, 90], [150, 70], [190, 130], [96, 150]]) ell(x, a, e, 22, 12, d); ell(x, 92, 62, 18, 9, l); }
    else if (cup === "lamp") { for (const px of [78, 130, 182]) { x.strokeStyle = d; x.lineWidth = 5; x.beginPath(); x.moveTo(130, 30); x.quadraticCurveTo(px + (px - 130) * .9, 130, px, 240); x.stroke(); } x.fillStyle = "#5a3418"; x.fillRect(0, 214, 260, 26); x.fillRect(90, 28, 80, 16); dot(x, 130, 138, 66, l, .5); }
    else if (cup === "moon") { for (const [a, e, r] of [[84, 92, 24], [170, 80, 17], [188, 158, 26], [106, 178, 19], [140, 128, 12]]) { ell(x, a, e, r, r * .8, d); ell(x, a + 3, e + 3, r * .78, r * .6, l); } }
    x.restore(); dome("rgba(0,0,0,0)", d); }); }
  // a mound (260 x 190, its middle at 130, 130) and the pit it leaves (260 x 120)
  function moundArt(Z) { const [f, s, h, , , , , m] = Z.dig.c; return once("mound:" + Z.id, 260, 190, (x) => { ell(x, 130, 138, 106, 22, "rgba(40,24,12,.2)"); x.fillStyle = f; x.strokeStyle = s; x.lineWidth = 6; x.beginPath(); x.ellipse(130, 130, 92, 72, 0, Math.PI, TAU); x.ellipse(130, 130, 92, 18, 0, 0, Math.PI); x.closePath(); x.fill(); x.stroke(); ell(x, 100, 88, 24, 10, h, null, 0, -.45);
    const marks = [[92, 118], [130, 98], [168, 112], [116, 136], [156, 136], [146, 78]], kind = Z.dig.mark; for (const [a, b] of marks) { if (kind === "leaf") ell(x, a, b, 13, 6, m, null, 0, a * .05); else if (kind === "gem") poly(x, [[a, b - 11], [a + 8, b], [a, b + 11], [a - 8, b]], m); else if (kind === "puff") dot(x, a, b, 13, m); else if (kind === "crater") { ell(x, a, b, 12, 6, m); ell(x, a + 1, b + 2, 8, 3, h); } else dot(x, a, b, 4.5, m); } }); }
  function pitArt(Z) { const [, s, , p, q] = Z.dig.c; return once("pit:" + Z.id, 260, 120, (x) => { ell(x, 130, 60, 80, 26, p, s, 5); ell(x, 130, 65, 62, 17, q); }); }
  // the splash and ripple sheets, in the colour of what is splashed
  function tinted(im, id, c) { if (!im) return im; return once(id, im.width, im.height, (x) => { x.drawImage(im, 0, 0); x.globalCompositeOperation = "source-atop"; x.globalAlpha = .72; x.fillStyle = c; x.fillRect(0, 0, im.width, im.height); x.globalAlpha = 1; x.globalCompositeOperation = "source-over"; }); }
  // what is in front of whatever floats, at the pads' own pace
  function front(Z) { const id = "front:" + Z.id; return once(id, 1560, 340, (x) => { const W = 1560, g = x.createLinearGradient(0, 0, 0, 340), wave = (px) => 20 + 9 * Math.sin(px / W * Math.PI * 12); g.addColorStop(0, Z.pal.liq[0]); g.addColorStop(1, Z.pal.liq[1]); x.fillStyle = g; x.beginPath(); x.moveTo(0, 340); for (let px = 0; px <= W; px += 20) x.lineTo(px, wave(px)); x.lineTo(W, 340); x.closePath(); x.fill();
    x.strokeStyle = Z.pal.foam; x.lineWidth = 5; x.lineCap = "round"; x.beginPath(); for (let px = 0; px <= W; px += 20) { if (px) x.lineTo(px, wave(px)); else x.moveTo(px, wave(px)); } x.stroke(); arcs(x, [[180, 110, 110], [620, 150, 130], [1010, 100, 100], [1380, 160, 120], [400, 240, 120], [860, 270, 110], [1240, 250, 130]], Z.pal.foam, 5, .4); }); }

  // ---------------------------------------------------------------- the layer
  const css = `
  #miniOv { position: fixed; inset: 0; z-index: 60; background: #123a52; display: flex; justify-content: center; touch-action: none; user-select: none; -webkit-user-select: none; }
  #miniOv[hidden] { display: none; }
  #miniOv .mst { position: relative; width: min(100vw, 520px); height: 100%; overflow: hidden; background: #8fdbe4; }
  #miniOv canvas.mcv { position: absolute; inset: 0; width: 100%; height: 100%; display: block; }
  #miniOv .mpogo { position: absolute; left: 0; top: 0; pointer-events: none; transform-origin: 50% 100%; will-change: transform; }
  #miniOv .mpogo .pa { width: 100%; height: 100%; }
  #miniOv .mhud { position: absolute; left: 0; right: 0; top: 0; padding: max(10px, env(safe-area-inset-top)) 12px 0; display: flex; align-items: center; gap: 8px; pointer-events: none; }
  #miniOv .mhud > * { pointer-events: auto; }
  #miniOv .mx { width: 42px; height: 42px; border-radius: 50%; border: 0; font-family: inherit; font-weight: 900; font-size: 24px; line-height: 1; color: #1d4560; background: #fff8e6; box-shadow: 0 3px 0 #7fb4c4, 0 6px 14px rgba(0,0,0,.25); cursor: pointer; }
  #miniOv .mtitle { flex: 1; text-align: center; font-weight: 900; font-size: 17px; color: #1d4560; background: rgba(255,248,230,.94); border-radius: 14px; padding: 8px 10px; box-shadow: 0 3px 0 #7fb4c4, 0 6px 14px rgba(0,0,0,.2); }
  #miniOv .mstat { min-width: 84px; text-align: center; font-weight: 900; font-size: 16px; color: #1d4560; background: rgba(255,248,230,.94); border-radius: 14px; padding: 8px 10px; box-shadow: 0 3px 0 #7fb4c4, 0 6px 14px rgba(0,0,0,.2); }
  #miniOv .mstat:empty { visibility: hidden; }
  #miniOv .mbtns { position: absolute; left: 0; right: 0; bottom: max(18px, env(safe-area-inset-bottom)); display: flex; justify-content: center; gap: 10px; pointer-events: none; }
  #miniOv .mbtns .btn { pointer-events: auto; }
  #miniOv .msay { position: absolute; left: 50%; top: 16%; transform: translateX(-50%); white-space: nowrap; font-weight: 900; font-size: clamp(19px, 6vw, 26px); color: #fff8e6; text-shadow: 0 3px 0 #1d4560, 0 0 18px rgba(0,0,0,.35); pointer-events: none; }
  #miniOv .mcard { position: absolute; inset: 0; display: grid; place-items: center; background: rgba(18,58,82,.5); padding: 16px; }
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
  .mpgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 0 14px; }
  .mpgrid button { border: 0; border-radius: 16px; padding: 10px 6px 8px; font: inherit; font-weight: 900; font-size: 14px; color: #4a2a14; background: #fff8e6; box-shadow: 0 4px 0 #b8925e, 0 8px 16px rgba(0,0,0,.2); cursor: pointer; }
  .mpmode { display: flex; gap: 6px; justify-content: center; margin: 6px 0 2px; } .mpmode button { display: inline-flex; align-items: center; gap: 4px; border: 2px solid #b8925e; border-radius: 99px; padding: 5px 12px; font: inherit; font-weight: 900; font-size: 13px; color: #4a2a14; background: #fff8e6; cursor: pointer; }
  .mpmode button.on { background: #4a2a14; color: #fff8e6; border-color: #4a2a14; } .mpmode .ico { width: 18px; height: 18px; display: inline-block; } .mpmode .ico svg { width: 100%; height: 100%; } .mpgrid.poor button { opacity: .55; }
  .mpgrid img { display: block; width: 100%; height: 74px; object-fit: cover; border-radius: 10px; margin-bottom: 6px; }`;
  let ov = null, cv, X, pogoEl, hud, btns, cardEl, say, run = null;
  function build() { if (ov) return; const st = document.createElement("style"); st.id = "miniCss"; st.textContent = css; document.head.appendChild(st);
    ov = document.createElement("div"); ov.id = "miniOv"; ov.hidden = true; ov.innerHTML = `<div class="mst"><canvas class="mcv"></canvas><div class="mpogo"></div><div class="mhud"><button type="button" class="mx" aria-label="Close">×</button><div class="mtitle"></div><div class="mstat"></div></div><div class="msay"></div><div class="mbtns"></div><div class="mcard" hidden></div></div>`;
    document.body.appendChild(ov); cv = ov.querySelector("canvas"); X = cv.getContext("2d"); pogoEl = ov.querySelector(".mpogo"); hud = { title: ov.querySelector(".mtitle"), stat: ov.querySelector(".mstat") }; btns = ov.querySelector(".mbtns"); cardEl = ov.querySelector(".mcard"); say = ov.querySelector(".msay");
    ov.querySelector(".mx").addEventListener("click", () => run && run.quit());
    cv.addEventListener("pointerdown", (e) => { if (run && run.g.down) { e.preventDefault(); run.g.down(pt(e), e); } });
    cv.addEventListener("pointerup", (e) => { if (run && run.g.up) run.g.up(pt(e), e); }); cv.addEventListener("pointercancel", (e) => { if (run && run.g.up) run.g.up(pt(e), e); });
    addEventListener("resize", () => run && fit()); }
  // the page is laid out in the art's own units: VW x VH (780 x 1300, portrait), shown "cover" and anchored to the bottom. The canvas's place on
  // the screen is read here, when the layer opens or the window changes, never in a frame or a tap
  let view = { s: 1, ox: 0, oy: 0, w: 0, h: 0, d: 1, l: 0, t: 0 }; const V = { x0: 0, x1: VW, y0: 0, y1: VH };
  function fit() { const r = ov.querySelector(".mst").getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2); cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); const s = Math.max(r.width / VW, r.height / VH);
    view = { s, ox: (r.width - VW * s) / 2, oy: r.height - VH * s, w: r.width, h: r.height, d, l: r.left, t: r.top };
    V.x0 = Math.max(0, -view.ox / s); V.x1 = Math.min(VW, (view.w - view.ox) / s); V.y0 = Math.max(0, -view.oy / s); if (run && run.g.fit) run.g.fit(); }
  const pt = (e) => ({ x: (e.clientX - view.l - view.ox) / view.s, y: (e.clientY - view.t - view.oy) / view.s, sx: e.clientX - view.l, sy: e.clientY - view.t });
  const toScreen = (x, y) => ({ x: view.ox + x * view.s, y: view.oy + y * view.s });
  // the part of the page that is on screen, in art units (a phone shows less of the width than a wide window; y0 is what lies under the HUD)
  const vis = () => V, topY = () => V.y0;
  // Pogo is an element over the canvas: sized once, then moved and squashed with a transform only
  let PGW = 0, PGH = 0;
  function pogo(name, x, y, h, then) { PGH = h * view.s; PGW = PGH * 400 / 440; pogoEl.style.width = PGW.toFixed(1) + "px"; pogoEl.style.height = PGH.toFixed(1) + "px"; pogoMove(x, y, 1);
    if (name) { if (!pogoEl.firstElementChild && typeof paHtml === "function") pogoEl.innerHTML = paHtml(name); const el = pogoEl.firstElementChild; if (el && typeof paPlay === "function") paPlay(el, name, then); } }
  function pogoMove(x, y, sq, a) { const px = view.ox + x * view.s - PGW / 2, py = view.oy + y * view.s - PGH; pogoEl.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) scale(${(2 - sq).toFixed(3)}, ${sq.toFixed(3)})`; const o = a === undefined || a >= 1 ? "" : String(Math.max(0, a).toFixed(2)); if (pogoEl._o !== o) { pogoEl._o = o; pogoEl.style.opacity = o; } }
  // a reaction, then back to idling (the rig's one-shot clips end on their last pose)
  function pogoAct(name, then) { const el = pogoEl.firstElementChild; if (!el || typeof paPlay !== "function") return; const loopOK = name === "idle" || name === "worry" || name === "dash"; paPlay(el, name, then || (loopOK || name === "sad" || name === "win" ? null : () => { if (run && el.isConnected) paPlay(el, "idle"); })); }
  let sayT = 0; function shout(t, ms) { say.textContent = t; clearTimeout(sayT); const k = typeof KF === "function" ? KF("toast") : null; if (k && say.animate) say.animate(k.frames, { duration: k.duration }); say.style.opacity = 1; sayT = setTimeout(() => { say.style.opacity = 0; }, ms || 1100); }
  const sfx = (k, ...a) => { try { if (typeof SFX === "object" && SFX[k]) SFX[k](...a); } catch (e) {} }, hap = (p) => { try { if (typeof buzz === "function") buzz(p); } catch (e) {} };
  function setBtns(list) { btns.innerHTML = ""; for (const [label, fn, ghost] of list) { const b = document.createElement("button"); b.type = "button"; b.className = "btn" + (ghost ? " ghost" : ""); b.textContent = T(label); b.addEventListener("click", fn); btns.appendChild(b); } }
  // a game's own timers run on the game's clock (run.t), not the wall's: they wait while the page is hidden, stay in step with the keyed
  // motions on a slow frame, and are gone with the game when the layer closes
  const later = (fn, ms) => { if (run) run.q.push({ at: run.t + ms, fn }); };

  // ---------------------------------------------------------------- the frame loop (only while a game is open, and not while the page is hidden)
  let raf = 0, last = 0; const FK = {};
  function loop(now) { raf = 0; if (!run) return; if (document.hidden) { last = 0; raf = requestAnimationFrame(loop); return; } const dt = last ? Math.min(50, now - last) : 16.7; last = now; run.t += dt;
    for (let i = 0, q = run.q; i < q.length; i++) if (q[i].at <= run.t) { const fn = q[i].fn; q.splice(i--, 1); fn(); if (!run) return; }
    const x = X; x.setTransform(view.d, 0, 0, view.d, 0, 0); x.clearRect(0, 0, view.w, view.h); x.translate(view.ox, view.oy); x.scale(view.s, view.s); run.g.draw(x, run.t, dt);
    for (let i = run.fx.length - 1; i >= 0; i--) { const f = run.fx[i]; f.t += dt; if (f.draw(x, f.t) === false) run.fx.splice(i, 1); }
    if (run) raf = requestAnimationFrame(loop); }
  const start = () => { last = 0; if (!raf) raf = requestAnimationFrame(loop); };
  // the win moment every game shares: eight short rays thrown out from a point (made when it happens, drawn by the loop until it has faded)
  function rays(x, e) { if (e >= KLEN("burst")) return false; K("burst", e, FK); x.globalAlpha = FK.a; x.strokeStyle = this.c; x.lineWidth = 9; x.lineCap = "round"; x.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + .2, c = Math.cos(a), s = Math.sin(a), r0 = this.r * (.3 + .5 * FK.s), r1 = this.r * (.55 + .75 * FK.s); x.moveTo(this.x + c * r0, this.y + s * r0); x.lineTo(this.x + c * r1, this.y + s * r1); } x.stroke(); x.globalAlpha = 1; }
  const burst = (x, y, r, c) => { if (run) run.fx.push({ t: 0, x, y, r: r || 90, c: c || "#fff3b0", draw: rays }); };
  function ring(x, cx, cy, e, r, c) { K("miss", e, FK); x.globalAlpha = FK.a; x.strokeStyle = c; x.lineWidth = 5; x.beginPath(); x.arc(cx, cy, r * FK.s, 0, TAU); x.stroke(); x.globalAlpha = 1; }
  // three bubbles going up from a point, one after another (a loop of the "bub" table)
  function bubbles(x, cx, cy, e, h, c) { x.strokeStyle = c || "#fff"; x.lineWidth = 4; for (let i = 0; i < 3; i++) { const u = e - i * 470; if (u < 0) continue; KL("bub", u, FK); x.globalAlpha = FK.a * .9; x.beginPath(); x.arc(cx + (i - 1) * 16 + FK.x * 14, cy + FK.y * h, 11 * FK.s, 0, TAU); x.stroke(); } x.globalAlpha = 1; }

  // ---------------------------------------------------------------- the games. Each returns { draw, down?, up?, fit?, score(), tier(), begin() }
  const GAMES = {};
  const tierOf = (name, score) => { const n = MINI_REWARD.need[name]; return score >= n[2] ? 3 : score >= n[1] ? 2 : score >= n[0] ? 1 : 0; };
  // a soft round light, painted once per colour and copied under whatever glows (no shadow or filter on anything that moves)
  const GLOW = {}; function glow(rgb) { if (GLOW[rgb]) return GLOW[rgb]; const c = canvasOf(128, 128), x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 4, 64, 64, 64); g.addColorStop(0, `rgba(${rgb},.95)`); g.addColorStop(.45, `rgba(${rgb},.4)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return (GLOW[rgb] = c); }
  const lit = (x, g, cx, cy, w, a) => { if (a <= .01) return; x.globalAlpha = Math.min(1, a); x.drawImage(g, cx - w / 2, cy - w / 2, w, w); x.globalAlpha = 1; };

  // ---- Buried Treasure
  // nine mounds, three by three: one crab, one crown, seven coins. A mound "warns" when the crab is in one of the (up to eight) mounds around it
  const near = (i, j) => i !== j && Math.abs((i % 3) - (j % 3)) <= 1 && Math.abs(Math.floor(i / 3) - Math.floor(j / 3)) <= 1;
  const dealSand = (rnd) => { const bag = ["crab", "crown"].concat(Array(7).fill("coin")); for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; } const c = bag.indexOf("crab"); return bag.map((kind, i) => ({ kind, warn: kind !== "crab" && near(i, c) })); };
  function mound(x, M, cx, cy, w, sx, sy, r, a) { const s = w / 200; x.save(); x.translate(cx, cy + w * .17); x.globalAlpha = a; if (r) x.rotate(r); x.scale(sx * s, sy * s); x.drawImage(M, -130, -130); x.restore(); }
  function pit(x, P, cx, cy, w) { const s = w / 200; x.drawImage(P, cx - 130 * s, cy + w * .14 - 60 * s, 260 * s, 120 * s); }
  GAMES.carrots = (A, end, Z) => {
    const D = Z.dig, WD = KW[Z.k].carrots, M = moundArt(Z), PT = pitArt(Z), FOE = D.foe, SHEETED = !!SHEET[FOE], B = bg("carrots", Z), ROWS = [730, 900, 1070], HOLES = dealSand(Math.random).map((h, i) => Object.assign(h, { c: i % 3, x: 0, y: ROWS[Math.floor(i / 3)], t: -1, fly: -1 })), clods = [], o = {};
    let HW = 200, PX = 690, TX = 700, TY = 50, got = 0, over = false, busy = 0, warned = false;
    const lay = () => { const v = vis(), cx = (v.x0 + v.x1) / 2, sp = Math.min(215, (v.x1 - v.x0) * .32); HW = Math.min(200, sp * .9); for (const h of HOLES) h.x = cx + (h.c - 1) * sp; PX = v.x1 - 70; TX = v.x1 - 60; TY = topY() + 50; };
    const stat = () => { hud.stat.textContent = L(WD.stat, got); };
    function finish(wait) { if (over) return; over = true; setBtns([]); later(() => end(), wait); }
    return {
      begin() { lay(); stat(); pogo("idle", PX, 640, 170); setBtns([["Keep", () => { if (!over && !busy) finish(300); }]]); },
      fit() { lay(); pogo(null, PX, 640, 170); },
      score: () => got, tier: () => tierOf("carrots", got), peek: () => HOLES.map(h => ({ x: h.x, y: h.y, kind: h.kind, warn: h.warn, open: h.t >= 0 })),
      down(p) { if (over || busy) return; let h = null; for (const q of HOLES) if (q.t < 0 && Math.abs(q.x - p.x) < HW * .5 && Math.abs(q.y - p.y) < 85) { h = q; break; } if (!h) return; h.t = run.t; busy = 1; sfx("swap"); hap(10);
        for (let i = 0; i < 4; i++) clods.push({ x: h.x, y: h.y - 10, dx: (i - 1.5) * 50 + (Math.random() - .5) * 20, dy: 70 + Math.random() * 30, t0: run.t + (h.kind === "crab" ? 420 : 190) });
        if (h.kind === "crab") { setBtns([]); later(() => { sfx("bad"); hap([30, 40, 30]); shout(L(WD.foe), 1000); pogoAct("sad"); }, 480); later(() => { got = Math.floor(got / 2); stat(); shout(T("Half gone!"), 1200); sfx("tick"); }, 1500); finish(2500); return; }
        later(() => { got += h.kind === "crown" ? 2 : 1; stat(); sfx("pop", got + 2); h.fly = run.t; busy = 0;
          if (h.kind === "crown") { shout(L(WD.gold), 900); burst(h.x, h.y - 120, 80); pogoAct("yay"); } else if (h.warn && !warned) { warned = true; shout(L(WD.near), 1700); pogoAct("worry"); } else if (got % 3 === 0) pogoAct("nice"); else if (!h.warn) pogoAct("idle");
          let all = true; for (const q of HOLES) if (q.t < 0 && q.kind !== "crab") all = false;
          if (all) { busy = 1; shout(T("All the treasure!"), 1400); sfx("reward"); pogoAct("win"); for (const q of HOLES) if (q.kind !== "crab") burst(q.x, q.y - 20, 70); finish(1500); } }, 200 + KLEN("unearth")); },
      draw(x, t) {
        x.drawImage(B, 0, 0);
        for (const h of HOLES) { if (h.t < 0) { mound(x, M, h.x, h.y, HW, 1, 1, 0, 1); continue; } const e = t - h.t, crab = h.kind === "crab", d0 = crab ? 420 : 0;
          if (e >= d0 + 150) pit(x, PT, h.x, h.y, HW);
          if (crab && e < d0) { K("rumble", e, o); mound(x, M, h.x, h.y, HW, 1, o.sy, o.r, 1); } else if (e < d0 + KLEN("dig")) { K("dig", e - d0, o); mound(x, M, h.x, h.y, HW, o.sx, o.sy, 0, o.a); }
          if (h.warn && e > 900) bubbles(x, h.x, h.y - 6, e - 900, 190, D.c[6]); }
        // what came out of the sand, over every mound: a coin on its way up and then to the counter; the crab, up and then off to the side with his half
        for (const h of HOLES) { if (h.t < 0) continue; const e = t - h.t;
          if (h.kind === "crab") { const e2 = e - 420; if (e2 < 0) continue; const cw = HW * (SHEETED ? 1.2 : .78), f = Math.floor(t * .03), wob = SHEETED ? 0 : Math.sin(t * .014) * .1; K("crabUp", e2, o); const up = o.y, sy = o.sy; K("scuttle", e - 1300, o); const cx = h.x + o.x * (vis().x1 + 160 - h.x), cy = h.y - 36 + (1 + up) * cw * .8 + o.y * 220;
            if (e2 < KLEN("crabUp")) { x.save(); x.beginPath(); x.rect(h.x - 200, h.y - 400, 400, 400 + HW * .2); x.clip(); spr(x, A, FOE, f, cx, cy, cw, opt(wob, 1, sy)); x.restore(); } else spr(x, A, FOE, f, cx, cy, cw, opt(wob));
            if (e > 1300 && got + (e < 1500 ? 0 : 1) > 0) spr(x, A, D.coin, 0, cx + cw * .34, cy - cw * .1, 54); continue; }
          const name = h.kind === "crown" ? D.gold : D.coin, w = HW * (h.kind === "crown" ? .62 : .52);
          if (h.fly < 0) { const e3 = e - 200; if (e3 < 0) continue; K("unearth", e3, o); spr(x, A, name, 0, h.x, h.y + 14 + o.y * 96, w * o.s, opt(o.r, o.sx, o.sy)); }
          else { const e4 = t - h.fly; if (e4 >= KLEN("fly")) continue; K("fly", e4, o); const y0 = h.y - 82, d = Math.hypot(TX - h.x, TY - y0); spr(x, A, name, 0, h.x + (TX - h.x) * o.p, y0 + (TY - y0) * o.p - d * o.h * .5, w * o.s, opt(o.r, 1, 1, o.a)); } }
        x.fillStyle = D.c[5]; for (let i = clods.length - 1; i >= 0; i--) { const c = clods[i], e = t - c.t0; if (e < 0) continue; if (e > KLEN("clod")) { clods.splice(i, 1); continue; } K("clod", e, o); x.globalAlpha = o.a; x.beginPath(); x.ellipse(c.x + c.dx * o.x, c.y - 30 + c.dy * o.y, 9, 7, 0, 0, TAU); x.fill(); } x.globalAlpha = 1; }
    };
  };

  // ---- Glow Catch
  // swimming paths: four hand-set loops of control points through the water, closed Catmull-Rom curves; each swimmer runs one, offset and at its own pace
  const PATHS = [[[120, 420], [300, 300], [520, 380], [640, 560], [470, 700], [250, 640]], [[650, 300], [520, 520], [330, 480], [180, 640], [360, 820], [600, 700]], [[200, 900], [380, 700], [600, 820], [680, 1000], [430, 1080], [260, 1040]], [[400, 260], [640, 420], [560, 640], [380, 560], [160, 500], [230, 330]]];
  const CRP = [0, 0], cr = (P, u) => { const n = P.length, f = ((u % 1) + 1) % 1 * n, i = Math.floor(f), t = f - i, p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n], q = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); CRP[0] = q(p0[0], p1[0], p2[0], p3[0]); CRP[1] = q(p0[1], p1[1], p2[1], p3[1]); return CRP; };
  const DOTS = [[-34, -40], [20, -70], [38, -22], [-12, -8], [-40, -92], [8, -112], [44, -66], [-22, -62], [30, 6], [-44, 4], [0, -40], [14, -140]];   // where the caught lights sit in the jar
  GAMES.fireflies = (A, end, Z) => {
    const H = Z.glow, WG = KW[Z.k].fireflies, B = bg("fireflies", Z), GV = glow(H.rgb), GY = glow("250,255,170"), LEN = 15000, list = [], misses = [], jar = { x: 250, y: 1150 }, o = {}, ANG = [4200, 9800], URC = [300, 1500, 7000], ang = { on: false, t0: 0, dir: 1, y: 0, x: -999, yy: -999, got: -1, gx: 0, gy: 0 };
    let caught = 0, streak = 0, over = false, t0 = -1, next = 0, shine = 0, angN = 0, urN = 0, statT = -1;
    const spawn = (t, kind) => { const P = PATHS[Math.floor(Math.random() * PATHS.length)], slow = kind === "urchin"; list.push({ kind, P, u: Math.random(), sp: (slow ? .022 + Math.random() * .016 : .05 + Math.random() * .05) * (Math.random() < .5 ? 1 : -1), ph: Math.random() * 1300, born: t, jx: (Math.random() - .5) * 120, jy: (Math.random() - .5) * 120, x: -999, y: -999, got: -1, hit: -1, gx: 0, gy: 0 }); };
    const stat = (t) => { const left = Math.max(0, Math.ceil((LEN - (t0 < 0 ? 0 : t - t0)) / 1000)); hud.stat.textContent = T("Caught {0}", caught) + " · " + left + "s"; };
    return {
      peek(kind) { const v = vis(); if (kind === "angler") return ang.on && ang.got < 0 ? [ang.x, ang.yy] : null; for (const f of list) if (f.got < 0 && f.kind === (kind || "jelly") && f.x > v.x0 + 30 && f.x < v.x1 - 30 && f.y > topY() + 120) return [f.x, f.y]; return null; },
      begin() { t0 = run.t; for (let i = 0; i < 5; i++) spawn(run.t, "jelly"); stat(run.t); pogo("idle", 500, 1210, 170); setBtns([]); },
      fit() { pogo(null, 500, 1210, 170); }, score: () => caught, tier: () => tierOf("fireflies", caught), streak: () => streak,
      down(p) { if (over || t0 < 0) return;
        if (ang.on && ang.got < 0 && Math.hypot(ang.x - p.x, ang.yy - p.y) < 110) { ang.got = run.t; ang.gx = ang.x; ang.gy = ang.yy; caught += 3; streak++; sfx("reward"); hap([15, 20, 15]); shout(L(WG.bonus), 1000); burst(ang.x, ang.yy, 90); pogoAct("wow"); stat(run.t); return; }
        let best = null, bd = 90; for (const f of list) { if (f.got >= 0) continue; const d = Math.hypot(f.x - p.x, f.y - p.y); if (d < bd) { bd = d; best = f; } }
        if (!best) { misses.push({ x: p.x, y: p.y, t: run.t }); streak = 0; return; }
        if (best.kind === "urchin") { best.hit = run.t; caught = Math.max(0, caught - 2); streak = 0; sfx("bad"); hap([30, 40, 30]); shout(T("Ouch! -2"), 900); pogoAct("wow"); stat(run.t); return; }
        best.got = run.t; best.gx = best.x; best.gy = best.y; caught++; streak++; sfx("pop", Math.min(14, caught)); hap(8);
        if (streak % 4 === 0) { caught++; shout(T("Streak! +1"), 800); burst(jar.x, jar.y - 110, 110, "#f4ffb0"); pogoAct("clap"); } stat(run.t); },
      draw(x, t, dt) {
        x.drawImage(B, 0, 0); const v = vis();
        if (!over && t0 >= 0) { const e = t - t0; if (e >= LEN) { over = true; shout(T("Time!"), 1200); const tier = tierOf("fireflies", caught); if (tier) { sfx("reward"); burst(jar.x, jar.y - 110, 150, "#f4ffb0"); } pogoAct(tier >= 2 ? "win" : tier ? "nice" : "sad"); later(() => end(), 1400); }
          let live = 0; for (const f of list) if (f.got < 0 && f.kind === "jelly") live++; if (live < 6 && t >= next) { spawn(t, "jelly"); next = t + 380 + Math.random() * 500; }
          if (urN < URC.length && e >= URC[urN]) { urN++; spawn(t, "urchin"); }
          if (angN < ANG.length && e >= ANG[angN] && !ang.on) { ang.on = true; ang.t0 = t; ang.dir = angN % 2 ? -1 : 1; ang.y = angN % 2 ? 800 : 540; ang.got = -1; angN++; sfx("swap"); }
          const q = Math.floor(t / 250); if (q !== statT) { statT = q; stat(t); } }
        // the jar's light grows with the catch
        shine += ((Math.min(1, caught / 22)) - shine) * Math.min(1, dt / 300); const jx = jar.x, jy = jar.y; lit(x, GY, jx, jy - 110, 470, .75 * shine);
        spr(x, A, "jar", 0, jx, jy - 120, 200);
        x.fillStyle = Z.pal.spark; for (let i = 0, n = Math.min(caught, DOTS.length); i < n; i++) { KL("pulse", t + i * 230, o); const fy = KL("float", t + i * 410, FK).y; x.globalAlpha = .45 + .55 * o.g; x.beginPath(); x.arc(jx + DOTS[i][0], jy - 60 + DOTS[i][1] + fy, 6, 0, TAU); x.fill(); } x.globalAlpha = 1;
        for (let i = list.length - 1; i >= 0; i--) { const f = list[i], jelly = f.kind === "jelly";
          if (f.got >= 0) { const e = t - f.got; if (e > KLEN("fly")) { list.splice(i, 1); continue; } K("fly", e, o); const ty = jy - 110, d = Math.hypot(jx - f.gx, ty - f.gy), px = f.gx + (jx - f.gx) * o.p, py = f.gy + (ty - f.gy) * o.p - d * o.h * .4; lit(x, GV, px, py, 170 * o.s, .7 * o.a); spr(x, A, H.get, 0, px, py, 100 * o.s, opt(0, 1, 1, o.a)); continue; }
          f.u += f.sp * dt / 1000; cr(f.P, f.u); KL("float", t + f.ph * 2, o); f.x = Math.max(v.x0 + 50, Math.min(v.x1 - 50, CRP[0] + f.jx * o.r * 30)); f.y = CRP[1] + f.jy * o.y * .15; const fade = Math.min(1, (t - f.born) / 400);
          if (jelly) { KL("pulse", t + f.ph, o); lit(x, GV, f.x, f.y + o.y, 210, fade * (.35 + .6 * o.g)); spr(x, A, H.get, 0, f.x, f.y + o.y, 104, opt(0, o.sx, o.sy, fade)); }
          else { const r = KL("roll", t + f.ph, o).r, e = f.hit >= 0 ? t - f.hit : 9999, s = e < KLEN("sting") ? K("sting", e, o).s : 1; if (e < KLEN("miss")) ring(x, f.x, f.y, e, 95, "#ff8fa8"); spr(x, A, H.bad, 0, f.x, f.y, 96 * s, opt(r, 1, 1, fade)); } }
        // the lantern fish: across the water with its light before it
        if (ang.on) { if (ang.got >= 0) { const e = t - ang.got; if (e > KLEN("fly")) ang.on = false; else { K("fly", e, o); const ty = jy - 110; spr(x, A, H.bonus, 0, ang.gx + (jx - ang.gx) * o.p, ang.gy + (ty - ang.gy) * o.p - 120 * o.h, 130 * o.s, opt(0, ang.dir, 1, o.a)); } }
          else { const e = t - ang.t0; if (e > KLEN("dart")) ang.on = false; else { K("dart", e, o); const xa = ang.dir > 0 ? v.x0 - 90 : v.x1 + 90, xb = ang.dir > 0 ? v.x1 + 90 : v.x0 - 90; ang.x = xa + (xb - xa) * o.p; ang.yy = ang.y - o.h * 120; lit(x, GY, ang.x + ang.dir * 34, ang.yy - 52, 150, .9); spr(x, A, H.bonus, 0, ang.x, ang.yy, 140, opt(0, -ang.dir, 1)); } } }
        for (let i = misses.length - 1; i >= 0; i--) { const m = misses[i], e = t - m.t; if (e > KLEN("miss")) { misses.splice(i, 1); continue; } ring(x, m.x, m.y, e, 40, "#fffadc"); } }
    };
  };

  // ---- Turtle Hop
  // the way to the boat: a buoy to start from, then twelve more places, every third a buoy (it stays), the others turtles (they dive), the last the boat
  const HOP = { GOAL: 12, D: 480, TOL: .42, DIVE: 1500, WARN: 600 };
  const makePads = (rnd) => { const pads = [{ x: 200, k: "buoy", w: 230, bob: -1 }]; for (let i = 1; i <= HOP.GOAL; i++) pads.push({ x: pads[i - 1].x + 150 + rnd() * 80 + i * 2, k: i === HOP.GOAL ? "boat" : i % 3 === 0 ? "buoy" : "turtle", w: i === HOP.GOAL ? 300 : 225 - Math.min(40, i * 3), bob: -1 }); return pads; };
  // where a jump of that length from pad `at` comes down: the next pad, the one after it (a long jump), or the water (-1)
  const landOn = (pads, at, to) => { let best = -1, bd = 1e9; for (let j = at + 1; j <= Math.min(HOP.GOAL, at + 2); j++) { const d = Math.abs(to - pads[j].x); if (d <= pads[j].w * HOP.TOL && d < bd) { bd = d; best = j; } } return best; };
  GAMES.lilypads = (A, end, Z) => {
    const WH = KW[Z.k].lilypads, B = bg("lilypads", Z), F = front(Z), PAD = Z.hop.pad, SAFE = Z.hop.safe, BG1 = Z.pal.liq[1], WY = 900, SY = WY + 34, FY = WY + 62, { GOAL, D, DIVE, WARN } = HOP, pads = makePads(Math.random), o = {}, PH = 190;
    let at = 0, cam = 0, hold = -1, jump = null, over = false, fall = -1, fallX = 0, landT = -1;
    const stat = () => { hud.stat.textContent = T("Hops {0}/12", at); };
    const power = (ms) => { const c = ms % 2200, u = c < 1100 ? c / 1100 : 2 - c / 1100; return Math.max(.08, u); };   // up to full in 1.1 s, then back down: holding on is no free win
    const camX = () => pads[at].x - (vis().x0 + 95);
    const padY = (P, i, t) => { let y = KL("float", t + i * 370, o).y; if (P.bob >= 0) { const e = t - P.bob; if (e < KLEN("padBob")) y += K("padBob", e, o).y; if (P.k === "turtle" && e > DIVE) y += K("dive", e - DIVE, o).y * 150; } return y; };
    return {
      begin() { stat(); cam = camX(); pogo("idle", pads[0].x - cam, SY, PH); setBtns([]); },
      fit() { pogo(null, pads[at].x - cam, SY, PH); }, score: () => at, tier: () => tierOf("lilypads", at),
      // the hold, in ms, that lands on the next pad (or, asked for a long one, on the pad after it, when it can be reached)
      peek(long) { if (over || jump || fall >= 0 || at >= GOAL) return null; const j = long && at + 2 <= GOAL && pads[at + 2].x - pads[at].x <= D ? at + 2 : at + 1; return Math.round(Math.max(.08, (pads[j].x - pads[at].x) / D) * 1100); },
      down() { if (over || jump || fall >= 0) return; hold = run.t; pogoAct("ready"); },
      up() { if (hold < 0 || over || jump || fall >= 0) return; const pw = power(run.t - hold); hold = -1; const from = pads[at].x, dist = D * pw, to = from + dist, j = landOn(pads, at, to), P = j < 0 ? null : pads[j], gone = P && P.bob >= 0 && P.k === "turtle", ok = !!P && !gone;
        jump = { t0: run.t, from, to: ok ? P.x + (to - P.x) * .35 : to, ok, j, h: 120 + dist * .45, sp: -1, perfect: ok && Math.abs(to - P.x) <= P.w * .12 }; sfx("swap"); pogoAct(typeof paLive === "function" && paLive() ? "leap" : "yay", () => {}); },   // the keyed leap (pogo-anim.js); a phone without WebGL has only the baked sheets, so it cheers instead
      draw(x, t, dt) {
        cam += (camX() - cam) * Math.min(1, dt / 260);
        // the far shore scrolls at a third of the pads' pace; the page tiles every 1560 units
        const bw = 1560, bx = -((cam * .35) % bw + bw) % bw; x.drawImage(B, bx, 0); x.drawImage(B, bx + bw, 0);
        let px = pads[at].x, py = SY, sq = 1, alpha = 1;
        for (let i = 0; i < pads.length; i++) { const P = pads[i], sx = P.x - cam; if (sx < -300 || sx > VW + 300) continue; const e = P.bob >= 0 ? t - P.bob : -1, by = padY(P, i, t), fl = KL("float", t + i * 370, o).r;
          if (P.k === "boat") { let r = fl; if (e >= 0 && e < KLEN("rock")) r += K("rock", e, o).r; spr(x, A, "p:turnip", 0, sx + 14, WY - 22 + by + (e >= 0 && e < KLEN("rock") ? o.y : 0), 340, opt(r)); }
          else if (P.k === "buoy") spr(x, A, SAFE, 0, sx, WY + 50 + by, P.w * 1.06, opt(fl));
          else { let r = fl, a = 1; if (e > DIVE) { K("dive", e - DIVE, o); r += o.r; a = o.a; } if (a > 0) spr(x, A, PAD, 0, sx, WY + (PAD.startsWith("ch-") ? 60 : 50) + by, P.w * (PAD.startsWith("ch-") ? .88 : 1.06), opt(r, 1, 1, a)); } }
        if (hold >= 0) sq = K("crouch", power(t - hold) * 1000, o).sq;
        if (jump) { const e = t - jump.t0, L = KLEN("hop"); K("hop", Math.min(e, L), o); px = jump.from + (jump.to - jump.from) * o.p; py = SY - jump.h * o.h; sq = o.sq;
          if (!jump.ok && e >= L) { // past the pad (or onto a turtle that is gone): down into the water
            const e2 = e - L; K("sink", e2, o); py = SY + 120 * o.y; alpha = o.a; if (jump.sp < 0) { jump.sp = t; sfx("bad"); hap([30, 40]); shout(L(WH.splash), 1200); pogoAct("sad"); }
            if (e2 > KLEN("sink") + 600 && !over) { over = true; later(() => end(), 400); } }
          else if (jump.ok && e >= L) { const two = jump.j - at === 2, perfect = jump.perfect; at = jump.j; pads[at].bob = t; jump = null; stat(); sfx("pop", Math.min(14, at + 2)); hap(10); landT = t; px = pads[at].x;
            if (at >= GOAL) { over = true; shout(T("The Turnip!"), 1500); sfx("reward"); burst(pads[at].x, WY - 190, 150); pogoAct("win"); later(() => end(), 1700); }
            else { if (two) { shout(T("Long jump! +2"), 900); burst(pads[at].x, WY - 40, 110, "#ffe27a"); } else if (perfect) { shout(T("Perfect!"), 700); burst(pads[at].x, WY - 30, 80, "#ffffff"); } pogoAct(two || at % 4 === 0 ? "yay" : "idle"); } } }
        else if (fall < 0) { const P = pads[at]; py += padY(P, at, t);
          if (P.k === "turtle" && P.bob >= 0 && !over) { const e = t - P.bob; if (e > DIVE + 300) { fall = t; fallX = P.x; hold = -1; sfx("bad"); hap([30, 40]); shout(L(WH.sink), 1300); pogoAct("sad"); } } }
        if (fall >= 0) { const e = t - fall; K("sink", e, o); px = fallX; py = SY + 30 + 120 * o.y; alpha = o.a; sq = 1; if (e > KLEN("sink") + 700 && !over) { over = true; later(() => end(), 400); } }
        if (landT >= 0 && !jump && fall < 0 && t - landT < KLEN("land")) sq = K("land", t - landT, o).sq;
        // the water in front of everything that floats, at the pads' own pace
        const fx = -((cam % bw) + bw) % bw; x.drawImage(F, fx, FY); x.drawImage(F, fx + bw, FY); x.fillStyle = BG1; x.fillRect(0, FY + 338, VW, VH - FY - 338);
        for (let i = 0; i < pads.length; i++) { const P = pads[i], sx = P.x - cam; if (P.bob < 0 || sx < -300 || sx > VW + 300) continue; const e = t - P.bob; if (e < 8 * 50) spr(x, A, "ripple", Math.floor(e / 50), sx, FY + 26, P.w * 1.25); if (P.k === "turtle" && e > WARN && e < DIVE + 500) bubbles(x, sx + P.w * .3, FY + 14, e - WARN, 110, Z.pal.foam); }
        if (jump && jump.sp >= 0) { const se = t - jump.sp; if (se < 10 * 50) spr(x, A, "splash", Math.floor(se / 50), jump.to - cam, WY + 10, 260); }
        if (fall >= 0) { const se = t - fall; if (se < 10 * 50) spr(x, A, "splash", Math.floor(se / 50), fallX - cam, WY + 10, 260); }
        // the power bar beside Pogo while the finger is down, with a mark for the next pad and a gold one for the pad after it
        if (hold >= 0) { const pw = power(t - hold), mx = pads[at].x - cam + 96, my = WY - 250, mh = 150; x.fillStyle = "#1d4560"; x.fillRect(mx - 4, my - 4, 26, mh + 8); x.fillStyle = "#fff8e6"; x.fillRect(mx, my, 18, mh); x.fillStyle = "#ff8a2a"; x.fillRect(mx, my + mh * (1 - pw), 18, mh * pw);
          for (let j = at + 1; j <= Math.min(GOAL, at + 2); j++) { const u = (pads[j].x - pads[at].x) / D; if (u > 1) continue; x.fillStyle = j === at + 1 ? "#1d4560" : "#e0a400"; x.fillRect(mx - 10, my + mh * (1 - u) - 3, 38, 6); } }
        pogoMove(px - cam, py, sq, alpha);
      }
    };
  };

  // ---- Mordo's Shells
  // one round's shuffle: `n` swaps of two of the three places, with feints (out and back, nothing changes place) set between them from round two
  const SHELL = { SPEED: [1.0, .78, .6], COUNT: [4, 6, 8], FEINT: [0, 2, 3] };
  const shellPlan = (round, rnd) => { const n = SHELL.COUNT[round - 1], F = SHELL.FEINT[round - 1], total = n + F, list = []; for (let i = 0; i < total; i++) { const a = Math.floor(rnd() * 3), b = (a + 1 + Math.floor(rnd() * 2)) % 3; list.push({ a, b, f: false }); } for (let k = 0; k < F; k++) list[Math.floor((k + 1) * total / (F + 1)) - 1].f = true; return list; };
  // where the shells that started on places 0, 1, 2 stand after that plan
  const shellEnd = (plan) => { const at = [0, 1, 2]; for (const s of plan) if (!s.f) { const i = at.indexOf(s.a), j = at.indexOf(s.b); at[i] = s.b; at[j] = s.a; } return at; };
  const byY = (a, b) => a.y - b.y;
  GAMES.nests = (A, end, Z) => {
    const C = Z.cups, WN = KW[Z.k].nests, B = bg("nests", Z), BY = 760, SLOT = [200, 390, 580], nests = [0, 1, 2].map(i => ({ s: i, x: SLOT[i], y: BY, sc: 1, lift: -1, lk: "peek", crab: -1 })), order = nests.slice(), o = {}, m = { x: 900, y: 200, fx: 900, fy: 200, tx: 900, ty: 200, t0: 0, act: "", at: -1, face: 1 };
    let SW = 236, round = 1, correct = 0, phase = "intro", holder = null, swaps = [], charm = null, over = false, found = -1;
    const place = () => { const v = vis(), cx = (v.x0 + v.x1) / 2, sp = Math.min(200, (v.x1 - v.x0) * .31); SLOT[0] = cx - sp; SLOT[1] = cx; SLOT[2] = cx + sp; SW = Math.min(240, sp * 1.26); };
    const stat = () => { hud.stat.textContent = T("Round {0}/3", round); };
    const bySlot = (s) => nests[0].s === s ? nests[0] : nests[1].s === s ? nests[1] : nests[2];
    const go = (tx, ty, face) => { m.fx = m.x; m.fy = m.y; m.tx = tx; m.ty = ty; m.t0 = run.t; m.face = face; }, watch = () => go(vis().x1 - 140, topY() + 230, -1);
    function deal() { phase = "drop"; found = -1; nests.forEach(q => { q.x = SLOT[q.s]; q.y = BY; q.sc = 1; q.lift = -1; q.crab = -1; }); const n = holder = nests[Math.floor(Math.random() * 3)]; n.lift = run.t + 500; n.lk = "lid";
      if (round === 1) { m.x = vis().x1 + 220; m.y = topY() + 160; } go(n.x + 34, BY - 400, 1); charm = { t0: run.t + 1000, y0: BY - 320, y1: BY - 8 }; shout(L(WN.watch), 1300);
      later(() => { sfx("pop", 4); }, 1420); later(() => { sfx("tick"); watch(); }, 2240); later(() => { phase = "shuffle"; shuffle(); }, 2600); }
    function shuffle() { const sp = SHELL.SPEED[round - 1]; let t = run.t; swaps = shellPlan(round, Math.random).map((s) => { const len = KLEN(s.f ? "feint" : "swap") * sp, q = { a: s.a, b: s.b, f: s.f, t0: t, len, done: 0 }; t += len + 60; return q; });
      later(() => { settle(); phase = "pick"; shout(T("Which one?"), 1000); }, t - run.t + 100); }
    // any swap the frames did not finish (a slow or hidden page) is finished here, so every shell stands on its place before the pick
    function settle() { for (const s of swaps) if (!s.done) { s.done = 1; if (!s.f) { const A1 = bySlot(s.a), B1 = bySlot(s.b); A1.s = s.b; B1.s = s.a; } } nests.forEach(q => { q.x = SLOT[q.s]; q.y = BY; q.sc = 1; }); }
    function finish() { if (over) return; over = true; setBtns([]); later(() => end(), 500); }
    return {
      begin() { place(); stat(); pogo("idle", vis().x1 - 110, 1150, 180); setBtns([]); deal(); },
      fit() { place(); if (phase !== "shuffle") nests.forEach(q => { q.x = SLOT[q.s]; }); pogo(null, vis().x1 - 110, 1150, 180); }, score: () => correct, tier: () => tierOf("nests", correct),
      peek() { const w = nests[0] !== holder ? nests[0] : nests[1]; return { phase, round, right: [holder ? holder.x : 0, BY], wrong: [w.x, BY] }; },
      down(p) { if (phase !== "pick" || over) return; let n = null; for (const q of nests) if (Math.abs(q.x - p.x) < SW * .55 && Math.abs(q.y - 30 - p.y) < 120) n = q; if (!n) return; phase = "peek"; n.lift = run.t; n.lk = "peek"; sfx("swap");
        const hit = n === holder; later(() => { if (hit) { correct++; found = run.t; sfx("reward"); hap([20, 30]); shout(T("Found it!"), 1100); burst(n.x, BY - 60, 100); pogoAct("yay"); m.act = "huff"; m.at = run.t; }
          else { n.crab = run.t; sfx("bad"); hap([30, 40, 30]); shout(T("Not there…"), 1100); pogoAct("sad"); holder.lift = run.t + 160; holder.lk = "peek"; m.act = "gloat"; m.at = run.t; } }, 340);
        later(() => { if (!hit) { correct = Math.floor(correct / 2); return finish(); } if (round >= 3) { pogoAct("win"); return finish(); } phase = "choice"; setBtns([["Keep", () => finish(), true], ["Next round", () => { setBtns([]); round++; stat(); deal(); }]]); }, 1600); },
      draw(x, t) {
        x.drawImage(B, 0, 0);
        // the shuffle: each swap moves two shells between their places, one over the other; a feint goes part of the way and comes back
        if (phase === "shuffle") for (const s of swaps) { const e = t - s.t0; if (e < 0 || s.done) continue; const key = s.f ? "feint" : "swap"; K(key, Math.min(s.len, e) / (s.len / KLEN(key)), o);
          const A1 = bySlot(s.a), B1 = bySlot(s.b), xa = SLOT[s.a], xb = SLOT[s.b]; A1.x = xa + (xb - xa) * o.p; A1.y = BY - 90 * o.h; B1.x = xb + (xa - xb) * o.p; B1.y = BY + 30 * o.h; A1.sc = o.s;
          if (e >= s.len) { s.done = 1; if (!s.f) { A1.s = s.b; B1.s = s.a; } A1.y = B1.y = BY; A1.sc = 1; A1.x = SLOT[A1.s]; B1.x = SLOT[B1.s]; sfx("tick"); } }
        // Mordo: in with the starfish, lets it go, then up to the side to watch; he huffs at a find and hops at a miss
        K("swoop", t - m.t0, o); m.x = m.fx + (m.tx - m.fx) * o.k; m.y = m.fy + (m.ty - m.fy) * o.k; let my = m.y + KL("hover", t, o).y, mr = 0; if (m.act && t - m.at < KLEN(m.act)) { K(m.act, t - m.at, o); my += o.y; mr = o.r; }
        order.sort(byY);
        for (const n of order) { let ly = 0, r = 0, sy = 1; if (n.lift >= 0 && t >= n.lift && t - n.lift < KLEN(n.lk)) { K(n.lk, t - n.lift, o); ly = o.y; r = o.r; sy = o.sy; }
          if (n === holder && charm) { const e = t - charm.t0; if (e >= KLEN("drop")) { let cy = n.y - 8, s = 1, cr2 = 0; if (found >= 0) { K("hooray", t - found, o); cy += o.y; s = o.s; cr2 = o.r; } spr(x, A, C.hide, 0, n.x, cy, 86 * s, opt(cr2)); }
            else if (e >= 0) { K("drop", e, o); spr(x, A, C.hide, 0, n.x, charm.y0 + (charm.y1 - charm.y0) * o.y, 86 * o.s, opt(o.r)); } }
          if (n.crab >= 0) { K("snap", t - n.crab, o); spr(x, A, C.foe, 0, n.x, n.y - 6 + o.y, 92 * o.s, opt(o.r)); }
          spr(x, A, C.cup, 0, n.x, n.y + 62 + ly, SW * n.sc, opt(r, 1, sy, 1, .92)); }
        spr(x, A, "cr-magpie", Math.floor(t * .06), m.x, my, 220, opt(mr, m.face, 1));
        if (charm && t < charm.t0) spr(x, A, C.hide, 0, m.x - 24, my + 54, 70); }
    };
  };

  // ---------------------------------------------------------------- cards: the rules before, the reward after
  const ICON = (k) => { let svg = ""; try { svg = (typeof ICO === "object" && ICO[k]) || (typeof BICON === "object" && BICON[k]) || ""; } catch (e) {} return `<i class="ico">${svg}</i>`; };
  const TITLE = { carrots: "Buried Treasure", fireflies: "Glow Catch", lilypads: "Turtle Hop", nests: "Mordo's Shells" };
  // the part of the rules that is the same in every kingdom (the rest is in KW)
  const RULE = { carrots: "The big find counts two. Stop with Keep whenever you like.", fireflies: "Four in a row without a miss is one more. You have 15 seconds.",
    lilypads: "Hold to crouch, let go to jump. A long jump over one counts two.", nests: "From round two he feints. Find it three times. A miss keeps half of what you won." };
  // where each game comes from (the kingdom's number, 0-9) and the line its rules card says about it
  const HOME = { carrots: 5, fireflies: 7, lilypads: 1, nests: 0 };
  const FLAV = { carrots: "A game from the Sand Kingdom: the well-diggers play it while the tea brews.", fireflies: "A game from the Night Kingdom: the lantern-lighters play it before bed.",
    lilypads: "A game from the Water Kingdom: Barnacle taught it to Pogo. Sideways.", nests: "A game from the Forest Kingdom: Mordo plays it for buttons now, not charms." };
  function card(html) { cardEl.innerHTML = `<div class="card">${html}</div>`; cardEl.hidden = false; return cardEl.firstElementChild; }
  function intro(name, practice, k) { const W1 = KW[k][name]; return new Promise((res) => { const c = card(`<h2>${L(W1.t)}</h2><p>${L(W1.r)} ${T(RULE[name])}</p><p style="font-size:13px;font-style:italic;opacity:.8;margin-top:-4px">${L(W1.f)}</p>${practice ? `<p class="mprac">${T("Practice: no rewards")}</p>` : ""}<button class="btn" type="button">${T("Play")}</button>`); c.querySelector("button").addEventListener("click", () => { cardEl.hidden = true; res(); }); }); }
  // what a tier pays (as counts on the card), then into the save when it is paid
  function payout(name, tier, practice, ticket) { const R0 = (ticket ? MINI_REWARD.ticket : MINI_REWARD.tiers)[tier] || {}, out = { stars: roll(R0.stars), carrots: roll(R0.carrots), boost: {} }, nb = roll(R0.boost);
    if (nb) { const pool = MINI_REWARD.boosters, k = pool[Math.floor(Math.random() * pool.length)]; out.boost[k] = nb; }
    if (practice || typeof save !== "object" || !save) return { stars: 0, carrots: 0, boost: {}, would: out };   // practice: nothing is paid (what it would have been is kept for the card)
    if (out.stars) save.starBonus = (save.starBonus || 0) + out.stars;
    for (const k in out.boost) { const before = save.boost[k] || 0; save.boost[k] = before + out.boost[k]; out.boost[k] = (save.boost[k] || 0) - before; }   // the save's booster multiplier applies: report what really landed
    if (out.carrots) { const n = (typeof RWM === "number" ? RWM : 1) * out.carrots; save.carrots = (save.carrots || 0) + n; out.carrots = n; try { carrotNew += n; } catch (e) {} }
    try { persist(); } catch (e) {} try { const s = document.getElementById("starsTotal"); if (s && typeof starsFree === "function") s.textContent = Math.max(0, starsFree()); const c = document.getElementById("carrots"); if (c) c.textContent = save.carrots || 0; } catch (e) {}
    return out; }
  const BN = { hammer: "Sandpiper", moves: "+10 Moves", switch: "Free Switch", cross: "Cross Blast", undo: "Undo" }, BICO = { hammer: "hammer", moves: "moves", switch: "switch", cross: "cross", undo: "undo" };   // booster icons are the tray's own (BICON)
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
  async function open(name, opts = {}) { if (!GAMES[name]) throw new Error("no side game " + name); if (run) return run.promise; build(); const practice = !opts.reward, Z = themeOf(kingdomFor(name, opts));
    let resolve; const promise = new Promise(r => { resolve = r; }); run = { promise, t: 0, fx: [], q: [], g: { draw() {} }, quit: () => {} };
    ov.hidden = false; document.documentElement.classList.add("minigame"); hud.title.textContent = L(KW[Z.k][name].t); ov.querySelector(".mst").style.background = Z.pal.sky[1]; hud.stat.textContent = ""; say.style.opacity = 0; pogoEl.innerHTML = ""; pogoEl.style.cssText = ""; pogoEl._o = ""; setBtns([]); fit();
    const A = await loadArt(name, Z); let ended = false;
    const finish = async (quit) => { if (ended) return; ended = true; const g = run.g, score = quit ? 0 : g.score(), tier = quit ? 0 : g.tier(); if (g.done) g.done(); setBtns([]);
      const out = payout(name, tier, practice || quit, !!opts.ticket); if (!quit) await result(name, tier, out, practice); close(); resolve({ reward: { game: name, tier, score, practice, stars: out.stars, carrots: out.carrots, boost: out.boost, quit: !!quit } }); };
    run.quit = () => finish(true);
    // the page is drawn behind the rules card; the game starts when Play is pressed
    run.g = GAMES[name](A, () => finish(false), Z); fit(); start();
    if (!opts.skipIntro) await intro(name, practice, Z.k); if (ended) return promise; run.g.begin(); fit(); if (run.g.fit) run.g.fit();
    return promise; }
  function close() { if (!ov) return; ov.hidden = true; cardEl.hidden = true; pogoEl.innerHTML = ""; document.documentElement.classList.remove("minigame"); if (raf) cancelAnimationFrame(raf); raf = 0; run = null; clearTimeout(sayT); ov.querySelectorAll(".mflyi").forEach(e => e.remove()); }

  // ---------------------------------------------------------------- the playground (practice; the reward path is MINI.open(name, { reward: true }))
  // 2026-11-06 (story.js): the Playground plays for rewards too: one carrot a game, or one of the free games a boss left behind (save.miniFree);
  // practice stays free and pays nothing. The mode is remembered.
  function playground() { build(); const host = document.createElement("div"); host.className = "modal"; host.id = "mPlay"; const sv = typeof save === "object" && save;
    const can = () => sv && ((sv.miniFree || 0) > 0 || (sv.carrots || 0) >= MINI_REWARD.price);
    let mode = sv && sv.pgMode === "practice" ? "practice" : can() ? "reward" : "practice";
    const head = () => mode === "practice" ? T("Practice: no rewards") : (sv.miniFree || 0) > 0 ? T("Free games: {0}", sv.miniFree) : T("One game: {0} carrot · you have {1}", MINI_REWARD.price, sv.carrots || 0);
    host.innerHTML = `<div class="card"><h2>${T("Playground")}</h2><div class="mpmode"><button type="button" data-m="reward">${ICON("carrot")}${T("For rewards")}</button><button type="button" data-m="practice">${T("Practice")}</button></div><p class="mphead" style="font-size:14px"></p><div class="mpgrid">${Object.keys(TITLE).map(k => `<button type="button" data-g="${k}"><img src="${thumb(k)}" alt="">${window.MINI_T(k)}</button>`).join("")}</div><button class="btn ghost" type="button" data-x>${T("Close")}</button></div>`;
    const paint = () => { host.querySelectorAll("[data-m]").forEach(b => b.classList.toggle("on", b.dataset.m === mode)); host.querySelector(".mphead").textContent = head(); host.querySelector(".mpgrid").classList.toggle("poor", mode === "reward" && !can()); };
    document.body.appendChild(host); paint(); const shut = () => host.remove();
    host.addEventListener("click", (e) => { const m = e.target.closest("[data-m]"); if (m) { mode = m.dataset.m; if (sv) { sv.pgMode = mode; try { persist(); } catch (er) {} } paint(); return; }
      const b = e.target.closest("[data-g]"); if (b) { if (mode === "reward") { if (!can()) { sfx("bad"); const hd = host.querySelector(".mphead"); hd.textContent = T("No carrots left. Win levels to earn more, or play for practice."); if (window.bump) bump(hd); return; }
          if ((sv.miniFree || 0) > 0) sv.miniFree--; else sv.carrots -= MINI_REWARD.price; try { persist(); const c = document.getElementById("carrots"); if (c) c.textContent = sv.carrots || 0; } catch (er) {}
          shut(); open(b.dataset.g, { reward: true, ticket: true }); return; }
        shut(); open(b.dataset.g, { reward: false }); return; }
      if (e.target.closest("[data-x]") || e.target === host) shut(); }); }

  window.MINI_T = (g, k) => TITLE[g] ? L(KW[kingdomFor(g, { kingdom: k })][g].t) : T(g);
  window.MINI = { open, close, playground, thumb, games: Object.keys(GAMES), get running() { return !!run; }, keys: MK, sample: K, reward: MINI_REWARD, home: HOME, flavor: (g, k) => k === undefined || !TITLE[g] ? T(FLAV[g] || "") : L(KW[kingdomFor(g, { kingdom: k })][g].f), kingdomFor, themes: KT, words: KW };
  // test hook: open a game straight into play, read its state, poke it
  for (const k of ["carrot", "fly", "lily", "nest"]) window["__" + k + "Peek"] = (a) => run && run.g.peek ? run.g.peek(a) : null;
  window.__mini = { open: (n, o) => open(n, Object.assign({ skipIntro: true }, o)), get run() { return run; }, view: () => view, toScreen, tierOf, roll, near, dealSand, makePads, landOn, HOP, shellPlan, shellEnd, SHELL };
})();
