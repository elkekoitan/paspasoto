/**
 * Basit (konfigüratör gerektirmeyen) ürün kataloğu.
 *
 * 4 kategori × ~6 ürün = 24 ürün. Her ürün için:
 *  - Profesyonel açıklama (kısa + uzun)
 *  - Teknik özellikler (attributes)
 *  - Fiyat + indirimli fiyat (oldPrice)
 *  - Stok (default 50)
 *  - Görsel: `/assets/products/{category}/{slug}.svg`
 *
 * Görsel slot'ları henüz dolu değil — kullanıcı Gemini/Midjourney ile
 * üretip drop edecek. README: `public/assets/products/README.md`
 *
 * Bu dosya seed/kod-sabit. Faz 8'de admin paneli üzerinden JSON'a
 * taşınabilir CRUD'a dönüşebilir.
 */

import type { ProductCategory } from '../server/db'

export type SimpleCategory =
  | 'screen-protector'
  | 'perfume'
  | 'chemical'
  | 'bag'

export interface SimpleProduct {
  id: string
  slug: string
  category: SimpleCategory
  name: string
  price: number
  oldPrice?: number
  /** Ana görsel — kart + detay sayfası */
  image: string
  /** Detay sayfası galerisi (image + ekstra) */
  gallery?: string[]
  shortDescription: string
  description: string
  /** Stok adedi — checkout sırasında decrement edilir */
  stock: number
  sku: string
  attributes?: Record<string, string>
  badges?: Array<'best-seller' | 'new' | 'discount' | 'limited' | 'premium'>
  active: boolean
}

const ASSET = '/assets/products'

/* -------------------- Multimedya Ekran Koruyucu (6) -------------------- */

export const SCREEN_PROTECTORS: SimpleProduct[] = [
  {
    id: 'sp-001',
    slug: 'tempered-9h-9-inch',
    category: 'screen-protector',
    name: '9 inç Multimedya Ekran Koruyucu — 9H Temperli Cam',
    price: 249,
    oldPrice: 349,
    image: 'https://images.pexels.com/photos/8305346/pexels-photo-8305346.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 80,
    sku: 'SP9H9',
    attributes: {
      'Ekran Boyutu': '9 inç (uyum 9.0″-9.5″)',
      Sertlik: '9H',
      Kalınlık: '0.33mm',
      Kaplama: 'Oleophobic (yağ tutmaz)',
      Garanti: 'Üretim hatasına karşı 12 ay',
    },
    badges: ['best-seller', 'discount'],
    active: true,
  },
  {
    id: 'sp-002',
    slug: 'tempered-9h-10-inch',
    category: 'screen-protector',
    name: '10 inç Multimedya Ekran Koruyucu — 9H Temperli Cam',
    price: 279,
    oldPrice: 379,
    image: 'https://images.pexels.com/photos/9703059/pexels-photo-9703059.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 60,
    sku: 'SP9H10',
    attributes: {
      'Ekran Boyutu': '10 inç (uyum 9.7″-10.4″)',
      Sertlik: '9H',
      Kalınlık: '0.33mm',
      'Anti-Glare': 'Opsiyonel — açıklamada belirtin',
    },
    badges: ['premium'],
    active: true,
  },
  {
    id: 'sp-003',
    slug: 'matte-anti-glare-9-inch',
    category: 'screen-protector',
    name: '9 inç Mat Yüzeyli Anti-Glare Ekran Koruyucu',
    price: 199,
    image: 'https://images.pexels.com/photos/15828798/pexels-photo-15828798.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 50,
    sku: 'SPM9',
    attributes: {
      'Ekran Boyutu': '9 inç',
      Yüzey: 'Mat / Anti-Glare',
      Malzeme: 'Polikarbonat film',
      Kalınlık: '0.2mm',
    },
    active: true,
  },
  {
    id: 'sp-004',
    slug: 'privacy-9-inch',
    category: 'screen-protector',
    name: '9 inç Gizlilik (Privacy) Ekran Koruyucu',
    price: 329,
    image: 'https://images.pexels.com/photos/6817002/pexels-photo-6817002.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 35,
    sku: 'SPP9',
    attributes: {
      Tip: 'Privacy (Gizlilik filtreli)',
      'Görüş Açısı': '±30° — dışından bakana siyah',
      Sertlik: '9H',
    },
    badges: ['premium', 'new'],
    active: true,
  },
  {
    id: 'sp-005',
    slug: 'gauge-cluster-protector',
    category: 'screen-protector',
    name: 'Gösterge Paneli (Kombi) Ekran Koruyucu',
    price: 229,
    image: 'https://images.pexels.com/photos/31775324/pexels-photo-31775324.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 40,
    sku: 'SPGC',
    attributes: {
      Tip: 'Gösterge paneli (kombi)',
      Sertlik: '9H',
      UV: 'UV filtreli — renk solması yok',
      Uyum: 'Marka/model uyumu için iletişime geçin',
    },
    active: true,
  },
  {
    id: 'sp-006',
    slug: 'tempered-9h-12-inch',
    category: 'screen-protector',
    name: '12.3 inç Büyük Ekran Koruyucu (Mercedes, Tesla)',
    price: 399,
    oldPrice: 499,
    image: 'https://images.pexels.com/photos/18977351/pexels-photo-18977351.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 25,
    sku: 'SP9H12',
    attributes: {
      'Ekran Boyutu': '12.3 — 13 inç',
      Sertlik: '9H',
      Uyum: 'Mercedes / BMW / Tesla / Audi premium ekranlar',
    },
    badges: ['premium', 'discount'],
    active: true,
  },
]

