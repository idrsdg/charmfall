# Charmfall tılsımları

Bu dosya oyundaki her taşın ne olduğunu, hikâyedeki anlamını ve oyuna ne zaman girdiğini kaydeder.

Kurallar (İdris, 2026-10-16):
- Her 25 seviyede üç yeni taş gelir ve üç eski taşın yerini alır.
- Tahtada her zaman altı renk vardır. Gelen taş, yerini aldığı taşın renk yuvasını alır.
- Her taşın doğada bir karşılığı vardır. Hepsi Charmwood ormanından bir parçadır.

Hikâyedeki genel anlam: tılsımlar ormanın ışığıdır. Saksağan Mordo onları çaldığında orman griye döndü. Eve dönen her tılsım ormana bir parça yeşil geri getirir.

## Renk yuvaları

| Yuva | Renk |
|---|---|
| 1 | Kiremit |
| 2 | Kehribar |
| 3 | Yosun yeşili |
| 4 | Gece mavisi |
| 5 | Erik moru |
| 6 | Hardal |

Görünüm: dolgun 3B, çizimler yüzeyde kabartma (2026-10-16, İdris'in seçimi: doğal/toprak renkler, orman nesneleri).

## Başlangıç taşları (1-24. seviyeler)

2026-10-16 itibarıyla şekiller: tombul çiçek, yuvarlak meyve, çam ağacı, su damlası, mantar, palamut. Hepsinin küçük sevimli bir yüzü var; aşağıdaki anlamlar aynı kalıyor.

| Taş | Ne | Anlamı |
|---|---|---|
| Mantar | Benekli orman mantarı | Mantar Oyuğu'nun ışığı; şapkasının altında tılsım saklanır |
| Palamut | Yaşlı Meşe'nin palamudu | Ormanın sabrı; küçük bir tohumdan koca bir ağaç büyür |
| Yaprak | Damarlı yeşil yaprak | Ormanın nefesi; yeşilin geri dönüşünün ilk işareti |
| Çan çiçeği | Mavi çan çiçeği | Sabahı haber veren çiçek; çaldığında orman uyanır |
| Böğürtlen | Çalıdaki böğürtlen | Böğürtlen Labirenti'nin tatlı meyvesi; dikenin içindeki iyilik |
| Bal damlası | Bal damlası | Arı Çayırı'nın emeği; ormanın tatlı ışığı |

## Her 25 seviyede gelen taşlar

| Seviye | Taş | Ne | Anlamı |
|---|---|---|---|
| 25 | Akçaağaç Yaprağı | Kızıl akçaağaç yaprağı | Mevsimlerin dönüşü; orman değişir ama hep geri gelir |
| 25 | Salyangoz Kabuğu | Spiral salyangoz kabuğu | Yavaş ama durmadan ilerlemek; Pogo'nun yolculuğu gibi |
| 25 | Şans Yoncası | Dört yapraklı yonca | Yonca Çayırı'nın şansı; ateş böceğini çağıran kare dizilimin simgesi |
| 50 | Gök Tüyü | Mavi kuş tüyü | Mordo'nun düşürdüğü tüylerden biri; izini sürmenin işareti |
| 50 | Yaban Eriği | Mor yaban eriği | Ormanın sonbahar armağanı |
| 50 | Petek | Altıgen bal peteği | Arıların evi; birlikte çalışmanın gücü |
| 75 | Kar Tanesi | Kar tanesi | Ay Köprüsü'nün soğuk gecesi; her biri tek ve eşsiz |
| 75 | Deniz Yıldızı | Deniz yıldızı | Karşı kıyının habercisi; denizin ötesindeki tılsımlar |
| 75 | Kozalak | Çam kozalağı | En uzun çamın, Mordo'nun yuvasının bulunduğu ağacın meyvesi |
| 100 | Kızılgerdan Yumurtası | Benekli kuş yumurtası | Yeni başlangıç; 100. seviyede Mordo'nun barışması |
| 100 | Yarım Ay | Hilal | Mordo'nun karanlıktan korkusu ve Pogo'nun ona verdiği fener ışığı |
| 100 | İnci İstiridye | İçinde inci olan istiridye | Liman Basamakları; denizin sakladığı ışık |
| 125 | Şimşek | Şimşek | Gök Gürültüsü Sırtı'nın fırtınası; özel taşların gücü |
| 125 | Gece Gülü | Koyu gül | Gecenin güzelliği; dikenli ama değerli |
| 125 | Buz Kristali | Buz kristali | Cam Mağaraların ışığı kıran kristalleri |
| 150 | Küçük Güneş | Güneş | Ormanın asıl ışığı; Crown'un yaktığı ışığın kaynağı |
| 150 | Bahar Lalesi | Lale | Kurtarılan tohumlardan açan ilk çiçekler |
| 150 | Yaban Armudu | Yaban armudu | Münzevinin Bahçesi; kirpinin elma ve armut takası |
| 175 | Çayır Kelebeği | Kelebek | Dönüşüm; gri ormanın yeniden renklenmesi |
| 175 | Dere Balığı | Dere balığı | Nehir Köprüsü'nün altındaki dere; yeniden akan su |
| 175 | Pogo'nun Havucu | Havuç | Pogo'nun en sevdiği şey; sonda Mordo ve Gritt'e de bir tane düşer |
| 200 | Nilüfer Yaprağı | Nilüfer yaprağı ve çiçeği | Ateş Böceği Göleti; yolculuğun başladığı suya dönüş |
| 200 | Yaban Çileği | Yaban çileği | Son durağın tatlı ödülü |
| 200 | Karahindiba | Tohum topu | Rüzgârla her yere dağılan tohumlar; ormanın kendini yeniden ekmesi |

Not: 200. seviye oyunun son seviyesi olduğu için 200'de gelen üç taş yalnız o seviyede görünür.

Kod: `prism/index.html` içinde `COLORS` (başlangıç taşları), `NEWGEMS` (gelen taşlar, üçerli gruplar halinde), `SLOT` (renk yuvaları), `SHAPES` (çizimler).
