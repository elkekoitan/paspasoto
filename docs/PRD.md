# PaspasOto.com — Detaylı PRD & Uygulama Planı

> **Not:** Plan onaylandıktan sonra bu PRD `C:\Users\qw\Desktop\PaspasOto.com\PRD.md` dosyasına kopyalanacak ve repo'da `docs/PRD.md` olarak versiyonlanacak.

---

## 0. Yönetici Özeti (TL;DR)

PaspasOto.com, Konya merkezli bir KOBİ için kurulacak; **araca özel 3D havuzlu oto paspas** satışı yapan, kullanıcının paspas + kenarlık + logo aksesuarı kombinasyonunu adım adım kişiselleştirdiği, sipariş sonrası **üretim ve ödeme durumunu şeffaf şekilde takip edebildiği** premium e-ticaret platformudur. V1'de PSP entegrasyonu yoktur (havale/kapıda + manuel ödeme onayı). Site aynı zamanda **mobil cihazlara kısayol olarak kurulabilen bir PWA**'dır. Astro 5 + Strapi 5 + PostgreSQL + MinIO stack'i ile Coolify üzerinde self-hosted deploy edilecek (185.255.95.111).

**Başarı ölçütleri:**
- İlk ay: 50+ sipariş, terk edilen sepet < %40, sipariş takip sayfası kullanım > %80.
- Lighthouse mobil ≥ 92 (Performance, Accessibility, SEO, Best Practices).
- Müşteri "siparişim ne durumda?" çağrısında **%70 azalma**.
- 3 ay içinde Google'da `[marka] [model] paspas` aramalarının ilk sayfasında 30+ uzun-kuyruk anahtar kelime.

---

## 1. Bağlam ve Vizyon

### 1.1 Müşteri Profili (KOBİ)
- **Konum:** Konya, küçük atölye.
- **Üretim kapasitesi:** günlük ~30-60 set tahmini.
- **Mevcut süreç:** WhatsApp + telefon → not defteri → üretim → kargo. Sipariş takibi şeffaf değil.
- **Çalışan sayısı:** 2-5 kişi (panel kullanıcıları sınırlı, sezgisel arayüz şart).

### 1.2 Pazardaki Boşluk
Türkiye'deki oto paspas siteleri genelde:
- Theme'i kalabalık ve görsel olarak amatör.
- Konfigüratör adımları kafa karıştırıcı (renk seçimi metin tabanlı).
- Sipariş sonrası süreç opak.
- Mobil deneyim zayıf, PWA/native his yok.

PaspasOto.com bu noktalarda **butik & şeffaf & native-his** ile diferansiyasyon kuracak.

### 1.3 Vizyon Cümlesi
> "Aracına 100 saat ayıran insanın, paspasını da 5 dakikada kişiselleştirip atölyemizden kapısına kadar şeffaf bir yolculukla takip ettiği platform."

---

## 2. Ürün Konsepti

