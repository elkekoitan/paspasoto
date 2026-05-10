/**
 * validate-catalog.ts — Carmat catalog integrity check.
 *
 * Çalıştırma: pnpm --filter web validate:catalog
 *
 * Doğrular:
 *   1. Her brand'in logoUrl dosyası /public/assets/brands/ altında var mı
 *   2. Her brand'in en az 1 model'i var mı (popular brand'ler için zorunlu)
 *   3. Her model'in brandSlug'u BRANDS'te tanımlı mı
 *   4. Brand color hex valid 6-haneli mi
 *   5. Slug'lar lowercase + hyphen-only (URL-safe)
 *
 * CI hook'una eklenebilir, build'den önce çalışır.
 */
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { BRANDS, VEHICLE_MODELS } from '../src/lib/catalog'

const ROOT = resolve(import.meta.dirname ?? '.', '..')
const PUBLIC_DIR = resolve(ROOT, 'public')

interface Issue {
  severity: 'error' | 'warn'
  brand?: string
  model?: string
  message: string
}

const issues: Issue[] = []

// 1. Brand logoUrl integrity
for (const brand of BRANDS) {
  if (!brand.logoUrl) {
    issues.push({ severity: brand.popular ? 'error' : 'warn', brand: brand.slug, message: 'logoUrl tanımlı değil' })
    continue
  }
  const relativePath = brand.logoUrl.replace(/^\//, '')
  const absolutePath = resolve(PUBLIC_DIR, relativePath)
  if (!existsSync(absolutePath)) {
    issues.push({ severity: 'error', brand: brand.slug, message: `logoUrl dosyası bulunamadı: ${brand.logoUrl}` })
  }
}

// 2. Brand color hex format (6 hane, # ile başlayan)
const hexRegex = /^#[0-9A-Fa-f]{6}$/
for (const brand of BRANDS) {
  if (brand.color && !hexRegex.test(brand.color)) {
    issues.push({ severity: 'warn', brand: brand.slug, message: `color hex format geçersiz: ${brand.color}` })
  }
}

// 3. Slug format
const slugRegex = /^[a-z0-9-]+$/
for (const brand of BRANDS) {
  if (!slugRegex.test(brand.slug)) {
    issues.push({ severity: 'error', brand: brand.slug, message: `slug format geçersiz (sadece lowercase + hyphen)` })
  }
}
for (const model of VEHICLE_MODELS) {
  if (!slugRegex.test(model.slug)) {
    issues.push({ severity: 'error', model: model.slug, message: `slug format geçersiz` })
  }
}

// 4. Model brandSlug referansı
const brandSlugs = new Set(BRANDS.map((b) => b.slug))
for (const model of VEHICLE_MODELS) {
  if (!brandSlugs.has(model.brandSlug)) {
    issues.push({ severity: 'error', model: model.slug, message: `brandSlug "${model.brandSlug}" BRANDS'te tanımlı değil` })
  }
}

// 5. Popular brand'lerin en az 1 model'i olmalı
const modelsByBrand = new Map<string, number>()
for (const model of VEHICLE_MODELS) {
  modelsByBrand.set(model.brandSlug, (modelsByBrand.get(model.brandSlug) ?? 0) + 1)
}
for (const brand of BRANDS) {
  if (brand.popular && !modelsByBrand.has(brand.slug)) {
    issues.push({ severity: 'warn', brand: brand.slug, message: 'Popular brand ama 0 model — UX\'te boş model picker çıkar' })
  }
}

// Rapor
console.log('\n📋 Carmat Catalog Integrity Report')
console.log('═'.repeat(60))
console.log(`Toplam marka:    ${BRANDS.length}`)
console.log(`Toplam model:    ${VEHICLE_MODELS.length}`)
console.log(`Popüler marka:   ${BRANDS.filter((b) => b.popular).length}`)
console.log('═'.repeat(60))

const errors = issues.filter((i) => i.severity === 'error')
const warns = issues.filter((i) => i.severity === 'warn')

if (errors.length === 0 && warns.length === 0) {
  console.log('✅ Hiç hata yok. Catalog temiz.\n')
  process.exit(0)
}

if (errors.length > 0) {
  console.log(`\n❌ ${errors.length} hata:`)
  for (const issue of errors) {
    const ctx = issue.brand ? `[brand:${issue.brand}]` : issue.model ? `[model:${issue.model}]` : ''
    console.log(`   ${ctx} ${issue.message}`)
  }
}
if (warns.length > 0) {
  console.log(`\n⚠️  ${warns.length} uyarı:`)
  for (const issue of warns) {
    const ctx = issue.brand ? `[brand:${issue.brand}]` : issue.model ? `[model:${issue.model}]` : ''
    console.log(`   ${ctx} ${issue.message}`)
  }
}

console.log()
process.exit(errors.length > 0 ? 1 : 0)
