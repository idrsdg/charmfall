// Charmfall story and rewards (2026-11-06, İdris picked "Hepsi": boss comics with dialogue, a reward chest, carrots as side-game tickets, a gift
// from Pogo when he is full). Loaded after index.html's script and mini.js; it reads the page's globals (save, persist, CHAPTERS, bossOf,
// TR, PA, paHtml, paPlay, PA_RUN, paTick, CR, ART_Q, ICO, BICON, BXM, RWM, starsFree, SFX, buzz, tip, UI_KEYS) and the page calls in at these places:
//   STORY.wantIntro(level) / STORY.comic(chapter, "intro" | "outro", { replay })   before a boss level and after its first win (and from the story book)
//   STORY.wantKingdom(level) / STORY.kingdom(k, { replay })   the arrival page of a kingdom, the first time its first level is opened
//   STORY.afterBoss(level)    the outro, the boss's chest and its side-game invitation, on the first win of every tenth level
//   STORY.chest(opts)         the chest: drops, rattles, the lid opens (anim/mini-chest.webp, eight painted drawings), the things inside come out,
//                             Collect sends them to the counters; station gifts and Pogo's present use it too
//   STORY.taunt()             the boss's line beside his figure on the board when a boss level is lost
//   STORY.petGift()           every fifth carrot Pogo eats he brings a small chest
// 2026-11-22 the comics became a POP-UP BOOK: one book lies on the table, its back page swings up on the spine and the scene stands up out of the
// fold in layers (cut paper drawn here as SVG, CSS 3D, transform and opacity only, every motion a keyed table in PB below).
// 2026-11-23 the world became TEN KINGDOMS of fifty levels (İdris: "her 50 levelde bir krallık... her krallığın kendi konsepti olsun"): fifty
// places, five to a kingdom, one paper scene per kingdom, and an arrival page whose gate stands up out of the fold. The place names, the narrator's
// lines and the bosses' lines are in story-data.js (window.STORY_DATA, one source for this file and the page); what is said in the balloons is here.
// Nothing runs while no comic or chest is shown.
(() => {
  "use strict";
  if (typeof save !== "object" || !window.UI_KEYS) return;
  const $ = (id) => document.getElementById(id), tr = () => save.lang === "tr";
  // ---------------------------------------------------------------- words: English in the code, Turkish beside it; the page's own TR table for its own lines
  const TRS = {
    "Skip": "Geç", "Tap to go on": "Devam etmek için dokun", "Chapter {0}": "Bölüm {0}", "The end of chapter {0}": "{0}. bölümün sonu", "Watch": "İzle", "Watch the meeting": "Karşılaşmayı izle", "Watch the ending": "Sonu izle",
    "Collect": "Topla", "Later": "Sonra", "Play": "Oyna", "Station gift": "İstasyon hediyesi", "Pogo brought you a present!": "Pogo sana bir hediye getirdi!",
    "{0} left a game behind: {1}": "{0} geride bir oyun bıraktı: {1}", "Saved in the Playground: one free game.": "Oyun parkına kaydedildi: bir bedava oyun.",
    "Every booster": "Her güçlendirici", "Unlimited lives · {0} min": "Sınırsız can · {0} dk", "He ate five carrots and he is full. This is for you.": "Beş havuç yedi ve doydu. Bu senin için.",
    "Next present in {0} carrots": "Sonraki hediye {0} havuç sonra", "Stars": "Yıldız", "Carrots": "Havuç", "Boosters": "Güçlendirici",
    "A pop-up story": "Açılır kitap masalı", "A memory": "Bir anı", "TURNIP": "ŞALGAM", "Kingdom {0} of 10": "Krallık {0}/10", "The Lantern Line": "Fener Hattı", "Next stop": "Sıradaki durak"
  };
  const T = (s, ...a) => { let o = (tr() && TRS[s]) || s; a.forEach((v, i) => { o = o.replace("{" + i + "}", v); }); return o; };
  const PT = (s) => (tr() && typeof TR === "object" && TR[s]) || s;   // the page's own lines (booster names)
  const L2 = (pair) => (tr() ? pair[1] : pair[0]) || pair[0] || "";

  // ---------------------------------------------------------------- the world, from story-data.js. Without it (the page forgot the script) the
  // story still stands on what the page knows: its own chapter names and boss notes, the same in both languages.
  const KID = ["forest", "water", "fire", "ice", "air", "sand", "crystal", "night", "storm", "star"], KINDS = ["magpie", "flock", "gritt", "corvin", "bat"], NCH = 50, PER = 5, KLEVELS = 50;
  function fallback() { const two = (s) => [s, s], CH = typeof CHAPTERS === "object" && CHAPTERS ? CHAPTERS : [], KG = typeof KINGDOMS === "object" && KINGDOMS ? KINGDOMS : [];
    return { world: two("The Ten Kingdoms"), kingdoms: KID.map((id, k) => ({ id, name: KG[k] ? [KG[k].name, KG[k].tr || KG[k].name] : two("Kingdom " + (k + 1)), line: two("") })),
      places: Array.from({ length: NCH }, (_, c) => { const C = CH[c] || {}; return { name: two(C.name || "Place " + (c + 1)), title: two(C.title || ""), text: two(C.text || ""), short: two(""), props: C.props || [] }; }),
      bosses: Array.from({ length: NCH }, (_, c) => { let b = {}; try { b = bossOf(c * 10) || {}; } catch (e) {} return { kind: KINDS.includes(b.kind) ? b.kind : KINDS[Math.floor(c / 10)], name: two(b.name || "Mordo"), own: two(b.own || ""), loot: two(b.loot || ""), note: two((typeof BOSS_NOTE === "object" && BOSS_NOTE && BOSS_NOTE[c]) || "...") }; }),
      stations: [], end: { text: two(""), short: two("") } }; }
  const SD = (window.STORY_DATA && window.STORY_DATA.places && window.STORY_DATA.places.length === NCH && window.STORY_DATA) || fallback();
  const WORLD = SD.world || ["The Ten Kingdoms", "On Krallık"];
  const kOf = (c) => Math.max(0, Math.min(KID.length - 1, Math.floor(c / PER)));
  // the old shapes, still handed out: [name, Turkish name, title, Turkish title], the narrator's line, the boss's line when he loses
  const PLACES = SD.places.map((p) => [p.name[0], p.name[1], p.title[0], p.title[1]]), NARR = SD.places.map((p) => p.text), OUT = SD.bosses.map((b) => b.note);
  const place = (c) => { c = Math.max(0, Math.min(NCH - 1, c)); const p = SD.places[c]; return { name: L2(p.name), title: L2(p.title), text: L2(p.text), short: L2(p.short), props: p.props, kingdom: kOf(c) }; };
  const realm = (k) => { k = Math.max(0, Math.min(KID.length - 1, k)); const K = SD.kingdoms[k]; return { k, id: KID[k], name: L2(K.name), line: L2(K.line) }; };

  // ---------------------------------------------------------------- the lines: for every place, what its boss says when Pogo arrives and Pogo's answer
  const MEET = [
    // Forest: Mordo
    [["Shiny things belong to whoever grabs them first. That is me.", "Parlak şeyler ilk kapanındır. Yani benim."], ["They belong to the oak. Nothing grows without them!", "Onlar meşenin. Onlarsız hiçbir şey büyümüyor!"]],
    [["Brambles keep everybody out. Even nosy rabbits.", "Böğürtlen dikeni herkesi uzak tutar. Meraklı tavşanları bile."], ["They kept your feathers too. You're moulting, Mordo.", "Tüylerini de tutmuş. Tüy döküyorsun, Mordo."]],
    [["The tunnel is that way, rabbit. Dark. Very long.", "Tünel şu tarafta, tavşan. Karanlık. Çok uzun."], ["I can count to ten. No tunnel is longer than that.", "Ona kadar sayabilirim. Hiçbir tünel bundan uzun değil."]],
    [["This bridge is made of acorns. One wrong hop, rabbit.", "Bu köprü palamuttan. Tek yanlış zıplayış, tavşan."], ["The squirrels built it. Squirrels are on my side.", "Onu sincaplar yaptı. Sincaplar benden yana."]],
    [["The last ones are in my hollow. It is so dark here without them.", "Sonuncular kovuğumda. Onlar olmadan burası çok karanlık."], ["So that's why you took them. Let's talk after this board.", "Demek bu yüzden aldın. Bu tahtadan sonra konuşalım."]],
    // Water: the flock
    [["Cheep! Mordo gave his back. We didn't! Didn't! Didn't!", "Cik! Mordo kendininkileri verdi. Biz vermedik! Vermedik!"], ["Then I'll ask the whole flock nicely. With matches.", "O zaman bütün sürüye kibarca sorarım. Eşleşmelerle."]],
    [["Cheep! The lilies are shut. Charms stay shut too! Shut!", "Cik! Nilüferler kapalı. Tılsımlar da kapalı kalacak! Kalacak!"], ["Flowers open for light. So will you.", "Çiçekler ışığa açılır. Siz de açılırsınız."]],
    [["Cheep-cheep! A charm in every paddle! Our idea! Idea!", "Cik cik! Her kanatta bir tılsım! Bizim fikrimiz! Fikrimiz!"], ["People are hungry, you sillies. The mill makes the bread.", "Herkes aç, sizi şapşallar. Ekmeği değirmen yapıyor."]],
    [["Cheep! A tunnel! Rabbits hate tunnels! Tunnels!", "Cik! Tünel! Tavşanlar tünel sevmez! Sevmez!"], ["Seventeen, eighteen... I'm busy. Nineteen.", "On yedi, on sekiz... Meşgulüm. On dokuz."]],
    [["Cheep! Mordo is the boss. We do what Mordo did! Did!", "Cik! Patron Mordo. Mordo ne yaptıysa onu yaparız! Yaparız!"], ["Then look. He's right here, giving them back.", "O zaman bakın. İşte burada, geri veriyor."]],
    // Fire: Gritt
    [["I'm Gritt. Mordo went soft. I didn't.", "Ben Gritt. Mordo yumuşadı. Ben yumuşamadım."], ["Mordo found out sharing feels nice. You could too.", "Mordo paylaşmanın güzel olduğunu keşfetti. Sen de edebilirsin."]],
    [["A cold forge is no use to anyone. I only took what was warm.", "Soğuk ocak kimsenin işine yaramaz. Ben yalnızca sıcak olanı aldım."], ["It was warm because of what you took!", "Aldığın şey yüzünden sıcaktı zaten!"]],
    [["A thousand flames, bunny. I was quicker than every one.", "Bin alev, tavşancık. Hepsinden hızlıydım."], ["Quick isn't the same as warm, Gritt.", "Hızlı olmak ısınmak demek değil, Gritt."]],
    [["Follow my footprints if you like. They go where it is warm.", "İstersen izlerimi takip et. Sıcak olan yere gidiyorlar."], ["They're small footprints, Gritt. And they're shaking.", "İzlerin küçücük, Gritt. Üstelik titriyorlar."]],
    [["The mountain has slept enough. Its heart is mine now.", "Dağ yeterince uyudu. Yüreği artık benim."], ["You're holding a volcano and you're still cold?", "Kucağında yanardağ var, hâlâ mı üşüyorsun?"]],
    // Ice: Gritt
    [["Drip, drip. Not my fault. Ice should try harder.", "Tıp, tıp. Benim suçum değil. Buz biraz gayret etsin."], ["Captain Waddle has run out of buckets, Gritt.", "Paytak Kaptan'ın kovası kalmadı, Gritt."]],
    [["Snowmen do not feel the cold. Lucky them.", "Kardan adamlar üşümez. Ne şanslılar."], ["They feel the warm. One gave me his scarf anyway.", "Sıcağı hissediyorlar. Biri yine de atkısını bana verdi."]],
    [["Thin ice, bunny. And you are a hopper.", "Buz incecik, tavşancık. Sen de zıplayıp duruyorsun."], ["Not today. Today I'm a very careful walker.", "Bugün değil. Bugün çok dikkatli yürüyorum."]],
    [["Go home. You have a burrow. I never had a warm one.", "Evine dön. Senin bir yuvan var. Benim hiç sıcak yuvam olmadı."], ["Then let's find you one that melts nobody.", "O zaman sana kimseyi eritmeyen bir yuva bulalım."]],
    [["I am warm. For the first time. Do not take it away.", "Isındım. İlk kez. Onu benden alma."], ["I won't take it. We'll swap. Brand made you something.", "Almayacağım. Değiş tokuş yapacağız. Kor Usta sana bir şey yaptı."]],
    // Sky: Corvin
    [["Krr. The sky is closed, little rabbit. Go down.", "Krr. Gökyüzü kapalı, küçük tavşan. Aşağı in."], ["A sky can't be closed. It hasn't got a door.", "Gökyüzü kapanmaz ki. Kapısı yok."]],
    [["Kites fly away. That is all a kite ever wants.", "Uçurtmalar uçup gider. Bütün istedikleri budur."], ["They're on strings, Corvin. They always come back.", "İpleri var, Corvin. Hep geri gelirler."]],
    [["The mills point at me. Mills cannot keep a secret.", "Değirmenler beni gösteriyor. Değirmenler sır tutamaz."], ["They aren't telling on you. They miss you.", "Seni ele vermiyorlar. Seni özlüyorlar."]],
    [["A wind takes things away. Balloons. Leaves. Flocks.", "Rüzgâr alır götürür. Balonları. Yaprakları. Sürüleri."], ["It brings things too. That's how the post gets here.", "Getirir de. Posta buraya öyle geliyor."]],
    [["My tower, my winds. Tied up, they cannot leave me.", "Benim kulem, benim rüzgârlarım. Bağlıyken beni bırakamazlar."], ["A wind in a sack isn't a wind. It's a sad sack.", "Çuvaldaki rüzgâr rüzgâr değildir. Üzgün bir çuvaldır."]],
    // Sand: Corvin
    [["The sacks leaked. I did not mean the sand. Krr.", "Çuvallar sızdırdı. Kum olsun istemedim. Krr."], ["Then help me put it right. Start with the teapot.", "O zaman düzeltmeme yardım et. Demlikten başlayalım."]],
    [["A well is only a hole that waits. I know about waiting.", "Kuyu, bekleyen bir çukurdur. Beklemeyi iyi bilirim."], ["Thimble says wells are patient. People get thirsty.", "Yüksük, kuyular sabırlıdır diyor. Ama herkes susar."]],
    [["Nobody at this market will sell me a wind back.", "Bu pazarda kimse bana rüzgârımı geri satmıyor."], ["Winds aren't for sale. Neither are charms.", "Rüzgâr satılmaz. Tılsım da satılmaz."]],
    [["Stand still, all of you! Sixty years I looked after you!", "Durun bakalım! Altmış yıl size ben baktım!"], ["They're playing, Corvin. Have you ever tried it?", "Oyun oynuyorlar, Corvin. Sen hiç denedin mi?"]],
    [["Room for a hundred, and they all flew away. You go, too.", "Yüz kuşluk yer var; hepsi uçup gitti. Sen de git."], ["I came to bring you a letter, not to take your home.", "Sana mektup getirmeye geldim, evini almaya değil."]],
    // Crystal: a shadow
    [["...Sorry. I need this. Sorry.", "...Özür dilerim. Bu bana lazım. Özür dilerim."], ["Who said that? ...Eight, nine, ten. Who said that?", "Kim konuştu? ...Sekiz, dokuz, on. Kim konuştu?"]],
    [["Do not look in the mirrors. I am not there.", "Aynalara bakma. Orada değilim."], ["Nobody is. That's the trouble.", "Kimse yok. Mesele de bu."]],
    [["I only take the high notes. Nobody needs those.", "Yalnızca ince notaları alıyorum. Onlar kimseye lazım değil."], ["A song needs all of them. Ask the miners.", "Bir şarkıya hepsi lazım. Madencilere sor."]],
    [["I am not a thief. Thieves keep things.", "Ben hırsız değilim. Hırsızlar aldıklarını saklar."], ["Then what do you do with all that light?", "Peki bu kadar ışığı ne yapıyorsun?"]],
    [["This is the last big one. Then I will have enough.", "Bu son büyük ışık. Sonra yeteri kadar olacak."], ["Enough for what? ...Wait! Come back!", "Ne için yeteri kadar? ...Dur! Geri gel!"]],
    // Night: Nyx
    [["Shh. You should not have followed me here.", "Şşş. Peşimden buraya gelmemeliydin."], ["You took a moon. People notice a moon.", "Bir ay aldın. Ay fark edilir."]],
    [["The brightest lantern is the one I need most.", "En parlak fener, bana en çok lazım olan."], ["They need it too. It's their moon now.", "Onlara da lazım. Artık ayları o."]],
    [["Hush. The little ones are trying to sleep.", "Sus. Küçükler uyumaya çalışıyor."], ["They can't. You've got their night light.", "Uyuyamıyorlar. Gece lambaları sende."]],
    [["I cried, yes. It is heavy, and I am small.", "Ağladım, evet. O ağır, ben küçüğüm."], ["Then let somebody help you carry it.", "O zaman bırak, biri taşımana yardım etsin."]],
    [["It is nearly enough. Do not stop me now. Please.", "Neredeyse yetecek. Şimdi durdurma beni. Lütfen."], ["Enough for what, Nyx? Tell me. I'll listen.", "Ne için, Nyx? Anlat. Dinliyorum."]],
    // Storm: frightened friends, holding on too tight
    [["Cheep! Got one! Got one! The wind wants it! Wants it!", "Cik! Yakaladık! Yakaladık! Rüzgâr onu istiyor! İstiyor!"], ["You're holding too tight. I'm here. Let go!", "Çok sıkı tutuyorsunuz. Buradayım. Bırakın!"]],
    [["I caught them for you, Pogo! But my claws will not open!", "Onları senin için yakaladım, Pogo! Ama pençelerim açılmıyor!"], ["It's all right. Scared claws do that. One at a time.", "Olsun. Korkan pençe böyle yapar. Teker teker."]],
    [["Krr! This wind is not one of mine. It does not listen!", "Krr! Bu rüzgâr benimkilerden değil. Laf dinlemiyor!"], ["Don't tie it up. Lean on it, like a kite.", "Bağlama onu. Yaslan, bir uçurtma gibi."]],
    [["I am not scared. I am just holding these. Very hard.", "Korkmuyorum. Yalnızca bunları tutuyorum. Sımsıkı."], ["I held a rail like that once. Take my paw instead.", "Bir tırabzanı öyle tutmuştum. Onun yerine patimi tut."]],
    [["Too loud! I cannot hear where anything is! Go away!", "Çok gürültülü! Hiçbir şeyin yerini duyamıyorum! Git!"], ["Then listen to me counting. One. Two. I'm right here.", "O zaman sayışımı dinle. Bir. İki. Tam buradayım."]],
    // Star: the lamps only take light that is given
    [["The first lamp is mine. Beat me fair, and I light it.", "İlk lamba benim. Beni hakkıyla yen, yakayım."], ["No tricks? Then show me what's in your beak.", "Hile yok mu? O zaman göster, gaganda ne var?"]],
    [["Cheep! Our lamp! We give! We give! How do we give?", "Cik! Bizim lamba! Veriyoruz! Veriyoruz! Nasıl verilir?"], ["Same as taking, only backwards. I'll show you.", "Almak gibi, yalnızca tersinden. Göstereyim."]],
    [["This lamp wants something warm. I only have one warm thing.", "Bu lamba sıcak bir şey istiyor. Bende tek bir sıcak şey var."], ["Your stove? Gritt, you don't have to.", "Soban mı? Gritt, zorunda değilsin."]],
    [["Krr. Lamps blow out. I shall keep the wind off this one.", "Krr. Lambalar söner. Bunu rüzgârdan ben koruyacağım."], ["A little wind helps a flame, Corvin. Just a little.", "Biraz rüzgâr alevi büyütür, Corvin. Birazcık."]],
    [["What if they go out again, and I am alone again?", "Ya yine sönerlerse, ben de yine yalnız kalırsam?"], ["Then we light them again. There's a train now, Nyx.", "O zaman yine yakarız. Artık bir tren var, Nyx."]]
  ];
  // the extra pages of the places where the story turns. pre: before the meeting; post: in the ending, between the boss's line and the charm.
  // A page is { l, r, say: [[side, [en, tr]], ...] } (who stands left and right, who speaks), { cap: [en, tr] } (the narrator alone) or
  // { mem: boss, caps: [[en, tr], [en, tr]] } (a memory: the book closes and opens again as a shadow theatre)
  const BEATS = {
    0: { pre: [{ l: "pogo:hello", r: "crab", say: [["r", ["Tickets, please! Next stop: straight on. For me, that is left.", "Biletler lütfen! Sıradaki durak: dümdüz. Yani bana göre sola."]], ["l", ["I'm the porter, Barnacle. I work here.", "Ben hamalım, Kıskaç. Burada çalışıyorum."]]] }] },
    1: { pre: [{ l: "pogo:look", r: "fox", say: [["r", ["Magpie feathers. I counted today's new leaves, too: none.", "Saksağan tüyü. Bugün açan yaprakları da saydım: sıfır."]], ["l", ["Then I'll follow the feathers, Hazel.", "O zaman tüyleri izleyeceğim, Fındık."]]] }] },
    2: { pre: [{ l: "pogo:hello", r: "pip", say: [["r", ["Post! One letter, only three winters late. Nearly there!", "Posta! Tek mektup, yalnızca üç kış gecikti. Az kaldı!"]], ["l", ["Three winters?! ...Good luck, Pip.", "Üç kış mı?! ...Kolay gelsin, Pip."]]] }] },
    4: { post: [{ mem: "magpie", caps: [["Long ago a small magpie hatched deep in the hollow of an old oak.", "Çok eskiden küçük bir saksağan, yaşlı bir meşenin kovuğunda yumurtadan çıktı."], ["No light ever reached his nest. So he went out to find some.", "Yuvasına hiç ışık ulaşmadı. O da ışık aramaya çıktı."]] },
      { l: "pogo:throw", r: "magpie", say: [["l", ["Keep this one. A lantern off the train. It never goes out.", "Bu sende kalsın. Trenin fenerlerinden. Hiç sönmez."]], ["r", ["...The flock copies me. I'll show you where they went.", "...Sürü beni taklit eder. Nereye gittiklerini gösteririm."]]] }] },
    5: { pre: [{ l: "pogo:idle", r: "magpie", say: [["r", ["The flock does everything I do. I never told them to stop.", "Sürü ne yaparsam onu yapar. Durun demeyi unuttum."]], ["l", ["Then let's go and tell them. Together.", "O zaman gidip söyleyelim. Birlikte."]]] }] },
    6: { pre: [{ l: "pogo:worry", r: "crab", say: [["r", ["The palace? Straight on. So: sideways.", "Saray mı? Dümdüz. Yani: yan yan."]], ["l", ["I'm starting to understand crab.", "Yengeççeyi çözmeye başladım."]]] }] },
    9: { post: [{ mem: "flock", caps: [["A flock of small birds never had a song of its own.", "Küçük kuşlardan bir sürünün kendine ait bir şarkısı hiç olmadı."], ["So they sang whatever the biggest bird sang. Even the wrong notes.", "Onlar da en büyük kuş ne söylerse onu söyledi. Yanlış notaları bile."]] },
      { l: "magpie", r: "flock", say: [["l", ["New song. It goes: we give it back.", "Yeni şarkı. Şöyle: geri veriyoruz."]], ["r", ["Back! Back! ...But half is gone. A little shadow took it. At night!", "Veriyoruz! ...Ama yarısı yok. Küçük bir gölge aldı. Gece!"]]] }] },
    10: { pre: [{ l: "pogo:look", r: "magpie", say: [["r", ["That's my cousin Gritt. Careful. She was always the quick one.", "Bu kuzenim Gritt. Dikkat et. Hep en hızlımız oydu."]], ["l", ["Quick is fine. I've been practising.", "Hızlı olsun. Ben de çalıştım."]]] }] },
    11: { pre: [{ l: "pogo:hello", r: "bear", say: [["r", ["Cold forge. Cold tea. Cold sandwiches. Fix it, porter.", "Soğuk ocak. Soğuk çay. Soğuk sandviç. Hallet şunu, hamal."]], ["l", ["I'll try, Mr Brand. Is any of it carrot?", "Denerim, Kor Usta. İçinde havuçlu olan var mı?"]]] }] },
    15: { pre: [{ l: "pogo:worry", r: "penguin", say: [["r", ["Welcome to the Ice Kingdom! Mind the puddle. And that one.", "Buz Krallığı'na hoş geldiniz! Su birikintisine dikkat. Şuna da."]], ["l", ["It's all puddle, Captain.", "Her yer birikinti, Kaptan."]]] }] },
    19: { pre: [{ l: "pogo:ready", r: "bear", say: [["r", ["Made it small. Burns one coal a day. Melts nothing.", "Küçük yaptım. Günde tek kor yakar. Hiçbir şeyi eritmez."]], ["l", ["It's perfect. You even wrote her name on it.", "Harika olmuş. Üstüne adını bile yazmışsın."]]] }],
      post: [{ mem: "gritt", caps: [["Five chicks in one nest. The smallest slept on the outside, every night.", "Bir yuvada beş yavru. En küçükleri her gece en kenarda uyudu."], ["So she learned to grab whatever was warm, and never to let go.", "O da sıcak ne bulursa kapmayı öğrendi, bir de hiç bırakmamayı."]] },
        { l: "magpie", r: "gritt", say: [["l", ["You don't have to grab, Gritt. This one was made for you.", "Kapmana gerek yok, Gritt. Bu senin için yapıldı."]], ["r", ["...Half my embers went in the night. Something small. It said sorry.", "...Korlarımın yarısı gece gitti. Küçük bir şey aldı. Özür diledi."]]] }] },
    20: { pre: [{ l: "pogo:wow", r: "eagle", say: [["r", ["I am King Gale. I do not walk. Today I am walking.", "Ben Kral Poyraz. Ben yürümem. Bugün yürüyorum."]], ["l", ["Your Majesty, your feet are doing very well.", "Majesteleri, ayaklarınız çok başarılı."]]] }] },
    22: { pre: [{ l: "pogo:look", r: "pip", say: [["r", ["Still got the letter! It's for a Mr C. He lives up a tower.", "Mektup hâlâ bende! Bay C. diye birine. Bir kulede oturuyormuş."]], ["l", ["Pip... there's a tower right there.", "Pip... şurada bir kule var."]]] }] },
    25: { pre: [{ l: "pogo:worry", r: "crab", say: [["r", ["South? Forwards. Yes, I can walk forwards. Only when it matters.", "Güney mi? Dümdüz. Evet, düz de yürürüm. Yalnızca önemli olunca."]], ["l", ["It matters. There's sand in my ears.", "Önemli. Kulaklarıma kum doldu."]]] }] },
    26: { pre: [{ l: "pogo:hello", r: "hedgehog", say: [["r", ["Drink. Small sips. And tell that raven I want a word.", "İç. Küçük yudumlarla. O kuzguna da söyle, onunla işim var."]], ["l", ["Thank you, Thimble. I'll tell him.", "Sağ ol, Yüksük. Söylerim."]]] }] },
    29: { pre: [{ l: "pogo:wow", r: "pip", say: [["r", ["Tower. Raven. Mr C! It's him! I was only three winters out.", "Kule. Kuzgun. Bay C.! Bu o! Yalnızca üç kış şaşmışım."]], ["l", ["Fly, Pip. I'll hold the door.", "Uç, Pip. Kapıyı ben tutarım."]]] }],
      post: [{ mem: "corvin", caps: [["Every autumn the flock flew south. Every spring it came back. Except once.", "Her güz sürü güneye uçtu. Her bahar geri geldi. Bir kez hariç."], ["Their letter was three winters in the post. He thought nobody was coming.", "Mektupları üç kış postada kaldı. O da kimsenin gelmeyeceğini sandı."]] },
        { l: "pip", r: "corvin", say: [["l", ["Sorry it's late. Sign here. No, here.", "Geciktiğim için özür dilerim. Şurayı imzalayın. Yok, şurayı."]], ["r", ["Let the winds go. They will need one to fly home on.", "Rüzgârları bırakın. Eve dönmek için birine binecekler."]]] }] },
    30: { pre: [{ l: "pogo:worry", r: "crab", say: [["r", ["Longest tunnel on the line. Forty minutes. Tickets, please.", "Hattın en uzun tüneli. Kırk dakika. Biletler lütfen."]], ["l", ["Forty minutes is a lot of tens, Barnacle.", "Kırk dakika çok fazla on eder, Kıskaç."]]] }] },
    31: { pre: [{ l: "pogo:look", r: "butterfly", say: [["r", ["I'm here. No, here. Glass wings: no light, no me.", "Buradayım. Yok, burada. Cam kanat işte: ışık yoksa ben de yokum."]], ["l", ["I'll get your light back, Prism. Wherever you are.", "Işığını geri getireceğim, Camkanat. Neredeysen."]]] }] },
    34: { post: [{ cap: ["The shadow left one glow behind, and a note: 'Sorry. I will bring it all back. I think.'", "Gölge geride tek bir ışık bıraktı; bir de not: 'Özür dilerim. Hepsini geri getireceğim. Galiba.'"] }] },
    35: { pre: [{ l: "pogo:hello", r: "deer", say: [["r", ["Welcome, little porter. Speak softly. The night is listening.", "Hoş geldin, küçük hamal. Alçak sesle konuş. Gece dinliyor."]], ["l", ["(whispering) Is it always this dark?", "(fısıltıyla) Hep bu kadar karanlık mı?"]]] }] },
    38: { pre: [{ l: "pogo:ready", r: "corvin", say: [["r", ["I know what it is to keep a thing for yourself. Let me talk to her.", "Bir şeyi yalnızca kendine saklamak nedir, bilirim. Onunla ben konuşayım."]], ["l", ["We'll all go. Nobody knocks alone.", "Hep birlikte gideriz. Kimse kapıyı tek başına çalmaz."]]] }] },
    39: { post: [{ mem: "bat", caps: [["From her cave Nyx could see one small, round piece of sky, full of stars.", "Nyx mağarasından gökyüzünün küçük, yuvarlak bir parçasını görürdü; yıldız dolu."], ["One night they began to go out. So she set off to carry them some light.", "Bir gece yıldızlar tek tek sönmeye başladı. O da onlara ışık götürmek için yola çıktı."]] },
      { l: "pogo:point", r: "bat", say: [["l", ["You don't have to carry it alone. We've got a train.", "Tek başına taşımak zorunda değilsin. Bizim bir trenimiz var."]], ["r", ["A train? ...Does it go all the way up?", "Tren mi? ...En yukarıya kadar gider mi?"]]] }] },
    40: { pre: [{ l: "pogo:hello", r: "sheep", say: [["r", ["WELCOME! SORRY! I HAVE TO SHOUT! IT'S THE THUNDER!", "HOŞ GELDİN! KUSURA BAKMA! BAĞIRMAM LAZIM! GÖK GÜRLÜYOR!"]], ["l", ["THAT'S ALL RIGHT! I'M POGO! NICE UMBRELLA!", "OLSUN! BEN POGO! ŞEMSİYEN ÇOK GÜZEL!"]]] }] },
    42: { pre: [{ l: "pogo:look", r: "pip", say: [["r", ["A letter from the Last Station. It says: 'To my Pogo.'", "Son İstasyon'dan bir mektup var. Üstünde 'Pogo'ma' yazıyor."]], ["l", ["For me? Nobody writes to me.", "Bana mı? Bana kimse yazmaz ki."]]] }] },
    44: { post: [{ l: "pogo:yay", r: "sheep", say: [["r", ["DING! ...Oh. I can stop shouting. Listen. That's quiet.", "DAN! ...Aa. Artık bağırmama gerek yok. Dinle. İşte sessizlik."]], ["l", ["Look, Nimbus. The clouds are going home.", "Bak, Pamuk. Bulutlar eve dönüyor."]]] }] },
    45: { pre: [{ l: "pogo:look", r: "crab", say: [["r", ["Last Station! ...The way on is up. I can't do up. Only sideways.", "Son İstasyon! ...Yol yukarı gidiyor. Ben yukarı gidemem. Yalnızca yan yan."]], ["l", ["Then wait with the Turnip. Keep the kettle on.", "O zaman Şalgam'ın yanında bekle. Çayı da demle."]]] }] },
    48: { pre: [{ l: "pogo:wow", r: "rabbit", say: [["r", ["You've got your grandfather's ears. I'd know that hop anywhere.", "Kulakların tıpkı dedeninkiler. O zıplayışı nerede görsem tanırım."]], ["l", ["...Grandma Clover? You're the lamplighter?", "...Yonca Nine? Lambacı sen misin?"]]] }] },
    49: { pre: [{ l: "pogo:ready", r: "rabbit", say: [["r", ["My knees stopped at the third rung. I wrote, but the post is slow.", "Dizlerim üçüncü basamakta kaldı. Yazdım, ama posta yavaş."]], ["l", ["It got to me, Grandma. I'm a good climber. I'll go.", "Elime ulaştı, nine. İyi tırmanırım. Ben çıkarım."]]] }],
      post: [{ mem: "lamp", caps: [["Every evening an old rabbit climbed one ladder and lit one lamp.", "Her akşam yaşlı bir tavşan bir merdivene tırmanır, bir lamba yakardı."], ["Every star took its light from it, and every charm in the ten kingdoms.", "Bütün yıldızlar, on krallığın bütün tılsımları ışığını ondan alırdı."]] },
        { l: "pogo:point", r: "bat", say: [["l", ["Ready, Nyx? You light it. You carried it furthest.", "Hazır mısın, Nyx? Sen yak. En uzağa sen taşıdın."]], ["r", ["Together. On three. You are good at counting.", "Birlikte. Üç deyince. Saymayı iyi biliyorsun."]]] }] }
  };
  // the narrator's line under the ending: where the charm goes, and what comes next (the last place of each kingdom has its own)
  const TURN = {
    4: ["Mordo keeps one lantern for his hollow, and the forest puts out a new leaf. But the flock has flown on to the Water Kingdom...", "Mordo kovuğu için bir fener alıyor, orman yeni bir yaprak açıyor. Ama sürü Su Krallığı'na uçmuş..."],
    9: ["The river runs and the mill grinds. The flock has a new song. Far off, a mountain that should glow is grey.", "Nehir akıyor, değirmen dönüyor. Sürünün yeni bir şarkısı var. Uzakta, parlaması gereken bir dağ gri duruyor."],
    14: ["The forges are lit with what Pogo won back. But the volcano's heart has gone north, and the north is melting.", "Ocaklar Pogo'nun geri kazandıklarıyla yandı. Ama yanardağın yüreği kuzeye gitti; kuzey ise eriyor."],
    19: ["The heart goes home by train and the ice holds. Gritt keeps her little stove. High above, not one cloud is moving.", "Yürek trenle evine dönüyor, buz yeniden tutuyor. Küçük soba Gritt'te kalıyor. Yukarıda tek bir bulut kıpırdamıyor."],
    24: ["Kites go up over the Sky Kingdom. But Corvin has flown south with the last sacks, and sacks leak.", "Hava Krallığı'nda uçurtmalar yükseliyor. Ama Corvin son çuvallarla güneye uçtu; çuvallar da sızdırır."],
    29: ["The wells fill. But half the sacks were empty: something small took the best wind and flew into the mountain.", "Kuyular doluyor. Ama çuvalların yarısı boştu: küçük bir şey en iyi rüzgârı alıp dağın içine uçmuş."],
    34: ["The big crystal hums again. The shadow has gone out into the Night Kingdom, saying sorry all the way.", "Büyük kristal yeniden mırıldanıyor. Gölge, yol boyu özür dileyerek Gece Krallığı'na uçtu."],
    39: ["The moon goes home to its lake. The rest rides up the line, Nyx on the roof. But a storm lies ahead.", "Ay gölüne dönüyor. Gerisi trenle yukarı gidiyor, Nyx vagonun damında. Ama ileride bir fırtına var."],
    44: ["The bell rings and the clouds go home. A rainbow, the first in a year. Above it the sky is still black.", "Çan çalıyor, bulutlar eve dönüyor. Bir yılın ilk gökkuşağı. Onun üstünde gök hâlâ kapkara."],
    49: ["The Great Lamp is lit. The stars come on, one for every wish. Everybody gets a carrot. Only Pogo eats his.", "Büyük Lamba yandı. Yıldızlar yanıyor, her dilek için bir tane. Herkese bir havuç düşüyor. Yalnızca Pogo yiyor."]
  };
  const ending = (c) => TURN[c] ? L2(TURN[c]) : tr() ? place(c).name + " yeniden ışıldıyor. Sıradaki durak: " + place(c + 1).name + "." : place(c).name + " shines again. Next stop: " + place(c + 1).name + ".";
  // the second line of a kingdom's arrival page (the first is the kingdom's own line in story-data.js): who keeps its gate
  const GATE = [
    ["Hazel the fox waits at the gate with a list of everything that has stopped.", "Tilki Fındık kapıda bekliyor; elinde, duran her şeyin listesi."],
    ["Queen Mira's gate is a wave that forgot to fall. Barnacle is home.", "Kraliçe Mira'nın kapısı, düşmeyi unutmuş bir dalga. Kıskaç evine döndü."],
    ["Brand the bear built this gate himself. It used to be too hot to touch.", "Bu kapıyı ayı Kor Usta kendi elleriyle yaptı. Eskiden dokunulamayacak kadar sıcaktı."],
    ["Captain Waddle the penguin salutes. The gate is dripping on his hat.", "Penguen Paytak Kaptan selam veriyor. Kapı şapkasına damlıyor."],
    ["King Gale's gate hangs in the air. Today it only hangs.", "Kral Poyraz'ın kapısı havada asılı durur. Bugün yalnızca asılı."],
    ["Thimble the hedgehog dug the gate out this morning. She will dig it out tomorrow, too.", "Kirpi Yüksük kapıyı bu sabah kumdan çıkardı. Yarın yine çıkaracak."],
    ["Somewhere by the gate is Prism the glasswing. You will see her when the light comes back.", "Kapının oralarda kelebek Camkanat var. Işık dönünce onu görürsün."],
    ["Luna the deer holds a lantern at the gate. Speak softly here.", "Geyik Mehtap kapıda fener tutuyor. Burada alçak sesle konuşulur."],
    ["NIMBUS THE SHEEP IS SHOUTING HELLO. It is the only way to be heard.", "KOYUN PAMUK BAĞIRARAK MERHABA DİYOR. Sesini başka türlü duyuramıyor."],
    ["The last gate has no keeper. But somebody has swept the step.", "Son kapının bekçisi yok. Ama biri eşiği süpürmüş."]
  ];
  const KEEPER = ["fox", "crab", "bear", "penguin", "eagle", "hedgehog", "butterfly", "deer", "sheep", ""];
  // a boss who wins says so; in the storm and on the star stair the birds are friends, and say so too
  const TAUNT = {
    magpie: [["Ha! The charms stay with me!", "Ha! Tılsımlar bende kalıyor!"], ["Shiny and mine. Try again, rabbit.", "Parlak ve benim. Bir daha dene, tavşan."], ["Too slow! Were you counting again?", "Çok yavaş! Yine mi sayıyordun?"]],
    flock: [["Cheep! Cheep! We win! Win!", "Cik! Cik! Biz kazandık! Kazandık!"], ["Cheep-cheep! Try again! Again!", "Cik cik! Yine dene! Yine!"], ["The flock keeps it! Cheep!", "Sürü bunu bırakmıyor! Cik!"]],
    gritt: [["Mordo would have let you win. I won't.", "Mordo kazanmana izin verirdi. Ben vermem."], ["Too slow, bunny.", "Çok yavaş, tavşancık."], ["Back down the mountain!", "Dağdan aşağı, hadi!"]],
    corvin: [["Krr. Go home, little rabbit.", "Krr. Evine dön, küçük tavşan."], ["The wind stays in the sack.", "Rüzgâr çuvalda kalıyor."], ["Try again when the wind turns.", "Rüzgâr dönünce yine dene."]],
    bat: [["Sorry. I still need it.", "Özür dilerim. Hâlâ lazım."], ["Too dark for you, rabbit?", "Sana fazla mı karanlık, tavşan?"], ["Shh. Try again. Quietly.", "Şşş. Yine dene. Sessizce."]],
    friend: [["Again, Pogo! I know you can.", "Bir daha, Pogo! Yapabilirsin."], ["Nearly! Try once more.", "Az kaldı! Bir kez daha dene."], ["I'm still holding on. Help me!", "Hâlâ tutunuyorum. Yardım et!"]]
  };
  const KIND = (c) => SD.bosses[Math.max(0, Math.min(NCH - 1, c))].kind;
  const bossName = (c) => L2(SD.bosses[Math.max(0, Math.min(NCH - 1, c))].name);
  // who is who in a balloon: the five birds (only these five are painted as bosses), the two friends of the line, and one keeper in each kingdom
  const WHO = { pogo: ["Pogo", "Pogo"], crab: ["Barnacle", "Kıskaç"], pip: ["Pip", "Pip"], magpie: ["Mordo", "Mordo"], flock: ["The flock", "Sürü"], gritt: ["Gritt", "Gritt"], corvin: ["Corvin", "Corvin"], bat: ["Nyx", "Nyx"],
    fox: ["Hazel", "Fındık"], bear: ["Brand", "Kor Usta"], penguin: ["Captain Waddle", "Paytak Kaptan"], eagle: ["King Gale", "Kral Poyraz"], hedgehog: ["Thimble", "Yüksük"], butterfly: ["Prism", "Camkanat"], deer: ["Luna", "Mehtap"], sheep: ["Nimbus", "Pamuk"], rabbit: ["Grandma Clover", "Yonca Nine"] };
  // the chest a boss leaves, by who he is in that place (Turkish takes its own suffix after each name)
  const CHEST_OF = { mordo: ["Mordo's chest", "Mordo'nun sandığı"], flock: ["The flock's chest", "Sürünün sandığı"], gritt: ["Gritt's chest", "Gritt'in sandığı"], corvin: ["Corvin's chest", "Corvin'in sandığı"], shadow: ["The shadow's chest", "Gölgenin sandığı"], nyx: ["Nyx's chest", "Nyx'in sandığı"],
    magpie: ["Mordo's chest", "Mordo'nun sandığı"], bat: ["Nyx's chest", "Nyx'in sandığı"] };
  // which side game a boss leaves behind: each kingdom offers two of the four, by turns (mini.js says which kingdom each game comes from)
  const KGAMES = [["nests", "carrots"], ["lilypads", "nests"], ["nests", "carrots"], ["lilypads", "fireflies"], ["nests", "lilypads"], ["carrots", "nests"], ["fireflies", "carrots"], ["fireflies", "lilypads"], ["lilypads", "fireflies"], ["fireflies", "carrots"]];
  const GAME_OF = (c) => KGAMES[kOf(c)][c % 2];
  // the charm that comes home at the end of each place (anim/ch-<name>.webp, each from its own kingdom's painted set; the letter in the bottle ends the sand, a star ends the game)
  const CHARM = ["berry", "pine", "mushroom", "acorn", "lantern", "wave", "goldfish", "drop", "dolphin", "shell", "flame", "chili", "candle", "dragon", "volcano", "snowflake", "mitten", "skate", "penguin", "igloo",
    "cloud", "kite", "pinwheel", "balloon", "plane", "cactus", "amphora", "camel", "pyramid", "bottle", "diamond", "emerald", "cluster", "ring", "heartgem", "cat", "lamp", "owl", "bat", "moon",
    "umbrella", "bolt", "tornado", "thunder", "sun", "rocket", "comet", "saturn", "ufo", "star"];

  // ---------------------------------------------------------------- the pages of one comic, as plain data (no DOM): what stands where and what is said
  // { scene: skin + "|" + lit, mem, l, r, c, say: [[side, who, text]], caps: [[small, text]], beat }
  const SKIN = (c) => KID[kOf(c)];
  function pages(c, which) { const kind = KIND(c), P = place(c), B = BEATS[c] || {}, skin = SKIN(c), out = [], boss = bossName(c);
    const name = (id) => { const k = id.split(":")[0]; return k === kind ? boss : L2(WHO[k]); };
    const talk = (b, lit) => ({ scene: skin + (lit ? "|lit" : "|grey"), l: b.l, r: b.r, say: b.say.map(([side, pair]) => [side, name(side === "l" ? b.l : b.r), L2(pair)]) });
    const extra = (b) => b.mem ? { scene: "mem|" + b.mem, mem: b.mem, caps: b.caps.map((p, n) => [n ? "" : T("A memory"), L2(p)]) } : b.cap ? { scene: skin + "|grey", l: "pogo:look", caps: [["", L2(b.cap)]] } : talk(b);
    if (which === "intro") { out.push({ scene: skin + "|grey", l: "pogo:hello", caps: [[T("Chapter {0}", c + 1) + " · " + P.name, P.title], ["", P.text]] }); for (const b of B.pre || []) out.push(extra(b));
      out.push({ scene: skin + "|grey", l: "pogo:point", r: kind, say: [["r", boss, L2(MEET[c][0])], ["l", "Pogo", L2(MEET[c][1])]] }); return out; }
    out.push({ scene: skin + "|grey", l: "pogo:yay", r: kind, beat: 1, say: [["r", boss, L2(OUT[c])]] }); for (const b of B.post || []) out.push(extra(b));
    out.push({ scene: skin + "|lit", l: "pogo:win", c: "charm:" + (CHARM[c] || "star"), caps: [[T("The end of chapter {0}", c + 1), ending(c)]] }); return out; }
  // the one page of a kingdom's arrival: its gate stands up out of the fold in a land that is still grey, Pogo and the kingdom's keeper beside it
  function gatePages(k) { const R = realm(k), pg = { scene: R.id + "|gate", l: "pogo:hello", caps: [[T("Kingdom {0} of 10", k + 1) + " · " + R.name, R.line], ["", L2(GATE[k])]] }; if (KEEPER[k]) pg.r = KEEPER[k]; return [pg]; }

  // ---------------------------------------------------------------- keyed motions
  const SNAP = "cubic-bezier(.18, .9, .32, 1)", SETTLE = "cubic-bezier(.45, 0, .55, 1)", DROP = "cubic-bezier(.55, 0, .9, .55)", HOLD = "steps(1, end)";
  // the pop-up book: [ms, { a: degrees about the fold, o: opacity }, ease into this key]. A page lying shut on the floor page is at -FLAT; a layer
  // stands at 0 and the back page rests a little past upright. Everything overshoots and comes back the way stiff paper does: the back page first,
  // the layers after it one by one (follow-through), the figures last on their springy tabs.
  const FA = 64, FLAT = -(180 - FA);
  const PB = {
    backOpen: [[0, { a: FLAT }], [110, { a: FLAT - 3 }, SETTLE], [470, { a: 13 }, SNAP], [620, { a: 2 }, SETTLE], [760, { a: 5 }, SETTLE]],
    backClose: [[0, { a: 5 }], [100, { a: 11 }, SETTLE], [390, { a: FLAT - 1 }, DROP], [460, { a: FLAT + 4 }, SNAP], [540, { a: FLAT }, SETTLE]],
    layerUp: [[0, { a: FLAT, o: 0 }], [40, { a: FLAT, o: 1 }, HOLD], [360, { a: 10, o: 1 }, SNAP], [500, { a: -4, o: 1 }, SETTLE], [620, { a: 1.5, o: 1 }, SETTLE], [720, { a: 0, o: 1 }, SETTLE]],
    layerDown: [[0, { a: 0, o: 1 }], [70, { a: 6, o: 1 }, SETTLE], [260, { a: FLAT, o: 1 }, DROP], [280, { a: FLAT, o: 0 }, HOLD]],
    gateUp: [[0, { a: FLAT, o: 0 }], [40, { a: FLAT, o: 1 }, HOLD], [430, { a: 15, o: 1 }, SNAP], [580, { a: -7, o: 1 }, SETTLE], [690, { a: 3, o: 1 }, SETTLE], [790, { a: 0, o: 1 }, SETTLE]],
    tabUp: [[0, { a: FLAT, o: 0 }], [30, { a: FLAT, o: 1 }, HOLD], [240, { a: 17 }, SNAP], [360, { a: -9 }, SETTLE], [470, { a: 5 }, SETTLE], [570, { a: -2 }, SETTLE], [660, { a: 0 }, SETTLE]],
    tabDown: [[0, { a: 0, o: 1 }], [60, { a: 8, o: 1 }, SETTLE], [220, { a: FLAT, o: 1 }, DROP], [240, { a: FLAT, o: 0 }, HOLD]],
    // the standing paper never quite holds still: the near layer breathes on its fold while the page is open
    tremble: [[0, { a: 0 }], [1500, { a: 1.6 }, SETTLE], [3000, { a: 0 }, SETTLE], [4300, { a: -1.1 }, SETTLE], [5600, { a: 0 }, SETTLE]]
  };
  Object.assign(UI_KEYS.waapiKeys, {
    // the shut book put down on the table: a little high and turned, onto the wood, settles
    cmxPanel: [[0, { opacity: 0, transform: "translateY(-34px) rotate(-3deg) scale(.94)" }], [190, { opacity: 1, transform: "translateY(5px) rotate(.8deg) scale(1.015)" }, SNAP], [300, { opacity: 1, transform: "translateY(-2px) rotate(-.2deg) scale(.998)" }, SETTLE], [400, { opacity: 1, transform: "translateY(0) rotate(0deg) scale(1)" }, SETTLE]],
    // a speech balloon: from its tail, a pop past full size and back
    cmxBalloon: [[0, { opacity: 0, transform: "scale(.2)" }], [140, { opacity: 1, transform: "scale(1.12)" }, SNAP], [230, { opacity: 1, transform: "scale(.96)" }, SETTLE], [320, { opacity: 1, transform: "scale(1)" }, SETTLE]],
    cmxBalloonOut: [[0, { opacity: 1, transform: "scale(1)" }], [60, { opacity: 1, transform: "scale(1.06)" }, SETTLE], [150, { opacity: 0, transform: "scale(.5)" }, DROP]],
    // the caption strip slides up from the front edge of the book
    cmxCap: [[0, { opacity: 0, transform: "translateY(22px) rotate(-1.5deg)" }], [200, { opacity: 1, transform: "translateY(-4px) rotate(.5deg)" }, SNAP], [300, { opacity: 1, transform: "translateY(0) rotate(0deg)" }, SETTLE]],
    // the beaten boss: knocked back, a wobble, sinks a little (held there)
    cmxBeat: [[0, { transform: "translate(0, 0) rotate(0deg)" }], [120, { transform: "translate(18px, -10px) rotate(14deg)" }, SNAP], [260, { transform: "translate(10px, 4px) rotate(-6deg)" }, SETTLE], [400, { transform: "translate(12px, 6px) rotate(4deg)" }, SETTLE], [520, { transform: "translate(12px, 8px) rotate(2deg)" }, SETTLE]],
    // the charm come home, on its paper spring: shot up out of the fold, a turn, three bobs each smaller than the last
    cmxCharm: [[0, { opacity: 0, transform: "translateY(60px) scale(.3) rotate(-40deg)" }], [220, { opacity: 1, transform: "translateY(-22px) scale(1.2) rotate(10deg)" }, SNAP], [360, { opacity: 1, transform: "translateY(8px) scale(.94) rotate(-5deg)" }, SETTLE], [480, { opacity: 1, transform: "translateY(-4px) scale(1.03) rotate(2deg)" }, SETTLE], [600, { opacity: 1, transform: "translateY(0) scale(1) rotate(0deg)" }, SETTLE]],
    // the shadow a standing layer throws on the floor page comes with it
    cmxShade: [[0, { opacity: 0, transform: "scaleY(2.4)" }], [360, { opacity: 1, transform: "scaleY(.8)" }, SNAP], [620, { opacity: 1, transform: "scaleY(1)" }, SETTLE]],
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
  // Web Animations keyframes of a fold table for one piece of paper: `pre` puts its fold line in place, the table turns it about that line
  // (the ease into key i is written on key i-1, where WAAPI reads it; a key without o keeps the opacity of the key before)
  function fold(name, pre) { const keys = PB[name], len = keys.at(-1)[0]; let o;
    return { duration: len, frames: keys.map(([t, v], i) => { if (v.o !== undefined) o = v.o; const f = { offset: t / len, transform: `${pre}rotateX(${v.a}deg)` }; if (o !== undefined) f.opacity = o; if (keys[i + 1]) f.easing = keys[i + 1][2]; return f; }) }; }
  const wait = (ms) => new Promise(r => setTimeout(r, ms));
  const sfx = (k, n) => { try { if (SFX && SFX[k]) SFX[k](n); } catch (e) {} };
  const ICON = (k) => { let svg = ""; try { svg = (typeof ICO === "object" && ICO[k]) || (typeof BICON === "object" && BICON[k]) || ""; } catch (e) {} return `<i class="ico">${svg}</i>`; };
  const Q = typeof ART_Q === "string" ? ART_Q : "";


  // ---------------------------------------------------------------- the paper: every scene is cut paper, drawn here. One look per kingdom (forest,
  // water, fire, ice, sky, sand, crystal, night, storm, star), each a back page, a floor page and three standing layers; "grey" is the same scene
  // with the colour gone (the charms are missing), "lit" is the one the charm comes home to, "gate" is the grey land with the kingdom's gate in
  // full colour standing in it (the arrival page). A memory is a shadow theatre: lamp-lit paper, dark shapes.
  const EDGE = "#fffaf0", INK = "#3a2618";
  const mix = (hex, to, k) => { const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16), ch = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k); return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1); };
  const PAL = {
    forest: { sky: ["#cfeec0", "#fdf3c8"], floor: ["#b4dc82", "#84bd5c"], far: "#8cc894", mid: ["#3f9f5a", "#6cb848", "#2f8a66"], near: "#2f7f4a", rock: "#8a6a4a" },
    water: { sky: ["#bfe4f6", "#eaf8fb"], floor: ["#7fc8dc", "#4fa6c8"], far: "#74c3d8", mid: ["#3f9fc6", "#58b6d4", "#3f9fc6"], near: "#2b7fb0", rock: "#8d86b4" },
    fire: { sky: ["#f6a05a", "#ffe0a0"], floor: ["#b5654a", "#7c3f34"], far: "#8a4a44", mid: ["#e2574c", "#f6a03c", "#c9463c"], near: "#5c2f30", rock: "#4a3038" },
    ice: { sky: ["#cfe6f7", "#f8fcff"], floor: ["#dff0f8", "#a8d2e6"], far: "#b5d9ef", mid: ["#8fc6e2", "#a8d6ea", "#8fc6e2"], near: "#6fb0d4", rock: "#ffffff" },
    air: { sky: ["#7cc6f2", "#e4f6ff"], floor: ["#f4fbff", "#cfe6f4"], far: "#c4e4f6", mid: ["#ffffff", "#eef7fc", "#ffffff"], near: "#dcedf8", rock: "#c9a06a" },
    sand: { sky: ["#ffdc9a", "#fff0c8"], floor: ["#f0d08a", "#d8b060"], far: "#ecc880", mid: ["#e0a850", "#d89848", "#e8b860"], near: "#c88838", rock: "#b98858" },
    crystal: { sky: ["#2a1f4e", "#4a3a80"], floor: ["#3a2f66", "#241c48"], far: "#3c3170", mid: ["#7fe0e8", "#e88ad6", "#a898ff"], near: "#1d1638", rock: "#2c2356" },
    night: { sky: ["#1c2050", "#3d4384"], floor: ["#2c3674", "#1d2658"], far: "#262c62", mid: ["#32407e", "#2a5a6c", "#3a3a84"], near: "#222a62", rock: "#191d48" },
    storm: { sky: ["#9fcbe6", "#f0f6f2"], floor: ["#9cc08c", "#6f9a70"], far: "#7f8fa8", mid: ["#8fb486", "#7fa0b0", "#8fb486"], near: "#3f7a58", rock: "#6a6884" },
    star: { sky: ["#141238", "#3a2a78"], floor: ["#2a2466", "#18143f"], far: "#2f2a6c", mid: ["#4a3f98", "#3a3080", "#5a4aa8"], near: "#1c1848", rock: "#f3d98a" },
    mem: { sky: ["#f6d58a", "#c88a48"], floor: ["#b98248", "#7c5028"], far: "#6a4426", mid: ["#4a2e1a", "#4a2e1a", "#4a2e1a"], near: "#2e1c10", rock: "#3a2618" }
  };
  // the colour of a kingdom's gate, of its book cover and of the table the book lies on
  const ACCENT = { forest: "#3f9f5a", water: "#3f9fc6", fire: "#e2574c", ice: "#6fb0d4", air: "#58a8e0", sand: "#d89848", crystal: "#9a8af0", night: "#4a52a0", storm: "#5f6f8c", star: "#e0b030" };
  const DARK = { crystal: 1, night: 1, star: 1 };
  const greyOf = (skin) => (h) => mix(h, DARK[skin] ? "#4a4c60" : "#bdbcb6", .62);
  function palette(skin, lit) { const p = PAL[skin] || PAL.forest; if (lit || skin === "mem") return p; const g = greyOf(skin);
    return { sky: DARK[skin] ? p.sky.map(h => mix(h, "#2a2c3a", .5)) : skin === "storm" ? ["#6f7c8c", "#aab2ba"] : p.sky.map(h => mix(h, "#c9c8c2", .4)), floor: p.floor.map(g), far: g(p.far), mid: p.mid.map(g), near: g(p.near), rock: g(p.rock) }; }
  // shapes (a 400-wide page; y grows down, a layer's fold is its bottom edge). A cut edge shows the paper's cream core.
  const cut = (d, fill, sw) => `<path d="${d}" fill="${fill}" stroke="${EDGE}" stroke-width="${sw || 4}" stroke-linejoin="round" paint-order="stroke"/>`;
  const line = (d, col, w, tf) => `<g fill="none" stroke-linecap="round" stroke-linejoin="round"${tf ? ` transform="${tf}"` : ""}><path d="${d}" stroke="${EDGE}" stroke-width="${w + 7}"/><path d="${d}" stroke="${col}" stroke-width="${w}"/></g>`;
  const at = (x, y, s, body) => `<g transform="translate(${x},${y}) scale(${s})">${body}</g>`;
  const waves = (y, amp, n, fill, H) => cut(`M-12,${y}` + ` q${212 / n},${-amp} ${424 / n},0`.repeat(n) + ` V${H + 8} H-12 Z`, fill);
  const RIDGE = ["M-12,200 V78 C24,44 58,34 96,62 C122,22 172,12 208,56 C244,28 292,36 322,68 C352,42 392,46 412,62 V200 Z", "M-12,200 V60 C30,84 60,40 104,50 C150,60 160,96 204,84 C250,70 262,30 310,40 C350,48 380,76 412,58 V200 Z"];
  const reed = (x, y, h, col) => line(`M0,0 q-18,${-h / 4} 0,${-h / 2} t0,${-h / 2}`, col, 9, `translate(${x},${y})`);
  const rock = (x, y, w, h, col) => cut(`M${x},${y} q${w * .08},${-h} ${w * .42},${-h * .96} q${w * .42},${-h * .1} ${w * .58},${h * .96} z`, col);
  const berg = (x, y, w, h, col, sh) => cut(`M${x},${y} l${w * .22},${-h} l${w * .16},${h * .3} l${w * .2},${-h * .52} l${w * .42},${h * 1.22} z`, col) + `<path d="M${x + w * .22},${y - h} l${w * .16},${h * .3} l${-w * .06},${h * .7} l${-w * .2},0 z" fill="${sh}"/>`;
  const crag = (x, y, w, h, col) => cut(`M${x},${y} l${w * .12},${-h * .7} l${w * .14},${h * .16} l${w * .16},${-h * .46} l${w * .2},${h * .34} l${w * .14},${-h * .2} l${w * .24},${h * .86} z`, col);
  const dots = (pts, r, col, a) => pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${r + (i % 3) * .7}" fill="${col}" opacity="${a || 1}"/>`).join("");
  const tree = (x, y, s, col, trunk) => at(x, y, s, line("M0,0 V-36", trunk, 8) + cut("M-30,-36 q-12,-24 10,-32 q6,-22 30,-14 q24,-6 26,16 q14,16 -6,28 q-10,14 -30,6 q-22,8 -30,-4 z", col));
  const pine = (x, y, w, h, col) => cut(`M${x},${y} l${w / 2},${-h} l${w / 2},${h} z`, col);
  const bush = (x, y, w, h, col) => cut(`M${x},${y} v${-h * .5} q${w * .16},${-h * .7} ${w * .36},${-h * .2} q${w * .16},${-h * .5} ${w * .34},0 q${w * .2},${-h * .2} ${w * .3},${h * .2} v${h * .5} z`, col);
  const mush = (x, y, col) => cut(`M${x - 4},${y} v-14 h8 v14 z`, EDGE, 2) + cut(`M${x - 15},${y - 12} q15,-22 30,0 z`, col, 3);
  const flame = (x, y, s, col) => at(x, y, s, cut("M0,0 q-18,-8 -10,-30 q4,8 8,6 q-4,-18 8,-32 q2,14 12,22 q12,14 -2,34 z", col, 3));
  const cloud = (x, y, s, col) => at(x, y, s, cut("M-46,0 q-14,-20 10,-24 q6,-20 28,-12 q16,-14 30,2 q24,2 20,22 q-2,12 -16,12 z", col, 3));
  const dune = (y, H, col) => cut(`M-12,${H + 8} V${y} q80,-36 170,-6 q70,22 130,-14 q60,-30 124,4 V${H + 8} Z`, col);
  const shard = (x, y, w, h, col, tilt) => `<g transform="rotate(${tilt || 0} ${x} ${y})">${cut(`M${x - w / 2},${y} v${-h * .6} l${w / 2},${-h * .4} l${w / 2},${h * .4} v${h * .6} z`, col, 3)}<path d="M${x},${y - h} l${w / 2},${h * .4} v${h * .6} h${-w / 2} z" fill="#1d1638" opacity=".22"/></g>`;
  const house = (x, y, w, h, wall, roof, win) => cut(`M${x},${y} v${-h} h${w} v${h} z`, wall, 3) + cut(`M${x - 6},${y - h} l${w / 2 + 6},${-h * .6} l${w / 2 + 6},${h * .6} z`, roof, 3) + `<rect x="${x + w * .34}" y="${y - h * .7}" width="${w * .32}" height="${h * .36}" fill="${win}"/>`;
  const umbrella = (x, y, s, col) => at(x, y, s, `<path d="M0,-2 V26" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>` + cut("M-26,0 q0,-28 26,-28 q26,0 26,28 q-9,-8 -17,0 q-9,-8 -18,0 q-9,-8 -17,0 z", col, 3));
  const palm = (x, y, s, trunk, leaf) => at(x, y, s, line("M0,0 q10,-34 -2,-66", trunk, 8) + line("M-2,-66 q-26,-12 -40,6 M-2,-66 q-18,-26 -40,-22 M-2,-66 q4,-26 30,-28 M-2,-66 q28,-10 40,10", leaf, 7));
  const star5 = (x, y, r, col) => { let d = ""; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * .45 : r; d += (i ? "L" : "M") + (x + Math.cos(a) * q).toFixed(1) + "," + (y + Math.sin(a) * q).toFixed(1); } return cut(d + "Z", col, 3); };
  // silhouettes for the shadow theatre: a small bird (the beak points right), a bat, a fish, an old rabbit
  const bird = (x, y, s, col, flip) => `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})" fill="${col}"><ellipse cx="0" cy="-13" rx="15" ry="12"/><circle cx="12" cy="-27" r="8.5"/><path d="M19,-29 l13,3.5 l-13,3 z M-12,-16 l-17,10 l15,2 z M-4,-2 v6 M5,-2 v6" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/></g>`;
  const vee = (x, y, s, col) => `<path d="M${x - 9 * s},${y - 4 * s} q${5 * s},${-3 * s} ${9 * s},${4 * s} q${4 * s},${-7 * s} ${9 * s},${-4 * s}" fill="none" stroke="${col}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`;
  const batS = (x, y, s, col) => `<g transform="translate(${x},${y}) scale(${s})" fill="${col}"><ellipse cx="0" cy="12" rx="7" ry="13"/><path d="M-5,24 l-2,9 l5,-5 l2,6 l2,-6 l5,5 l-2,-9 z"/><path d="M-6,4 q-22,-8 -36,10 q8,-2 12,4 q6,-5 11,1 q5,-5 12,0 z M6,4 q22,-8 36,10 q-8,-2 -12,4 q-6,-5 -11,1 q-5,-5 -12,0 z"/></g>`;
  const fish = (x, y, s, col) => `<path transform="translate(${x},${y}) scale(${s})" d="M-14,0 q14,-12 28,0 l10,-7 v14 l-10,-7 q-14,12 -28,0 z" fill="${col}"/>`;
  const bunny = (x, y, s, col) => `<g transform="translate(${x},${y}) scale(${s})" fill="${col}"><ellipse cx="0" cy="-16" rx="15" ry="17"/><circle cx="6" cy="-40" r="10"/><path d="M2,-46 q-8,-26 0,-30 q6,6 6,30 z M10,-46 q2,-26 10,-26 q4,8 -4,28 z"/><circle cx="-15" cy="-8" r="5"/></g>`;
  const svg = (h, body) => `<svg viewBox="0 0 400 ${h}" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`;
  // the emblem over each kingdom's gate (drawn about 0,0, some thirteen units out)
  const EMBLEM = { forest: "M0,-13 Q13,-4 0,13 Q-13,-4 0,-13 Z", water: "M0,-14 Q12,2 0,12 Q-12,2 0,-14 Z", fire: "M0,-14 Q11,-2 7,7 Q4,13 0,13 Q-9,10 -7,1 Q-5,-5 0,-14 Z", ice: "M-2,-13 h4 v9 l8,-5 l2,4 l-8,5 l8,5 l-2,4 l-8,-5 v9 h-4 v-9 l-8,5 l-2,-4 l8,-5 l-8,-5 l2,-4 l8,5 z",
    air: "M-13,6 q-4,-12 8,-12 q4,-9 13,-3 q9,1 6,10 q-1,5 -7,5 z", sand: "M0,-7 a7,7 0 1 0 .1,0 z M-1.5,-14 h3 v5 h-3 z M-1.5,9 h3 v5 h-3 z M-14,-1.5 h5 v3 h-5 z M9,-1.5 h5 v3 h-5 z", crystal: "M0,-14 L9,-2 L0,14 L-9,-2 Z",
    night: "M4,-13 A13,13 0 1 0 4,13 A10,10 0 1 1 4,-13 Z", storm: "M3,-14 L-8,2 H0 L-3,14 L9,-3 H1 Z", star: "M0,-14 L3.5,-4.5 L13.5,-4.5 L5.5,1.5 L8.5,11.5 L0,5.5 L-8.5,11.5 L-5.5,1.5 L-13.5,-4.5 L-3.5,-4.5 Z" };
  const GH = 200;
  function gateSvg(skin) { const A = ACCENT[skin] || ACCENT.forest, k = Math.max(0, KID.indexOf(skin)), nm = realm(k).name.replace(/[<&]/g, "");
    return svg(GH, cut(`M88,${GH} V88 Q88,22 200,22 Q312,22 312,88 V${GH} H274 V94 Q274,58 200,58 Q126,58 126,94 V${GH} Z`, A, 5) + `<path d="M107,${GH} V90 Q107,40 200,40 Q293,40 293,90 V${GH}" fill="none" stroke="${mix(A, "#ffffff", .45)}" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>`
      + `<circle cx="200" cy="32" r="25" fill="${EDGE}" stroke="${INK}" stroke-width="3"/><path transform="translate(200,32) scale(1.25)" d="${EMBLEM[skin] || EMBLEM.star}" fill="${A}" fill-rule="evenodd"/>`
      + `<path d="M76,68 h248 l-11,16 l11,16 h-248 l11,-16 z" fill="${EDGE}" stroke="${INK}" stroke-width="2.5" stroke-linejoin="round"/><text x="200" y="90" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="${nm.length > 15 ? 16 : 18}" fill="${INK}">${nm}</text>`); }
  // one scene: { back: svg, floor: [c0, c1], layers: [{ d: share of the floor from the fold, h: height in page units, svg, k: its own fold table }] }
  const FAR = 176, MID = 132, NEAR = 84;
  function scene(key) { const [skin, arg] = key.split("|"), lit = arg === "lit", p = palette(skin, lit), g0 = greyOf(skin), tone = (h) => lit ? h : g0(h), glow = lit ? dots([[52, 40], [118, 22], [190, 52], [262, 26], [338, 44], [300, 70], [86, 76]], 3, "#fff3b8", .9) : "";
    const back = (extra) => svg(320, `<defs><linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs><rect width="400" height="320" fill="url(#pbg)"/>${extra || ""}`);
    const rays = lit ? `<path d="M200,236 L60,-10 H120 Z M200,236 L172,-10 H228 Z M200,236 L280,-10 H340 Z M200,236 L-20,80 V140 Z M200,236 L420,80 V140 Z" fill="#fff6c4" opacity="${DARK[skin] ? .16 : .4}"/>` : "";
    if (skin === "mem") { const lamp = `<circle cx="200" cy="150" r="118" fill="#fff3c9" opacity=".75"/><circle cx="200" cy="150" r="78" fill="#fff9e2" opacity=".8"/>`, D = p.mid[0], N = p.near;
      if (arg === "magpie") return { back: back(lamp + `<circle cx="286" cy="88" r="15" fill="#fff9e2"/><circle cx="286" cy="88" r="15" fill="none" stroke="${p.far}" stroke-width="5"/>`), floor: p.floor, layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V30 Q60,10 96,${FAR} Z M412,${FAR} V8 Q330,0 300,${FAR} Z" fill="${p.far}"/>` + [118, 160, 202, 244, 286].map(x => `<path d="M${x},${FAR} q-8,-96 22,-150" fill="none" stroke="${p.far}" stroke-width="9" stroke-linecap="round"/>`).join("")) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M128,${MID} q0,-36 72,-36 q72,0 72,36 z" fill="${D}"/>` + bird(204, MID - 30, 1.1, D) + `<path d="M-12,${MID} V96 q40,-14 70,36 z M412,${MID} V88 q-50,-10 -80,44 z" fill="${D}"/>`) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V40 q60,-30 110,44 z M412,${NEAR} V30 q-70,-20 -120,54 z" fill="${N}"/>`) }] };
      if (arg === "flock") return { back: back(lamp), floor: p.floor, layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V110 q70,-50 130,-6 q60,-60 140,-10 q60,-30 154,10 V${FAR} Z" fill="${p.far}"/>`) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M-12,${MID - 44} Q200,${MID - 14} 412,${MID - 44}" fill="none" stroke="${D}" stroke-width="3.5"/><path d="M36,${MID} V${MID - 70} M364,${MID} V${MID - 70}" stroke="${D}" stroke-width="8" stroke-linecap="round"/>`
          + [[70, 37], [108, 32], [146, 28], [184, 26], [222, 26]].map(([x, dy]) => bird(x, MID - dy, .62, D)).join("") + bird(312, MID - 30, 1.15, D, true)) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V44 q50,-26 96,40 z M412,${NEAR} V38 q-60,-22 -110,46 z" fill="${N}"/>`) }] };
      if (arg === "gritt") return { back: back(lamp + fish(96, 96, 1.5, p.far)), floor: p.floor, layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V70 L60,40 L120,96 L170,${FAR} Z M412,${FAR} V52 L350,30 L300,110 L270,${FAR} Z" fill="${p.far}"/>`) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M40,${MID} q10,-34 160,-34 q150,0 160,34 z" fill="${D}"/>` + [[92, 1.25], [146, 1.15], [196, 1.05], [242, .95], [300, .62]].map(([x, s]) => bird(x, MID - 30, s, D, x < 280)).join("")) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V44 L40,20 L100,${NEAR} Z M412,${NEAR} V36 L360,14 L310,${NEAR} Z" fill="${N}"/>`) }] };
      if (arg === "corvin") return { back: back(lamp + [[84, 70, 1], [112, 56, .9], [142, 48, .8], [60, 92, .8], [168, 44, .65], [190, 44, .5]].map(([x, y, s]) => vee(x, y, s, p.far)).join("")), floor: p.floor, layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V120 l50,-40 l40,50 l40,-30 l40,${FAR - 100} Z" fill="${p.far}"/>`) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M228,${MID} l34,-104 l14,22 l12,-34 l44,116 z" fill="${D}"/>` + bird(286, 16, .9, D, true)) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V50` + ` q26,-18 52,0`.repeat(8) + ` V${NEAR} Z" fill="${N}"/>`) }] };
      if (arg === "lamp") return { back: back(`<rect width="400" height="320" fill="#241a3a" opacity=".8"/><circle cx="200" cy="60" r="64" fill="#fff3c9" opacity=".5"/><circle cx="200" cy="60" r="26" fill="#fff9e2"/>` + dots([[60, 60], [104, 120], [320, 50], [346, 130], [290, 96], [80, 170], [330, 190]], 2.4, "#fff3b8")), floor: ["#3a2c50", "#221a34"], layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V130 q110,-40 212,-10 q110,-36 212,6 V${FAR} Z" fill="#1b1430"/>`) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M176,${MID} L190,-12 M224,${MID} L210,-12 M179,108 H221 M182,82 H218 M184,56 H216 M186,30 H214 M188,6 H212" fill="none" stroke="#140e24" stroke-width="5" stroke-linecap="round"/>` + bunny(196, 76, .7, "#140e24")) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V30 q70,-26 130,54 z M412,${NEAR} V44 q-60,-20 -100,40 z" fill="#0d0918"/>`) }] };
      return { back: back(`<rect width="400" height="320" fill="#241a3a" opacity=".86"/><circle cx="262" cy="96" r="50" fill="#39407c"/>` + dots([[240, 74], [270, 64], [286, 96], [250, 108], [272, 124], [234, 96]], 2.4, "#fff3b8") + `<path d="M296,60 l-70,84" stroke="#fff3b8" stroke-width="3.5" stroke-linecap="round"/><circle cx="226" cy="144" r="5" fill="#fff9e2"/>`), floor: ["#3a2c50", "#221a34"], layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V-8 H150 Q110,60 150,${FAR} Z M412,${FAR} V-8 H356 Q396,70 350,${FAR} Z" fill="#1b1430"/>`) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M-12,${MID} V-6 H96 Q60,50 110,${MID} Z" fill="#140e24"/>` + batS(150, 4, 1.25, "#140e24") + `<path d="M150,-6 v12" stroke="#140e24" stroke-width="3"/>`) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V30 q70,-26 130,54 z M412,${NEAR} V44 q-60,-20 -100,40 z" fill="#0d0918"/>`) }] }; }
    const sun = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff3b8" opacity="${lit ? 1 : .5}"/>`;
    let sky = "", far = "", mid = "", near = "";
    if (skin === "forest") { sky = sun(320, 64, 28);
      far = cut(RIDGE[0], p.far) + pine(20, FAR, 46, 112, p.mid[2]) + pine(78, FAR, 36, 84, p.mid[0]) + pine(312, FAR, 50, 122, p.mid[2]) + pine(360, FAR, 36, 90, p.mid[0]);
      mid = tree(68, MID, 1.25, p.mid[0], p.rock) + tree(204, MID, 1, p.mid[1], p.rock) + tree(336, MID, 1.4, p.mid[2], p.rock);
      near = bush(-14, NEAR, 120, 44, p.near) + bush(296, NEAR, 120, 50, p.near) + mush(150, NEAR, tone("#e2574c")) + mush(182, NEAR, tone("#f6b25e")) + mush(262, NEAR, tone("#e2574c")); }
    else if (skin === "water") { sky = cloud(96, 76, .8, "#ffffff") + cloud(300, 54, .6, "#ffffff");
      far = rock(-40, FAR + 4, 190, 160, p.rock) + rock(250, FAR + 4, 190, 140, p.rock) + cut(`M150,${FAR} V34 q50,-16 100,0 V${FAR} z`, tone("#e4f6fb"), 3) + `<path d="M172,46 V${FAR} M200,40 V${FAR} M228,46 V${FAR}" stroke="${p.far}" stroke-width="3" stroke-dasharray="${lit ? "14 10" : "200 0"}" opacity=".8"/>` + waves(FAR - 24, 12, 7, p.far, FAR);
      mid = waves(MID - 44, 18, 6, p.mid[0], MID) + [[70, MID - 24], [170, MID - 14], [262, MID - 26], [344, MID - 12]].map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="24" ry="8" fill="${tone("#5fb348")}" stroke="${EDGE}" stroke-width="3"/>` + (lit && i % 2 === 0 ? `<circle cx="${x + 4}" cy="${y - 6}" r="7" fill="#f6a0c0" stroke="${EDGE}" stroke-width="2"/>` : "")).join("");
      near = reed(26, NEAR, 78, tone("#3f9f5a")) + reed(58, NEAR, 52, tone("#3f9f5a")) + reed(350, NEAR, 70, tone("#3f9f5a")) + reed(380, NEAR, 46, tone("#3f9f5a")) + waves(NEAR - 34, 18, 5, p.near, NEAR); }
    else if (skin === "fire") { sky = lit ? `<circle cx="200" cy="170" r="120" fill="#ffe680" opacity=".45"/>` : cloud(200, 60, .9, "#b9b8b4") + cloud(236, 34, .6, "#c6c5c0");
      far = cut(`M30,${FAR} L150,46 q50,-18 100,0 L370,${FAR} Z`, p.far) + (lit ? cut("M150,46 q50,-18 100,0 q-8,26 -26,32 q-6,44 -26,70 q-6,-56 -24,-66 q-16,-10 -24,-36 z", "#f6a03c", 3) : `<path d="M158,48 q42,-13 84,0 q-42,13 -84,0 z" fill="${p.rock}"/>`);
      mid = crag(-14, MID, 150, 100, p.rock) + crag(268, MID, 156, 84, p.rock) + flame(126, MID, lit ? 1.35 : .8, p.mid[1]) + flame(200, MID, lit ? 1.05 : .6, p.mid[0]) + flame(262, MID, lit ? 1.25 : .7, p.mid[1]);
      near = rock(0, NEAR + 3, 116, 46, p.near) + rock(288, NEAR + 3, 124, 52, p.near) + `<ellipse cx="200" cy="${NEAR - 8}" rx="74" ry="12" fill="${p.mid[1]}" stroke="${EDGE}" stroke-width="3"/>`; }
    else if (skin === "ice") { sky = `<path d="M-10,70 q100,-60 210,-10 q110,46 210,-30 v60 q-100,70 -210,24 q-110,-46 -210,16 z" fill="${lit ? "#a8f0c8" : "#dfe7ea"}" opacity=".7"/>`;
      far = berg(10, FAR - 6, 170, 132, p.rock, p.far) + berg(220, FAR - 6, 190, 98, p.rock, p.far) + cut(`M-12,${FAR + 8} V${FAR - 22} q100,-20 212,0 t212,0 V${FAR + 8} Z`, p.far);
      mid = cut(`M-12,${MID + 8} V${MID - 18} q100,-16 212,0 t212,0 V${MID + 8} Z`, p.mid[0]) + cut(`M228,${MID} q0,-62 62,-62 q62,0 62,62 z`, p.rock) + `<path d="M278,${MID} v-22 q12,-14 24,0 v22 z" fill="${p.near}"/>`
        + `<circle cx="92" cy="${MID - 20}" r="${lit ? 21 : 16}" fill="${p.rock}" stroke="${EDGE}" stroke-width="3"/><circle cx="92" cy="${MID - (lit ? 54 : 44)}" r="${lit ? 15 : 11}" fill="${p.rock}" stroke="${EDGE}" stroke-width="3"/><path d="M92,${MID - (lit ? 54 : 44)} l16,3 l-16,3 z" fill="${tone("#f6a03c")}"/>`;
      near = waves(NEAR - 30, 14, 5, p.near, NEAR) + cut(`M30,${NEAR - 34} l70,-10 l50,12 l-20,14 l-84,2 z`, p.rock, 3) + cut(`M250,${NEAR - 26} l60,-12 l56,10 l-16,16 l-84,2 z`, p.rock, 3); }
    else if (skin === "air") { sky = sun(84, 66, 26) + cloud(250, 60, .7, "#ffffff") + cloud(360, 110, .5, "#ffffff");
      far = cut("M112,104 h176 q-28,54 -88,62 q-60,-8 -88,-62 z", p.rock) + cut("M104,106 q96,-28 192,0 q-96,14 -192,0 z", tone("#7cc66a"), 3) + cut("M186,100 l6,-52 h16 l6,52 z", tone("#fbf3e2"), 3)
        + `<g transform="rotate(${lit ? 24 : 0} 200 50)" stroke="${EDGE}" stroke-width="2" fill="${tone("#e2574c")}"><path d="M200,50 l-6,-40 h12 z M200,50 l40,-6 v12 z M200,50 l6,40 h-12 z M200,50 l-40,6 v-12 z"/></g>` + cloud(50, FAR + 2, 1.1, p.far) + cloud(350, FAR + 4, 1.2, p.far);
      mid = cloud(74, MID + 2, 1.3, p.mid[0]) + cloud(214, MID + 6, 1.1, p.mid[1]) + cloud(346, MID, 1.3, p.mid[0]) + (lit ? [[150, 26, "#e2574c"], [292, 44, "#f6b25e"]].map(([x, y, c]) => `<path d="M${x},${y + 22} q-12,30 4,${MID - y - 56}" stroke="${INK}" stroke-width="1.5" fill="none"/>` + cut(`M${x},${y - 18} l13,18 l-13,22 l-13,-22 z`, c, 3)).join("") : cut(`M160,${MID - 30} l22,8 l-22,10 l-26,-10 z`, tone("#e2574c"), 3));
      near = cloud(36, NEAR + 2, 1.2, p.near) + cloud(168, NEAR + 6, 1, p.mid[0]) + cloud(300, NEAR + 2, 1.3, p.near) + cloud(392, NEAR + 8, .9, p.mid[0]); }
    else if (skin === "sand") { sky = sun(300, 84, 40);
      far = cut(`M30,${FAR} l76,-116 l76,116 z`, p.rock) + `<path d="M106,${FAR - 116} l76,116 h-50 z" fill="${INK}" opacity=".12"/>` + cut(`M160,${FAR} l52,-78 l52,78 z`, p.rock) + dune(FAR - 30, FAR, p.far);
      mid = dune(MID - 36, MID, p.mid[0]) + palm(322, MID - 26, 1, p.rock, tone("#4f9a5a")) + cut(`M84,${MID - 22} h44 v-22 h-44 z`, tone("#b9a488"), 3) + `<ellipse cx="106" cy="${MID - 44}" rx="22" ry="6" fill="${lit ? "#58b6d4" : p.mid[2]}" stroke="${EDGE}" stroke-width="3"/>` + line(`M84,${MID - 44} V${MID - 74} H128 V${MID - 44}`, p.rock, 4);
      near = dune(NEAR - 30, NEAR, p.near) + line("M0,0 V-44 M0,-18 h-13 v-12 M0,-26 h13 v-10", tone("#4f9a5a"), 8, `translate(64,${NEAR - 8})`); }
    else if (skin === "crystal") { sky = lit ? `<circle cx="200" cy="180" r="130" fill="#b9a8ff" opacity=".3"/>` + dots([[40, 30], [150, 44], [330, 34], [372, 84], [60, 110]], 2.2, "#d8f8ff") : "";
      far = shard(56, FAR, 62, 150, p.far, -8) + shard(126, FAR, 44, 100, p.rock, 6) + shard(344, FAR, 66, 160, p.far, 8) + shard(280, FAR, 42, 110, p.rock, -6) + shard(200, FAR, 74, 156, p.mid[2]);
      mid = shard(38, MID, 34, 92, p.mid[0], -12) + shard(84, MID, 28, 64, p.mid[1], 8) + shard(322, MID, 36, 100, p.mid[1], 10) + shard(368, MID, 28, 70, p.mid[0], -8) + shard(150, MID, 22, 44, p.mid[2], -6) + shard(252, MID, 22, 50, p.mid[0], 6);
      near = cut(`M-12,${NEAR} V${NEAR - 46} l30,-22 l22,40 l26,-28 l32,56 z`, p.near) + cut(`M412,${NEAR} V${NEAR - 52} l-34,-20 l-20,44 l-28,-24 l-30,52 z`, p.near) + (lit ? dots([[120, NEAR - 20], [200, NEAR - 34], [286, NEAR - 18]], 3, "#d8f8ff", .9) : ""); }
    else if (skin === "night") { sky = (lit ? `<circle cx="300" cy="76" r="44" fill="#fff9e2" opacity=".25"/><circle cx="300" cy="76" r="30" fill="#fff9e2"/>` + dots([[40, 30], [150, 44], [210, 20], [96, 96], [372, 150], [180, 96]], 2.2, "#fff3b8") : `<circle cx="300" cy="76" r="30" fill="none" stroke="#8a8fb0" stroke-width="3" stroke-dasharray="5 9"/>`);
      const win = lit ? "#ffe680" : "#565a78";
      far = cut(RIDGE[1], p.far) + house(60, FAR, 46, 40, p.mid[2], p.rock, win) + house(132, FAR, 36, 32, p.mid[0], p.rock, win) + house(292, FAR, 50, 44, p.mid[2], p.rock, win);
      mid = tree(58, MID, 1.2, p.mid[0], p.rock) + tree(344, MID, 1.35, p.mid[1], p.rock) + `<ellipse cx="204" cy="${MID - 10}" rx="74" ry="11" fill="${lit ? "#5a78c8" : p.mid[2]}" stroke="${EDGE}" stroke-width="3"/>` + (lit ? `<circle cx="204" cy="${MID - 10}" r="7" fill="#fff9e2"/>` : "");
      near = bush(-14, NEAR, 120, 44, p.near) + bush(296, NEAR, 120, 50, p.near) + (lit ? dots([[140, NEAR - 30], [200, NEAR - 44], [262, NEAR - 26], [60, NEAR - 60], [344, NEAR - 66]], 2.6, "#e8ffb0", .95) : ""); }
    else if (skin === "storm") { sky = lit ? `<g fill="none" stroke-width="11"><path d="M30,250 A170,170 0 0 1 370,250" stroke="#f08a7a"/><path d="M41,250 A159,159 0 0 1 359,250" stroke="#f6d25e"/><path d="M52,250 A148,148 0 0 1 348,250" stroke="#7cc66a"/><path d="M63,250 A137,137 0 0 1 337,250" stroke="#58a8e0"/></g>` + cloud(70, 70, .8, "#ffffff") + cloud(340, 56, .7, "#ffffff")
        : cut("M-20,90 q20,-50 80,-36 q30,-40 90,-16 q50,-30 100,6 q60,-20 90,26 q50,0 70,40 H-20 Z", "#59606e", 3) + cut("M250,96 l-26,58 h20 l-14,50 l46,-70 h-22 l18,-38 z", "#ffe680", 3) + `<path d="M40,140 l-10,30 M96,150 l-10,30 M150,136 l-10,30 M320,150 l-10,30 M366,138 l-10,30 M70,200 l-10,30 M190,196 l-10,30 M300,210 l-10,30" stroke="#e6eef2" stroke-width="3" stroke-linecap="round" opacity=".6"/>`;
      far = crag(-14, FAR, 170, 124, p.far) + cut(`M272,${FAR} V62 h56 V${FAR} z`, p.rock) + cut("M262,62 l38,-38 l38,38 z", tone("#c9463c"), 3) + `<path d="M286,108 v-20 q14,-14 28,0 v20 z" fill="${p.sky[1]}"/><circle cx="300" cy="98" r="7" fill="${tone("#f3c94a")}"/>` + cut(`M-12,${FAR + 8} V${FAR - 20} q100,-28 212,-4 t212,0 V${FAR + 8} Z`, p.mid[0]);
      mid = house(40, MID, 52, 40, tone("#fbf3e2"), tone("#b0705a"), p.far) + house(118, MID, 40, 32, tone("#f3e6c0"), tone("#8d86b4"), p.far) + umbrella(236, MID - 26, 1.2, tone("#e2574c")) + umbrella(300, MID - 22, 1, tone("#f6b25e")) + umbrella(356, MID - 28, 1.15, tone("#58a8e0"));
      near = cut(`M-12,${NEAR} V${NEAR - 22}` + ` l${lit ? 13 : 19},-18 l${lit ? 13 : 7},18`.repeat(17) + ` V${NEAR} Z`, p.near); }
    else { sky = lit ? dots([[40, 30], [96, 70], [150, 34], [262, 28], [330, 40], [372, 90], [300, 96], [60, 130], [356, 160], [120, 150], [236, 120]], 2.6, "#fff3b8") + star5(200, 66, 30, "#fff3b8") : dots([[96, 70], [262, 28], [330, 40], [60, 130]], 2, "#6a6c88");
      const lampC = lit ? "#ffe680" : "#6a6c88";
      far = cut(`M-12,${FAR} V${FAR - 28} h62 v-24 h58 v-24 h58 v-24 h58 v-24 h58 v-24 h120 V${FAR} Z`, p.far) + [[80, 52], [138, 76], [196, 100], [254, 124], [312, 148]].map(([x, dy]) => `<path d="M${x},${FAR - dy} v-16" stroke="${p.mid[2]}" stroke-width="3"/><circle cx="${x}" cy="${FAR - dy - 21}" r="6" fill="${lampC}" stroke="${EDGE}" stroke-width="2"/>`).join("")
        + cut(`M340,${FAR - 148} h40 v-22 h-40 z`, p.mid[2], 3) + `<circle cx="360" cy="${FAR - 159}" r="${lit ? 8 : 6}" fill="${lampC}"/>`;
      mid = cloud(66, MID + 4, 1.3, p.mid[0]) + cloud(226, MID + 8, 1.1, p.mid[1]) + cloud(358, MID + 4, 1.2, p.mid[2]);
      near = cut(`M-12,${NEAR} V${NEAR - 16} q100,-18 212,-2 t212,0 V${NEAR} Z`, p.near) + [[30, 40], [72, 58], [118, 36], [284, 44], [330, 60], [374, 38]].map(([x, h]) => `<path d="M${x},${NEAR - 12} V${NEAR - h}" stroke="${p.mid[2]}" stroke-width="3" stroke-linecap="round"/><circle cx="${x}" cy="${NEAR - h - 8}" r="9" fill="${lit ? "#fff9e2" : "#8a8ca8"}" opacity=".9"/>`).join(""); }
    const layers = [{ d: .16, h: FAR, svg: svg(FAR, far + glow) }, { d: .42, h: MID, svg: svg(MID, mid) }, { d: .72, h: NEAR, svg: svg(NEAR, near) }];
    if (arg === "gate") layers.splice(1, 0, { d: .3, h: GH, k: "gateUp", svg: gateSvg(skin) });
    return { back: back(sky + rays), floor: p.floor, layers }; }

  // ---------------------------------------------------------------- the look: a book on a table, cut paper, a hand-drawn ink line, a handwriting face for the balloons
  const css = document.createElement("style"); css.textContent = `
  #cmx, #chx { position: fixed; inset: 0; z-index: 90; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
    background: radial-gradient(ellipse at 50% 40%, rgba(70, 48, 30, .93), rgba(30, 20, 12, .97)); touch-action: manipulation; user-select: none; -webkit-user-select: none; animation: fade .25s both; overflow: hidden; }
  #cmx { background: radial-gradient(ellipse at 50% 46%, var(--tb, #26505c), #0e141c); gap: 10px; }
  #cmx .cm-top { width: var(--pw); display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #f6efe0; font-weight: 900; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; opacity: .9; }
  #cmx .cm-skip, #chx .cx-x { border: 0; background: rgba(246, 239, 224, .16); color: #f6efe0; font: inherit; font-weight: 800; padding: 6px 14px; border-radius: 99px; cursor: pointer; text-transform: none; letter-spacing: 0; }
  #cmx .pb { position: relative; width: var(--pw); height: var(--ph); perspective: 1400px; perspective-origin: 50% 38%; }
  #cmx .pb-book { position: absolute; inset: 0; transform-style: preserve-3d; transform: translateZ(-140px); }
  #cmx .pb-back, #cmx .pb-floor, #cmx .pb-l, #cmx .pb-a { position: absolute; left: 0; width: 100%; }
  #cmx .pb-back { top: 0; height: var(--bh); transform-origin: 50% 100%; transform-style: preserve-3d; will-change: transform; }
  #cmx .pb-back > i { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 12px 12px 2px 2px; border: 3px solid ${INK}; box-sizing: border-box; background: #f6efe0; }
  #cmx .pb-back > i.cv { transform: rotateX(180deg); border-radius: 2px 2px 12px 12px; background: var(--cv, #2f7684); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: #fff4d6; font-style: normal; text-align: center; }
  #cmx .cv::before { content: ""; position: absolute; inset: 10px; border: 2px solid rgba(255, 244, 214, .55); border-radius: 6px; }
  #cmx .cv b { font-size: clamp(22px, 7vw, 30px); font-weight: 900; letter-spacing: .02em; text-shadow: 0 3px 0 rgba(20, 12, 8, .45); } #cmx .cv span { font-size: 13px; font-weight: 800; opacity: .85; letter-spacing: .08em; text-transform: uppercase; } #cmx .cv img { width: 30%; aspect-ratio: 1; margin-bottom: 4px; }
  #cmx .pb-back svg, #cmx .pb-l svg { display: block; width: 100%; height: 100%; overflow: visible; }
  #cmx .pb-floor { top: var(--bh); height: var(--fh); transform-origin: 50% 0; transform: rotateX(${FA}deg); border-radius: 2px 2px 12px 12px; box-shadow: inset 0 0 0 3px ${INK}; background: linear-gradient(var(--f0, #f3e6c0), var(--f1, #dcc48c)); }
  #cmx .pb-floor::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 14px; background: linear-gradient(rgba(40, 24, 16, .3), rgba(40, 24, 16, 0)); }
  #cmx .pb-sh { position: absolute; left: 5%; right: 5%; height: 18px; margin-top: -4px; background: radial-gradient(ellipse at 50% 30%, rgba(30, 20, 10, .3), rgba(30, 20, 10, 0) 70%); opacity: 0; transform-origin: 50% 0; }
  #cmx .pb-l, #cmx .pb-a { bottom: var(--gap); transform-origin: 50% 100%; opacity: 0; pointer-events: none; will-change: transform; }
  #cmx .pb-a .in { position: relative; width: 100%; }
  #cmx .pb-a .pogo { width: 100%; height: 100%; margin: 0; }
  #cmx .pb-a .bs, #cmx .pb-a .bs b, #cmx .pb-a .in > img { display: block; width: 100%; height: 100%; background-repeat: no-repeat; object-fit: contain; }
  #cmx .pb-a .stick { position: absolute; left: 50%; bottom: 0; width: 9px; margin-left: -4px; background: ${EDGE}; box-shadow: 0 0 0 2px ${INK}; border-radius: 2px; }
  #cmx .pb-a .spring { position: absolute; left: 50%; bottom: 0; width: 26px; margin-left: -13px; }
  #cmx .pb-a .boat { position: absolute; left: -16%; width: 132%; bottom: -7%; }
  #cmx .pb-a .rays { position: absolute; inset: -30%; border-radius: 50%; background: radial-gradient(circle closest-side, rgba(255, 240, 160, .85) 0 24%, rgba(255, 240, 160, 0) 60%); }
  #cmx .pb-talk { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 7px; padding: 2px 0; pointer-events: none; }
  #cmx .bl { position: relative; max-width: 82%; padding: 7px 12px 8px; background: #fffaf0; color: #2a1a10; border: 2.5px solid ${INK}; border-radius: 18px 22px 20px 16px / 16px 20px 18px 22px;
    font-family: "Chalkboard SE", "Marker Felt", "Comic Neue", "Comic Sans MS", cursive; font-size: clamp(13px, 3.7vw, 16px); line-height: 1.22; box-shadow: 3px 4px 0 rgba(20, 12, 8, .28); }
  #cmx .bl.l { align-self: flex-start; transform-origin: 20% 115%; } #cmx .bl.r { align-self: flex-end; transform-origin: 80% 115%; }
  #cmx .bl::after { content: ""; position: absolute; width: 14px; height: 14px; background: #fffaf0; border: 2.5px solid ${INK}; border-top: 0; border-left: 0; bottom: -9px; transform: rotate(45deg) skew(12deg, 12deg); }
  #cmx .bl.l::after { left: 16%; } #cmx .bl.r::after { right: 16%; }
  #cmx .bl b { display: block; font-size: .72em; letter-spacing: .06em; text-transform: uppercase; color: #8a4a20; margin-bottom: 1px; font-family: system-ui, sans-serif; font-weight: 900; }
  #cmx .pb-caps { width: var(--pw); min-height: 104px; margin-top: -14px; display: flex; flex-direction: column; gap: 5px; pointer-events: none; position: relative; }
  #cmx .cap { background: #f3d98a; color: #3a2210; border: 2px solid ${INK}; padding: 6px 10px; font-size: clamp(12px, 3.4vw, 14px); font-weight: 800; line-height: 1.22; text-align: center; border-radius: 3px 5px 4px 3px; box-shadow: 2px 3px 0 rgba(20, 12, 8, .28); }
  #cmx .cap small { display: block; font-size: .78em; letter-spacing: .06em; text-transform: uppercase; opacity: .75; }
  #cmx .cm-dots { display: flex; gap: 6px; height: 8px; } #cmx .cm-dots i { width: 8px; height: 8px; border-radius: 50%; background: rgba(246, 239, 224, .28); } #cmx .cm-dots i.on { background: #f3d98a; }
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
  if (!save.cmxMig) { save.cmxMig = 1; for (let c = 0; c < NCH; c++) if (save.stars && save.stars[c * 10 + 9]) { save.cmx.i[c] = 1; save.cmx.o[c] = 1; } try { persist(); } catch (e) {} }   // places already beaten count as seen (the book still shows them)
  save.cmx.k = save.cmx.k || {};
  if (!save.cmxMigK) { save.cmxMigK = 1; for (let k = 0; k < KID.length; k++) if (save.stars && save.stars[k * KLEVELS]) save.cmx.k[k] = 1; try { persist(); } catch (e) {} }   // a kingdom already entered before this update counts as seen
  const seenK = (k) => !!save.cmx.k[k];
  const seen = (c, w) => !!(save.cmx[w === "intro" ? "i" : "o"] || {})[c], mark = (c, w) => { save.cmx[w === "intro" ? "i" : "o"][c] = 1; try { persist(); } catch (e) {} };

  // ---------------------------------------------------------------- the figures: each stands on its own paper tab in front of the layers
  // [width as a share of the page, place on the floor page from the fold (0-1), lift above the floor on a paper stick (share of the page), height / width]
  const ACT = { pogo: [.36, .56, 0, 396 / 360], crab: [.3, .8, 0, .8], pip: [.2, .5, .2, 1], charm: [.3, .34, .22, 1], boss: [.42, .46, .13, 1],
    fox: [.34, .78, 0, 1], bear: [.4, .78, 0, 1], penguin: [.3, .78, 0, 1], hedgehog: [.28, .8, 0, 1], deer: [.38, .78, 0, 1], sheep: [.34, .78, 0, 1], rabbit: [.32, .78, 0, 1], eagle: [.4, .5, .12, 1], butterfly: [.24, .5, .2, 1] };
  const SHEET = { pip: "bee" };   // Pip the post-bee is the map's bee
  function crEl(kind) { const d = document.createElement("div"); d.className = "bs"; const n = (typeof CR === "object" && CR[kind]) || null;
    if (n) { const b = document.createElement("b"), [frames, cols] = n; b.style.backgroundImage = `url(anim/cr-${kind}.webp${Q})`; b.style.backgroundSize = `${cols * 100}% ${Math.ceil(frames / cols) * 100}%`; d.appendChild(b);
      b._pa = { cr: 1, n: frames, cols, t0: performance.now(), f: -1, vis: 1, vt: 0 }; try { PA_RUN.add(b); if (!paRaf) paRaf = requestAnimationFrame(paTick); } catch (e) {} }
    return d; }
  // Pogo rides the line: in every kingdom he stands in the Turnip's little open wagon
  const BOAT = () => `<svg class="boat" viewBox="0 0 132 50" aria-hidden="true">${cut("M6,6 H126 L119,32 H13 Z", "#b9763e", 3)}<path d="M10,13 H122" stroke="${INK}" stroke-width="1.5" opacity=".5"/><text x="66" y="27" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="${EDGE}" letter-spacing="1">${T("TURNIP")}</text><g fill="${INK}" stroke="${EDGE}" stroke-width="3"><circle cx="38" cy="38" r="9"/><circle cx="94" cy="38" r="9"/></g><circle cx="38" cy="38" r="2.5" fill="${EDGE}"/><circle cx="94" cy="38" r="2.5" fill="${EDGE}"/></svg>`;
  const SPRING = (h) => `<svg class="spring" viewBox="0 0 26 60" preserveAspectRatio="none" style="height:${h}px" aria-hidden="true">${line("M13,60 L3,52 L23,44 L3,36 L23,28 L3,20 L23,12 L13,2", "#e9dcc0", 3)}</svg>`;
  // the figure `id` ("pogo:clip", "charm:name", "crab", "pip" or a boss) for side l / r / c of a page W wide whose floor page is F long
  function figure(id, side, W, F, skin, lit) { const [k, arg] = id.split(":"), g = ACT[k] || ACT.boss, afloat = k === "pogo" && skin !== "mem", w = Math.round(g[0] * W), lift = Math.round((afloat ? .075 : g[2]) * W), d = g[1] * F, el = document.createElement("div"), inn = document.createElement("div");
    el.className = "pb-a"; inn.className = "in"; el.style.width = w + "px"; el.style.left = side === "l" ? "3%" : side === "r" ? (W - w - W * .03).toFixed(1) + "px" : ((W - w) / 2).toFixed(1) + "px"; el.style.paddingBottom = lift + "px"; inn.style.height = Math.round(w * g[3]) + "px";
    const pre = `translate3d(0, ${(d * Math.cos(FA * Math.PI / 180)).toFixed(1)}px, ${(d * Math.sin(FA * Math.PI / 180)).toFixed(1)}px) `; el.style.transform = pre + `rotateX(${FLAT}deg)`;
    if (lift && !afloat) el.insertAdjacentHTML("beforeend", k === "charm" ? SPRING(lift + 14) : `<i class="stick" style="height:${lift + Math.round(w * .42)}px"></i>`);
    if (k === "pogo") { inn.innerHTML = paHtml(arg || "idle") + (skin === "mem" ? "" : BOAT()); }
    else if (k === "charm") { inn.innerHTML = `<i class="rays"></i><img alt="" src="anim/ch-${arg}.webp${Q}" style="position:relative">`; }
    else { inn.appendChild(crEl(SHEET[k] || k)); if (side === "r" && k !== "crab") inn.firstChild.style.transform = "scaleX(-1)"; }   /* the birds are drawn looking right: on the right they turn to face Pogo */
    el.appendChild(inn); return { el, inn, pre, who: k, arg }; }

  // ---------------------------------------------------------------- the comic: a pop-up book. It is put down shut, the back page swings up and the
  // scene stands up out of the fold; a tap brings the next page (the figures change on their tabs; a new scene shuts the book and opens it again),
  // or shows at once what is still coming. Skip leaves at once. Shown once (save.cmx); the story book plays them again.
  let open = null;
  const RM = () => { try { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } };
  const comic = (c, which, opts = {}) => { if (open || window.__fast || c < 0 || c >= NCH) return Promise.resolve(); if (!opts.replay) mark(c, which);
    return book(pages(c, which), { head: bossName(c) + " · " + place(c).name, title: realm(kOf(c)).name, sub: T("Chapter {0}", c + 1) + " · " + T("A pop-up story"), skin: SKIN(c), charm: CHARM[c] }); };
  // the arrival page of kingdom k (0-9): shown once, the first time its first level is opened; { replay: true } shows it again
  const wantKingdom = (lv) => { const k = Math.floor(lv / KLEVELS); return lv >= 0 && lv % KLEVELS === 0 && k < KID.length && !window.__fast && !(typeof roomStart !== "undefined" && roomStart) && !seenK(k); };
  const kingdom = (k, opts = {}) => { k = Math.floor(+k); if (open || window.__fast || !(k >= 0 && k < KID.length)) return Promise.resolve(); if (!opts.replay) { save.cmx.k[k] = 1; try { persist(); } catch (e) {} }
    return book(gatePages(k), { head: L2(SD.line || ["The Lantern Line", "Fener Hattı"]), title: realm(k).name, sub: T("Kingdom {0} of 10", k + 1), skin: KID[k], charm: CHARM[k * PER + PER - 1] }); };
  function book(list, hd) {
    return new Promise((resolve) => {
      const ov = document.createElement("div"); ov.id = "cmx"; ov.setAttribute("role", "dialog");
      const vh = innerHeight, vw = innerWidth, W = Math.round(Math.max(220, Math.min(430, (vw - 14) / 1.05, (vh - 290) / 1.12))), BH = Math.round(W * .8), F = Math.round(W * .62), PH = BH + Math.round(W * .3), still = RM();
      for (const [k, v] of [["--pw", W], ["--ph", PH], ["--bh", BH], ["--fh", F], ["--gap", PH - BH]]) ov.style.setProperty(k, v + "px");
      ov.innerHTML = `<div class="cm-top"><span></span><button class="cm-skip" type="button"></button></div><div class="pb"><div class="pb-book"><div class="pb-floor"></div><div class="pb-back"><i class="fr"></i><i class="cv"><img alt="" src="anim/ch-${hd.charm || "star"}.webp${Q}"><b></b><span></span></i></div></div><div class="pb-talk"></div></div><div class="pb-caps"></div><div class="cm-dots"></div><div class="cm-hint"></div>`;
      ov.querySelector(".cm-top span").textContent = hd.head; ov.querySelector(".cm-skip").textContent = T("Skip"); ov.querySelector(".cv b").textContent = hd.title; ov.querySelector(".cv span").textContent = hd.sub;
      { const A = ACCENT[hd.skin] || "#2f7684"; ov.style.setProperty("--tb", mix(A, "#16202c", .6)); ov.style.setProperty("--cv", mix(A, "#1a1410", .22)); }
      const pb = ov.querySelector(".pb"), book = ov.querySelector(".pb-book"), back = ov.querySelector(".pb-back"), floor = ov.querySelector(".pb-floor"), talkEl = ov.querySelector(".pb-talk"), capsEl = ov.querySelector(".pb-caps"), hint = ov.querySelector(".cm-hint"), dotsEl = ov.querySelector(".cm-dots");
      dotsEl.innerHTML = list.map(() => "<i></i>").join(""); back.style.transform = `rotateX(${FLAT}deg)`;
      document.body.appendChild(ov); open = ov;
      let i = -1, busy = true, done = false, isOpen = false, cur = "", layers = [], idle = null, timers = [], queue = [], talkAnims = []; const cast = { l: null, r: null, c: null };
      const A = (el, k, opt) => { if (!el || !el.animate) return null; const a = el.animate(k.frames, Object.assign({ duration: k.duration, fill: "both" }, opt || {})); if (still) { try { a.finish(); } catch (e) {} } return a; };
      const sleep = (ms) => new Promise((r) => { timers.push(setTimeout(r, still ? Math.min(ms, 60) : ms)); });
      const cs = Math.cos(FA * Math.PI / 180), sn = Math.sin(FA * Math.PI / 180);
      // the scene's paper: the back page's painting, the floor's colours, the three layers lying flat in the fold with their shadows
      function lay(key) { const sc = scene(key); cur = key; back.querySelector(".fr").innerHTML = sc.back; floor.style.setProperty("--f0", sc.floor[0]); floor.style.setProperty("--f1", sc.floor[1]); floor.innerHTML = "";
        layers = sc.layers.map((L) => { const el = document.createElement("div"), d = L.d * F, pre = `translate3d(0, ${(d * cs).toFixed(1)}px, ${(d * sn).toFixed(1)}px) `, sh = document.createElement("i");
          el.className = "pb-l"; el.style.height = Math.round(L.h / 400 * W) + "px"; el.style.transform = pre + `rotateX(${FLAT}deg)`; el.innerHTML = L.svg; book.appendChild(el); sh.className = "pb-sh"; sh.style.top = d.toFixed(1) + "px"; floor.appendChild(sh); return { el, pre, sh, k: L.k }; }); }
      // the figures of a page: one that is already standing stays (Pogo only changes what he is doing), one that leaves folds down, a new one snaps up
      function stand(sp, t0) { const [skin, arg] = sp.scene.split("|"); let any = 0;
        for (const side of ["l", "r", "c"]) { const want = sp[side] || "", have = cast[side], k = want.split(":")[0];
          if (have && have.who === k && (k === "pogo" || have.arg === want.split(":")[1])) { if (k === "pogo") { const a = want.split(":")[1] || "idle"; timers.push(setTimeout(() => { try { paPlay(have.inn.firstChild, a); } catch (e) {} }, t0 + 120)); } continue; }
          if (have) { A(have.el, fold("tabDown", have.pre), { delay: t0 }); const gone = have.el; timers.push(setTimeout(() => gone.remove(), t0 + 260)); cast[side] = null; any = 1; }
          if (!want) continue; const f = figure(want, side, W, F, skin, arg === "lit"); book.appendChild(f.el); cast[side] = f; any = 1; const dl = t0 + (have ? 200 : 0) + (side === "r" ? 90 : side === "c" ? 160 : 0);
          A(f.el, fold("tabUp", f.pre), { delay: dl }); timers.push(setTimeout(() => sfx("pop", side === "l" ? 3 : 5), dl + 200));
          if (k === "pogo") timers.push(setTimeout(() => { try { paPlay(f.inn.firstChild, f.arg || "idle"); } catch (e) {} }, dl + 240));
          if (k === "charm") { const im = f.inn.lastChild; im.style.opacity = 0; timers.push(setTimeout(() => { im.style.opacity = ""; play(im, "cmxCharm"); sfx("reward"); }, dl + 260)); }
          if (sp.beat && side === "r") timers.push(setTimeout(() => play(f.inn, "cmxBeat"), dl + 620)); }
        return any; }
      async function openBook(sp) { lay(sp.scene); sfx("swap"); A(back, fold("backOpen", ""));
        let gate = 0; layers.forEach((L, n) => { const dl = L.k ? (gate = 520) : 120 + n * 80; A(L.el, fold(L.k || "layerUp", L.pre), { delay: dl }); const k = KW("cmxShade"); A(L.sh, k, { delay: dl }); timers.push(setTimeout(() => sfx("pop", 1 + n), dl + 260)); });
        stand(sp, 430 + gate); if (gate) timers.push(setTimeout(() => { sfx("reward"); try { buzz(14); } catch (e) {} }, gate + 430)); await sleep(1060 + gate); if (done) return; isOpen = true;
        if (!still) { const N = layers[layers.length - 1], k = fold("tremble", N.pre); idle = N.el.animate(k.frames, { duration: k.duration, iterations: Infinity }); } }
      async function shutBook() { if (idle) { idle.cancel(); idle = null; } let n = 0; for (const side of ["c", "r", "l"]) { const f = cast[side]; if (!f) continue; A(f.el, fold("tabDown", f.pre), { delay: n * 30 }); n++; cast[side] = null; }
        const old = layers, gone = [...book.querySelectorAll(".pb-a")]; for (let q = old.length - 1, m = 0; q >= 0; q--, m++) { A(old[q].el, fold("layerDown", old[q].pre), { delay: 40 + m * 40 }); A(old[q].sh, { duration: 200, frames: [{ opacity: 1 }, { opacity: 0 }] }, { delay: 40 + m * 40 }); }
        A(back, fold("backClose", ""), { delay: 110 }); timers.push(setTimeout(() => sfx("swap"), 380)); await sleep(700); for (const L of old) L.el.remove(); for (const g of gone) g.remove(); layers = []; isOpen = false; }
      // what is said: balloons at the top of the page, the narrator's strips over the front edge; each comes after the one before has had time to be read
      const readMs = (s) => Math.min(2600, 750 + s.length * 32);
      function say(sp) { let t = 60; const add = (fn, ms) => { const job = { fn, id: setTimeout(() => { queue.splice(queue.indexOf(job), 1); fn(); if (!queue.length) hint.textContent = T("Tap to go on"); }, still ? 0 : t) }; queue.push(job); t += ms; };
        for (const [side, who, text] of sp.say || []) add(() => { const b = document.createElement("div"); b.className = "bl " + side; b.innerHTML = "<b></b><span></span>"; b.firstChild.textContent = who; b.lastChild.textContent = text; talkEl.appendChild(b); talkAnims.push(play(b, "cmxBalloon")); sfx("pop", 4); }, readMs(text));
        for (const [small, text] of sp.caps || []) add(() => { const e = document.createElement("div"); e.className = "cap"; e.innerHTML = (small ? "<small></small>" : "") + "<span></span>"; if (small) e.firstChild.textContent = small; e.lastChild.textContent = text; capsEl.appendChild(e); talkAnims.push(play(e, "cmxCap")); }, readMs(text));
        if (!queue.length) hint.textContent = T("Tap to go on"); }
      const flush = () => { const q = queue; queue = []; for (const j of q) { clearTimeout(j.id); j.fn(); } talkAnims.forEach(a => { try { a && a.finish(); } catch (e) {} }); talkAnims = []; hint.textContent = T("Tap to go on"); };
      const hush = () => { talkAnims = []; for (const e of [...talkEl.children, ...capsEl.children]) { const a = play(e, "cmxBalloonOut"); if (a) a.onfinish = () => e.remove(); else e.remove(); } hint.textContent = ""; };
      async function show(n) { busy = true; i = n; const sp = list[i]; hush(); dotsEl.querySelectorAll("i").forEach((d, q) => d.classList.toggle("on", q <= i));
        if (!isOpen) await openBook(sp); else if (sp.scene !== cur) { await shutBook(); if (done) return; await sleep(70); await openBook(sp); } else if (stand(sp, 0)) await sleep(560); else await sleep(120);
        if (done) return; busy = false; say(sp); }
      const close = () => { if (done) return; done = true; timers.forEach(clearTimeout); queue.forEach(j => clearTimeout(j.id)); queue = []; if (idle) idle.cancel(); ov.style.transition = "opacity .25s"; ov.style.opacity = 0; setTimeout(() => { ov.remove(); open = null; resolve(); }, 260); };
      ov.addEventListener("click", (e) => { if (e.target.closest(".cm-skip")) { close(); return; } if (done || busy) return; if (queue.length) { flush(); return; } if (i + 1 < list.length) show(i + 1); else close(); });
      A(pb, KW("cmxPanel")); timers.push(setTimeout(() => { if (!done) show(0); }, still ? 0 : 430)); }); }
  const wantIntro = (lv) => typeof isMordo === "function" && isMordo(lv) && !window.__fast && !(typeof roomStart !== "undefined" && roomStart) && !seen(Math.floor(lv / 10), "intro");

  // ---------------------------------------------------------------- the chest
  // items: [{ k: "star" | "carrot" | "boost" | "allboost" | "lives", n, b }]; prepaid: the caller has already put them in the save (station gifts)
  const BN = { hammer: "Sandpiper", moves: "+10 Moves", switch: "Free Switch", cross: "Cross Blast", undo: "Undo" };
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
          let th = ""; try { th = (window.MINI && MINI.thumb && MINI.thumb(game)) || ""; } catch (e) {} const title = window.MINI_T ? MINI_T(game) : game;   // the game's own painted sea (mini.js); no picture rather than a forest one
          card.innerHTML = (th ? `<img alt="" src="${th}">` : "") + `<span></span>`; card.querySelector("span").textContent = T("{0} left a game behind: {1}", from || "Pogo", title); items.appendChild(card);
          const p = document.createElement("button"); p.className = "btn"; p.type = "button"; p.textContent = T("Play"); const l = document.createElement("button"); l.className = "btn ghost"; l.type = "button"; l.textContent = T("Later"); btns.append(p, l);
          p.addEventListener("click", async (e) => { e.stopPropagation(); btns.innerHTML = ""; ov.style.visibility = "hidden"; const r = await MINI.open(game, { reward: true }); res(r && r.reward); }, { once: true });
          l.addEventListener("click", (e) => { e.stopPropagation(); save.miniFree = (save.miniFree || 0) + 1; try { persist(); tip(T("Saved in the Playground: one free game."), 2600); } catch (er) {} res(null); }, { once: true }); }); }
    }); }
  // what a chest puts in the save; boosters go through the save's multiplier, so the item says what really landed
  function pay(list) { for (const it of list) { if (it.k === "star") save.starBonus = (save.starBonus || 0) + it.n; else if (it.k === "carrot") save.carrots = (save.carrots || 0) + it.n;
      else if (it.k === "boost") { save.boost[it.b] = (save.boost[it.b] || 0) + it.raw; } else if (it.k === "allboost") { for (const k in BOOST0) save.boost[k] = (save.boost[k] || 0) + it.raw; } } try { persist(); } catch (e) {} }
  const BXMn = () => typeof BXM === "number" ? BXM : 1;
  const boostItem = (b, raw) => ({ k: "boost", b, raw, n: raw * BXMn() });

  // ---------------------------------------------------------------- the boss's chest, on the first win of a tenth level (no carrots: the boss
  // level already pays its loot in carrots), and the side game he leaves behind. 2026-11-23 a quarter less than before (İdris: "oyundaki booster ve
  // ödül sayısını %25 azalt"): it was two stars and one booster handout in every chest; now the chests take turns over four places, so that four
  // of them hold six stars (was eight) and three booster handouts (was four). The chest without a booster is one of the two with two stars.
  const CHEST_BOSS = { stars: 2, boost: 1, cycle: [{ stars: 1, boost: 1 }, { stars: 2, boost: 0 }, { stars: 1, boost: 1 }, { stars: 2, boost: 1 }], was: { stars: 2, boost: 1 } };
  const bossChest = (c) => CHEST_BOSS.cycle[((c % 4) + 4) % 4];
  async function afterBoss(lv) { const c = Math.floor(lv / 10); if (window.__fast || c < 0 || c >= NCH) return;
    if (!seen(c, "outro")) await comic(c, "outro");
    const pool = ["hammer", "moves", "switch", "cross"], b = pool[(c + (save.stats && save.stats.wins || 0)) % pool.length], B = SD.bosses[c], name = L2(B.name), pay0 = bossChest(c), items = [{ k: "star", n: pay0.stars }]; if (pay0.boost) items.push(boostItem(b, pay0.boost));
    await chest({ title: L2(CHEST_OF[B.who] || CHEST_OF[B.kind] || CHEST_OF.magpie), items, invite: GAME_OF(c), from: name }); }

  // ---------------------------------------------------------------- the boss's line when he wins
  function taunt() { const el = typeof BS === "object" && BS.boss; if (!el || !el.isConnected || window.__fast || !G) return 0; const c = Math.floor(G.level / 10), list = (c >= 40 ? TAUNT.friend : TAUNT[KIND(c)]) || TAUNT.magpie, line = L2(list[(save.fails[G.level] || 0) % list.length]);
    const t = document.createElement("div"); t.className = "cmxTaunt"; t.textContent = line; document.body.appendChild(t); const r = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight;
    let x = r.left - w - 6; if (x < 6) x = Math.min(innerWidth - w - 6, r.right + 6); let y = r.top + 6; if (y + h > innerHeight - 6) y = innerHeight - h - 6; t.style.left = Math.round(x) + "px"; t.style.top = Math.round(Math.max(6, y)) + "px"; t.style.transformOrigin = x < r.left ? "100% 50%" : "0% 50%";
    const a = play(t, "tauntIn"); if (a) a.onfinish = () => t.remove(); else setTimeout(() => t.remove(), 2100); sfx("bad"); return 1200; }

  // ---------------------------------------------------------------- Pogo's present: every fifth carrot he eats, a small chest. It used to be a
  // booster handout and two stars by turns; 2026-11-23, a quarter less: over eight presents three booster handouts (was four) and six stars (was eight)
  const FULL = 5, GIFTS = [{ stars: 1 }, { boost: 1 }, { stars: 2 }, { boost: 1 }, { stars: 1 }, { boost: 1 }, { stars: 1 }, { stars: 1 }];
  const giftOf = (n) => GIFTS[((n % 8) + 8) % 8];
  function petGift() { const n = Math.floor((save.fed || 0) / FULL); if (!n || (save.fed || 0) % FULL) return Promise.resolve(); const pool = ["hammer", "moves", "switch", "cross"], g = giftOf(n);
    const items = g.boost ? [boostItem(pool[n % pool.length], g.boost)] : [{ k: "star", n: g.stars }];
    return chest({ title: T("Pogo brought you a present!"), sub: T("He ate five carrots and he is full. This is for you."), items, small: true }); }
  const toGift = () => FULL - ((save.fed || 0) % FULL);

  // ---------------------------------------------------------------- the story book: the comics of every place already met can be watched again
  function bookButtons(sec, c) { const i = seen(c, "intro"), o = seen(c, "outro"); if (!i && !o) return; const w = document.createElement("div"); w.className = "cmxw";
    if (i) { const b = document.createElement("button"); b.type = "button"; b.textContent = "▶ " + T("Watch the meeting"); b.addEventListener("click", () => comic(c, "intro", { replay: true })); w.appendChild(b); }
    if (o) { const b = document.createElement("button"); b.type = "button"; b.textContent = "▶ " + T("Watch the ending"); b.addEventListener("click", () => comic(c, "outro", { replay: true })); w.appendChild(b); }
    sec.appendChild(w); }

  addEventListener("load", () => setTimeout(() => { const im = new Image(); im.src = `anim/mini-chest.webp${Q}`; if (im.decode) im.decode().catch(() => {}); }, 1500));
  // place(c) is the name, title, narrator's text and short line of a place in the player's language; realm(k) the same for a kingdom
  window.STORY = { comic, wantIntro, kingdom, wantKingdom, afterBoss, chest, taunt, petGift, toGift, bookButtons, seen, seenKingdom: seenK, MEET, OUT, BEATS, TURN, TAUNT, GATE, KEEPER, PLACES, NARR, WORLD, CHARM, WHO, place, realm, kingdomOf: kOf, bossName, pages, gatePages, scene, keys: PB, fold, GAME_OF, KGAMES,
    CHEST_BOSS, bossChest, GIFTS, giftOf, boostItem, T, data: SD, hasData: SD === window.STORY_DATA, get open() { return !!open; } };
})();
