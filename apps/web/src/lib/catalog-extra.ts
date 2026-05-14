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
    image: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&q=85',
    shortDescription: 'Çizilmeye dirençli 9H temperli cam ekran koruyucu, parmak izi karşıtı, ultra ince.',
    description: `Aracınızın multimedya ekranını günlük çizilmeden, toz birikimine ve hafif darbelere karşı korur. 9H sertlikteki temperli cam, anahtar ve toka gibi metal nesnelerin çiziklerine dayanıklıdır.

**Öne çıkan özellikler:**
- 9H sertlik (çelik takım kalitesinde)
- 0.33mm ince — orijinal dokunmatik hassasiyeti %100 korur
- Oleophobic kaplama — parmak izi tutmaz, kolay silinir
- HD şeffaflık — ekran rengi ve parlaklığı değişmez
- Yapışkanlı silikon taban — köşeden açılma yok
- Türkçe kurulum kılavuzu + mikrofiber bez + temizleme spreyi dahil

Çoğu 9 inç Android multimedya navigasyon ekranıyla uyumludur (9.2", 9.3", 9.5" dahil — kurulum öncesi ekran ölçüsünü kontrol edin).`,
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
    image: 'https://images.unsplash.com/photo-1551830820-330a71b99659?w=800&q=85',
    shortDescription: '10 inç sınıfı multimedya ekranları için 9H sertliğinde premium cam koruyucu.',
    description: `10 inç multimedya ekranlar için tasarlanmış 9H sertliğinde temperli cam ekran koruyucu. Audi, BMW, Mercedes, Tesla Model 3 ve benzeri araçların büyük navigasyon ekranlarıyla uyumludur.

**Teknik:**
- 9H temperli cam, 0.33mm
- Anti-glare opsiyonel (parlama önleyici)
- Tam ekran kapsama (edge-to-edge)
- HD geçirgenlik, dokunmatik hassasiyet korunur
- Kolay yerleştirme — havasız yapışan jel formül`,
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
    image: 'https://images.unsplash.com/photo-1543465077-db45d34b88a5?w=800&q=85',
    shortDescription: 'Mat yüzey, güneş yansıması yok. Parmak izi tutmaz, gündüz kullanımı için ideal.',
    description: `Cam parlaklığı yerine mat yüzey tercih edenler için. Doğrudan güneş ışığı altında bile ekranın net okunmasını sağlar. Mat doku parmak izi göstermez ve uzun yolculuklarda göz yorgunluğunu azaltır.

Polikarbonat film tabanlı, 0.2mm ince, hassasiyet kaybı yoktur.`,
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
    image: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=85',
    shortDescription: 'Yandan bakışı engelleyen privacy filtreli ekran koruyucu — sürücü hariç kimse göremez.',
    description: `±30° dışından bakana ekran siyah görünür. Yolcular veya yan araçlardakiler navigasyon/mesaj içeriğini göremez. Aynı zamanda 9H sertlik ile çizilmeye karşı korur.

Privacy filtreli temperli cam, 4 katmanlı yapı.`,
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
    image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&q=85',
    shortDescription: 'Sürücü gösterge paneli için kesilmiş özel ekran koruyucu — dijital kombi koruması.',
    description: `Dijital gösterge paneliniz (sanal kokpit / TFT kombi) için araca özel kesilmiş ekran koruyucu. Hassas dokunmatik kontrol gerektirmediği için maksimum 9H sertlik kullanılmıştır. UV filtreli — güneşte renk solması olmaz.

Marka/model belirtin, uyumlu kesim olduğundan emin olalım.`,
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
    image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&q=85',
    shortDescription: 'Premium araç sınıfı 12.3 inç multimedya/dijital ekran için 9H temperli cam.',
    description: `Mercedes MBUX, BMW iDrive 8, Tesla Model 3/Y, Audi MMI gibi 12.3+ inç büyük ekran sistemleri için.

- 9H sertlik, 0.33mm
- Anti-fingerprint kaplama
- HD geçirgenlik (%97)
- Ekran kenarı silikon koruyucu çerçeve (opsiyonel ek)
- 12.3" / 12.8" / 13" varyasyonlu — sipariş öncesi ekran ölçüsünü iletin`,
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
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=85',
    shortDescription: 'Doğu kökenli oud + sandal ağacı + amber. Lüks, erkeksi, kalıcı oda kokusu hissi.',
    description: `**Notalar:** üst → bergamot, biber · kalp → oud, sandal ağacı · dip → amber, vanil

Premium klips tasarımı: havalandırma ızgarasına tek dokunuşla takılır, ayarlanabilir kapakla koku şiddeti ayarlanır. Tam dolu hâlde 6-8 hafta kullanım. Yedek esans şişesi ile yenilenebilir (ayrı satılır).

İçerik: 8ml zarif cam şişe + metal klips + alkolsüz, alerjen-test edilmiş esans.`,
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
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=85',
    shortDescription: 'Bergamot, limon, deniz tuzu. Ferah, gündüz aracı için ideal sprey formül.',
    description: `**Notalar:** üst → bergamot, mandalina · kalp → deniz tuzu, beyaz çiçek · dip → misk, sedir

100ml sprey şişe. Aracın koltuk altı, paspas üstü ve gösterge paneline ölçülü sıkma ile kalıcı taze koku. Yağ bazlı değil, leke yapmaz.`,
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
    image: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=85',
    shortDescription: 'Hakiki deri + tütün yaprağı. Lüks araç içi hissi.',
    description: `**Notalar:** deri, tütün, vetiver, dumanlı vanilya

Premium araçların orijinal "yeni deri kokusu" hissini taklit eder. Klips formatında 8ml cam şişe. Mercedes, BMW, Audi gibi premium araçlar için tercih edilir.`,
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
    image: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=85',
    shortDescription: 'Vanilya, beyaz şeker, hindistancevizi. Tatlı, sıcak, kadınsı.',
    description: `**Notalar:** vanilya, hindistancevizi, beyaz şeker, sandal ağacı

Sıcak ve hoş, ev kokusu hissi veren tatlı bir kompozisyon. Klips, 8ml.`,
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
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=800&q=85',
    shortDescription: 'Deniz tuzu, çam, beyaz çiçek. Temiz, ferah, yaz hissi.',
    description: `**Notalar:** deniz tuzu, çam, beyaz çiçek, beyaz misk

Yaz aylarında klimayla birlikte aktive olan ferah formül. Hassas burunlar için ideal — agresif değil, dingin.`,
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
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=85',
    shortDescription: '3 farklı koku tek pakette — Oud + Deri & Tütün + Vanilya. Hediyelik şık kutu.',
    description: `Üç en sevilen kokumuzu özel hediyelik kutuda. Mevsimine ve havana göre değiştirebilirsin:
- **Midnight Oud** (gece, gala)
- **Leather & Tobacco** (klasik, lüks)
- **Vanilla Cream** (gündüz, tatlı)

Her biri 8ml klips formatta. Toplam 3×8ml = 24ml premium parfüm.`,
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
    image: 'https://images.unsplash.com/photo-1607301406259-dfb186e15de8?w=800&q=85',
    shortDescription: 'Tek üründe iç plastik, deri, vinyl, tekstil temizliği. Mat finiş bırakır, parlatma yapmaz.',
    description: `Araç iç mekânın en zor yerleri için profesyonel formül:
- Konsol plastikleri ve gösterge paneli — toz + parmak izi
- Deri ve vinyl koltuk — leke + ten yağı
- Kapı paneli — kahve/kola lekesi
- Direksiyon — el teri yağı

pH dengeli, alkol içermez, deri bozulması yapmaz. **Mat finiş** bırakır — "yağlı parlaklık" değildir, orijinal görünümü korur.

Kullanım: yüzeye 20-25cm mesafeden sık, mikrofiberle ovala, kuru bezle parlat. Üretici sertifikalı, otomotiv profesyonelleri kullanır.`,
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
    image: 'https://images.unsplash.com/photo-1532974297617-c0f05fe48bff?w=800&q=85',
    shortDescription: 'Boyaya zarar vermeden asfalt katranı, çam reçinesi, kuş pisliği söker.',
    description: `Yaz aylarında en sık karşılaşılan kabuslar:
- Yol katranı (siyah lekeler)
- Çam reçinesi (camda, kaputta)
- Kuş pisliği (boya yiyici, hızlı temizle)
- Böcek kalıntıları

Solvent bazlı ama orijinal boyayı **yormaz**. 5 dakika bekle, sünger/mikrofiberle al, su ile yıka. Wax/seal kaplamayı zayıflatabilir — sonrasında tekrar koruyucu önerilir.`,
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
    image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&q=85',
    shortDescription: 'Cam yüzeylerde sıfır çizgi, sıfır leke. Tütün dumanı kalıntısı + nikotin sarı leke söker.',
    description: `Amonyak içeren ama tente-tinted cam ile uyumlu formül. Kuruma izi bırakmaz.
- İç camlar (özellikle tütün kullanılan araçlarda nikotin tabakası)
- Dış camlar (yağmur izi, kireç lekesi)
- Aynalar (yan + iç dikiz)
- Tinting'li camlar — agresif tutmaz, film sökmez

Kullanım: 2-3 sıkma, mikrofiber havlu ile düz hareketlerle sil. Ikinci kuru havlu ile parlat.`,
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
    image: 'https://images.unsplash.com/photo-1612965110667-4175024b0dcc?w=800&q=85',
    shortDescription: 'Deri koltuk + direksiyon + vites topuzu. Çatlama önler, nemlendirir, mat finiş.',
    description: `Doğal lanolin + jojoba yağı bazlı krem formül. Aylık bakımda deriyi yumuşatır, çatlama ve solmayı önler.

**Uygulama:** Önce iç temizleyici ile yüzeyi temizle. Krem'i bezle ince film olarak sür. 10 dakika emdiren bekle. Kuru mikrofiberle ovala. Saatler içinde nem dengeli, mat, esnek bir deri yüzey.

Tüm doğal/sentetik deri uyumlu. Renkli derilere çekinme — renk değişimi yapmaz.`,
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
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=85',
    shortDescription: 'Motor bloğu ve çevresi için aktif köpük yağ sökücü. Profesyonel atölye formülü.',
    description: `Bloktaki birikmiş yağ, gres, kirleri çözer. Köpük formundadır — dikey yüzeyde tutunur, akmaz.

**Önemli:** Motor soğukken uygulanır. Elektronik aksamı (alternatör, fişler, ECU) suya karşı koru. 5-10 dakika bekle, basınçlı su ile durula.

Atölye/oto-yıkamacı formülü; ev kullanımında **dikkatli olun**. Eldivenle çalışın.`,
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
    image: 'https://images.unsplash.com/photo-1610461888750-10bfc601b874?w=800&q=85',
    shortDescription: 'İç temizleyici + Cam temizleyici + Deri kremi + Mikrofiber bez set. %28 paket indirimi.',
    description: `Aracı kendi başına detaylı bakım yapmak isteyenler için tam başlangıç paketi:

1. **İç Temizleyici 500ml** — plastik/deri/vinyl
2. **Cam Temizleyici 750ml** — çizgisiz finish
3. **Deri Bakım Kremi 250ml** — koltuk besleme
4. **3'lü Premium Mikrofiber Bez** — 40×40cm

Toplam 826₺ değerinde — sette **599₺**. Hediyelik tasarım kutu içinde. Yeni araç sahibi olan birine ideal hediye.`,
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
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=85',
    shortDescription: 'Bagajda eşyaların kaymasını engeller. 3 ayrı bölme, katlanabilir, su geçirmez taban.',
    description: `Bagajda **yiyecek torbası, çamaşır, alışveriş, çocuk eşyası** ayrı ayrı dursun, her dönüşte devrilmesin.

**Özellikler:**
- 60 × 38 × 30 cm — orta ve büyük bagajlarda ideal
- Su geçirmez 1680D oxford kumaş + sert iç panel
- 3 ayrı bölme + 4 küçük yan cep
- Yan tutamaklar — bütün organizer'ı tek hareketle çıkarın
- Yan velcro fileler — alışveriş torbası askı yeri
- Boş durumda **katlanır** → yer kaplamaz

İç panel su geçirmez — yemek lekesi, içecek dökülmesi temizlenebilir.`,
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
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&q=85',
    shortDescription: 'Ön koltuk arkasına geçer. Tablet tutucu + 6 cep. Çocuklu aile için kurtarıcı.',
    description: `Arka koltuktaki çocuklar için **tüm eşyaları bir yerde**: tablet, kitap, biberon, ıslak mendil, oyuncak.

- Üst kısımda tablet tutucu (10 inç'e kadar) — film izlerken eller boş kalır
- 6 farklı boyutta cep (büyük → küçük)
- Termal cep — biberon sıcak, içecek soğuk
- Bağlama: ön koltuk başlığı + alttan çapraz kemer (sallanmaz)
- Yıkanabilir, koku tutmaz

Standart araç koltuklarına %95 uyumlu. Spor koltuklar için ölçü iletilebilir.`,
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
    image: 'https://images.unsplash.com/photo-1564422170194-896b89110ef8?w=800&q=85',
    shortDescription: 'Ön koltuk yanına geçer. Telefon, cüzdan, anahtar düşmesin. PU deri, 2 adet (sürücü + yolcu).',
    description: `Ön koltuk ile orta konsol arasındaki **boşluğa düşen telefon/anahtar** sorununu çözer. 2 adet (sürücü + yolcu) PU deri kaplamalı organizer.

- Telefon (büyük telefonlar uyumlu), kart, anahtar, kalem cebi
- USB-C/Lightning kablo deliği — şarj kabloları organizeli geçer
- Esnek silikon iç çerçeve — koltuk hareketinde sıkışmaz
- 5 dakikada montaj`,
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
    image: 'https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=800&q=85',
    shortDescription: 'Manyetik tutuculu mini çöp torbası. Araç içi temiz kalsın.',
    description: `Konsol yan yüzeyine manyetik olarak yapışır (metal yüzey gerekir, plastik bölgelere çift taraflı bant adaptör dahil).

- 1 litre kapasite
- Açılır kapaklı — koku yayılmaz
- Yıkanabilir iç astar
- Tek hareketle çıkar, çöpü dök, geri yapıştır

Yolculukta atılan kraker paketi, ıslak mendil, peçete için ideal.`,
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
    image: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=85',
    shortDescription: 'Bagajda eşyaların kaymasını engelleyen elastik file ağ.',
    description: `Bagaj tabanına 4 ankraj noktasından gerilir. 90 × 70 cm elastik file, ağır eşyayı bile sabit tutar.

- Üzerine adapte oran 50 kg'a kadar
- Streç elastik — küçük eşya 1 kişilik koltuk üstü pakete kadar tutar
- 4 plastik klips dahil
- Aracın bagaj kancalarına evrensel uyum`,
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
    image: 'https://images.unsplash.com/photo-1545194445-dddb8f4487c6?w=800&q=85',
    shortDescription: 'Termal yalıtımlı 25L bagaj çantası. Piknik, kamp, market alışverişi.',
    description: `25 litre termal yalıtımlı çanta. Soğuk içecekler 6 saat soğuk kalır (donmuş paket ile). Sıcak yemek 4 saat sıcak.

- Su geçirmez dış kumaş
- Alüminyum folyo iç astar
- Fermuarlı ana bölme + 2 yan cep
- Omuz askısı + üst tutamaç
- Boş hacim 28L, dolu hâlde 25L`,
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

