/**
 * Carmat katalog verisi (V1, statik).
 * - 40 marka, lokal SVG logo (/assets/brands/<slug>.svg)
 * - 102 model + jenerasyon (chassis code), bodyType, yıl aralığı
 * - 10 mat rengi · 15 kenarlık · 8 topukluk · brand bazlı amblem · 3 set
 *
 * Logoları yenilemek için: `node scripts/download-brand-logos.mjs`
 */

export type Brand = {
  id: number
  slug: string
  name: string
  popular: boolean
  iconSlug?: string
  color?: string
  /** Lokal SVG yolu — /assets/brands/<slug>.svg */
  logoUrl?: string
}

/**
 * Kasa tipi — sahibinden.com seviyesi seçim için.
 * Paspas için kritik (sedan ile station/touring zemini farklı, suv ile sedan farklı, vs.).
 */
export type BodyType =
  | 'sedan'
  | 'hatchback'      // 5 kapı
  | 'hatchback-3'    // 3 kapı (Mini, Cooper 3-door)
  | 'station'        // Station / Touring / Estate / SW
  | 'suv'            // Sport utility vehicle
  | 'crossover'      // Yüksek hatchback (CUV)
  | 'mpv'            // Çok amaçlı (Doblo, Berlingo, vb.)
  | 'coupe'
  | 'cabrio'
  | 'pickup'
  | 'van'            // Yük taşıyan ticari

export type VehicleModel = {
  id: number
  brandSlug: string
  slug: string
  name: string
  /** Üretici şasi kodu — jenerasyon ayrımı için kritik (örn. F30 vs G20) */
  chassisCode: string
  yearStart: number
  yearEnd: number
  bodyType?: BodyType
  /** Bu jenerasyonun mevcut alt body type'ları (Audi A4 sedan + avant gibi) */
  alternativeBodies?: BodyType[]
  /** Standart koltuk sayısı (5 default; 7 koltuklu MPV/SUV için 7) */
  seats?: 5 | 7
}

/** Yakıt tipi — sahibinden.com filtre seviyesi */
export type FuelType =
  | 'benzin'
  | 'dizel'
  | 'lpg'
  | 'hibrit'      // benzin-elektrik (HEV)
  | 'phev'        // plug-in hybrid
  | 'elektrik'    // tam elektrikli
  | 'cng'

/** Şanzıman tipi */
export type Transmission =
  | 'manuel'
  | 'otomatik'
  | 'yari-otomatik'
  | 'cvt'
  | 'dct'         // dual-clutch (DSG, PDK, S-Tronic)

/** Çekiş tipi */
export type DriveType = 'fwd' | 'rwd' | 'awd' | '4wd'

/**
 * VehicleTrim — Marka×Model×Yıl seçimine ek bir alt katman: motor + donanım.
 * Paspas üretimi için TEKNİK olarak gereksiz (chassis kodu yeter), ama UX
 * açısından "tam aracımı seçtim" hissi verir + admin'e satılan tam donanım
 * bilgisi düşer.
 *
 * Trim verisi opsiyoneldir — bir model için trim yoksa kullanıcı yıl seçince
 * direkt mat seçimine geçer. Trim varsa ek bir step (TrimStep) gösterilir.
 */
export type VehicleTrim = {
  id: number
  modelId: number              // VehicleModel.id referansı
  /** Trim adı, örn. "1.4 TFSI Sport DSG", "320d xDrive Sport", "1.6 16V" */
  name: string
  /** Motor (boyut + teknoloji), örn. "1.4L TFSI", "2.0 TDI", "1.6 MultiAir" */
  engine?: string
  /** Beygir gücü (HP) */
  power?: number
  fuel?: FuelType
  transmission?: Transmission
  drive?: DriveType
  /** Donanım paketi adı, örn. "Sport", "Premium", "Comfort", "Trend" */
  package?: string
  /** Üretim yıl aralığı (model'in genelinden farklıysa) */
  yearStart?: number
  yearEnd?: number
}

export type MatColor = {
  id: number
  slug: string
  name: string
  hex: string
  threadHex: string // Color of the diamond stitching thread
  swatchUrl: string
  previewUrl?: string
  showroomUrl?: string
}

export type BorderColor = MatColor

