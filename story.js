// Charmfall story and rewards (2026-11-06, İdris picked "Hepsi": boss comics with dialogue, a reward chest, carrots as side-game tickets, a gift
// from Pogo when he is full). Loaded after index.html's script and mini.js; it reads the page's globals (save, persist, CHAPTERS, bossOf,
// TR, PA, paHtml, paPlay, PA_RUN, paTick, CR, ART_Q, ICO, BICON, BXM, RWM, starsFree, SFX, buzz, tip, UI_KEYS) and the page calls in at five places:
//   STORY.wantIntro(level) / STORY.comic(chapter, "intro" | "outro", { replay })   before a boss level and after its first win (and from the story book)
//   STORY.afterBoss(level)    the outro, the boss's chest and its side-game invitation, on the first win of every tenth level
//   STORY.chest(opts)         the chest: drops, rattles, the lid opens (anim/mini-chest.webp, eight painted drawings), the things inside come out,
//                             Collect sends them to the counters; station gifts and Pogo's present use it too
//   STORY.taunt()             the boss's line beside his figure on the board when a boss level is lost
//   STORY.petGift()           every fifth carrot Pogo eats he brings a small chest
// 2026-11-22 the world moved to the sea (İdris, 2026-11-10: Coral Cove / Mercan Körfezi) and the comics became a POP-UP BOOK: one book lies on
// the table, its back page swings up on the spine and the scene stands up out of the fold in layers (cut paper drawn here as SVG, CSS 3D, transform
// and opacity only, every motion a keyed table in PB below). The story, its forty sea places and every line live in this file in both languages;
// STORY.place(c) hands the sea names to the page. Nothing runs while no comic or chest is shown.
(() => {
  "use strict";
  if (typeof save !== "object" || !window.UI_KEYS) return;
  const $ = (id) => document.getElementById(id), tr = () => save.lang === "tr";
  // ---------------------------------------------------------------- words: English in the code, Turkish beside it; the page's own TR table for its own lines
  const TRS = {
    "Skip": "Geç", "Tap to go on": "Devam etmek için dokun", "Chapter {0}": "Bölüm {0}", "The end of chapter {0}": "{0}. bölümün sonu", "Watch": "İzle", "Watch the meeting": "Karşılaşmayı izle", "Watch the ending": "Sonu izle",
    "Collect": "Topla", "Later": "Sonra", "Play": "Oyna", "{0}'s chest": "{0}'in sandığı", "The gulls' chest": "Martıların sandığı", "Station gift": "İstasyon hediyesi", "Pogo brought you a present!": "Pogo sana bir hediye getirdi!",
    "{0} left a game behind: {1}": "{0} geride bir oyun bıraktı: {1}", "Saved in the Playground: one free game.": "Oyun parkına kaydedildi: bir bedava oyun.",
    "Every booster": "Her güçlendirici", "Unlimited lives · {0} min": "Sınırsız can · {0} dk", "He ate five carrots and he is full. This is for you.": "Beş havuç yedi ve doydu. Bu senin için.",
    "Next present in {0} carrots": "Sonraki hediye {0} havuç sonra", "Stars": "Yıldız", "Carrots": "Havuç", "Boosters": "Güçlendirici",
    "Coral Cove": "Mercan Körfezi", "A pop-up story": "Açılır kitap masalı", "A memory": "Bir anı", "TURNIP": "ŞALGAM"
  };
  const T = (s, ...a) => { let o = (tr() && TRS[s]) || s; a.forEach((v, i) => { o = o.replace("{" + i + "}", v); }); return o; };
  const PT = (s) => (tr() && typeof TR === "object" && TR[s]) || s;   // the page's own lines (boss names, booster names)
  const L2 = (pair) => tr() ? pair[1] : pair[0];

  // ---------------------------------------------------------------- the world: Coral Cove. The cove's charms are its light (old crabs say they were
  // stars once, fell in and liked it here); the lighthouse lamp burns on their glow. When they were taken the reef went grey and the lamp went dim.
  // Pogo, the lighthouse rabbit, goes after them in a rowing boat called Turnip, with the lamp's spare glass on his head for a diving helmet. He
  // cannot swim and his glass fogs up when he is scared; by the end it does not. Forty places, five stretches:
  //   0-9   the shallows   Mordo, a young cormorant: his nest is in the hull of a wreck where no light ever came
  //   10-13 the sandbar    the gulls, who copy whatever Mordo does and repeat the last word of everything
  //   14-19 the storm rocks  Gritt, Mordo's crested cousin: the smallest of five chicks, she learned to grab first
  //   20-29 the cold north  Corvin, their grandfather: the flock flew south one winter, its letter never came, so he froze the tide to keep what was left
  //   30-39 the night sea   Nyx, a fishing bat: she saw a star fall into the sea and has been "rescuing" the charms into a jar ever since
  // Two friends come and go: Barnacle the ferry crab (every direction he gives is sideways) and Pip the seahorse postman, whose one letter is three
  // winters late: it is the flock's letter to Corvin.
  const WORLD = ["Coral Cove", "Mercan Körfezi"];
  // [name, Turkish name, title, Turkish title]
  const PLACES = [
    ["Lighthouse Shallows", "Fener Sığlığı", "The lamp went dim", "Fener söndü"], ["Seagrass Meadow", "Deniz Çayırı", "Feathers in the seagrass", "Çayırdaki tüyler"],
    ["Bubble Springs", "Köpük Pınarı", "Tick, tick, pop", "Tik, tik, pat"], ["Anemone Hollow", "Şakayık Kovuğu", "Under the anemones", "Şakayıkların altında"],
    ["The Old Anchor", "Eski Çapa", "What the turtle saw", "Kaplumbağanın gördüğü"], ["Kelp Maze", "Yosun Labirenti", "Half way", "Yolun yarısı"],
    ["Whirlpool Hill", "Girdap Tepesi", "A current on the hill", "Tepedeki akıntı"], ["Moon Arch", "Ay Kemeri", "Only the moon", "Yalnızca ay"],
    ["Cormorant's Reef", "Karabatak Resifi", "His reef", "Onun resifi"], ["The Wreck", "Batık", "The dark hull", "Karanlık tekne"],
    ["Harbour Steps", "Liman Merdivenleri", "Across the sandbar", "Kum setinin ötesi"], ["Lighthouse Rock", "Fener Kayası", "A light to steer by", "Yol gösteren ışık"],
    ["Tide Pools", "Gelgit Gölcükleri", "Caught in the pools", "Gölcüklerde kalanlar"], ["Driftwood Beach", "Kütük Kumsalı", "Along the sand", "Kum boyunca"],
    ["Fog Bank", "Sis Sığlığı", "Fog on the water", "Suyun üstünde sis"], ["Cliff Ledges", "Uçurum Rafları", "Up the cliff", "Uçurumdan yukarı"],
    ["Hermit's Garden", "Keşişin Bahçesi", "The old hermit crab", "Yaşlı keşiş yengeç"], ["Thunder Reef", "Gürleyen Resif", "Storm on the reef", "Resifte fırtına"],
    ["Glass Caves", "Cam Mağaralar", "Where the light bends", "Işığın büküldüğü yer"], ["Gritt's Roost", "Gritt'in Tüneği", "The roost", "Tünek"],
    ["North Current", "Kuzey Akıntısı", "One grey stripe", "Tek bir gri şerit"], ["Grey Ice", "Gri Buz", "Ice without a shine", "Parıltısız buz"],
    ["Frozen Tide", "Donmuş Gelgit", "The tide stood still", "Sular durdu"], ["Aurora Bay", "Kutup Işığı Koyu", "Lights under the ice", "Buzun altındaki ışıklar"],
    ["Thaw Channel", "Eriyen Boğaz", "Half way north", "Kuzeyin yarısı"], ["Whalebone Canyon", "Balina Kemiği Kanyonu", "An empty sea", "Boş bir deniz"],
    ["Hot Springs Gorge", "Sıcak Kaynak Boğazı", "Warm and loud", "Sıcak ve gürültülü"], ["Floe Meadow", "Buz Çayırı", "The sea cows", "Deniz inekleri"],
    ["Walrus Rock", "Mors Kayası", "The last climb", "Son tırmanış"], ["Corvin's Spire", "Corvin'in Kulesi", "The tower of ice", "Buzdan kule"],
    ["Starless Harbour", "Yıldızsız Liman", "The sea stopped sparkling", "Deniz ışıldamayı bıraktı"], ["Lantern Isle", "Fener Adası", "Lanterns on the shore", "Kıyıdaki fenerler"],
    ["Coral Gardens", "Mercan Bahçeleri", "Under the night water", "Gece suyunun altında"], ["Moonlit Lagoon", "Ay Işığı Lagünü", "A lagoon that glows", "Parlayan lagün"],
    ["Glow Bay", "Işıltı Koyu", "Little sparks", "Minik kıvılcımlar"], ["Sunset Cove", "Gün Batımı Koyu", "The last warm light", "Son sıcak ışık"],
    ["Sea Stairs", "Deniz Basamakları", "Down the old steps", "Eski basamaklardan aşağı"], ["Echo Caves", "Yankı Mağaraları", "Every sound comes back", "Her ses geri döner"],
    ["The Far Light", "Uzak Fener", "A jar like a whole sky", "Gökyüzü gibi bir kavanoz"], ["Nyx's Grotto", "Nyx'in Mağarası", "The cave under the cliff", "Uçurumun altındaki mağara"]
  ];
  // the narrator's line when Pogo arrives at a place (under its title on the first page; place(c).text for the page's own chapter card and story book)
  const NARR = [
    ["The lighthouse lamp burned on the glow of the cove's charms. One morning it went dim, and the reef went grey.", "Deniz feneri körfezin tılsımlarının ışığıyla yanardı. Bir sabah söndü, resif de griye döndü."],
    ["Black feathers drift in the seagrass. Pogo rows out in the Turnip with the lamp's spare glass on his head.", "Deniz çayırında siyah tüyler süzülüyor. Pogo, fenerin yedek camını başına geçirip Şalgam'la açılıyor."],
    ["The springs bubble all day. The thief hid two charms here, and they tick.", "Pınar bütün gün köpürür. Hırsız buraya iki tılsım saklamış; tik tak ediyorlar."],
    ["Where a charm is buried the anemones still glow a little. Pogo has never dived this deep.", "Tılsım gömülü yerde şakayıklar hâlâ biraz parlıyor. Pogo hiç bu kadar derine dalmamıştı."],
    ["An old turtle sleeps on the anchor. She saw the thief wall the charms in with crates and stone.", "Yaşlı bir kaplumbağa çapanın üstünde uyur. Hırsızın tılsımları sandık ve taşla ördüğünü görmüş."],
    ["Every turn of the kelp looks the same. Somewhere inside, a cormorant is getting nervous.", "Yosunların her dönemeci birbirine benziyor. İçeride bir yerde bir karabatak tedirgin oluyor."],
    ["The whirlpool stopped turning when its shine was taken. One push would start it again.", "Parıltısı alınınca girdap dönmeyi bıraktı. Bir itiş yeter, yeniden döner."],
    ["Nothing lights the arch but the moon. Pogo's glass has not fogged all day.", "Kemeri aydan başka aydınlatan yok. Pogo'nun camı bugün hiç buğulanmadı."],
    ["Every rock on this reef hides something stolen. It was never really his.", "Bu resifteki her kaya çalıntı bir şey saklıyor. Burası aslında hiç onun olmadı."],
    ["A sunken ship, and a nest in its hull, full of light. Someone is sitting in the middle of it, crying.", "Batık bir gemi, karnında ışık dolu bir yuva. Tam ortasında biri oturmuş, ağlıyor."],
    ["Mordo kept his word. The gulls did not: they copied him, and carried half the charms over the sandbar.", "Mordo sözünü tuttu. Martılar tutmadı: onu taklit edip tılsımların yarısını kum setinin ötesine taşıdılar."],
    ["The far lighthouse is dim too. Gulls circle its lamp and shout the last word of everything.", "Uzak fener de sönük. Martılar lambasının çevresinde dönüp her şeyin son kelimesini bağırıyor."],
    ["At low tide the charms glint in the pools. At high tide the gulls dive for them.", "Sular çekilince tılsımlar gölcüklerde parıldar. Yükselince martılar onlara dalar."],
    ["The gulls dropped half their loot on the sand and argued about it all night.", "Martılar ganimetin yarısını kuma düşürüp bütün gece bunun kavgasını etti."],
    ["Fog on the water, and a new shape in it: grey, with a gold crest. She is quicker than her cousin.", "Suyun üstünde sis, içinde yeni bir siluet: gri, altın tepeli. Kuzeninden daha hızlı."],
    ["Gritt keeps to the narrow ledges. She is quick, and she is always alone.", "Gritt dar raflardan ayrılmaz. Hızlıdır, ve hep yalnızdır."],
    ["An old hermit crab traded his charms for seaweed cakes. He has eaten the cakes and wants the charms.", "Yaşlı bir keşiş yengeç tılsımlarını yosun kekiyle takas etmiş. Kekleri yedi, şimdi tılsımlarını istiyor."],
    ["Lightning over the reef. Gritt flies between the strikes as if the storm were hers.", "Resifin üstünde şimşekler. Gritt, fırtına onunmuş gibi çakışların arasında uçuyor."],
    ["The caves are all crystal. Every wall shows Gritt twice, and both of her look at Pogo's lantern.", "Mağaralar baştan başa kristal. Her duvar Gritt'i iki kez gösteriyor; ikisi de Pogo'nun fenerine bakıyor."],
    ["The highest rock on the shore. Mordo comes along with his lantern: she is scared of the dark too.", "Kıyının en yüksek kayası. Mordo feneriyle geliyor: Gritt de karanlıktan korkar."],
    ["From Gritt's rock Pogo saw one grey stripe left, far to the north. The water gets colder with every stroke.", "Pogo, Gritt'in kayasından uzak kuzeyde kalan tek gri şeridi gördü. Her kürekte su biraz daha soğuyor."],
    ["The ice here is grey, not white. An old cormorant called Corvin took the light of the north for his spire.", "Buradaki buz beyaz değil, gri. Corvin adında yaşlı bir karabatak kuzeyin ışığını kulesine götürmüş."],
    ["The tide stopped the night Corvin flew over it. The waves stand where they were, like glass.", "Corvin üstünden uçtuğu gece gelgit durdu. Dalgalar oldukları yerde, cam gibi duruyor."],
    ["The northern lights used to dance here. Now they sit under the ice, and he counts them every night.", "Kutup ışıkları eskiden burada dans ederdi. Şimdi buzun altında duruyorlar; her gece onları sayıyor."],
    ["Half way north. Every charm that comes home opens another crack of blue in the ice.", "Kuzeyin yarısı. Eve dönen her tılsım buzda bir mavi çatlak daha açıyor."],
    ["Nothing has swum through the canyon since the light left. There are black feathers on every ledge.", "Işık gittiğinden beri kanyondan hiçbir şey geçmedi. Her çıkıntıda siyah tüyler var."],
    ["Hot springs bubble up through the gorge. It is the one place the ice could never close.", "Boğazda sıcak kaynaklar fokurduyor. Buzun kapatamadığı tek yer burası."],
    ["The sea cows graze on light, and they have not eaten for weeks. They are very polite about it.", "Deniz inekleri ışıkla beslenir, haftalardır da bir şey yemediler. Yine de çok kibarlar."],
    ["The old walrus has watched Corvin for a hundred winters. He says he is not cruel. Only cold.", "Yaşlı mors Corvin'i yüz kıştır izliyor. Zalim değil, diyor. Sadece üşümüş."],
    ["A tower of ice on the last rock of the north. Pogo climbs it with a late letter under his arm.", "Kuzeyin son kayasında buzdan bir kule. Pogo, koltuğunun altında gecikmiş bir mektupla tırmanıyor."],
    ["The ice melted. But at night the sea no longer sparkled. Someone was fishing the glow out of the water.", "Buzlar eridi. Ama geceleri deniz artık ışıldamıyordu. Biri ışıltıları sudan topluyordu."],
    ["The islanders hang lanterns where the sea-sparkle used to be. Every night a bat takes the brightest one.", "Adalılar deniz ışıltısının yerine fener asıyor. Her gece bir yarasa en parlağını alıyor."],
    ["The crabs keep the charms that sink to the garden. They will give them back for a cleared board.", "Bahçeye batan tılsımları yengeçler saklıyor. Temizlenmiş bir tahta karşılığında geri verecekler."],
    ["The lagoon only glows when the cove does. Half its glow is gone, and there are wing marks on the sand.", "Lagün yalnızca körfez parlarsa parlar. Işıltısının yarısı gitmiş, kumda kanat izleri var."],
    ["The little sparks of the bay tried to stand in for the charms. They are tired. Barnacle knows an old tale.", "Koyun minik kıvılcımları tılsımların yerini tutmaya çalıştı. Yoruldular. Kıskaç eski bir masal biliyor."],
    ["The sun sets late in this cove, and the parrotfish say the bat sleeps through it.", "Bu koyda güneş geç batar; papağan balıkları yarasanın o sırada uyuduğunu söylüyor."],
    ["Old stone steps go down under the cliff. Pogo dives at night now, and his glass stays clear.", "Eski taş basamaklar uçurumun altına iniyor. Pogo artık gece de dalıyor, camı da hiç buğulanmıyor."],
    ["The caves are full of young bats, each holding a charm. Nyx told them they were lost stars.", "Mağaralar genç yarasalarla dolu, her birinde bir tılsım var. Nyx onlara bunların kayıp yıldızlar olduğunu söylemiş."],
    ["From the far lighthouse you can see her jar. It glows like a whole sky. Corvin has come along.", "Uzak fenerden kavanozu görülüyor. Koca bir gökyüzü gibi parlıyor. Corvin de gelmiş."],
    ["The cave under the last cliff. Everyone came: Mordo, Gritt, Corvin, Barnacle, Pip. The Turnip has never been so full.", "Son uçurumun altındaki mağara. Herkes geldi: Mordo, Gritt, Corvin, Kıskaç, Pip. Şalgam hiç bu kadar dolmamıştı."]
  ];
  const place = (c) => { c = Math.max(0, Math.min(PLACES.length - 1, c)); const p = PLACES[c]; return { name: tr() ? p[1] : p[0], title: tr() ? p[3] : p[2], text: L2(NARR[c]) }; };

  // ---------------------------------------------------------------- the lines: for every place, what its boss says when Pogo arrives and Pogo's answer
  const MEET = [
    [["Shiny things belong to whoever dives fastest. That is me.", "Parlak şeyler en hızlı dalanındır. Yani benim."], ["Then I'll dive faster. Give the cove its light back!", "O zaman ben daha hızlı dalarım. Körfezin ışığını geri ver!"]],
    [["Seagrass hides everything. Even from nosy rabbits.", "Deniz çayırı her şeyi saklar. Meraklı tavşanlardan bile."], ["Not feathers. You're moulting, Mordo.", "Tüyleri saklamıyor. Tüy döküyorsun, Mordo."]],
    [["Tick, tock, rabbit. My bubbles pop faster than you count.", "Tik tak, tavşan. Baloncuklarım senin saymandan hızlı patlar."], ["Then I'll count with them. One match at a time.", "Ben de onlarla sayarım. Her seferinde bir eşleşme."]],
    [["Nobody looks under anemones. They sting.", "Şakayıkların altına kimse bakmaz. Yakarlar."], ["Not through a helmet. ...Why is it fogging up?", "Başlığımdan geçemezler. ...Bu neden buğulanıyor?"]],
    [["Crates and stone. Let's see you open those, rabbit.", "Sandıklar ve taşlar. Hadi aç bakalım, tavşan."], ["The old turtle told me how. Special gems!", "Yaşlı kaplumbağa nasıl açılacağını söyledi. Özel taşlarla!"]],
    [["This maze has no way out. I checked. Twice.", "Bu labirentin çıkışı yok. Baktım. İki kez."], ["Then follow me. I asked a crab. Sideways it is.", "O zaman beni izle. Bir yengece sordum. Yan yan gidiyoruz."]],
    [["The whirlpool turns, the tide pulls, and the charms are mine.", "Girdap döner, akıntı çeker, tılsımlar benimdir."], ["The tide is on my side today. Can you feel it?", "Bugün akıntı benden yana. Hissediyor musun?"]],
    [["Only the moon lights this arch. And rabbits fear the dark.", "Bu kemeri sadece ay aydınlatır. Tavşanlar da karanlıktan korkar."], ["A little. But look: no fog on my glass.", "Birazcık. Ama bak: camımda buğu yok."]],
    [["Welcome to my reef. Every rock here is on my side.", "Resifime hoş geldin. Buradaki her kaya benden yana."], ["Coral loves light, Mordo. It's on mine.", "Mercan ışığı sever, Mordo. O benden yana."]],
    [["The last charm is in my wreck. It's so dark down here without it.", "Son tılsım batığımda. Onsuz burası çok karanlık."], ["So that's why you took them. Let's talk after this board.", "Demek bu yüzden aldın. Bu tahtadan sonra konuşalım."]],
    [["Kree! Mordo gave his back. We didn't! Didn't! Didn't!", "Gaak! Mordo kendininkileri verdi. Biz vermedik! Vermedik!"], ["Then I'll ask the whole flock nicely. With matches.", "O zaman bütün sürüye kibarca sorarım. Eşleşmelerle."]],
    [["Kree! The lamp is too bright. Charms stay in the dark! Dark!", "Gaak! Fener çok parlak. Tılsımlar karanlıkta kalacak! Kalacak!"], ["This lamp brings the boats home. It isn't yours.", "Bu fener tekneleri eve getirir. Sizin değil."]],
    [["Kree-kree! Low tide, high stakes! Stakes!", "Gaak gaak! Sular çekildi, iş ciddileşti! Ciddileşti!"], ["I don't mind getting my paws wet. Not any more.", "Patilerim ıslanırsa ıslansın. Artık alıştım."]],
    [["Kree! Count fast, rabbit. The gems count faster! Faster!", "Gaak! Hızlı say tavşan. Taşlar daha hızlı sayıyor! Sayıyor!"], ["I've been counting since the springs. I'm good at it now.", "Pınardan beri sayıyorum. Artık çok iyiyim."]],
    [["I'm Gritt. Mordo went soft. I didn't.", "Ben Gritt. Mordo yumuşadı. Ben yumuşamadım."], ["Mordo found out that sharing feels nice. You could too.", "Mordo paylaşmanın güzel olduğunu keşfetti. Sen de edebilirsin."]],
    [["One wrong hop and you're in the deep, bunny.", "Tek yanlış zıplama ve derindesin, tavşancık."], ["I've been in the deep. It's nice. There are turtles.", "Ben derine indim. Güzel yer. Kaplumbağalar var."]],
    [["The hermit gave me those charms fair and square.", "Keşiş o tılsımları bana hakkıyla verdi."], ["For seaweed cakes! And now he wants to trade back.", "Yosun keki karşılığında! Şimdi de geri değişmek istiyor."]],
    [["Hear that thunder? That's me, laughing.", "Gök gürültüsünü duydun mu? O benim gülüşüm."], ["Storms pass. Charms stay.", "Fırtınalar geçer. Tılsımlar kalır."]],
    [["Which Gritt is the real one? Every crystal shows you another.", "Hangi Gritt gerçek? Her kristal başka birini gösteriyor."], ["The one who keeps looking at my lantern.", "Fenerime bakıp duran."]],
    [["This is my roost. Nobody climbs this high.", "Burası benim tüneğim. Kimse bu kadar yükseğe tırmanmaz."], ["I just did. And I brought one of Mordo's lanterns.", "Ben tırmandım. Mordo'nun fenerlerinden birini de getirdim."]],
    [["Krr. The north is cold for a reason, little rabbit.", "Krr. Kuzeyin soğuk olmasının bir sebebi var, küçük tavşan."], ["Grey ice isn't a reason. It's a sad story.", "Gri buz bir sebep değil. Hüzünlü bir hikâye."]],
    [["I need the light more than this water does.", "O ışığa bu sulardan daha çok ihtiyacım var."], ["Then share it. Sea and spire can both be warm.", "O zaman paylaş. Deniz de kule de ısınabilir."]],
    [["A tide that goes out, leaves. So I made it stay.", "Çekilen su gider. Ben de onu durdurdum."], ["Tides go out, Corvin. They also come back.", "Sular çekilir, Corvin. Ama geri de gelir."]],
    [["The lights are mine now. In the ice they can't leave me.", "Işıklar artık benim. Buzun içinde beni bırakamazlar."], ["They're dancing lights. Ice is no place to dance.", "Onlar dans eden ışıklar. Buzda dans edilmez."]],
    [["Spring got stuck behind the ice. I won't help it through.", "Bahar buzun ardında takıldı. Geçmesine yardım etmem."], ["Then I will. One floe at a time.", "O zaman ben ederim. Her seferinde bir buz parçası."]],
    [["Nothing swims here. Nothing should.", "Burada hiçbir şey yüzmez. Yüzmemeli de."], ["Something always comes back where somebody waits.", "Biri beklerse mutlaka bir şey geri gelir."]],
    [["Too warm, too loud. The one place I could never freeze.", "Fazla sıcak, fazla gürültülü. Donduramadığım tek yer burası."], ["Maybe it's showing you how nice warm is.", "Belki sana sıcağın ne güzel olduğunu gösteriyordur."]],
    [["The sea cows can wait. My spire needs light more.", "Deniz inekleri bekleyebilir. Kulemin ışığa daha çok ihtiyacı var."], ["Hungry sea cows can't wait, Corvin.", "Aç deniz inekleri bekleyemez, Corvin."]],
    [["The walrus talks about me? He doesn't know my winters.", "Mors benden mi bahsediyor? O benim kışlarımı bilmez."], ["He knows they were long. That's why he isn't angry.", "Uzun olduklarını biliyor. O yüzden kızgın değil."]],
    [["My spire, my light. Climb, if you must.", "Benim kulem, benim ışığım. Gerekirse tırman."], ["I came to bring you a letter, not to take your home.", "Sana bir mektup getirmeye geldim, evini almaya değil."]],
    [["Shh. The stars fell in the sea. I'm only keeping them safe.", "Şşş. Yıldızlar denize düştü. Ben sadece onları koruyorum."], ["Fell? They looked happy down there to me.", "Düştü mü? Bana orada mutlu göründüler."]],
    [["The brightest lantern is the best one. So it's mine.", "En parlak fener en iyisidir. Yani benimdir."], ["The islanders need it to find their way home.", "Adalıların eve yolu bulmak için ona ihtiyacı var."]],
    [["The crabs work for me now. Click, click.", "Yengeçler artık benim için çalışıyor. Tık tık."], ["The crabs keep the charms safe. For everyone.", "Yengeçler tılsımları koruyor. Herkes için."]],
    [["A glowing lagoon? Just stars that fell too low.", "Parlayan lagün mü? Fazla alçağa düşmüş yıldızlar sadece."], ["Then they've earned their glow. Leave it to them.", "O zaman ışıklarını hak etmişler. Onlara bırak."]],
    [["Tiny sparks pretending to be stars. Cute.", "Yıldız taklidi yapan minik kıvılcımlar. Ne tatlı."], ["They're tired of pretending. Give the real ones back.", "Taklit etmekten yoruldular. Gerçeklerini geri ver."]],
    [["Yawn. Come back after sunset, rabbit.", "Hooaam. Gün batımından sonra gel, tavşan."], ["I'll be done by sunset. Watch me.", "Gün batımına kadar bitiririm. İzle beni."]],
    [["Every step down is a step closer to my cave. Turn back.", "Her basamak mağarama bir adım daha yakın. Geri dön."], ["Then every step is worth it.", "O zaman her basamak buna değer."]],
    [["Back! Back! Back! ...That's the echo. Or me.", "Geri! Geri! Geri! ...Yankı bu. Ya da ben."], ["Your bats think the stars were lost. They weren't.", "Yarasaların yıldızların kaybolduğunu sanıyor. Kaybolmadılar."]],
    [["You saw my jar. Nobody was supposed to see my jar.", "Kavanozumu gördün. Kimsenin görmemesi gerekiyordu."], ["It's beautiful. It would be more beautiful open.", "Çok güzel. Açık olsa daha da güzel olurdu."]],
    [["My cave was so dark. The stars made it feel like the sky.", "Mağaram çok karanlıktı. Yıldızlar orayı gökyüzü gibi yaptı."], ["They chose the sea, Nyx. Let's take them home. One can stay.", "Onlar denizi seçti, Nyx. Gel, evlerine götürelim. Biri kalabilir."]]
  ];
  // what the boss says when the board is won (the first page of the ending)
  const OUT = [
    ["Fine, take it. It was not even that shiny.", "Tamam, al. O kadar da parlak değildi zaten."], ["You swim fast for a rabbit. Next time I hide better.", "Bir tavşana göre hızlı yüzüyorsun. Bir dahakine daha iyi saklarım."],
    ["Those ticking bubbles were my best idea. Hmph.", "O tik tak eden baloncuklar en iyi fikrimdi. Hıh."], ["The anemones told on me. Typical.", "Şakayıklar beni ele verdi. Tam onlardan beklenir."],
    ["The turtle is a tattletale. Keep the crates.", "Kaplumbağa tam bir ispiyoncu. Sandıklar sende kalsın."], ["I got lost in my own maze. Do not tell anyone.", "Kendi labirentimde kayboldum. Kimseye söyleme."],
    ["I was only borrowing the whirlpool's shine.", "Girdabın parıltısını ödünç almıştım sadece."], ["The moon was brighter than all my charms. Rude.", "Ay bütün tılsımlarımdan parlaktı. Ne ayıp."],
    ["My own reef, and it helped you. Unbelievable.", "Kendi resifim, sana yardım etti. İnanılır gibi değil."], ["It is dark in my wreck without them. ...Is that a lantern? For me?", "Onlar olmadan batığım karanlık. ...O bir fener mi? Bana mı?"],
    ["Kree! Kree! We drop it! Drop it! ...Dropped it.", "Gaak! Gaak! Bırakıyoruz! Bırakıyoruz! ...Bıraktık."], ["Kree! The lamp is yours. The seeds are ours! (They are not.)", "Gaak! Fener senin. Tohumlar bizim! (Değil.)"],
    ["Kree-kree! Wet feathers! Take it, take it!", "Gaak gaak! Tüylerimiz ıslandı! Al, al!"], ["Kree! We were going to give it back. Eventually. Eventually!", "Gaak! Geri verecektik. Bir gün. Bir gün!"],
    ["So you are the rabbit Mordo talks about. We will see.", "Demek Mordo'nun anlattığı tavşan sensin. Görürüz."], ["Lucky ledge. The next one is narrower.", "Şanslı raf. Sıradaki daha dar."],
    ["The hermit drives a hard bargain. Have your cakes.", "Keşiş sıkı pazarlıkçı. Al keklerini."], ["Even the storm likes you. Annoying.", "Fırtına bile seni seviyor. Sinir bozucu."],
    ["Which of me did you catch? ...Fine. The real one.", "Hangimi yakaladın? ...Tamam. Gerçeğini."], ["Mordo says the dark is better with a lantern. ...Can I have one too?", "Mordo karanlık fenerle daha güzel diyor. ...Bana da bir tane olur mu?"],
    ["Krr. A rabbit, this far north? Go home before the ice closes.", "Krr. Bu kadar kuzeyde bir tavşan mı? Buz kapanmadan evine dön."], ["You found one. There are a thousand more in my spire.", "Bir tane buldun. Kulemde bin tane daha var."],
    ["Let the tide stay still. Still things do not leave.", "Sular yerinde dursun. Duran şeyler gitmez."], ["The lights are safer in my ice. ...They do look sad in there.", "Işıklar buzumda daha güvende. ...Ama orada üzgün görünüyorlar."],
    ["Spring always ends. Why start it?", "Bahar hep biter. Neden başlasın ki?"], ["Cold, empty, and you still won. Stubborn rabbit.", "Soğuk, bomboş, yine de kazandın. İnatçı tavşan."],
    ["The hot springs talk too much. They always did.", "Sıcak kaynaklar çok fokurduyor. Hep öyleydiler."], ["The sea cows can have a little light. A little.", "Deniz inekleri biraz ışık alabilir. Birazcık."],
    ["The walrus told you about my winters. He talks too much as well.", "Mors sana kışlarımı anlatmış. O da çok konuşuyor."], ["A letter? From them? ...They are coming back with the spring tide.", "Mektup mu? Onlardan mı? ...Bahar gelgitiyle geri dönüyorlarmış."],
    ["You found the harbour. Fine. The sky is still empty.", "Limanı buldun. Peki. Gökyüzü hâlâ boş."], ["Lanterns are not stars. Mine are prettier anyway.", "Fenerler yıldız değil. Benimkiler daha güzel zaten."],
    ["The crabs gave them back? Traitors.", "Yengeçler geri mi verdi? Hainler."], ["The lagoon can keep a little glow. Only a little.", "Lagün biraz ışıltı tutabilir. Yalnızca biraz."],
    ["Those sparks should be asleep. So should you.", "O kıvılcımların uyuması lazım. Senin de."], ["I slept through the sunset again. Not fair.", "Gün batımında yine uyuyakalmışım. Haksızlık."],
    ["The steps were supposed to be slippery.", "O basamakların kaygan olması gerekiyordu."], ["My own bats told on me. Every single one.", "Kendi yarasalarım beni ele verdi. Hepsi birden."],
    ["You saw the jar. Everybody sees the jar.", "Kavanozu gördün. Herkes kavanozu görüyor."], ["I only wanted my cave to look like the sky. ...You would leave me one?", "Sadece mağaram gökyüzüne benzesin istedim. ...Bana bir tane bırakır mısın?"]
  ];
  // the extra pages of the places where the story turns. pre: before the meeting; post: in the ending, between the boss's line and the charm.
  // A page is { l, r, say: [[side, [en, tr]], ...] } (who stands left and right, who speaks), { cap: [en, tr] } (the narrator alone) or
  // { mem: boss, caps: [[en, tr], [en, tr]] } (a memory: the book closes and opens again as a shadow theatre)
  const BEATS = {
    0: { pre: [{ l: "pogo:look", r: "crab", say: [["r", ["Black feathers, heading down. Straight ahead. For me, that is left.", "Siyah tüyler, aşağı doğru. Dümdüz git. Yani bana göre sola."]], ["l", ["Rabbits don't swim. But this one has a helmet.", "Tavşanlar yüzmez. Ama bu tavşanın bir başlığı var."]]] }] },
    2: { pre: [{ l: "pogo:hello", r: "pip", say: [["r", ["Mail for the north! Only three winters late. I'm getting to it.", "Kuzeye posta var! Sadece üç kış gecikti. Yetiştiriyorum."]], ["l", ["Three winters?! ...Good luck, Pip.", "Üç kış mı?! ...Kolay gelsin, Pip."]]] }] },
    5: { pre: [{ l: "pogo:worry", r: "crab", say: [["r", ["The way out? Straight on. So: sideways.", "Çıkış mı? Dümdüz. Yani: yan yan."]], ["l", ["I'm starting to understand crab.", "Yengeççeyi çözmeye başladım."]]] }] },
    9: { post: [{ mem: "magpie", caps: [["Long ago a small cormorant hatched in the hull of a sunken ship.", "Çok eskiden küçük bir karabatak, batık bir geminin karnında yumurtadan çıktı."], ["No light ever reached his nest. So he went out to find some.", "Yuvasına hiç ışık ulaşmadı. O da ışık aramaya çıktı."]] },
      { l: "pogo:throw", r: "magpie", say: [["l", ["Keep this one. A jelly lantern. It never goes out.", "Bu sende kalsın. Denizanası feneri. Hiç sönmez."]], ["r", ["...I'll show you where the gulls took the rest.", "...Martıların gerisini nereye götürdüğünü gösteririm."]]] }] },
    10: { pre: [{ l: "pogo:idle", r: "magpie", say: [["r", ["The gulls copy everything I do. I never told them to stop.", "Martılar yaptığım her şeyi taklit eder. Durun demeyi unuttum."]], ["l", ["Then let's go and tell them. Together.", "O zaman gidip söyleyelim. Birlikte."]]] }] },
    14: { pre: [{ l: "pogo:look", r: "magpie", say: [["r", ["That's my cousin Gritt. Careful. She was always the quick one.", "Bu kuzenim Gritt. Dikkat et. Hep en hızlımız oydu."]], ["l", ["Quick is fine. I've been practising.", "Hızlı olsun. Ben de çalıştım."]]] }] },
    17: { pre: [{ l: "pogo:look", r: "pip", say: [["r", ["Still got that letter! North is uphill. Or upstream. Up something.", "Mektup hâlâ bende! Kuzey yokuş yukarı. Ya da akıntı yukarı. Yukarı bir şey."]], ["l", ["There's frost on the envelope, Pip.", "Zarfın üstü kırağı tutmuş, Pip."]]] }] },
    19: { post: [{ mem: "gritt", caps: [["Five chicks in one nest. The smallest one ate last, every time.", "Bir yuvada beş yavru. En küçükleri her seferinde en son yedi."], ["So she learned to grab first, and never to let go.", "O da ilk kapmayı öğrendi, bir de hiç bırakmamayı."]] },
      { l: "magpie", r: "gritt", say: [["l", ["You don't have to grab, Gritt. There's light enough for all of us.", "Kapmana gerek yok, Gritt. Işık hepimize yeter."]], ["r", ["...Nobody ever saved one for me before.", "...Daha önce kimse bana bir tane ayırmamıştı."]]] }] },
    20: { pre: [{ l: "pogo:worry", r: "crab", say: [["r", ["North? Forwards. Yes, I can walk forwards. Only when it matters.", "Kuzey mi? Dümdüz. Evet, düz yürüyebilirim. Sadece önemli olunca."]], ["l", ["It matters. My helmet is frosting over.", "Önemli. Başlığım buz tutuyor."]]] }] },
    26: { pre: [{ l: "pogo:wow", r: "pip", say: [["r", ["Warm water at last! The letter is thawing. It says: To Corvin.", "Sonunda ılık su! Mektup çözülüyor. Üstünde şöyle yazıyor: Corvin'e."]], ["l", ["To Corvin?! Pip, swim. I'll carry it the last part.", "Corvin'e mi?! Pip, yüz. Son kısmı ben taşırım."]]] }] },
    29: { pre: [{ l: "magpie", r: "gritt", say: [["l", ["He is our grandfather. Let us knock first.", "O bizim dedemiz. Kapıyı önce biz çalalım."]], ["r", ["He stopped answering the winter everyone flew south.", "Herkesin güneye uçtuğu kış kapıyı açmayı bıraktı."]]] }],
      post: [{ mem: "corvin", caps: [["Every winter the flock flew south. Every spring it came back. Except once.", "Her kış sürü güneye uçtu. Her bahar geri geldi. Bir kez hariç."], ["Their letter was three winters in the post. He thought nobody was coming.", "Mektupları üç kış postada kaldı. O da kimsenin gelmeyeceğini sandı."]] },
        { l: "pip", r: "corvin", say: [["l", ["Sorry it's late. The north was up something.", "Geciktiğim için özür dilerim. Kuzey yukarı bir şeydi."]], ["r", ["Let the tide run. They will need open water to land on.", "Bırakın sular aksın. Konacak açık su lazım onlara."]]] }] },
    34: { pre: [{ l: "pogo:look", r: "crab", say: [["r", ["Old crab tale: the charms were stars once. They fell in and liked it here.", "Eski bir yengeç masalı: tılsımlar bir zamanlar yıldızdı. Denize düştüler, burayı sevdiler."]], ["l", ["So they aren't lost. They moved house!", "Demek kaybolmadılar. Taşındılar!"]]] }] },
    38: { pre: [{ l: "pogo:ready", r: "corvin", say: [["r", ["I know what it is to keep a light for yourself. Let me talk to her.", "Bir ışığı kendine saklamak nedir, bilirim. Onunla ben konuşayım."]], ["l", ["We'll all go. Nobody knocks alone.", "Hep birlikte gideriz. Kimse kapıyı tek başına çalmaz."]]] }] },
    39: { post: [{ mem: "bat", caps: [["From her cave Nyx could see one small, round piece of sky.", "Nyx mağarasından gökyüzünün küçük, yuvarlak bir parçasını görebiliyordu."], ["One night a star fell out of it. She flew after it to bring it home.", "Bir gece oradan bir yıldız düştü. Onu eve getirmek için peşinden uçtu."]] },
      { l: "pogo:point", r: "bat", say: [["l", ["One will stay with you. I asked. A starfish said yes.", "Biri seninle kalacak. Sordum. Bir denizyıldızı evet dedi."]], ["r", ["Then I'll leave the jar open. In case more want to visit.", "O zaman kavanozu açık bırakırım. Başkaları da uğramak isterse."]]] }] }
  };
  // the narrator's line under the ending: where the charm goes, and what comes next (the four turns of the story have their own)
  const TURN = {
    9: ["Mordo keeps one lantern for his wreck. But the gulls have carried half the charms over the sandbar...", "Mordo batığı için bir fener alıyor. Ama martılar tılsımların yarısını kum setinin ötesine taşımış..."],
    19: ["Gritt gets a lantern too. Far to the north, one grey stripe of ice is left on the water.", "Gritt de bir fener alıyor. Uzak kuzeyde, suyun üstünde tek bir gri buz şeridi kaldı."],
    29: ["The tide runs again and the flock is on its way. But at night, the sea has stopped sparkling.", "Sular yeniden akıyor, sürü yolda. Ama geceleri deniz ışıldamayı bıraktı."],
    39: ["The jar opens and the cove fills with light. The lamp burns again. Everyone gets a carrot. Only Pogo eats his.", "Kavanoz açılıyor, körfez ışıkla doluyor. Fener yeniden yanıyor. Herkese bir havuç düşüyor. Yalnızca Pogo yiyor."]
  };
  const ending = (c) => TURN[c] ? L2(TURN[c]) : tr() ? place(c).name + " yeniden parlıyor. Sıradaki durak: " + place(c + 1).name + "." : place(c).name + " glows again. Next stop: " + place(c + 1).name + ".";
  // a boss who wins says so
  const TAUNT = {
    magpie: [["Ha! The charms stay with me!", "Ha! Tılsımlar bende kalıyor!"], ["Shiny and mine. Try again, rabbit.", "Parlak ve benim. Bir daha dene, tavşan."], ["Too slow! Is your helmet fogging up?", "Çok yavaş! Başlığın mı buğulandı?"]],
    flock: [["Kree! Kree! We win! Win!", "Gaak! Gaak! Biz kazandık! Kazandık!"], ["Kree-kree! Try again! Again!", "Gaak gaak! Yine dene! Yine!"], ["The flock keeps it! Kree!", "Sürü bunu tutuyor! Gaak!"]],
    gritt: [["Mordo would have let you win. I won't.", "Mordo kazanmana izin verirdi. Ben vermem."], ["Too slow, bunny.", "Çok yavaş, tavşancık."], ["Back to the bottom of the cliff!", "Uçurumun dibine geri!"]],
    corvin: [["Cold, isn't it? Go home.", "Soğuk, değil mi? Evine dön."], ["The north stays grey.", "Kuzey gri kalıyor."], ["Try again when the ice melts.", "Buz eriyince yine dene."]],
    bat: [["Shh, the stars are sleeping.", "Şşş, yıldızlar uyuyor."], ["Too dark for you, rabbit?", "Sana fazla mı karanlık, tavşan?"], ["Back to bed, little rabbit.", "Yatağına dön, küçük tavşan."]]
  };
  const KIND = (c) => c < 10 ? "magpie" : c < 14 ? "flock" : c < 20 ? "gritt" : c < 30 ? "corvin" : "bat";
  // who is who in a balloon (the sprites are still the forest's birds: a cormorant, gulls, a crested shag and an old frost-winged cormorant read well enough until they are repainted)
  const WHO = { pogo: ["Pogo", "Pogo"], crab: ["Barnacle", "Kıskaç"], pip: ["Pip", "Pip"], magpie: ["Mordo", "Mordo"], flock: ["The gulls", "Martılar"], gritt: ["Gritt", "Gritt"], corvin: ["Corvin", "Corvin"], bat: ["Nyx", "Nyx"] };
  // which side game a boss leaves behind: the night places get the glow catch, the others take turns
  const GAME_OF = (c) => c >= 30 || (typeof WEATHER === "object" && WEATHER[c] === "night") ? "fireflies" : ["carrots", "lilypads", "nests"][c % 3];
  // the charm that comes home at the end of each place (anim/ch-<name>.webp, the sea set); the last of the north is the letter in the bottle
  const CHARM = ["starfish", "clown", "shell", "anemone", "turtle", "kelp", "wave", "seahorse", "coral", "crown", "sailboat", "buoy", "crab", "sandcastle", "puffer", "lifebuoy", "cockle", "eel", "nautilus", "anchor",
    "whale", "narwhal", "drop", "jellyfish", "goldfish", "shark", "prawn", "manta", "dolphin", "bottle", "urchin", "angler", "coral", "squid", "clam", "palm", "snail", "octopus", "submarine", "starfish"];

  // ---------------------------------------------------------------- the pages of one comic, as plain data (no DOM): what stands where and what is said
  // { scene: skin + "|" + lit, mem, l, r, c, say: [[side, who, text]], caps: [[small, text]], beat }
  const SKIN = (c) => c === 7 || c === 9 || c === 32 ? "deep" : c < 10 ? "reef" : c < 14 ? "shore" : c < 20 ? "storm" : c < 30 ? "ice" : "night";
  function pages(c, which) { const kind = KIND(c), P = place(c), B = BEATS[c] || {}, skin = SKIN(c), out = [];
    const talk = (b, lit) => ({ scene: skin + (lit ? "|lit" : "|grey"), l: b.l, r: b.r, say: b.say.map(([side, pair]) => [side, L2(WHO[(side === "l" ? b.l : b.r).split(":")[0]]), L2(pair)]) });
    const extra = (b) => b.mem ? { scene: "mem|" + b.mem, mem: b.mem, caps: b.caps.map((p, n) => [n ? "" : T("A memory"), L2(p)]) } : b.cap ? { scene: skin + "|grey", l: "pogo:look", caps: [["", L2(b.cap)]] } : talk(b);
    if (which === "intro") { out.push({ scene: skin + "|grey", l: "pogo:hello", caps: [[T("Chapter {0}", c + 1) + " · " + P.name, P.title], ["", P.text]] }); for (const b of B.pre || []) out.push(extra(b));
      out.push({ scene: skin + "|grey", l: "pogo:point", r: kind, say: [["r", L2(WHO[kind]), L2(MEET[c][0])], ["l", "Pogo", L2(MEET[c][1])]] }); return out; }
    out.push({ scene: skin + "|grey", l: "pogo:yay", r: kind, beat: 1, say: [["r", L2(WHO[kind]), L2(OUT[c])]] }); for (const b of B.post || []) out.push(extra(b));
    out.push({ scene: skin + "|lit", l: "pogo:win", c: "charm:" + (CHARM[c] || "starfish"), caps: [[T("The end of chapter {0}", c + 1), ending(c)]] }); return out; }

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

  // ---------------------------------------------------------------- the paper: every scene is cut paper, drawn here. Six skins (the shallows, the
  // deep, the shore, the storm rocks, the ice, the night sea), each a back page, a floor page and three standing layers; "grey" is the same scene
  // with the colour gone (the charms are missing), "lit" is the one the charm comes home to. A memory is a shadow theatre: lamp-lit paper, dark shapes.
  const EDGE = "#fffaf0", INK = "#3a2618";
  const mix = (hex, to, k) => { const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16), ch = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k); return "#" + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1); };
  const PAL = {
    reef: { sky: ["#c9f1ea", "#63c3cc"], floor: ["#f3e6c0", "#dcc48c"], far: "#7cc4c2", mid: ["#f08a7a", "#f6b25e", "#c58ad6"], near: "#3fa77a", rock: "#8d86b4" },
    deep: { sky: ["#3b6f9c", "#1f3f6e"], floor: ["#8f9fb0", "#5f7088"], far: "#35608c", mid: ["#d9788a", "#e8a25e", "#9a7fd0"], near: "#2f8f78", rock: "#4d4f7c" },
    shore: { sky: ["#bfe4f6", "#fbeccb"], floor: ["#7fc8dc", "#4fa6c8"], far: "#74c3d8", mid: ["#3f9fc6", "#3f9fc6", "#3f9fc6"], near: "#2b7fb0", rock: "#b89a78" },
    storm: { sky: ["#7c8a9c", "#c4ccd2"], floor: ["#7f9fae", "#587c90"], far: "#565470", mid: ["#5f879a", "#5f879a", "#5f879a"], near: "#3a6076", rock: "#474358" },
    ice: { sky: ["#cfe6f7", "#f8fcff"], floor: ["#cfe8f4", "#9ccbe2"], far: "#b5d9ef", mid: ["#8fc6e2", "#8fc6e2", "#8fc6e2"], near: "#6fb0d4", rock: "#ffffff" },
    night: { sky: ["#1c2050", "#3d4384"], floor: ["#2c3674", "#1d2658"], far: "#262c62", mid: ["#323e80", "#323e80", "#323e80"], near: "#222a62", rock: "#191d48" },
    mem: { sky: ["#f6d58a", "#c88a48"], floor: ["#b98248", "#7c5028"], far: "#6a4426", mid: ["#4a2e1a", "#4a2e1a", "#4a2e1a"], near: "#2e1c10", rock: "#3a2618" }
  };
  function palette(skin, lit) { const p = PAL[skin] || PAL.reef; if (lit || skin === "mem") return p; const g = (h) => mix(h, skin === "night" || skin === "deep" ? "#5a5c6c" : "#bdbcb6", .62);
    return { sky: p.sky.map(h => mix(h, "#c9c8c2", skin === "night" || skin === "deep" ? 0 : .35)), floor: p.floor.map(g), far: g(p.far), mid: p.mid.map(g), near: g(p.near), rock: g(p.rock) }; }
  // shapes (a 400-wide page; y grows down, a layer's fold is its bottom edge). A cut edge shows the paper's cream core.
  const cut = (d, fill, sw) => `<path d="${d}" fill="${fill}" stroke="${EDGE}" stroke-width="${sw || 4}" stroke-linejoin="round" paint-order="stroke"/>`;
  const line = (d, col, w, tf) => `<g fill="none" stroke-linecap="round" stroke-linejoin="round"${tf ? ` transform="${tf}"` : ""}><path d="${d}" stroke="${EDGE}" stroke-width="${w + 7}"/><path d="${d}" stroke="${col}" stroke-width="${w}"/></g>`;
  const waves = (y, amp, n, fill, H) => cut(`M-12,${y}` + ` q${212 / n},${-amp} ${424 / n},0`.repeat(n) + ` V${H + 8} H-12 Z`, fill);
  const RIDGE = ["M-12,200 V78 C24,44 58,34 96,62 C122,22 172,12 208,56 C244,28 292,36 322,68 C352,42 392,46 412,62 V200 Z", "M-12,200 V60 C30,84 60,40 104,50 C150,60 160,96 204,84 C250,70 262,30 310,40 C350,48 380,76 412,58 V200 Z"];
  const CORAL = "M0,0 V-46 M0,-20 Q-16,-26 -18,-46 M0,-30 Q16,-34 20,-56 M-18,-46 Q-28,-52 -26,-64 M20,-56 Q30,-60 30,-72 M0,-46 Q-2,-60 6,-70";
  const coral = (x, y, s, col) => line(CORAL, col, 9, `translate(${x},${y}) scale(${s})`);
  const kelp = (x, y, h, col) => line(`M0,0 q-18,${-h / 4} 0,${-h / 2} t0,${-h / 2}`, col, 9, `translate(${x},${y})`);
  const rock = (x, y, w, h, col) => cut(`M${x},${y} q${w * .08},${-h} ${w * .42},${-h * .96} q${w * .42},${-h * .1} ${w * .58},${h * .96} z`, col);
  const berg = (x, y, w, h, col, sh) => cut(`M${x},${y} l${w * .22},${-h} l${w * .16},${h * .3} l${w * .2},${-h * .52} l${w * .42},${h * 1.22} z`, col) + `<path d="M${x + w * .22},${y - h} l${w * .16},${h * .3} l${-w * .06},${h * .7} l${-w * .2},0 z" fill="${sh}"/>`;
  const crag = (x, y, w, h, col) => cut(`M${x},${y} l${w * .12},${-h * .7} l${w * .14},${h * .16} l${w * .16},${-h * .46} l${w * .2},${h * .34} l${w * .14},${-h * .2} l${w * .24},${h * .86} z`, col);
  const dots = (pts, r, col, a) => pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${r + (i % 3) * .7}" fill="${col}" opacity="${a || 1}"/>`).join("");
  const lighthouse = (x, y, lit, dark) => `<g transform="translate(${x},${y})">${lit ? `<path d="M0,-150 L-170,-196 V-112 Z M0,-150 L170,-190 V-118 Z" fill="#fff3b8" opacity=".55"/>` : ""}${cut("M-46,0 q8,-30 44,-32 q40,-2 50,32 z", dark ? "#191d48" : "#a58f78")}${cut("M-17,-28 L-12,-128 H12 L17,-28 Z", dark ? "#39407c" : "#fbf3e2")}<path d="M-15.4,-62 L-14,-90 H14 L15.4,-62 Z" fill="${dark ? "#262c62" : "#e2574c"}"/>${cut("M-16,-128 H16 V-158 H-16 Z", lit ? "#ffe680" : dark ? "#262c62" : "#cfd6d8", 3)}${cut("M-20,-158 H20 L0,-178 Z", dark ? "#191d48" : "#e2574c", 3)}</g>`;
  // silhouettes for the shadow theatre: a small bird (the beak points right), a bat, a fish
  const bird = (x, y, s, col, flip) => `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})" fill="${col}"><ellipse cx="0" cy="-13" rx="15" ry="12"/><circle cx="12" cy="-27" r="8.5"/><path d="M19,-29 l13,3.5 l-13,3 z M-12,-16 l-17,10 l15,2 z M-4,-2 v6 M5,-2 v6" stroke="${col}" stroke-width="2.4" stroke-linecap="round"/></g>`;
  const vee = (x, y, s, col) => `<path d="M${x - 9 * s},${y - 4 * s} q${5 * s},${-3 * s} ${9 * s},${4 * s} q${4 * s},${-7 * s} ${9 * s},${-4 * s}" fill="none" stroke="${col}" stroke-width="${2.4 * s}" stroke-linecap="round"/>`;
  const batS = (x, y, s, col) => `<g transform="translate(${x},${y}) scale(${s})" fill="${col}"><ellipse cx="0" cy="12" rx="7" ry="13"/><path d="M-5,24 l-2,9 l5,-5 l2,6 l2,-6 l5,5 l-2,-9 z"/><path d="M-6,4 q-22,-8 -36,10 q8,-2 12,4 q6,-5 11,1 q5,-5 12,0 z M6,4 q22,-8 36,10 q-8,-2 -12,4 q-6,-5 -11,1 q-5,-5 -12,0 z"/></g>`;
  const fish = (x, y, s, col) => `<path transform="translate(${x},${y}) scale(${s})" d="M-14,0 q14,-12 28,0 l10,-7 v14 l-10,-7 q-14,12 -28,0 z" fill="${col}"/>`;
  const svg = (h, body) => `<svg viewBox="0 0 400 ${h}" preserveAspectRatio="none" aria-hidden="true">${body}</svg>`;
  // one scene: { back: svg, floor: [c0, c1], layers: [{ d: share of the floor from the fold, h: height in page units, svg }] }
  const FAR = 176, MID = 132, NEAR = 84;
  function scene(key) { const [skin, arg] = key.split("|"), lit = arg === "lit", p = palette(skin, lit), glow = lit ? dots([[52, 40], [118, 22], [190, 52], [262, 26], [338, 44], [300, 70], [86, 76]], 3, "#fff3b8", .9) : "";
    const back = (extra) => svg(320, `<defs><linearGradient id="pbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs><rect width="400" height="320" fill="url(#pbg)"/>${extra || ""}`);
    const rays = lit ? `<path d="M200,236 L60,-10 H120 Z M200,236 L172,-10 H228 Z M200,236 L280,-10 H340 Z M200,236 L-20,80 V140 Z M200,236 L420,80 V140 Z" fill="#fff6c4" opacity=".4"/>` : "";
    if (skin === "mem") { const lamp = `<circle cx="200" cy="150" r="118" fill="#fff3c9" opacity=".75"/><circle cx="200" cy="150" r="78" fill="#fff9e2" opacity=".8"/>`, D = p.mid[0], N = p.near;
      if (arg === "magpie") return { back: back(lamp + `<circle cx="286" cy="88" r="15" fill="#fff9e2"/><circle cx="286" cy="88" r="15" fill="none" stroke="${p.far}" stroke-width="5"/>`), floor: p.floor, layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V30 Q60,10 96,${FAR} Z M412,${FAR} V8 Q330,0 300,${FAR} Z" fill="${p.far}"/>` + [118, 160, 202, 244, 286].map(x => `<path d="M${x},${FAR} q-8,-96 22,-150" fill="none" stroke="${p.far}" stroke-width="9" stroke-linecap="round"/>`).join("")) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M128,${MID} q0,-36 72,-36 q72,0 72,36 z" fill="${D}"/>` + bird(204, MID - 30, 1.1, D) + `<path d="M-12,${MID} V96 q40,-14 70,36 z M412,${MID} V88 q-50,-10 -80,44 z" fill="${D}"/>`) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V40 q60,-30 110,44 z M412,${NEAR} V30 q-70,-20 -120,54 z" fill="${N}"/>`) }] };
      if (arg === "gritt") return { back: back(lamp + fish(96, 96, 1.5, p.far)), floor: p.floor, layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V70 L60,40 L120,96 L170,${FAR} Z M412,${FAR} V52 L350,30 L300,110 L270,${FAR} Z" fill="${p.far}"/>`) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M40,${MID} q10,-34 160,-34 q150,0 160,34 z" fill="${D}"/>` + [[92, 1.25], [146, 1.15], [196, 1.05], [242, .95], [300, .62]].map(([x, s]) => bird(x, MID - 30, s, D, x < 280)).join("")) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V44 L40,20 L100,${NEAR} Z M412,${NEAR} V36 L360,14 L310,${NEAR} Z" fill="${N}"/>`) }] };
      if (arg === "corvin") return { back: back(lamp + [[84, 70, 1], [112, 56, .9], [142, 48, .8], [60, 92, .8], [168, 44, .65], [190, 44, .5]].map(([x, y, s]) => vee(x, y, s, p.far)).join("")), floor: p.floor, layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V120 l50,-40 l40,50 l40,-30 l40,${FAR - 100} Z" fill="${p.far}"/>`) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M228,${MID} l34,-104 l14,22 l12,-34 l44,116 z" fill="${D}"/>` + bird(286, 16, .9, D, true)) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V50` + ` q26,-18 52,0`.repeat(8) + ` V${NEAR} Z" fill="${N}"/>`) }] };
      return { back: back(`<rect width="400" height="320" fill="#241a3a" opacity=".86"/><circle cx="262" cy="96" r="50" fill="#39407c"/>` + dots([[240, 74], [270, 64], [286, 96], [250, 108], [272, 124], [234, 96]], 2.4, "#fff3b8") + `<path d="M296,60 l-70,84" stroke="#fff3b8" stroke-width="3.5" stroke-linecap="round"/><circle cx="226" cy="144" r="5" fill="#fff9e2"/>`), floor: ["#3a2c50", "#221a34"], layers: [
        { d: .16, h: FAR, svg: svg(FAR, `<path d="M-12,${FAR} V-8 H150 Q110,60 150,${FAR} Z M412,${FAR} V-8 H356 Q396,70 350,${FAR} Z" fill="#1b1430"/>`) },
        { d: .42, h: MID, svg: svg(MID, `<path d="M-12,${MID} V-6 H96 Q60,50 110,${MID} Z" fill="#140e24"/>` + batS(150, 4, 1.25, "#140e24") + `<path d="M150,-6 v12" stroke="#140e24" stroke-width="3"/>`) },
        { d: .72, h: NEAR, svg: svg(NEAR, `<path d="M-12,${NEAR} V30 q70,-26 130,54 z M412,${NEAR} V44 q-60,-20 -100,40 z" fill="#0d0918"/>`) }] }; }
    if (skin === "reef" || skin === "deep") { const sh = `<path d="M70,-10 L150,-10 L60,320 L-40,320 Z M230,-10 L290,-10 L250,320 L170,320 Z" fill="#ffffff" opacity="${skin === "deep" ? .07 : .2}"/>`;
      return { back: back(sh + rays + dots([[60, 200], [66, 168], [58, 140], [330, 220], [338, 186], [328, 150], [334, 110]], 4, "#ffffff", .5)), floor: p.floor, layers: [
        { d: .16, h: FAR, svg: svg(FAR, cut(RIDGE[0], p.far) + rock(250, FAR + 4, 120, 96, p.rock) + glow) },
        { d: .42, h: MID, svg: svg(MID, rock(-20, MID + 4, 130, 70, p.rock) + coral(60, MID, 1.25, p.mid[0]) + coral(196, MID, 1, p.mid[1]) + coral(332, MID, 1.45, p.mid[2]) + coral(268, MID, .8, p.mid[0])) },
        { d: .72, h: NEAR, svg: svg(NEAR, kelp(26, NEAR, 78, p.near) + kelp(60, NEAR, 52, p.near) + kelp(350, NEAR, 70, p.near) + kelp(380, NEAR, 46, p.near) + rock(150, NEAR + 3, 90, 30, p.rock)) }] }; }
    const night = skin === "night", sky = skin === "shore" ? `<circle cx="318" cy="70" r="30" fill="#fff3b8" opacity="${lit ? 1 : .6}"/>` + cut("M40,96 q10,-26 40,-20 q14,-22 44,-8 q30,-4 30,28 z", "#ffffff", 3)
      : skin === "storm" ? cut("M-20,90 q20,-50 80,-36 q30,-40 90,-16 q50,-30 100,6 q60,-20 90,26 q50,0 70,40 H-20 Z", lit ? "#e9eef0" : "#59606e", 3) + (lit ? "" : cut("M250,96 l-26,58 h20 l-14,50 l46,-70 h-22 l18,-38 z", "#ffe680", 3))
      : skin === "ice" ? `<path d="M-10,70 q100,-60 210,-10 q110,46 210,-30 v60 q-100,70 -210,24 q-110,-46 -210,16 z" fill="${lit ? "#a8f0c8" : "#dfe7ea"}" opacity=".7"/>`
      : `<circle cx="96" cy="74" r="26" fill="#fff9e2"/><circle cx="106" cy="68" r="22" fill="${p.sky[0]}"/>` + (lit ? dots([[40, 30], [150, 44], [210, 20], [262, 62], [330, 34], [372, 84], [180, 96], [300, 110]], 2.2, "#fff3b8") : "");
    const far = skin === "shore" ? lighthouse(222, FAR - 22, lit, false) + waves(FAR - 40, 16, 7, p.far, FAR) : skin === "storm" ? crag(-10, FAR, 190, 150, p.far) + crag(240, FAR, 180, 110, p.rock) + waves(FAR - 26, 20, 6, p.mid[0], FAR)
      : skin === "ice" ? berg(10, FAR - 10, 170, 130, p.rock, p.far) + berg(220, FAR - 10, 190, 96, p.rock, p.far) + waves(FAR - 30, 12, 8, p.far, FAR) : cut(`M190,${FAR} q30,-70 110,-64 q80,6 112,64 z`, p.far) + lighthouse(300, FAR - 52, lit, true) + waves(FAR - 28, 14, 7, p.far, FAR);
    return { back: back(sky + rays), floor: p.floor, layers: [
      { d: .16, h: FAR, svg: svg(FAR, far + glow) },
      { d: .42, h: MID, svg: svg(MID, (skin === "ice" ? cut(`M230,${MID - 40} l60,-14 l70,10 l-14,18 l-96,4 z`, p.rock, 3) : skin === "storm" ? crag(280, MID, 130, 96, p.rock) : "") + waves(MID - 44, 18, 6, p.mid[0], MID) + (night && lit ? dots([[40, MID - 30], [120, MID - 20], [210, MID - 34], [290, MID - 18], [360, MID - 30]], 3, "#fff3b8", .9) : "")) },
      { d: .72, h: NEAR, svg: svg(NEAR, waves(NEAR - 46, 20, 5, p.near, NEAR) + (skin === "ice" ? cut(`M30,${NEAR - 34} l70,-10 l50,12 l-20,14 l-84,2 z`, p.rock, 3) : "")) }] }; }

  // ---------------------------------------------------------------- the look: a book on a table, cut paper, a hand-drawn ink line, a handwriting face for the balloons
  const css = document.createElement("style"); css.textContent = `
  #cmx, #chx { position: fixed; inset: 0; z-index: 90; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
    background: radial-gradient(ellipse at 50% 40%, rgba(70, 48, 30, .93), rgba(30, 20, 12, .97)); touch-action: manipulation; user-select: none; -webkit-user-select: none; animation: fade .25s both; overflow: hidden; }
  #cmx { background: radial-gradient(ellipse at 50% 46%, #26505c, #0e1a24); gap: 10px; }
  #cmx .cm-top { width: var(--pw); display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #f6efe0; font-weight: 900; font-size: 13px; letter-spacing: .04em; text-transform: uppercase; opacity: .9; }
  #cmx .cm-skip, #chx .cx-x { border: 0; background: rgba(246, 239, 224, .16); color: #f6efe0; font: inherit; font-weight: 800; padding: 6px 14px; border-radius: 99px; cursor: pointer; text-transform: none; letter-spacing: 0; }
  #cmx .pb { position: relative; width: var(--pw); height: var(--ph); perspective: 1400px; perspective-origin: 50% 38%; }
  #cmx .pb-book { position: absolute; inset: 0; transform-style: preserve-3d; transform: translateZ(-140px); }
  #cmx .pb-back, #cmx .pb-floor, #cmx .pb-l, #cmx .pb-a { position: absolute; left: 0; width: 100%; }
  #cmx .pb-back { top: 0; height: var(--bh); transform-origin: 50% 100%; transform-style: preserve-3d; will-change: transform; }
  #cmx .pb-back > i { position: absolute; inset: 0; overflow: hidden; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 12px 12px 2px 2px; border: 3px solid ${INK}; box-sizing: border-box; background: #f6efe0; }
  #cmx .pb-back > i.cv { transform: rotateX(180deg); border-radius: 2px 2px 12px 12px; background: #2f7684; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; color: #fff4d6; font-style: normal; text-align: center; }
  #cmx .cv::before { content: ""; position: absolute; inset: 10px; border: 2px solid rgba(255, 244, 214, .55); border-radius: 6px; }
  #cmx .cv b { font-size: clamp(22px, 7vw, 30px); font-weight: 900; letter-spacing: .02em; text-shadow: 0 3px 0 #1d4a54; } #cmx .cv span { font-size: 13px; font-weight: 800; opacity: .85; letter-spacing: .08em; text-transform: uppercase; } #cmx .cv img { width: 30%; aspect-ratio: 1; margin-bottom: 4px; }
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
  #cmx .pb-a .helm { position: absolute; left: 14%; top: -3%; width: 72%; aspect-ratio: 1; border-radius: 50%; border: 3px solid rgba(255, 255, 255, .9); box-shadow: 0 0 0 2px ${INK}; background: radial-gradient(circle at 30% 26%, rgba(255, 255, 255, .7) 0 7%, rgba(200, 240, 248, .2) 8% 100%); }
  #cmx .pb-a .helm::after { content: ""; position: absolute; left: 30%; right: 30%; bottom: -7%; height: 12%; background: #e0a53c; box-shadow: 0 0 0 2px ${INK}; border-radius: 4px; }
  #cmx .pb-a .boat { position: absolute; left: -16%; width: 132%; bottom: -5%; }
  #cmx .pb-a .rays { position: absolute; inset: -30%; border-radius: 50%; background: radial-gradient(circle closest-side, rgba(255, 240, 160, .85) 0 42%, rgba(255, 240, 160, 0) 100%); }
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
  if (!save.cmxMig) { save.cmxMig = 1; for (let c = 0; c < CHAPTERS.length; c++) if (save.stars && save.stars[c * 10 + 9]) { save.cmx.i[c] = 1; save.cmx.o[c] = 1; } try { persist(); } catch (e) {} }   // places already beaten count as seen (the book still shows them)
  const seen = (c, w) => !!(save.cmx[w === "intro" ? "i" : "o"] || {})[c], mark = (c, w) => { save.cmx[w === "intro" ? "i" : "o"][c] = 1; try { persist(); } catch (e) {} };

  // ---------------------------------------------------------------- the figures: each stands on its own paper tab in front of the layers
  // [width as a share of the page, place on the floor page from the fold (0-1), lift above the floor on a paper stick (share of the page), height / width]
  const ACT = { pogo: [.36, .56, 0, 396 / 360], crab: [.3, .7, 0, .8], pip: [.2, .5, .2, 1], charm: [.3, .34, .22, 1], boss: [.42, .46, .13, 1] };
  function crEl(kind) { const d = document.createElement("div"); d.className = "bs"; const n = (typeof CR === "object" && CR[kind]) || null;
    if (n) { const b = document.createElement("b"), [frames, cols] = n; b.style.backgroundImage = `url(anim/cr-${kind}.webp${Q})`; b.style.backgroundSize = `${cols * 100}% ${Math.ceil(frames / cols) * 100}%`; d.appendChild(b);
      b._pa = { cr: 1, n: frames, cols, t0: performance.now(), f: -1, vis: 1, vt: 0 }; try { PA_RUN.add(b); if (!paRaf) paRaf = requestAnimationFrame(paTick); } catch (e) {} }
    return d; }
  const BOAT = () => `<svg class="boat" viewBox="0 0 132 46" aria-hidden="true">${cut("M6,8 H126 q-6,28 -28,34 H34 q-22,-6 -28,-34 z", "#b9763e", 3)}<path d="M10,16 H122" stroke="${INK}" stroke-width="1.5" opacity=".5"/><text x="66" y="32" text-anchor="middle" font-family="system-ui, sans-serif" font-weight="900" font-size="11" fill="${EDGE}" letter-spacing="1">${T("TURNIP")}</text></svg>`;
  const SPRING = (h) => `<svg class="spring" viewBox="0 0 26 60" preserveAspectRatio="none" style="height:${h}px" aria-hidden="true">${line("M13,60 L3,52 L23,44 L3,36 L23,28 L3,20 L23,12 L13,2", "#e9dcc0", 3)}</svg>`;
  // the figure `id` ("pogo:clip", "charm:name", "crab", "pip" or a boss) for side l / r / c of a page W wide whose floor page is F long
  function figure(id, side, W, F, skin, lit) { const [k, arg] = id.split(":"), g = ACT[k] || ACT.boss, afloat = k === "pogo" && skin !== "reef" && skin !== "deep" && skin !== "mem", w = Math.round(g[0] * W), lift = Math.round((afloat ? .075 : g[2]) * W), d = g[1] * F, el = document.createElement("div"), inn = document.createElement("div");
    el.className = "pb-a"; inn.className = "in"; el.style.width = w + "px"; el.style.left = side === "l" ? "3%" : side === "r" ? (W - w - W * .03).toFixed(1) + "px" : ((W - w) / 2).toFixed(1) + "px"; el.style.paddingBottom = lift + "px"; inn.style.height = Math.round(w * g[3]) + "px";
    const pre = `translate3d(0, ${(d * Math.cos(FA * Math.PI / 180)).toFixed(1)}px, ${(d * Math.sin(FA * Math.PI / 180)).toFixed(1)}px) `; el.style.transform = pre + `rotateX(${FLAT}deg)`;
    if (lift && !afloat) el.insertAdjacentHTML("beforeend", k === "charm" ? SPRING(lift + 14) : `<i class="stick" style="height:${lift + Math.round(w * .42)}px"></i>`);
    if (k === "pogo") { inn.innerHTML = paHtml(arg || "idle") + (skin === "reef" || skin === "deep" ? `<i class="helm"></i>` : skin === "mem" ? "" : BOAT()); }
    else if (k === "charm") { inn.innerHTML = `<i class="rays"></i><img alt="" src="anim/ch-${arg}.webp${Q}" style="position:relative">`; }
    else if (k === "pip") { inn.innerHTML = `<img alt="" src="anim/ch-seahorse.webp${Q}">`; if (side === "l") inn.style.transform = "scaleX(-1)"; }
    else { inn.appendChild(crEl(k)); if (side === "r" && k !== "crab") inn.firstChild.style.transform = "scaleX(-1)"; }   /* the birds are drawn looking right: on the right they turn to face Pogo */
    el.appendChild(inn); return { el, inn, pre, who: k, arg }; }

  // ---------------------------------------------------------------- the comic: a pop-up book. It is put down shut, the back page swings up and the
  // scene stands up out of the fold; a tap brings the next page (the figures change on their tabs; a new scene shuts the book and opens it again),
  // or shows at once what is still coming. Skip leaves at once. Shown once (save.cmx); the story book plays them again.
  let open = null;
  const RM = () => { try { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); } catch (e) { return false; } };
  function comic(c, which, opts = {}) { if (open || window.__fast || c < 0 || c >= PLACES.length) return Promise.resolve(); if (!opts.replay) mark(c, which);
    return new Promise((resolve) => {
      const ov = document.createElement("div"); ov.id = "cmx"; ov.setAttribute("role", "dialog");
      const vh = innerHeight, vw = innerWidth, W = Math.round(Math.max(220, Math.min(430, (vw - 14) / 1.05, (vh - 290) / 1.12))), BH = Math.round(W * .8), F = Math.round(W * .62), PH = BH + Math.round(W * .3), still = RM();
      for (const [k, v] of [["--pw", W], ["--ph", PH], ["--bh", BH], ["--fh", F], ["--gap", PH - BH]]) ov.style.setProperty(k, v + "px");
      ov.innerHTML = `<div class="cm-top"><span></span><button class="cm-skip" type="button"></button></div><div class="pb"><div class="pb-book"><div class="pb-floor"></div><div class="pb-back"><i class="fr"></i><i class="cv"><img alt="" src="anim/ch-starfish.webp${Q}"><b></b><span></span></i></div></div><div class="pb-talk"></div></div><div class="pb-caps"></div><div class="cm-dots"></div><div class="cm-hint"></div>`;
      ov.querySelector(".cm-top span").textContent = L2(WHO[KIND(c)]) + " · " + place(c).name; ov.querySelector(".cm-skip").textContent = T("Skip"); ov.querySelector(".cv b").textContent = T("Coral Cove"); ov.querySelector(".cv span").textContent = T("Chapter {0}", c + 1) + " · " + T("A pop-up story");
      const list = pages(c, which), pb = ov.querySelector(".pb"), book = ov.querySelector(".pb-book"), back = ov.querySelector(".pb-back"), floor = ov.querySelector(".pb-floor"), talkEl = ov.querySelector(".pb-talk"), capsEl = ov.querySelector(".pb-caps"), hint = ov.querySelector(".cm-hint"), dotsEl = ov.querySelector(".cm-dots");
      dotsEl.innerHTML = list.map(() => "<i></i>").join(""); back.style.transform = `rotateX(${FLAT}deg)`;
      document.body.appendChild(ov); open = ov;
      let i = -1, busy = true, done = false, isOpen = false, cur = "", layers = [], idle = null, timers = [], queue = [], talkAnims = []; const cast = { l: null, r: null, c: null };
      const A = (el, k, opt) => { if (!el || !el.animate) return null; const a = el.animate(k.frames, Object.assign({ duration: k.duration, fill: "both" }, opt || {})); if (still) { try { a.finish(); } catch (e) {} } return a; };
      const sleep = (ms) => new Promise((r) => { timers.push(setTimeout(r, still ? Math.min(ms, 60) : ms)); });
      const cs = Math.cos(FA * Math.PI / 180), sn = Math.sin(FA * Math.PI / 180);
      // the scene's paper: the back page's painting, the floor's colours, the three layers lying flat in the fold with their shadows
      function lay(key) { const sc = scene(key); cur = key; back.querySelector(".fr").innerHTML = sc.back; floor.style.setProperty("--f0", sc.floor[0]); floor.style.setProperty("--f1", sc.floor[1]); floor.innerHTML = "";
        layers = sc.layers.map((L) => { const el = document.createElement("div"), d = L.d * F, pre = `translate3d(0, ${(d * cs).toFixed(1)}px, ${(d * sn).toFixed(1)}px) `, sh = document.createElement("i");
          el.className = "pb-l"; el.style.height = Math.round(L.h / 400 * W) + "px"; el.style.transform = pre + `rotateX(${FLAT}deg)`; el.innerHTML = L.svg; book.appendChild(el); sh.className = "pb-sh"; sh.style.top = d.toFixed(1) + "px"; floor.appendChild(sh); return { el, pre, sh }; }); }
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
        layers.forEach((L, n) => { const dl = 120 + n * 80; A(L.el, fold("layerUp", L.pre), { delay: dl }); const k = KW("cmxShade"); A(L.sh, k, { delay: dl }); timers.push(setTimeout(() => sfx("pop", 1 + n), dl + 260)); });
        stand(sp, 430); await sleep(1060); if (done) return; isOpen = true;
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

  // ---------------------------------------------------------------- the boss's chest, on the first win of a tenth level: two stars and one booster
  // handout (no carrots: the boss level already pays its loot in carrots), and the side game he leaves behind
  const CHEST_BOSS = { stars: 2, boost: 1 };
  async function afterBoss(lv) { const c = Math.floor(lv / 10); if (window.__fast) return;
    if (!seen(c, "outro")) await comic(c, "outro");
    const pool = ["hammer", "moves", "switch", "cross"], b = pool[(c + (save.stats && save.stats.wins || 0)) % pool.length], name = L2(WHO[KIND(c)]);
    await chest({ title: KIND(c) === "flock" ? T("The gulls' chest") : T("{0}'s chest", name), items: [{ k: "star", n: CHEST_BOSS.stars }, boostItem(b, CHEST_BOSS.boost)], invite: GAME_OF(c), from: name }); }

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
  // place(c) is the sea name and title of a place in the player's language: the page's map, chapter card and story book should read it (they still carry the forest's names)
  window.STORY = { comic, wantIntro, afterBoss, chest, taunt, petGift, toGift, bookButtons, seen, MEET, OUT, BEATS, TURN, TAUNT, PLACES, NARR, WORLD, CHARM, WHO, place, pages, scene, keys: PB, fold, GAME_OF, CHEST_BOSS, boostItem, T, get open() { return !!open; } };
})();