### 2.1 Ürün Yelpazesi (V1)
| Kategori | Detay |
|---|---|
| **3D Havuzlu Oto Paspas** | Ana ürün. Araç marka+model+yıl şablonuna göre kalıplanır. |
| **Set Tipleri** | (a) Sürücü+Yolcu (2'li), (b) 4'lü Set (ön+arka), (c) 4'lü + Bagaj |
| **Paspas Zemin Rengi** | 10: Siyah, Gri, Füme, Mavi, Taba, Kırmızı, Kahve, Bordo, Bej, Turuncu Taba |
| **Kenarlık Rengi** | 18: Kahve, Taba, Krem, Yeşil, Sarı, Turuncu, Kırmızı, Mor, Lacivert, Koyu Mavi, Turkuaz, Gri, Füme, Siyah, Bordo + 3 ek |
| **Logo Aksesuarı (Paspas Amblemi)** | **Paspasın üzerine sabitlenen marka amblemi/logosu** (Audi, BMW, VW, Hyundai, Skoda, Ford, Peugeot, Mercedes, Renault, Fiat, Toyota, Honda, Opel, Volvo, Citroen, Seat, Dacia + üstü). Metal/plastik plaka şeklinde, paspasın üst kısmına klips veya yapıştırma ile entegre edilir. Görseldeki her bir parça paspasa monte edilen amblemdir, anahtarlık değildir. |
| **Topukluk (Heel Pad)** | Sürücü paspasının topuk bölgesine entegre edilen, aşınmayı önleyen + premium görünüm sağlayan dokulu/metal/karbon ped. **Renk ve doku seçimli** (mevcut paspas görsellerinde her renk için ayrı topukluk dokusu var: siyah noktalı, karbon, beyaz noktalı, antrasit, mavi noktalı, kırmızı noktalı vb.). Standart olarak sürücü tarafına eklenir; opsiyonel olarak yolcu tarafına da. |
| **(V1.5) Bagaj Paspası ek** | Tek başına satış (yine paspas kategorisinde) |

### 2.2 Fiyat Bandı (örnek, Strapi'den yönetilir)
- Sürücü+Yolcu: 1.490 TL
- 4'lü Set: 1.990 TL
- 4'lü + Bagaj: 2.490 TL
- Logo aksesuarı: +150 TL/adet
- Topukluk (sürücü tarafı): standart (dahil) — V1
- Topukluk premium doku (karbon, metal vb.): +100-200 TL (Strapi'de yönetilir)
- Topukluk yolcu tarafına ek: +100 TL
- Premium kenarlık (örn. Bordo, Lacivert): 0 TL fark V1 (modifier alanı modelde mevcut).

---

## 3. Hedef Kitle ve Personalar

### 3.1 Persona 1 — "Mehmet, 34, Beyaz Yakalı"
- Yeni 2. el BMW 3.20 sahibi. Aracını seviyor, premium aksesuar arıyor.
- Mobilden alışveriş yapar, marka algısına önem verir.
- Beklenti: net görsel + hızlı sipariş + güven hissi (garanti, iade, KVKK).

### 3.2 Persona 2 — "Ayşe, 41, Aile Aracı"
- Dacia Duster, çocuklar arabayı kirletiyor, kolay yıkanabilir paspas istiyor.
- Fiyat hassas, bej/krem kombinasyon arıyor.
- Beklenti: anlaşılır anlatım + havale ile ödeme + telefon desteği.

### 3.3 Persona 3 — "Kaan, 28, Galerici"
- Bayilik talebi olabilir. V1'de "Toptan Bayilik" form, V2'de B2B paneli.

### 3.4 Persona 4 — "Operatör Hasan, KOBİ Sahibi"
- Telefondan + masaüstünden Strapi panele girer.
- Görmek istediği: "Bugün üretilecek X sipariş, ödemesi gelmemiş Y sipariş, kargoya gidecek Z sipariş."

---

## 4. Bilgi Mimarisi (Site Haritası)

```
/                                      Anasayfa
/konfigurator                          Konfigüratör (boş başlangıç)
/konfigurator/[brand]                  Marka önseçili
/konfigurator/[brand]/[model]          Marka+model SEO landing (SSG)
/markalar                              Tüm markalar grid
/markalar/[brand]                      Marka detay + model listesi
/galeri                                Müşteri kombinleri (Instagram-like)
/yorumlar                              Müşteri yorumları (filtrelenebilir)
/blog                                  Blog liste
/blog/[slug]                           Blog detay
/hakkimizda                            Atölye + üretim süreci + garanti
/iletisim                              İletişim + WhatsApp + harita + form
/kargo-iade                            Kargo + iade politikaları
/sss                                   Sıkça Sorulanlar (akordiyon)
/sepet                                 Sepet
/odeme                                 Checkout (PSP yok, havale + kapıda)
/siparis/onay/[orderNo]                Sipariş alındı
/siparis-takip                         Takip giriş (sipariş no + GSM)
/siparis-takip/[token]                 Takip detay (timeline + ödeme)
/hesabim                               (V1.5) Kullanıcı hesabı
/giris  /kayit                         (V1.5)
/sifre-sifirla                         (V1.5)
/kvkk-aydinlatma                       KVKK metni
/gizlilik-politikasi                   Gizlilik
/mesafeli-satis-sozlesmesi             Hukuki
/cerez-politikasi                      Çerez
/manifest.webmanifest, /sw.js          PWA
/admin (subdomain)                     Strapi admin
```

---

## 5. Kullanıcı Akışları (User Flows)

### 5.1 Birincil Akış: Sipariş
```
Anasayfa → "Konfigüratörü Başlat" CTA
  → 1. Marka seç (logo grid, arama kutusu)
  → 2. Model & yıl (chassis kodu görünür)
  → 3. Set tipi (sürücü+yolcu / 4'lü / 4'lü+bagaj)
  → 4. Paspas zemin rengi (10 swatch)
  → 5. Kenarlık rengi (18 swatch)
  → 6. Topukluk (sürücü standart, doku seçimi, yolcu tarafı opsiyonel)
  → 7. Logo aksesuarı (marka logosu / istemiyorum)
  → Özet kartı + "Sepete Ekle"
  → Sepet
  → Checkout (Ad, GSM, e-posta, fatura/teslimat adresi, ödeme yöntemi seçimi: Havale / Kapıda)
  → Onay sayfası: orderNo + takip linki + IBAN bilgileri (havale ise)
  → E-posta + (V1.5 SMS) bildirim
```

### 5.2 İkincil Akış: Sipariş Takip
```
/siparis-takip
  → orderNo + GSM son 4 hane
  → token üretilir, /siparis-takip/[token]'a yönlendirilir
  → Timeline + ödeme durumu + dekont yükleme
```

### 5.3 Operatör Akışı (Admin)
```
admin.paspasoto.com
  → Sipariş Kanban (sütunlar: Yeni / Ödeme Bekliyor / Üretimde / Kalite / Kargo / Teslim / İptal)
  → Sipariş kartına tıkla
  → "Ödeme Onayla", "Üretime Al", "Kalite Geçti", "Kargoya Verildi" (kargo no + firma) butonları
  → Her tıklamada lifecycle hook → OrderStatusEvent kaydı + müşteriye e-posta
```

### 5.4 Edge Case Akışları
- **Sepette ürün stokta değil:** Strapi `inStock=false` ise kompozit konfigürasyon engellenir, "Bu kombinasyon geçici olarak hazırlanamıyor" mesajı.
- **Sipariş POST hata:** form değerleri korunur, kullanıcıya retryable hata mesajı.
- **Token geçersiz:** "Sipariş bulunamadı veya link süresi dolmuş, lütfen tekrar giriş yapın" → /siparis-takip'e yönlendir.
- **Dekont 5 MB üstü:** Frontend client-side kontrol, image compression (browser-image-compression).
- **WhatsApp linki kapalı saatte:** Bot mesajı: "İletişim saatlerimiz dışındasınız, sabah 09:00 sonrası yanıtlanacaksınız."

---

## 6. Özellik Detayları

### 6.1 Konfigüratör (Kritik Bileşen)

**Yapı:** 7 adımlı stepper, sol panel sticky preview (60/40 split), mobilde drawer preview.

**Adım 1 — Marka:**
- Logo grid (12 sütun desktop, 4 mobil), arama input ile filtre.
- "Popüler markalar" + "Tümünü gör".
- Klik → otomatik adım 2'ye geçiş + URL `?brand=bmw` (geri tuşu işler).

**Adım 2 — Model & Yıl:**
- Liste: "3 Serisi (F30, 2012-2018)", "3 Serisi (G20, 2019+)" gibi.
- Searchable combobox (cmdk benzeri).
- Model yoksa "Modelinizi bulamadınız mı? WhatsApp'tan iletin" CTA.

**Adım 3 — Set tipi:**
- 3 büyük kart: görsel + parça sayısı + fiyat.

**Adım 4 — Paspas Zemin Rengi:**
- 10 büyük swatch (Görsel 3'teki dokulu fotoğraflar). Hover'da büyütme, klik'te seçim.
- Seçilen renk ana preview'da paspas zeminine canlı uygulanır (Astro Island, Preact ile reactive).

**Adım 5 — Kenarlık Rengi:**
- 18 swatch, hover/klik aynı.
- Preview'de kenarlık canlı renklenir.

**Adım 6 — Topukluk (Heel Pad):**
- 8-10 doku/renk seçeneği (mevcut görselden çıkarılacak: siyah noktalı, karbon dokulu, beyaz noktalı, antrasit, mavi noktalı, kırmızı noktalı, krem noktalı, metalik gümüş vb.).
- "Standart" (paspas zeminiyle uyumlu, dahil) + "Premium dokular" (+ek ücret).
- Toggle: "Yolcu tarafına da topukluk eklensin mi?" (+100 TL).
- Preview'da paspasın sürücü tarafının üstünde dokulu plaka canlı render edilir.

**Adım 7 — Logo Aksesuarı:**
- Otomatik marka logosu önerilir; "İstemiyorum" + "Başka marka" seçenekleri.
- Adet seçimi (varsayılan 4 set için 4 adet).

**Özet Kartı:**
- Konfigürasyon görseli (yüksek-çözünürlüklü kompozit).
- Detay listesi (Marka/Model, Set, Paspas, Kenarlık, Logo).
- Toplam fiyat + KDV dahil notu.
- "Sepete Ekle" + "Sepete Ekle ve Devam Et" CTA'ları.

**Önizleme Render Stratejisi:**
- V1: Strapi'de her set tipi için "base" PNG (boş paspas), CSS `mask-image` + renk overlay ile zemin rengi, ayrı kenarlık SVG path ile renk overlay. Logo PNG transparan, üzerine yerleştirilir.
- Performans: tüm assetler preload, renk değişimi sadece CSS variable update (re-render yok).
- V2: Three.js / WebGL gerçek 3D rotate.

**Erişilebilirlik:**
- Renk swatch'larında `aria-label="Siyah paspas zemin rengi"`.
- Klavye nav: arrow keys swatch'lar arası, Enter ile seç.
- Renk körü kullanıcılar için renk adı her zaman text olarak gösterilir.

**State Yönetimi:**
- Nanostores `configuratorStore` (marka, model, set, paspas, kenarlık, logo, qty, price).
- LocalStorage persist — sayfa yenilense bile kaldığı yerden devam.
- URL paramlarıyla deep-link (paylaşılabilir konfigürasyon: `?b=bmw&m=3-f30&p=siyah&k=kirmizi&l=bmw`).

### 6.2 Sepet
- Birden fazla farklı konfigürasyon eklenebilir.
- Her sepet item kartında: konfigürasyon thumbnail, detay, miktar +/-, sil.
- Toplam, kargo (sabit veya ücretsiz limit), KDV bilgisi.
- "Sepete Sakla" linki (token-bazlı, V1.5).
- Boş sepet ekranı: "Sepetiniz boş, hemen konfigüratörü başlatın" CTA.

### 6.3 Checkout
- Tek sayfa, 3 bölüm:
  1. Müşteri bilgi (Ad Soyad, GSM, e-posta).
  2. Teslimat adresi (İl/İlçe selectbox, mahalle, açık adres, posta kodu opsiyonel).
  3. Fatura adresi ("Aynı" toggle).
  4. Ödeme yöntemi: Havale (IBAN gösterilir) / Kapıda Ödeme (kargo + ek ücret bilgisi). Strapi `SiteSetting.paymentMethodsEnabled` ile yöneticide aç/kapat.
  5. Sipariş notu (opsiyonel).
  6. KVKK + Mesafeli Satış Sözleşmesi onay checkbox'ları (zorunlu).
- "Siparişi Tamamla" → POST /api/orders → onay sayfası.

### 6.4 Onay Sayfası
- Büyük tik ikonu + "Sipariş alındı, teşekkürler!".
- orderNo (kopyalama butonu) + takip linki QR + paylaşım butonu.
- Havale ise: IBAN + hesap sahibi + açıklama metni ("Açıklamaya sipariş numaranızı yazın").
- "Siparişi Takip Et" CTA.
- E-posta gönderildi onayı.

### 6.5 Sipariş Takip Detay (Diferansiyatör)

**Layout:**
- Üst banner: orderNo + tarih + büyük durum etiketi (renkli badge).
- Sol: dikey timeline (8 adım), aktif olan vurgulu, geçmişler tik+tarih, gelecek olanlar gri.
- Sağ: ödeme durumu kartı + sipariş özeti + kargo bilgisi (varsa).
- Alt: dekont yükleme alanı (havale + ödeme bekliyor durumunda).
- "Soru sormak için WhatsApp" floating button.

**Timeline Adımları (sabit, Strapi enum):**
1. Sipariş Alındı (default, sipariş yaratılınca)
2. Ödeme Onayı Bekleniyor (havale ise) / Ödeme Onaylandı (kapıda veya admin tarafından)
3. Kalıp Hazırlanıyor (admin geçer)
4. Kesim
5. Dikim & Montaj
6. Kalite Kontrol
7. Kargoya Verildi (kargo firma + takip no)
8. Teslim Edildi

Her adımda timestamp + (varsa) admin notu + (kargo adımında) "Kargo takibine git" butonu (Yurtiçi/Aras/MNG'nin tracking URL'leri whitelisted).

**Ödeme Durumu Kartı:**
- Beklemede / Kısmi (X TL alındı, Y TL kaldı) / Tamamlandı / İade.
- Havale ise: IBAN tekrar görünür, dekont yükleme.
- Dekont yüklendi ama onay yoksa: "Ekibimiz dekontunuzu inceliyor."

### 6.6 Dekont Yükleme Akışı
- Drag-drop veya tıkla, jpeg/png/pdf, max 5 MB.
- Client-side resize > 1920px.
- Progress bar.
- POST `/api/orders/:id/payment-proof` with token.
- Strapi: `Payment` kaydı oluşur, `proofImage` mediaya yazılır, admin'e bildirim e-postası.
- Admin onayladığında `paymentStatus = tamamlandi`, müşteriye e-posta + üretim durumu otomatik "Kalıp Hazırlanıyor"a geçer.

### 6.7 Anasayfa Bölümleri
1. **Hero**: full-width, koyu zemin, üst üste paspas görseli, "Aracına özel, atölyemizden kapına" başlığı, "Konfigüratörü Başlat" CTA + "3000+ Araç Modeli" rozet.
2. **USP şeridi**: 4 ikon (100% Araca Özel / Premium Malzeme / 7 Gün İçinde Üretim / Hızlı Kargo).
3. **Marka grid**: 16 popüler marka logosu, "Tümünü gör".
4. **Renk paleti showcase**: 10 paspas + 18 kenarlık dokulu görsel.
5. **Çalışma şekli**: 4 adım infografik (Konfigüre Et → Sipariş Ver → Üretelim → Teslim Al).
6. **Müşteri kombinleri (galeri)**: 8 son fotoğraf, "Tümünü Gör".
7. **Yorumlar**: 3 öne çıkan yorum + ortalama puan.
8. **Blog**: 3 son yazı.
9. **SSS özet**: 5 kritik soru.
10. **CTA banner**: "Hala karar veremedin mi? WhatsApp'tan ekibimize danış."
11. **Footer**: kategoriler, kurumsal, KVKK, sosyal, ödeme yöntemleri, çalışma saatleri, adres + harita link.

### 6.8 Galeri
- Masonry grid, lightbox.
- Filtre: marka, paspas rengi.
- "Sen de fotoğrafını paylaş" CTA — Instagram tag yönlendirme.

### 6.9 Yorumlar
- Strapi'de moderasyonlu (admin onayı sonrası yayınlanır).
- Sipariş tamamlandıktan 7 gün sonra otomatik e-posta: "Yorumunu paylaş" linki (token ile).

### 6.10 Blog
- Strapi'de Markdown/Rich text.
- SEO: `/blog/[slug]`, sitemap'e dahil.
- Konular: "3D Paspas vs Halı Paspas", "Paspas Nasıl Temizlenir?", "Bagaj Havuzu Faydaları", "Kış Aylarında Paspas Bakımı".

---

## 7. PWA (Progressive Web App)

### 7.1 PWA Hedefi
Site, **mobilde Safari/Chrome'dan "Ana Ekrana Ekle" ile native uygulama gibi yüklenebilecek**. Açıldığında splash ekran + standalone mod (URL bar yok), sipariş takip için push notification (V1.5 push, V1'de service worker offline cache).

### 7.2 Manifest (`/manifest.webmanifest`)
```json
{
  "name": "PaspasOto — Aracına Özel 3D Paspas",
  "short_name": "PaspasOto",
  "description": "Aracına özel 3D havuzlu oto paspas. Konfigüre et, atölyemizden kapına gelsin.",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0B0B0F",
  "theme_color": "#0B0B0F",
  "lang": "tr-TR",
  "dir": "ltr",
  "categories": ["shopping", "automotive", "lifestyle"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any" },
    { "src": "/icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" },
    { "src": "/icons/icon-monochrome.png", "sizes": "512x512", "type": "image/png", "purpose": "monochrome" }
  ],
  "screenshots": [
    { "src": "/screens/home-mobile.png", "sizes": "1170x2532", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screens/configurator-mobile.png", "sizes": "1170x2532", "type": "image/png", "form_factor": "narrow" },
    { "src": "/screens/home-desktop.png", "sizes": "1920x1080", "type": "image/png", "form_factor": "wide" }
  ],
  "shortcuts": [
    { "name": "Konfigüratörü Aç", "url": "/konfigurator", "icons": [{ "src": "/icons/short-config.png", "sizes": "96x96" }] },
    { "name": "Sipariş Takip", "url": "/siparis-takip", "icons": [{ "src": "/icons/short-track.png", "sizes": "96x96" }] }
  ],
  "share_target": null,
  "prefer_related_applications": false
}
```

### 7.3 Service Worker
- Plugin: **`@vite-pwa/astro`** (Workbox tabanlı).
- Strateji:
  - **App shell** (HTML temel, CSS, JS, fontlar): `CacheFirst` + revision-based update.
  - **Görseller** (`/images/*`, Strapi `/uploads/*`): `StaleWhileRevalidate`, max 60 entry, 30 gün.
  - **API GET** (`/api/brands`, `/api/mat-colors` vb.): `StaleWhileRevalidate`, max 50 entry, 1 saat.
  - **POST** (sipariş, dekont): network-only, offline ise NetworkOnly + Background Sync queue (V1.5: `bgSyncPlugin`).
- **Offline fallback**: `/offline.html` (Astro pre-built).
- **Update flow**: SW update → "Yeni sürüm hazır, yenile" toast (skipWaiting).

### 7.4 Install Prompt (A2HS)
- Custom install banner: ilk ziyaretten sonra (3 sayfa görüntülemeden sonra), localStorage flag ile bir kez göster, dismiss edilirse 14 gün sustur.
- iOS Safari için manuel talimat overlay'i (Add to Home Screen yönergesi, çünkü beforeinstallprompt iOS'ta yok).
- Dile uygun metin: "PaspasOto'yu uygulama olarak telefonuna ekle, anında erişim ve sipariş takibi."

### 7.5 PWA-Specific Özellikler
- **Standalone display mode**: header'da geri butonu Astro Router ile yönetilir.
- **Splash screen** (Android için manifest, iOS için her cihaz için png).
- **Status bar tema rengi**: `#0B0B0F`.
- **Web Share API**: konfigürasyon paylaşma (`navigator.share`).
- **Geolocation** (V1.5): "En yakın bayi" özelliği.
- **Push Notification** (V1.5): sipariş durumu güncellemesinde push (Web Push API, VAPID keys, Strapi cron worker).
- **Periodic Background Sync** (V1.5): sipariş durumu otomatik check.

### 7.6 PWA Test Kriterleri
- Lighthouse PWA audit yeşil (installable, fast, reliable, engaging).
- Android Chrome → "Install app" prompt görünür.
- iOS Safari → "Share → Add to Home Screen" sonrası standalone açılır.
- Offline modda anasayfa + son ziyaret edilen ürün sayfaları açılabilir.
- Service worker update toast çalışır.

---

## 7.7 Görsel Varlık Stratejisi (Visual Asset Strategy) — KRİTİK

> **Felsefe:** Site sadece bir form doldurma deneyimi değil, "görsel şölen" olacak. Her sayfada yüksek kaliteli, atmosferik, ürünü gerçekçi gösteren görseller olacak. Müşteri seçtiği paspas + kenarlık + logo kombinasyonunu **gerçeğe yakın** görmeden sipariş vermek zorunda kalmayacak.

### 7.7.1 Mevcut Görsel Envanter (Müşteriden Alınan)

| Dosya | İçerik | Sitede Kullanımı |
|---|---|---|
| `WhatsApp Image 2026-05-06 at 12.31.52 (1).jpeg` | 6-7 farklı renkte 3D havuzlu paspas çekimi (üst üste yığılmış: gri, turuncu, beyaz/krem, mavi, kırmızı, siyah, antrasit). **Her paspasın üst kısmında dokulu topukluk plakası mevcut** (siyah noktalı, karbon, beyaz noktalı, mavi noktalı, kırmızı noktalı, krem dokulu varyasyonları görünüyor). | **Anasayfa hero arka planı** + **Renk Showcase** + **Topukluk doku swatch kaynağı** (her topukluk doku ayrı kırpılır) + galerinin ilk grid kartları |
| `WhatsApp Image 2026-05-06 at 12.31.52.jpeg` | **Paspasa monte edilen marka amblemleri** (Audi, BMW, VW, Hyundai, Skoda, Ford, Peugeot, Mercedes…), yüzlerce adet, atölye masasında. Her biri paspasın üst kısmına takılan metal/plastik logo plakası. | **Logo Aksesuarı adımı görseli** + Hakkımızda atölye bölümü + "100+ marka uyumu" bölümü |
| `WhatsApp Image 2026-05-06 at 12.45.09.jpeg` | Resmi paspas rengi (10 swatch) + kenarlık rengi (18 swatch) palet kartı | **Konfigüratör 4. ve 5. adım swatch'ları** (kırpılmış tek tek) + Renk Paleti showcase + ürün detay |

**Not:** Bu görseller mevcut hâliyle yeterli değil; profesyonel hâle getirme adımları aşağıda.

### 7.7.2 Görsel İşleme Pipeline'ı (V1 Lansman İçin)

1. **`12.45.09.jpeg` (Renk paleti)**: 28 swatch'i tek tek kırp (her biri 400x400px, padding ile), arkaplanları temizle, JPEG → AVIF/WebP. Strapi'ye `MatColor.swatchImage` ve `BorderColor.swatchImage` olarak yükle. Bu görseller konfigüratörde 4. ve 5. adımda gerçek doku olarak görünecek.
2. **`12.31.52 (1).jpeg` (Renkli paspas yığını)**: Photoshop/GIMP ile yüksek-kalite restore, gürültü temizle, kontrast/parlaklık dengele, anasayfa hero için 1920x1200 wide crop + mobil portrait crop. Background: koyu/atmospherik.
3. **`12.31.52.jpeg` (Paspas amblemleri)**: Hakkımızda + logo seçim adımı için. Her bir marka amblemi de ayrıca temin edilip cropped → her brand bir thumb. Bu görseldeki ürünler **paspasa monte edilen logo plakalarıdır**, anahtarlık değildir.
4. **Marka logoları (transparan PNG)**: Strapi'de `Brand.logo` alanı için her marka için yüksek çözünürlüklü, transparan zeminde. (Müşteriden talep edilecek veya sitenin "marka kullanım kuralları" çerçevesinde resmi marka kitlerinden alınacak.)

### 7.7.3 Önerilen Profesyonel Çekim Listesi (Lansmanı Boost Etmek İçin)

KOBİ atölyesinde 1 günlük çekim — V1 lansmanı çok daha güçlü kılar:
1. **Hero shots (3-5 adet)**: Paspas yarı dik, dramatik ışık, koyu zemin, yüksek çözünürlük (5K).
2. **Set kompozisyonu**: 4'lü set bir araç içine yerleştirilmiş gerçek araç çekimi (1 BMW + 1 Dacia örnek olarak).
3. **Detay shots (10+)**: Kenarlık dikişi yakın plan, havuz dokusu yakın plan, logo yerleştirme.
4. **Renk varyasyon serisi**: 10 paspas renginin her biri, aynı açıdan, aynı zeminde (renk karşılaştırma için kullanışlı).
5. **Atölye/üretim**: 3-4 fotoğraf — kesim, dikim, kalite kontrol (Hakkımızda + sipariş takip timeline ikonları).
6. **Müşteri/araç çekimi**: Lansman sonrası müşterilerden Instagram'da paylaşım teşvik (galeriye source).

> **V1 başlangıç stratejisi:** Profesyonel çekim yoksa mevcut 3 görsel + AI ile genişletilmiş varyasyonlar (Topaz/Krea/Magnific upscale + relight) kullanılır; lansmandan 2 hafta sonra gerçek çekim eklenir.

### 7.7.4 "Görsel Şölen" Sayfa-Bazlı Plan

| Sayfa | Görsel Konsepti |
|---|---|
| **Anasayfa Hero** | Tam ekran, koyu zemin, üst üste yığılmış renkli paspas görseli (mevcut `12.31.52 (1).jpeg`'in restore edilmiş hâli), üzerinde spotlight ışık efekti, parallax scroll, yan yan rengi değişen başlık. |
| **Anasayfa "Renk Paleti" bölümü** | 10 paspas + 18 kenarlık swatch'ı dokulu, hover'da büyütme, "Tıkla, kombin yap" CTA → konfigüratöre yönlendirir. |
| **Anasayfa "Logo Aksesuarı"** | `12.31.52.jpeg`'deki amblem yığını arkaplan + popüler 12 marka logosu öne çıkarılmış. |
| **Anasayfa "Galeri Sneak Peek"** | 6 müşteri kombinasyonu masonry grid, "Tümünü Gör" CTA. |
| **Konfigüratör Adım 1 (Marka)** | Marka logoları büyük, hover'da renk efekti, arka plan koyu metalik. |
| **Konfigüratör Adım 2 (Model)** | Sol panelde aracın silüet ikonu (varsa) + chassis görseli. |
| **Konfigüratör Adım 4-5 (Renk)** | Swatch'lar **gerçek doku fotoğrafı** (mevcut palet görselinden kırpılmış), hover'da paspas içine canlı uygulanmış preview. |
| **Konfigüratör Adım 6 (Topukluk)** | Topukluk doku swatch'ları (mevcut paspas yığını görselinden kırpılan 8-10 doku), hover'da paspas üst kısmında canlı render + "Yolcu tarafına da ekle" toggle. |
| **Konfigüratör Adım 7 (Logo)** | Anahtarlık yakın çekim, hover'da paspas üzerine yerleştirilmiş canlı önizleme. |
| **Konfigüratör Preview (sticky sol panel)** | Seçilen kombinasyonu gerçek zamanlı render eden compose görseli (CSS variable + mask-image overlay tekniği — PRD §6.1'de detay). |
| **Sipariş Takip Timeline** | Her adımın yanında atölye fotoğrafı thumbnail (kesim, dikim vb.) — müşteri "şu an aracımın paspası kesiliyor" hissini yaşar. |
| **Galeri** | Instagram-stili masonry grid, lightbox, müşteri adı + araç + kombinasyon detayı. |
| **Hakkımızda** | Atölye fotoğrafları, üretim videosu (V1.5), takım fotoğrafı. |
| **Footer** | Renk paleti minik şerit, "Hangi rengi tercih edersin?" interaktif. |

### 7.7.5 Konfigüratör Canlı Preview — Teknik Render Yaklaşımı

V1 için (V2 WebGL'e kadar):
1. **Base layer**: Ürün görseli (set tipine göre). Şeffaf PNG (paspas formu, yükseklik açısı standart).
2. **Color overlay layer**: CSS `mask-image` veya SVG `<mask>` ile paspas zemin alanı maskelenir, üzerine `--mat-color-texture` CSS variable ile doku tile'lanır.
3. **Border overlay layer**: Kenarlık SVG path'i, `--border-color` ile renklenir. Stroke width = paspasın gerçek kenarlık genişliği oranına göre.
4. **Heel pad layer**: Sürücü paspasının üst orta bölgesine seçilen topukluk doku PNG'si overlay edilir; yolcu toggle açık ise yolcu tarafında da. Set tipine göre koordinatlar Strapi `Product.heelPadCoords` json alanında.
5. **Logo layer**: Seçilen logo PNG, paspasın 4 köşesine veya merkeze yerleştirilir (model-bazlı koordinat Strapi'den).
6. **Preview kompoze edildikten sonra** dragdrop lightbox + paylaş butonu (Web Share API).

Performans: tüm asset'ler `<link rel="preload">` ile preload, renk değişimi sadece CSS variable update (DOM re-render yok, < 16ms tepki).

### 7.7.6 Görsel Optimizasyon Standardı

- Format: **AVIF** primary, **WebP** fallback, JPEG legacy.
- Boyutlar (responsive): 320, 640, 960, 1280, 1920, 2560 px.
- Astro `<Image>` component → otomatik srcset.
- Loading: hero `eager + fetchpriority=high`, geri kalan `lazy`.
- Placeholder: blurred `LQIP` (low quality image placeholder, 16x16 base64).
- Sıkıştırma kalite: AVIF 60-70, WebP 80, JPEG 85.
- Hedef ortalama görsel boyut: < 80 KB (hero hariç, hero ≤ 250 KB).

---

## 8. Tasarım Sistemi

### 8.1 Renkler (Tailwind config'e tokenlanacak)
```css
--color-bg: #0B0B0F;          /* Ana zemin */
--color-surface: #15151B;     /* Kart */
--color-surface-2: #1F1F26;   /* Üstü kart */
--color-border: #2A2A33;
--color-text: #F4EDE0;        /* Krem ana metin */
--color-text-muted: #8E8E94;
--color-primary: #D4923A;     /* Amber CTA */
--color-primary-hover: #E5A04A;
--color-success: #22C55E;
--color-warning: #F59E0B;
--color-danger: #EF4444;
--color-info: #3B82F6;
```

### 8.2 Tipografi
- Display: `Satoshi` (variable, 300-900). Fallback: `Inter`.
- Body: `Inter` (300-700).
- Numerik tabular: `Inter` `font-feature-settings: "tnum"`.
- Türkçe diakritik test: Ğ Ç Ş İ Ö Ü ı.
- Boyutlar (rem): 12, 14, 16, 18, 20, 24, 32, 40, 56, 72.

### 8.3 Spacing & Radii
- 4px grid (Tailwind default).
- Radius: sm=6, md=10, lg=14, xl=20, 2xl=28.
- Container: max-w-7xl (1280px), mobile padding 16px, desktop 32px.

### 8.4 Component Library
- **shadcn-style** (Radix primitives + Tailwind), Astro Island olarak Preact bileşenleri:
  - Button, Card, Dialog, Drawer, Sheet, Tabs, Accordion, Combobox, Tooltip, Toast (Sonner), Input, Textarea, Select, Checkbox, Radio, Switch, Skeleton, Badge, Alert, Stepper.
- Storybook (V1.5 opsiyonel) — geliştirme hızı için.

### 8.5 İllüstrasyon & İkon
- İkon: `lucide-react` (Astro içinde inline SVG).
- İllüstrasyon: özel çizim "atölye" hissi (V1'de stok illüstrasyon → V2 özel).

### 8.6 Mikro-etkileşim
- Astro View Transitions (`<ViewTransitions />`).
- Hover: scale 1.02, transition 200ms ease-out.
- Loading: Skeleton + Suspense fallback.
- Form: inline error animasyonu (shake).

### 8.7 Mobil Tasarım
- **Mobil-first** breakpoint: 0-639 sm, 640-1023 md, 1024+ lg.
- Bottom nav (mobil): Anasayfa / Konfigüratör / Sepet / Takip / Hesabım (V1.5).
- Sticky CTA butonu konfigüratör adımlarında.
- Touch target min 44x44px.
- iOS safe area: `env(safe-area-inset-bottom)`.

---

## 9. SEO Stratejisi

### 9.1 URL Yapısı
- Türkçe ASCII slug, 80 karakter max, kebab-case.
- `/markalar/bmw`, `/konfigurator/bmw/3-serisi-f30-2012-2018`.
- Canonical her sayfada.

### 9.2 Meta & Schema
- Her sayfa: `<title>`, `<meta description>`, OG image, OG title/description, Twitter card.
- JSON-LD:
  - **Organization** (footer'da, anasayfada).
  - **LocalBusiness** (Konya, geo, openingHours).
  - **Product** (her marka/model landing).
  - **BreadcrumbList**.
  - **FAQPage** (SSS sayfası).
  - **Review** (yorumlar).
- Open Graph görsel: dinamik üretim (Satori / @vercel/og benzeri Astro endpoint).

### 9.3 İçerik Stratejisi
- Her marka sayfasında: marka tarihi + popüler model listesi + intern link (300-500 kelime özgün metin).
- Her model landing'de: aracın paspas özellikleri + uyumluluk + 200+ kelime açıklama (Strapi'den yönetilir, AI taslakla başlat, editör revize eder).
- Blog: haftada 1 yazı hedefi.
- Sitemap.xml otomatik (Astro `@astrojs/sitemap`).
- Robots.txt: tüm public sayfalar açık, /admin disallow.

### 9.4 Performans (Core Web Vitals)
- LCP < 2.5s (hero görsel preload, AVIF/WebP, fetchpriority high).
- CLS < 0.1 (görsel boyutları sabit, font-display swap).
- INP < 200ms (Astro Islands sadece gerekli yerde JS).
- Cloudflare CDN (V1.5) — şimdilik Coolify reverse proxy + brotli.

---

## 10. Teknik Mimari

### 10.1 Stack Karar Tablosu

| Katman | Seçim | Neden |
|---|---|---|
| Frontend | **Astro 5** | SSG + SSR hybrid, minimal JS, View Transitions, PWA dostu, SEO mükemmel. |
| UI Islands | **Preact** | Daha hafif (3KB), React API uyumlu, Astro entegrasyonu sorunsuz. |
| Styling | **Tailwind CSS 4** | Hız, design tokens, JIT, dark theme ana. |
| Components | **shadcn-style + Radix Primitives** (Preact wrapper) | Erişilebilir, tema kontrolü, kopyala-yapıştır kontrolü. |
| State | **Nanostores** | 1KB, Astro Islands arası state paylaşımı. |
| Animation | **CSS + View Transitions API** | JS yok, performans iyi. |
| CMS | **Strapi 5** (latest) | Headless, Türkçe admin, esnek content type, hooks, Coolify dostu. |
| DB | **PostgreSQL 16** | Strapi default, ilişkisel, JSONB esnek. |
| ORM | Strapi'nin kendi (Knex tabanlı) | Built-in. |
| Media | **MinIO** (S3-uyumlu) | Coolify'da self-host, vendor lock-in yok. |
| Mail | **Brevo / Resend** SMTP | Strapi email plugin uyumlu. |
| Search | **Meilisearch** (V1.5) | Marka/model arama. |
| PWA | **`@vite-pwa/astro`** | Workbox, manifest, SW kolay. |
| Forms | Native HTML + Zod validation | Minimal JS. |
| Validation | **Zod** | Hem client hem Strapi route shared. |
| Analytics | **Plausible** (self-host Coolify) | KVKK dostu, cookieless. |
| Error tracking | **Sentry** (free tier) | Frontend + backend. |
| Uptime | **Uptime Kuma** (Coolify'da) | Self-host. |
| Reverse proxy | Coolify (Caddy/Traefik) | SSL otomatik. |

### 10.2 Repo Yapısı (Monorepo, pnpm workspaces)

```
paspasoto/
├─ apps/
│  ├─ web/                       # Astro 5
│  │  ├─ src/
│  │  │  ├─ pages/
│  │  │  │  ├─ index.astro
│  │  │  │  ├─ konfigurator/
│  │  │  │  │  ├─ index.astro
│  │  │  │  │  └─ [brand]/
│  │  │  │  │     ├─ index.astro
│  │  │  │  │     └─ [model].astro
│  │  │  │  ├─ markalar/
│  │  │  │  ├─ siparis-takip/
│  │  │  │  ├─ blog/
│  │  │  │  ├─ api/                   # Astro API endpoints (proxy/transform)
│  │  │  │  │  ├─ orders.ts
│  │  │  │  │  └─ track.ts
│  │  │  │  └─ ...
│  │  │  ├─ components/
│  │  │  │  ├─ configurator/
│  │  │  │  │  ├─ Stepper.tsx           (Preact island)
│  │  │  │  │  ├─ BrandStep.tsx
│  │  │  │  │  ├─ ModelStep.tsx
│  │  │  │  │  ├─ ColorSwatch.tsx
│  │  │  │  │  ├─ Preview.tsx
│  │  │  │  │  └─ Summary.tsx
│  │  │  │  ├─ tracker/
│  │  │  │  │  ├─ Timeline.tsx
│  │  │  │  │  ├─ PaymentStatus.tsx
│  │  │  │  │  └─ ProofUpload.tsx
│  │  │  │  ├─ commerce/
│  │  │  │  │  ├─ CartDrawer.tsx
│  │  │  │  │  └─ CheckoutForm.tsx
│  │  │  │  ├─ pwa/
│  │  │  │  │  ├─ InstallPrompt.tsx
│  │  │  │  │  └─ UpdateToast.tsx
│  │  │  │  ├─ layout/
│  │  │  │  │  ├─ Header.astro
│  │  │  │  │  ├─ Footer.astro
│  │  │  │  │  └─ MobileBottomNav.tsx
│  │  │  │  └─ ui/                       # Button, Card, Dialog vs.
│  │  │  ├─ layouts/
│  │  │  │  ├─ Base.astro
│  │  │  │  └─ Marketing.astro
│  │  │  ├─ lib/
│  │  │  │  ├─ strapi.ts                 # Tip-güvenli fetch wrapper
│  │  │  │  ├─ pricing.ts
│  │  │  │  ├─ format.ts
│  │  │  │  ├─ schema.ts                 # Zod şemalar
│  │  │  │  └─ analytics.ts
│  │  │  ├─ stores/
│  │  │  │  ├─ cart.ts
│  │  │  │  └─ configurator.ts
│  │  │  ├─ styles/
│  │  │  │  └─ globals.css
│  │  │  ├─ icons/
│  │  │  └─ env.d.ts
│  │  ├─ public/
│  │  │  ├─ icons/                       # PWA ikonları
│  │  │  ├─ screens/                     # PWA screenshots
│  │  │  ├─ fonts/
│  │  │  └─ offline.html
│  │  ├─ astro.config.mjs
│  │  ├─ tailwind.config.ts
│  │  ├─ tsconfig.json
│  │  └─ Dockerfile
│  └─ cms/                       # Strapi 5
│     ├─ src/
│     │  ├─ api/
│     │  │  ├─ brand/
│     │  │  ├─ vehicle-model/
│     │  │  ├─ mat-color/
│     │  │  ├─ border-color/
│     │  │  ├─ logo-accessory/
│     │  │  ├─ product/
│     │  │  ├─ order/
│     │  │  │  └─ content-types/order/lifecycles.ts
│     │  │  ├─ payment/
│     │  │  ├─ order-status-event/
│     │  │  ├─ review/
│     │  │  ├─ blog-post/
│     │  │  └─ site-setting/
│     │  ├─ extensions/
│     │  ├─ admin/
│     │  │  └─ src/
│     │  │     └─ pages/
│     │  │        └─ OrderKanban/        # Custom view
│     │  ├─ components/
│     │  └─ index.ts
│     ├─ config/
│     │  ├─ database.ts
│     │  ├─ plugins.ts
│     │  ├─ middlewares.ts
│     │  ├─ server.ts
│     │  └─ admin.ts
│     ├─ public/
│     ├─ scripts/
│     │  └─ seed.ts                       # Markalar/renkler/modeller seed
│     ├─ Dockerfile
│     └─ tsconfig.json
├─ packages/
│  └─ shared/
│     ├─ types/                            # Order, ConfiguratorState, ...
│     └─ schemas/                          # Zod
├─ docs/
│  ├─ PRD.md                               # (bu dosyanın kopyası)
│  └─ DEPLOY.md
├─ docker-compose.yml                      # Local dev
├─ .env.example
├─ pnpm-workspace.yaml
├─ package.json
└─ README.md
```

### 10.3 Veri Modeli (Strapi Content Types — Detay)

#### `Brand`
| Alan | Tip | Not |
|---|---|---|
| name | string, unique, required | "BMW" |
| slug | UID(name) | "bmw" |
| logo | media (single, image) | Şeffaf PNG |
| order | int | Sıralama |
| popular | bool | Anasayfada gösterim |
| seoTitle, seoDescription | string | |
| description | richtext | Marka sayfası içerik |

#### `VehicleModel`
| Alan | Tip | Not |
|---|---|---|
| brand | rel (manyToOne → Brand) | |
| name | string | "3 Serisi" |
| chassisCode | string | "F30" |
| yearStart, yearEnd | int | 2012, 2018 |
| slug | UID | "3-serisi-f30-2012-2018" |
| seatLayout | json | {"front": 2, "rear": 3} |
| coverImage | media | |
| matTemplate | rel (manyToOne → MatTemplate) | Hangi şablonla kesilecek |
| popularity | int | Sıralama |
| seoTitle, seoDescription | string | |

#### `MatTemplate`
| Alan | Tip | Not |
|---|---|---|
| code | string, unique | "T-001" |
| name | string | "BMW 3 Serisi F30 4'lü" |
| baseImagesByColor | json | {"siyah": "url", "gri": "url", ...} preview için |
| edgeImage | media | Kenarlık SVG/PNG mask |

#### `MatColor` & `BorderColor`
| Alan | Tip | Not |
|---|---|---|
| name | string, unique | "Siyah" |
| slug | UID | "siyah" |
| hex | string | "#0B0B0F" |
| swatchImage | media | Görsel 3'teki dokulu fotoğraf |
| priceModifier | decimal | V1=0 |
| inStock | bool | |
| order | int | |

#### `HeelPad` (Topukluk)
| Alan | Tip | Not |
|---|---|---|
| name | string | "Karbon Doku Antrasit", "Beyaz Noktalı", "Metalik Gümüş" |
| slug | UID | |
| textureImage | media | Doku görseli (paspas üzerinde overlay için) |
| swatchImage | media | Konfigüratör swatch'ı |
| pricePremium | decimal | Standart=0, premium dokular ek ücret |
| isStandard | bool | Standart paket dahili mi |
| inStock | bool | |
| order | int | |

#### `LogoAccessory`
| Alan | Tip | Not |
|---|---|---|
| name | string | "BMW Logo Anahtarlık" |
| brand | rel (Brand, optional) | |
| image | media | |
| price | decimal | 150.00 |
| inStock | bool | |

#### `Product`
| Alan | Tip | Not |
|---|---|---|
| name | string | "4'lü Set" |
| slug | UID | |
| basePrice | decimal | |
| parts | int | 4 |
| includesTrunk | bool | |

#### `Order` (kalp)
| Alan | Tip | Not |
|---|---|---|
| orderNo | string, unique, required | "PO-260506-A4F2" |
| accessToken | uid (uuid), unique | Müşteri takip için |
| customerName | string, required | |
| customerPhone | string, required | |
| customerEmail | email | |
| billingAddress | component (Address) | |
| shippingAddress | component (Address) | |
| sameAddress | bool | |
| items | component repeatable (OrderItem) | |
| subtotal, shipping, total | decimal | |
| paymentMethod | enum: havale, kapida | |
| paymentStatus | enum: bekliyor, kismi, tamamlandi, iade | |
| paidAmount | decimal | |
| productionStatus | enum (8 değer) | |
| cargoCompany | enum: yurtici, aras, mng, ptt, surat | |
| cargoTrackingNo | string | |
| cargoTrackingUrl | string (computed by lifecycle) | |
| customerNote | text | |
| internalNote | text | Admin only |
| ipAddress, userAgent | string | Audit |
| consents | json | KVKK, mesafeli onay timestamp |
| createdAt, updatedAt | datetime | |
| paidAt, shippedAt, deliveredAt | datetime | |

#### `Address` (component)
| Alan | Tip |
|---|---|
| fullName | string |
| phone | string |
| city | string |
| district | string |
| neighborhood | string |
| addressLine | text |
| postalCode | string |

#### `OrderItem` (component)
| Alan | Tip | Not |
|---|---|---|
| product | rel (Product) | |
| vehicleModel | rel (VehicleModel) | |
| matColor | rel (MatColor) | |
| borderColor | rel (BorderColor) | |
| logoAccessory | rel (LogoAccessory, optional) | |
| logoQuantity | int | 0-8 |
| heelPad | rel (HeelPad) | Sürücü tarafı topukluk dokusu |
| heelPadPassenger | bool | Yolcu tarafına da topukluk eklendi mi (+ücret) |
| quantity | int | 1+ |
| unitPrice, lineTotal | decimal | |
| configSnapshot | json | İsim/renk değişikliklerine karşı sabit |

#### `Payment`
| Alan | Tip |
|---|---|
| order | rel (Order) |
| amount | decimal |
| method | enum |
| receivedAt | datetime |
| note | text |
| proofImage | media |
| confirmedBy | rel (admin user) |
| confirmedAt | datetime |

#### `OrderStatusEvent`
| Alan | Tip |
|---|---|
| order | rel (Order) |
| type | enum: production_status / payment_status |
| value | string |
| note | text |
| byUser | rel (admin) |
| createdAt | datetime |

#### `Review`
| Alan | Tip |
|---|---|
| customerName | string |
| rating | int 1-5 |
| text | text |
| image | media |
| vehicleModel | rel |
| approved | bool |
| order | rel (Order, optional) |

#### `BlogPost`
| Alan | Tip |
|---|---|
| title, slug, excerpt | string/text |
| body | richtext (Markdown) |
| coverImage | media |
| category | enum |
| publishedAt | datetime |
| seoTitle, seoDescription | string |

#### `SiteSetting` (single type)
- phone, whatsapp, email, address, mapUrl
- bankAccounts (component repeatable: bankName, iban, accountHolder)
- paymentMethodsEnabled (json: {havale: true, kapida: true})
- shippingFee (decimal), freeShippingMin (decimal)
- heroSlides (component)
- socials (instagram, facebook, tiktok, youtube)
- workingHours (string)
- announcementBar (text, optional)

### 10.4 API Sözleşmesi (Public, Astro tarafı tüketir)

| Method | Path | Auth | Açıklama |
|---|---|---|---|
| GET | `/api/brands?populate=logo&filters[publishedAt][$notNull]=true&sort=order` | public | Liste |
| GET | `/api/brands/:slug` | public | Detay (custom controller, slug ile) |
| GET | `/api/vehicle-models?filters[brand][slug][$eq]=:slug&populate=*` | public | |
| GET | `/api/vehicle-models/:slug` | public | |
| GET | `/api/mat-colors?sort=order` | public | |
| GET | `/api/border-colors?sort=order` | public | |
| GET | `/api/logo-accessories?filters[brand][slug][$eq]=:slug` | public | |
| GET | `/api/heel-pads?sort=order` | public | Topukluk dokuları |
| GET | `/api/products` | public | |
| GET | `/api/site-setting` | public | |
| GET | `/api/blog-posts?sort=publishedAt:desc` | public | |
| POST | `/api/orders` | public, rate-limit 5/dk/IP | Body Zod validate |
| POST | `/api/orders/track` | public, rate-limit 30/dk/IP | {orderNo, phoneLast4} → {token} |
| GET | `/api/orders/by-token/:token` | public, rate-limit 60/dk/IP | Sadece public-safe alanlar |
| POST | `/api/orders/:id/payment-proof` | public, token doğrulama, rate-limit 5/dk/IP | Multipart |
| POST | `/api/contact` | public, rate-limit 3/dk/IP, honeypot | İletişim formu |
| POST | `/api/reviews` | public, token doğrulama | Müşteri yorum |

**Custom controller örneği**: `apps/cms/src/api/order/controllers/order.ts` — `track` method'u, `phoneLast4` ile match edip token döner; `getByToken` method'u sadece whitelisted field set döner.

### 10.5 Lifecycle Hook'ları (Strapi)

`apps/cms/src/api/order/content-types/order/lifecycles.ts`:
- `beforeCreate`: orderNo + accessToken üretimi, total hesaplama doğrulama (server-side authoritative).
- `afterCreate`: müşteriye e-posta + admin'e bildirim e-postası + Telegram (V1.5) bot bildirimi.
- `beforeUpdate`: status değişimini kontrol et, `OrderStatusEvent` kaydı oluştur.
- `afterUpdate`: status değişti ise müşteriye e-posta (template per-status); `paymentStatus = tamamlandi` ise `productionStatus`'u "Kalıp Hazırlanıyor"a otomatik geçir.

### 10.6 E-posta Şablonları (TR)
- `order_received`: Sipariş Alındı (orderNo, takip linki, tutar, IBAN bilgisi havale ise).
- `payment_confirmed`: Ödemen Onaylandı.
- `production_started`: Üretim Başladı.
- `quality_check`: Kalite Kontrolde.
- `shipped`: Kargolandı (kargo firma + takip no + dış link).
- `delivered`: Teslim Edildi (yorum CTA).
- `review_request`: 7 gün sonra cron job ile.
- `cancelled`: İptal Edildi.

### 10.7 Güvenlik

- **Auth**: Strapi Roles — Public (sadece read kataloglar + restricted order endpoint), Admin (full).
- **Rate limit**: `koa-ratelimit` Strapi middleware, IP başına yukarıdaki tablo.
- **CORS**: yalnızca `https://paspasoto.com`, `https://www.paspasoto.com`, dev için localhost.
- **Helmet**: Strapi default + CSP (Strapi admin dahil whitelisted).
- **Input validation**: Zod schema'lar `packages/shared/schemas` altında, hem client hem server tarafında kullanılır.
- **CSRF**: Strapi default + Astro form'larda double-submit cookie (V1.5).
- **Honeypot + reCAPTCHA v3** sipariş formunda (V1.5).
- **Secrets**: Coolify env yönetimi, `.env` git'e girmez, `.env.example` placeholder.
- **HTTPS**: Coolify Let's Encrypt otomatik.
- **Admin IP allow-list** (opsiyonel): Coolify reverse proxy ile.
- **Backup**: Coolify günlük postgres dump + MinIO bucket sync (S3-cli ile harici disk veya bulut V1.5).
- **KVKK**: kişisel veri formlarında aydınlatma metni link, çerez bandı, veri sorumlusu bilgisi footer'da.
- **Veri minimizasyonu**: e-posta opsiyonel (sadece bildirim için), GSM zorunlu (sipariş takip).

### 10.8 Performans

- **Hedefler:**
  - Anasayfa LCP < 2.0s (3G fast).
  - INP < 200ms.
  - CLS < 0.1.
  - Total Blocking Time < 200ms.
  - JS bundle < 100KB (initial), Konfigüratör island lazy loaded.
- **Stratejiler:**
  - Astro SSG ile HTML pre-render.
  - Hero görsel `fetchpriority="high"`, AVIF + WebP fallback.
  - Fontlar self-host, `font-display: swap`, preload `WOFF2`.
  - Strapi API response cache (Cloudflare V1.5; V1'de Astro `Cache-Control: s-maxage=300` Coolify reverse proxy ile).
  - Image CDN benzeri: Strapi yüklenen görselleri Astro'da `<Image />` ile responsive + lazy.
  - PWA SW ile tekrar ziyaretlerde anlık yükleme.

### 10.9 Erişilebilirlik (a11y)

- **WCAG 2.1 AA** hedefi.
- Tüm interaktif elemanlar klavye erişilebilir.
- Form label'ları, error mesajları aria-bağlı.
- Renk kontrast oranları min 4.5:1 metin için.
- Renk swatch'ları renk adı + aria-label.
- Focus ring her zaman görünür.
- Reduced motion preference desteği.

### 10.10 Analitik & İzleme

- **Plausible** (self-host, cookieless, KVKK dostu): pageview, custom events.
- **Custom events**: configurator_started, step_completed, configurator_completed, add_to_cart, checkout_started, order_completed.
- **Conversion funnel**: GA4 (V1.5).
- **Sentry**: frontend + backend error capture.
- **Uptime Kuma**: paspasoto.com + admin.paspasoto.com 5 dk interval ping.

---

## 11. Coolify Deploy Planı

### 11.1 Sunucu Ön Koşullar
- Sunucu: 185.255.95.111
- Coolify dashboard: http://185.255.95.111:8000 (login: turhanhamza@gmail.com).
- Coolify CLI/API: token mevcut.
- Önerilen kaynak: 4 vCPU + 8 GB RAM + 80 GB disk minimum (Strapi build aç gözlü, 2 GB swap).

### 11.2 Yeni Proje Yapısı (Coolify)

**Project: PaspasOto**
**Environment: production**

Resources:
1. **db-postgres** — PostgreSQL 16 (Coolify Database). Credentials Coolify generate.
2. **storage-minio** — MinIO (Coolify Service). Bucket: `paspasoto-media`. Public read policy.
3. **cms** — Application (Dockerfile, GitHub source). Domain: `admin.paspasoto.com`.
4. **web** — Application (Dockerfile, GitHub source). Domain: `paspasoto.com` + redirect from `www.paspasoto.com`.
5. **plausible** (V1.5) — Analytics, subdomain: `analytics.paspasoto.com`.
6. **uptime-kuma** (V1.5) — internal monitoring.

### 11.3 Domain & DNS
- `paspasoto.com` (varsayım: satın alındı).
- DNS A kaydı: `paspasoto.com` → `185.255.95.111`.
- CNAME: `www`, `admin`, `analytics` → `paspasoto.com`.
- Cloudflare proxy (turuncu bulut) — V1.5, V1'de doğrudan Coolify SSL.

### 11.4 Environment Variables

**CMS:**
```
NODE_ENV=production
DATABASE_CLIENT=postgres
DATABASE_HOST=db-postgres
DATABASE_PORT=5432
DATABASE_NAME=paspasoto
DATABASE_USERNAME=paspasoto
DATABASE_PASSWORD=<coolify-generate>
DATABASE_SSL=false

APP_KEYS=<32+ chars, comma separated>
API_TOKEN_SALT=<32 chars>
ADMIN_JWT_SECRET=<32 chars>
TRANSFER_TOKEN_SALT=<32 chars>
JWT_SECRET=<32 chars>

S3_ENDPOINT=http://storage-minio:9000
S3_ACCESS_KEY=<minio>
S3_SECRET_KEY=<minio>
S3_BUCKET=paspasoto-media
S3_REGION=us-east-1
S3_PUBLIC_URL=https://media.paspasoto.com   # MinIO public url (V1'de doğrudan strapi /uploads de olabilir)

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=<>
SMTP_PASS=<>
SMTP_FROM=PaspasOto <siparis@paspasoto.com>
SMTP_REPLY_TO=destek@paspasoto.com

PUBLIC_URL=https://admin.paspasoto.com
WEB_PUBLIC_URL=https://paspasoto.com
ADMIN_NOTIFICATION_EMAILS=turhanhamza@gmail.com,...
```

**WEB:**
```
NODE_ENV=production
PUBLIC_STRAPI_URL=https://admin.paspasoto.com
STRAPI_API_TOKEN=<read-only token>           # public read için
STRAPI_INTERNAL_TOKEN=<full read for SSG>   # build-time
PUBLIC_SITE_URL=https://paspasoto.com
PUBLIC_PLAUSIBLE_DOMAIN=paspasoto.com
SENTRY_DSN=...
```

### 11.5 Dockerfile'lar (özet)

**`apps/cms/Dockerfile`**
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY apps/cms/package.json apps/cms/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY apps/cms ./
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 1337
HEALTHCHECK --interval=30s CMD wget -q -O - http://localhost:1337/_health || exit 1
CMD ["pnpm", "start"]
```

**`apps/web/Dockerfile`**
```dockerfile
FROM node:20-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY apps/web/package.json apps/web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS build
ARG PUBLIC_STRAPI_URL
ARG STRAPI_INTERNAL_TOKEN
COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 4321
HEALTHCHECK --interval=30s CMD wget -q -O - http://localhost:4321/health || exit 1
CMD ["node", "./dist/server/entry.mjs"]
```

### 11.6 Coolify Adım Adım Deploy

1. SSH bağlan: `ssh root@185.255.95.111` (parola/SSH key).
2. Coolify dashboard'da yeni proje **PaspasOto**, environment **production**.
3. **Postgres database** ekle: name `db-postgres`, db `paspasoto`, user `paspasoto`, parola Coolify generate. Backup günlük on.
4. **MinIO service** ekle: bucket `paspasoto-media`, root user/pass set. Internal hostname `storage-minio:9000`. Public URL için subdomain `media.paspasoto.com`.
5. GitHub repo yetkilendir, **Application: cms** ekle. Build pack: Dockerfile, path `apps/cms/Dockerfile`. Env değişkenleri ekle. Domain: `admin.paspasoto.com`. SSL aç. Volume: `/app/public/uploads` (eski-stil yedek için, primary MinIO).
6. **Application: web** ekle. Build pack: Dockerfile, path `apps/web/Dockerfile`. Build args: `PUBLIC_STRAPI_URL`, `STRAPI_INTERNAL_TOKEN`. Env değişkenleri. Domain: `paspasoto.com`. `www → non-www` redirect.
7. CMS deploy → ilk açılışta admin user oluştur (`turhanhamza@gmail.com` / yeni parola).
8. Strapi'de **API Token** oluştur (read-only) → `STRAPI_API_TOKEN` web env'ine yaz, web yeniden deploy.
9. Seed scripti çalıştır: `pnpm seed` (markalar, modeller, renkler, set tipleri, logolar, ilk site setting, KVKK metni).
10. **Smoke test**:
    - `https://paspasoto.com` 200 OK.
    - Konfigüratör akışı baştan sona.
    - Sipariş POST → admin'de gör → durum ilerlet → müşteri takip URL'inde değişiklik gözlemle.
    - PWA kurulum testi (Android Chrome).
11. **Backup doğrula**: postgres dump alındığını kontrol et, MinIO bucket içeriği.
12. **DNS düzgün çözülüyor mu**: dig/nslookup.
13. **Lighthouse**: mobil + masaüstü ≥ 92.

### 11.7 CI/CD

GitHub Actions workflow `.github/workflows/ci.yml`:
- PR'da: typecheck (`pnpm tsc`), lint (`pnpm lint`), web build smoke (`pnpm --filter web build`).
- `main`'e push'ta: Coolify deploy webhook trigger (cms ve web ayrı).
- Test runner: Vitest (unit), Playwright (e2e — V1.5).

### 11.8 Güvenli Deploy Pratikleri
- Migration: Strapi otomatik (development'ta yapılır, production'a image olarak gelir). Veri migration'ları için ayrı script.
- **Rollback**: Coolify image versiyonlama ile bir önceki image'e dön.
- **Maintenance mode**: Coolify "503 Maintenance" mode (V1.5).

---

## 12. Operasyonel İş Akışı (KOBİ İçin Günlük Kullanım)

### 12.1 Günlük Operatör Sabah Ritüeli
1. `admin.paspasoto.com` aç → Kanban görünümü.
2. **Yeni siparişler** sütunu: her birini tıkla, ödeme yöntemini kontrol et.
   - Havale + dekont yüklendi → "Ödemeyi Onayla".
   - Havale + dekont yok → durum kalır, "Hatırlat" butonu (e-posta gönderir).
   - Kapıda → otomatik üretime alınır.
3. **Üretimde** sütunu: atölye ekibi günlük listesini buradan alır.
4. **Kalite Kontrol** → onay → Kargo'ya geç.
5. **Kargoya Verildi**: kargo firma + takip no gir → müşteri otomatik bilgilendirilir.

### 12.2 Sipariş İptali
- Admin "İptal Et" butonuna basar, neden alanı zorunlu, müşteriye otomatik e-posta.
- İade gerekiyorsa Payment kaydında `iade` durumu, manuel banka iade.

### 12.3 Ürün/Renk/Marka Yönetimi
- Strapi standart CRUD.
- Stokta yok ise `inStock=false` → frontendde swatch grileşir + "Stokta yok" tooltip.

### 12.4 İçerik Güncelleme
- Hero slide, blog yazısı, SSS — Strapi'den.
- Yorum moderasyonu: `approved=true` olanlar yayında.

---

## 13. MVP Faz Planı (Sprint Bazlı)

| Sprint | Süre | İçerik |
|---|---|---|
| **0 — Hazırlık** | 1-2 gün | Repo init, monorepo, Tailwind/design tokens, Coolify proje + servis iskeleti. |
| **1 — CMS & Veri Modeli** | 3-4 gün | Strapi content types, roller, public API'ler, Türkçe locale, seed script. |
| **2 — Vitrin Sayfaları** | 3-4 gün | Anasayfa, hakkımızda, SSS, kargo-iade, iletişim, blog liste/detay, footer/header, SEO bileşenleri. |
| **3 — Konfigüratör** | 4-5 gün | 6 adımlı stepper, canlı preview, sepete ekle, marka/model SSG landing'ler. |
| **4 — Sepet & Checkout** | 2-3 gün | Sepet, checkout formu, sipariş POST, onay sayfası, e-posta gönderimi. |
| **5 — Sipariş Takip** | 3 gün | Takip giriş + token sayfası, timeline, ödeme durumu, dekont yükleme. |
| **6 — Admin Operasyon** | 3 gün | Sipariş Kanban custom view, tek tıkla durum ilerletme, e-posta hook'ları. |
| **7 — PWA** | 2 gün | Manifest, SW (Workbox), install prompt, offline page, ikonlar, screenshots. |
| **8 — Polish & İçerik** | 2 gün | Gerçek ürün fotoğrafları, hero görselleri, blog seed yazıları, KVKK metinleri. |
| **9 — Performance & A11y Audit** | 1-2 gün | Lighthouse 92+, axe a11y geçişi, image optimizasyon. |
| **10 — Deploy & UAT** | 1-2 gün | DNS yönlendirme, canlıya çıkış, müşteri kullanıcı kabul testleri, son düzeltmeler. |
| **Toplam** | **25-30 iş günü** (1 geliştirici) | |

**V2 (Lansman sonrası):**
- Iyzico/PayTR PSP entegrasyonu.
- SMS bildirim (Netgsm/Iletimerkezi).
- Kargo API entegrasyonu (Yurtiçi/Aras tracking JSON).
- Web Push notification (PWA).
- B2B bayi paneli + özel fiyat listesi.
- Müşteri hesabı + sipariş geçmişi + favoriler.
- Üye yorum + foto paylaşım akışı.
- WebGL gerçek 3D preview (three.js).
- Çoklu dil (EN/AR) — orta vadeli.
- Whatsapp Cloud API otomatik bildirim.
- AI assistant: "Aracıma uygun renk ne olur?" chatbot.

---

## 14. Test Stratejisi

| Tip | Araç | Kapsam |
|---|---|---|
| Unit | Vitest | Pricing, Zod schemas, helper fonksiyonları |
| Component | Vitest + Testing Library | Konfigüratör adımları, color swatch |
| E2E | Playwright (V1.5) | Anasayfa → konfigüratör → sipariş → takip akışı |
| Visual regression | Playwright screenshots | Konfigüratör preview |
| Performance | Lighthouse CI | Anasayfa, konfigüratör, takip; threshold'lar CI'da |
| A11y | axe-core, Pa11y | WCAG AA |
| Manual | Test senaryosu listesi | UAT öncesi |
| Yük testi | k6 (V1.5) | 100 concurrent |

**E2E senaryo örneği:**
1. Anasayfa açılır.
2. "Konfigüratörü Başlat" tıklanır.
3. BMW seç → 3 Serisi F30 → 4'lü Set → Siyah → Kırmızı kenarlık → Karbon topukluk (yolcu dahil) → BMW logo (4 adet) → Sepete ekle.
4. Sepet açılır, doğru fiyat: 1990 + 150 (premium topukluk) + 100 (yolcu topukluk) + 4×150 = 2840.
5. Checkout → form doldur → Havale → Tamamla.
6. Onay sayfası: orderNo + IBAN.
7. Takip: orderNo + son 4 GSM → token sayfası.
8. Dekont yükle → admin onaylar → durum güncellenir → müşteri ekranı yenilenince yeni durumu gösterir.

---

## 15. Kritik Dosyalar (Uygulama Sırasında Dokunulacak)

| Yol | Amaç |
|---|---|
| `apps/web/astro.config.mjs` | Hybrid output, integrations (Tailwind, Preact, sitemap, PWA) |
| `apps/web/src/lib/strapi.ts` | Tip-güvenli API client |
| `apps/web/src/components/configurator/Stepper.tsx` | Ana akış controller |
| `apps/web/src/components/configurator/Preview.tsx` | Canlı önizleme (CSS variable based) |
| `apps/web/src/components/tracker/Timeline.tsx` | 8 adımlı timeline |
| `apps/web/src/pages/konfigurator/[brand]/[model].astro` | SEO landing (getStaticPaths) |
| `apps/web/src/pages/siparis-takip/[token].astro` | Müşteri takip detay |
| `apps/web/src/pages/api/orders.ts` | Strapi proxy (validation + IP capture) |
| `apps/web/public/manifest.webmanifest` | PWA manifest |
| `apps/web/public/offline.html` | Offline fallback |
| `apps/cms/src/api/order/content-types/order/lifecycles.ts` | E-posta + status event hook |
| `apps/cms/src/api/order/controllers/order.ts` | track + getByToken custom |
| `apps/cms/src/admin/extensions/order-kanban/` | Custom kanban view |
| `apps/cms/config/database.ts` | Postgres bağlantısı |
| `apps/cms/config/plugins.ts` | S3/MinIO upload + email |
| `apps/cms/scripts/seed.ts` | Markalar, modeller, renkler |
| `packages/shared/schemas/order.ts` | Zod sipariş şeması (paylaşılan) |
| `docker-compose.yml` | Local dev (postgres + minio + cms + web) |
| `apps/web/Dockerfile`, `apps/cms/Dockerfile` | Coolify build |
| `.github/workflows/ci.yml` | Lint, test, build, deploy webhook |

---

## 16. Doğrulama / Verification

### 16.1 Geliştirme Sırasında
- `pnpm dev` ile lokal: http://localhost:4321 (web), http://localhost:1337/admin (cms), http://localhost:9001 (minio console).
- Konfigüratör akışı: marka → model → … → sepete ekle, tüm adımlarda preview doğru, fiyat doğru.
- Sipariş POST: Postman / Bruno collection ile sözleşme doğrulama.
- Lighthouse mobil > 92 (Performance, Accessibility, SEO, Best Practices, PWA).
- Axe a11y violation = 0.
- TypeScript strict: hata yok.

### 16.2 PWA Kurulum Doğrulama
- Android Chrome → URL'ye git → 3 sayfa görüntüle → install banner → "Yükle" → ana ekranda kısayol → tıkla → standalone splash → açılır.
- iOS Safari → Share → Add to Home Screen → ikon görünür → açılır → standalone.
- Offline: havayı kapat → daha önce ziyaret ettiğin sayfa açılır + offline.html fallback.
- Service worker update: yeni deploy sonrası "Yeni sürüm hazır" toast.

### 16.3 Canlıya Çıkış Öncesi E2E Senaryosu
1. `https://paspasoto.com` 200 OK + SSL geçerli.
2. Hero görünür, CTA çalışır, font yüklendi, görsel keskin.
3. Konfigüratör: BMW 3 Serisi F30 / 4'lü / Siyah / Kırmızı / Karbon topukluk (yolcu dahil) / BMW logo → sepete ekle.
4. Checkout: ad-soyad, GSM, e-posta, adres, "Banka Havalesi", KVKK onay → siparişi tamamla.
5. Onay sayfasında orderNo + takip linki + IBAN gözüksün, e-posta gelsin.
6. Takip linkinden gir → Timeline 1. adımda, ödeme bekliyor.
7. `admin.paspasoto.com` → siparişi kanban'da gör, Ödeme'yi onayla → otomatik üretime geç.
8. Müşteri takip linkinde durum güncellensin, e-posta gelsin.
9. Üretim adımlarını ilerlet → her birinde müşteri ekranında doğru görünsün.
10. Kargo no gir → müşteri ekranında dış kargo linki çalışsın.
11. Mobil Safari + Chrome'da sayfa render hatasız.
12. PWA install + offline test geçti.
13. Coolify'da log temiz, healthcheck yeşil.
14. Backup script çalıştı, postgres dump indirilebilir.
15. Sentry'de error yok, Plausible'da pageview kaydediliyor.

---

## 17. Açık Konular / Lansman Öncesi Netleşmesi Gerekenler

| Konu | Öneri |
|---|---|
| KOBİ yasal unvan | Footer + sözleşmeler için gerekli |
| Banka hesap bilgileri (IBAN'lar) | Havale ekranı + Strapi SiteSetting'e girilir |
| Logo / kurumsal kimlik | Yoksa lansmanla birlikte üretim önerilir; basit bir logotype yeter |
| Domain `paspasoto.com` | Satın alındı mı? GoDaddy/Natro önerilir. |
| Profesyonel ürün fotoğrafları | Mevcut WhatsApp görselleri V1 için yeterli değil — atölyede 1 günlük profesyonel çekim önerilir (renk swatch'ları + kombinasyon örnekleri + atölye ortam) |
| E-posta gönderim servisi | Brevo (Sendinblue) ücretsiz tier 300/gün önerilir |
| Kargo firma anlaşması | Yurtiçi/Aras/MNG'den biri — V1'de manuel takip no yeterli |
| KVKK Veri Sorumlusu kayıt | KOBİ VERBİS kaydı kontrol edilmeli |
| Mesafeli Satış Sözleşmesi metni | Hukuk danışmanına onaylatılmalı |
| Garanti süresi politikası | "X gün/Y yıl" → blog + footer |
| WhatsApp Business numarası | Floating button için |
| Sosyal medya hesapları | Instagram, TikTok, Facebook |

---

## 18. Risk Analizi

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| Strapi v5 admin v4'ten farklı, plugin uyumsuzluğu | Orta | Düşük | Stabil sürüm + plugin compatibility check öncesi |
| Konfigüratör preview görsel kalite yetersiz | Orta | Yüksek | Profesyonel ürün çekimi + CSS overlay test |
| Coolify outage | Düşük | Yüksek | Backup + DNS ile farklı sunucuya hızlı yönlendirme planı |
| KOBİ ekibinin admin paneli benimsemesi | Orta | Orta | Türkçe arayüz + 1 saat eğitim + video kayıt |
| Mobile internet performansı | Orta | Orta | PWA + agresif cache + AVIF görseller |
| KVKK uyumsuzluk şikayeti | Düşük | Yüksek | Aydınlatma metni + çerez bandı + minimum veri |
| Spam sipariş | Orta | Orta | Rate limit + honeypot + V1.5 reCAPTCHA |
| MinIO veri kaybı | Düşük | Yüksek | Günlük backup + V2'de S3 (Cloudflare R2) yedek |

---

## 19. Sonraki Adımlar (Plan Onaylandıktan Sonra)

1. Bu PRD'yi `C:\Users\qw\Desktop\PaspasOto.com\PRD.md`'ye kopyala (proje klasöründe referans olsun).
2. GitHub'da `paspasoto` repo oluştur, monorepo iskeleti push et.
3. Coolify'da yeni proje oluştur, postgres + minio servisleri kur.
4. Sprint 0'dan itibaren faz planını çalıştır.
5. Her sprintin sonunda kullanıcıya demo + onay döngüsü.

---

## EK A — Örnek Konfigüratör State (Nanostore)

```ts
type ConfiguratorState = {
  step: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 'summary'
  brand: { id: number; name: string; slug: string } | null
  vehicleModel: { id: number; name: string; slug: string; chassisCode: string; yearStart: number; yearEnd: number } | null
  product: { id: number; name: string; basePrice: number; parts: number } | null
  matColor: { id: number; name: string; hex: string; swatchUrl: string } | null
  borderColor: { id: number; name: string; hex: string; swatchUrl: string } | null
  heelPad: { id: number; name: string; textureUrl: string; pricePremium: number } | null
  heelPadPassenger: boolean
  logoAccessory: { id: number; name: string; price: number; imageUrl: string } | null
  logoQuantity: number
  quantity: number
  computedPrice: number
}
```

## EK B — Örnek Sipariş POST Body

```json
{
  "customer": {
    "fullName": "Mehmet Yılmaz",
    "phone": "+905551234567",
    "email": "mehmet@example.com"
  },
  "shippingAddress": {
    "fullName": "Mehmet Yılmaz",
    "phone": "+905551234567",
    "city": "Konya",
    "district": "Selçuklu",
    "neighborhood": "Bosna Mah.",
    "addressLine": "Şehit Volkan Cad. No:12 D:5",
    "postalCode": "42100"
  },
  "billingAddress": "same",
  "items": [
    {
      "productId": 3,
      "vehicleModelId": 47,
      "matColorId": 1,
      "borderColorId": 9,
      "logoAccessoryId": 2,
      "logoQuantity": 4,
      "heelPadId": 3,
      "heelPadPassenger": true,
      "quantity": 1
    }
  ],
  "paymentMethod": "havale",
  "customerNote": "Kapı zilim çalışmıyor, lütfen telefon edin.",
  "consents": {
    "kvkk": true,
    "mesafeliSatis": true
  }
}
```

## EK C — Örnek Sipariş Takip Response (public)

```json
{
  "orderNo": "PO-260506-A4F2",
  "status": "production",
  "productionStatus": "kalite_kontrol",
  "paymentStatus": "tamamlandi",
  "createdAt": "2026-05-06T14:23:11Z",
  "paidAt": "2026-05-06T15:01:42Z",
  "items": [ { "configSnapshot": { "...": "..." }, "quantity": 1, "lineTotal": 2590 } ],
  "total": 2590,
  "timeline": [
    { "type": "created", "at": "2026-05-06T14:23:11Z", "label": "Sipariş Alındı" },
    { "type": "payment_confirmed", "at": "2026-05-06T15:01:42Z", "label": "Ödeme Onaylandı" },
    { "type": "production_started", "at": "2026-05-07T09:15:00Z", "label": "Kalıp Hazırlanıyor" },
    { "type": "production_cutting", "at": "2026-05-07T13:40:00Z", "label": "Kesim" },
    { "type": "production_sewing", "at": "2026-05-08T10:20:00Z", "label": "Dikim" },
    { "type": "quality_check", "at": "2026-05-08T16:10:00Z", "label": "Kalite Kontrol" }
  ],
  "cargo": null
}
```

---

**PRD versiyon:** 1.0  
**Son güncelleme:** 2026-05-06  
**Yazar:** Claude (PaspasOto.com kurulum planı)
