---
title: Glossary
status: living
last_reviewed: 2026-05-07
---

# Terimler Sözlüğü

## Domain (oto paspas)
- **Paspas** — araç içi zemin koruyucu. Carmat'ta "3D havuzlu" — kenarlardan yukarı kıvrılmış model.
- **Set** — bir araç için kaç paspas (2'li = sürücü+yolcu, 4'lü = + arka koltuklar, 4'lü+bagaj = + bagaj havuzu).
- **Mat zemin** — paspasın havuzlu yüzey malzemesi (10 renk).
- **Biye / Kenarlık** — paspasın çevresini saran şerit kumaş (15 renk).
- **Topukluk** — sürücü tarafında ayağın geldiği bölgeye eklenen aşınma plakası (8 tür).
- **Amblem / Logo plakası** — paspas üzerine monte edilen paslanmaz çelik marka rozeti.

## Sistem terimleri
- **Order** — DB'deki sipariş kaydı (kind='order').
- **Quote** — müşteri ön talebi (kind='quote'), admin onayıyla order'a dönüşür.
- **OrderItem** — bir sipariş içindeki ürün satırı. Bir order'ın `items[]` dizisi 1+ item içerebilir (örn. paspas + koltuk kılıfı aynı siparişte).
- **Channel** — siparişin geldiği kanal: `manual`, `configurator`, `physical_store`, `trendyol`, `hepsiburada`, vs.
- **externalRef** — dış platform sipariş kimliği. Webhook idempotency için kullanılır.
- **MatPosition** — araç içinde hangi paspas: `driver`, `passenger`, `leftRear`, `rightRear`, `trunk`.
- **LogoPlacement** — logonun paspas üzerindeki yerleşimi: `top` (üst), `middle` (orta), `bottom` (alt).
- **HeelPosition** — topukluk konumu: `driver-only`, `passenger-only`, `both`, `none`.
- **DeliveryMethod** — `cargo` (kargo ile) | `pickup` (dükkandan teslim).
- **PaymentMethod** — `elden-nakit`, `elden-kart`, `havale`, `kapida`, `sonra`, `taksit`.
- **PaymentStatus** — `bekliyor`, `kismi`, `tamamlandi`, `iade`.
- **ProductionStatus** — `received`, `in_production`, `ready`, `delivered`, `cancelled`.

## Stok terimleri
- **SKU** — Stock Keeping Unit, hammadde kalemi kodu (`MAT_BASE_SIYAH`).
- **StockKind** — kategori: `mat_base`, `border_trim`, `heel_pad`, `logo_plate`, `seat_fabric`, `steering_grip`, `packaging`, `thread`.
- **StockUnit** — birim: `meter`, `kg`, `piece`.
- **Recipe** — ürün → hammadde tüketim formülü (`stock-recipes.ts`).
- **Movement** — stok hareketi (giriş/çıkış/sayım/fire). Append-only.
- **Critical threshold** — bunun altına düşünce admin'e push.

## PWA / Push terimleri
- **VAPID** — Web Push protokolü için anahtar çifti (public/private). Server'ın "kim olduğunu" doğrular.
- **Audience** — push bildirimde hedef grubu: `'admin'` veya `'order:<orderNo>'`.
- **Subscription** — tarayıcının push sunucusuna kayıt token'ı (endpoint + p256dh + auth).
- **PWA standalone** — uygulama ana ekrana eklendiğinde fullscreen native gibi açılma.

## Kod terimleri
- **Adapter pattern** — e-ticaret entegrasyonlarında her platform için izole modül (verify + parse).
- **Idempotency** — aynı isteği N kez yapsan da sonuç değişmez (webhook duplicate, stok consume duplicate önleme).
- **Atomik write** — temp dosya + rename (kaynak: ENOSPC veya crash sırasında veri kaybı olmaz).
- **HMAC** — Hash-based Message Authentication Code, cookie/webhook imzasında kullanılır.
- **Append-only log** — sadece sona ekle, eski entry'lere asla overwrite yapma (audit trail).

## Türkçe-İngilizce hızlı liste
| TR | EN |
|---|---|
| Sipariş | Order |
| Talep / Teklif | Quote |
| Aşama / Durum | Stage / Status |
| Üretim | Production |
| Topukluk | Heel pad |
| Kenarlık / Biye | Border / Trim |
| Amblem | Emblem / Logo plate |
| Atölye | Workshop / Atelier |
| Hammadde | Raw material |
| Ön talep | Pre-order / Quote |
| Tahsilat | Collection / Payment |
| Sayım | Stock count |
| Fire | Waste |
