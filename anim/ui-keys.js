// Charmfall UI motion, keyed by hand (2026-11-02). Edit the tables below; no build step, the page turns them into CSS @keyframes on load.
// Each motion is a list of keys: [time in ms, { css properties }, ease INTO this key]. A key keeps nothing from the one before it, so write
// every property you animate in every key. The first ease is ignored. Same idea as Pogo's clips (pogo-anim.js): anticipation before a big
// move, a fast-out snap, a small overshoot and a settle, never one long generic tween. Times are absolute; the animation runs as long as the
// last key. These replace the page's two-key tweens of the same names (cardIn, cardOut, kidIn, dropIn, riseIn, starHollow, fade, fadeOut).
//
// 2026-11-02 (İdris "animasyonlar bizim olsun"): three more kinds of table live here now.
//   KEYS   CSS motions (cards, HUD, buttons, map pieces, the wipe, Pogo's moment, the station ceremony): every sine "pulse"/"breathe"/"bob"
//          of the page is a keyed cycle with a hold, a small anticipation, a snap and a settle.
//   WAAPI  the same key format for the few things the page animates from script (HUD bumps, the toast, tips, the achievement banner,
//          floating text): UI_KEYS.waapi(name) returns Web Animations keyframes with per-key easing.
//   BOARD  numbers sampled by the canvas every frame (the move hint, paper petals, a charm's arrival and a special's birth, score floaters):
//          UI_KEYS.sample(name, ms, out) fills `out` with the values at that time, easing read from the table; nothing allocated per frame.
(() => {
  const SNAP = "cubic-bezier(.18, .9, .32, 1)";     // fast out, long settle: arrivals
  const SETTLE = "cubic-bezier(.45, 0, .55, 1)";    // in and out: overshoot coming back
  const DROP = "cubic-bezier(.6, 0, .9, .45)";      // slow start, fast finish: exits
  const LIFT = "cubic-bezier(.3, 0, .5, 1)";        // small anticipation before an exit
  const HOLD = "linear";                             // between two equal keys: nothing moves
  const T = (x, y, s, r) => `translate(${x}px, ${y}px) scale(${s}) rotate(${r}deg)`;
  const KEYS = {
    // a pop-up card: rises from a little below, overshoots up and larger, dips once, settles (about 28 frames at 60 fps)
    cardIn: [
      [0,   { transform: T(0, 30, .84, -1.4), opacity: 0 }],
      [130, { transform: T(0, -7, 1.035, .5), opacity: 1 }, SNAP],
      [250, { transform: T(0, 2, .988, -.2), opacity: 1 }, SETTLE],
      [360, { transform: T(0, -.5, 1.004, 0), opacity: 1 }, SETTLE],
      [460, { transform: T(0, 0, 1, 0), opacity: 1 }, SETTLE],
    ],
    // closing: a small lift first (it reads as the card being picked up), then it drops away; fits the 170 ms hide()
    cardOut: [
      [0,   { transform: T(0, 0, 1, 0), opacity: 1 }],
      [50,  { transform: T(0, -4, 1.018, 0), opacity: 1 }, LIFT],
      [170, { transform: T(0, 26, .88, .8), opacity: 0 }, DROP],
    ],
    // the card's lines come in one after another (delays are set per child in the page)
    kidIn: [
      [0,   { transform: "translateY(12px)", opacity: 0 }],
      [180, { transform: "translateY(-2px)", opacity: 1 }, SNAP],
      [300, { transform: "translateY(0px)", opacity: 1 }, SETTLE],
    ],
    // in-game header and the booster tray: fall/rise into place with one small bounce
    dropIn: [
      [0,   { transform: "translateY(-30px)", opacity: 0 }],
      [220, { transform: "translateY(4px)", opacity: 1 }, SNAP],
      [330, { transform: "translateY(-1px)", opacity: 1 }, SETTLE],
      [430, { transform: "translateY(0px)", opacity: 1 }, SETTLE],
    ],
    riseIn: [
      [0,   { transform: "translateY(34px)", opacity: 0 }],
      [230, { transform: "translateY(-5px)", opacity: 1 }, SNAP],
      [350, { transform: "translateY(1px)", opacity: 1 }, SETTLE],
      [460, { transform: "translateY(0px)", opacity: 1 }, SETTLE],
    ],
    // the board itself: set down on the page a touch larger, then it settles flat (was a generic scale tween)
    boardIn: [
      [0,   { transform: "scale(.94)", opacity: 0 }],
      [180, { transform: "scale(1.012)", opacity: 1 }, SNAP],
      [290, { transform: "scale(.997)", opacity: 1 }, SETTLE],
      [380, { transform: "scale(1)", opacity: 1 }, SETTLE],
    ],
    // 2026-11-02 the pop-up book: each paper layer of the game screen stands up from the page when a level opens. It lies flat, swings up fast,
    // overshoots past upright, falls back a little and settles (the far layer first, the near one last: delays set below)
    popUp: [
      [0,   { transform: "rotateX(84deg)", opacity: 0 }],
      [60,  { transform: "rotateX(78deg)", opacity: 1 }, LIFT],
      [260, { transform: "rotateX(-9deg)", opacity: 1 }, SNAP],
      [380, { transform: "rotateX(4deg)", opacity: 1 }, SETTLE],
      [480, { transform: "rotateX(-1.5deg)", opacity: 1 }, SETTLE],
      [580, { transform: "rotateX(0deg)", opacity: 1 }, SETTLE],
    ],
    // the map's scenery standing up from the page as it comes into view: a quick swing up past upright, back, settle (on a wrapper round the
    // picture, so the pieces' own sway and hop keep running)
    popStand: [
      [0,   { transform: "perspective(500px) rotateX(86deg)" }],
      [210, { transform: "perspective(500px) rotateX(-14deg)" }, SNAP],
      [330, { transform: "perspective(500px) rotateX(6deg)" }, SETTLE],
      [430, { transform: "perspective(500px) rotateX(-2deg)" }, SETTLE],
      [520, { transform: "perspective(500px) rotateX(0deg)" }, SETTLE],
    ],
    // the result card's empty stars spin in, overshoot and settle
    starHollow: [
      [0,   { transform: "rotate(-170deg) scale(0)", opacity: 0 }],
      [260, { transform: "rotate(10deg) scale(1.14)", opacity: 1 }, SNAP],
      [380, { transform: "rotate(-4deg) scale(.96)", opacity: 1 }, SETTLE],
      [500, { transform: "rotate(0deg) scale(1)", opacity: 1 }, SETTLE],
    ],
    // a won star: spins in fast, lands too big, shrinks under, settles (the delay per star is set in the page)
    starFill: [
      [0,   { transform: "rotate(-540deg) scale(0)", opacity: 0 }],
      [190, { transform: "rotate(-300deg) scale(.55)", opacity: 1 }, LIFT],
      [520, { transform: "rotate(12deg) scale(1.28)", opacity: 1 }, SNAP],
      [640, { transform: "rotate(-4deg) scale(.95)", opacity: 1 }, SETTLE],
      [750, { transform: "rotate(0deg) scale(1)", opacity: 1 }, SETTLE],
    ],
    // the small stars in a card's score line
    starIn: [
      [0,   { transform: "scale(0) rotate(-120deg)", opacity: 0 }],
      [300, { transform: "scale(1.18) rotate(8deg)", opacity: 1 }, SNAP],
      [450, { transform: "scale(.95) rotate(-3deg)", opacity: 1 }, SETTLE],
      [600, { transform: "scale(1) rotate(0deg)", opacity: 1 }, SETTLE],
    ],
    // "Perfect!" on the result card: rests, swells once, settles, rests (the sine alternate it replaces never rested)
    perfectPulse: [
      [0,    { transform: "scale(1)" }],
      [900,  { transform: "scale(1)" }, HOLD],
      [1000, { transform: "scale(.985)" }, LIFT],
      [1180, { transform: "scale(1.06)" }, SNAP],
      [1380, { transform: "scale(.995)" }, SETTLE],
      [1600, { transform: "scale(1)" }, SETTLE],
    ],
    // the dimmed backdrop behind a card
    fade: [
      [0,   { opacity: 0 }],
      [250, { opacity: 1 }, "cubic-bezier(.2, .7, .3, 1)"],
    ],
    fadeOut: [
      [0,   { opacity: 1 }],
      [60,  { opacity: 1 }, HOLD],
      [170, { opacity: 0 }, DROP],
    ],
    // the map coming back after a level: same curve as the card backdrop
    screenIn: [
      [0,   { opacity: 0 }],
      [280, { opacity: 1 }, "cubic-bezier(.2, .7, .3, 1)"],
    ],
    // ---- loops: the last key equals the first, the cycle has a rest in it, the move is anticipation + snap + settle
    // the Play / Continue / Claim buttons: rest, a small press, a lift, settle, rest (was a 1.5 s sine scale)
    breathe: [
      [0,    { transform: "translateY(0px) scale(1)" }],
      [1500, { transform: "translateY(0px) scale(1)" }, HOLD],
      [1680, { transform: "translateY(1px) scale(.985)" }, LIFT],
      [1880, { transform: "translateY(-2px) scale(1.04)" }, SNAP],
      [2130, { transform: "translateY(.5px) scale(.995)" }, SETTLE],
      [2400, { transform: "translateY(0px) scale(1)" }, SETTLE],
    ],
    // anything that asks for a tap (an armed booster, a ready daily button, today's day, a due badge, "GO"): rest, press, snap bigger, settle
    pulse: [
      [0,    { transform: "scale(1)" }],
      [480,  { transform: "scale(1)" }, HOLD],
      [600,  { transform: "scale(.97)" }, LIFT],
      [760,  { transform: "scale(1.09)" }, SNAP],
      [920,  { transform: "scale(.99)" }, SETTLE],
      [1100, { transform: "scale(1)" }, SETTLE],
    ],
    // the current level's button on the map
    lvPulse: [
      [0,    { transform: "scale(1)" }],
      [1200, { transform: "scale(1)" }, HOLD],
      [1330, { transform: "scale(.97)" }, LIFT],
      [1500, { transform: "scale(1.07)" }, SNAP],
      [1700, { transform: "scale(.99)" }, SETTLE],
      [2000, { transform: "scale(1)" }, SETTLE],
    ],
    // the ring that leaves the current level's button: appears small and bright, grows fast then slows, fades, rests
    beacon: [
      [0,    { transform: "scale(.72)", opacity: 0 }],
      [120,  { transform: "scale(.8)", opacity: .9 }, SNAP],
      [700,  { transform: "scale(1.2)", opacity: .5 }, "cubic-bezier(.2, .6, .4, 1)"],
      [1300, { transform: "scale(1.5)", opacity: 0 }, "cubic-bezier(.3, .5, .6, 1)"],
      [1600, { transform: "scale(1.5)", opacity: 0 }, HOLD],
    ],
    // a HUD counter that just changed: a quick press, a snap up with the gold tint, settle
    bump: [
      [0,   { transform: "scale(1)" }],
      [60,  { transform: "scale(.9)" }, LIFT],
      [180, { transform: "scale(1.32)", color: "#ffd200" }, SNAP],
      [300, { transform: "scale(.97)" }, SETTLE],
      [430, { transform: "scale(1)" }, SETTLE],
    ],
    // the yellow wipe between screens: the panel arrives with a hard stop and a hair of overshoot, waits, then is pulled off after a small tug back
    wpIn: [
      [0,   { transform: "translateX(115%) skewX(-14deg)" }],
      [60,  { transform: "translateX(113%) skewX(-14deg)" }, LIFT],
      [240, { transform: "translateX(-1.2%) skewX(-14deg)" }, DROP],
      [300, { transform: "translateX(0%) skewX(-14deg)" }, SETTLE],
    ],
    wpOut: [
      [0,   { transform: "translateX(0%) skewX(-14deg)" }],
      [70,  { transform: "translateX(1.5%) skewX(-14deg)" }, LIFT],
      [340, { transform: "translateX(-125%) skewX(-14deg)" }, DROP],
    ],
    // Pogo's dash over the panel: a push off, then full speed across
    wpRun: [
      [0,   { transform: "translateX(-200px)" }],
      [140, { transform: "translateX(-130px)" }, "cubic-bezier(.5, 0, .9, .6)"],
      [840, { transform: "translateX(calc(100vw + 40px))" }, HOLD],
    ],
    // Pogo's quick moment: he pops up from below the screen, lands with a small squash, and drops back after a tiny hop
    pgmIn: [
      [0,   { transform: "translateY(46px) scale(.4)", opacity: 0 }],
      [200, { transform: "translateY(-8px) scale(1.06)", opacity: 1 }, SNAP],
      [280, { transform: "translateY(3px) scale(.98)", opacity: 1 }, SETTLE],
      [340, { transform: "translateY(0px) scale(1)", opacity: 1 }, SETTLE],
    ],
    pgmOut: [
      [0,   { transform: "translateY(0px) scale(1)", opacity: 1 }],
      [70,  { transform: "translateY(-4px) scale(1.02)", opacity: 1 }, LIFT],
      [280, { transform: "translateY(30px) scale(.6)", opacity: 0 }, DROP],
    ],
    pgmBurst: [
      [0,    { transform: "scale(.3) rotate(0deg)", opacity: 0 }],
      [300,  { transform: "scale(1) rotate(25deg)", opacity: .9 }, SNAP],
      [1200, { transform: "scale(1.08) rotate(55deg)", opacity: .5 }, HOLD],
      [1600, { transform: "scale(1.15) rotate(70deg)", opacity: 0 }, SETTLE],
    ],
    // the green circle that grows over the map when a level is tapped: it shrinks a touch first, then grows fast
    zoomGrow: [
      [0,   { transform: "scale(.2)" }],
      [90,  { transform: "scale(.16)" }, LIFT],
      [420, { transform: "scale(var(--z))" }, DROP],
    ],
    // the HUD Pogo when the moves run low: a shake with a pause at each side
    worry: [
      [0,    { transform: "rotate(-5deg)" }],
      [380,  { transform: "rotate(5deg)" }, SNAP],
      [500,  { transform: "rotate(5deg)" }, HOLD],
      [880,  { transform: "rotate(-5deg)" }, SNAP],
      [1000, { transform: "rotate(-5deg)" }, HOLD],
    ],
    // a plant arriving in the station garden
    gardenIn: [
      [0,   { transform: "scale(0) rotate(-90deg)", opacity: 0 }],
      [380, { transform: "scale(1.14) rotate(6deg)", opacity: 1 }, SNAP],
      [540, { transform: "scale(.96) rotate(-2deg)", opacity: 1 }, SETTLE],
      [700, { transform: "scale(1) rotate(0deg)", opacity: 1 }, SETTLE],
    ],
    // ---- map pieces (loops). A villager's hop: crouch, jump, land, rest; a won prop's sway and the forest's lean rest at each end;
    // Mordo's float and the flying creatures' hover drift with a dip, never a pendulum
    villagerHop: [
      [0,    { transform: "translateY(0px) rotate(-4deg)" }],
      [260,  { transform: "translateY(-7px) rotate(3deg)" }, SNAP],
      [520,  { transform: "translateY(0px) rotate(-2deg)" }, DROP],
      [620,  { transform: "translateY(.5px) rotate(-4deg)" }, SETTLE],
      [1300, { transform: "translateY(0px) rotate(-4deg)" }, HOLD],
    ],
    propSway: [
      [0,    { transform: "rotate(-2.5deg)" }],
      [2400, { transform: "rotate(2.5deg)" }, SETTLE],
      [2800, { transform: "rotate(2.5deg)" }, HOLD],
      [5200, { transform: "rotate(-2.5deg)" }, SETTLE],
      [5600, { transform: "rotate(-2.5deg)" }, HOLD],
    ],
    sway: [
      [0,    { transform: "rotate(-5deg) translateY(0px)" }],
      [2900, { transform: "rotate(5deg) translateY(-3px)" }, SETTLE],
      [3400, { transform: "rotate(5deg) translateY(-3px)" }, HOLD],
      [6300, { transform: "rotate(-5deg) translateY(0px)" }, SETTLE],
      [6800, { transform: "rotate(-5deg) translateY(0px)" }, HOLD],
    ],
    bob: [
      [0,    { transform: "translateY(0px) rotate(-3deg)" }],
      [2500, { transform: "translateY(-3px) rotate(3deg)" }, SETTLE],
      [3000, { transform: "translateY(-3px) rotate(3deg)" }, HOLD],
      [5500, { transform: "translateY(0px) rotate(-3deg)" }, SETTLE],
      [6000, { transform: "translateY(0px) rotate(-3deg)" }, HOLD],
    ],
    mordoBob: [
      [0,    { transform: "translateY(0px) rotate(-3deg)" }],
      [1100, { transform: "translateY(-6px) rotate(3deg)" }, "cubic-bezier(.3, .1, .4, 1)"],
      [1500, { transform: "translateY(-6px) rotate(3deg)" }, HOLD],
      [2600, { transform: "translateY(0px) rotate(-3deg)" }, SETTLE],
      [3000, { transform: "translateY(0px) rotate(-3deg)" }, HOLD],
    ],
    aniHover: [
      [0,     { transform: "translate(-3px, 2px)" }],
      [2500,  { transform: "translate(1px, -4px)" }, SETTLE],
      [5000,  { transform: "translate(3px, -5px)" }, SETTLE],
      [7500,  { transform: "translate(-1px, -1px)" }, SETTLE],
      [10000, { transform: "translate(-3px, 2px)" }, SETTLE],
    ],
    featherBob: [
      [0,    { transform: "translateY(0px) rotate(-3deg)" }],
      [1500, { transform: "translateY(-6px) rotate(3deg)" }, SETTLE],
      [1800, { transform: "translateY(-6px) rotate(3deg)" }, HOLD],
      [3300, { transform: "translateY(0px) rotate(-3deg)" }, SETTLE],
      [3600, { transform: "translateY(0px) rotate(-3deg)" }, HOLD],
    ],
    // a butterfly's loop on the map: four stations, each reached fast and left slowly
    flutter: [
      [0,    { translate: "0 0", rotate: "-8deg" }],
      [700,  { translate: "var(--fx) -18px", rotate: "10deg" }, SNAP],
      [1600, { translate: "calc(var(--fx) * .4) -34px", rotate: "-6deg" }, SETTLE],
      [2400, { translate: "calc(var(--fx) * -.5) -12px", rotate: "8deg" }, SNAP],
      [3200, { translate: "0 0", rotate: "-8deg" }, SETTLE],
    ],
    // Mordo arrives on the map: a long slide in from low left with a spin, lands too far, settles
    mordoArrive: [
      [0,    { translate: "-90px 160px", scale: ".5", rotate: "-25deg" }],
      [700,  { translate: "6px -8px", scale: "1.06", rotate: "4deg" }, SNAP],
      [900,  { translate: "-2px 2px", scale: ".98", rotate: "-1deg" }, SETTLE],
      [1100, { translate: "0 0", scale: "1", rotate: "0deg" }, SETTLE],
    ],
    // Mordo in a level: the grab (a wind-up, the lunge, back) and the flight away
    mordoGrab: [
      [0,   { translate: "0 0", scale: "1" }],
      [120, { translate: "8px -10px", scale: ".94" }, LIFT],
      [340, { translate: "-70px 110px", scale: "1.35" }, SNAP],
      [480, { translate: "-62px 98px", scale: "1.3" }, HOLD],
      [750, { translate: "0 0", scale: "1" }, SETTLE],
    ],
    mordoAway: [
      [0,    { translate: "0 0", opacity: 1 }],
      [140,  { translate: "-6px 8px", opacity: 1 }, LIFT],
      [540,  { translate: "40px -70px", opacity: .15 }, DROP],
      [1200, { translate: "0 0", opacity: 1 }, SETTLE],
    ],
    // the station ceremony: the green wash sweeps in, the train slides in and stops with a bump, the sign drops on its chain
    cgWipe: [
      [0,   { transform: "scaleX(0)" }],
      [700, { transform: "scaleX(1)" }, "cubic-bezier(.3, 0, .2, 1)"],
    ],
    ctIn: [
      [0,    { transform: "translateX(-80vw)" }],
      [1000, { transform: "translateX(-24px)" }, "cubic-bezier(.2, .6, .25, 1)"],
      [1150, { transform: "translateX(-33px)" }, SETTLE],
      [1300, { transform: "translateX(-30px)" }, SETTLE],
    ],
    csDrop: [
      [0,   { transform: "translateY(-110vh) rotate(-8deg)" }],
      [560, { transform: "translateY(10px) rotate(2deg)" }, DROP],
      [720, { transform: "translateY(-4px) rotate(-1deg)" }, SETTLE],
      [900, { transform: "translateY(0px) rotate(0deg)" }, SETTLE],
    ],
    // the SVG Pogo in the app's HUD: breath and tail with a rest at the end of each
    pgBreath: [
      [0,    { transform: "scale(1, 1)" }],
      [1300, { transform: "scale(1.015, .975)" }, SETTLE],
      [1600, { transform: "scale(1.015, .975)" }, HOLD],
      [2800, { transform: "scale(1, 1)" }, SETTLE],
      [3000, { transform: "scale(1, 1)" }, HOLD],
    ],
    pgTail: [
      [0,    { transform: "rotate(-9deg)" }],
      [500,  { transform: "rotate(13deg)" }, SNAP],
      [700,  { transform: "rotate(13deg)" }, HOLD],
      [1300, { transform: "rotate(-9deg)" }, SETTLE],
      [1400, { transform: "rotate(-9deg)" }, HOLD],
    ],
  };
  // script-driven motions (Web Animations API): same table shape; UI_KEYS.waapi(name) hands them to element.animate()
  const WAAPI = {
    // the toast word in a level ("Sweet!", "Charmfall!"): bursts in too big with a tilt, settles, holds, lifts away
    toast: [
      [0,    { opacity: 0, transform: "translate(-50%,-50%) scale(.3) rotate(-8deg)" }],
      [200,  { opacity: 1, transform: "translate(-50%,-50%) scale(1.12) rotate(2deg)" }, SNAP],
      [330,  { opacity: 1, transform: "translate(-50%,-50%) scale(1) rotate(0deg)" }, SETTLE],
      [820,  { opacity: 1, transform: "translate(-50%,-52%) scale(1) rotate(0deg)" }, HOLD],
      [1100, { opacity: 0, transform: "translate(-50%,-70%) scale(1.1) rotate(0deg)" }, DROP],
    ],
    // a counter in the HUD that just changed
    bump: KEYS.bump,
    // the instruction pill above the board: in, readable, out (the hold is stretched by the page to the message's time)
    tipIn: [
      [0,   { opacity: 0, transform: "translate(-50%, 10px) scale(.9)" }],
      [200, { opacity: 1, transform: "translate(-50%, 0px) scale(1)" }, SNAP],
    ],
    tipOut: [
      [0,   { opacity: 1, transform: "translate(-50%, 0px) scale(1)" }],
      [260, { opacity: 0, transform: "translate(-50%, 6px) scale(.96)" }, DROP],
    ],
    // the achievement banner drops from the top, hangs, is pulled back up
    achpop: [
      [0,    { transform: "translate(-50%,-160%)" }],
      [290,  { transform: "translate(-50%,4%)" }, SNAP],
      [400,  { transform: "translate(-50%,0%)" }, SETTLE],
      [1550, { transform: "translate(-50%,0%)" }, HOLD],
      [1620, { transform: "translate(-50%,3%)" }, LIFT],
      [1800, { transform: "translate(-50%,-160%)" }, DROP],
    ],
    // a word floating up from the top of a screen, and a small sign floating up from a tap
    flyText: [
      [0,    { opacity: 0, transform: "translate(-50%,10px) scale(.6)" }],
      [220,  { opacity: 1, transform: "translate(-50%,-2px) scale(1.1)" }, SNAP],
      [340,  { opacity: 1, transform: "translate(-50%,0px) scale(1)" }, SETTLE],
      [800,  { opacity: 1, transform: "translate(-50%,-22px) scale(1)" }, HOLD],
      [1100, { opacity: 0, transform: "translate(-50%,-46px) scale(1)" }, DROP],
    ],
    floatAt: [
      [0,    { opacity: 0, transform: "translate(-50%,-50%) scale(.4)" }],
      [300,  { opacity: 1, transform: "translate(-50%,-95%) scale(1.12)" }, SNAP],
      [420,  { opacity: 1, transform: "translate(-50%,-90%) scale(1)" }, SETTLE],
      [1300, { opacity: 0, transform: "translate(calc(-50% + var(--dx, 0px)),-260%) scale(.9)" }, "cubic-bezier(.4, 0, .8, .7)"],
    ],
  };
  // numbers for the canvas (board cells for distances, 0..1 for amounts). Sampled with UI_KEYS.sample(name, ms, out).
  const BOARD = {
    // the move hint, one 2 s cycle from the moment the hint is due (the game loops it): the two charms are picked up (their shadow slides
    // out from under them), nudged toward each other twice, set back down; a soft wash with a pencil ring sits under them and breathes
    hint: [
      [0,    { lift: 0, nudge: 0, ring: 0 }],
      [160,  { lift: 1, nudge: 0, ring: .8 }, SNAP],
      [340,  { lift: 1, nudge: 1, ring: 1 }, SNAP],
      [520,  { lift: 1, nudge: .3, ring: 1 }, SETTLE],
      [680,  { lift: 1, nudge: .85, ring: 1 }, SNAP],
      [900,  { lift: 1, nudge: 0, ring: .9 }, SETTLE],
      [1120, { lift: 0, nudge: 0, ring: .75 }, DROP],
      [1200, { lift: .08, nudge: 0, ring: .7 }, SETTLE],
      [1300, { lift: 0, nudge: 0, ring: .65 }, SETTLE],
      [1750, { lift: 0, nudge: 0, ring: .35 }, SETTLE],
      [2000, { lift: 0, nudge: 0, ring: 0 }, SETTLE],
    ],
    // a paper petal falling over the board when a level is won (x: sideways in cells, mirrored for every other petal; y: fallen in cells;
    // r: turns; f: the face, 1 front .. -1 back; a: alpha): each glide is fast at the start and slow at the end, the flip comes at the turn
    petal: [
      [0,    { x: 0,   y: 0,   r: 0,   f: 1,   a: 0 }],
      [140,  { x: .05, y: .3,  r: .05, f: .85, a: 1 }, SNAP],
      [620,  { x: .5,  y: 1.4, r: .18, f: -.9, a: 1 }, SETTLE],
      [1120, { x: .1,  y: 2.6, r: .1,  f: .95, a: 1 }, SETTLE],
      [1680, { x: .6,  y: 3.9, r: .27, f: -.85, a: 1 }, SETTLE],
      [2240, { x: .15, y: 5.1, r: .17, f: .9,  a: 1 }, SETTLE],
      [2840, { x: .55, y: 6.5, r: .32, f: -.8, a: 1 }, SETTLE],
      [3300, { x: .4,  y: 7.6, r: .38, f: -.4, a: 0 }, "cubic-bezier(.4, 0, .8, .6)"],
    ],
    // a charm that appears in place (a refill after a shuffle, a seed): grows past size, shrinks under, settles
    born: [
      [0,   { s: 0 }],
      [170, { s: 1.14 }, SNAP],
      [250, { s: .96 }, SETTLE],
      [300, { s: 1 }, SETTLE],
    ],
    // a special charm being made: a quick squeeze, a swell with one full turn, settle (s = how much of the game's extra size it shows, r = turns)
    popSpecial: [
      [0,   { s: 0, r: 0 }],
      [60,  { s: -.12, r: 0 }, LIFT],
      [250, { s: 1, r: .55 }, SNAP],
      [330, { s: .3, r: .85 }, SETTLE],
      [420, { s: 0, r: 1 }, SETTLE],
    ],
    // a score floater: pops in over size, settles, drifts up while fading (y in cells, up)
    floater: [
      [0,   { s: .05, y: 0, a: 1 }],
      [150, { s: 1.18, y: .12, a: 1 }, SNAP],
      [260, { s: .97, y: .2, a: 1 }, SETTLE],
      [340, { s: 1, y: .26, a: 1 }, SETTLE],
      [520, { s: 1, y: .62, a: 1 }, HOLD],
      [850, { s: 1, y: 1.1, a: 0 }, "cubic-bezier(.4, 0, .7, .6)"],
    ],
  };
  // how long each motion runs and which element uses it (the page's own durations were two-key tweens of other lengths)
  const L = (k) => KEYS[k].at(-1)[0] + "ms";
  const USE = `
    .card { animation: cardIn ${L("cardIn")} linear both; }
    .modal { animation: fade ${L("fade")} linear both; }
    .modal.out { animation: fadeOut ${L("fadeOut")} linear both; pointer-events: none; }
    .modal.out .card { animation: cardOut ${L("cardOut")} linear both; }
    .modal:not([hidden]):not(.out) .card > :is(p, h2, .goalrow, .cbar, .chip, #sPogo, #ePogo) { animation: kidIn ${L("kidIn")} linear both; }
    #game:not([hidden]) .hud, #game:not([hidden]) .bar, #game:not([hidden]) .frz { animation: dropIn ${L("dropIn")} linear both; }
    #game:not([hidden]) .boosters { animation: riseIn ${L("riseIn")} 80ms linear both; }
    #game:not([hidden]) #c { animation: boardIn ${L("boardIn")} linear both; }
    #map:not([hidden]) { animation: screenIn ${L("screenIn")} linear both; }
    #path.pp .mprop.pu.up > b.pst { animation: popStand ${L("popStand")} var(--pd, 0ms) linear both; }
    #gDio.up .dio.far, #gDio.up .dio.mid, #gDio.up .dio.near { animation: popUp ${L("popUp")} 120ms linear both; } #gDio.up .dio.mid { animation-delay: 210ms; } #gDio.up .dio.near { animation-delay: 300ms; }
    #eStars.stars3 svg.o { animation: starHollow ${L("starHollow")} linear both; animation-delay: var(--o, 0s); }
    #eStars.stars3 svg.f { animation: starFill ${L("starFill")} linear both; animation-delay: var(--d, 0s); }
    .card .big b i { animation: starIn ${L("starIn")} linear both; animation-delay: var(--d, 0s); }
    .card h2.perfect { animation: perfectPulse ${L("perfectPulse")} linear infinite; }
    #sPlay:not(.ghost), #sCont, #stGo, #dClaim { animation: breathe ${L("breathe")} linear infinite; }
    .boost.on, .mapbar button.ready, .days .now, .achl div.due, .lvplate.go { animation: pulse ${L("pulse")} linear infinite; }
    .frz.full span { animation: pulse 600ms linear infinite; }
    .lv.now { animation: lvPulse ${L("lvPulse")} linear infinite; }
    .lv.now::before { animation: beacon ${L("beacon")} linear infinite; }
    .bump { animation: bump ${L("bump")} linear; }
    #wipe b { animation: wpIn ${L("wpIn")} linear forwards, wpOut ${L("wpOut")} 500ms linear forwards; }
    #wipe i { animation: wpRun ${L("wpRun")} linear forwards; }
    #pgMoment.on { animation: pgmIn ${L("pgmIn")} linear both; } #pgMoment.on::before { animation: pgmBurst ${L("pgmBurst")} linear both; }
    #pgMoment.off { animation: pgmOut ${L("pgmOut")} linear both; }
    .zoomin { animation: zoomGrow ${L("zoomGrow")} linear forwards; }
    html.app #gPogo.worry .pogo { animation: worry ${L("worry")} linear infinite; }
    .garden span.new { animation: gardenIn ${L("gardenIn")} linear both; }
    .mprop.live img, .prop.hop img { animation: villagerHop ${L("villagerHop")} linear var(--dl, 0s) infinite; }
    .mprop.won img { animation: propSway ${L("propSway")} linear var(--dl, 0s) infinite; }
    .prop b { animation: sway ${L("sway")} linear var(--dl, 0s) infinite; } .prop.dark b { animation: none; }
    .garden span.live { animation: bob ${L("bob")} linear var(--dl, 0s) infinite; }
    .lv em { animation: bob ${L("bob")} linear infinite; }
    .mprop.mordo img, #gMordo img { animation: mordoBob ${L("mordoBob")} linear infinite; }
    .mprop.mordo.arrive img { animation: mordoArrive ${L("mordoArrive")} 500ms linear both, mordoBob ${L("mordoBob")} 1600ms linear infinite; }
    #path .mprop.mordo.ani.arrive > i { animation: mordoArrive ${L("mordoArrive")} 500ms linear both, aniHover ${L("aniHover")} 1600ms linear infinite; }
    #path .ani:is(.m-fly, .m-hover) > i { animation: aniHover ${L("aniHover")} linear var(--dl, 0s) infinite; }
    .mprop.flutter img { animation: flutter ${L("flutter")} var(--dl, 0s) linear infinite; } #path .ani.m-flutter > i { animation: flutter 4400ms var(--dl, 0s) linear infinite; }
    .mprop.feather img { animation: featherBob ${L("featherBob")} linear infinite; }
    #gMordo.grab img { animation: mordoGrab ${L("mordoGrab")} linear 1; } #gMordo.away img { animation: mordoAway ${L("mordoAway")} linear 1; }
    .cere .cg { animation: cgWipe ${L("cgWipe")} linear forwards; } .cere .ct { animation: ctIn ${L("ctIn")} 300ms linear forwards; } .cere .cs { animation: csDrop ${L("csDrop")} 1100ms linear forwards; }
    .pogo .all { animation: pgBreath ${L("pgBreath")} linear infinite; } .pogo .tail { animation: pgTail ${L("pgTail")} linear infinite; }
    #path .mprop:not(.vis) img, #path .ani:not(.vis) > i, #path .ani:not(.vis) > i > img { animation: none !important; }
    body:has(#game:not([hidden])) .prop b, html.pinching #path *, html.petting .prop b, html.petting .node { animation-play-state: paused !important; }
    @media (prefers-reduced-motion: reduce) { .card, .modal, .modal.out, .modal.out .card, .modal .card > *, #game .hud, #game .bar, #game .frz, #game .boosters, #game #c, #map, #gDio .dio, #path .mprop > b.pst, #eStars svg, .card .big b i, #wipe b, #wipe i, #pgMoment, #pgMoment::before, .zoomin, .garden span, .cere .cg, .cere .ct, .cere .cs { animation-duration: 1ms !important; animation-delay: 0s !important; }
      .card h2.perfect, #sPlay, #sCont, #stGo, #dClaim, .boost.on, .mapbar button.ready, .days .now, .achl div.due, .lvplate.go, .frz.full span, .lv.now, .lv.now::before, .lv em, .mprop img, .prop b, .garden span.live, #gMordo img, #path .ani > i, .pogo .all, .pogo .tail { animation: none !important; } }`;
  const css = (props) => Object.entries(props).map(([k, v]) => `${k}: ${v};`).join(" ");
  let out = "";
  for (const [name, keys] of Object.entries(KEYS)) {
    const len = keys.at(-1)[0];
    // the ease that leads INTO key i is written on key i-1 (that is where CSS reads it)
    out += `@keyframes ${name} {` + keys.map(([t, p], i) => ` ${(t / len * 100).toFixed(2)}% { ${css(p)}${keys[i + 1] ? " animation-timing-function: " + keys[i + 1][2] + ";" : ""} }`).join("") + " }\n";
  }
  // ---- the samplers
  // cubic-bezier(x1, y1, x2, y2) as a function of progress, the same curve CSS uses (Newton on x, then y)
  const bez = (x1, y1, x2, y2) => {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const X = (t) => ((ax * t + bx) * t + cx) * t, DX = (t) => (3 * ax * t + 2 * bx) * t + cx, Y = (t) => ((ay * t + by) * t + cy) * t;
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const d = DX(t); if (d < 1e-6) break; const e = X(t) - x; if (Math.abs(e) < 1e-5) break; t -= e / d; } return Y(t); };
  };
  const easeFn = (e) => { const m = /cubic-bezier\(([^)]+)\)/.exec(e || ""); if (!m) return (x) => x; const [a, b, c, d] = m[1].split(",").map(Number); return bez(a, b, c, d); };
  const SAMP = {};
  for (const [name, keys] of Object.entries(BOARD)) SAMP[name] = { t: keys.map(k => k[0]), v: keys.map(k => k[1]), e: keys.map(k => easeFn(k[2])), len: keys.at(-1)[0], props: Object.keys(keys[0][1]) };
  // fills `out` with the table's values at `ms` (clamped to the ends; loop with ms % UI_KEYS.len(name) when needed)
  function sample(name, ms, out) {
    const S = SAMP[name], t = S.t, n = t.length; out = out || {};
    if (ms <= 0) { const v = S.v[0]; for (const p of S.props) out[p] = v[p]; return out; }
    if (ms >= S.len) { const v = S.v[n - 1]; for (const p of S.props) out[p] = v[p]; return out; }
    let i = 1; while (t[i] <= ms) i++;
    const a = S.v[i - 1], b = S.v[i], k = S.e[i]((ms - t[i - 1]) / (t[i] - t[i - 1]));
    for (const p of S.props) out[p] = a[p] + (b[p] - a[p]) * k;
    return out;
  }
  // Web Animations keyframes from a table: offsets from the times, the ease into key i written on key i-1 (where WAAPI reads it)
  function waapi(name) {
    const keys = WAAPI[name], len = keys.at(-1)[0];
    return { duration: len, frames: keys.map(([t, p], i) => Object.assign({ offset: t / len }, p, keys[i + 1] ? { easing: keys[i + 1][2] } : {})) };
  }
  window.UI_KEYS = Object.assign(KEYS, { board: BOARD, waapiKeys: WAAPI, sample, waapi, len: (name) => SAMP[name].len });
  const st = document.createElement("style"); st.id = "uiKeys"; st.textContent = out + USE;
  // after the page's own <style> so these names and rules win
  const put = () => document.head.appendChild(st);
  if (document.head && document.readyState !== "loading") put(); else document.addEventListener("DOMContentLoaded", put);
})();
