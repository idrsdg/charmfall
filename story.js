// Charmfall story and rewards (2026-11-06, İdris picked "Hepsi": boss comics with dialogue, a reward chest, carrots as side-game tickets, a gift
// from Pogo when he is full). Loaded after index.html's script and mini.js; it reads the page's globals (save, persist, CHAPTERS, bossOf, BOSS_NOTE,
// TR, PA, paHtml, paPlay, PA_RUN, paTick, CR, ART_Q, ICO, BICON, BXM, RWM, starsFree, SFX, buzz, tip, UI_KEYS) and the page calls in at five places:
//   STORY.wantIntro(level) / STORY.comic(chapter, "intro" | "outro", { replay })   before a boss level and after its first win (and from the story book)
//   STORY.afterBoss(level)    the outro, the boss's chest and its side-game invitation, on the first win of every tenth level
//   STORY.chest(opts)         the chest: drops, rattles, the lid opens (anim/mini-chest.webp, eight painted drawings), the things inside come out,
//                             Collect sends them to the counters; station gifts and Pogo's present use it too
//   STORY.taunt()             the boss's line beside his figure on the board when a boss level is lost
//   STORY.petGift()           every fifth carrot Pogo eats he brings a small chest
// Everything that moves is a keyed table in the ui-keys.js format, added to UI_KEYS here (cmx*, chest*); nothing runs while nothing is shown.
(() => {
  "use strict";
  if (typeof save !== "object" || !window.UI_KEYS) return;
  const $ = (id) => document.getElementById(id), tr = () => save.lang === "tr";
  // ---------------------------------------------------------------- words: English in the code, Turkish beside it; the page's own TR table for its own lines
  const TRS = {
    "Skip": "Geç", "Tap to go on": "Devam etmek için dokun", "Chapter {0}": "Bölüm {0}", "The end of chapter {0}": "{0}. bölümün sonu", "Watch": "İzle", "Watch the meeting": "Karşılaşmayı izle", "Watch the ending": "Sonu izle",
    "Collect": "Topla", "Later": "Sonra", "Play": "Oyna", "{0}'s chest": "{0}'in sandığı", "The flock's chest": "Sürünün sandığı", "Station gift": "İstasyon hediyesi", "Pogo brought you a present!": "Pogo sana bir hediye getirdi!",
    "{0} left a game behind: {1}": "{0} geride bir oyun bıraktı: {1}", "Saved in the Playground: one free game.": "Oyun parkına kaydedildi: bir bedava oyun.",
    "Every booster": "Her güçlendirici", "Unlimited lives · {0} min": "Sınırsız can · {0} dk", "He ate five carrots and he is full. This is for you.": "Beş havuç yedi ve doydu. Bu senin için.",
    "Next present in {0} carrots": "Sonraki hediye {0} havuç sonra", "Stars": "Yıldız", "Carrots": "Havuç", "Boosters": "Güçlendirici"
  };
  const T = (s, ...a) => { let o = (tr() && TRS[s]) || s; a.forEach((v, i) => { o = o.replace("{" + i + "}", v); }); return o; };
  const PT = (s) => (tr() && typeof TR === "object" && TR[s]) || s;   // the page's own lines (place names, chapter titles, BOSS_NOTE)
  const L2 = (pair) => tr() ? pair[1] : pair[0];

  // ---------------------------------------------------------------- the lines: for every place, what its boss says when Pogo arrives and Pogo's answer
  // Mordo (1-10) wants shine for his dark nest; the flock (11-14) only copies him; Gritt (15-20) is proud and sharp; Corvin (21-30) is not cruel,
  // only cold, and keeps light because his winters were long; Nyx (31-40) thinks the stars were lost and is keeping them safe in a jar for her cave.
  const MEET = [
    [["Shiny things belong to whoever is quickest. That is me.", "Parlak şeyler en hızlı olanındır. Yani benim."], ["Then I'll be quicker. Give the garden its light back!", "O zaman ben daha hızlı olurum. Bahçenin ışığını geri ver!"]],
    [["Four-leaf clovers bring luck. To me, not to you.", "Dört yapraklı yonca şans getirir. Bana, sana değil."], ["I brought a firefly. That's luck too.", "Ben de bir ateşböceği getirdim. O da şanstır."]],
    [["Tick, tock, rabbit. My gems count faster than you think.", "Tik tak, tavşan. Taşlarım sandığından hızlı sayar."], ["Then I'll count with them. One match at a time.", "Ben de onlarla sayarım. Her seferinde bir eşleşme."]],
    [["Nobody looks under mushrooms. Except nosy rabbits.", "Mantarların altına kimse bakmaz. Meraklı tavşanlar hariç."], ["The caps glow right where you dug, Mordo.", "Kazdığın yerde şapkalar parlıyor, Mordo."]],
    [["Crates and stone. Let's see you open those.", "Sandıklar ve taşlar. Hadi aç bakalım."], ["The owl told me how. Special gems!", "Baykuş nasıl açılacağını söyledi. Özel taşlarla!"]],
    [["This maze has no way out. I checked. Twice.", "Bu labirentin çıkışı yok. Baktım. İki kez."], ["Then follow me. I'll show you one.", "O zaman beni takip et. Sana bir tane göstereyim."]],
    [["The mill turns, the wind blows, and the charms are mine.", "Değirmen döner, rüzgâr eser, tılsımlar benimdir."], ["The wind is on my side today. Can you feel it?", "Bugün rüzgâr benden yana. Hissediyor musun?"]],
    [["Only the moon lights this bridge. And rabbits fear the dark.", "Bu köprüyü sadece ay aydınlatır. Tavşanlar da karanlıktan korkar."], ["Not with this many charms glowing behind me.", "Arkamda bu kadar tılsım parlarken korkmam."]],
    [["Welcome to my wood. Every tree here is on my side.", "Ormanıma hoş geldin. Buradaki her ağaç benden yana."], ["Trees love light, Mordo. They're on mine.", "Ağaçlar ışığı sever, Mordo. Benden yanalar."]],
    [["The last charm is in my nest. It's so dark up here without it.", "Son tılsım yuvamda. Onsuz burası çok karanlık."], ["So that's why you took them. Let's talk after this board.", "Demek bu yüzden aldın. Bu tahtadan sonra konuşalım."]],
    [["Caw! Mordo gave his back. We didn't!", "Gak! Mordo kendininkileri verdi. Biz vermedik!"], ["Then I'll ask the whole flock nicely. With matches.", "O zaman bütün sürüye kibarca sorarım. Eşleşmelerle."]],
    [["Caw! The lamp is too bright. The charms stay in the dark!", "Gak! Fener çok parlak. Tılsımlar karanlıkta kalacak!"], ["The keeper wants his light back. So do the seeds.", "Fenerci ışığını geri istiyor. Tohumlar da."]],
    [["Caw-caw! Low tide, high stakes!", "Gak gak! Sular çekildi, iş ciddileşti!"], ["I don't mind getting my paws wet.", "Patilerim ıslanırsa ıslansın."]],
    [["Caw! Count fast, rabbit. The gems count faster!", "Gak! Hızlı say tavşan. Taşlar daha hızlı sayıyor!"], ["I've been counting since the pond. I'm good at it now.", "Göletten beri sayıyorum. Artık çok iyiyim."]],
    [["I'm Gritt. Mordo went soft. I didn't.", "Ben Gritt. Mordo yumuşadı. Ben yumuşamadım."], ["Mordo just found out that sharing feels nice.", "Mordo sadece paylaşmanın güzel olduğunu keşfetti."]],
    [["One wrong hop and you're in the sea, bunny.", "Tek yanlış zıplama ve denizdesin, tavşancık."], ["Then I'll hop right. I always land on my feet.", "O zaman doğru zıplarım. Hep ayaklarımın üstüne düşerim."]],
    [["The hedgehog gave me those charms fair and square.", "Kirpi o tılsımları bana hakkıyla verdi."], ["For apples! And now he wants to trade back.", "Elma karşılığında! Şimdi de geri değişmek istiyor."]],
    [["Hear that thunder? That's me, laughing.", "Gök gürültüsünü duydun mu? O benim gülüşüm."], ["Storms pass. Charms stay.", "Fırtınalar geçer. Tılsımlar kalır."]],
    [["Which Gritt is the real one? Every crystal shows you another.", "Hangi Gritt gerçek? Her kristal başka birini gösteriyor."], ["The one hiding the charms, of course.", "Tılsımları saklayan, tabii ki."]],
    [["This is my roost. Nobody climbs this high.", "Burası benim tüneğim. Kimse bu kadar yükseğe tırmanmaz."], ["I just did. And I brought one of Mordo's lanterns.", "Ben tırmandım. Mordo'nun fenerlerinden birini de getirdim."]],
    [["Caw. The north is cold for a reason, little rabbit.", "Gak. Kuzeyin soğuk olmasının bir sebebi var, küçük tavşan."], ["Grey snow isn't a reason. It's a sad story.", "Gri kar bir sebep değil. Hüzünlü bir hikâye."]],
    [["I need the light more than these woods do.", "O ışığa bu ormandan daha çok ihtiyacım var."], ["Then share it. Woods and towers can both be warm.", "O zaman paylaş. Orman da kule de ısınabilir."]],
    [["Water that runs, leaves. So I made it stay.", "Akan su gider. Ben de onu durdurdum."], ["It wants to run, Corvin. Let it.", "Akmak istiyor, Corvin. Bırak aksın."]],
    [["The lights are mine now. In a jar they can't leave me.", "Işıklar artık benim. Kavanozdayken beni bırakamazlar."], ["They're dancing lights. A jar is no place to dance.", "Onlar dans eden ışıklar. Kavanozda dans edilmez."]],
    [["Spring got stuck behind the mountains. I won't help it over.", "Bahar dağların ardında takıldı. Aşmasına yardım etmem."], ["Then I will. One tree at a time.", "O zaman ben ederim. Her seferinde bir ağaç."]],
    [["Nothing grows here. Nothing should.", "Burada hiçbir şey yetişmez. Yetişmemeli de."], ["Something always grows where somebody cares.", "Biri önemserse bir şey mutlaka yetişir."]],
    [["Too loud, too green. This is the one place I could never dim.", "Fazla gürültülü, fazla yeşil. Karartamadığım tek yer burası."], ["Maybe it's showing you how nice green is.", "Belki sana yeşilin ne güzel olduğunu gösteriyordur."]],
    [["The sheep can wait. My tower needs light more.", "Koyunlar bekleyebilir. Kulemin ışığa daha çok ihtiyacı var."], ["Hungry sheep can't wait, Corvin.", "Aç koyunlar bekleyemez, Corvin."]],
    [["The bear talks about me? He doesn't know my winters.", "Ayı benden mi bahsediyor? O benim kışlarımı bilmez."], ["He knows they were long. That's why he isn't angry.", "Uzun olduklarını biliyor. O yüzden kızgın değil."]],
    [["My tower, my light. Climb, if you must.", "Benim kulem, benim ışığım. Gerekirse tırman."], ["I came to bring you a lantern, not to take your home.", "Sana bir fener getirmeye geldim, evini almaya değil."]],
    [["Shh. The stars were lost. I'm only keeping them safe.", "Şşş. Yıldızlar kaybolmuştu. Ben sadece onları koruyorum."], ["Lost? They were in the sky, where everyone could see them.", "Kayıp mı? Gökyüzündeydiler, herkesin görebileceği yerde."]],
    [["The brightest lantern is the best one. So it's mine.", "En parlak fener en iyisidir. Yani benimdir."], ["The islanders need it to find their way home.", "Adalıların eve yolu bulmak için ona ihtiyacı var."]],
    [["The crabs work for me now. Click, click.", "Yengeçler artık benim için çalışıyor. Tık tık."], ["The crabs keep the stars safe. For everyone.", "Yengeçler yıldızları koruyor. Herkes için."]],
    [["Glowing trees? Just stars that fell too low.", "Parlayan ağaçlar mı? Fazla alçağa düşmüş yıldızlar sadece."], ["Then they've earned their glow. Leave it to them.", "O zaman ışıklarını hak etmişler. Onlara bırak."]],
    [["Tiny lights pretending to be stars. Cute.", "Yıldız taklidi yapan minik ışıklar. Ne tatlı."], ["They're tired of pretending. Give the real ones back.", "Taklit etmekten yoruldular. Gerçeklerini geri ver."]],
    [["Yawn. Come back after sunset, rabbit.", "Esneme. Gün batımından sonra gel, tavşan."], ["I'll be done by sunset. Watch me.", "Gün batımına kadar bitiririm. İzle beni."]],
    [["Every step up is a step closer to my cave. Turn back.", "Her basamak mağarama bir adım daha yakın. Geri dön."], ["Then every step is worth it.", "O zaman her basamak buna değer."]],
    [["Back! Back! Back! ...That's the echo. Or me.", "Geri! Geri! Geri! ...Yankı bu. Ya da ben."], ["Your bats think the stars were lost. They weren't.", "Yarasaların yıldızların kaybolduğunu sanıyor. Kaybolmadılar."]],
    [["You saw my jar. Nobody was supposed to see my jar.", "Kavanozumu gördün. Kimsenin görmemesi gerekiyordu."], ["It's beautiful. It would be more beautiful empty.", "Çok güzel. Boş olsa daha da güzel olurdu."]],
    [["My cave was so dark. The stars made it feel like the sky.", "Mağaram çok karanlıktı. Yıldızlar orayı gökyüzü gibi yaptı."], ["Let's hang them back up together. I'll save one for you.", "Gel, onları birlikte geri asalım. Sana bir tane ayırırım."]]
  ];
  // the narrator's line under the ending: where the charm goes, and what comes next (the four turns of the story have their own)
  const TURN = {
    9: ["Mordo keeps one lantern for his nest. But half the charms are already over the water...", "Mordo yuvası için bir fener alıyor. Ama tılsımların yarısı çoktan suyun öte yanında..."],
    19: ["Gritt gets a lantern too. Far to the north, one grey stripe is left on the hills.", "Gritt de bir fener alıyor. Uzak kuzeyde, tepelerde tek bir gri şerit kaldı."],
    29: ["Corvin's tower is warm with a light he shares. But up above, the stars are going out.", "Corvin'in kulesi paylaştığı bir ışıkla ısınıyor. Ama yukarıda yıldızlar sönüyor."],
    39: ["The jar opens and the stars fly home. One stays behind in Nyx's cave.", "Kavanoz açılıyor ve yıldızlar eve uçuyor. Biri Nyx'in mağarasında kalıyor."]
  };
  const ending = (c) => TURN[c] ? L2(TURN[c]) : tr() ? PT(CHAPTERS[c].name) + " yeniden parlıyor. Sıradaki durak: " + PT(CHAPTERS[c + 1].name) + "." : CHAPTERS[c].name + " glows again. Next stop: " + CHAPTERS[c + 1].name + ".";
  // a boss who wins says so
  const TAUNT = {
    magpie: [["Ha! The charms stay with me!", "Ha! Tılsımlar bende kalıyor!"], ["Shiny and mine. Try again, rabbit.", "Parlak ve benim. Bir daha dene, tavşan."], ["Caw-ha! Too slow!", "Gak-ha! Çok yavaşsın!"]],
    flock: [["Caw! Caw! We win!", "Gak! Gak! Biz kazandık!"], ["Caw-caw! Try again!", "Gak gak! Yine dene!"], ["The flock keeps it! Caw!", "Sürü bunu tutuyor! Gak!"]],
    gritt: [["Mordo would have let you win. I won't.", "Mordo kazanmana izin verirdi. Ben vermem."], ["Too slow, bunny.", "Çok yavaş, tavşancık."], ["Back to the bottom of the cliff!", "Uçurumun dibine geri!"]],
    corvin: [["Cold, isn't it? Go home.", "Soğuk, değil mi? Evine dön."], ["The north stays grey.", "Kuzey gri kalıyor."], ["Try again when the snow melts.", "Kar eriyince yine dene."]],
    bat: [["Shh, the stars are sleeping.", "Şşş, yıldızlar uyuyor."], ["Too dark for you, rabbit?", "Sana fazla mı karanlık, tavşan?"], ["Back to bed, little rabbit.", "Yatağına dön, küçük tavşan."]]
  };
  const KIND = (c) => c < 10 ? "magpie" : c < 14 ? "flock" : c < 20 ? "gritt" : c < 30 ? "corvin" : "bat";
  const bossName = (c) => PT(bossOf(c * 10 + 9).name);
  // which side game a boss leaves behind: the night places get the fireflies, the others take turns
  const GAME_OF = (c) => c >= 30 || (typeof WEATHER === "object" && WEATHER[c] === "night") ? "fireflies" : ["carrots", "lilypads", "nests"][c % 3];
  const CHARM = ["apple", "clover", "drop", "leaf", "acorn", "strawberry", "sun", "star", "maple", "heart", "fish", "drop", "goldfish", "orange", "frog", "bluebird", "pear", "raincloud", "fox", "cherry",
    "maple", "snail", "drop", "butterfly", "peach", "cactus", "frog", "chick", "sun", "star", "star", "lemon", "jellyfish", "butterfly", "bee", "orange", "frog", "grapes", "star", "star"];

  // ---------------------------------------------------------------- keyed motions (the ui-keys.js format: [ms, { css }, ease into this key])
  const SNAP = "cubic-bezier(.18, .9, .32, 1)", SETTLE = "cubic-bezier(.45, 0, .55, 1)", LIFT = "cubic-bezier(.3, 0, .7, .4)", DROP = "cubic-bezier(.55, 0, .9, .55)", HOLD = "steps(1, end)";
  Object.assign(UI_KEYS.waapiKeys, {
    // a comic panel pasted onto the page: comes down a little high and turned, overshoots onto the paper, settles
    cmxPanel: [[0, { opacity: 0, transform: "translateY(-28px) rotate(-2.5deg) scale(.95)" }], [170, { opacity: 1, transform: "translateY(5px) rotate(.8deg) scale(1.015)" }, SNAP], [280, { opacity: 1, transform: "translateY(-2px) rotate(-.2deg) scale(.998)" }, SETTLE], [380, { opacity: 1, transform: "translateY(0) rotate(0deg) scale(1)" }, SETTLE]],
    // a speech balloon: from its tail, a pop past full size and back
    cmxBalloon: [[0, { opacity: 0, transform: "scale(.2)" }], [140, { opacity: 1, transform: "scale(1.12)" }, SNAP], [230, { opacity: 1, transform: "scale(.96)" }, SETTLE], [320, { opacity: 1, transform: "scale(1)" }, SETTLE]],
    // the caption box slides in from the left edge
    cmxCap: [[0, { opacity: 0, transform: "translateX(-24px)" }], [200, { opacity: 1, transform: "translateX(4px)" }, SNAP], [300, { opacity: 1, transform: "translateX(0)" }, SETTLE]],
    // Pogo steps into a panel from the left; the boss swoops in from the top right
    cmxIn: [[0, { opacity: 0, transform: "translateX(-46px)" }], [260, { opacity: 1, transform: "translateX(6px)" }, SNAP], [380, { opacity: 1, transform: "translateX(0)" }, SETTLE]],
    cmxBoss: [[0, { opacity: 0, transform: "translate(70px, -60px) rotate(18deg) scale(.8)" }], [300, { opacity: 1, transform: "translate(-8px, 6px) rotate(-6deg) scale(1.06)" }, SNAP], [420, { opacity: 1, transform: "translate(2px, -2px) rotate(2deg) scale(.99)" }, SETTLE], [520, { opacity: 1, transform: "translate(0, 0) rotate(0deg) scale(1)" }, SETTLE]],
    // the beaten boss: knocked back, a wobble, sinks a little (held there)
    cmxBeat: [[0, { transform: "translate(0, 0) rotate(0deg)" }], [120, { transform: "translate(18px, -10px) rotate(14deg)" }, SNAP], [260, { transform: "translate(10px, 4px) rotate(-6deg)" }, SETTLE], [400, { transform: "translate(12px, 6px) rotate(4deg)" }, SETTLE], [520, { transform: "translate(12px, 8px) rotate(2deg)" }, SETTLE]],
    // the charm come home: up out of nowhere, a turn, a bob
    cmxCharm: [[0, { opacity: 0, transform: "translateY(30px) scale(.3) rotate(-40deg)" }], [260, { opacity: 1, transform: "translateY(-10px) scale(1.15) rotate(8deg)" }, SNAP], [420, { opacity: 1, transform: "translateY(2px) scale(.97) rotate(-2deg)" }, SETTLE], [560, { opacity: 1, transform: "translateY(0) scale(1) rotate(0deg)" }, SETTLE]],
    // the chest falls onto the page, squashes and settles; then three rattles, each harder than the last, with a hold between
    chestDrop: [[0, { opacity: 0, transform: "translateY(-160px) scale(.9, 1.1)" }], [300, { opacity: 1, transform: "translateY(0) scale(.9, 1.1)" }, DROP], [380, { opacity: 1, transform: "translateY(0) scale(1.12, .86)" }, SETTLE], [500, { opacity: 1, transform: "translateY(-8px) scale(.97, 1.04)" }, SNAP], [620, { opacity: 1, transform: "translateY(0) scale(1, 1)" }, SETTLE]],
    chestRattle: [[0, { transform: "rotate(0deg) translateY(0)" }], [70, { transform: "rotate(-4deg) translateY(-2px)" }, SNAP], [140, { transform: "rotate(4deg) translateY(0)" }, SETTLE], [210, { transform: "rotate(0deg) translateY(0)" }, SETTLE],
      [380, { transform: "rotate(0deg) translateY(0)" }, HOLD], [450, { transform: "rotate(-6deg) translateY(-5px)" }, SNAP], [520, { transform: "rotate(6deg) translateY(-2px)" }, SETTLE], [590, { transform: "rotate(-3deg) translateY(0)" }, SETTLE], [650, { transform: "rotate(0deg) translateY(0)" }, SETTLE],
      [800, { transform: "rotate(0deg) scale(1, 1)" }, HOLD], [880, { transform: "rotate(0deg) scale(1.08, .88)" }, SETTLE], [980, { transform: "rotate(0deg) scale(.94, 1.1)" }, SNAP], [1100, { transform: "rotate(0deg) scale(1, 1)" }, SETTLE]],
    // the rays behind the open chest come up and stay
    chestRays: [[0, { opacity: 0, transform: "scale(.4) rotate(-20deg)" }], [260, { opacity: 1, transform: "scale(1.08) rotate(4deg)" }, SNAP], [420, { opacity: .85, transform: "scale(1) rotate(0deg)" }, SETTLE]],
    // the taunt balloon over the board: pops, holds, and shrinks away
    tauntIn: [[0, { opacity: 0, transform: "scale(.2)" }], [150, { opacity: 1, transform: "scale(1.12)" }, SNAP], [240, { opacity: 1, transform: "scale(.97)" }, SETTLE], [320, { opacity: 1, transform: "scale(1)" }, SETTLE], [1900, { opacity: 1, transform: "scale(1)" }, HOLD], [2100, { opacity: 0, transform: "scale(.6)" }, DROP]]
  });
  // a thing coming out of the chest to its place in the row (the same p/h/s/r/a flight format as the HUD's icons)
  Object.assign(UI_KEYS.board, {
    chestPop: [[0, { p: 0, h: 0, s: .2, r: 0, a: 0 }], [120, { p: .12, h: .55, s: .9, r: -.05, a: 1 }, SNAP], [380, { p: .92, h: .12, s: 1.18, r: .03, a: 1 }, SETTLE], [470, { p: 1, h: 0, s: .94, r: 0, a: 1 }, DROP], [560, { p: 1, h: 0, s: 1, r: 0, a: 1 }, SETTLE]]
  });
  const KW = (name) => UI_KEYS.waapi(name);
  const play = (el, name, opt) => { if (!el || !el.animate) return null; const k = KW(name); return el.animate(k.frames, Object.assign({ duration: k.duration, fill: "both" }, opt || {})); };
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const sfx = (k, n) => { try { if (SFX && SFX[k]) SFX[k](n); } catch (e) {} };
  const ICON = (k) => { let svg = ""; try { svg = (typeof ICO === "object" && ICO[k]) || (typeof BICON === "object" && BICON[k]) || ""; } catch (e) {} return `<i class="ico">${svg}</i>`; };
  const Q = typeof ART_Q === "string" ? ART_Q : "";

  // ---------------------------------------------------------------- the look: paper, a hand-drawn ink line, a handwriting face for the balloons
  const css = document.createElement("style"); css.textContent = `
  #cmx, #chx { position: fixed; inset: 0; z-index: 90; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
    background: radial-gradient(ellipse at 50% 40%, rgba(70, 48, 30, .93), rgba(30, 20, 12, .97)); touch-action: manipulation; user-select: none; -webkit-user-select: none; animation: fade .25s both; }
  #cmx .cm-top { width: var(--pw); display: flex; align-items: center; justify-content: space-between; color: #f6efe0; font-weight: 900; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; opacity: .9; }
  #cmx .cm-skip, #chx .cx-x { border: 0; background: rgba(246, 239, 224, .16); color: #f6efe0; font: inherit; font-weight: 800; padding: 6px 14px; border-radius: 99px; cursor: pointer; text-transform: none; letter-spacing: 0; }
  #cmx .cm-page { width: var(--pw); display: flex; flex-direction: column; gap: 10px; }
  #cmx .cp { position: relative; width: 100%; aspect-ratio: 16 / 9; }
  #cmx .cp > .in { position: absolute; inset: 0; overflow: hidden; border-radius: 6px 9px 5px 8px; background: #f6efe0; box-shadow: 0 0 0 3px #3a2618, 5px 7px 0 rgba(20, 10, 4, .35); }
  #cmx .cp:nth-child(2) { transform: rotate(.7deg); } #cmx .cp:nth-child(3) { transform: rotate(-.6deg); } #cmx .cp:nth-child(1) { transform: rotate(-.4deg); }
  #cmx .cp .bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; filter: saturate(1.05); }
  #cmx .cp .bg.night { filter: brightness(.62) saturate(.85) hue-rotate(-12deg); }
  #cmx .cp .wash { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 120%, rgba(246, 239, 224, 0), rgba(246, 239, 224, .18) 60%, rgba(120, 80, 40, .2)); mix-blend-mode: multiply; }
  #cmx .cp .pg { position: absolute; bottom: 4%; width: 30%; aspect-ratio: 360 / 396; }
  #cmx .cp .pg .pa { width: 100%; height: 100%; }
  #cmx .cp .bs { position: absolute; width: 36%; aspect-ratio: 1; }
  #cmx .cp .bs b, #cmx .cp .bs img { display: block; width: 100%; height: 100%; background-repeat: no-repeat; filter: drop-shadow(3px 5px 0 rgba(40, 24, 16, .25)); }
  #cmx .cp .charm { position: absolute; width: 22%; aspect-ratio: 1; right: 16%; top: 16%; filter: drop-shadow(0 0 14px rgba(255, 236, 150, .9)); }
  #cmx .cp .charm img { width: 100%; height: 100%; object-fit: contain; }
  #cmx .bl { position: absolute; max-width: 58%; padding: 8px 12px 9px; background: #fffaf0; color: #2a1a10; border: 2.5px solid #3a2618; border-radius: 18px 22px 20px 16px / 16px 20px 18px 22px;
    font-family: "Chalkboard SE", "Marker Felt", "Comic Neue", "Comic Sans MS", cursive; font-size: clamp(13px, 3.6vw, 16px); line-height: 1.22; box-shadow: 3px 4px 0 rgba(40, 24, 16, .25); }
  #cmx .bl::after { content: ""; position: absolute; width: 16px; height: 16px; background: #fffaf0; border: 2.5px solid #3a2618; border-top: 0; border-left: 0; bottom: -10px; transform: rotate(45deg) skew(12deg, 12deg); }
  #cmx .bl.l::after { left: 22%; } #cmx .bl.r::after { right: 22%; }
  #cmx .bl b { display: block; font-size: .72em; letter-spacing: .06em; text-transform: uppercase; color: #8a4a20; margin-bottom: 1px; font-family: system-ui, sans-serif; font-weight: 900; }
  #cmx .cap { position: absolute; left: 6px; top: 6px; max-width: 70%; background: #f3d98a; color: #3a2210; border: 2px solid #3a2618; padding: 5px 9px; font-size: clamp(11px, 3.2vw, 13px); font-weight: 800; line-height: 1.2; border-radius: 3px 5px 4px 3px; box-shadow: 2px 3px 0 rgba(40, 24, 16, .25); }
  #cmx .cap.bot { top: auto; bottom: 6px; left: 6px; right: 6px; max-width: none; text-align: center; }
  #cmx .cap small { display: block; font-size: .78em; letter-spacing: .06em; text-transform: uppercase; opacity: .75; }
  #cmx .cm-hint { color: #f6efe0; opacity: .75; font-size: 13px; font-weight: 700; height: 18px; }
  #chx { gap: 4px; }
  #chx .cx-bank { display: flex; gap: 10px; justify-content: center; }
  #chx .cx-bank span { display: inline-flex; align-items: center; gap: 4px; background: #f6efe0; color: #3a2210; border: 2px solid #3a2618; border-radius: 99px; padding: 3px 12px 3px 6px; font-weight: 900; font-size: 16px; box-shadow: 2px 3px 0 rgba(0, 0, 0, .25); }
  #chx .cx-bank .ico, #chx .cx-items .ico, .cxfly .ico { width: 26px; height: 26px; display: inline-block; } #chx .cx-bank .ico svg, #chx .cx-items .ico svg, .cxfly svg { width: 100%; height: 100%; }
  #chx h2 { color: #fff4d6; margin: 14px 0 0; font-size: clamp(22px, 6vw, 30px); text-shadow: 0 3px 0 #3a2210; text-align: center; }
  #chx p.cx-sub { color: #f6efe0; margin: 2px 0 0; font-size: 14px; opacity: .85; text-align: center; max-width: 340px; }
  #chx .cx-stage { position: relative; width: min(300px, 74vw); aspect-ratio: 1; }
  #chx .cx-rays { position: absolute; inset: -12%; background: repeating-conic-gradient(from 0deg, rgba(255, 228, 140, .5) 0deg 9deg, rgba(255, 228, 140, 0) 9deg 24deg); -webkit-mask: radial-gradient(circle, #000 18%, transparent 66%); mask: radial-gradient(circle, #000 18%, transparent 66%); opacity: 0; }
  #chx .cx-chest { position: absolute; inset: 0; background-repeat: no-repeat; transform-origin: 50% 86%; }
  #chx.small .cx-stage { width: min(220px, 60vw); }
  #chx .cx-items { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; min-height: 64px; max-width: 360px; }
  #chx .cx-items > span { display: inline-flex; flex-direction: column; align-items: center; gap: 2px; min-width: 64px; padding: 6px 8px; background: #f6efe0; border: 2px solid #3a2618; border-radius: 12px; color: #3a2210; font-weight: 900; font-size: 14px; box-shadow: 2px 3px 0 rgba(0, 0, 0, .25); opacity: 0; }
  #chx .cx-items > span small { font-size: 10px; font-weight: 800; opacity: .75; }
  #chx .cx-btns { display: flex; gap: 10px; min-height: 52px; align-items: center; }
  #chx .cx-inv { display: flex; align-items: center; gap: 10px; background: #f6efe0; border: 2px solid #3a2618; border-radius: 14px; padding: 8px 12px; color: #3a2210; font-weight: 800; max-width: 360px; box-shadow: 3px 4px 0 rgba(0, 0, 0, .25); }
  #chx .cx-inv img { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 2px solid #3a2618; }
  .cxfly { position: fixed; left: 0; top: 0; z-index: 95; pointer-events: none; width: 30px; height: 30px; }
  .cmxTaunt { position: fixed; z-index: 30; max-width: 190px; padding: 7px 11px; background: #fffaf0; color: #2a1a10; border: 2.5px solid #3a2618; border-radius: 16px 20px 18px 14px; font-family: "Chalkboard SE", "Marker Felt", "Comic Sans MS", cursive; font-size: 14px; line-height: 1.2; box-shadow: 3px 4px 0 rgba(40, 24, 16, .25); pointer-events: none; }
  .bk .cmxw { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; } .bk .cmxw button { font: inherit; font-size: 12px; font-weight: 800; border: 2px solid #3a2618; background: #f3d98a; color: #3a2210; border-radius: 99px; padding: 3px 10px; cursor: pointer; }
  @media (prefers-reduced-motion: reduce) { #cmx, #chx { animation: none; } }`;
  document.head.appendChild(css);

  // ---------------------------------------------------------------- the save: which comics have been seen (once each), the free side games, the feeding count
  save.cmx = save.cmx || { i: {}, o: {} };
  if (!save.cmxMig) { save.cmxMig = 1; for (let c = 0; c < CHAPTERS.length; c++) if (save.stars && save.stars[c * 10 + 9]) { save.cmx.i[c] = 1; save.cmx.o[c] = 1; } try { persist(); } catch (e) {} }   // places already beaten count as seen (the book still shows them)
  const seen = (c, w) => !!(save.cmx[w === "intro" ? "i" : "o"] || {})[c], mark = (c, w) => { save.cmx[w === "intro" ? "i" : "o"][c] = 1; try { persist(); } catch (e) {} };

  // ---------------------------------------------------------------- pieces of a panel
  function crEl(kind) { const d = document.createElement("div"); d.className = "bs"; const n = (typeof CR === "object" && CR[kind]) || null;
    if (n) { const b = document.createElement("b"), [frames, cols] = n; b.style.backgroundImage = `url(anim/cr-${kind}.webp${Q})`; b.style.backgroundSize = `${cols * 100}% ${Math.ceil(frames / cols) * 100}%`; d.appendChild(b);
      b._pa = { cr: 1, n: frames, cols, t0: performance.now(), f: -1, vis: 1, vt: 0 }; try { PA_RUN.add(b); if (!paRaf) paRaf = requestAnimationFrame(paTick); } catch (e) {} }
    return d; }
  function pogoEl(clip, side) { const d = document.createElement("div"); d.className = "pg"; d.style[side === "r" ? "right" : "left"] = "6%"; if (side === "r") d.style.transform = "scaleX(-1)"; d.innerHTML = paHtml(clip); return d; }
  function balloon(who, text, side, pos) { const b = document.createElement("div"); b.className = "bl " + side; b.innerHTML = `<b></b><span></span>`; b.firstChild.textContent = who; b.lastChild.textContent = text; Object.assign(b.style, pos); b.style.transformOrigin = side === "l" ? "25% 110%" : "75% 110%"; b.style.opacity = 0; return b; }
  function caption(small, text, bottom) { const c = document.createElement("div"); c.className = "cap" + (bottom ? " bot" : ""); c.innerHTML = (small ? "<small></small>" : "") + "<span></span>"; if (small) c.firstChild.textContent = small; c.lastChild.textContent = text; c.style.opacity = 0; return c; }
  function panel(c, v) { const p = document.createElement("div"); p.className = "cp"; const inn = document.createElement("div"); inn.className = "in"; p.appendChild(inn);
    const k = Math.min(19, Math.floor(c / 2)), im = new Image(); im.className = "bg" + (c >= 30 || (typeof WEATHER === "object" && WEATHER[c] === "night") ? " night" : ""); im.alt = ""; im.src = `anim/bg-${k}-${v}.webp${Q}`; im.style.objectPosition = v ? "50% 70%" : "50% 58%"; inn.appendChild(im);
    const w = document.createElement("i"); w.className = "wash"; inn.appendChild(w); return p; }

  // the panels of one comic: [build(panelEl) -> list of [element, motion, delay, then]]
  function pages(c, which) { const kind = KIND(c), name = bossName(c), place = PT(CHAPTERS[c].name), pogo = "Pogo";
    if (which === "intro") { const [bl, pl] = MEET[c];
      return [
        (p) => { const pg = pogoEl("ready", "l"), cap = caption(T("Chapter {0}", c + 1) + " · " + place, PT(CHAPTERS[c].title)); p.firstChild.append(pg, cap); return [[cap, "cmxCap", 120], [pg, "cmxIn", 220, () => paPlay(pg.firstChild, "ready")]]; },
        (p) => { const bs = crEl(kind); bs.style.right = "6%"; bs.style.top = "18%"; const b = balloon(name, L2(bl), "r", { right: "30%", top: "8%" }); p.firstChild.append(bs, b); return [[bs, "cmxBoss", 80], [b, "cmxBalloon", 520]]; },
        (p) => { const pg = pogoEl("point", "l"), b = balloon(pogo, L2(pl), "l", { left: "32%", top: "10%" }); p.firstChild.append(pg, b); return [[pg, "cmxIn", 60, () => paPlay(pg.firstChild, "point")], [b, "cmxBalloon", 420]]; }
      ]; }
    return [
      (p) => { const bs = crEl(kind); bs.style.right = "10%"; bs.style.top = "22%"; const b = balloon(name, PT(BOSS_NOTE[c]), "r", { right: "34%", top: "8%" }); p.firstChild.append(bs, b); return [[bs, "cmxBeat", 120], [b, "cmxBalloon", 520]]; },
      (p) => { const pg = pogoEl("yay", "l"), ch = document.createElement("div"); pg.style.bottom = "25%"; pg.style.width = "25%"; ch.className = "charm"; ch.innerHTML = `<img alt="" src="anim/ch-${CHARM[c] || "star"}.webp${Q}">`; ch.style.opacity = 0;
        const cap = caption(T("The end of chapter {0}", c + 1), ending(c), true); p.firstChild.append(pg, ch, cap); return [[pg, "cmxIn", 60, () => paPlay(pg.firstChild, "yay")], [ch, "cmxCharm", 300, () => sfx("reward")], [cap, "cmxCap", 700]]; }
    ]; }

  // ---------------------------------------------------------------- the comic: panels come one at a time; a tap brings the next one (or finishes the
  // one that is still coming in); Skip leaves at once. Shown once (save.cmx); the story book plays them again.
  let open = null;
  function comic(c, which, opts = {}) { if (open || window.__fast || c < 0 || c >= CHAPTERS.length) return Promise.resolve(); if (!opts.replay) mark(c, which);
    return new Promise((resolve) => {
      const ov = document.createElement("div"); ov.id = "cmx"; ov.setAttribute("role", "dialog");
      const vh = innerHeight, vw = innerWidth, n = which === "intro" ? 3 : 2, pw = Math.round(Math.min(460, vw - 24, (vh - 120 - (n - 1) * 10) / n * 16 / 9 * (n === 2 ? .82 : 1)));
      ov.style.setProperty("--pw", pw + "px");
      ov.innerHTML = `<div class="cm-top"><span></span><button class="cm-skip" type="button"></button></div><div class="cm-page"></div><div class="cm-hint"></div>`;
      ov.querySelector(".cm-top span").textContent = bossName(c) + " · " + PT(CHAPTERS[c].name); ov.querySelector(".cm-skip").textContent = T("Skip");
      document.body.appendChild(ov); open = ov; const page = ov.querySelector(".cm-page"), hint = ov.querySelector(".cm-hint"), build = pages(c, which); let i = 0, timers = [], anims = [], done = false;
      const finishPanel = () => { timers.forEach(clearTimeout); timers = []; anims.forEach(a => { try { a.finish(); } catch (e) {} }); anims = []; page.querySelectorAll("[style*='opacity: 0']").forEach(e => { e.style.opacity = ""; }); };
      const next = () => { if (done) return; if (timers.length) { finishPanel(); return; } if (i >= build.length) { close(); return; }
        const p = panel(c, which === "intro" ? 0 : 1); page.appendChild(p); anims.push(play(p.firstChild, "cmxPanel")); sfx("pop", 1 + i);
        for (const [el, mo, dl, then] of build[i](p)) { el.style.opacity = 0; timers.push(setTimeout(() => { el.style.opacity = ""; anims.push(play(el, mo)); if (mo === "cmxBalloon") sfx("pop", 4); if (then) then(); }, dl)); }
        timers.push(setTimeout(() => { timers = []; }, 900)); i++; hint.textContent = T("Tap to go on"); };
      const close = () => { if (done) return; done = true; finishPanel(); ov.style.transition = "opacity .25s"; ov.style.opacity = 0; setTimeout(() => { ov.remove(); open = null; resolve(); }, 260); };
      ov.addEventListener("click", (e) => { if (e.target.closest(".cm-skip")) { close(); return; } next(); });
      next(); }); }
  const wantIntro = (lv) => typeof isMordo === "function" && isMordo(lv) && !window.__fast && !(typeof roomStart !== "undefined" && roomStart) && !seen(Math.floor(lv / 10), "intro");

  // ---------------------------------------------------------------- the chest
  // items: [{ k: "star" | "carrot" | "boost" | "allboost" | "lives", n, b }]; prepaid: the caller has already put them in the save (station gifts)
  const BN = { hammer: "Woodpecker", moves: "+10 Moves", switch: "Free Switch", cross: "Cross Blast", undo: "Undo" };
  const boostTotal = () => { let s = 0; for (const k in save.boost) s += +save.boost[k] || 0; return s; };
  function chest(opts) { if (window.__fast) { if (!opts.prepaid) pay(opts.items); return Promise.resolve({}); }
    return new Promise((resolve) => {
      const ov = document.createElement("div"); ov.id = "chx"; if (opts.small) ov.classList.add("small"); ov.setAttribute("role", "dialog");
      const [nF, cF] = window.MINI_ART && MINI_ART.chest ? MINI_ART.chest : [8, 8];
      // what the counters say before the things land (a prepaid chest has already added them)
      const pre = { s: Math.max(0, starsFree()), c: save.carrots || 0, b: boostTotal() }; if (opts.prepaid) for (const it of opts.items) { if (it.k === "star") pre.s -= it.n; if (it.k === "carrot") pre.c -= it.n; if (it.k === "boost") pre.b -= it.n; if (it.k === "allboost") pre.b -= it.n * 5; }
      ov.innerHTML = `<div class="cx-bank"><span data-b="s">${ICON("star")}<b>${pre.s}</b></span><span data-b="c">${ICON("carrot")}<b>${pre.c}</b></span><span data-b="b">${ICON("gift")}<b>${pre.b}</b></span></div>
        <h2></h2><p class="cx-sub"></p><div class="cx-stage"><i class="cx-rays"></i><div class="cx-chest"></div></div><div class="cx-items"></div><div class="cx-btns"></div>`;
      ov.querySelector("h2").textContent = opts.title || ""; ov.querySelector(".cx-sub").textContent = opts.sub || ""; if (!opts.sub) ov.querySelector(".cx-sub").remove();
      const ch = ov.querySelector(".cx-chest"); ch.style.backgroundImage = `url(anim/mini-chest.webp${Q})`; ch.style.backgroundSize = `${cF * 100}% ${Math.ceil(nF / cF) * 100}%`; ch.style.backgroundPosition = "0% 0%";
      document.body.appendChild(ov); sfx("swap");
      const items = ov.querySelector(".cx-items"), btns = ov.querySelector(".cx-btns"), rays = ov.querySelector(".cx-rays"); let stage = 0, timers = [];
      const frame = (f) => { ch.style.backgroundPosition = `${cF > 1 ? (f % cF) / (cF - 1) * 100 : 0}% 0%`; };
      const label = (it) => it.k === "star" ? ["star", "+" + it.n, T("Stars")] : it.k === "carrot" ? ["carrot", "+" + it.n, T("Carrots")] : it.k === "boost" ? [it.b, "+" + it.n, PT(BN[it.b])] : it.k === "allboost" ? ["gift", "+" + it.n, T("Every booster")] : ["heart", "∞", T("Unlimited lives · {0} min", it.n)];
      const shown = opts.items.map(it => { const [ic, t1, t2] = label(it), s = document.createElement("span"); s.dataset.k = it.k; s.innerHTML = `${ICON(ic)}<b></b><small></small>`; s.querySelector("b").textContent = t1; s.querySelector("small").textContent = t2; items.appendChild(s); return s; });
      // the keyed sequence: drop, rattle, the lid (eight drawings at 22 a second), the rays, the things one by one
      const at = (ms, fn) => timers.push(setTimeout(fn, ms));
      play(ch, "chestDrop"); at(380, () => sfx("pop", 1));
      at(700, () => { play(ch, "chestRattle"); sfx("pop", 2); try { buzz(10); } catch (e) {} }); at(1150, () => sfx("pop", 3)); at(1550, () => sfx("pop", 5));
      at(1820, () => { stage = 1; let f = 0; const step = () => { frame(f); if (++f < nF) timers.push(setTimeout(step, 45)); }; step(); sfx("reward"); try { buzz([20, 30, 20]); } catch (e) {} });
      at(1960, () => play(rays, "chestRays"));
      const popAll = (fast) => { const sr = ch.getBoundingClientRect(); shown.forEach((s, i) => { const go = () => { if (s._in) return; s._in = 1; s.style.opacity = ""; if (fast || !s.animate) return; const r = s.getBoundingClientRect(), x0 = sr.left + sr.width / 2 - (r.left + r.width / 2), y0 = sr.top + sr.height * .55 - (r.top + r.height / 2);
          const k = UI_KEYS.path("chestPop", -x0, -y0, `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`); s.animate(k.frames, { duration: k.duration, fill: "both" }); sfx("pop", 4 + i); }; if (fast) go(); else at(i * 170, go); }); };
      at(2200, () => { stage = 2; popAll(false); at(shown.length * 170 + 450, buttons); });
      let btnUp = false;
      function buttons() { if (btnUp) return; btnUp = true; stage = 3; const b = document.createElement("button"); b.className = "btn"; b.type = "button"; b.textContent = T("Collect"); btns.appendChild(b); b.addEventListener("click", (e) => { e.stopPropagation(); collect(); }, { once: true }); }
      // a tap before the things are out skips to the end of the opening
      ov.addEventListener("click", () => { if (stage >= 3) return; timers.forEach(clearTimeout); timers = []; ch.getAnimations().forEach(a => a.finish()); frame(nF - 1); rays.style.opacity = .85; popAll(true); buttons(); });
      async function collect() { btns.innerHTML = ""; if (!opts.prepaid) pay(opts.items);
        const bank = (k) => ov.querySelector(`.cx-bank [data-b="${k === "star" ? "s" : k === "carrot" ? "c" : k === "lives" ? "c" : "b"}"]`);
        let last = 0; shown.forEach((s, i) => { const k = s.dataset.k, tgt = bank(k), a = s.querySelector("i").getBoundingClientRect(), t = tgt.getBoundingClientRect(); last = i * 140 + 760;
          setTimeout(() => { const f = document.createElement("div"); f.className = "cxfly"; f.innerHTML = s.querySelector("i").innerHTML; document.body.appendChild(f); s.style.opacity = .35; const base = `translate(${a.left.toFixed(1)}px, ${a.top.toFixed(1)}px)`, kf = UI_KEYS.path("flyIcon", t.left + 6 - a.left, t.top + 2 - a.top, base);
            f.style.transform = base; const an = f.animate(kf.frames, { duration: kf.duration, fill: "forwards" }); an.onfinish = () => { f.remove(); const v = tgt.querySelector("b"); v.textContent = tgt.dataset.b === "s" ? Math.max(0, starsFree()) : tgt.dataset.b === "c" ? save.carrots || 0 : boostTotal(); try { bump(tgt); } catch (e) {} sfx("pop", 6 + i); }; }, i * 140); });
        await wait(last + 250);
        try { const st = $("starsTotal"); if (st) st.textContent = Math.max(0, starsFree()); const cr = $("carrots"); if (cr) cr.textContent = save.carrots || 0; } catch (e) {}
        let played = null;
        if (opts.invite && window.MINI) { played = await invite(opts.invite, opts.from); }
        ov.style.transition = "opacity .25s"; ov.style.opacity = 0; setTimeout(() => ov.remove(), 260); resolve({ played }); }
      function invite(game, from) { return new Promise((res) => { items.innerHTML = ""; const card = document.createElement("div"); card.className = "cx-inv";
          const bg = { carrots: "bg-field", fireflies: "bg-night", lilypads: "bg-pond", nests: "bg-tree" }[game], title = window.MINI_T ? MINI_T(game) : game;
          card.innerHTML = `<img alt="" src="anim/mini-${bg}.webp${Q}"><span></span>`; card.querySelector("span").textContent = T("{0} left a game behind: {1}", from || "Pogo", title); items.appendChild(card);
          const p = document.createElement("button"); p.className = "btn"; p.type = "button"; p.textContent = T("Play"); const l = document.createElement("button"); l.className = "btn ghost"; l.type = "button"; l.textContent = T("Later"); btns.append(p, l);
          p.addEventListener("click", async (e) => { e.stopPropagation(); btns.innerHTML = ""; ov.style.visibility = "hidden"; const r = await MINI.open(game, { reward: true }); res(r && r.reward); }, { once: true });
          l.addEventListener("click", (e) => { e.stopPropagation(); save.miniFree = (save.miniFree || 0) + 1; try { persist(); tip(T("Saved in the Playground: one free game."), 2600); } catch (er) {} res(null); }, { once: true }); }); }
    }); }
  // what a chest puts in the save; boosters go through the save's multiplier, so the item says what really landed
  function pay(list) { for (const it of list) { if (it.k === "star") save.starBonus = (save.starBonus || 0) + it.n; else if (it.k === "carrot") save.carrots = (save.carrots || 0) + it.n;
      else if (it.k === "boost") { save.boost[it.b] = (save.boost[it.b] || 0) + it.raw; } else if (it.k === "allboost") { for (const k in BOOST0) save.boost[k] = (save.boost[k] || 0) + it.raw; } } try { persist(); } catch (e) {} }
  const BXMn = () => typeof BXM === "number" ? BXM : 1;
  const boostItem = (b, raw) => ({ k: "boost", b, raw, n: raw * BXMn() });

  // ---------------------------------------------------------------- the boss's chest, on the first win of a tenth level: two stars and one booster
  // handout (no carrots: the boss level already pays its loot in carrots), and the side game he leaves behind
  const CHEST_BOSS = { stars: 2, boost: 1 };
  async function afterBoss(lv) { const c = Math.floor(lv / 10); if (window.__fast) return;
    if (!seen(c, "outro")) await comic(c, "outro");
    const pool = ["hammer", "moves", "switch", "cross"], b = pool[(c + (save.stats && save.stats.wins || 0)) % pool.length], name = bossName(c);
    await chest({ title: KIND(c) === "flock" ? T("The flock's chest") : T("{0}'s chest", name), items: [{ k: "star", n: CHEST_BOSS.stars }, boostItem(b, CHEST_BOSS.boost)], invite: GAME_OF(c), from: name }); }

  // ---------------------------------------------------------------- the boss's line when he wins
  function taunt() { const el = typeof BS === "object" && BS.boss; if (!el || !el.isConnected || window.__fast || !G) return 0; const c = Math.floor(G.level / 10), list = TAUNT[KIND(c)], line = L2(list[(save.fails[G.level] || 0) % list.length]);
    const t = document.createElement("div"); t.className = "cmxTaunt"; t.textContent = line; document.body.appendChild(t); const r = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    let x = r.left - w - 6; if (x < 6) x = Math.min(innerWidth - w - 6, r.right + 6); let y = r.top + 6; if (y + h > innerHeight - 6) y = innerHeight - h - 6; t.style.left = Math.round(x) + "px"; t.style.top = Math.round(Math.max(6, y)) + "px"; t.style.transformOrigin = x < r.left ? "100% 50%" : "0% 50%";
    const a = play(t, "tauntIn"); if (a) a.onfinish = () => t.remove(); else setTimeout(() => t.remove(), 2100); sfx("bad"); return 1200; }

  // ---------------------------------------------------------------- Pogo's present: every fifth carrot he eats, a small chest (a booster handout or two stars, by turns)
  const FULL = 5;
  function petGift() { const n = Math.floor((save.fed || 0) / FULL); if (!n || (save.fed || 0) % FULL) return Promise.resolve(); const pool = ["hammer", "moves", "switch", "cross"];
    const items = n % 2 ? [boostItem(pool[n % pool.length], 1)] : [{ k: "star", n: 2 }];
    return chest({ title: T("Pogo brought you a present!"), sub: T("He ate five carrots and he is full. This is for you."), items, small: true }); }
  const toGift = () => FULL - ((save.fed || 0) % FULL);

  // ---------------------------------------------------------------- the story book: the comics of every place already met can be watched again
  function bookButtons(sec, c) { const i = seen(c, "intro"), o = seen(c, "outro"); if (!i && !o) return; const w = document.createElement("div"); w.className = "cmxw";
    if (i) { const b = document.createElement("button"); b.type = "button"; b.textContent = "▶ " + T("Watch the meeting"); b.addEventListener("click", () => comic(c, "intro", { replay: true })); w.appendChild(b); }
    if (o) { const b = document.createElement("button"); b.type = "button"; b.textContent = "▶ " + T("Watch the ending"); b.addEventListener("click", () => comic(c, "outro", { replay: true })); w.appendChild(b); }
    sec.appendChild(w); }

  addEventListener("load", () => setTimeout(() => { const im = new Image(); im.src = `anim/mini-chest.webp${Q}`; if (im.decode) im.decode().catch(() => {}); }, 1500));
  window.STORY = { comic, wantIntro, afterBoss, chest, taunt, petGift, toGift, bookButtons, seen, MEET, TAUNT, GAME_OF, CHEST_BOSS, boostItem, T, get open() { return !!open; } };
})();