/* -------------------- Oto Parfüm (6) -------------------- */

export const PERFUMES: SimpleProduct[] = [
  {
    id: 'pf-001',
    slug: 'midnight-oud',
    category: 'perfume',
    name: 'Midnight Oud — Klips Oto Parfüm',
    price: 149,
    oldPrice: 199,
    image: 'https://images.pexels.com/photos/11711835/pexels-photo-11711835.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 120,
    sku: 'PF-OUD',
    attributes: {
      Koku: 'Oud / Sandal / Amber',
      Kalıcılık: '6-8 hafta',
      Hacim: '8ml',
      Tip: 'Klips (havalandırma ızgarasına)',
    },
    badges: ['best-seller', 'premium', 'discount'],
    active: true,
  },
  {
    id: 'pf-002',
    slug: 'fresh-citrus',
    category: 'perfume',
    name: 'Fresh Citrus — Spray Oto Parfüm',
    price: 99,
    image: 'https://images.pexels.com/photos/33161096/pexels-photo-33161096.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 100,
    sku: 'PF-CTR',
    attributes: {
      Koku: 'Bergamot / Limon / Deniz Tuzu',
      Hacim: '100ml',
      Tip: 'Sprey',
      Kalıcılık: '2-3 hafta düzenli kullanımda',
    },
    badges: ['new'],
    active: true,
  },
  {
    id: 'pf-003',
    slug: 'leather-tobacco',
    category: 'perfume',
    name: 'Leather & Tobacco — Premium Klips Parfüm',
    price: 169,
    image: 'https://images.pexels.com/photos/7702669/pexels-photo-7702669.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 70,
    sku: 'PF-LTH',
    attributes: {
      Koku: 'Deri / Tütün / Vetiver',
      Kalıcılık: '6-8 hafta',
      Hacim: '8ml',
    },
    badges: ['premium'],
    active: true,
  },
  {
    id: 'pf-004',
    slug: 'vanilla-cream',
    category: 'perfume',
    name: 'Vanilla Cream — Yumuşak Klips Parfüm',
    price: 139,
    image: 'https://images.pexels.com/photos/3831748/pexels-photo-3831748.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 90,
    sku: 'PF-VNL',
    attributes: {
      Koku: 'Vanilya / Hindistancevizi',
      Kalıcılık: '6-8 hafta',
      Hacim: '8ml',
    },
    active: true,
  },
  {
    id: 'pf-005',
    slug: 'ocean-breeze',
    category: 'perfume',
    name: 'Ocean Breeze — Hava Filtresi Klipsi',
    price: 119,
    image: 'https://images.pexels.com/photos/3640668/pexels-photo-3640668.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 110,
    sku: 'PF-OCN',
    attributes: {
      Koku: 'Deniz / Çam',
      Kalıcılık: '6-8 hafta',
      Hacim: '8ml',
    },
    active: true,
  },
  {
    id: 'pf-006',
    slug: 'spray-set-trio',
    category: 'perfume',
    name: 'Parfüm Üçlü Set — Klasik Koleksiyon',
    price: 299,
    oldPrice: 447,
    image: 'https://images.pexels.com/photos/4730928/pexels-photo-4730928.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 40,
    sku: 'PF-SET3',
    attributes: {
      İçerik: '3 farklı koku × 8ml klips',
      Hediyelik: 'Şık kutu + kurdele',
      Tasarruf: '%33 paket indirimi',
    },
    badges: ['discount', 'best-seller'],
    active: true,
  },
]

