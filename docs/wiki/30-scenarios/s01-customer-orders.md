---
title: Senaryo · Müşteri sipariş akışı
status: stable
last_reviewed: 2026-05-07
related: [[../10-modules/configurator]], [[../10-modules/orders]], [[../10-modules/push]]
---

# S01 — Müşteri Carmat'tan paspas alıyor

## Aktör
Mehmet Bey, BMW 3 Serisi G20 sahibi, telefonunu Chrome'da kullanıyor.

## Akış

### 1. Web sitesi keşfi
- Mehmet `carmat.com.tr` linkine tıklar
- Mobile'da bottom nav görünür: Anasayfa / Tasarla / Galeri / Takip / İletişim
- 1.5sn sonra tepeden "Carmat uygulamasını ana ekrana ekle" smart banner kayar

### 2. Konfigürasyon
- "Tasarla" tab'ına basar → 7-adımlı konfigüratör açılır
- Marka: BMW (gerçek mavi logo) → Model: 3 Serisi G20 (otomatik 2-11 alt model)
- Set: 4'lü+Bagaj
- Mat zemin: Siyah (texture swatch)
- Kenarlık: Kırmızı
- Topukluk: Karbon Doku Antrasit + "Her İkisi" konum (+100₺)
- Logo per-mat: Sürücü+Yolcu BMW logosu (üst), arka boş, bagaj boş
- Özet → tahmini fiyat ₺3.490

### 3. Talep gönderme
- "Teklif İste" → modal açılır (ad+telefon+il+ilçe+adres)
- Tüm alanları doldurur → "Size Özel Teklifimizi Gönder"
- localStorage temizlenir
- Success ekranı: "Talebiniz alındı, atölyemiz size WhatsApp'tan teklifi iletecek. Talep No: PO-260507-XXXX"

### 4. Arka planda
- POST `/api/quote` → DB'ye `kind: 'quote'` ile yazılır
- Admin'e push: "🔔 Yeni Teklif Talebi: Mehmet — BMW 3 Serisi"
- Admin tarayıcısı kapalı bile olsa OS notification gelir
- `data/integration-events.json` log'da görünmez (sadece webhook'lar için)

### 5. Admin işlem
- Atölye sahibi PWA'sından bildirim alır → tıklar → `/admin/talepler` açılır
- Mehmet'in talebini görür, "Teklif Gönder" butonuyla WhatsApp deeplink'i açar (hazır mesaj)
- WhatsApp'ta Mehmet'e fiyat verir, Mehmet onaylar
- Admin "✓ Siparişe Çevir" → PATCH `kind: 'order', productionStatus: 'in_production'`

### 6. Müşteriye geri bildirim
- Push: "✓ Teklifiniz Onaylandı — PO-260507-XXXX siparişiniz üretime alındı"
- Mehmet takip linkine tıklar → 4-aşama timeline: Sipariş Alındı ✓ → Üretimde ⚪ → Hazır → Teslim Edildi
- "🔔 Bildirim Al" butonu → permission grant → o sipariş için push subscribe

### 7. Stok yan etkisi
- `in_production`'a geçiş otomatik consume tetikler:
  - 5×0.55=2.75m MAT_BASE_SIYAH düşer
  - 5×0.08=0.40kg BORDER_KIRMIZI düşer
  - 2 adet HEEL_PAD_ANTRASIT-KARBON düşer
  - 2 adet LOGO_PLATE_BMW düşer (sürücü+yolcu)
  - 1 kutu + 1 naylon + 1 etiket
- Eğer LOGO_PLATE_BMW < 5 ise admin'e "⚠ Kritik Stok" push gelir

### 8. Üretim ilerlemesi
- Atölye sipariş bitince: `productionStatus: 'ready'` → push: "✓ Siparişiniz Hazır"
- Kargo numarası girilince: push: "📦 Kargo Yola Çıktı: Yurtiçi · 1234567890"
- Teslim edilince admin "Tamamlandı" işaretler → push: "🎉 Sipariş Teslim Edildi"

## Verification
- Süreç boyunca Mehmet 5 push bildirimi alır (ön talep ack + onay + üretim + kargo + teslim)
- Tüm bildirimler tek tıkla takip sayfasına yönlendirir
- Atölye 1 push alır (yeni talep) + opsiyonel kritik stok uyarıları

## For an AI agent
- Bu senaryo "happy path" — hata edge'leri için orders/[orderNo].ts PATCH bloklarındaki try/catch'lere bak
- Ödeme akışı eklerken (taksit/POS) bu senaryoyu güncelle
