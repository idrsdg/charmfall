// Charmfall UI motion, keyed by hand (2026-11-02). Edit the tables below; no build step, the page turns them into CSS @keyframes on load.
// Each motion is a list of keys: [time in ms, { css properties }, ease INTO this key]. A key keeps nothing from the one before it, so write
// every property you animate in every key. The first ease is ignored. Same idea as Pogo's clips (pogo-anim.js): anticipation before a big
// move, a fast-out snap, a small overshoot and a settle, never one long generic tween. Times are absolute; the animation runs as long as the
// last key. These replace the page's two-key tweens of the same names (cardIn, cardOut, kidIn, dropIn, riseIn, starHollow, fade, fadeOut).
(() => {
  const SNAP = "cubic-bezier(.18, .9, .32, 1)";     // fast out, long settle: arrivals
  const SETTLE = "cubic-bezier(.45, 0, .55, 1)";    // in and out: overshoot coming back
  const DROP = "cubic-bezier(.6, 0, .9, .45)";      // slow start, fast finish: exits
  const LIFT = "cubic-bezier(.3, 0, .5, 1)";        // small anticipation before an exit
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
    // the dimmed backdrop behind a card
    fade: [
      [0,   { opacity: 0 }],
      [250, { opacity: 1 }, "cubic-bezier(.2, .7, .3, 1)"],
    ],
    fadeOut: [
      [0,   { opacity: 1 }],
      [60,  { opacity: 1 }, "linear"],
      [170, { opacity: 0 }, DROP],
    ],
  };
  // how long each motion runs and which element uses it (the page's own durations were two-key tweens of other lengths)
  const USE = `
    .card { animation: cardIn ${KEYS.cardIn.at(-1)[0]}ms linear both; }
    .modal { animation: fade ${KEYS.fade.at(-1)[0]}ms linear both; }
    .modal.out { animation: fadeOut ${KEYS.fadeOut.at(-1)[0]}ms linear both; pointer-events: none; }
    .modal.out .card { animation: cardOut ${KEYS.cardOut.at(-1)[0]}ms linear both; }
    .modal:not([hidden]):not(.out) .card > :is(p, h2, .goalrow, .cbar, .chip, #sPogo, #ePogo) { animation: kidIn ${KEYS.kidIn.at(-1)[0]}ms linear both; }
    #game:not([hidden]) .hud, #game:not([hidden]) .bar, #game:not([hidden]) .frz { animation: dropIn ${KEYS.dropIn.at(-1)[0]}ms linear both; }
    #game:not([hidden]) .boosters { animation: riseIn ${KEYS.riseIn.at(-1)[0]}ms 80ms linear both; }
    #path.pp .mprop.pu.up > b.pst { animation: popStand ${KEYS.popStand.at(-1)[0]}ms var(--pd, 0ms) linear both; }
    #gDio.up .dio.far, #gDio.up .dio.mid, #gDio.up .dio.near { animation: popUp ${KEYS.popUp.at(-1)[0]}ms 120ms linear both; } #gDio.up .dio.mid { animation-delay: 210ms; } #gDio.up .dio.near { animation-delay: 300ms; }
    #eStars.stars3 svg.o { animation: starHollow ${KEYS.starHollow.at(-1)[0]}ms linear both; animation-delay: var(--o, 0s); }
    @media (prefers-reduced-motion: reduce) { .card, .modal, .modal.out, .modal.out .card, .modal .card > *, #game .hud, #game .bar, #game .frz, #game .boosters, #gDio .dio, #path .mprop > b.pst { animation-duration: 1ms !important; animation-delay: 0s !important; } }`;
  const css = (props) => Object.entries(props).map(([k, v]) => `${k}: ${v};`).join(" ");
  let out = "";
  for (const [name, keys] of Object.entries(KEYS)) {
    const len = keys.at(-1)[0];
    // the ease that leads INTO key i is written on key i-1 (that is where CSS reads it)
    out += `@keyframes ${name} {` + keys.map(([t, p], i) => ` ${(t / len * 100).toFixed(2)}% { ${css(p)}${keys[i + 1] ? " animation-timing-function: " + keys[i + 1][2] + ";" : ""} }`).join("") + " }\n";
  }
  window.UI_KEYS = KEYS;
  const st = document.createElement("style"); st.id = "uiKeys"; st.textContent = out + USE;
  // after the page's own <style> so these names and rules win
  const put = () => document.head.appendChild(st);
  if (document.head && document.readyState !== "loading") put(); else document.addEventListener("DOMContentLoaded", put);
})();
