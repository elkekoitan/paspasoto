#!/usr/bin/env node
/**
 * update-product-copy.mjs
 *
 * 24 ürünün shortDescription + description alanlarını premium kopyalarla
 * günceller (weathertech/3dmaxpider/chemicalguys tarzı detailing toner).
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FILE = resolve(__dirname, '..', 'apps/web/src/lib/catalog-extra.ts')

const COPY = {
  'tempered-9h-9-inch': {
    shortDescription: '9 inç multimedya ekranınız için 9H sertlikte temperli cam koruma — kristal netlik, zırh dayanıklılığı.',
    description: `**Ekranınızın hak ettiği zırh.**

Aracınızın multimedya sistemi, kabin içinde en çok bakılan ve en çok dokunulan yüzeydir. Premium-grade 9H temperli camımız, her dokunuşta saydam kalır, her çiziğe karşı dayanır.

**Öne çıkan özellikler:**
- 9H Mohs sertliğinde optik temperli cam (anahtar, kum, tırnak çiziğine kayıtsız)
- %99.9 ışık geçirgenliği — orijinal ekranla aynı netlik
- Oleofobik kaplama: parmak izi ve yağ tutmaz, tek silişte temizlenir
- 2.5D kavisli kenar tasarımı, ekran çerçevesiyle kusursuz hizalanır
- Otomatik elektrostatik yapışma — yapıştırıcı yok, kabarcık yok

**Teknik:**
- Kalınlık: 0.33 mm (dokunmatik hassasiyeti %100 korur)
- Sertlik: 9H (elmas kalemle test edildi)
- Geçirgenlik: 99.9%
- Boyut: 9.0 inç multimedya ekranlara uyumlu

**Montaj 60 saniye:** Ekranı mikrofiberle temizleyin, koruyucu filmi çıkarın, hizalayın — statik yapışma gerisini halleder.

Aracınızın iç detayına yapılmış en akıllı yatırımdır.`,
  },
  'tempered-9h-10-inch': {
    shortDescription: '10 inç ekranlar için 9H temperli cam — premium netlik, profesyonel koruma.',
    description: `**10 inç ekranınız için askeri sınıf koruma.**

Büyük ekran, büyük risk demektir. 9H sertlikteki optik temperli camımız, multimedya sisteminizi yıllarca ilk gün netliğinde tutar.

**Öne çıkan özellikler:**
- 9H temperli cam — anahtar ve metal çizmez
- Oleofobik nano kaplama — parmak izi tutmaz
- 2.5D kavisli kenar — keskin hat yoktur, çerçeveyle bütünleşir
- Lab-tested %99.9 ışık geçirgenliği
- Anti-shatter yapı: darbede kırılırsa parçalanmaz

**Teknik:**
- Kalınlık: 0.33 mm
- Sertlik: 9H Mohs
- Geçirgenlik: 99.9%
- Dokunmatik tepki: orijinal ekranla aynı
- Boyut: 10.1" - 10.25" ekranlara uyumlu

**Kolay uygulama:** Toz-temizleme kiti içerikte. Hizalayın, bastırın, bitti.

Dijital kokpitinize yatırım yapın — bir kez takın, yıllarca koruyun.`,
  },
  'matte-anti-glare-9-inch': {
    shortDescription: 'Mat anti-glare ekran koruyucu — güneşte yansımayı %95 keser, gözlerinizi yormaz.',
    description: `**Güneş artık ekranınızın düşmanı değil.**

Mat anti-glare teknolojimiz, yansımayı keser, parmak izini gizler, ekranınızı her ışık koşulunda okunaklı tutar.

**Öne çıkan özellikler:**
- Anti-glare nano-doku — direkt güneşte bile pürüzsüz görüş
- %95 yansıma azaltma (lab-tested)
- Parmak izi ve leke tutmaz — kabin her zaman temiz görünür
- Mavi ışık filtreleme — uzun sürüşlerde göz yorgunluğunu azaltır
- Çizilmeye dayanıklı 9H yüzey

**Teknik:**
- Kalınlık: 0.33 mm
- Yansıma kaybı: 95%
- Mavi ışık filtresi: 380-420 nm bandında
- Geçirgenlik: 92% (matt-optimized)
- Boyut: 9.0 inç ekranlara uyumlu

**Premium kabin deneyimi:** Mat finiş, deri döşemenizle aynı sofistike dokunuşu ekrana taşır.

Güneşi alt edin — ekranınızı her saat okunaklı tutun.`,
  },
  'privacy-9-inch': {
    shortDescription: 'Privacy ekran filtresi — sadece sürücü görür, yan koltuk gizliliği korur.',
    description: `**Ekranınız sadece sizin için.**

30 derece görüş açısı teknolojimiz, ekranınızı yan koltuktan, arkadan ve dışarıdan görünmez yapar. Mahremiyet artık opsiyon değil, standart.

**Öne çıkan özellikler:**
- 60° privacy açısı — yan koltuktan ekran siyah görünür
- Navigasyon, mesaj ve aramalarınız sadece sürücüye özel
- 9H temperli cam tabanı — çizilmeye dayanıklı
- Anti-spy mikro-louver teknolojisi
- Gece sürüşünde camlardan yansımayı engeller

**Teknik:**
- Görüş açısı: ±30° (toplam 60°)
- Sertlik: 9H
- Kalınlık: 0.4 mm
- Geçirgenlik (sürücü açısı): 75%
- Boyut: 9.0 inç ekranlara uyumlu

**Yöneticiler, taksiciler, aile sürücüleri için ideal.** Yolcu kimliklerini ve mesajlarınızı görmez; siz konforla sürersiniz.

Gizliliğiniz, premium standardınız olsun.`,
  },
  'gauge-cluster-protector': {
    shortDescription: 'Dijital kombi paneli için optik koruyucu — netliği koru, çiziği unut.',
    description: `**Dijital kokpitiniz, ilk günkü gibi.**

Dijital gösterge panelleri pahalıdır ve değişimi maliyetlidir. Optik temperli cam koruyucumuz, paneli toz, tırnak çiziği ve UV solmasına karşı korur.

**Öne çıkan özellikler:**
- 9H optik temperli cam
- UV filtresi — panel renklerinin solmasını engeller
- Oleofobik kaplama — toz çekmez, kolay temizlenir
- Anti-yansıma kaplama — gündüz okunabilirlik artar
- Hassas kesim — her aracın panel ölçüsüne özel

**Teknik:**
- Sertlik: 9H
- UV blok: %99
- Kalınlık: 0.3 mm
- Geçirgenlik: 98%

**Premium araçların standart aksesuarı:** Audi Virtual Cockpit, Mercedes MBUX, BMW Live Cockpit ve benzeri dijital panellerde uzun ömür sigortası.

Dijital kokpitiniz hak ettiği korumayı alsın.`,
  },
  'tempered-9h-12-inch': {
    shortDescription: '12.3 inç premium ekranlar için flagship koruma — Tesla, Mercedes, BMW dijital kokpitleri için.',
    description: `**Flagship ekranınız için flagship koruma.**

12.3 inç ekranlar premium araçların kalbidir. Bu boyutta koruma seçimi, aracın dijital değerini koruma kararıdır.

**Öne çıkan özellikler:**
- 9H optik temperli cam — endüstri standardının üzerinde sertlik
- 2.5D kavisli edge-to-edge tasarım
- Anti-shatter laminasyon — kırıldığında parçalanmaz, yerinde kalır
- Oleofobik + hidrofobik çift kaplama
- HD optik geçirgenlik — renk doğruluğu %100
- Tesla, Mercedes EQ, BMW iDrive 8, Audi MMI Touch uyumlu

**Teknik:**
- Boyut: 12.3 inç (özel araç modellerine uyumlu)
- Sertlik: 9H Mohs
- Kalınlık: 0.33 mm
- Geçirgenlik: 99.9%
- Dokunmatik gecikme: <1 ms

**Premium-grade montaj kiti dahil:** alkollü mendil, mikrofiber, toz silgisi, hizalama çerçevesi.

Aracınızın en pahalı yüzeyini, en akıllı yatırımla koruyun.`,
  },
  'midnight-oud': {
    shortDescription: 'Oud, sandal ve amber notalarıyla şoför mahalliniz için derin, lüks bir oryantal imza.',
    description: `**Şoför mahallinizde Orta Doğu lüksü.**

Midnight Oud, gerçek oud ağacı esansı ile harmanlanmış, sandal ve amber notalarıyla zenginleştirilmiş premium oto parfümüdür. Bir damla, kabini bir butik otel lobisine dönüştürür.

**Öne çıkan özellikler:**
- Oud + sandal + amber + bergamot kompozisyonu
- Yavaş salınım teknolojisi — 45 güne kadar koku
- Alüminyum krom klips, premium görünüm
- Klima ızgarasına saniyeler içinde takılır
- Ayarlanabilir yoğunluk vanası

**Teknik:**
- Esans kapasitesi: 8 ml
- Etki süresi: 30-45 gün (yoğunluk ayarına bağlı)
- Alkolsüz, deri ve plastiğe zarar vermez
- Sıcak iklim formülasyonu (akmaz, buharlaşmaz)

**Kullanım:** Klips kapağını çevirin, yoğunluğu ayarlayın, klima ızgarasına sabitleyin.

Kabin atmosferinizi yeniden tanımlayın — sürüşünüz, parfümünüzle başlasın.`,
  },
  'fresh-citrus': {
    shortDescription: 'Bergamot, limon ve yeşil çay notalarıyla canlı, ferahlatıcı sprey parfüm.',
    description: `**Sabah sürüşünüzün enerjisi, bir sıkımda.**

Fresh Citrus, İtalyan bergamotu, Sicilya limonu ve yeşil çay yapraklarının harmanından oluşan, kabin için tasarlanmış premium sprey parfümdür. Anında ferahlama, uzun süreli kalıcılık.

**Öne çıkan özellikler:**
- Premium narenciye + yeşil çay üst notası
- Uzun salınımlı musk alt notası — günler boyu kalıcılık
- Mikro-sprey teknolojisi — eşit dağılım, leke yapmaz
- Döşeme dostu formül (deri, kumaş, plastik için güvenli)
- Cep boyutu cam şişe — yanınızda taşıyabilirsiniz

**Teknik:**
- Hacim: 50 ml (yaklaşık 500 sıkım)
- Etki: 1 sıkım = 4-6 saat koku
- pH-nötr, alkol bazı düşük
- Lab-tested: kumaş ve deri lekesi yok

**Kullanım:** Tavana doğru 1-2 sıkım yapın, döşemeye doğrudan püskürtmeyin.

Aracınıza her gün yeni bir başlangıç hediye edin.`,
  },
  'leather-tobacco': {
    shortDescription: 'Hakiki deri ve Küba tütünü notalarıyla maskülen, klasik bir oto parfümü.',
    description: `**Klasik bir centilmen kulübü, kabin içinde.**

Leather & Tobacco, hakiki deri özü, Küba tütün yaprağı ve vetiver köküyle harmanlanmış maskülen bir kompozisyondur. Premium İngiliz kulüplerinin atmosferini aracınıza taşır.

**Öne çıkan özellikler:**
- Deri + tütün + vetiver + sedir ağacı
- Premium krom + ahşap dokulu klips
- Yavaş salınım — 60 güne kadar koku
- Yoğunluk ayarlı, hava akışına göre özelleşir
- Klasik araçlarla kusursuz uyum (Range Rover, Mercedes S, Audi A8)

**Teknik:**
- Esans hacmi: 8 ml
- Süre: 45-60 gün
- Alkolsüz formül
- Yüksek sıcaklık stabil (60°C'ye kadar)

**Kullanım:** Klima ızgarasına klipsleyin, vanayı yoğunluğa göre ayarlayın.

Kabin atmosferiniz, karakterinizi yansıtsın.`,
  },
  'vanilla-cream': {
    shortDescription: 'Madagaskar vanilyası ve krem notalarıyla sıcak, davetkar bir kabin atmosferi.',
    description: `**Kabin, ev rahatlığında.**

Vanilla Cream, Madagaskar vanilya çubuğu özü, beyaz sandal ve tonka fasulyesinin sıcak harmanıdır. Uzun yolculukların huzurunu, kısa sürüşlere taşır.

**Öne çıkan özellikler:**
- Hakiki Madagaskar vanilya esansı
- Krem, sandal, tonka — gurme parfümeri kompozisyonu
- 45 güne kadar yavaş salınım
- Aile araçları, hassas burunlar için ideal
- Şık beyaz seramik + krom klips

**Teknik:**
- Esans: 8 ml
- Süre: 30-45 gün
- Alkolsüz, hipoalerjenik formül
- Çocuk ve evcil hayvan dostu

**Kullanım:** Klipsi ızgaraya takın, yoğunluğu açın, kabin ısındıkça koku da yayılır.

Aracınız, ev kadar davetkar olsun.`,
  },
  'ocean-breeze': {
    shortDescription: 'Tuzlu deniz havası ve marin notalarıyla ferah, temiz bir kabin imzası.',
    description: `**Sahil yolculuğu, her gün.**

Ocean Breeze, deniz tuzu, su zambağı ve marin yosununun ferah harmanıdır. Kabini bir Aegean sahili gibi temiz, hafif, davetkar tutar.

**Öne çıkan özellikler:**
- Marin akor + deniz tuzu + beyaz çiçek
- Hafif, hiç ağır olmayan ferah profil
- Yaz aylarında klima ile mükemmel uyum
- 30-45 gün etki
- Mavi cam + krom premium klips

**Teknik:**
- Esans: 8 ml
- Süre: 30-45 gün
- Yüksek sıcaklık stabil
- Alerjen-düşük formül

**Kullanım:** Klipsleyin, vanayı tercihinize göre ayarlayın.

Her sürüşe sahil ferahlığı katın.`,
  },
  'spray-set-trio': {
    shortDescription: 'Üç imza koku — Fresh Citrus, Vanilla Cream, Ocean Breeze — premium sprey set.',
    description: `**Bir sezona üç imza.**

Spray Trio, üç farklı ruh hali için tasarlanmış premium sprey parfüm setidir: enerjik sabahlar, huzurlu akşamlar, ferah uzun yolculuklar.

**Set içeriği:**
- Fresh Citrus 50 ml — bergamot, limon, yeşil çay
- Vanilla Cream 50 ml — vanilya, sandal, tonka
- Ocean Breeze 50 ml — marin, tuz, beyaz çiçek

**Öne çıkan özellikler:**
- Premium cam şişe, alüminyum sprey başlığı
- Mikro-sprey teknolojisi — leke yapmaz, eşit dağılır
- Döşeme dostu formül (deri, kumaş, plastik için güvenli)
- Şık hediye kutusunda — kendinize veya sevdiğinize hediye için ideal
- Toplam 150 ml — yaklaşık 1500 sıkım

**Teknik:**
- Hacim: 3 x 50 ml
- Etki: sıkım başına 4-6 saat
- Alkol bazı düşük, pH-nötr

**Bir araç, üç atmosfer.** Ruh halinize göre seçin, sürüşünüzü kişiselleştirin.

Kabinin kokusunu, ruh halinize göre tasarlayın.`,
  },
  'interior-cleaner-500ml': {
    shortDescription: 'Plastik, deri, kumaş ve cam — tek formül ile profesyonel iç temizlik.',
    description: `**Profesyonel detaylama, kendi garajınızda.**

Interior Cleaner 500 ml, pH-nötr formülüyle plastiği, deriyi, kumaşı ve cam yüzeyi tek üründe temizler. Detailing studio'larda kullanılan profesyonel formül.

**Öne çıkan özellikler:**
- pH-nötr çoklu yüzey formülü (4.5-7.5 pH)
- Anti-statik bileşen — toz çekmez
- UV koruyucu içerikli — yüzeyleri solmadan korur
- Kimyasal yumuşatıcı — deri sertleşmez
- Hoş, yapay olmayan limon kokulu

**Teknik:**
- Hacim: 500 ml (yaklaşık 30-40 uygulama)
- pH: 6.8 (nötr)
- Biyolojik olarak parçalanabilir formül
- Solvent ve amonyak içermez
- Lab-tested: deri, alkantara, vinil, ABS plastik üzerinde güvenli

**Kullanım:** Mikrofibere püskürtün, yüzeye uygulayın, kuru bezle silin. Yağmur, leke, parmak izi — saniyeler içinde temiz.

Kabinin profesyonel parıltısı, her hafta sonu.`,
  },
  'tar-remover-300ml': {
    shortDescription: 'Asfalt katranı, böcek lekesi ve yapışkan kalıntıları boyaya zarar vermeden temizler.',
    description: `**Yazın boyaya yapışan her şeyi söker.**

Tar Remover 300 ml, asfalt katranı, çam reçinesi, böcek lekesi ve yapışkan etiket kalıntılarını boyaya zarar vermeden çözer. Sitrus solvent bazlı profesyonel formül.

**Öne çıkan özellikler:**
- Doğal sitrus solvent bazı — boya friendly
- Saniyeler içinde aktif olur
- Wax/seramik kaplamayı bozmaz
- Köpük tutuş — dik yüzeyde akmaz, etki süresini uzatır
- Detailer-grade konsantrasyon

**Teknik:**
- Hacim: 300 ml
- Aktif madde: D-limonen + non-iyonik surfaktan
- pH: 7.0
- Wax-safe, ceramic-coat safe
- Lab-tested: orijinal boya, clear coat üzerinde güvenli

**Kullanım:** Lekeye sıkın, 30-60 saniye bekleyin, mikrofiber bezle silin. İnatçı kalıntılarda tekrarlayın.

Yazın izini boyadan tek harekette silin.`,
  },
  'glass-cleaner-750ml': {
    shortDescription: 'Streak-free cam temizleyici — ön cam, ayna ve ekranlar için profesyonel sonuç.',
    description: `**Sıfır iz, kristal netlik.**

Glass Cleaner 750 ml, hızlı buharlaşan formülü ile cam, ayna ve film kaplı yüzeylerde streak-free temizlik sağlar. Profesyonel oto yıkamacıların standart ürünü.

**Öne çıkan özellikler:**
- Anti-streak teknolojisi — silikon, parafin, mum bırakmaz
- Hızlı buharlaşır — su lekesi yapmaz
- Tint-safe (film kaplama dostu)
- Sigara katranı, böcek lekesi ve yağ filmini çözer
- Anti-fog etki — buğulanmayı geciktirir

**Teknik:**
- Hacim: 750 ml (yaklaşık 50 uygulama)
- Amonyak içermez (film kaplama dostu)
- pH: 9.5 (hafif alkali — leke söker)
- Buharlaşma: 30 saniyede tam kuruma

**Kullanım:** Cama doğrudan sıkın, mikrofiber bezle dairesel hareketlerle silin, ikinci kuru bezle parlatın.

Camlarınız, showroom günündeki gibi parlak olsun.`,
  },
  'leather-conditioner-250ml': {
    shortDescription: 'Premium deri koltuk bakım kremi — besler, yumuşatır, UV\'den korur.',
    description: `**Deri koltuklarınız 10 yıl daha genç görünsün.**

Leather Conditioner 250 ml, lanolin, jojoba yağı ve UV filtreleri içeren premium deri bakım kremidir. İtalyan deri atölyelerinde kullanılan formülasyon mantığı.

**Öne çıkan özellikler:**
- Lanolin + jojoba yağı — derin besleyici
- UV-A/UV-B filtre — solmayı engeller
- Anti-crack formülü — çatlamayı önler
- Yapışkan olmayan mat finiş — toz çekmez
- Hafif deri kokulu — yapay parfüm yok

**Teknik:**
- Hacim: 250 ml (1 koltuk takımı için yaklaşık 6 ay kullanım)
- pH: 5.5 (deri ile uyumlu)
- UV blok: %95
- Silikon içermez, kaymaz finiş
- Lab-tested: nappa, semianilin, vinil deri üzerinde güvenli

**Kullanım:** Mikrofibere uygulayın, dairesel hareketle deriye yedirin, 10 dakika bekletin, kuru bezle parlatın. 3 ayda bir tekrarlayın.

Derinizin yumuşaklığı, ilk gün dokunuşu olarak kalsın.`,
  },
  'engine-degreaser-1l': {
    shortDescription: 'Motor bölmesi yağ ve gres sökücü — profesyonel detaylama formülü, 1 litre.',
    description: `**Motor bölmesi, sergileme kalitesinde.**

Engine Degreaser 1L, yıllar boyu birikmiş motor yağı, gres ve fren tozu kalıntılarını sökmek için tasarlanmış profesyonel-sınıf çözücüdür. Konsantre formül — su ile seyreltilebilir.

**Öne çıkan özellikler:**
- Konsantre alkali formül — 1:3 oranında seyreltilebilir
- Plastik, kauçuk ve kablo dostu (özel inhibitör katkılı)
- Anti-korozif — alüminyum ve magnezyum yüzeylerde güvenli
- Köpük tutuş — dik yüzeylere yapışır
- Hızlı yıkanma — durulamada iz bırakmaz

**Teknik:**
- Hacim: 1000 ml (konsantre — 4 litreye kadar genişletilebilir)
- pH: 11.5 (alkali — kuvvetli yağ sökücü)
- Surfaktan içeriği: %18
- Biyolojik olarak parçalanabilir
- Lab-tested: plastik ve kablolar üzerinde güvenli

**Kullanım:** Soğuk motora 1:3 oranında seyreltilmiş ürünü püskürtün, 3-5 dakika bekleyin, basınçlı suyla durulayın. Elektronik komponentleri korumayı unutmayın.

Motor bölmeniz, garaj sahnesinin yıldızı olsun.`,
  },
  'detailing-kit-starter': {
    shortDescription: 'Profesyonel iç-dış oto detaylama başlangıç kiti — 6 üründe komple bakım.',
    description: `**Detaylama setinizin tek-tıkla başlangıcı.**

Detailing Kit Starter, profesyonel oto bakımının temellerini içeren 6 parçalık premium settir. Yeni başlayanlar için yeterli, profesyoneller için tatmin edici.

**Set içeriği:**
- Interior Cleaner 250 ml (çoklu yüzey)
- Glass Cleaner 250 ml (streak-free)
- Tar Remover 100 ml (boya friendly)
- Leather Conditioner 100 ml (UV korumalı)
- Premium mikrofiber bez seti (3 adet, 350 GSM)
- Detayç fırçası (yumuşak kıllı, plastik gövde)

**Öne çıkan özellikler:**
- Tüm ürünler pH dengeli, lab-tested
- Mikrofiber bezler: 350 GSM, makinede yıkanabilir, 200 yıkamaya dayanıklı
- Şık hediye kutusunda — kendinize veya araç tutkunlarına ideal
- Detayç fırçası: havalandırma ızgaraları ve dikiş aralarına uyumlu
- Toplam değer: tek tek alımdan %25 daha avantajlı

**Teknik:**
- Toplam ürün hacmi: 700 ml temizlik kimyası + aksesuar
- Yaklaşık 8-10 kez tam araç bakımı
- Tüm yüzeyler için güvenli formüller

**Aracınıza profesyonel bakımı, garajınıza getirin.** Sergi günündeki gibi temiz, her hafta sonu.`,
  },
  'bagaj-organizer-deluxe': {
    shortDescription: 'Bagajınızı garaja çevirin — sert duvarlı, su geçirmez deluxe bagaj organizatörü.',
    description: `**Bagajınız, taşınabilir bir depoya dönüşür.**

Bagaj Organizer Deluxe, sert MDF duvarlı, 600D ballistic naylon dış kaplamalı, su geçirmez astarlı premium bagaj çantasıdır. Alışveriş, kamp, spor — her şey yerinde.

**Öne çıkan özellikler:**
- Sert MDF duvarlar — boş bile dik durur
- 600D ballistic naylon dış — yırtılmaz, suya dayanıklı
- PEVA su geçirmez iç astar — sızıntı geri çıkmaz
- Ayarlanabilir Velcro bölmeler (3-5 bölmeye dönüştürülebilir)
- Kayma önleyici taban — frenle kaymaz
- Katlanabilir tasarım — kullanılmadığında yatar

**Teknik:**
- Boyut: 60 x 35 x 30 cm (standart sedan/SUV bagaj uyumu)
- Hacim: 63 litre
- Yük kapasitesi: 25 kg
- Malzeme: 600D naylon + MDF + PEVA
- Yıkanabilir iç astar (çıkarılabilir)

**Kullanım:** Velcro bölmeleri ihtiyacınıza göre düzenleyin, alışverişi yerleştirin, frenle kayma derdi yok.

Bagajınızı kontrol altına alın — her sürüş düzenli olsun.`,
  },
  'koltuk-arkasi-organizer': {
    shortDescription: 'Koltuk arkası organizatör — tablet tutuçu, su şişesi cebi, çocuk dostu.',
    description: `**Arka koltuk, organize bir komuta merkezi.**

Koltuk Arkası Organizer, hakiki deri görünümlü PU kaplama, çoklu cep tasarımı ve tablet tutucusuyla aile araçları için tasarlanmış premium çözümdür.

**Öne çıkan özellikler:**
- 7 farklı cep — tablet, telefon, su, kalem, kitap, atıştırmalık, mendil
- 10" tablet tutucu — çocuklar için film, navigasyon için sürücüye ideal
- PU deri dış — premium, kolay temizlenir
- 600D naylon iç — dayanıklı, su dökülmesine karşı korumalı
- Ayarlanabilir kayışlar — her koltuk başlığı/altına uyar
- Kayma önleyici klipsler

**Teknik:**
- Boyut: 65 x 45 cm
- Tablet tutucu: 7-10.5 inç uyumu
- Malzeme: PU deri + 600D naylon + EVA dolgu
- Yıkanabilir yüzey
- Yük kapasitesi: 5 kg

**Kullanım:** Koltuk başlığına ve altına kayışlarla sabitleyin, ceplere ihtiyaçlarınızı yerleştirin, sürüş düzenini koruyun.

Arka koltuğu kaostan kurtarın — yolculuklar daha huzurlu olsun.`,
  },
  'yan-cep-konsol-organizer': {
    shortDescription: 'Konsol ile koltuk arası boşluğu kapatın — eşyalarınız asla aşağı düşmesin.',
    description: `**Konsol-koltuk boşluğu artık kayıp eşya bölgesi değil.**

Yan Cep Konsol Organizer, ön koltuk ile orta konsol arasındaki ölü boşluğu pratik bir cebe dönüştüren PU deri kaplamalı premium aksesuardır.

**Öne çıkan özellikler:**
- PU deri kaplama — kabin lüksüyle uyumlu
- USB ve kablo geçişine uygun yan açıklık
- Bardak tutuçu + telefon + cüzdan + bozuk para bölmesi
- Her araca uyumlu sıkıştırma tasarımı — montaj 30 saniye
- Kayma önleyici silikon taban

**Teknik:**
- Boyut: 32 x 8 x 12 cm
- Esnek genişlik: 4-8 cm boşluğa uyar
- Malzeme: PU deri + ABS gövde + EVA dolgu
- Yıkanabilir yüzey
- Çift adet (sağ + sol)

**Kullanım:** Konsol ile koltuk arasına sıkıştırın, eşyalarınızı yerleştirin, düşen telefon stresini unutun.

Kabin düzeniniz, premium bir lounge gibi olsun.`,
  },
  'cop-torbasi-magnetic': {
    shortDescription: 'Manyetik tabanlı, sızdırmaz kabin çöp torbası — her yere yapışır, kötü koku tutmaz.',
    description: `**Çöp, kabinin görünmez detayı olsun.**

Manyetik Çöp Torbası, neodimyum mıknatıs tabanı sayesinde metal yüzeylere yapışan, sızdırmaz iç astarıyla kabini temiz tutan premium kabin çöp çözümüdür.

**Öne çıkan özellikler:**
- Neodimyum mıknatıs taban — kapı, konsol, koltuk altına yapışır
- PEVA su geçirmez iç astar — sızıntı yok, koku yok
- Yıkanabilir dış kumaş (300D Oxford)
- Çekçe kapaklı ağız — koku kaçırmaz
- Yapışkan klips opsiyonu (manyetik olmayan yüzeyler için)

**Teknik:**
- Hacim: 2 litre
- Boyut: 25 x 15 x 10 cm
- Malzeme: 300D Oxford + PEVA astar + neodimyum N52
- Çekme dayanımı: 1.5 kg manyetik yapışma
- Yıkanabilir (çıkarılabilir astar)

**Kullanım:** Manyetik tabanı kapı çerçevesine, konsol yan duvarına veya koltuk altına yapıştırın. Dolduğunda fermuarı açıp poşeti boşaltın.

Kabin temizliği, premium standardınız olsun.`,
  },
  'bagaj-net-fileli': {
    shortDescription: 'Elastik bagaj filesi — yük kaymasını engeller, küçük eşyaları sabit tutar.',
    description: `**Yük frende kaymasın, bagajınız her sürüş güvenli olsun.**

Bagaj Net Fileli, yüksek mukavemetli elastik kordon + naylon ağ örgüsüyle bagajınızdaki yükü sabit tutan, askeri sınıf metal kancalı premium aksesuardır.

**Öne çıkan özellikler:**
- Yüksek mukavemetli elastik kordon (latex bazlı, %200 esneme)
- 4 adet paslanmaz çelik karabin kanca
- 3 boyut: küçük (alışveriş), orta (sandık), büyük (kamp ekipmanı)
- UV dayanıklı naylon ağ — yıllarca solmaz, kırılmaz
- Üniversal montaj — her aracın bagaj kancalarına uyar

**Teknik:**
- Boyutlar: 80 x 60 cm (esneyerek 120 x 90 cm)
- Yük kapasitesi: 20 kg
- Malzeme: naylon ağ + latex kordon + paslanmaz çelik kanca
- UV ve sıcaklık dayanımı: -30°C ile +80°C

**Kullanım:** Karabinleri bagaj kancalarına geçirin, yükü altına yerleştirin, filenin esnemesi gerisini halleder.

Frendeki en sert dur bile, yükünüzü yerinde tutsun.`,
  },
  'piknik-bagaj-cantasi': {
    shortDescription: 'Termal yalıtımlı bagaj çantası — piknik, alışveriş, kamp için 30L deluxe çözüm.',
    description: `**Hafta sonunuz, bagajdan başlasın.**

Piknik Bagaj Çantası, termal yalıtımlı çift cidarlı yapısı ve premium kumaş tasarımıyla pikniği, market alışverişini ve kısa kamp gezilerini lüks bir deneyime dönüştürür.

**Öne çıkan özellikler:**
- 8 mm PE foam termal yalıtım — 6 saat soğuk/sıcak tutma
- 600D Oxford kumaş dış — su iter, leke tutmaz
- Sızdırmaz PEVA iç astar — sızıntı geri çıkmaz
- Sert tabanlı yapı — dik durur, devrilmez
- Ayrılabilir bölme — soğuk + oda sıcaklığı ayrımı
- Çift fermuar + omuz askısı + bagaj kayışı bağlantısı

**Teknik:**
- Hacim: 30 litre
- Boyut: 45 x 30 x 25 cm
- Yalıtım: 8 mm PE foam (3 katmanlı)
- Termal süre: soğuk +4°C → 6 saat / sıcak 60°C → 4 saat
- Yük kapasitesi: 15 kg
- Malzeme: 600D Oxford + PEVA + PE foam

**Kullanım:** Termal bölmeye soğuk içecek/dondurulmuş gıda, üst bölmeye atıştırmalık ve ekmek, fermuarı kapatın, bagaja yerleştirin.

Hafta sonu kaçamaklarınız, premium-grade lojistikle başlasın.`,
  },
}

let src = readFileSync(FILE, 'utf-8')

function escapeForTemplate(s) {
  // backtick'i escape et, ${ varsa escape et
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
}

function escapeSingleQuote(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

let count = 0
for (const [slug, content] of Object.entries(COPY)) {
  // shortDescription: 'Eski metin' → 'Yeni'
  const shortPattern = new RegExp(
    `(slug: '${slug.replace(/-/g, '\\-')}',[\\s\\S]*?shortDescription: ')[^']*(',)`,
    'm'
  )
  const newShort = escapeSingleQuote(content.shortDescription)
  const m1 = src.match(shortPattern)
  if (m1) {
    src = src.replace(shortPattern, `$1${newShort}$2`)
  } else {
    console.log(`WARN: shortDesc pattern bulunamadı: ${slug}`)
    continue
  }

  // description: \`Eski metin\` → \`Yeni\`
  const descPattern = new RegExp(
    `(slug: '${slug.replace(/-/g, '\\-')}',[\\s\\S]*?description: \`)[\\s\\S]*?(\`,\\n\\s+stock:)`,
    'm'
  )
  const newDesc = escapeForTemplate(content.description)
  const m2 = src.match(descPattern)
  if (m2) {
    src = src.replace(descPattern, `$1${newDesc}$2`)
    count++
  } else {
    console.log(`WARN: desc pattern bulunamadı: ${slug}`)
  }
}

writeFileSync(FILE, src, 'utf-8')
console.log(`✓ ${count}/24 ürün güncellendi`)
