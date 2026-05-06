/**
 * Yer tutucu katalog verisi.
 * Strapi entegrasyonu tamamlandığında `lib/strapi.ts` üzerinden değiştirilecek.
 * Veri şekli Strapi content type'larıyla aynıdır (PRD §10.3).
 */

export type Brand = {
  id: number
  slug: string
  name: string
  popular: boolean
  // Logo Strapi'den gelecek; placeholder olarak baş harf rozetiyle gösteriyoruz.
  logo?: string
}

export type VehicleModel = {
  id: number
  brandSlug: string
  slug: string
  name: string
  chassisCode: string
  yearStart: number
  yearEnd: number
}

export type MatColor = {
  id: number
  slug: string
  name: string
  hex: string
  swatchImage?: string
}

export type BorderColor = MatColor

export type HeelPad = {
  id: number
  slug: string
  name: string
  textureHex: string // Tahmini doku rengi placeholder
  pricePremium: number
  isStandard: boolean
}

export type LogoAccessory = {
  id: number
  brandSlug: string | null
  name: string
  price: number
}

export type Product = {
  id: number
  slug: string
  name: string
  basePrice: number
  parts: number
  includesTrunk: boolean
}

export const BRANDS: Brand[] = [
  { id: 1, slug: 'audi', name: 'Audi', popular: true },
  { id: 2, slug: 'bmw', name: 'BMW', popular: true },
  { id: 3, slug: 'mercedes', name: 'Mercedes-Benz', popular: true },
  { id: 4, slug: 'volkswagen', name: 'Volkswagen', popular: true },
  { id: 5, slug: 'skoda', name: 'Škoda', popular: true },
  { id: 6, slug: 'hyundai', name: 'Hyundai', popular: true },
  { id: 7, slug: 'ford', name: 'Ford', popular: true },
  { id: 8, slug: 'peugeot', name: 'Peugeot', popular: true },
  { id: 9, slug: 'renault', name: 'Renault', popular: true },
  { id: 10, slug: 'fiat', name: 'Fiat', popular: true },
  { id: 11, slug: 'toyota', name: 'Toyota', popular: true },
  { id: 12, slug: 'honda', name: 'Honda', popular: true },
  { id: 13, slug: 'opel', name: 'Opel', popular: true },
  { id: 14, slug: 'volvo', name: 'Volvo', popular: false },
  { id: 15, slug: 'citroen', name: 'Citroën', popular: false },
  { id: 16, slug: 'seat', name: 'Seat', popular: false },
  { id: 17, slug: 'dacia', name: 'Dacia', popular: true },
  { id: 18, slug: 'kia', name: 'Kia', popular: true },
  { id: 19, slug: 'nissan', name: 'Nissan', popular: false },
  { id: 20, slug: 'mazda', name: 'Mazda', popular: false },
]