/** Kategori meta — UI için (icon, başlık, alt başlık) */
export const CATEGORY_META: Record<SimpleCategory, {
  name: string
  description: string
  emoji: string
  href: string
}> = {
  'screen-protector': {
    name: 'Multimedya Ekran Koruyucu',
    description: '9H temperli cam ile multimedya, navigasyon ve gösterge panel ekranlarınızı koruyun',
    emoji: '📱',
    href: '/urunler/ekran-koruyucu',
  },
  perfume: {
    name: 'Oto Parfüm',
    description: 'Premium klips ve sprey oto parfümleri — kalıcı, alerjen-test edilmiş kokular',
    emoji: '🌸',
    href: '/urunler/parfum',
  },
  chemical: {
    name: 'Oto Kimya & Bakım',
    description: 'İç temizleyici, cam temizleyici, deri bakım ve detay temizlik ürünleri',
    emoji: '🧪',
    href: '/urunler/kimya',
  },
  bag: {
    name: 'Çanta & Organizer',
    description: 'Bagaj organizer, koltuk arkası, yan cep — aracın içinde her şey düzenli',
    emoji: '🎒',
    href: '/urunler/canta',
  },
}

/** SimpleCategory → ProductCategory (db.ts) eşleştirme — özdeş */
export function toProductCategory(c: SimpleCategory): ProductCategory {
  return c
}
