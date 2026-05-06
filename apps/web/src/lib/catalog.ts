/**
 * Carmat katalog verisi (V1, statik).
 * - 40 marka (popüler/global), her birinin iconSlug + brand color hex'i
 * - ~85 model (popüler şasiler, yıl aralıkları)
 * - 10 mat rengi · 15 kenarlık · 8 topukluk · brand bazlı amblem · 3 set
 */

export type Brand = {
  id: number
  slug: string
  name: string
  popular: boolean
  /** simple-icons slug (BrandLogo bileşeniyle gerçek SVG render edilir) */
  iconSlug?: string
  /** Brand color (simple-icons'tan, override olarak da kullanılabilir) */
  color?: string
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
  swatchUrl: string
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
  { id: 1, slug: 'audi', name: 'Audi', popular: true, iconSlug: 'audi', color: '#BB0A30' },
  { id: 2, slug: 'bmw', name: 'BMW', popular: true, iconSlug: 'bmw', color: '#0066B1' },
  { id: 3, slug: 'mercedes', name: 'Mercedes-Benz', popular: true, color: '#A4AAAE' },
  { id: 4, slug: 'volkswagen', name: 'Volkswagen', popular: true, iconSlug: 'volkswagen', color: '#151F5D' },
  { id: 5, slug: 'skoda', name: 'Škoda', popular: true, iconSlug: 'skoda', color: '#4BA82E' },
  { id: 6, slug: 'hyundai', name: 'Hyundai', popular: true, iconSlug: 'hyundai', color: '#002C5F' },
  { id: 7, slug: 'ford', name: 'Ford', popular: true, iconSlug: 'ford', color: '#003478' },
  { id: 8, slug: 'peugeot', name: 'Peugeot', popular: true, iconSlug: 'peugeot', color: '#00A3E0' },
  { id: 9, slug: 'renault', name: 'Renault', popular: true, iconSlug: 'renault', color: '#FFCC00' },
  { id: 10, slug: 'fiat', name: 'Fiat', popular: true, iconSlug: 'fiat', color: '#A6192E' },
  { id: 11, slug: 'toyota', name: 'Toyota', popular: true, iconSlug: 'toyota', color: '#EB0A1E' },
  { id: 12, slug: 'honda', name: 'Honda', popular: true, iconSlug: 'honda', color: '#E40521' },
  { id: 13, slug: 'opel', name: 'Opel', popular: true, iconSlug: 'opel', color: '#F7FF14' },
  { id: 14, slug: 'volvo', name: 'Volvo', popular: false, iconSlug: 'volvo', color: '#003057' },
  { id: 15, slug: 'citroen', name: 'Citroën', popular: true, iconSlug: 'citroen', color: '#7A1F1F' },
  { id: 16, slug: 'seat', name: 'Seat', popular: false, iconSlug: 'seat', color: '#C49A57' },
  { id: 17, slug: 'dacia', name: 'Dacia', popular: true, iconSlug: 'dacia', color: '#646B52' },
  { id: 18, slug: 'kia', name: 'Kia', popular: true, iconSlug: 'kia', color: '#05141F' },
  { id: 19, slug: 'nissan', name: 'Nissan', popular: true, iconSlug: 'nissan', color: '#C3002F' },
  { id: 20, slug: 'mazda', name: 'Mazda', popular: false, iconSlug: 'mazda', color: '#101010' },
  { id: 21, slug: 'mini', name: 'MINI', popular: false, iconSlug: 'mini', color: '#000000' },
  { id: 22, slug: 'porsche', name: 'Porsche', popular: false, iconSlug: 'porsche', color: '#D5001C' },
  { id: 23, slug: 'lexus', name: 'Lexus', popular: false, color: '#1A1A1A' },
  { id: 24, slug: 'tesla', name: 'Tesla', popular: true, iconSlug: 'tesla', color: '#CC0000' },
  { id: 25, slug: 'subaru', name: 'Subaru', popular: false, iconSlug: 'subaru', color: '#0041AA' },
  { id: 26, slug: 'mitsubishi', name: 'Mitsubishi', popular: false, iconSlug: 'mitsubishi', color: '#E60012' },
  { id: 27, slug: 'suzuki', name: 'Suzuki', popular: false, iconSlug: 'suzuki', color: '#CD1424' },
  { id: 28, slug: 'jeep', name: 'Jeep', popular: false, iconSlug: 'jeep', color: '#374B49' },
  { id: 29, slug: 'landrover', name: 'Land Rover', popular: false, color: '#005A2B' },
  { id: 30, slug: 'jaguar', name: 'Jaguar', popular: false, color: '#222B33' },
  { id: 31, slug: 'chevrolet', name: 'Chevrolet', popular: false, iconSlug: 'chevrolet', color: '#FFCC00' },
  { id: 32, slug: 'mg', name: 'MG', popular: true, color: '#E10A2D' },
  { id: 33, slug: 'cupra', name: 'Cupra', popular: false, color: '#C8612A' },
  { id: 34, slug: 'byd', name: 'BYD', popular: true, color: '#003366' },
  { id: 35, slug: 'togg', name: 'TOGG', popular: true, color: '#0061A8' },
  { id: 36, slug: 'iveco', name: 'Iveco', popular: false, iconSlug: 'iveco', color: '#003D80' },
  { id: 37, slug: 'isuzu', name: 'Isuzu', popular: false, color: '#C8102E' },
  { id: 38, slug: 'mahindra', name: 'Mahindra', popular: false, iconSlug: 'mahindra', color: '#C8102E' },
  { id: 39, slug: 'chery', name: 'Chery', popular: true, color: '#C8102E' },
  { id: 40, slug: 'hongqi', name: 'Hongqi', popular: false, color: '#9B1B1F' },
]

