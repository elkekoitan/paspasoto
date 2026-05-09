---
title: Carmat Wiki
status: living
last_reviewed: 2026-05-07
---

# Carmat — Project Wiki

Konya merkezli oto paspas atölyesi için custom-built **e-ticaret + üretim yönetim sistemi**.

## İçindekiler

### 00 — Mimari
- [[00-architecture/01-stack|Stack]]
- [[00-architecture/02-data-model|Veri Modeli]]
- [[00-architecture/03-data-flow|Veri Akışı]]
- [[00-architecture/04-decision-log|Karar Geçmişi (ADR)]]

### 10 — Modüller
- [[10-modules/orders|Siparişler]]
- [[10-modules/push|Web Push Bildirim]]
- [[10-modules/configurator|Konfigüratör]]
- [[10-modules/stock|Hammadde / Stok]]
- [[10-modules/integrations|E-Ticaret Entegrasyonları]]
- [[10-modules/admin-auth|Admin Auth]]

### 20 — API
- [[20-api/orders-api|Orders API]]
- [[20-api/quote-api|Quote API]]
- [[20-api/stock-api|Stock API]]
- [[20-api/integrations-api|Integrations API]]
- [[20-api/push-api|Push API]]

### 30 — Senaryolar
- [[30-scenarios/s01-customer-orders|Müşteri sipariş akışı]]
- [[30-scenarios/s02-admin-day|Admin günlük iş akışı]]
- [[30-scenarios/s03-trendyol-incoming|Trendyol siparişi gelince]]
- [[30-scenarios/s04-stock-critical|Kritik stok alarmı]]

### 40 — Runbook
- [[40-runbooks/deploy|Deploy]]
- [[40-runbooks/backup|Veri yedekleme]]
- [[40-runbooks/rotate-vapid|VAPID anahtar rotasyonu]]

### Glossary
- [[90-glossary|Terimler sözlüğü]]

## For an AI agent

Bu vault'a yeni gelen bir agent (Claude Code, ChatGPT vs.) öncelikle şunları yapsın:
1. Repo root'taki [`/CLAUDE.md`](../../CLAUDE.md)'yi oku — projeye giriş
2. Bu README'deki sıraya göre `docs/wiki/00-architecture/` klasörünü oku
3. Görev modülüyle ilgili `docs/wiki/10-modules/<modül>.md`'yi oku — her dosyanın sonunda **"For an AI agent"** bölümü var
4. Kod dokunmaya başlamadan önce `apps/web/src/server/db.ts` (tip merkezi) + ilgili module'ün ana dosyasını oku