export const VEHICLE_MODELS: VehicleModel[] = [
  { id: 1, brandSlug: 'bmw', slug: '3-serisi-f30', name: '3 Serisi', chassisCode: 'F30', yearStart: 2012, yearEnd: 2018 },
  { id: 2, brandSlug: 'bmw', slug: '3-serisi-g20', name: '3 Serisi', chassisCode: 'G20', yearStart: 2019, yearEnd: 2026 },
  { id: 3, brandSlug: 'bmw', slug: '5-serisi-g30', name: '5 Serisi', chassisCode: 'G30', yearStart: 2017, yearEnd: 2023 },
  { id: 4, brandSlug: 'audi', slug: 'a3-8v', name: 'A3', chassisCode: '8V', yearStart: 2012, yearEnd: 2020 },
  { id: 5, brandSlug: 'audi', slug: 'a4-b9', name: 'A4', chassisCode: 'B9', yearStart: 2015, yearEnd: 2024 },
  { id: 6, brandSlug: 'volkswagen', slug: 'passat-b8', name: 'Passat', chassisCode: 'B8', yearStart: 2014, yearEnd: 2023 },
  { id: 7, brandSlug: 'volkswagen', slug: 'golf-7', name: 'Golf', chassisCode: 'Mk7', yearStart: 2012, yearEnd: 2020 },
  { id: 8, brandSlug: 'mercedes', slug: 'c-serisi-w205', name: 'C Serisi', chassisCode: 'W205', yearStart: 2014, yearEnd: 2021 },
  { id: 9, brandSlug: 'skoda', slug: 'octavia-mk3', name: 'Octavia', chassisCode: 'Mk3', yearStart: 2013, yearEnd: 2020 },
  { id: 10, brandSlug: 'hyundai', slug: 'i20-bc3', name: 'i20', chassisCode: 'BC3', yearStart: 2020, yearEnd: 2026 },
  { id: 11, brandSlug: 'ford', slug: 'focus-mk4', name: 'Focus', chassisCode: 'Mk4', yearStart: 2018, yearEnd: 2026 },
  { id: 12, brandSlug: 'renault', slug: 'megane-4', name: 'Megane', chassisCode: 'Mk4', yearStart: 2016, yearEnd: 2023 },
  { id: 13, brandSlug: 'dacia', slug: 'duster-2', name: 'Duster', chassisCode: 'Mk2', yearStart: 2018, yearEnd: 2024 },
  { id: 14, brandSlug: 'fiat', slug: 'egea-sedan', name: 'Egea', chassisCode: 'Sedan', yearStart: 2015, yearEnd: 2026 },
  { id: 15, brandSlug: 'toyota', slug: 'corolla-e210', name: 'Corolla', chassisCode: 'E210', yearStart: 2018, yearEnd: 2026 },
  { id: 16, brandSlug: 'peugeot', slug: '301', name: '301', chassisCode: 'P301', yearStart: 2012, yearEnd: 2024 },
  { id: 17, brandSlug: 'opel', slug: 'astra-k', name: 'Astra', chassisCode: 'K', yearStart: 2015, yearEnd: 2021 },
  { id: 18, brandSlug: 'kia', slug: 'sportage-5', name: 'Sportage', chassisCode: 'NQ5', yearStart: 2021, yearEnd: 2026 },
  { id: 19, brandSlug: 'honda', slug: 'civic-fc5', name: 'Civic', chassisCode: 'FC5', yearStart: 2016, yearEnd: 2021 },
  { id: 20, brandSlug: 'volvo', slug: 'xc60-2', name: 'XC60', chassisCode: 'Gen2', yearStart: 2017, yearEnd: 2026 },
]

export const MAT_COLORS: MatColor[] = [
  { id: 1, slug: 'siyah', name: 'Siyah', hex: '#0f0f12' },
  { id: 2, slug: 'gri', name: 'Gri', hex: '#5a5a60' },
  { id: 3, slug: 'fume', name: 'Füme', hex: '#3a3a40' },
  { id: 4, slug: 'mavi', name: 'Mavi', hex: '#1e3a8a' },
  { id: 5, slug: 'taba', name: 'Taba', hex: '#8a5a3a' },
  { id: 6, slug: 'kirmizi', name: 'Kırmızı', hex: '#9b1c1c' },
  { id: 7, slug: 'kahve', name: 'Kahve', hex: '#4a2a1a' },
  { id: 8, slug: 'bordo', name: 'Bordo', hex: '#6b1f2e' },
  { id: 9, slug: 'bej', name: 'Bej', hex: '#d6c5a8' },
  { id: 10, slug: 'turuncu-taba', name: 'Turuncu Taba', hex: '#c87632' },
]

