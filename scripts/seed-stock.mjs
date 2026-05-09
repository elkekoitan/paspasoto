/**
 * Carmat — ilk stok seed.
 * Çalıştırma: node scripts/seed-stock.mjs
 *
 * apps/web/.data/stock.json'a varsayılan SKU + qty + kritik eşik yazar.
 * (Coolify production'da DATA_DIR=/data — orada manuel seed yapılır veya
 *  ilk admin girişinde "stoklara seed uygula" butonu eklenebilir.)
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = resolve(__dirname, '..', 'apps', 'web', '.data')
const FILE = resolve(DATA_DIR, 'stock.json')

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })

const now = Date.now()
const item = (sku, kind, label, unit, qty, criticalThreshold, reorderQty, supplierNote) => ({
  sku, kind, label, unit, qty, criticalThreshold, reorderQty, supplierNote, lastUpdated: now,
})

const matColors = [
  ['SIYAH', 'Siyah'], ['GRI', 'Gri'], ['FUME', 'Füme'], ['MAVI', 'Mavi'],
  ['TABA', 'Taba'], ['KIRMIZI', 'Kırmızı'], ['KAHVE', 'Kahve'], ['BORDO', 'Bordo'],
  ['BEJ', 'Bej'], ['TURUNCU-TABA', 'Turuncu Taba'],
]
const borderColors = [
  ['KAHVE', 'Kahve'], ['TABA', 'Taba'], ['KREM', 'Krem'], ['YESIL', 'Yeşil'],
  ['SARI', 'Sarı'], ['TURUNCU', 'Turuncu'], ['KIRMIZI', 'Kırmızı'], ['MOR', 'Mor'],
  ['LACIVERT', 'Lacivert'], ['KOYU-MAVI', 'Koyu Mavi'], ['TURKUAZ', 'Turkuaz'],
  ['GRI', 'Gri'], ['FUME', 'Füme'], ['SIYAH', 'Siyah'], ['BORDO', 'Bordo'],
]
const heelPads = [
  ['STANDART', 'Standart Antrasit'], ['ANTRASIT-KARBON', 'Karbon Doku Antrasit'],
  ['BEYAZ-NOKTALI', 'Beyaz Karbon'], ['MAVI-NOKTALI', 'Mavi Noktalı'],
  ['KIRMIZI-NOKTALI', 'Kırmızı Noktalı'], ['KREM-NOKTALI', 'Krem Noktalı'],
  ['SIYAH-NOKTALI', 'Siyah Noktalı'], ['TURUNCU-NOKTALI', 'Turuncu Noktalı'],
]
const brands = [
  'AUDI', 'BMW', 'MERCEDES', 'VOLKSWAGEN', 'SKODA', 'HYUNDAI', 'FORD', 'PEUGEOT',
  'RENAULT', 'FIAT', 'TOYOTA', 'HONDA', 'OPEL', 'VOLVO', 'CITROEN', 'SEAT', 'DACIA',
  'KIA', 'NISSAN', 'MAZDA', 'MINI', 'PORSCHE', 'LEXUS', 'TESLA', 'SUBARU',
  'MITSUBISHI', 'SUZUKI', 'JEEP', 'LANDROVER', 'JAGUAR', 'CHEVROLET', 'MG',
  'CUPRA', 'BYD', 'TOGG', 'IVECO', 'ISUZU', 'MAHINDRA', 'CHERY', 'HONGQI',
]

const stock = []

// Paspas tabanı (rulo metre) — 50m / kritik 10m
for (const [code, label] of matColors) {
  stock.push(item(`MAT_BASE_${code}`, 'mat_base', `${label} paspas tabanı`, 'meter', 50, 10, 30, 'Konya tekstil'))
}
// Kenarlık biye (kg) — 5kg / kritik 1kg
for (const [code, label] of borderColors) {
  stock.push(item(`BORDER_${code}`, 'border_trim', `${label} kenarlık biye`, 'kg', 5, 1, 3, 'Bursa biye atölyesi'))
}
// Topukluk pedi (adet) — 50 / kritik 10
for (const [code, label] of heelPads) {
  stock.push(item(`HEEL_PAD_${code}`, 'heel_pad', `${label} topukluk pedi`, 'piece', 50, 10, 30))
}
// Marka amblem plakası (adet) — 30 / kritik 5
for (const code of brands) {
  stock.push(item(`LOGO_PLATE_${code}`, 'logo_plate', `${code} amblem plakası`, 'piece', 30, 5, 20, 'Lazer kesim atölyesi'))
}

// Koltuk kumaşı (3 malzeme × 6 renk = 18 SKU) — 30m / kritik 5m
for (const mat of ['LEATHER', 'FABRIC', 'MESH']) {
  for (const col of ['BLACK', 'GREY', 'BEIGE', 'BROWN', 'NAVY', 'CREAM']) {
    stock.push(item(`SEAT_FABRIC_${mat}_${col}`, 'seat_fabric', `${mat.toLowerCase()} ${col.toLowerCase()} kumaş`, 'meter', 30, 5, 20))
  }
}

// Direksiyon kılıfı (3 boyut × 4 desen = 12 SKU) — 40 / kritik 8
for (const size of ['S', 'M', 'L']) {
  for (const pattern of ['SPORT', 'CLASSIC', 'CARBON', 'PERFORATED']) {
    stock.push(item(`STEERING_${size}_${pattern}`, 'steering_grip', `Direksiyon ${size} ${pattern.toLowerCase()}`, 'piece', 40, 8, 30))
  }
}

// İplik
stock.push(item('THREAD_GENERIC', 'thread', 'Dikiş ipliği (genel)', 'kg', 10, 2, 5))

// Paketleme (200 adet / kritik 30)
stock.push(item('PACKAGING_BOX', 'packaging', 'Karton kutu', 'piece', 200, 30, 100))
stock.push(item('PACKAGING_NYLON', 'packaging', 'Naylon ambalaj', 'piece', 200, 30, 100))
stock.push(item('PACKAGING_FOAM', 'packaging', 'Köpük balonu', 'piece', 200, 30, 100))
stock.push(item('PACKAGING_LABEL', 'packaging', 'Kargo etiketi', 'piece', 500, 50, 200))

writeFileSync(FILE, JSON.stringify(stock, null, 2), 'utf8')
console.log(`✓ ${stock.length} SKU yazıldı: ${FILE}`)
console.log(`  Mat tabanı: ${matColors.length} renk`)
console.log(`  Kenarlık: ${borderColors.length} renk`)
console.log(`  Topukluk: ${heelPads.length} tür`)
console.log(`  Marka amblemi: ${brands.length} marka`)
console.log(`  Koltuk kumaşı: 18 varyant`)
console.log(`  Direksiyon: 12 varyant`)
console.log(`  Paketleme: 4 kalem · İplik: 1`)