/* -------------------- Oto Kimya Temizleyici (6) -------------------- */

export const CHEMICALS: SimpleProduct[] = [
  {
    id: 'ch-001',
    slug: 'interior-cleaner-500ml',
    category: 'chemical',
    name: 'İç Temizleyici Spray — Plastik & Deri & Vinyl 500ml',
    price: 189,
    oldPrice: 249,
    image: 'https://images.pexels.com/photos/8526797/pexels-photo-8526797.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 150,
    sku: 'CH-INT500',
    attributes: {
      Hacim: '500ml',
      Yüzey: 'Plastik, Deri, Vinyl, Tekstil',
      Finiş: 'Mat (parlatma yok)',
      pH: 'Nötr (alkol-aldehit içermez)',
    },
    badges: ['best-seller', 'discount'],
    active: true,
  },
  {
    id: 'ch-002',
    slug: 'tar-remover-300ml',
    category: 'chemical',
    name: 'Katran ve Asfalt Sökücü Sprey 300ml',
    price: 159,
    image: 'https://images.pexels.com/photos/7154633/pexels-photo-7154633.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 80,
    sku: 'CH-TAR',
    attributes: {
      Hacim: '300ml',
      Hedef: 'Katran, reçine, kuş pisliği, böcek',
      Boya: 'Orijinal boyaya zarar vermez',
    },
    active: true,
  },
  {
    id: 'ch-003',
    slug: 'glass-cleaner-750ml',
    category: 'chemical',
    name: 'Cam Temizleyici — Çizgisiz Finish 750ml',
    price: 129,
    image: 'https://images.pexels.com/photos/5591457/pexels-photo-5591457.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 120,
    sku: 'CH-GLS750',
    attributes: {
      Hacim: '750ml',
      Uyum: 'Tinted (tente) cam uyumlu',
      İz: 'Çizgisiz, lekesiz kuruma',
    },
    active: true,
  },
  {
    id: 'ch-004',
    slug: 'leather-conditioner-250ml',
    category: 'chemical',
    name: 'Deri Bakım & Besleme Kremi 250ml',
    price: 219,
    image: 'https://images.pexels.com/photos/29961629/pexels-photo-29961629.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 95,
    sku: 'CH-LTH',
    attributes: {
      Hacim: '250ml',
      Tip: 'Krem (sıvı değil)',
      Frekans: 'Aylık önerilir',
      Uyum: 'Doğal + sentetik deri',
    },
    badges: ['premium'],
    active: true,
  },
  {
    id: 'ch-005',
    slug: 'engine-degreaser-1l',
    category: 'chemical',
    name: 'Motor Yıkama Köpüğü — Yağ Sökücü 1L',
    price: 269,
    image: 'https://images.pexels.com/photos/4140943/pexels-photo-4140943.jpeg?auto=compress&cs=tinysrgb&w=800',
    shortDescription: 'Premium deri koltuk bakım kremi — besler, yumuşatır, UV\'den korur.',
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
    stock: 60,
    sku: 'CH-ENG1L',
    attributes: {
      Hacim: '1 Litre',
      Tip: 'Aktif köpük',
      Profesyonel: 'Atölye seviyesinde formül',
    },
    active: true,
  },
  {
    id: 'ch-006',
    slug: 'detailing-kit-starter',
    category: 'chemical',
    name: 'Oto Bakım Başlangıç Seti — 4 Ürün Paket',
    price: 599,
    oldPrice: 826,
    image: 'https://images.pexels.com/photos/20042048/pexels-photo-20042048.jpeg?auto=compress&cs=tinysrgb&w=800',
    shortDescription: 'Premium deri koltuk bakım kremi — besler, yumuşatır, UV\'den korur.',
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
    stock: 30,
    sku: 'CH-SET4',
    attributes: {
      İçerik: '4 ürün + mikrofiber set',
      Tasarruf: '%28 paket indirimi',
      Hediyelik: 'Şık kutu',
    },
    badges: ['discount', 'best-seller', 'premium'],
    active: true,
  },
]

