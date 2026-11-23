// 2026-11-23 the world became ten kingdoms: the four games keep their mechanics and their painted look, and each now comes from a kingdom
// (HOME and FLAV below: Buried Treasure from the Sand Kingdom, Glow Catch from the Night Kingdom, Turtle Hop from the Water Kingdom, Mordo's Shells
// from the Forest Kingdom; story.js says which kingdom's boss chests offer which). Mordo is the magpie of the story. What they pay fell by a quarter.
// Charmfall side games (2026-11-05, İdris: "yan oyunlar veya ödüller için kısa oyunlar ekle"; he picked all four). 2026-11-22: the world moved to
// Coral Cove, so the four games moved to the sea and each got a second mechanic. The names MINI.open takes are the old ones (the page and the save
// know them):
//   carrots    Buried Treasure  nine sand mounds on the sea bed; dig coins (the crown counts two), stop with Keep whenever you like; one mound hides
//                               the crab, who takes half. A dug mound bubbles when the crab is in a mound next to it
//   fireflies  Glow Catch       fifteen seconds in the night water: tap the glowing jellyfish into the jar; urchins sting (two lost, the streak too),
//                               four in a row without a miss is one more, and twice a lantern fish darts by, worth three
//   lilypads   Turtle Hop       hold to crouch, let go to jump; Pogo hops over turtles and lifebuoys to the boat. A turtle dives soon after he lands,
//                               a buoy stays; a long jump over one of them counts two; a miss ends in a splash
//   nests      Mordo's Shells   Mordo the magpie drops a starfish under one of three shells and shuffles them, faster each round and with feints
//                               from the second; find it, or keep what you have. A wrong shell has a crab under it
// MINI.open(name, { reward }) shows the game in its own layer over the page and resolves { reward } when it is closed:
//   { game, tier 0-3, score, practice, stars, carrots, boost: { name: count } }. Only `reward: true` pays into the save (MINI_REWARD),
//   the playground on the map opens them as practice. The pieces are the game's own painted charms (anim/ch-*.webp), the crab and Mordo are the
//   map's loops (anim/cr-crab.webp, anim/cr-magpie.webp), Pogo is the game's keyed rig (paHtml / paPlay). The four sea beds behind them are drawn
//   here, once, into a canvas of their own (PAINT below) and only copied each frame; MINI.thumb(name) gives a small picture of one as a URL.
//   Every motion is a keyed table (MK below, the same [ms, values, ease] format as anim/ui-keys.js) sampled by time each frame; the loops (a float,
//   a pulse, a hover) are keyed tables too, whose last key is their first. Nothing runs while the layer is closed.
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
    "Dig the sand for coins. The crown counts two. One mound hides the crab: he takes half. Bubbles over a dug mound mean he is next door. Stop with Keep whenever you like.": "Kumu kaz, sikke topla. Taç iki sayılır. Bir tepecikte yengeç saklanıyor: yarısını alır. Kazdığın yerden kabarcık çıkıyorsa yengeç komşuda. İstediğin an Bırak'a bas.",
    "Tap the glowing jellyfish into the jar. Leave the urchins alone: they sting. Four in a row without a miss is one more. You have 15 seconds.": "Parlayan denizanalarına dokun, kavanoza topla. Deniz kestanelerine dokunma: batar. Iskalamadan dört tane, bir tane daha kazandırır. 15 saniyen var.",
    "Hold to crouch, let go to jump. Turtles dive soon after you land, buoys stay. A long jump over one counts two. Twelve hops to the boat.": "Basılı tut, eğil; bırak, zıpla. Kaplumbağalar konduktan az sonra dalar, simitler kalır. Birinin üstünden aşan uzun zıplayış iki sayılır. Tekneye on iki sıçrama.",
    "Mordo hides a starfish under a shell and shuffles them. From round two he feints. Find it three times. A miss keeps half of what you won.": "Mordo bir denizyıldızını kabuğun altına saklayıp kabukları karıştırıyor. İkinci turdan sonra şaşırtmaca da yapar. Üç kez bul. Iskalarsan kazandığının yarısı kalır.",
    "A game from the Sand Kingdom: the well-diggers play it while the tea brews.": "Kum Krallığı'ndan bir oyun: kuyucular çay demlenirken oynar.", "A game from the Night Kingdom: the lantern-lighters play it before bed.": "Gece Krallığı'ndan bir oyun: fenerciler yatmadan önce oynar.",
    "A game from the Water Kingdom: Barnacle taught it to Pogo. Sideways.": "Su Krallığı'ndan bir oyun: Pogo'ya Kıskaç öğretti. Yan yan.", "A game from the Forest Kingdom: Mordo plays it for buttons now, not charms.": "Orman Krallığı'ndan bir oyun: Mordo artık tılsımına değil, düğmesine oynuyor.",
    "Play": "Oyna", "Keep": "Bırak", "Next round": "Sonraki tur", "Collect": "Topla", "Close": "Kapat", "Practice: no rewards": "Antrenman: ödül yok",
    "The crab!": "Yengeç!", "He took half.": "Yarısını aldı.", "All the treasure!": "Bütün hazine çıktı!", "Bubbles! The crab is near.": "Kabarcık! Yengeç yakında.", "The crown! +2": "Taç! +2", "Coins {0}": "Sikke {0}",
    "Time!": "Süre doldu!", "Ouch! -2": "Ay! -2", "Streak! +1": "Seri! +1", "Lantern fish! +3": "Fener balığı! +3", "Caught {0}": "Yakalanan {0}",
    "Splash!": "Şap!", "The boat!": "Tekne!", "Long jump! +2": "Uzun zıplayış! +2", "The turtle dived!": "Kaplumbağa daldı!", "Hops {0}/12": "Sıçrama {0}/12",
    "Found it!": "Buldun!", "Not there…": "Orada değil…", "Watch the starfish…": "Denizyıldızını izle…", "Which shell?": "Hangi kabuk?", "Round {0}/3": "Tur {0}/3",
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
  const NEED = { carrots: ["star", "ch-coin", "ch-crown", "cr-crab"], fireflies: ["jar", "star", "ch-jellyfish", "ch-urchin", "ch-angler"], lilypads: ["ripple", "splash", "star", "ch-turtle", "ch-lifebuoy", "ch-sailboat"], nests: ["star", "ch-shell", "ch-starfish", "ch-crab", "cr-magpie"] };
  const SHEET = { "cr-crab": [72, 16, 176, 176], "cr-magpie": [96, 16, 176, 176] };   // the map's loops: [frames, columns, frame width, frame height], 24 drawings a second
  async function loadArt(name) { const A = {}; await Promise.all(NEED[name].map(async (k) => { A[k] = await img(SRC(k)); })); return A; }
  // one frame of a sheet (or a whole charm), centred on (x, y) at width w (keeps the frame's aspect)
  function spr(x, A, name, f, cx, cy, w, o) { const im = A[name]; if (!im) return; const m = SHEET[name] || (window.MINI_ART || {})[name], n = m ? m[0] : 1, cols = m ? m[1] : 1, fw = m ? m[2] : im.width, fh = m ? m[3] : im.height, i = ((f | 0) % n + n) % n, sx = (i % cols) * fw, sy = Math.floor(i / cols) * fh, h = w * fh / fw;
    if (o) { x.save(); x.translate(cx, cy); if (o.r) x.rotate(o.r); x.scale(o.sx || 1, o.sy || 1); if (o.a !== undefined) x.globalAlpha = Math.max(0, Math.min(1, o.a)); x.drawImage(im, sx, sy, fw, fh, -w / 2, -h * (o.oy ?? .5), w, h); x.restore(); }
    else x.drawImage(im, sx, sy, fw, fh, cx - w / 2, cy - h / 2, w, h); }
  const O = { r: 0, sx: 1, sy: 1, a: 1, oy: .5 }, opt = (r, sx, sy, a, oy) => { O.r = r || 0; O.sx = sx || 1; O.sy = sy || 1; O.a = a === undefined ? 1 : a; O.oy = oy === undefined ? .5 : oy; return O; };   // one options object, reused by every draw

  // ---------------------------------------------------------------- the four sea beds, drawn by hand in the page's own units (780 x 1300; the cove
  // is two pages wide and tiles). Flat cut-paper shapes over a wash, every one placed by hand: no noise, nothing random. Painted once (bg()).
  const VW = 780, VH = 1300, TAU = 6.2832;
  function blob(x, pts, fill) { const n = pts.length; x.beginPath(); for (let i = 0; i <= n; i++) { const a = pts[i % n], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2; if (!i) x.moveTo(mx, my); else x.quadraticCurveTo(a[0], a[1], mx, my); } x.closePath(); x.fillStyle = fill; x.fill(); }
  const wash = (x, y0, y1, c0, c1, w) => { const g = x.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); x.fillStyle = g; x.fillRect(0, y0, w || VW, y1 - y0); };
  // a rolling edge across the page (its heights left to right) filled down to the bottom
  const ridge = (x, ys, fill, w, bottom) => { w = w || VW; const st = (w + 160) / (ys.length - 1), pts = ys.map((y, i) => [-80 + i * st, y]); pts.push([w + 400, (bottom || VH) + 400], [-400, (bottom || VH) + 400]); blob(x, pts, fill); };
  const shaft = (x, x0, w0, x1, w1, h, a) => { x.globalAlpha = a; x.fillStyle = "#fff"; x.beginPath(); x.moveTo(x0, 0); x.lineTo(x0 + w0, 0); x.lineTo(x1 + w1, h); x.lineTo(x1, h); x.closePath(); x.fill(); x.globalAlpha = 1; };
  const dot = (x, cx, cy, r, fill, a) => { x.globalAlpha = a === undefined ? 1 : a; x.fillStyle = fill; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.globalAlpha = 1; };
  // kelp: blades from one root, each [lean at the top, height, width]; coral: thick round branches [x0, y0, x1, y1, width]
  const kelp = (x, bx, by, blades, fill) => { x.strokeStyle = fill; x.lineCap = "round"; for (const [lean, h, w] of blades) { x.lineWidth = w; x.beginPath(); x.moveTo(bx, by); x.bezierCurveTo(bx - lean * .6, by - h * .35, bx + lean * 1.4, by - h * .65, bx + lean, by - h); x.stroke(); } };
  const coral = (x, segs, fill) => { x.strokeStyle = fill; x.lineCap = "round"; for (const [x0, y0, x1, y1, w] of segs) { x.lineWidth = w; x.beginPath(); x.moveTo(x0, y0); x.lineTo(x1, y1); x.stroke(); } };
  const arcs = (x, list, stroke, lw, a) => { x.strokeStyle = stroke; x.lineWidth = lw; x.lineCap = "round"; x.globalAlpha = a; for (const [cx, cy, w] of list) { x.beginPath(); x.moveTo(cx - w / 2, cy); x.quadraticCurveTo(cx, cy - w * .16, cx + w / 2, cy); x.stroke(); } x.globalAlpha = 1; };
  const PAINT = {
    // Buried Treasure: clear morning water, the reef far off, a bank of pale sand
    carrots(x) { wash(x, 0, 640, "#a5e6ee", "#58bcd9");
      ridge(x, [470, 430, 455, 400, 440, 420, 460, 410, 450], "#74cbe0"); ridge(x, [540, 500, 525, 490, 530, 505, 520, 495, 535], "#5ab6d2");
      shaft(x, 150, 90, 40, 200, 700, .13); shaft(x, 420, 60, 380, 150, 700, .1); shaft(x, 610, 70, 640, 170, 700, .12);
      kelp(x, 118, 640, [[-30, 250, 20], [26, 310, 18], [50, 200, 16]], "#3f9f86"); kelp(x, 690, 640, [[24, 280, 20], [-22, 220, 17]], "#3f9f86");
      coral(x, [[610, 630, 610, 540, 22], [610, 580, 575, 520, 18], [610, 565, 648, 505, 18], [575, 520, 560, 480, 14], [648, 505, 665, 470, 14]], "#f08aa2");
      coral(x, [[190, 630, 190, 560, 18], [190, 590, 160, 545, 14], [190, 580, 222, 535, 14]], "#f6a35c");
      const g = x.createLinearGradient(0, 580, 0, VH); g.addColorStop(0, "#f9e7b6"); g.addColorStop(1, "#e7c47e"); ridge(x, [600, 588, 604, 592, 584, 598, 590, 606, 594], g);
      arcs(x, [[150, 670, 90], [600, 690, 110], [395, 815, 80], [210, 985, 100], [585, 990, 90], [300, 1180, 120], [520, 1220, 100], [130, 1140, 70]], "#d6b168", 5, .55);
      blob(x, [[655, 1240], [690, 1195], [740, 1205], [760, 1250], [720, 1280], [670, 1275]], "#b9a58c"); blob(x, [[80, 1262], [100, 1228], [140, 1232], [150, 1264], [118, 1284]], "#c4b196");
      dot(x, 300, 300, 9, "#fff", .35); dot(x, 318, 262, 6, "#fff", .3); dot(x, 520, 380, 8, "#fff", .3); dot(x, 235, 180, 5, "#fff", .3); },
    // Glow Catch: the cove at night, the moon coming down through the water
    fireflies(x) { wash(x, 0, VH, "#2a3f8c", "#0d1640");
      dot(x, 560, 80, 230, "#cfe0ff", .1); dot(x, 560, 80, 120, "#e6eeff", .14); shaft(x, 470, 150, 300, 330, 1300, .05); shaft(x, 560, 60, 520, 150, 1300, .05);
      ridge(x, [1010, 960, 1000, 930, 990, 950, 1020, 965, 1005], "#1c2c6c"); kelp(x, 150, 1130, [[-36, 420, 22], [30, 520, 20], [60, 340, 18]], "#17245c"); kelp(x, 655, 1150, [[30, 470, 22], [-28, 380, 19]], "#17245c");
      ridge(x, [1150, 1105, 1140, 1090, 1128, 1100, 1146, 1110, 1150], "#111b4a");
      coral(x, [[420, 1150, 420, 1085, 18], [420, 1115, 392, 1070, 14], [420, 1108, 450, 1062, 14]], "#1d2d70");
      for (const [cx, cy, r] of [[170, 300, 4], [330, 200, 3], [250, 520, 3], [470, 440, 4], [610, 300, 3], [640, 620, 4], [130, 760, 3], [380, 720, 3], [540, 860, 4], [260, 900, 3], [600, 1010, 3], [200, 160, 3], [450, 150, 3], [690, 470, 3]]) dot(x, cx, cy, r, "#bfe9ff", .5); },
    // Turtle Hop: the top of the water at sunrise, the lighthouse on its island (two pages wide; nothing crosses the seam)
    lilypads(x) { const W = 1560; wash(x, 0, 700, "#ffe6bf", "#c6ebf2", W); dot(x, 1120, 400, 150, "#fff6d0", .5); dot(x, 1120, 400, 86, "#fff3bd");
      for (const [cx, cy, s] of [[260, 250, 1], [760, 170, .8], [1380, 290, .9]]) blob(x, [[cx - 110 * s, cy + 22 * s], [cx - 90 * s, cy - 18 * s], [cx - 30 * s, cy - 46 * s], [cx + 30 * s, cy - 26 * s], [cx + 80 * s, cy - 34 * s], [cx + 120 * s, cy + 16 * s], [cx, cy + 34 * s]], "rgba(255,255,255,.85)");
      blob(x, [[250, 705], [300, 640], [400, 600], [520, 612], [640, 660], [700, 705], [470, 730]], "#8ecfb2"); blob(x, [[990, 705], [1040, 660], [1130, 640], [1230, 668], [1280, 705], [1130, 722]], "#a3d9c0");
      x.fillStyle = "#fff8ea"; x.beginPath(); x.moveTo(432, 612); x.lineTo(440, 500); x.lineTo(468, 500); x.lineTo(476, 612); x.closePath(); x.fill(); x.fillStyle = "#ef6a5a"; x.fillRect(437, 540, 34, 22); x.fillStyle = "#5a4a5a"; x.fillRect(436, 484, 36, 18); x.beginPath(); x.moveTo(430, 486); x.lineTo(454, 458); x.lineTo(478, 486); x.closePath(); x.fill(); dot(x, 454, 493, 6, "#ffe98a");
      wash(x, 690, VH, "#74c9e6", "#2f8fc4", W); x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(0, 690, W, 5);
      arcs(x, [[140, 760, 70], [520, 790, 90], [860, 750, 80], [1250, 800, 90], [330, 850, 110], [1020, 870, 120], [700, 930, 130], [1400, 950, 110], [180, 1010, 120]], "#c9eef8", 5, .6); },
    // Mordo's Shells: under the wreck, a hatch cover for a table
    nests(x) { wash(x, 0, 800, "#8fdbe4", "#3b9bbb");
      blob(x, [[-60, 820], [-40, 330], [120, 250], [330, 300], [470, 430], [560, 640], [600, 820]], "#3f8fa9"); blob(x, [[60, 820], [80, 420], [200, 360], [340, 400], [430, 520], [480, 820]], "#357f9a");
      x.strokeStyle = "#3f8fa9"; x.lineWidth = 22; x.lineCap = "round"; x.beginPath(); x.moveTo(250, 330); x.lineTo(330, 60); x.stroke(); x.lineWidth = 12; x.beginPath(); x.moveTo(280, 150); x.lineTo(400, 130); x.stroke();
      dot(x, 200, 520, 36, "#2d6f88"); dot(x, 200, 520, 24, "#7fd0dc", .7); dot(x, 330, 560, 30, "#2d6f88"); dot(x, 330, 560, 19, "#7fd0dc", .7);
      shaft(x, 480, 80, 420, 190, 800, .12); shaft(x, 640, 60, 660, 150, 800, .1);
      kelp(x, 700, 800, [[26, 300, 20], [-24, 240, 17]], "#3a957e");
      const g = x.createLinearGradient(0, 930, 0, VH); g.addColorStop(0, "#f6e2ae"); g.addColorStop(1, "#e3c07c"); x.fillStyle = g; x.fillRect(0, 930, VW, VH - 930);
      x.fillStyle = "#d39a5c"; x.fillRect(0, 786, VW, 110); x.fillStyle = "#b07a45"; x.fillRect(0, 896, VW, 44); x.fillStyle = "#e3b075"; x.fillRect(0, 786, VW, 10);
      x.strokeStyle = "#a9733f"; x.lineWidth = 4; for (const px of [70, 210, 350, 490, 630, 760]) { x.beginPath(); x.moveTo(px, 796); x.lineTo(px - 14, 896); x.stroke(); } for (const [px, py] of [[90, 812], [228, 812], [368, 812], [508, 812], [648, 812], [80, 880], [218, 880], [358, 880], [498, 880], [638, 880]]) dot(x, px, py, 5, "#8a5a30");
      arcs(x, [[160, 1010, 100], [560, 1060, 110], [330, 1200, 120], [640, 1230, 80]], "#d6b168", 5, .55);
      coral(x, [[110, 1250, 110, 1180, 18], [110, 1215, 80, 1165, 14], [110, 1205, 142, 1160, 14]], "#f08aa2"); blob(x, [[600, 1270], [630, 1225], [690, 1232], [712, 1272], [660, 1292]], "#b9a58c"); }
  };
  const BG = {}, canvasOf = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };
  function bg(name) { if (BG[name]) return BG[name]; const c = canvasOf(name === "lilypads" ? 1560 : VW, VH); PAINT[name](c.getContext("2d")); return (BG[name] = c); }
  // a small picture of a game's sea bed (the playground's grid, the invitation in a boss's chest): painted once at that size, kept as a URL
  const THUMB = {}, CROP = { carrots: [90, 330], fireflies: [90, 640], lilypads: [130, 360], nests: [20, 420] };
  function thumb(name) { if (THUMB[name] !== undefined) return THUMB[name]; let u = ""; try { if (typeof document === "object" && PAINT[name]) { const c = canvasOf(300, 220), x = c.getContext("2d"), s = 300 / 600; x.setTransform(s, 0, 0, s, -CROP[name][0] * s, -CROP[name][1] * s); PAINT[name](x); u = c.toDataURL("image/jpeg", .85); } } catch (e) { u = ""; } return (THUMB[name] = u); }

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
  function bubbles(x, cx, cy, e, h) { x.strokeStyle = "#fff"; x.lineWidth = 4; for (let i = 0; i < 3; i++) { const u = e - i * 470; if (u < 0) continue; KL("bub", u, FK); x.globalAlpha = FK.a * .9; x.beginPath(); x.arc(cx + (i - 1) * 16 + FK.x * 14, cy + FK.y * h, 11 * FK.s, 0, TAU); x.stroke(); } x.globalAlpha = 1; }

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
  function mound(x, cx, cy, w, sx, sy, r, a) { x.save(); x.translate(cx, cy + w * .17); x.globalAlpha = a * .18; x.fillStyle = "#7a5020"; x.beginPath(); x.ellipse(0, w * .03, w * .53, w * .11, 0, 0, TAU); x.fill(); if (r) x.rotate(r); x.scale(sx, sy); x.globalAlpha = a;
    x.fillStyle = "#f8dfa2"; x.strokeStyle = "#c2924c"; x.lineWidth = 6; x.beginPath(); x.ellipse(0, 0, w * .46, w * .36, 0, Math.PI, TAU); x.ellipse(0, 0, w * .46, w * .09, 0, 0, Math.PI); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = "#fff3cf"; x.beginPath(); x.ellipse(-w * .15, -w * .21, w * .12, w * .05, -.45, 0, TAU); x.fill(); x.restore(); }
  function pit(x, cx, cy, w) { x.fillStyle = "#9a7240"; x.strokeStyle = "#c2924c"; x.lineWidth = 5; x.beginPath(); x.ellipse(cx, cy + w * .14, w * .4, w * .13, 0, 0, TAU); x.fill(); x.stroke(); x.fillStyle = "#5e4020"; x.beginPath(); x.ellipse(cx, cy + w * .165, w * .31, w * .085, 0, 0, TAU); x.fill(); }
  GAMES.carrots = (A, end) => {
    const B = bg("carrots"), ROWS = [730, 900, 1070], HOLES = dealSand(Math.random).map((h, i) => Object.assign(h, { c: i % 3, x: 0, y: ROWS[Math.floor(i / 3)], t: -1, fly: -1 })), clods = [], o = {};
    let HW = 200, PX = 690, TX = 700, TY = 50, got = 0, over = false, busy = 0, warned = false;
    const lay = () => { const v = vis(), cx = (v.x0 + v.x1) / 2, sp = Math.min(215, (v.x1 - v.x0) * .32); HW = Math.min(200, sp * .9); for (const h of HOLES) h.x = cx + (h.c - 1) * sp; PX = v.x1 - 70; TX = v.x1 - 60; TY = topY() + 50; };
    const stat = () => { hud.stat.textContent = T("Coins {0}", got); };
    function finish(wait) { if (over) return; over = true; setBtns([]); later(() => end(), wait); }
    return {
      begin() { lay(); stat(); pogo("idle", PX, 640, 170); setBtns([["Keep", () => { if (!over && !busy) finish(300); }]]); },
      fit() { lay(); pogo(null, PX, 640, 170); },
      score: () => got, tier: () => tierOf("carrots", got), peek: () => HOLES.map(h => ({ x: h.x, y: h.y, kind: h.kind, warn: h.warn, open: h.t >= 0 })),
      down(p) { if (over || busy) return; let h = null; for (const q of HOLES) if (q.t < 0 && Math.abs(q.x - p.x) < HW * .5 && Math.abs(q.y - p.y) < 85) { h = q; break; } if (!h) return; h.t = run.t; busy = 1; sfx("swap"); hap(10);
        for (let i = 0; i < 4; i++) clods.push({ x: h.x, y: h.y - 10, dx: (i - 1.5) * 50 + (Math.random() - .5) * 20, dy: 70 + Math.random() * 30, t0: run.t + (h.kind === "crab" ? 420 : 190) });
        if (h.kind === "crab") { setBtns([]); later(() => { sfx("bad"); hap([30, 40, 30]); shout(T("The crab!"), 1000); pogoAct("sad"); }, 480); later(() => { got = Math.floor(got / 2); stat(); shout(T("He took half."), 1200); sfx("tick"); }, 1500); finish(2500); return; }
        later(() => { got += h.kind === "crown" ? 2 : 1; stat(); sfx("pop", got + 2); h.fly = run.t; busy = 0;
          if (h.kind === "crown") { shout(T("The crown! +2"), 900); burst(h.x, h.y - 120, 80); pogoAct("yay"); } else if (h.warn && !warned) { warned = true; shout(T("Bubbles! The crab is near."), 1700); pogoAct("worry"); } else if (got % 3 === 0) pogoAct("nice"); else if (!h.warn) pogoAct("idle");
          let all = true; for (const q of HOLES) if (q.t < 0 && q.kind !== "crab") all = false;
          if (all) { busy = 1; shout(T("All the treasure!"), 1400); sfx("reward"); pogoAct("win"); for (const q of HOLES) if (q.kind !== "crab") burst(q.x, q.y - 20, 70); finish(1500); } }, 200 + KLEN("unearth")); },
      draw(x, t) {
        x.drawImage(B, 0, 0);
        for (const h of HOLES) { if (h.t < 0) { mound(x, h.x, h.y, HW, 1, 1, 0, 1); continue; } const e = t - h.t, crab = h.kind === "crab", d0 = crab ? 420 : 0;
          if (e >= d0 + 150) pit(x, h.x, h.y, HW);
          if (crab && e < d0) { K("rumble", e, o); mound(x, h.x, h.y, HW, 1, o.sy, o.r, 1); } else if (e < d0 + KLEN("dig")) { K("dig", e - d0, o); mound(x, h.x, h.y, HW, o.sx, o.sy, 0, o.a); }
          if (h.warn && e > 900) bubbles(x, h.x, h.y - 6, e - 900, 190); }
        // what came out of the sand, over every mound: a coin on its way up and then to the counter; the crab, up and then off to the side with his half
        for (const h of HOLES) { if (h.t < 0) continue; const e = t - h.t;
          if (h.kind === "crab") { const e2 = e - 420; if (e2 < 0) continue; const cw = HW * 1.2, f = Math.floor(t * .03); K("crabUp", e2, o); const up = o.y, sy = o.sy; K("scuttle", e - 1300, o); const cx = h.x + o.x * (vis().x1 + 160 - h.x), cy = h.y - 36 + (1 + up) * cw * .8 + o.y * 220;
            if (e2 < KLEN("crabUp")) { x.save(); x.beginPath(); x.rect(h.x - 200, h.y - 400, 400, 400 + HW * .2); x.clip(); spr(x, A, "cr-crab", f, cx, cy, cw, opt(0, 1, sy)); x.restore(); } else spr(x, A, "cr-crab", f, cx, cy, cw);
            if (e > 1300 && got + (e < 1500 ? 0 : 1) > 0) spr(x, A, "ch-coin", 0, cx + cw * .34, cy - cw * .1, 54); continue; }
          const name = h.kind === "crown" ? "ch-crown" : "ch-coin", w = HW * .52;
          if (h.fly < 0) { const e3 = e - 200; if (e3 < 0) continue; K("unearth", e3, o); spr(x, A, name, 0, h.x, h.y + 14 + o.y * 96, w * o.s, opt(o.r, o.sx, o.sy)); }
          else { const e4 = t - h.fly; if (e4 >= KLEN("fly")) continue; K("fly", e4, o); const y0 = h.y - 82, d = Math.hypot(TX - h.x, TY - y0); spr(x, A, name, 0, h.x + (TX - h.x) * o.p, y0 + (TY - y0) * o.p - d * o.h * .5, w * o.s, opt(o.r, 1, 1, o.a)); } }
        x.fillStyle = "#d9b46c"; for (let i = clods.length - 1; i >= 0; i--) { const c = clods[i], e = t - c.t0; if (e < 0) continue; if (e > KLEN("clod")) { clods.splice(i, 1); continue; } K("clod", e, o); x.globalAlpha = o.a; x.beginPath(); x.ellipse(c.x + c.dx * o.x, c.y - 30 + c.dy * o.y, 9, 7, 0, 0, TAU); x.fill(); } x.globalAlpha = 1; }
    };
  };

  // ---- Glow Catch
  // swimming paths: four hand-set loops of control points through the water, closed Catmull-Rom curves; each swimmer runs one, offset and at its own pace
  const PATHS = [[[120, 420], [300, 300], [520, 380], [640, 560], [470, 700], [250, 640]], [[650, 300], [520, 520], [330, 480], [180, 640], [360, 820], [600, 700]], [[200, 900], [380, 700], [600, 820], [680, 1000], [430, 1080], [260, 1040]], [[400, 260], [640, 420], [560, 640], [380, 560], [160, 500], [230, 330]]];
  const CRP = [0, 0], cr = (P, u) => { const n = P.length, f = ((u % 1) + 1) % 1 * n, i = Math.floor(f), t = f - i, p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n], q = (a, b, c, d) => .5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t); CRP[0] = q(p0[0], p1[0], p2[0], p3[0]); CRP[1] = q(p0[1], p1[1], p2[1], p3[1]); return CRP; };
  const DOTS = [[-34, -40], [20, -70], [38, -22], [-12, -8], [-40, -92], [8, -112], [44, -66], [-22, -62], [30, 6], [-44, 4], [0, -40], [14, -140]];   // where the caught lights sit in the jar
  GAMES.fireflies = (A, end) => {
    const B = bg("fireflies"), GV = glow("206,170,255"), GY = glow("250,255,170"), LEN = 15000, list = [], misses = [], jar = { x: 250, y: 1150 }, o = {}, ANG = [4200, 9800], URC = [300, 1500, 7000], ang = { on: false, t0: 0, dir: 1, y: 0, x: -999, yy: -999, got: -1, gx: 0, gy: 0 };
    let caught = 0, streak = 0, over = false, t0 = -1, next = 0, shine = 0, angN = 0, urN = 0, statT = -1;
    const spawn = (t, kind) => { const P = PATHS[Math.floor(Math.random() * PATHS.length)], slow = kind === "urchin"; list.push({ kind, P, u: Math.random(), sp: (slow ? .022 + Math.random() * .016 : .05 + Math.random() * .05) * (Math.random() < .5 ? 1 : -1), ph: Math.random() * 1300, born: t, jx: (Math.random() - .5) * 120, jy: (Math.random() - .5) * 120, x: -999, y: -999, got: -1, hit: -1, gx: 0, gy: 0 }); };
    const stat = (t) => { const left = Math.max(0, Math.ceil((LEN - (t0 < 0 ? 0 : t - t0)) / 1000)); hud.stat.textContent = T("Caught {0}", caught) + " · " + left + "s"; };
    return {
      peek(kind) { const v = vis(); if (kind === "angler") return ang.on && ang.got < 0 ? [ang.x, ang.yy] : null; for (const f of list) if (f.got < 0 && f.kind === (kind || "jelly") && f.x > v.x0 + 30 && f.x < v.x1 - 30 && f.y > topY() + 120) return [f.x, f.y]; return null; },
      begin() { t0 = run.t; for (let i = 0; i < 5; i++) spawn(run.t, "jelly"); stat(run.t); pogo("idle", 500, 1210, 170); setBtns([]); },
      fit() { pogo(null, 500, 1210, 170); }, score: () => caught, tier: () => tierOf("fireflies", caught), streak: () => streak,
      down(p) { if (over || t0 < 0) return;
        if (ang.on && ang.got < 0 && Math.hypot(ang.x - p.x, ang.yy - p.y) < 110) { ang.got = run.t; ang.gx = ang.x; ang.gy = ang.yy; caught += 3; streak++; sfx("reward"); hap([15, 20, 15]); shout(T("Lantern fish! +3"), 1000); burst(ang.x, ang.yy, 90); pogoAct("wow"); stat(run.t); return; }
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
        x.fillStyle = "#f6ffb4"; for (let i = 0, n = Math.min(caught, DOTS.length); i < n; i++) { KL("pulse", t + i * 230, o); const fy = KL("float", t + i * 410, FK).y; x.globalAlpha = .45 + .55 * o.g; x.beginPath(); x.arc(jx + DOTS[i][0], jy - 60 + DOTS[i][1] + fy, 6, 0, TAU); x.fill(); } x.globalAlpha = 1;
        for (let i = list.length - 1; i >= 0; i--) { const f = list[i], jelly = f.kind === "jelly";
          if (f.got >= 0) { const e = t - f.got; if (e > KLEN("fly")) { list.splice(i, 1); continue; } K("fly", e, o); const ty = jy - 110, d = Math.hypot(jx - f.gx, ty - f.gy), px = f.gx + (jx - f.gx) * o.p, py = f.gy + (ty - f.gy) * o.p - d * o.h * .4; lit(x, GV, px, py, 170 * o.s, .7 * o.a); spr(x, A, "ch-jellyfish", 0, px, py, 100 * o.s, opt(0, 1, 1, o.a)); continue; }
          f.u += f.sp * dt / 1000; cr(f.P, f.u); KL("float", t + f.ph * 2, o); f.x = Math.max(v.x0 + 50, Math.min(v.x1 - 50, CRP[0] + f.jx * o.r * 30)); f.y = CRP[1] + f.jy * o.y * .15; const fade = Math.min(1, (t - f.born) / 400);
          if (jelly) { KL("pulse", t + f.ph, o); lit(x, GV, f.x, f.y + o.y, 210, fade * (.35 + .6 * o.g)); spr(x, A, "ch-jellyfish", 0, f.x, f.y + o.y, 104, opt(0, o.sx, o.sy, fade)); }
          else { const r = KL("roll", t + f.ph, o).r, e = f.hit >= 0 ? t - f.hit : 9999, s = e < KLEN("sting") ? K("sting", e, o).s : 1; if (e < KLEN("miss")) ring(x, f.x, f.y, e, 95, "#ff8fa8"); spr(x, A, "ch-urchin", 0, f.x, f.y, 96 * s, opt(r, 1, 1, fade)); } }
        // the lantern fish: across the water with its light before it
        if (ang.on) { if (ang.got >= 0) { const e = t - ang.got; if (e > KLEN("fly")) ang.on = false; else { K("fly", e, o); const ty = jy - 110; spr(x, A, "ch-angler", 0, ang.gx + (jx - ang.gx) * o.p, ang.gy + (ty - ang.gy) * o.p - 120 * o.h, 130 * o.s, opt(0, ang.dir, 1, o.a)); } }
          else { const e = t - ang.t0; if (e > KLEN("dart")) ang.on = false; else { K("dart", e, o); const xa = ang.dir > 0 ? v.x0 - 90 : v.x1 + 90, xb = ang.dir > 0 ? v.x1 + 90 : v.x0 - 90; ang.x = xa + (xb - xa) * o.p; ang.yy = ang.y - o.h * 120; lit(x, GY, ang.x + ang.dir * 34, ang.yy - 52, 150, .9); spr(x, A, "ch-angler", 0, ang.x, ang.yy, 140, opt(0, -ang.dir, 1)); } } }
        for (let i = misses.length - 1; i >= 0; i--) { const m = misses[i], e = t - m.t; if (e > KLEN("miss")) { misses.splice(i, 1); continue; } ring(x, m.x, m.y, e, 40, "#fffadc"); } }
    };
  };

  // ---- Turtle Hop
  // the way to the boat: a buoy to start from, then twelve more places, every third a buoy (it stays), the others turtles (they dive), the last the boat
  const HOP = { GOAL: 12, D: 480, TOL: .42, DIVE: 1500, WARN: 600 };
  const makePads = (rnd) => { const pads = [{ x: 200, k: "buoy", w: 230, bob: -1 }]; for (let i = 1; i <= HOP.GOAL; i++) pads.push({ x: pads[i - 1].x + 150 + rnd() * 80 + i * 2, k: i === HOP.GOAL ? "boat" : i % 3 === 0 ? "buoy" : "turtle", w: i === HOP.GOAL ? 300 : 225 - Math.min(40, i * 3), bob: -1 }); return pads; };
  // where a jump of that length from pad `at` comes down: the next pad, the one after it (a long jump), or the water (-1)
  const landOn = (pads, at, to) => { let best = -1, bd = 1e9; for (let j = at + 1; j <= Math.min(HOP.GOAL, at + 2); j++) { const d = Math.abs(to - pads[j].x); if (d <= pads[j].w * HOP.TOL && d < bd) { bd = d; best = j; } } return best; };
  function front() { if (BG.front) return BG.front; const W = 1560, c = canvasOf(W, 340), x = c.getContext("2d"), g = x.createLinearGradient(0, 0, 0, 340); g.addColorStop(0, "#3f9fd0"); g.addColorStop(1, "#2a82b8"); x.fillStyle = g; x.beginPath(); x.moveTo(0, 340); for (let px = 0; px <= W; px += 20) x.lineTo(px, 20 + 9 * Math.sin(px / W * TAU * 6)); x.lineTo(W, 340); x.closePath(); x.fill();
    x.strokeStyle = "#d4f1fa"; x.lineWidth = 5; x.lineCap = "round"; x.beginPath(); for (let px = 0; px <= W; px += 20) { const py = 20 + 9 * Math.sin(px / W * TAU * 6); if (px) x.lineTo(px, py); else x.moveTo(px, py); } x.stroke(); arcs(x, [[180, 110, 110], [620, 150, 130], [1010, 100, 100], [1380, 160, 120], [400, 240, 120], [860, 270, 110], [1240, 250, 130]], "#7cc4e8", 5, .6); return (BG.front = c); }
  GAMES.lilypads = (A, end) => {
    const B = bg("lilypads"), F = front(), WY = 900, SY = WY + 34, FY = WY + 62, { GOAL, D, DIVE, WARN } = HOP, pads = makePads(Math.random), o = {}, PH = 190;
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
          if (P.k === "boat") { let r = fl; if (e >= 0 && e < KLEN("rock")) r += K("rock", e, o).r; spr(x, A, "ch-sailboat", 0, sx + 14, WY - 50 + by + (e >= 0 && e < KLEN("rock") ? o.y : 0), 340, opt(r)); }
          else if (P.k === "buoy") spr(x, A, "ch-lifebuoy", 0, sx, WY + 50 + by, P.w * .92, opt(fl, 1, .56));
          else { let r = fl, a = 1; if (e > DIVE) { K("dive", e - DIVE, o); r += o.r; a = o.a; } if (a > 0) spr(x, A, "ch-turtle", 0, sx, WY + 60 + by, P.w * .88, opt(r, 1, 1, a)); } }
        if (hold >= 0) sq = K("crouch", power(t - hold) * 1000, o).sq;
        if (jump) { const e = t - jump.t0, L = KLEN("hop"); K("hop", Math.min(e, L), o); px = jump.from + (jump.to - jump.from) * o.p; py = SY - jump.h * o.h; sq = o.sq;
          if (!jump.ok && e >= L) { // past the pad (or onto a turtle that is gone): down into the water
            const e2 = e - L; K("sink", e2, o); py = SY + 120 * o.y; alpha = o.a; if (jump.sp < 0) { jump.sp = t; sfx("bad"); hap([30, 40]); shout(T("Splash!"), 1200); pogoAct("sad"); }
            if (e2 > KLEN("sink") + 600 && !over) { over = true; later(() => end(), 400); } }
          else if (jump.ok && e >= L) { const two = jump.j - at === 2, perfect = jump.perfect; at = jump.j; pads[at].bob = t; jump = null; stat(); sfx("pop", Math.min(14, at + 2)); hap(10); landT = t; px = pads[at].x;
            if (at >= GOAL) { over = true; shout(T("The boat!"), 1500); sfx("reward"); burst(pads[at].x, WY - 190, 150); pogoAct("win"); later(() => end(), 1700); }
            else { if (two) { shout(T("Long jump! +2"), 900); burst(pads[at].x, WY - 40, 110, "#ffe27a"); } else if (perfect) { shout(T("Perfect!"), 700); burst(pads[at].x, WY - 30, 80, "#ffffff"); } pogoAct(two || at % 4 === 0 ? "yay" : "idle"); } } }
        else if (fall < 0) { const P = pads[at]; py += padY(P, at, t);
          if (P.k === "turtle" && P.bob >= 0 && !over) { const e = t - P.bob; if (e > DIVE + 300) { fall = t; fallX = P.x; hold = -1; sfx("bad"); hap([30, 40]); shout(T("The turtle dived!"), 1300); pogoAct("sad"); } } }
        if (fall >= 0) { const e = t - fall; K("sink", e, o); px = fallX; py = SY + 30 + 120 * o.y; alpha = o.a; sq = 1; if (e > KLEN("sink") + 700 && !over) { over = true; later(() => end(), 400); } }
        if (landT >= 0 && !jump && fall < 0 && t - landT < KLEN("land")) sq = K("land", t - landT, o).sq;
        // the water in front of everything that floats, at the pads' own pace
        const fx = -((cam % bw) + bw) % bw; x.drawImage(F, fx, FY); x.drawImage(F, fx + bw, FY); x.fillStyle = "#2a82b8"; x.fillRect(0, FY + 338, VW, VH - FY - 338);
        for (let i = 0; i < pads.length; i++) { const P = pads[i], sx = P.x - cam; if (P.bob < 0 || sx < -300 || sx > VW + 300) continue; const e = t - P.bob; if (e < 8 * 50) spr(x, A, "ripple", Math.floor(e / 50), sx, FY + 26, P.w * 1.25); if (P.k === "turtle" && e > WARN && e < DIVE + 500) bubbles(x, sx + P.w * .3, FY + 14, e - WARN, 110); }
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
  GAMES.nests = (A, end) => {
    const B = bg("nests"), BY = 760, SLOT = [200, 390, 580], nests = [0, 1, 2].map(i => ({ s: i, x: SLOT[i], y: BY, sc: 1, lift: -1, lk: "peek", crab: -1 })), order = nests.slice(), o = {}, m = { x: 900, y: 200, fx: 900, fy: 200, tx: 900, ty: 200, t0: 0, act: "", at: -1, face: 1 };
    let SW = 236, round = 1, correct = 0, phase = "intro", holder = null, swaps = [], charm = null, over = false, found = -1;
    const place = () => { const v = vis(), cx = (v.x0 + v.x1) / 2, sp = Math.min(200, (v.x1 - v.x0) * .31); SLOT[0] = cx - sp; SLOT[1] = cx; SLOT[2] = cx + sp; SW = Math.min(240, sp * 1.26); };
    const stat = () => { hud.stat.textContent = T("Round {0}/3", round); };
    const bySlot = (s) => nests[0].s === s ? nests[0] : nests[1].s === s ? nests[1] : nests[2];
    const go = (tx, ty, face) => { m.fx = m.x; m.fy = m.y; m.tx = tx; m.ty = ty; m.t0 = run.t; m.face = face; }, watch = () => go(vis().x1 - 140, topY() + 230, -1);
    function deal() { phase = "drop"; found = -1; nests.forEach(q => { q.x = SLOT[q.s]; q.y = BY; q.sc = 1; q.lift = -1; q.crab = -1; }); const n = holder = nests[Math.floor(Math.random() * 3)]; n.lift = run.t + 500; n.lk = "lid";
      if (round === 1) { m.x = vis().x1 + 220; m.y = topY() + 160; } go(n.x + 34, BY - 400, 1); charm = { t0: run.t + 1000, y0: BY - 320, y1: BY - 8 }; shout(T("Watch the starfish…"), 1300);
      later(() => { sfx("pop", 4); }, 1420); later(() => { sfx("tick"); watch(); }, 2240); later(() => { phase = "shuffle"; shuffle(); }, 2600); }
    function shuffle() { const sp = SHELL.SPEED[round - 1]; let t = run.t; swaps = shellPlan(round, Math.random).map((s) => { const len = KLEN(s.f ? "feint" : "swap") * sp, q = { a: s.a, b: s.b, f: s.f, t0: t, len, done: 0 }; t += len + 60; return q; });
      later(() => { settle(); phase = "pick"; shout(T("Which shell?"), 1000); }, t - run.t + 100); }
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
          if (n === holder && charm) { const e = t - charm.t0; if (e >= KLEN("drop")) { let cy = n.y - 8, s = 1, cr2 = 0; if (found >= 0) { K("hooray", t - found, o); cy += o.y; s = o.s; cr2 = o.r; } spr(x, A, "ch-starfish", 0, n.x, cy, 86 * s, opt(cr2)); }
            else if (e >= 0) { K("drop", e, o); spr(x, A, "ch-starfish", 0, n.x, charm.y0 + (charm.y1 - charm.y0) * o.y, 86 * o.s, opt(o.r)); } }
          if (n.crab >= 0) { K("snap", t - n.crab, o); spr(x, A, "ch-crab", 0, n.x, n.y - 6 + o.y, 92 * o.s, opt(o.r)); }
          spr(x, A, "ch-shell", 0, n.x, n.y + 62 + ly, SW * n.sc, opt(r, 1, sy, 1, .92)); }
        spr(x, A, "cr-magpie", Math.floor(t * .06), m.x, my, 220, opt(mr, m.face, 1));
        if (charm && t < charm.t0) spr(x, A, "ch-starfish", 0, m.x - 24, my + 54, 70); }
    };
  };

  // ---------------------------------------------------------------- cards: the rules before, the reward after
  const ICON = (k) => { let svg = ""; try { svg = (typeof ICO === "object" && ICO[k]) || (typeof BICON === "object" && BICON[k]) || ""; } catch (e) {} return `<i class="ico">${svg}</i>`; };
  const TITLE = { carrots: "Buried Treasure", fireflies: "Glow Catch", lilypads: "Turtle Hop", nests: "Mordo's Shells" };
  const RULE = { carrots: "Dig the sand for coins. The crown counts two. One mound hides the crab: he takes half. Bubbles over a dug mound mean he is next door. Stop with Keep whenever you like.", fireflies: "Tap the glowing jellyfish into the jar. Leave the urchins alone: they sting. Four in a row without a miss is one more. You have 15 seconds.",
    lilypads: "Hold to crouch, let go to jump. Turtles dive soon after you land, buoys stay. A long jump over one counts two. Twelve hops to the boat.", nests: "Mordo hides a starfish under a shell and shuffles them. From round two he feints. Find it three times. A miss keeps half of what you won." };
  // where each game comes from (the kingdom's number, 0-9) and the line its rules card says about it
  const HOME = { carrots: 5, fireflies: 7, lilypads: 1, nests: 0 };
  const FLAV = { carrots: "A game from the Sand Kingdom: the well-diggers play it while the tea brews.", fireflies: "A game from the Night Kingdom: the lantern-lighters play it before bed.",
    lilypads: "A game from the Water Kingdom: Barnacle taught it to Pogo. Sideways.", nests: "A game from the Forest Kingdom: Mordo plays it for buttons now, not charms." };
  function card(html) { cardEl.innerHTML = `<div class="card">${html}</div>`; cardEl.hidden = false; return cardEl.firstElementChild; }
  function intro(name, practice) { return new Promise((res) => { const c = card(`<h2>${T(TITLE[name])}</h2><p>${T(RULE[name])}</p><p style="font-size:13px;font-style:italic;opacity:.8;margin-top:-4px">${T(FLAV[name])}</p>${practice ? `<p class="mprac">${T("Practice: no rewards")}</p>` : ""}<button class="btn" type="button">${T("Play")}</button>`); c.querySelector("button").addEventListener("click", () => { cardEl.hidden = true; res(); }); }); }
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
  async function open(name, opts = {}) { if (!GAMES[name]) throw new Error("no side game " + name); if (run) return run.promise; build(); const practice = !opts.reward;
    let resolve; const promise = new Promise(r => { resolve = r; }); run = { promise, t: 0, fx: [], q: [], g: { draw() {} }, quit: () => {} };
    ov.hidden = false; document.documentElement.classList.add("minigame"); hud.title.textContent = T(TITLE[name]); hud.stat.textContent = ""; say.style.opacity = 0; pogoEl.innerHTML = ""; pogoEl.style.cssText = ""; pogoEl._o = ""; setBtns([]); fit();
    const A = await loadArt(name); let ended = false;
    const finish = async (quit) => { if (ended) return; ended = true; const g = run.g, score = quit ? 0 : g.score(), tier = quit ? 0 : g.tier(); if (g.done) g.done(); setBtns([]);
      const out = payout(name, tier, practice || quit, !!opts.ticket); if (!quit) await result(name, tier, out, practice); close(); resolve({ reward: { game: name, tier, score, practice, stars: out.stars, carrots: out.carrots, boost: out.boost, quit: !!quit } }); };
    run.quit = () => finish(true);
    // the page is drawn behind the rules card; the game starts when Play is pressed
    run.g = GAMES[name](A, () => finish(false)); fit(); start();
    if (!opts.skipIntro) await intro(name, practice); if (ended) return promise; run.g.begin(); fit(); if (run.g.fit) run.g.fit();
    return promise; }
  function close() { if (!ov) return; ov.hidden = true; cardEl.hidden = true; pogoEl.innerHTML = ""; document.documentElement.classList.remove("minigame"); if (raf) cancelAnimationFrame(raf); raf = 0; run = null; clearTimeout(sayT); ov.querySelectorAll(".mflyi").forEach(e => e.remove()); }

  // ---------------------------------------------------------------- the playground (practice; the reward path is MINI.open(name, { reward: true }))
  // 2026-11-06 (story.js): the Playground plays for rewards too: one carrot a game, or one of the free games a boss left behind (save.miniFree);
  // practice stays free and pays nothing. The mode is remembered.
  function playground() { build(); const host = document.createElement("div"); host.className = "modal"; host.id = "mPlay"; const sv = typeof save === "object" && save;
    const can = () => sv && ((sv.miniFree || 0) > 0 || (sv.carrots || 0) >= MINI_REWARD.price);
    let mode = sv && sv.pgMode === "practice" ? "practice" : can() ? "reward" : "practice";
    const head = () => mode === "practice" ? T("Practice: no rewards") : (sv.miniFree || 0) > 0 ? T("Free games: {0}", sv.miniFree) : T("One game: {0} carrot · you have {1}", MINI_REWARD.price, sv.carrots || 0);
    host.innerHTML = `<div class="card"><h2>${T("Playground")}</h2><div class="mpmode"><button type="button" data-m="reward">${ICON("carrot")}${T("For rewards")}</button><button type="button" data-m="practice">${T("Practice")}</button></div><p class="mphead" style="font-size:14px"></p><div class="mpgrid">${Object.keys(TITLE).map(k => `<button type="button" data-g="${k}"><img src="${thumb(k)}" alt="">${T(TITLE[k])}</button>`).join("")}</div><button class="btn ghost" type="button" data-x>${T("Close")}</button></div>`;
    const paint = () => { host.querySelectorAll("[data-m]").forEach(b => b.classList.toggle("on", b.dataset.m === mode)); host.querySelector(".mphead").textContent = head(); host.querySelector(".mpgrid").classList.toggle("poor", mode === "reward" && !can()); };
    document.body.appendChild(host); paint(); const shut = () => host.remove();
    host.addEventListener("click", (e) => { const m = e.target.closest("[data-m]"); if (m) { mode = m.dataset.m; if (sv) { sv.pgMode = mode; try { persist(); } catch (er) {} } paint(); return; }
      const b = e.target.closest("[data-g]"); if (b) { if (mode === "reward") { if (!can()) { sfx("bad"); const hd = host.querySelector(".mphead"); hd.textContent = T("No carrots left. Win levels to earn more, or play for practice."); if (window.bump) bump(hd); return; }
          if ((sv.miniFree || 0) > 0) sv.miniFree--; else sv.carrots -= MINI_REWARD.price; try { persist(); const c = document.getElementById("carrots"); if (c) c.textContent = sv.carrots || 0; } catch (er) {}
          shut(); open(b.dataset.g, { reward: true, ticket: true }); return; }
        shut(); open(b.dataset.g, { reward: false }); return; }
      if (e.target.closest("[data-x]") || e.target === host) shut(); }); }

  window.MINI_T = (g) => T(TITLE[g] || g);
  window.MINI = { open, close, playground, thumb, games: Object.keys(GAMES), get running() { return !!run; }, keys: MK, sample: K, reward: MINI_REWARD, home: HOME, flavor: (g) => T(FLAV[g] || "") };
  // test hook: open a game straight into play, read its state, poke it
  for (const k of ["carrot", "fly", "lily", "nest"]) window["__" + k + "Peek"] = (a) => run && run.g.peek ? run.g.peek(a) : null;
  window.__mini = { open: (n, o) => open(n, Object.assign({ skipIntro: true }, o)), get run() { return run; }, view: () => view, toScreen, tierOf, roll, near, dealSand, makePads, landOn, HOP, shellPlan, shellEnd, SHELL };
})();