export type HeelPad = {
  id: number
  slug: string
  name: string
  textureHex: string
  swatchUrl: string
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
  { id: 1, slug: 'audi', name: 'Audi', popular: true, iconSlug: 'audi', color: '#BB0A30', logoUrl: '/assets/brands/audi.svg' },
  { id: 2, slug: 'bmw', name: 'BMW', popular: true, iconSlug: 'bmw', color: '#0066B1', logoUrl: '/assets/brands/bmw.svg' },
  { id: 3, slug: 'mercedes', name: 'Mercedes-Benz', popular: true, color: '#A4AAAE', logoUrl: '/assets/brands/mercedes.svg' },
  { id: 4, slug: 'volkswagen', name: 'Volkswagen', popular: true, iconSlug: 'volkswagen', color: '#151F5D', logoUrl: '/assets/brands/volkswagen.svg' },
  { id: 5, slug: 'skoda', name: 'Škoda', popular: true, iconSlug: 'skoda', color: '#4BA82E', logoUrl: '/assets/brands/skoda.svg' },
  { id: 6, slug: 'hyundai', name: 'Hyundai', popular: true, iconSlug: 'hyundai', color: '#002C5F', logoUrl: '/assets/brands/hyundai.svg' },
  { id: 7, slug: 'ford', name: 'Ford', popular: true, iconSlug: 'ford', color: '#003478', logoUrl: '/assets/brands/ford.svg' },
  { id: 8, slug: 'peugeot', name: 'Peugeot', popular: true, iconSlug: 'peugeot', color: '#00A3E0', logoUrl: '/assets/brands/peugeot.svg' },
  { id: 9, slug: 'renault', name: 'Renault', popular: true, iconSlug: 'renault', color: '#FFCC00', logoUrl: '/assets/brands/renault.svg' },
  { id: 10, slug: 'fiat', name: 'Fiat', popular: true, iconSlug: 'fiat', color: '#A6192E', logoUrl: '/assets/brands/fiat.svg' },
  { id: 11, slug: 'toyota', name: 'Toyota', popular: true, iconSlug: 'toyota', color: '#EB0A1E', logoUrl: '/assets/brands/toyota.svg' },
  { id: 12, slug: 'honda', name: 'Honda', popular: true, iconSlug: 'honda', color: '#E40521', logoUrl: '/assets/brands/honda.svg' },
  { id: 13, slug: 'opel', name: 'Opel', popular: true, iconSlug: 'opel', color: '#F7FF14', logoUrl: '/assets/brands/opel.svg' },
  { id: 14, slug: 'volvo', name: 'Volvo', popular: false, iconSlug: 'volvo', color: '#003057', logoUrl: '/assets/brands/volvo.svg' },
  { id: 15, slug: 'citroen', name: 'Citroën', popular: true, iconSlug: 'citroen', color: '#7A1F1F', logoUrl: '/assets/brands/citroen.svg' },
  { id: 16, slug: 'seat', name: 'Seat', popular: false, iconSlug: 'seat', color: '#C49A57', logoUrl: '/assets/brands/seat.svg' },
  { id: 17, slug: 'dacia', name: 'Dacia', popular: true, iconSlug: 'dacia', color: '#646B52', logoUrl: '/assets/brands/dacia.svg' },
  { id: 18, slug: 'kia', name: 'Kia', popular: true, iconSlug: 'kia', color: '#05141F', logoUrl: '/assets/brands/kia.svg' },
  { id: 19, slug: 'nissan', name: 'Nissan', popular: true, iconSlug: 'nissan', color: '#C3002F', logoUrl: '/assets/brands/nissan.svg' },
  { id: 20, slug: 'mazda', name: 'Mazda', popular: false, iconSlug: 'mazda', color: '#101010', logoUrl: '/assets/brands/mazda.svg' },
  { id: 21, slug: 'mini', name: 'MINI', popular: false, iconSlug: 'mini', color: '#000000', logoUrl: '/assets/brands/mini.svg' },
  { id: 22, slug: 'porsche', name: 'Porsche', popular: false, iconSlug: 'porsche', color: '#D5001C', logoUrl: '/assets/brands/porsche.svg' },
  { id: 23, slug: 'lexus', name: 'Lexus', popular: false, color: '#1A1A1A', logoUrl: '/assets/brands/lexus.svg' },
  { id: 24, slug: 'tesla', name: 'Tesla', popular: true, iconSlug: 'tesla', color: '#CC0000', logoUrl: '/assets/brands/tesla.svg' },
  { id: 25, slug: 'subaru', name: 'Subaru', popular: false, iconSlug: 'subaru', color: '#0041AA', logoUrl: '/assets/brands/subaru.svg' },
  { id: 26, slug: 'mitsubishi', name: 'Mitsubishi', popular: false, iconSlug: 'mitsubishi', color: '#E60012', logoUrl: '/assets/brands/mitsubishi.svg' },
  { id: 27, slug: 'suzuki', name: 'Suzuki', popular: false, iconSlug: 'suzuki', color: '#CD1424', logoUrl: '/assets/brands/suzuki.svg' },
  { id: 28, slug: 'jeep', name: 'Jeep', popular: false, iconSlug: 'jeep', color: '#374B49', logoUrl: '/assets/brands/jeep.svg' },
  { id: 29, slug: 'landrover', name: 'Land Rover', popular: false, color: '#005A2B', logoUrl: '/assets/brands/landrover.svg' },
  { id: 30, slug: 'jaguar', name: 'Jaguar', popular: false, color: '#222B33', logoUrl: '/assets/brands/jaguar.svg' },
  { id: 31, slug: 'chevrolet', name: 'Chevrolet', popular: false, iconSlug: 'chevrolet', color: '#FFCC00', logoUrl: '/assets/brands/chevrolet.svg' },
  { id: 32, slug: 'mg', name: 'MG', popular: true, color: '#E10A2D', logoUrl: '/assets/brands/mg.svg' },
  { id: 33, slug: 'cupra', name: 'Cupra', popular: false, color: '#C8612A', logoUrl: '/assets/brands/cupra.svg' },
  { id: 34, slug: 'byd', name: 'BYD', popular: true, color: '#003366', logoUrl: '/assets/brands/byd.svg' },
  { id: 35, slug: 'togg', name: 'TOGG', popular: true, color: '#0061A8', logoUrl: '/assets/brands/togg.svg' },
  { id: 36, slug: 'iveco', name: 'Iveco', popular: false, iconSlug: 'iveco', color: '#003D80' },
  { id: 37, slug: 'isuzu', name: 'Isuzu', popular: false, color: '#C8102E', logoUrl: '/assets/brands/isuzu.svg' },
  { id: 38, slug: 'mahindra', name: 'Mahindra', popular: false, iconSlug: 'mahindra', color: '#C8102E', logoUrl: '/assets/brands/mahindra.svg' },
  { id: 39, slug: 'chery', name: 'Chery', popular: true, color: '#C8102E', logoUrl: '/assets/brands/chery.svg' },
  { id: 40, slug: 'hongqi', name: 'Hongqi', popular: false, color: '#9B1B1F', logoUrl: '/assets/brands/hongqi.svg' },
  // Premium / EV / niche markalar — Türkiye pazarı genişlemesi
  { id: 41, slug: 'polestar', name: 'Polestar', popular: false, color: '#1B2C3D', logoUrl: '/assets/brands/polestar.svg' },
  { id: 42, slug: 'genesis', name: 'Genesis', popular: false, color: '#1A1A1A', logoUrl: '/assets/brands/genesis.svg' },
  { id: 43, slug: 'alfa-romeo', name: 'Alfa Romeo', popular: false, color: '#C8102E', logoUrl: '/assets/brands/alfa-romeo.svg' },
  { id: 44, slug: 'smart', name: 'Smart', popular: false, color: '#00B0F0', logoUrl: '/assets/brands/smart.svg' },
  { id: 45, slug: 'infiniti', name: 'Infiniti', popular: false, color: '#1F2D45', logoUrl: '/assets/brands/infiniti.svg' },
  { id: 46, slug: 'ssangyong', name: 'SsangYong', popular: false, color: '#003F87', logoUrl: '/assets/brands/ssangyong.svg' },
]