export const VEHICLE_MODELS: VehicleModel[] = [
  // BMW
  { id: 1, brandSlug: 'bmw', slug: '1-serisi-f20', name: '1 Serisi', chassisCode: 'F20/F21', yearStart: 2011, yearEnd: 2019 },
  { id: 2, brandSlug: 'bmw', slug: '1-serisi-f40', name: '1 Serisi', chassisCode: 'F40', yearStart: 2019, yearEnd: 2026 },
  { id: 3, brandSlug: 'bmw', slug: '2-serisi-f44', name: '2 Serisi Gran Coupé', chassisCode: 'F44', yearStart: 2020, yearEnd: 2026 },
  { id: 4, brandSlug: 'bmw', slug: '3-serisi-f30', name: '3 Serisi', chassisCode: 'F30/F31', yearStart: 2012, yearEnd: 2018 },
  { id: 5, brandSlug: 'bmw', slug: '3-serisi-g20', name: '3 Serisi', chassisCode: 'G20/G21', yearStart: 2019, yearEnd: 2026 },
  { id: 6, brandSlug: 'bmw', slug: '5-serisi-f10', name: '5 Serisi', chassisCode: 'F10', yearStart: 2010, yearEnd: 2017 },
  { id: 7, brandSlug: 'bmw', slug: '5-serisi-g30', name: '5 Serisi', chassisCode: 'G30', yearStart: 2017, yearEnd: 2023 },
  { id: 8, brandSlug: 'bmw', slug: '5-serisi-g60', name: '5 Serisi', chassisCode: 'G60', yearStart: 2023, yearEnd: 2026 },
  { id: 9, brandSlug: 'bmw', slug: 'x1-f48', name: 'X1', chassisCode: 'F48', yearStart: 2015, yearEnd: 2022 },
  { id: 10, brandSlug: 'bmw', slug: 'x3-g01', name: 'X3', chassisCode: 'G01', yearStart: 2017, yearEnd: 2026 },
  { id: 11, brandSlug: 'bmw', slug: 'x5-g05', name: 'X5', chassisCode: 'G05', yearStart: 2018, yearEnd: 2026 },
  // Audi
  { id: 12, brandSlug: 'audi', slug: 'a3-8v', name: 'A3', chassisCode: '8V', yearStart: 2012, yearEnd: 2020 },
  { id: 13, brandSlug: 'audi', slug: 'a3-8y', name: 'A3', chassisCode: '8Y', yearStart: 2020, yearEnd: 2026 },
  { id: 14, brandSlug: 'audi', slug: 'a4-b8', name: 'A4', chassisCode: 'B8', yearStart: 2008, yearEnd: 2015 },
  { id: 15, brandSlug: 'audi', slug: 'a4-b9', name: 'A4', chassisCode: 'B9', yearStart: 2015, yearEnd: 2024 },
  { id: 16, brandSlug: 'audi', slug: 'a6-c7', name: 'A6', chassisCode: 'C7', yearStart: 2011, yearEnd: 2018 },
  { id: 17, brandSlug: 'audi', slug: 'a6-c8', name: 'A6', chassisCode: 'C8', yearStart: 2018, yearEnd: 2026 },
  { id: 18, brandSlug: 'audi', slug: 'q3-8u', name: 'Q3', chassisCode: '8U', yearStart: 2011, yearEnd: 2018 },
  { id: 19, brandSlug: 'audi', slug: 'q5-fy', name: 'Q5', chassisCode: 'FY', yearStart: 2017, yearEnd: 2026 },
  // Mercedes
  { id: 20, brandSlug: 'mercedes', slug: 'a-serisi-w177', name: 'A Serisi', chassisCode: 'W177', yearStart: 2018, yearEnd: 2026 },
  { id: 21, brandSlug: 'mercedes', slug: 'c-serisi-w204', name: 'C Serisi', chassisCode: 'W204', yearStart: 2007, yearEnd: 2014 },
  { id: 22, brandSlug: 'mercedes', slug: 'c-serisi-w205', name: 'C Serisi', chassisCode: 'W205', yearStart: 2014, yearEnd: 2021 },
  { id: 23, brandSlug: 'mercedes', slug: 'c-serisi-w206', name: 'C Serisi', chassisCode: 'W206', yearStart: 2021, yearEnd: 2026 },
  { id: 24, brandSlug: 'mercedes', slug: 'e-serisi-w213', name: 'E Serisi', chassisCode: 'W213', yearStart: 2016, yearEnd: 2023 },
  { id: 25, brandSlug: 'mercedes', slug: 'gla-x156', name: 'GLA', chassisCode: 'X156', yearStart: 2014, yearEnd: 2020 },
  { id: 26, brandSlug: 'mercedes', slug: 'glc-x253', name: 'GLC', chassisCode: 'X253', yearStart: 2015, yearEnd: 2022 },
  // Volkswagen
  { id: 27, brandSlug: 'volkswagen', slug: 'polo-mk5', name: 'Polo', chassisCode: 'Mk5', yearStart: 2009, yearEnd: 2017 },
  { id: 28, brandSlug: 'volkswagen', slug: 'polo-mk6', name: 'Polo', chassisCode: 'Mk6', yearStart: 2017, yearEnd: 2026 },
  { id: 29, brandSlug: 'volkswagen', slug: 'golf-7', name: 'Golf', chassisCode: 'Mk7', yearStart: 2012, yearEnd: 2020 },
  { id: 30, brandSlug: 'volkswagen', slug: 'golf-8', name: 'Golf', chassisCode: 'Mk8', yearStart: 2020, yearEnd: 2026 },
  { id: 31, brandSlug: 'volkswagen', slug: 'jetta-mk6', name: 'Jetta', chassisCode: 'Mk6', yearStart: 2010, yearEnd: 2018 },
  { id: 32, brandSlug: 'volkswagen', slug: 'passat-b8', name: 'Passat', chassisCode: 'B8', yearStart: 2014, yearEnd: 2023 },
  { id: 33, brandSlug: 'volkswagen', slug: 'tiguan-mk2', name: 'Tiguan', chassisCode: 'Mk2', yearStart: 2016, yearEnd: 2023 },
  { id: 34, brandSlug: 'volkswagen', slug: 'tiguan-mk3', name: 'Tiguan', chassisCode: 'Mk3', yearStart: 2024, yearEnd: 2026 },
  { id: 35, brandSlug: 'volkswagen', slug: 't-roc', name: 'T-Roc', chassisCode: 'A11', yearStart: 2017, yearEnd: 2026 },
  // Skoda
  { id: 36, brandSlug: 'skoda', slug: 'fabia-nj', name: 'Fabia', chassisCode: 'NJ', yearStart: 2014, yearEnd: 2021 },
  { id: 37, brandSlug: 'skoda', slug: 'octavia-mk3', name: 'Octavia', chassisCode: 'Mk3', yearStart: 2013, yearEnd: 2020 },
  { id: 38, brandSlug: 'skoda', slug: 'octavia-mk4', name: 'Octavia', chassisCode: 'Mk4', yearStart: 2020, yearEnd: 2026 },
  { id: 39, brandSlug: 'skoda', slug: 'superb-b8', name: 'Superb', chassisCode: 'B8', yearStart: 2015, yearEnd: 2023 },
  { id: 40, brandSlug: 'skoda', slug: 'kodiaq', name: 'Kodiaq', chassisCode: 'NS7', yearStart: 2016, yearEnd: 2026 },
  // Hyundai
  { id: 41, brandSlug: 'hyundai', slug: 'i10-ac3', name: 'i10', chassisCode: 'AC3', yearStart: 2019, yearEnd: 2026 },
  { id: 42, brandSlug: 'hyundai', slug: 'i20-bc3', name: 'i20', chassisCode: 'BC3', yearStart: 2020, yearEnd: 2026 },
  { id: 43, brandSlug: 'hyundai', slug: 'tucson-tl', name: 'Tucson', chassisCode: 'TL', yearStart: 2015, yearEnd: 2020 },
  { id: 44, brandSlug: 'hyundai', slug: 'tucson-nx4', name: 'Tucson', chassisCode: 'NX4', yearStart: 2020, yearEnd: 2026 },
  { id: 45, brandSlug: 'hyundai', slug: 'kona', name: 'Kona', chassisCode: 'OS/SX2', yearStart: 2017, yearEnd: 2026 },
  // Ford
  { id: 46, brandSlug: 'ford', slug: 'fiesta-mk7', name: 'Fiesta', chassisCode: 'Mk7', yearStart: 2017, yearEnd: 2024 },
  { id: 47, brandSlug: 'ford', slug: 'focus-mk3', name: 'Focus', chassisCode: 'Mk3', yearStart: 2011, yearEnd: 2018 },
  { id: 48, brandSlug: 'ford', slug: 'focus-mk4', name: 'Focus', chassisCode: 'Mk4', yearStart: 2018, yearEnd: 2026 },
  { id: 49, brandSlug: 'ford', slug: 'kuga-mk2', name: 'Kuga', chassisCode: 'Mk2', yearStart: 2012, yearEnd: 2019 },
  { id: 50, brandSlug: 'ford', slug: 'kuga-mk3', name: 'Kuga', chassisCode: 'Mk3', yearStart: 2019, yearEnd: 2026 },
  // Peugeot
  { id: 51, brandSlug: 'peugeot', slug: '301', name: '301', chassisCode: 'P301', yearStart: 2012, yearEnd: 2024 },
  { id: 52, brandSlug: 'peugeot', slug: '208-2', name: '208', chassisCode: 'P21', yearStart: 2019, yearEnd: 2026 },
  { id: 53, brandSlug: 'peugeot', slug: '308-t9', name: '308', chassisCode: 'T9', yearStart: 2013, yearEnd: 2021 },
  { id: 54, brandSlug: 'peugeot', slug: '3008-p84', name: '3008', chassisCode: 'P84', yearStart: 2016, yearEnd: 2024 },
  // Renault
  { id: 55, brandSlug: 'renault', slug: 'clio-5', name: 'Clio', chassisCode: 'Mk5', yearStart: 2019, yearEnd: 2026 },
  { id: 56, brandSlug: 'renault', slug: 'megane-4', name: 'Megane', chassisCode: 'Mk4', yearStart: 2016, yearEnd: 2023 },
  { id: 57, brandSlug: 'renault', slug: 'captur-2', name: 'Captur', chassisCode: 'Mk2', yearStart: 2019, yearEnd: 2026 },
  { id: 58, brandSlug: 'renault', slug: 'taliant', name: 'Taliant', chassisCode: 'L67', yearStart: 2021, yearEnd: 2026 },
  // Fiat
  { id: 59, brandSlug: 'fiat', slug: 'egea-sedan', name: 'Egea Sedan', chassisCode: '356', yearStart: 2015, yearEnd: 2026 },
  { id: 60, brandSlug: 'fiat', slug: 'egea-cross', name: 'Egea Cross', chassisCode: '356C', yearStart: 2020, yearEnd: 2026 },
  { id: 61, brandSlug: 'fiat', slug: 'doblo-2', name: 'Doblò', chassisCode: '263', yearStart: 2010, yearEnd: 2022 },
  // Toyota
  { id: 62, brandSlug: 'toyota', slug: 'corolla-e210', name: 'Corolla', chassisCode: 'E210', yearStart: 2018, yearEnd: 2026 },
  { id: 63, brandSlug: 'toyota', slug: 'yaris-cross', name: 'Yaris Cross', chassisCode: 'XP210', yearStart: 2020, yearEnd: 2026 },
  { id: 64, brandSlug: 'toyota', slug: 'rav4-xa50', name: 'RAV4', chassisCode: 'XA50', yearStart: 2019, yearEnd: 2026 },
  { id: 65, brandSlug: 'toyota', slug: 'chr-x10', name: 'C-HR', chassisCode: 'X10', yearStart: 2016, yearEnd: 2023 },
  // Honda
  { id: 66, brandSlug: 'honda', slug: 'civic-fc5', name: 'Civic', chassisCode: 'FC5', yearStart: 2016, yearEnd: 2021 },
  { id: 67, brandSlug: 'honda', slug: 'civic-fl5', name: 'Civic', chassisCode: 'FL5', yearStart: 2022, yearEnd: 2026 },
  { id: 68, brandSlug: 'honda', slug: 'crv-rw', name: 'CR-V', chassisCode: 'RW', yearStart: 2017, yearEnd: 2023 },
  // Opel
  { id: 69, brandSlug: 'opel', slug: 'corsa-f', name: 'Corsa', chassisCode: 'F', yearStart: 2019, yearEnd: 2026 },
  { id: 70, brandSlug: 'opel', slug: 'astra-k', name: 'Astra', chassisCode: 'K', yearStart: 2015, yearEnd: 2021 },
  { id: 71, brandSlug: 'opel', slug: 'mokka-b', name: 'Mokka', chassisCode: 'B', yearStart: 2020, yearEnd: 2026 },
  // Dacia
  { id: 72, brandSlug: 'dacia', slug: 'sandero-3', name: 'Sandero', chassisCode: 'Mk3', yearStart: 2020, yearEnd: 2026 },
  { id: 73, brandSlug: 'dacia', slug: 'duster-2', name: 'Duster', chassisCode: 'Mk2', yearStart: 2018, yearEnd: 2024 },
  { id: 74, brandSlug: 'dacia', slug: 'duster-3', name: 'Duster', chassisCode: 'Mk3', yearStart: 2024, yearEnd: 2026 },
  // Kia
  { id: 75, brandSlug: 'kia', slug: 'ceed-cd', name: 'Ceed', chassisCode: 'CD', yearStart: 2018, yearEnd: 2026 },
  { id: 76, brandSlug: 'kia', slug: 'sportage-5', name: 'Sportage', chassisCode: 'NQ5', yearStart: 2021, yearEnd: 2026 },
  { id: 77, brandSlug: 'kia', slug: 'stonic', name: 'Stonic', chassisCode: 'YB', yearStart: 2017, yearEnd: 2026 },
  // Tesla
  { id: 78, brandSlug: 'tesla', slug: 'model-3', name: 'Model 3', chassisCode: 'Highland', yearStart: 2017, yearEnd: 2026 },
  { id: 79, brandSlug: 'tesla', slug: 'model-y', name: 'Model Y', chassisCode: 'Mk1', yearStart: 2020, yearEnd: 2026 },
  // Cupra / Seat
  { id: 80, brandSlug: 'cupra', slug: 'leon-kl', name: 'Leon', chassisCode: 'KL', yearStart: 2020, yearEnd: 2026 },
  { id: 81, brandSlug: 'cupra', slug: 'formentor', name: 'Formentor', chassisCode: 'KM', yearStart: 2020, yearEnd: 2026 },
  { id: 82, brandSlug: 'seat', slug: 'leon-kl', name: 'Leon', chassisCode: 'KL', yearStart: 2020, yearEnd: 2026 },
  // BYD / TOGG / Chery / MG
  { id: 83, brandSlug: 'togg', slug: 't10x', name: 'T10X', chassisCode: 'C-Segment', yearStart: 2023, yearEnd: 2026 },
  { id: 84, brandSlug: 'byd', slug: 'atto-3', name: 'Atto 3', chassisCode: 'Yuan Plus', yearStart: 2022, yearEnd: 2026 },
  { id: 85, brandSlug: 'byd', slug: 'seal', name: 'Seal', chassisCode: 'EA', yearStart: 2022, yearEnd: 2026 },
  { id: 86, brandSlug: 'mg', slug: 'zs', name: 'ZS', chassisCode: 'ZS', yearStart: 2017, yearEnd: 2026 },
  { id: 87, brandSlug: 'mg', slug: 'mg4', name: 'MG4', chassisCode: 'EH32', yearStart: 2022, yearEnd: 2026 },
  { id: 88, brandSlug: 'chery', slug: 'tiggo-7-pro', name: 'Tiggo 7 Pro', chassisCode: 'T1E', yearStart: 2020, yearEnd: 2026 },
  { id: 89, brandSlug: 'chery', slug: 'tiggo-8-pro', name: 'Tiggo 8 Pro', chassisCode: 'T1A', yearStart: 2020, yearEnd: 2026 },
  // Volvo / Mini / Porsche / Lexus
  { id: 90, brandSlug: 'volvo', slug: 'xc40', name: 'XC40', chassisCode: 'CMA', yearStart: 2017, yearEnd: 2026 },
  { id: 91, brandSlug: 'volvo', slug: 'xc60-2', name: 'XC60', chassisCode: 'Gen2', yearStart: 2017, yearEnd: 2026 },
  { id: 92, brandSlug: 'mini', slug: 'cooper-f56', name: 'Cooper', chassisCode: 'F56', yearStart: 2014, yearEnd: 2024 },
  { id: 93, brandSlug: 'porsche', slug: 'macan', name: 'Macan', chassisCode: '95B', yearStart: 2014, yearEnd: 2026 },
  { id: 94, brandSlug: 'lexus', slug: 'nx', name: 'NX', chassisCode: 'AZ20', yearStart: 2021, yearEnd: 2026 },
  // Citroen / Nissan / Mazda / Suzuki / Subaru / Mitsubishi / Jeep
  { id: 95, brandSlug: 'citroen', slug: 'c3-3', name: 'C3', chassisCode: 'A51', yearStart: 2016, yearEnd: 2024 },
  { id: 96, brandSlug: 'citroen', slug: 'c4-3', name: 'C4', chassisCode: 'C42', yearStart: 2020, yearEnd: 2026 },
  { id: 97, brandSlug: 'nissan', slug: 'qashqai-j11', name: 'Qashqai', chassisCode: 'J11', yearStart: 2014, yearEnd: 2021 },
  { id: 98, brandSlug: 'nissan', slug: 'qashqai-j12', name: 'Qashqai', chassisCode: 'J12', yearStart: 2021, yearEnd: 2026 },
  { id: 99, brandSlug: 'mazda', slug: 'cx-3', name: 'CX-3', chassisCode: 'DK', yearStart: 2015, yearEnd: 2024 },
  { id: 100, brandSlug: 'suzuki', slug: 'vitara', name: 'Vitara', chassisCode: 'LY', yearStart: 2015, yearEnd: 2026 },
  { id: 101, brandSlug: 'jeep', slug: 'compass-mp', name: 'Compass', chassisCode: 'MP', yearStart: 2017, yearEnd: 2026 },
  { id: 102, brandSlug: 'jeep', slug: 'renegade', name: 'Renegade', chassisCode: 'BU', yearStart: 2014, yearEnd: 2026 },
]

