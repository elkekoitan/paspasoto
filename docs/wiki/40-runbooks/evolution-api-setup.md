---
title: Evolution API (WhatsApp Gateway) Kurulumu
status: stable
last_reviewed: 2026-05-10
related: [[../10-modules/whatsapp]], [[deploy]]
---

# Evolution API — Self-Hosted WhatsApp Gateway

Carmat'ta sipariş üretime alındığında müşteriye otomatik WhatsApp mesajı atmak için Evolution API kullanıyoruz. Open-source, Coolify'a self-host edilebilir, ücretsiz.

**Resmi:** https://github.com/EvolutionAPI/evolution-api · https://doc.evolution-api.com

## Mimari

```
Müşteri sipariş verir → admin "Üretime Al" → /api/orders/[orderNo].ts PATCH
                                                   ↓
                                   sendWhatsAppTextAsync()
                                                   ↓
                              POST {EVOLUTION_API_URL}/message/sendText/{instance}
                                                   ↓
                                Evolution API (Coolify container)
                                                   ↓
                              Atölye telefonu (WhatsApp Business)
                                                   ↓
                                       Müşteri WhatsApp
```

## Kurulum (Coolify)

### 1) Yeni Service ekle

Coolify dashboard → PaspasOto projesi → `+ Add Resource` → **Public Repository** veya **Service**

Eğer servis template varsa direkt seç; yoksa Docker Compose ekle:

```yaml
# docker-compose.yml (Coolify'a yapıştır)
version: '3.9'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_TYPE=http
      - SERVER_PORT=8080
      - SERVER_URL=https://wa.carmat.com.tr
      - DEL_INSTANCE=false
      - PROVIDER_ENABLED=false
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:${EVOLUTION_DB_PASSWORD}@evolution-db:5432/evolution?schema=public
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_carmat
      - REDIS_ENABLED=true
      - REDIS_URI=redis://evolution-redis:6379
      - REDIS_PREFIX_KEY=evolution_carmat
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - LANGUAGE=tr
      - QRCODE_LIMIT=30
      - WEBHOOK_GLOBAL_ENABLED=false
    volumes:
      - evolution-instances:/evolution/instances
    depends_on:
      - evolution-db
      - evolution-redis

  evolution-db:
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=${EVOLUTION_DB_PASSWORD}
      - POSTGRES_DB=evolution
    volumes:
      - evolution-db-data:/var/lib/postgresql/data

  evolution-redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - evolution-redis-data:/data

volumes:
  evolution-instances:
  evolution-db-data:
  evolution-redis-data:
```

### 2) Coolify env değişkenleri (Evolution API service için)

```
EVOLUTION_API_KEY=<rastgele 32+ char>            # POST request'lerde header
EVOLUTION_DB_PASSWORD=<rastgele 32+ char>        # postgres pass
```

`EVOLUTION_API_KEY` üretmek için PowerShell:
```powershell
[System.Guid]::NewGuid().ToString("N") + [System.Guid]::NewGuid().ToString("N")
```

### 3) Domain ve SSL

Evolution API service için Coolify domain:
- `wa.carmat.com.tr` (carmat.com.tr DNS'ine A kaydı eklendikten sonra)
- HTTPS Let's Encrypt otomatik

DNS kaydı (registrar paneli):
```
A    wa    185.255.95.111    300
```

### 4) Carmat backend env'leri ekle (paspasoto-web service)

Coolify → paspasoto-web → Environment Variables:
```
EVOLUTION_API_URL=https://wa.carmat.com.tr
EVOLUTION_API_KEY=<aynı değer, EVOLUTION_API_KEY ile>
EVOLUTION_INSTANCE_NAME=carmat
WHATSAPP_AUTO_SEND=true
```

### 5) Instance oluştur ve QR kodla bağla

Evolution API panelde veya curl ile:

```bash
# Instance oluştur (instance adı: carmat)
curl -X POST https://wa.carmat.com.tr/instance/create \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "carmat",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

Response içinde `qrcode.base64` field'ı gelir. Bu base64 PNG'yi decode edip görsel olarak göster:

```bash
# Linux/Mac
echo "<base64-string>" | base64 -d > /tmp/qr.png && open /tmp/qr.png
```

Veya tarayıcıda:
```
data:image/png;base64,<base64-string>
```

**Atölyenin WhatsApp Business uygulamasında**: Ayarlar → Bağlı Cihazlar → Cihaz Bağla → QR kodu okut. ~30 saniye içinde Evolution API instance bağlanır.

### 6) Test mesajı

```bash
curl -X POST https://wa.carmat.com.tr/message/sendText/carmat \
  -H "apikey: $EVOLUTION_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "905551112233",
    "options": {
      "delay": 1200,
      "presence": "composing"
    },
    "textMessage": {
      "text": "Carmat Evolution API test mesajı 🎉"
    }
  }'
```

WhatsApp'a mesaj geldiyse kurulum tamam.

## Carmat akışı

`apps/web/src/server/whatsapp-client.ts` Evolution API'ye HTTP atar:

| Trigger | Şablon |
|---|---|
| `productionStatus: received → in_production` | "Üretime alındı + takip linki" |
| `productionStatus: in_production → ready` | "Hazır + kargo no varsa" |
| `productionStatus: ready → delivered` | "Teslim edildi + memnuniyet" |

Otomatik gönderim env'e bağlı: `WHATSAPP_AUTO_SEND=true` ise gönderir, `false` ise sadece `console.log`.

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| Instance "disconnected" | QR kodu yeniden okut (Evolution API panelden) |
| Mesaj iletilmiyor ama 200 OK | Numara format hatası — `90` ile başlayıp 12 hane mi? |
| 401 Unauthorized | `EVOLUTION_API_KEY` Carmat env'i ile Evolution API env'i eşit mi? |
| QR kod gözükmüyor | `QRCODE_LIMIT=30` env Evolution service'de tanımlı mı? |
| Postgres connection refused | `evolution-db` container `running` durumda mı? |
| Mesaj gecikmeli | `options.delay` ms'i artır (1200 → 2500); WhatsApp anti-spam |

## Hesap bağlantı kopması

Atölye telefonu 14+ gün WhatsApp Business açmadıysa veya WhatsApp policy ihlali algılarsa instance düşer. Çözüm:
1. Atölye telefonunda WhatsApp Business → Ayarlar → Bağlı Cihazlar
2. "Carmat" cihazını silmeyin (zaten gözükmez)
3. Evolution API panel → instance "carmat" → "Connect" → yeni QR
4. Yeni QR'ı atölye telefonu ile okutun

## Maliyet

- **Evolution API kendisi**: Ücretsiz (open-source)
- **Hosting**: Coolify VPS'inde +500MB RAM (~Postgres + Redis dahil)
- **WhatsApp Business policy**: Carmat müşterisi olmayan kişilere mesaj atmayın (spam = hesap kapatılır). Sadece sipariş veren müşteriye göndermek güvenlidir.

## Alternatifler

- **Meta WhatsApp Cloud API** (resmi): aylık 1000 mesaj ücretsiz, sonra ~$0.005/mesaj. Business onayı gerekir (~3 gün).
- **Twilio WhatsApp**: $0.005/mesaj, hesap onayı gerek
- **whatsapp-web.js**: Self-host ama Carmat backend ile entegre — daha düşük kararlılık

Carmat MVP'sinde Evolution API tercih edildi: ücretsiz, Coolify'a self-host edilir, mesaj limiti yok (atölye telefonunun WhatsApp Business limiti dışında).