export const VEHICLE_MODELS: VehicleModel[] = [
  // BMW
  { id: 1, brandSlug: 'bmw', slug: '1-serisi-f20', name: '1 Serisi', chassisCode: 'F20/F21', yearStart: 2011, yearEnd: 2019, bodyType: 'hatchback' },
  { id: 2, brandSlug: 'bmw', slug: '1-serisi-f40', name: '1 Serisi', chassisCode: 'F40', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 3, brandSlug: 'bmw', slug: '2-serisi-f44', name: '2 Serisi Gran Coupé', chassisCode: 'F44', yearStart: 2020, yearEnd: 2026, bodyType: 'sedan' },
  { id: 4, brandSlug: 'bmw', slug: '3-serisi-f30', name: '3 Serisi', chassisCode: 'F30/F31', yearStart: 2012, yearEnd: 2018, bodyType: 'sedan' },
  { id: 5, brandSlug: 'bmw', slug: '3-serisi-g20', name: '3 Serisi', chassisCode: 'G20/G21', yearStart: 2019, yearEnd: 2026, bodyType: 'sedan' },
  { id: 6, brandSlug: 'bmw', slug: '5-serisi-f10', name: '5 Serisi', chassisCode: 'F10', yearStart: 2010, yearEnd: 2017, bodyType: 'sedan' },
  { id: 7, brandSlug: 'bmw', slug: '5-serisi-g30', name: '5 Serisi', chassisCode: 'G30', yearStart: 2017, yearEnd: 2023, bodyType: 'sedan' },
  { id: 8, brandSlug: 'bmw', slug: '5-serisi-g60', name: '5 Serisi', chassisCode: 'G60', yearStart: 2023, yearEnd: 2026, bodyType: 'sedan' },
  { id: 9, brandSlug: 'bmw', slug: 'x1-f48', name: 'X1', chassisCode: 'F48', yearStart: 2015, yearEnd: 2022, bodyType: 'suv' },
  { id: 10, brandSlug: 'bmw', slug: 'x3-g01', name: 'X3', chassisCode: 'G01', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 11, brandSlug: 'bmw', slug: 'x5-g05', name: 'X5', chassisCode: 'G05', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 110, brandSlug: 'bmw', slug: '7-serisi-g70', name: '7 Serisi', chassisCode: 'G70', yearStart: 2022, yearEnd: 2026, bodyType: 'sedan' },
  { id: 111, brandSlug: 'bmw', slug: 'i7-g70', name: 'i7', chassisCode: 'G70 EV', yearStart: 2022, yearEnd: 2026, bodyType: 'sedan' },
  // Audi
  { id: 12, brandSlug: 'audi', slug: 'a3-8v', name: 'A3', chassisCode: '8V', yearStart: 2012, yearEnd: 2020, bodyType: 'hatchback' },
  { id: 13, brandSlug: 'audi', slug: 'a3-8y', name: 'A3', chassisCode: '8Y', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 14, brandSlug: 'audi', slug: 'a4-b8', name: 'A4', chassisCode: 'B8', yearStart: 2008, yearEnd: 2015, bodyType: 'sedan' },
  { id: 15, brandSlug: 'audi', slug: 'a4-b9', name: 'A4', chassisCode: 'B9', yearStart: 2015, yearEnd: 2024, bodyType: 'sedan' },
  { id: 16, brandSlug: 'audi', slug: 'a6-c7', name: 'A6', chassisCode: 'C7', yearStart: 2011, yearEnd: 2018, bodyType: 'sedan' },
  { id: 17, brandSlug: 'audi', slug: 'a6-c8', name: 'A6', chassisCode: 'C8', yearStart: 2018, yearEnd: 2026, bodyType: 'sedan' },
  { id: 18, brandSlug: 'audi', slug: 'q3-8u', name: 'Q3', chassisCode: '8U', yearStart: 2011, yearEnd: 2018, bodyType: 'suv' },
  { id: 19, brandSlug: 'audi', slug: 'q5-fy', name: 'Q5', chassisCode: 'FY', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  // Mercedes
  { id: 20, brandSlug: 'mercedes', slug: 'a-serisi-w177', name: 'A Serisi', chassisCode: 'W177', yearStart: 2018, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 21, brandSlug: 'mercedes', slug: 'c-serisi-w204', name: 'C Serisi', chassisCode: 'W204', yearStart: 2007, yearEnd: 2014, bodyType: 'sedan' },
  { id: 22, brandSlug: 'mercedes', slug: 'c-serisi-w205', name: 'C Serisi', chassisCode: 'W205', yearStart: 2014, yearEnd: 2021, bodyType: 'sedan' },
  { id: 23, brandSlug: 'mercedes', slug: 'c-serisi-w206', name: 'C Serisi', chassisCode: 'W206', yearStart: 2021, yearEnd: 2026, bodyType: 'sedan' },
  { id: 24, brandSlug: 'mercedes', slug: 'e-serisi-w213', name: 'E Serisi', chassisCode: 'W213', yearStart: 2016, yearEnd: 2023, bodyType: 'sedan' },
  { id: 25, brandSlug: 'mercedes', slug: 'gla-x156', name: 'GLA', chassisCode: 'X156', yearStart: 2014, yearEnd: 2020, bodyType: 'crossover' },
  { id: 26, brandSlug: 'mercedes', slug: 'glc-x253', name: 'GLC', chassisCode: 'X253', yearStart: 2015, yearEnd: 2022, bodyType: 'suv' },
  // Volkswagen
  { id: 27, brandSlug: 'volkswagen', slug: 'polo-mk5', name: 'Polo', chassisCode: 'Mk5', yearStart: 2009, yearEnd: 2017, bodyType: 'hatchback' },
  { id: 28, brandSlug: 'volkswagen', slug: 'polo-mk6', name: 'Polo', chassisCode: 'Mk6', yearStart: 2017, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 29, brandSlug: 'volkswagen', slug: 'golf-7', name: 'Golf', chassisCode: 'Mk7', yearStart: 2012, yearEnd: 2020, bodyType: 'hatchback' },
  { id: 30, brandSlug: 'volkswagen', slug: 'golf-8', name: 'Golf', chassisCode: 'Mk8', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 31, brandSlug: 'volkswagen', slug: 'jetta-mk6', name: 'Jetta', chassisCode: 'Mk6', yearStart: 2010, yearEnd: 2018, bodyType: 'sedan' },
  { id: 32, brandSlug: 'volkswagen', slug: 'passat-b8', name: 'Passat', chassisCode: 'B8', yearStart: 2014, yearEnd: 2023, bodyType: 'sedan' },
  { id: 33, brandSlug: 'volkswagen', slug: 'tiguan-mk2', name: 'Tiguan', chassisCode: 'Mk2', yearStart: 2016, yearEnd: 2023, bodyType: 'suv' },
  { id: 34, brandSlug: 'volkswagen', slug: 'tiguan-mk3', name: 'Tiguan', chassisCode: 'Mk3', yearStart: 2024, yearEnd: 2026, bodyType: 'suv' },
  { id: 35, brandSlug: 'volkswagen', slug: 't-roc', name: 'T-Roc', chassisCode: 'A11', yearStart: 2017, yearEnd: 2026, bodyType: 'crossover' },
  // Skoda
  { id: 36, brandSlug: 'skoda', slug: 'fabia-nj', name: 'Fabia', chassisCode: 'NJ', yearStart: 2014, yearEnd: 2021, bodyType: 'hatchback' },
  { id: 37, brandSlug: 'skoda', slug: 'octavia-mk3', name: 'Octavia', chassisCode: 'Mk3', yearStart: 2013, yearEnd: 2020, bodyType: 'sedan' },
  { id: 38, brandSlug: 'skoda', slug: 'octavia-mk4', name: 'Octavia', chassisCode: 'Mk4', yearStart: 2020, yearEnd: 2026, bodyType: 'sedan' },
  { id: 39, brandSlug: 'skoda', slug: 'superb-b8', name: 'Superb', chassisCode: 'B8', yearStart: 2015, yearEnd: 2023, bodyType: 'sedan' },
  { id: 40, brandSlug: 'skoda', slug: 'kodiaq', name: 'Kodiaq', chassisCode: 'NS7', yearStart: 2016, yearEnd: 2026, bodyType: 'suv', seats: 7 },
  // Hyundai
  { id: 41, brandSlug: 'hyundai', slug: 'i10-ac3', name: 'i10', chassisCode: 'AC3', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 42, brandSlug: 'hyundai', slug: 'i20-bc3', name: 'i20', chassisCode: 'BC3', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 43, brandSlug: 'hyundai', slug: 'tucson-tl', name: 'Tucson', chassisCode: 'TL', yearStart: 2015, yearEnd: 2020, bodyType: 'suv' },
  { id: 44, brandSlug: 'hyundai', slug: 'tucson-nx4', name: 'Tucson', chassisCode: 'NX4', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 45, brandSlug: 'hyundai', slug: 'kona', name: 'Kona', chassisCode: 'OS/SX2', yearStart: 2017, yearEnd: 2026, bodyType: 'crossover' },
  // Ford
  { id: 46, brandSlug: 'ford', slug: 'fiesta-mk7', name: 'Fiesta', chassisCode: 'Mk7', yearStart: 2017, yearEnd: 2024, bodyType: 'hatchback' },
  { id: 47, brandSlug: 'ford', slug: 'focus-mk3', name: 'Focus', chassisCode: 'Mk3', yearStart: 2011, yearEnd: 2018, bodyType: 'hatchback' },
  { id: 48, brandSlug: 'ford', slug: 'focus-mk4', name: 'Focus', chassisCode: 'Mk4', yearStart: 2018, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 49, brandSlug: 'ford', slug: 'kuga-mk2', name: 'Kuga', chassisCode: 'Mk2', yearStart: 2012, yearEnd: 2019, bodyType: 'suv' },
  { id: 50, brandSlug: 'ford', slug: 'kuga-mk3', name: 'Kuga', chassisCode: 'Mk3', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  // Peugeot
  { id: 51, brandSlug: 'peugeot', slug: '301', name: '301', chassisCode: 'P301', yearStart: 2012, yearEnd: 2024, bodyType: 'sedan' },
  { id: 52, brandSlug: 'peugeot', slug: '208-2', name: '208', chassisCode: 'P21', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 53, brandSlug: 'peugeot', slug: '308-t9', name: '308', chassisCode: 'T9', yearStart: 2013, yearEnd: 2021, bodyType: 'hatchback' },
  { id: 54, brandSlug: 'peugeot', slug: '3008-p84', name: '3008', chassisCode: 'P84', yearStart: 2016, yearEnd: 2024, bodyType: 'suv' },
  // Renault
  { id: 55, brandSlug: 'renault', slug: 'clio-5', name: 'Clio', chassisCode: 'Mk5', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 56, brandSlug: 'renault', slug: 'megane-4', name: 'Megane', chassisCode: 'Mk4', yearStart: 2016, yearEnd: 2023, bodyType: 'sedan' },
  { id: 57, brandSlug: 'renault', slug: 'captur-2', name: 'Captur', chassisCode: 'Mk2', yearStart: 2019, yearEnd: 2026, bodyType: 'crossover' },
  { id: 58, brandSlug: 'renault', slug: 'taliant', name: 'Taliant', chassisCode: 'L67', yearStart: 2021, yearEnd: 2026, bodyType: 'sedan' },
  // Fiat
  { id: 59, brandSlug: 'fiat', slug: 'egea-sedan', name: 'Egea Sedan', chassisCode: '356', yearStart: 2015, yearEnd: 2026, bodyType: 'sedan' },
  { id: 60, brandSlug: 'fiat', slug: 'egea-cross', name: 'Egea Cross', chassisCode: '356C', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 61, brandSlug: 'fiat', slug: 'doblo-2', name: 'Doblò', chassisCode: '263', yearStart: 2010, yearEnd: 2022, bodyType: 'mpv' },
  // Toyota
  { id: 62, brandSlug: 'toyota', slug: 'corolla-e210', name: 'Corolla', chassisCode: 'E210', yearStart: 2018, yearEnd: 2026, bodyType: 'sedan' },
  { id: 63, brandSlug: 'toyota', slug: 'yaris-cross', name: 'Yaris Cross', chassisCode: 'XP210', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 64, brandSlug: 'toyota', slug: 'rav4-xa50', name: 'RAV4', chassisCode: 'XA50', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 65, brandSlug: 'toyota', slug: 'chr-x10', name: 'C-HR', chassisCode: 'X10', yearStart: 2016, yearEnd: 2023, bodyType: 'crossover' },
  // Honda
  { id: 66, brandSlug: 'honda', slug: 'civic-fc5', name: 'Civic', chassisCode: 'FC5', yearStart: 2016, yearEnd: 2021, bodyType: 'sedan' },
  { id: 67, brandSlug: 'honda', slug: 'civic-fl5', name: 'Civic', chassisCode: 'FL5', yearStart: 2022, yearEnd: 2026, bodyType: 'sedan' },
  { id: 68, brandSlug: 'honda', slug: 'crv-rw', name: 'CR-V', chassisCode: 'RW', yearStart: 2017, yearEnd: 2023, bodyType: 'suv' },
  // Opel
  { id: 69, brandSlug: 'opel', slug: 'corsa-f', name: 'Corsa', chassisCode: 'F', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 70, brandSlug: 'opel', slug: 'astra-k', name: 'Astra', chassisCode: 'K', yearStart: 2015, yearEnd: 2021, bodyType: 'hatchback' },
  { id: 71, brandSlug: 'opel', slug: 'mokka-b', name: 'Mokka', chassisCode: 'B', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  // Dacia
  { id: 72, brandSlug: 'dacia', slug: 'sandero-3', name: 'Sandero', chassisCode: 'Mk3', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 73, brandSlug: 'dacia', slug: 'duster-2', name: 'Duster', chassisCode: 'Mk2', yearStart: 2018, yearEnd: 2024, bodyType: 'suv' },
  { id: 74, brandSlug: 'dacia', slug: 'duster-3', name: 'Duster', chassisCode: 'Mk3', yearStart: 2024, yearEnd: 2026, bodyType: 'suv' },
  // Kia
  { id: 75, brandSlug: 'kia', slug: 'ceed-cd', name: 'Ceed', chassisCode: 'CD', yearStart: 2018, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 76, brandSlug: 'kia', slug: 'sportage-5', name: 'Sportage', chassisCode: 'NQ5', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 77, brandSlug: 'kia', slug: 'stonic', name: 'Stonic', chassisCode: 'YB', yearStart: 2017, yearEnd: 2026, bodyType: 'crossover' },
  // Tesla
  { id: 78, brandSlug: 'tesla', slug: 'model-3', name: 'Model 3', chassisCode: 'Highland', yearStart: 2017, yearEnd: 2026, bodyType: 'sedan' },
  { id: 79, brandSlug: 'tesla', slug: 'model-y', name: 'Model Y', chassisCode: 'Mk1', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  // Cupra / Seat
  { id: 80, brandSlug: 'cupra', slug: 'leon-kl', name: 'Leon', chassisCode: 'KL', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 81, brandSlug: 'cupra', slug: 'formentor', name: 'Formentor', chassisCode: 'KM', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 82, brandSlug: 'seat', slug: 'leon-kl', name: 'Leon', chassisCode: 'KL', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  // BYD / TOGG / Chery / MG
  { id: 83, brandSlug: 'togg', slug: 't10x', name: 'T10X', chassisCode: 'C-Segment', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },
  { id: 84, brandSlug: 'byd', slug: 'atto-3', name: 'Atto 3', chassisCode: 'Yuan Plus', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },
  { id: 85, brandSlug: 'byd', slug: 'seal', name: 'Seal', chassisCode: 'EA', yearStart: 2022, yearEnd: 2026, bodyType: 'sedan' },
  { id: 86, brandSlug: 'mg', slug: 'zs', name: 'ZS', chassisCode: 'ZS', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 87, brandSlug: 'mg', slug: 'mg4', name: 'MG4', chassisCode: 'EH32', yearStart: 2022, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 88, brandSlug: 'chery', slug: 'tiggo-7-pro', name: 'Tiggo 7 Pro', chassisCode: 'T1E', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 89, brandSlug: 'chery', slug: 'tiggo-8-pro', name: 'Tiggo 8 Pro', chassisCode: 'T1A', yearStart: 2020, yearEnd: 2026, bodyType: 'suv', seats: 7 },
  // Volvo / Mini / Porsche / Lexus
  { id: 90, brandSlug: 'volvo', slug: 'xc40', name: 'XC40', chassisCode: 'CMA', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 91, brandSlug: 'volvo', slug: 'xc60-2', name: 'XC60', chassisCode: 'Gen2', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 92, brandSlug: 'mini', slug: 'cooper-f56', name: 'Cooper', chassisCode: 'F56', yearStart: 2014, yearEnd: 2024, bodyType: 'hatchback-3' },
  { id: 93, brandSlug: 'porsche', slug: 'macan', name: 'Macan', chassisCode: '95B', yearStart: 2014, yearEnd: 2026, bodyType: 'suv' },
  { id: 94, brandSlug: 'lexus', slug: 'nx', name: 'NX', chassisCode: 'AZ20', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  // Citroen / Nissan / Mazda / Suzuki / Subaru / Mitsubishi / Jeep
  { id: 95, brandSlug: 'citroen', slug: 'c3-3', name: 'C3', chassisCode: 'A51', yearStart: 2016, yearEnd: 2024, bodyType: 'hatchback' },
  { id: 96, brandSlug: 'citroen', slug: 'c4-3', name: 'C4', chassisCode: 'C42', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 97, brandSlug: 'nissan', slug: 'qashqai-j11', name: 'Qashqai', chassisCode: 'J11', yearStart: 2014, yearEnd: 2021, bodyType: 'crossover' },
  { id: 98, brandSlug: 'nissan', slug: 'qashqai-j12', name: 'Qashqai', chassisCode: 'J12', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },
  { id: 99, brandSlug: 'mazda', slug: 'cx-3', name: 'CX-3', chassisCode: 'DK', yearStart: 2015, yearEnd: 2024, bodyType: 'crossover' },
  { id: 100, brandSlug: 'suzuki', slug: 'vitara', name: 'Vitara', chassisCode: 'LY', yearStart: 2015, yearEnd: 2026, bodyType: 'suv' },
  { id: 101, brandSlug: 'jeep', slug: 'compass-mp', name: 'Compass', chassisCode: 'MP', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 102, brandSlug: 'jeep', slug: 'renegade', name: 'Renegade', chassisCode: 'BU', yearStart: 2014, yearEnd: 2026, bodyType: 'suv' },
  // Premium gap completion (P0-B genişleme): Türkiye en çok satan / aranan modeller
  // Audi
  { id: 120, brandSlug: 'audi', slug: 'q7-4m', name: 'Q7', chassisCode: '4M', yearStart: 2015, yearEnd: 2026, bodyType: 'suv' },
  { id: 121, brandSlug: 'audi', slug: 'q8-4mn', name: 'Q8', chassisCode: '4MN', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 122, brandSlug: 'audi', slug: 'a8-d5', name: 'A8', chassisCode: 'D5', yearStart: 2017, yearEnd: 2026, bodyType: 'sedan' },
  { id: 123, brandSlug: 'audi', slug: 'e-tron', name: 'e-tron', chassisCode: 'GE', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  // Mercedes
  { id: 124, brandSlug: 'mercedes', slug: 'e-serisi-w214', name: 'E Serisi', chassisCode: 'W214', yearStart: 2023, yearEnd: 2026, bodyType: 'sedan' },
  { id: 125, brandSlug: 'mercedes', slug: 's-serisi-w223', name: 'S Serisi', chassisCode: 'W223', yearStart: 2020, yearEnd: 2026, bodyType: 'sedan' },
  { id: 126, brandSlug: 'mercedes', slug: 'gle-w167', name: 'GLE', chassisCode: 'W167', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 127, brandSlug: 'mercedes', slug: 'gls-x167', name: 'GLS', chassisCode: 'X167', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 128, brandSlug: 'mercedes', slug: 'eqs-v297', name: 'EQS', chassisCode: 'V297', yearStart: 2021, yearEnd: 2026, bodyType: 'sedan' },
  { id: 129, brandSlug: 'mercedes', slug: 'b-serisi-w247', name: 'B Serisi', chassisCode: 'W247', yearStart: 2018, yearEnd: 2026, bodyType: 'mpv' },
  // Volkswagen
  { id: 130, brandSlug: 'volkswagen', slug: 'touareg-cr', name: 'Touareg', chassisCode: 'CR', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 131, brandSlug: 'volkswagen', slug: 'id-4', name: 'ID.4', chassisCode: 'E1', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 132, brandSlug: 'volkswagen', slug: 'caddy-mk5', name: 'Caddy', chassisCode: 'Mk5', yearStart: 2020, yearEnd: 2026, bodyType: 'mpv' },
  { id: 133, brandSlug: 'volkswagen', slug: 't-cross', name: 'T-Cross', chassisCode: 'C1', yearStart: 2018, yearEnd: 2026, bodyType: 'crossover' },
  // Hyundai
  { id: 134, brandSlug: 'hyundai', slug: 'bayon', name: 'Bayon', chassisCode: 'BC3 CUV', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },
  { id: 135, brandSlug: 'hyundai', slug: 'ioniq-5', name: 'Ioniq 5', chassisCode: 'NE', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },
  { id: 136, brandSlug: 'hyundai', slug: 'ioniq-6', name: 'Ioniq 6', chassisCode: 'CE', yearStart: 2022, yearEnd: 2026, bodyType: 'sedan' },
  { id: 137, brandSlug: 'hyundai', slug: 'elantra-cn7', name: 'Elantra', chassisCode: 'CN7', yearStart: 2020, yearEnd: 2026, bodyType: 'sedan' },
  // Toyota
  { id: 138, brandSlug: 'toyota', slug: 'yaris-xp210', name: 'Yaris', chassisCode: 'XP210', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 139, brandSlug: 'toyota', slug: 'highlander-xu70', name: 'Highlander', chassisCode: 'XU70', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  // Renault
  { id: 140, brandSlug: 'renault', slug: 'megane-e-tech', name: 'Megane E-Tech', chassisCode: 'BCM', yearStart: 2022, yearEnd: 2026, bodyType: 'crossover' },
  { id: 141, brandSlug: 'renault', slug: 'kadjar-2', name: 'Kadjar', chassisCode: 'Mk2', yearStart: 2015, yearEnd: 2022, bodyType: 'crossover' },
  { id: 142, brandSlug: 'renault', slug: 'symbol-3', name: 'Symbol', chassisCode: 'L52', yearStart: 2013, yearEnd: 2022, bodyType: 'sedan' },
  // Fiat
  { id: 143, brandSlug: 'fiat', slug: 'fiat-500', name: '500', chassisCode: '312', yearStart: 2007, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 144, brandSlug: 'fiat', slug: 'linea', name: 'Linea', chassisCode: '323', yearStart: 2007, yearEnd: 2017, bodyType: 'sedan' },
  { id: 145, brandSlug: 'fiat', slug: 'fiorino', name: 'Fiorino', chassisCode: '225', yearStart: 2008, yearEnd: 2026, bodyType: 'mpv' },
  // Kia
  { id: 146, brandSlug: 'kia', slug: 'picanto-jaa', name: 'Picanto', chassisCode: 'JA', yearStart: 2017, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 147, brandSlug: 'kia', slug: 'cerato-bd', name: 'Cerato', chassisCode: 'BD', yearStart: 2018, yearEnd: 2026, bodyType: 'sedan' },
  { id: 148, brandSlug: 'kia', slug: 'ev6', name: 'EV6', chassisCode: 'CV', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },
  { id: 149, brandSlug: 'kia', slug: 'niro', name: 'Niro', chassisCode: 'SG2', yearStart: 2022, yearEnd: 2026, bodyType: 'crossover' },
  // Nissan
  { id: 150, brandSlug: 'nissan', slug: 'juke-2', name: 'Juke', chassisCode: 'F16', yearStart: 2019, yearEnd: 2026, bodyType: 'crossover' },
  { id: 151, brandSlug: 'nissan', slug: 'micra-k14', name: 'Micra', chassisCode: 'K14', yearStart: 2017, yearEnd: 2024, bodyType: 'hatchback' },
  // Honda
  { id: 152, brandSlug: 'honda', slug: 'civic-fe', name: 'Civic', chassisCode: 'FE', yearStart: 2021, yearEnd: 2026, bodyType: 'sedan' },
  { id: 153, brandSlug: 'honda', slug: 'crv-rs', name: 'CR-V', chassisCode: 'RS', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },
  { id: 154, brandSlug: 'honda', slug: 'hrv-rv', name: 'HR-V', chassisCode: 'RV', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },
  // Tesla — Model X eklenmesi
  { id: 155, brandSlug: 'tesla', slug: 'model-s', name: 'Model S', chassisCode: 'Plaid', yearStart: 2012, yearEnd: 2026, bodyType: 'sedan' },
  { id: 156, brandSlug: 'tesla', slug: 'model-x', name: 'Model X', chassisCode: 'X', yearStart: 2015, yearEnd: 2026, bodyType: 'suv' },
]

const SWATCH = '/assets/swatches'

export const MAT_COLORS: MatColor[] = [
  { id: 1, slug: 'siyah', name: 'Siyah', hex: '#111', threadHex: '#333', swatchUrl: `${SWATCH}/mat-siyah.webp`, previewUrl: '/images/paspas_black_red_1778184832541.png', showroomUrl: '/images/showroom_black_red_1778185224584.png' },
  { id: 2, slug: 'gri', name: 'Gri', hex: '#444', threadHex: '#888', swatchUrl: `${SWATCH}/mat-gri.webp`, previewUrl: '/images/paspas_grey_silver_1778184888798.png', showroomUrl: '/images/showroom_grey_silver_1778185251036.png' },
  { id: 3, slug: 'fume', name: 'Füme', hex: '#2A2A2A', threadHex: '#555', swatchUrl: `${SWATCH}/mat-fume.webp` },
  { id: 4, slug: 'mavi', name: 'Mavi', hex: '#1A2B4C', threadHex: '#3A5B8C', swatchUrl: `${SWATCH}/mat-mavi.webp` },
  { id: 5, slug: 'taba', name: 'Taba', hex: '#633B22', threadHex: '#A36B42', swatchUrl: `${SWATCH}/mat-taba.webp` },
  { id: 6, slug: 'kirmizi', name: 'Kırmızı', hex: '#6B1111', threadHex: '#AB2121', swatchUrl: `${SWATCH}/mat-kirmizi.webp` },
  { id: 7, slug: 'kahve', name: 'Kahve', hex: '#312117', threadHex: '#513127', swatchUrl: `${SWATCH}/mat-kahve.webp` },
  { id: 8, slug: 'bordo', name: 'Bordo', hex: '#42111A', threadHex: '#72212A', swatchUrl: `${SWATCH}/mat-bordo.webp` },
  { id: 9, slug: 'bej', name: 'Bej', hex: '#C2B294', threadHex: '#E2D2B4', swatchUrl: `${SWATCH}/mat-bej.webp`, previewUrl: '/images/paspas_beige_gold_1778184872532.png', showroomUrl: '/images/showroom_beige_gold_1778185237879.png' },
  { id: 10, slug: 'turuncu-taba', name: 'Turuncu Taba', hex: '#A35322', threadHex: '#D38342', swatchUrl: `${SWATCH}/mat-turuncu-taba.webp` },
]

export const BORDER_COLORS: BorderColor[] = [
  { id: 1, slug: 'kahve', name: 'Kahve', hex: '#4a2a1a', swatchUrl: `${SWATCH}/border-kahve.webp` },
  { id: 2, slug: 'taba', name: 'Taba', hex: '#8a5a3a', swatchUrl: `${SWATCH}/border-taba.webp` },
  { id: 3, slug: 'krem', name: 'Krem', hex: '#e8d8b8', swatchUrl: `${SWATCH}/border-krem.webp` },
  { id: 4, slug: 'yesil', name: 'Yeşil', hex: '#1a5a2e', swatchUrl: `${SWATCH}/border-yesil.webp` },
  { id: 5, slug: 'sari', name: 'Sarı', hex: '#d4a836', swatchUrl: `${SWATCH}/border-sari.webp` },
  { id: 6, slug: 'turuncu', name: 'Turuncu', hex: '#d4762c', swatchUrl: `${SWATCH}/border-turuncu.webp` },
  { id: 7, slug: 'kirmizi', name: 'Kırmızı', hex: '#b91c1c', swatchUrl: `${SWATCH}/border-kirmizi.webp` },
  { id: 8, slug: 'mor', name: 'Mor', hex: '#5b21b6', swatchUrl: `${SWATCH}/border-mor.webp` },
  { id: 9, slug: 'lacivert', name: 'Lacivert', hex: '#1e1e4a', swatchUrl: `${SWATCH}/border-lacivert.webp` },
  { id: 10, slug: 'koyu-mavi', name: 'Koyu Mavi', hex: '#1e3a8a', swatchUrl: `${SWATCH}/border-koyu-mavi.webp` },
  { id: 11, slug: 'turkuaz', name: 'Turkuaz', hex: '#0e7490', swatchUrl: `${SWATCH}/border-turkuaz.webp` },
  { id: 12, slug: 'gri', name: 'Gri', hex: '#6b6b71', swatchUrl: `${SWATCH}/border-gri.webp` },
  { id: 13, slug: 'fume', name: 'Füme', hex: '#3a3a40', swatchUrl: `${SWATCH}/border-fume.webp` },
  { id: 14, slug: 'siyah', name: 'Siyah', hex: '#0f0f12', swatchUrl: `${SWATCH}/border-siyah.webp` },
  { id: 15, slug: 'bordo', name: 'Bordo', hex: '#6b1f2e', swatchUrl: `${SWATCH}/border-bordo.webp` },
]

export const HEEL_PADS: HeelPad[] = [
  { id: 1, slug: 'standart', name: 'Standart Antrasit', textureHex: '#15151b', swatchUrl: '/assets/heel-pads/heel-standart.webp', pricePremium: 0, isStandard: true },
  { id: 2, slug: 'antrasit-karbon', name: 'Karbon Doku Antrasit', textureHex: '#1a1a20', swatchUrl: '/assets/heel-pads/heel-antrasit-karbon.webp', pricePremium: 150, isStandard: false },
  { id: 3, slug: 'beyaz-noktali', name: 'Beyaz Karbon', textureHex: '#dfdfd6', swatchUrl: '/assets/heel-pads/heel-beyaz-noktali.webp', pricePremium: 100, isStandard: false },
  { id: 4, slug: 'mavi-noktali', name: 'Mavi Noktalı', textureHex: '#1e3a8a', swatchUrl: '/assets/heel-pads/heel-mavi-noktali.webp', pricePremium: 100, isStandard: false },
  { id: 5, slug: 'kirmizi-noktali', name: 'Kırmızı Noktalı', textureHex: '#9b1c1c', swatchUrl: '/assets/heel-pads/heel-kirmizi-noktali.webp', pricePremium: 100, isStandard: false },
  { id: 6, slug: 'krem-noktali', name: 'Krem Noktalı', textureHex: '#d6c5a8', swatchUrl: '/assets/heel-pads/heel-krem-noktali.webp', pricePremium: 100, isStandard: false },
  { id: 7, slug: 'siyah-noktali', name: 'Siyah Noktalı', textureHex: '#202024', swatchUrl: '/assets/heel-pads/heel-siyah-noktali.webp', pricePremium: 50, isStandard: false },
  { id: 8, slug: 'turuncu-noktali', name: 'Turuncu Noktalı', textureHex: '#c87632', swatchUrl: '/assets/heel-pads/heel-turuncu-noktali.webp', pricePremium: 100, isStandard: false },
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

/* ─────────────────────────────────────────────────────────
   Cascade selector helper'ları (sahibinden.com seviyesi UX)
   ───────────────────────────────────────────────────────── */

/** Aynı modelin farklı jenerasyonlarını döner (örn. BMW 3 Serisi → F30 + G20) */
export function getGenerationsForModel(brandSlug: string, modelName: string): VehicleModel[] {
  return VEHICLE_MODELS.filter(
    (m) => m.brandSlug === brandSlug && m.name === modelName,
  ).sort((a, b) => a.yearStart - b.yearStart)
}

/** Markanın benzersiz model isimleri (jenerasyon olmadan, sadece "BMW 3 Serisi" gibi) */
export function getUniqueModelNames(brandSlug: string): Array<{ name: string; bodyTypes: BodyType[]; generationCount: number }> {
  const models = getModelsByBrand(brandSlug)
  const map = new Map<string, { bodyTypes: Set<BodyType>; count: number }>()
  for (const m of models) {
    const entry = map.get(m.name) ?? { bodyTypes: new Set<BodyType>(), count: 0 }
    if (m.bodyType) entry.bodyTypes.add(m.bodyType)
    entry.count++
    map.set(m.name, entry)
  }
  return Array.from(map.entries())
    .map(([name, e]) => ({ name, bodyTypes: Array.from(e.bodyTypes), generationCount: e.count }))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
}

/** Verilen yıla denk gelen jenerasyonu bul (yıl seçince doğru chassis'i otomatik seçer) */
export function getModelByYear(
  brandSlug: string,
  modelName: string,
  year: number,
): VehicleModel | undefined {
  return VEHICLE_MODELS.find(
    (m) =>
      m.brandSlug === brandSlug &&
      m.name === modelName &&
      year >= m.yearStart &&
      year <= m.yearEnd,
  )
}

/** Bir markanın tüm body type'larını eşsiz olarak döner (filter chip'ler için) */
export function getBodyTypesForBrand(brandSlug: string): BodyType[] {
  const set = new Set<BodyType>()
  for (const m of getModelsByBrand(brandSlug)) {
    if (m.bodyType) set.add(m.bodyType)
  }
  return Array.from(set)
}

/** Body type → Türkçe görünür isim */
export const BODY_LABEL: Record<BodyType, string> = {
  sedan: 'Sedan',
  hatchback: 'Hatchback',
  'hatchback-3': 'Hatchback (3 Kapı)',
  station: 'Station Wagon',
  suv: 'SUV',
  crossover: 'Crossover',
  mpv: 'MPV / Minivan',
  coupe: 'Coupé',
  cabrio: 'Cabrio',
  pickup: 'Pickup',
  van: 'Van',
}

/** Body type → ikon SVG path (lucide tarzı) */
export const BODY_ICON: Record<BodyType, string> = {
  sedan: 'M3 13l2-5h14l2 5M5 13h14M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  hatchback: 'M2 13l3-6h12l3 4v2M5 13h14M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  'hatchback-3': 'M2 13l3-6h12l3 4v2M5 13h14M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  station: 'M2 13l3-6h14v6M5 13h16M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  suv: 'M3 14V9l3-4h12l3 5v4M3 14h18M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  crossover: 'M3 14V10l3-4h12l3 4v4M3 14h18M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  mpv: 'M2 14V8h18v6M2 14h20M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  coupe: 'M3 13l4-5h10l4 5M5 13h14M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  cabrio: 'M3 14l3-3h12l3 3M5 14h14M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  pickup: 'M2 14V9l3-3h7v8h9V14M2 14h20M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  van: 'M2 14V6h14l4 4v4M2 14h20M6 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm12 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
}

/** Marka logosunun gösterilecek path'i — fallback ile */
export function getBrandLogoUrl(brand: Brand | undefined | null): string {
  if (!brand) return '/assets/brands/_placeholder.svg'
  return brand.logoUrl ?? `/assets/brands/${brand.slug}.svg`
}
