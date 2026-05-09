---
title: E-Posta Servisi Kurulumu (Coolify)
status: stable
last_reviewed: 2026-05-09
related: [[deploy]]
---

# E-Posta Servisi Kurulumu

Carmat e-posta için **SMTP** üzerinden çalışır — sağlayıcıdan bağımsız. Kod tarafında `apps/web/src/server/mail.ts` bütün şablonları (teklif onayı, durum değişimi, admin bildirimi) yönetir; sadece Coolify env'lerini doğru kurman yeterli.

## Sağlayıcı seçimi

Karmaşıklık ↔ maliyet trade-off:

| Sağlayıcı | Aylık ücretsiz | Türkiye delivery | Setup zorluğu | Önerilen kullanım |
|---|---|---|---|---|
| **Brevo** (Sendinblue) | 300 mail/gün | 🟢 İyi (TR sunucu) | Kolay (5 dk) | **Tavsiye edilen** — KOBİ için yeterli |
| **Resend** | 3.000 mail/ay, 100/gün | 🟢 İyi | Kolay | Developer-friendly, modern |
| **AWS SES** | 62.000 mail/ay (SES'ten) | 🟢 Çok iyi | Orta (sandbox + DKIM) | Scale ihtiyacı varsa |
| **SendGrid** | 100 mail/gün | 🟡 Orta (Avrupa) | Kolay | Tarihsel popülerlik |
| **Postal (self-host)** | Sınırsız | 🟢 IP rep'ine bağlı | **Yüksek** (DKIM/SPF/DMARC + IP warming) | Yalnızca trafik > 10k/ay |

**Tavsiye: Brevo.** 5 dakikada kuruluyor, Türkiye'den hızlı, ücretsiz tier KOBİ ihtiyacının çok üzerinde.

---

## Brevo ile kurulum (5 dakika)

### 1) Hesap aç
- https://www.brevo.com/tr/ — Kayıt ol (ücretsiz)
- E-posta doğrulama yap

### 2) SMTP credential al
- Soldaki menü → **SMTP & API** → **SMTP** sekmesi
- "Generate a new SMTP key" → Anahtar adı: `carmat-prod` → kopyala (1 kez gösterir)

Çıkan değerler:
```
Server          : smtp-relay.brevo.com
Port            : 587 (STARTTLS)
Login           : <hesap-email-adresin>
Password (key)  : xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3) Gönderici domain doğrulama (zorunlu — spam'e düşmemek için)

- Soldaki menü → **Senders, Domains & Dedicated IPs** → **Domains** sekmesi
- "Add a domain" → `carmat.com.tr` ekle
- Brevo sana 3 DNS kaydı verir (DKIM + SPF + Brevo verification):

| Tip | Host | Değer |
|---|---|---|
| TXT | `mail._domainkey.carmat.com.tr` | `k=rsa; p=...` (Brevo verir) |
| TXT | `carmat.com.tr` | `v=spf1 include:spf.brevo.com ~all` |
| TXT | `_dmarc.carmat.com.tr` | `v=DMARC1; p=none; rua=mailto:dmarc@carmat.com.tr` |

DNS registrar panelinde (Natro/GoDaddy/CloudFlare) ekle. **Yayılma 5-30 dk.**

Brevo panele dönüp "Verify" → 3'ü de yeşil olmalı.

### 4) Gönderen adresi (Sender)
- **Senders** sekmesi → "Add a sender":
  - Name: `Carmat`
  - Email: `atolye@carmat.com.tr` (e-mail adresinin domain DKIM'i geçerli olmalı)
- E-posta doğrulama gelecek → tıkla → "verified" olur

### 5) Coolify env'leri ekle

Application → Environment Variables:

```
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<brevo-hesap-email-adresin>
SMTP_PASS=<brevo-smtp-key>
SMTP_FROM=Carmat <atolye@carmat.com.tr>
SMTP_REPLY_TO=destek@carmat.com.tr
ADMIN_EMAIL=turhanhamza@gmail.com
```

> Birden fazla admin için: `ADMIN_EMAIL=admin1@x.com,admin2@y.com` (virgülle).

### 6) Restart + test

- Application → **Redeploy** (env runtime, build-arg değil → restart yeterli)
- `/admin/talepler` → yeni bir test talebi oluştur (mail adresi ekle)
- 30 sn içinde:
  - Müşteri inbox'a "Teklifiniz alındı" mail gelir
  - `ADMIN_EMAIL`'e "Yeni talep" bildirimi gelir
- Brevo panel → **Logs** sekmesi → gönderim durumlarını gör

---

## Resend ile kurulum (alternatif)

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxx     # Resend API Key
SMTP_FROM=Carmat <noreply@carmat.com.tr>
```

DNS: Resend panelinden gelen DKIM + SPF kayıtlarını ekle.

---

## Self-hosted Postal (büyük trafik)

Coolify üzerinde **Postal** servisi olarak deploy edilebilir:
- https://postal.atech.media
- IP reputation / DKIM / SPF / DMARC manuel
- Yeni IP "warming" 2-4 hafta — bu süreçte mail'lerin %20-50'si spam'e düşer
- **10.000+ mail/ay'a ulaşmadan kullanma**

---

## Hata ayıklama

| Belirti | Çözüm |
|---|---|
| Mail hiç gönderilmiyor | `SMTP_HOST` env tanımlı mı? `console.log` "skipped" yazıyor mu? |
| 535 Authentication failed | `SMTP_USER` veya `SMTP_PASS` yanlış. Brevo SMTP key'i kopyalarken boşluk gelmediğine bak. |
| 530 Must issue STARTTLS | Port 587 + `SMTP_SECURE=false`. Eğer 465 kullanıyorsan `SMTP_SECURE=true`. |
| Mail spam'e düşüyor | DKIM + SPF DNS kayıtları eksik veya yayılmamış. `dig TXT mail._domainkey.carmat.com.tr` ile doğrula. |
| `Invalid sender` | `SMTP_FROM` adresinin domain'i doğrulanmamış. Brevo "Senders" panelinde ekli mi? |
| Localhost'ta hata | `SMTP_HOST` boş bırak — `console.log` ile devam eder, dev'de mail göndermez. |

## Kod tarafı

`apps/web/src/server/mail.ts` 4 hazır şablon export eder:
- `sendQuoteReceivedMail` — müşteriye teklif onayı
- `sendStatusChangeMail` — sipariş durumu değişti
- `sendAdminNewQuoteMail` — admin'e yeni talep bildirimi
- `sendMail` — genel kullanım

Tetikleyiciler:
- `POST /api/quote` → müşteri + admin maili
- `PATCH /api/orders/[orderNo]` (productionStatus değişimi) → müşteri durum maili