export const BORDER_COLORS: BorderColor[] = [
  { id: 1, slug: 'kahve', name: 'Kahve', hex: '#4a2a1a' },
  { id: 2, slug: 'taba', name: 'Taba', hex: '#8a5a3a' },
  { id: 3, slug: 'krem', name: 'Krem', hex: '#e8d8b8' },
  { id: 4, slug: 'yesil', name: 'Yeşil', hex: '#1a5a2e' },
  { id: 5, slug: 'sari', name: 'Sarı', hex: '#d4a836' },
  { id: 6, slug: 'turuncu', name: 'Turuncu', hex: '#d4762c' },
  { id: 7, slug: 'kirmizi', name: 'Kırmızı', hex: '#b91c1c' },
  { id: 8, slug: 'mor', name: 'Mor', hex: '#5b21b6' },
  { id: 9, slug: 'lacivert', name: 'Lacivert', hex: '#1e1e4a' },
  { id: 10, slug: 'koyu-mavi', name: 'Koyu Mavi', hex: '#1e3a8a' },
  { id: 11, slug: 'turkuaz', name: 'Turkuaz', hex: '#0e7490' },
  { id: 12, slug: 'gri', name: 'Gri', hex: '#6b6b71' },
  { id: 13, slug: 'fume', name: 'Füme', hex: '#3a3a40' },
  { id: 14, slug: 'siyah', name: 'Siyah', hex: '#0f0f12' },
  { id: 15, slug: 'bordo', name: 'Bordo', hex: '#6b1f2e' },
  { id: 16, slug: 'beyaz', name: 'Beyaz', hex: '#f1f1ee' },
  { id: 17, slug: 'somon', name: 'Somon', hex: '#f08374' },
  { id: 18, slug: 'altin', name: 'Altın', hex: '#caa455' },
]

export const HEEL_PADS: HeelPad[] = [
  { id: 1, slug: 'standart-siyah-noktali', name: 'Siyah Noktalı (Standart)', textureHex: '#15151b', pricePremium: 0, isStandard: true },
  { id: 2, slug: 'karbon-antrasit', name: 'Karbon Doku Antrasit', textureHex: '#1a1a20', pricePremium: 150, isStandard: false },
  { id: 3, slug: 'beyaz-noktali', name: 'Beyaz Noktalı', textureHex: '#dfdfd6', pricePremium: 100, isStandard: false },
  { id: 4, slug: 'mavi-noktali', name: 'Mavi Noktalı', textureHex: '#1e3a8a', pricePremium: 100, isStandard: false },
  { id: 5, slug: 'kirmizi-noktali', name: 'Kırmızı Noktalı', textureHex: '#9b1c1c', pricePremium: 100, isStandard: false },
  { id: 6, slug: 'krem-noktali', name: 'Krem Noktalı', textureHex: '#d6c5a8', pricePremium: 100, isStandard: false },
  { id: 7, slug: 'metalik-gumus', name: 'Metalik Gümüş', textureHex: '#a8a8b0', pricePremium: 200, isStandard: false },
  { id: 8, slug: 'turuncu-noktali', name: 'Turuncu Noktalı', textureHex: '#c87632', pricePremium: 100, isStandard: false },
]

export const LOGO_ACCESSORIES: LogoAccessory[] = BRANDS.map((b, i) => ({
  id: 100 + i,
  brandSlug: b.slug,
  name: `${b.name} Amblem`,
  price: 150,
}))
LOGO_ACCESSORIES.push({ id: 99, brandSlug: null, name: 'İstemiyorum', price: 0 })

export const PRODUCTS: Product[] = [
  { id: 1, slug: 'surucu-yolcu', name: 'Sürücü + Yolcu (2\'li)', basePrice: 1490, parts: 2, includesTrunk: false },
  { id: 2, slug: '4lu-set', name: '4\'lü Set', basePrice: 1990, parts: 4, includesTrunk: false },
  { id: 3, slug: '4lu-bagaj', name: '4\'lü + Bagaj', basePrice: 2490, parts: 5, includesTrunk: true },
]

export const POPULAR_BRANDS = BRANDS.filter((b) => b.popular)

export function getBrandBySlug(slug: string) {
  return BRANDS.find((b) => b.slug === slug)
}

export function getModelsByBrand(slug: string) {
  return VEHICLE_MODELS.filter((m) => m.brandSlug === slug)
}

export function getModelBySlug(brandSlug: string, modelSlug: string) {
  return VEHICLE_MODELS.find((m) => m.brandSlug === brandSlug && m.slug === modelSlug)
}