const SWATCH = '/assets/swatches'

export const MAT_COLORS: MatColor[] = [
  { id: 1, slug: 'siyah', name: 'Siyah', hex: '#0f0f12', swatchUrl: `${SWATCH}/mat-siyah.webp` },
  { id: 2, slug: 'gri', name: 'Gri', hex: '#5a5a60', swatchUrl: `${SWATCH}/mat-gri.webp` },
  { id: 3, slug: 'fume', name: 'Füme', hex: '#3a3a40', swatchUrl: `${SWATCH}/mat-fume.webp` },
  { id: 4, slug: 'mavi', name: 'Mavi', hex: '#1e3a8a', swatchUrl: `${SWATCH}/mat-mavi.webp` },
  { id: 5, slug: 'taba', name: 'Taba', hex: '#8a5a3a', swatchUrl: `${SWATCH}/mat-taba.webp` },
  { id: 6, slug: 'kirmizi', name: 'Kırmızı', hex: '#9b1c1c', swatchUrl: `${SWATCH}/mat-kirmizi.webp` },
  { id: 7, slug: 'kahve', name: 'Kahve', hex: '#4a2a1a', swatchUrl: `${SWATCH}/mat-kahve.webp` },
  { id: 8, slug: 'bordo', name: 'Bordo', hex: '#6b1f2e', swatchUrl: `${SWATCH}/mat-bordo.webp` },
  { id: 9, slug: 'bej', name: 'Bej', hex: '#d6c5a8', swatchUrl: `${SWATCH}/mat-bej.webp` },
  { id: 10, slug: 'turuncu-taba', name: 'Turuncu Taba', hex: '#c87632', swatchUrl: `${SWATCH}/mat-turuncu-taba.webp` },
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