/* -------------------- Oto Çantası / Organizer (6) -------------------- */

export const BAGS: SimpleProduct[] = [
  {
    id: 'bg-001',
    slug: 'bagaj-organizer-deluxe',
    category: 'bag',
    name: 'Bagaj Organizer — Deluxe Katlanabilir 3 Bölmeli',
    price: 449,
    oldPrice: 599,
    image: 'https://images.pexels.com/photos/17000836/pexels-photo-17000836.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 70,
    sku: 'BG-DLX',
    attributes: {
      Boyut: '60 × 38 × 30 cm',
      Malzeme: '1680D Oxford + sert panel',
      Bölme: '3 ana + 4 yan cep',
      'Su Geçirmez': 'Evet — iç taban',
    },
    badges: ['best-seller', 'discount'],
    active: true,
  },
  {
    id: 'bg-002',
    slug: 'koltuk-arkasi-organizer',
    category: 'bag',
    name: 'Koltuk Arkası Organizer — Tablet & Çocuk Eşyaları',
    price: 199,
    image: 'https://images.unsplash.com/photo-1602161755661-3781cddac355?auto=format&w=800&q=85',
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
    stock: 90,
    sku: 'BG-KOR',
    attributes: {
      Tablet: 'Maks 10 inç',
      Cep: '6 ana cep + termal',
      Bağlantı: 'Başlık + alt kemer',
    },
    badges: ['best-seller'],
    active: true,
  },
  {
    id: 'bg-003',
    slug: 'yan-cep-konsol-organizer',
    category: 'bag',
    name: "Yan Cep Konsol Organizer — Deri Görünümlü 2'li",
    price: 159,
    image: 'https://images.unsplash.com/photo-1722843646530-0ec625b8e34f?auto=format&w=800&q=85',
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
    stock: 110,
    sku: 'BG-YCN',
    attributes: {
      Adet: '2 (sürücü + yolcu)',
      Malzeme: 'PU Deri kaplama',
      Renk: 'Siyah',
    },
    active: true,
  },
  {
    id: 'bg-004',
    slug: 'cop-torbasi-magnetic',
    category: 'bag',
    name: 'Manyetik Mini Çöp Torbası — Konsol Yanına',
    price: 89,
    image: 'https://images.pexels.com/photos/12997254/pexels-photo-12997254.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 130,
    sku: 'BG-COP',
    attributes: {
      Hacim: '1 Litre',
      Bağlantı: 'Manyetik + bant adaptör',
      Koku: 'Kapaklı — yayılmaz',
    },
    badges: ['new'],
    active: true,
  },
  {
    id: 'bg-005',
    slug: 'bagaj-net-fileli',
    category: 'bag',
    name: 'Bagaj Eşya Tutucu File — Esnek Elastik',
    price: 119,
    image: 'https://images.unsplash.com/photo-1768671496923-e43c94b5f60f?auto=format&w=800&q=85',
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
    stock: 80,
    sku: 'BG-NET',
    attributes: {
      Boyut: '90 × 70 cm',
      Kapasite: '50 kg',
      Elastik: 'Esnek streç ağ',
    },
    active: true,
  },
  {
    id: 'bg-006',
    slug: 'piknik-bagaj-cantasi',
    category: 'bag',
    name: 'Piknik / Termal Bagaj Çantası — 25 Litre',
    price: 299,
    image: 'https://images.pexels.com/photos/27528407/pexels-photo-27528407.jpeg?auto=compress&cs=tinysrgb&w=800',
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
    stock: 50,
    sku: 'BG-PKN',
    attributes: {
      Hacim: '25 Litre',
      Yalıtım: 'Soğuk 6 saat / Sıcak 4 saat',
      Su: 'Su geçirmez dış kumaş',
    },
    badges: ['premium'],
    active: true,
  },
]

/* -------------------- Toplu Erişim & Yardımcılar -------------------- */

export const ALL_SIMPLE_PRODUCTS: SimpleProduct[] = [
  ...SCREEN_PROTECTORS,
  ...PERFUMES,
  ...CHEMICALS,
  ...BAGS,
]

export function getProductsByCategory(category: SimpleCategory): SimpleProduct[] {
  return ALL_SIMPLE_PRODUCTS.filter((p) => p.category === category && p.active)
}

export function getProductBySlug(slug: string): SimpleProduct | null {
  return ALL_SIMPLE_PRODUCTS.find((p) => p.slug === slug && p.active) ?? null
}

export function getProductById(id: string): SimpleProduct | null {
  return ALL_SIMPLE_PRODUCTS.find((p) => p.id === id) ?? null
}

/** Kategori meta — UI için (icon, başlık, alt başlık, görsel) */
export const CATEGORY_META: Record<SimpleCategory, {
  name: string
  description: string
  emoji: string
  href: string
  /** Kategori showcase'inde kullanılan büyük foto (Pexels CDN). */
  image: string
}> = {
  'screen-protector': {
    name: 'Multimedya Ekran Koruyucu',
    description: '9H temperli cam ile multimedya, navigasyon ve gösterge panel ekranlarınızı koruyun',
    emoji: '📱',
    href: '/urunler/ekran-koruyucu',
    image: 'https://images.pexels.com/photos/8305346/pexels-photo-8305346.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  perfume: {
    name: 'Oto Parfüm',
    description: 'Premium klips ve sprey oto parfümleri — kalıcı, alerjen-test edilmiş kokular',
    emoji: '🌸',
    href: '/urunler/parfum',
    image: 'https://images.pexels.com/photos/11711835/pexels-photo-11711835.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  chemical: {
    name: 'Oto Kimya & Bakım',
    description: 'İç temizleyici, cam temizleyici, deri bakım ve detay temizlik ürünleri',
    emoji: '🧪',
    href: '/urunler/kimya',
    image: 'https://images.pexels.com/photos/4488636/pexels-photo-4488636.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
  bag: {
    name: 'Çanta & Organizer',
    description: 'Bagaj organizer, koltuk arkası, yan cep — aracın içinde her şey düzenli',
    emoji: '🎒',
    href: '/urunler/canta',
    image: 'https://images.pexels.com/photos/6873090/pexels-photo-6873090.jpeg?auto=compress&cs=tinysrgb&w=1200',
  },
}

/** SimpleCategory → ProductCategory (db.ts) eşleştirme — özdeş */
export function toProductCategory(c: SimpleCategory): ProductCategory {
  return c
}
