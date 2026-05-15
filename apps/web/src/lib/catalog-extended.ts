/**
 * catalog-extended.ts — Genişletilmiş marka + model kataloğu.
 *
 * Türkiye otomotiv pazarına özel kapsamlı liste. Mevcut catalog.ts'deki
 * temel markalar + modeller burada genişletilir.
 *
 * EXTENDED_BRANDS: 54 yeni marka (ID 47-1100)
 * EXTENDED_MODELS: 330+ yeni model (ID 200-1316)
 *
 * catalog.ts BRANDS + VEHICLE_MODELS export'larında spread ile birleştirilir.
 */
import type { Brand, VehicleModel } from './catalog'

/* -------------------- Genişletilmiş Markalar (54 adet) -------------------- */

export const EXTENDED_BRANDS: Brand[] = [
  { id: 47, slug: 'ds', name: 'DS Automobiles', popular: false, iconSlug: 'ds', color: '#3D0F4E' },
  { id: 48, slug: 'aston-martin', name: 'Aston Martin', popular: false, iconSlug: 'astonmartin', color: '#00665E' },
  { id: 49, slug: 'bentley', name: 'Bentley', popular: false, iconSlug: 'bentley', color: '#1B3F2E' },
  { id: 50, slug: 'ferrari', name: 'Ferrari', popular: false, iconSlug: 'ferrari', color: '#FF2800' },
  { id: 51, slug: 'lamborghini', name: 'Lamborghini', popular: false, iconSlug: 'lamborghini', color: '#A6A6A6' },
  { id: 52, slug: 'maserati', name: 'Maserati', popular: false, iconSlug: 'maserati', color: '#0A1F44' },
  { id: 53, slug: 'mclaren', name: 'McLaren', popular: false, iconSlug: 'mclaren', color: '#FF8000' },
  { id: 54, slug: 'rolls-royce', name: 'Rolls-Royce', popular: false, iconSlug: 'rollsroyce', color: '#68023F' },
  { id: 55, slug: 'bugatti', name: 'Bugatti', popular: false, iconSlug: 'bugatti', color: '#0033A0' },
  { id: 56, slug: 'lada', name: 'Lada', popular: false, iconSlug: 'lada', color: '#003478' },
  { id: 57, slug: 'geely', name: 'Geely', popular: true, iconSlug: 'geely', color: '#003B71' },
  { id: 58, slug: 'haval', name: 'Haval', popular: true, iconSlug: 'haval', color: '#C8102E' },
  { id: 59, slug: 'tank', name: 'Tank', popular: false, iconSlug: 'tank', color: '#2B2B2B' },
  { id: 60, slug: 'tata', name: 'Tata', popular: false, iconSlug: 'tata', color: '#486AAE' },
  { id: 61, slug: 'baic', name: 'BAIC', popular: false, iconSlug: 'baic', color: '#E60012' },
  { id: 62, slug: 'foton', name: 'Foton', popular: false, iconSlug: 'foton', color: '#003F87' },
  { id: 63, slug: 'skywell', name: 'Skywell', popular: false, iconSlug: 'skywell', color: '#0066B3' },
  { id: 64, slug: 'voyah', name: 'Voyah', popular: false, iconSlug: 'voyah', color: '#1A1A1A' },
  { id: 65, slug: 'zeekr', name: 'Zeekr', popular: false, iconSlug: 'zeekr', color: '#000000' },
  { id: 66, slug: 'leapmotor', name: 'Leapmotor', popular: false, iconSlug: 'leapmotor', color: '#00B6F0' },
  { id: 67, slug: 'xpeng', name: 'XPeng', popular: false, iconSlug: 'xpeng', color: '#0E1A2B' },
  { id: 68, slug: 'nio', name: 'Nio', popular: false, iconSlug: 'nio', color: '#00BFA6' },
  { id: 69, slug: 'omoda', name: 'Omoda', popular: true, iconSlug: 'omoda', color: '#D71920' },
  { id: 70, slug: 'jaecoo', name: 'Jaecoo', popular: true, iconSlug: 'jaecoo', color: '#1B5E20' },
  { id: 71, slug: 'exeed', name: 'Exeed', popular: false, iconSlug: 'exeed', color: '#0B3D2E' },
  { id: 72, slug: 'gac', name: 'GAC', popular: false, iconSlug: 'gac', color: '#C8102E' },
  { id: 73, slug: 'dfsk', name: 'DFSK', popular: false, iconSlug: 'dfsk', color: '#003F87' },
  { id: 74, slug: 'maxus', name: 'Maxus', popular: false, iconSlug: 'maxus', color: '#1F1F1F' },
  { id: 75, slug: 'karsan', name: 'Karsan', popular: false, iconSlug: 'karsan', color: '#003F87' },
  { id: 76, slug: 'otokar', name: 'Otokar', popular: false, iconSlug: 'otokar', color: '#E30613' },
  { id: 77, slug: 'temsa', name: 'Temsa', popular: false, iconSlug: 'temsa', color: '#003F87' },
  { id: 84, slug: 'bmc', name: 'BMC', popular: false, iconSlug: 'bmc', color: '#E30613' },
  { id: 89, slug: 'lancia', name: 'Lancia', popular: false, iconSlug: 'lancia', color: '#003F87' },
  { id: 94, slug: 'tofas', name: 'Tofaş', popular: false, iconSlug: 'tofas', color: '#003F87' },
  { id: 95, slug: 'anadol', name: 'Anadol', popular: false, iconSlug: 'anadol', color: '#1B5E20' },
  { id: 97, slug: 'great-wall', name: 'Great Wall', popular: false, iconSlug: 'greatwall', color: '#C8102E' },
  { id: 98, slug: 'changan', name: 'Changan', popular: false, iconSlug: 'changan', color: '#1F1F1F' },
  { id: 99, slug: 'dongfeng', name: 'Dongfeng', popular: false, iconSlug: 'dongfeng', color: '#C8102E' },
]

/* -------------------- Genişletilmiş Modeller (300+) -------------------- */

export const EXTENDED_MODELS: VehicleModel[] = [
  // AUDI ek modeller
  { id: 200, brandSlug: 'audi', slug: 'a1-gb', name: 'A1', chassisCode: 'GB', yearStart: 2018, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 209, brandSlug: 'audi', slug: 'q2-ga', name: 'Q2', chassisCode: 'GA', yearStart: 2016, yearEnd: 2024, bodyType: 'suv' },
  { id: 210, brandSlug: 'audi', slug: 'q3-f3', name: 'Q3', chassisCode: 'F3', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 211, brandSlug: 'audi', slug: 'q5-fy', name: 'Q5', chassisCode: 'FY', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 212, brandSlug: 'audi', slug: 'q7-4m', name: 'Q7', chassisCode: '4M', yearStart: 2015, yearEnd: 2026, bodyType: 'suv' },
  { id: 213, brandSlug: 'audi', slug: 'q8-4m', name: 'Q8', chassisCode: '4M', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 215, brandSlug: 'audi', slug: 'q4-e-tron', name: 'Q4 e-tron', chassisCode: 'FZ', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },

  // BMW ek modeller
  { id: 227, brandSlug: 'bmw', slug: 'x1-u11', name: 'X1', chassisCode: 'U11', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },
  { id: 228, brandSlug: 'bmw', slug: 'x2-u10', name: 'X2', chassisCode: 'U10', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },
  { id: 229, brandSlug: 'bmw', slug: 'x3-g01', name: 'X3', chassisCode: 'G01', yearStart: 2017, yearEnd: 2024, bodyType: 'suv' },
  { id: 232, brandSlug: 'bmw', slug: 'x5-g05', name: 'X5', chassisCode: 'G05', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 233, brandSlug: 'bmw', slug: 'x6-g06', name: 'X6', chassisCode: 'G06', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 234, brandSlug: 'bmw', slug: 'x7-g07', name: 'X7', chassisCode: 'G07', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 235, brandSlug: 'bmw', slug: 'ix-i20', name: 'iX', chassisCode: 'I20', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 236, brandSlug: 'bmw', slug: 'i4-g26', name: 'i4', chassisCode: 'G26', yearStart: 2021, yearEnd: 2026, bodyType: 'coupe' },

  // MERCEDES ek modeller
  { id: 245, brandSlug: 'mercedes', slug: 'cla-c118', name: 'CLA', chassisCode: 'C118', yearStart: 2019, yearEnd: 2026, bodyType: 'coupe' },
  { id: 250, brandSlug: 'mercedes', slug: 'gla-h247', name: 'GLA', chassisCode: 'H247', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 251, brandSlug: 'mercedes', slug: 'glb-x247', name: 'GLB', chassisCode: 'X247', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 253, brandSlug: 'mercedes', slug: 'glc-x254', name: 'GLC', chassisCode: 'X254', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },
  { id: 254, brandSlug: 'mercedes', slug: 'gle-w167', name: 'GLE', chassisCode: 'W167', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 256, brandSlug: 'mercedes', slug: 'g-serisi-w463', name: 'G Serisi', chassisCode: 'W463', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 257, brandSlug: 'mercedes', slug: 'vito-w447', name: 'Vito', chassisCode: 'W447', yearStart: 2014, yearEnd: 2026, bodyType: 'commercial' },
  { id: 259, brandSlug: 'mercedes', slug: 'sprinter-w907', name: 'Sprinter', chassisCode: 'W907', yearStart: 2018, yearEnd: 2026, bodyType: 'commercial' },
  { id: 261, brandSlug: 'mercedes', slug: 'eqe-v295', name: 'EQE', chassisCode: 'V295', yearStart: 2022, yearEnd: 2026, bodyType: 'sedan' },
  { id: 262, brandSlug: 'mercedes', slug: 'eqs-v297', name: 'EQS', chassisCode: 'V297', yearStart: 2021, yearEnd: 2026, bodyType: 'sedan' },

  // VOLKSWAGEN ek modeller
  { id: 270, brandSlug: 'volkswagen', slug: 'polo-mk6', name: 'Polo', chassisCode: 'MK6', yearStart: 2017, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 271, brandSlug: 'volkswagen', slug: 'golf-mk7', name: 'Golf', chassisCode: 'MK7', yearStart: 2012, yearEnd: 2020, bodyType: 'hatchback' },
  { id: 272, brandSlug: 'volkswagen', slug: 'golf-mk8', name: 'Golf', chassisCode: 'MK8', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 273, brandSlug: 'volkswagen', slug: 'jetta-a7', name: 'Jetta', chassisCode: 'A7', yearStart: 2018, yearEnd: 2026, bodyType: 'sedan' },
  { id: 274, brandSlug: 'volkswagen', slug: 'passat-b8', name: 'Passat', chassisCode: 'B8', yearStart: 2014, yearEnd: 2023, bodyType: 'sedan' },
  { id: 276, brandSlug: 'volkswagen', slug: 'arteon', name: 'Arteon', chassisCode: '3H', yearStart: 2017, yearEnd: 2026, bodyType: 'sedan' },
  { id: 277, brandSlug: 'volkswagen', slug: 't-cross', name: 'T-Cross', chassisCode: 'C1', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 278, brandSlug: 'volkswagen', slug: 't-roc', name: 'T-Roc', chassisCode: 'A1', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 280, brandSlug: 'volkswagen', slug: 'tiguan-mk2', name: 'Tiguan', chassisCode: 'MK2', yearStart: 2016, yearEnd: 2023, bodyType: 'suv' },
  { id: 281, brandSlug: 'volkswagen', slug: 'tiguan-mk3', name: 'Tiguan', chassisCode: 'MK3', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },
  { id: 282, brandSlug: 'volkswagen', slug: 'touareg-cr', name: 'Touareg', chassisCode: 'CR', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 285, brandSlug: 'volkswagen', slug: 'transporter-t6', name: 'Transporter', chassisCode: 'T6', yearStart: 2015, yearEnd: 2024, bodyType: 'commercial' },
  { id: 287, brandSlug: 'volkswagen', slug: 'amarok', name: 'Amarok', chassisCode: 'V6', yearStart: 2010, yearEnd: 2026, bodyType: 'pickup' },
  { id: 289, brandSlug: 'volkswagen', slug: 'id4', name: 'ID.4', chassisCode: 'E21', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },

  // SKODA ek modeller
  { id: 300, brandSlug: 'skoda', slug: 'fabia-mk4', name: 'Fabia', chassisCode: 'MK4', yearStart: 2021, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 301, brandSlug: 'skoda', slug: 'scala', name: 'Scala', chassisCode: 'NW', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 303, brandSlug: 'skoda', slug: 'octavia-mk3', name: 'Octavia', chassisCode: 'MK3', yearStart: 2013, yearEnd: 2020, bodyType: 'sedan' },
  { id: 304, brandSlug: 'skoda', slug: 'octavia-mk4', name: 'Octavia', chassisCode: 'MK4', yearStart: 2020, yearEnd: 2026, bodyType: 'sedan' },
  { id: 305, brandSlug: 'skoda', slug: 'superb-b8-skoda', name: 'Superb', chassisCode: 'B8', yearStart: 2015, yearEnd: 2023, bodyType: 'sedan' },
  { id: 307, brandSlug: 'skoda', slug: 'kamiq', name: 'Kamiq', chassisCode: 'NW4', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 308, brandSlug: 'skoda', slug: 'karoq', name: 'Karoq', chassisCode: 'NU', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 309, brandSlug: 'skoda', slug: 'kodiaq-mk1', name: 'Kodiaq', chassisCode: 'NS', yearStart: 2016, yearEnd: 2024, bodyType: 'suv' },
  { id: 311, brandSlug: 'skoda', slug: 'enyaq', name: 'Enyaq', chassisCode: 'iV', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },

  // HYUNDAI ek
  { id: 320, brandSlug: 'hyundai', slug: 'i10-ac3', name: 'i10', chassisCode: 'AC3', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 321, brandSlug: 'hyundai', slug: 'i20-bc3', name: 'i20', chassisCode: 'BC3', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 323, brandSlug: 'hyundai', slug: 'i30-pd', name: 'i30', chassisCode: 'PD', yearStart: 2017, yearEnd: 2024, bodyType: 'hatchback' },
  { id: 324, brandSlug: 'hyundai', slug: 'elantra-cn7', name: 'Elantra', chassisCode: 'CN7', yearStart: 2020, yearEnd: 2026, bodyType: 'sedan' },
  { id: 327, brandSlug: 'hyundai', slug: 'kona-os', name: 'Kona', chassisCode: 'OS', yearStart: 2017, yearEnd: 2023, bodyType: 'suv' },
  { id: 330, brandSlug: 'hyundai', slug: 'tucson-nx4', name: 'Tucson', chassisCode: 'NX4', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 331, brandSlug: 'hyundai', slug: 'santa-fe-tm', name: 'Santa Fe', chassisCode: 'TM', yearStart: 2018, yearEnd: 2023, bodyType: 'suv' },
  { id: 333, brandSlug: 'hyundai', slug: 'ioniq-5', name: 'Ioniq 5', chassisCode: 'NE', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },
  { id: 335, brandSlug: 'hyundai', slug: 'staria', name: 'Staria', chassisCode: 'US4', yearStart: 2021, yearEnd: 2026, bodyType: 'mpv' },

  // FORD ek
  { id: 340, brandSlug: 'ford', slug: 'fiesta-mk7', name: 'Fiesta', chassisCode: 'MK7', yearStart: 2017, yearEnd: 2023, bodyType: 'hatchback' },
  { id: 341, brandSlug: 'ford', slug: 'focus-mk4', name: 'Focus', chassisCode: 'MK4', yearStart: 2018, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 343, brandSlug: 'ford', slug: 'puma-jk', name: 'Puma', chassisCode: 'JK', yearStart: 2019, yearEnd: 2026, bodyType: 'crossover' },
  { id: 344, brandSlug: 'ford', slug: 'kuga-mk3', name: 'Kuga', chassisCode: 'MK3', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 345, brandSlug: 'ford', slug: 'ecosport-b515', name: 'EcoSport', chassisCode: 'B515', yearStart: 2017, yearEnd: 2023, bodyType: 'suv' },
  { id: 348, brandSlug: 'ford', slug: 'ranger-p703', name: 'Ranger', chassisCode: 'P703', yearStart: 2022, yearEnd: 2026, bodyType: 'pickup' },
  { id: 352, brandSlug: 'ford', slug: 'transit-v363', name: 'Transit', chassisCode: 'V363', yearStart: 2014, yearEnd: 2026, bodyType: 'commercial' },
  { id: 355, brandSlug: 'ford', slug: 'mustang-mach-e', name: 'Mustang Mach-E', chassisCode: 'CX727', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },

  // PEUGEOT ek
  { id: 360, brandSlug: 'peugeot', slug: '208-p21', name: '208', chassisCode: 'P21', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 362, brandSlug: 'peugeot', slug: '308-p51', name: '308', chassisCode: 'P51', yearStart: 2021, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 365, brandSlug: 'peugeot', slug: '2008-p24', name: '2008', chassisCode: 'P24', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 367, brandSlug: 'peugeot', slug: '3008-p64', name: '3008', chassisCode: 'P64', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },
  { id: 368, brandSlug: 'peugeot', slug: '5008-p87', name: '5008', chassisCode: 'P87', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 369, brandSlug: 'peugeot', slug: 'rifter', name: 'Rifter', chassisCode: 'K9', yearStart: 2018, yearEnd: 2026, bodyType: 'mpv' },
  { id: 370, brandSlug: 'peugeot', slug: 'partner', name: 'Partner', chassisCode: 'K9', yearStart: 2018, yearEnd: 2026, bodyType: 'commercial' },

  // RENAULT ek
  { id: 380, brandSlug: 'renault', slug: 'clio-mk5', name: 'Clio', chassisCode: 'BJA', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 381, brandSlug: 'renault', slug: 'megane-mk4', name: 'Megane', chassisCode: 'BFB', yearStart: 2016, yearEnd: 2023, bodyType: 'sedan' },
  { id: 382, brandSlug: 'renault', slug: 'megane-e-tech', name: 'Megane E-Tech', chassisCode: 'XCB', yearStart: 2022, yearEnd: 2026, bodyType: 'crossover' },
  { id: 383, brandSlug: 'renault', slug: 'taliant', name: 'Taliant', chassisCode: 'L7P', yearStart: 2021, yearEnd: 2026, bodyType: 'sedan' },
  { id: 386, brandSlug: 'renault', slug: 'captur-mk2', name: 'Captur', chassisCode: 'HJB', yearStart: 2019, yearEnd: 2026, bodyType: 'crossover' },
  { id: 388, brandSlug: 'renault', slug: 'austral', name: 'Austral', chassisCode: 'XCB', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },
  { id: 389, brandSlug: 'renault', slug: 'arkana', name: 'Arkana', chassisCode: 'LJL', yearStart: 2019, yearEnd: 2026, bodyType: 'crossover' },
  { id: 391, brandSlug: 'renault', slug: 'kangoo-mk3', name: 'Kangoo', chassisCode: 'FW2', yearStart: 2021, yearEnd: 2026, bodyType: 'mpv' },
  { id: 392, brandSlug: 'renault', slug: 'trafic-mk3', name: 'Trafic', chassisCode: 'X82', yearStart: 2014, yearEnd: 2026, bodyType: 'commercial' },

  // FIAT ek (Türkiye'de yaygın)
  { id: 400, brandSlug: 'fiat', slug: 'panda-mk3', name: 'Panda', chassisCode: '319', yearStart: 2012, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 401, brandSlug: 'fiat', slug: '500-312', name: '500', chassisCode: '312', yearStart: 2007, yearEnd: 2024, bodyType: 'hatchback' },
  { id: 402, brandSlug: 'fiat', slug: '500e', name: '500e', chassisCode: '332', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 405, brandSlug: 'fiat', slug: 'egea-sedan', name: 'Egea Sedan', chassisCode: '356', yearStart: 2015, yearEnd: 2026, bodyType: 'sedan' },
  { id: 406, brandSlug: 'fiat', slug: 'egea-hatchback', name: 'Egea HB', chassisCode: '356', yearStart: 2016, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 407, brandSlug: 'fiat', slug: 'egea-cross', name: 'Egea Cross', chassisCode: '356', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 408, brandSlug: 'fiat', slug: 'egea-station', name: 'Egea SW', chassisCode: '356', yearStart: 2016, yearEnd: 2026, bodyType: 'wagon' },
  { id: 409, brandSlug: 'fiat', slug: 'doblo-mk3', name: 'Doblo', chassisCode: '263', yearStart: 2010, yearEnd: 2022, bodyType: 'mpv' },
  { id: 410, brandSlug: 'fiat', slug: 'doblo-mk4', name: 'Doblo', chassisCode: 'K9', yearStart: 2022, yearEnd: 2026, bodyType: 'mpv' },
  { id: 411, brandSlug: 'fiat', slug: 'fiorino', name: 'Fiorino', chassisCode: '225', yearStart: 2008, yearEnd: 2024, bodyType: 'commercial' },
  { id: 412, brandSlug: 'fiat', slug: 'ducato-mk3', name: 'Ducato', chassisCode: '250', yearStart: 2006, yearEnd: 2026, bodyType: 'commercial' },
  { id: 413, brandSlug: 'fiat', slug: 'tipo-356', name: 'Tipo', chassisCode: '356', yearStart: 2015, yearEnd: 2024, bodyType: 'sedan' },

  // TOYOTA ek
  { id: 420, brandSlug: 'toyota', slug: 'aygo-x', name: 'Aygo X', chassisCode: 'AB70', yearStart: 2021, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 421, brandSlug: 'toyota', slug: 'yaris-xp210', name: 'Yaris', chassisCode: 'XP210', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 422, brandSlug: 'toyota', slug: 'yaris-cross', name: 'Yaris Cross', chassisCode: 'XP210', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },
  { id: 424, brandSlug: 'toyota', slug: 'corolla-hb-e210', name: 'Corolla HB', chassisCode: 'E210', yearStart: 2018, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 425, brandSlug: 'toyota', slug: 'corolla-cross', name: 'Corolla Cross', chassisCode: 'XG10', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 429, brandSlug: 'toyota', slug: 'ch-r-mk2', name: 'C-HR', chassisCode: 'GA-C', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },
  { id: 430, brandSlug: 'toyota', slug: 'rav4-xa50', name: 'RAV4', chassisCode: 'XA50', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 432, brandSlug: 'toyota', slug: 'land-cruiser-300', name: 'Land Cruiser', chassisCode: 'J300', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 433, brandSlug: 'toyota', slug: 'hilux-an130', name: 'Hilux', chassisCode: 'AN130', yearStart: 2015, yearEnd: 2026, bodyType: 'pickup' },
  { id: 436, brandSlug: 'toyota', slug: 'bz4x', name: 'bZ4X', chassisCode: 'AX10E', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },

  // OPEL ek
  { id: 455, brandSlug: 'opel', slug: 'corsa-f', name: 'Corsa', chassisCode: 'F', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 456, brandSlug: 'opel', slug: 'astra-k', name: 'Astra', chassisCode: 'K', yearStart: 2015, yearEnd: 2021, bodyType: 'hatchback' },
  { id: 457, brandSlug: 'opel', slug: 'astra-l', name: 'Astra', chassisCode: 'L', yearStart: 2021, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 460, brandSlug: 'opel', slug: 'mokka-b', name: 'Mokka', chassisCode: 'B', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 461, brandSlug: 'opel', slug: 'grandland', name: 'Grandland', chassisCode: 'A18', yearStart: 2017, yearEnd: 2024, bodyType: 'suv' },

  // DACIA ek
  { id: 510, brandSlug: 'dacia', slug: 'sandero-mk3', name: 'Sandero', chassisCode: 'DJF', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 511, brandSlug: 'dacia', slug: 'sandero-stepway-mk3', name: 'Sandero Stepway', chassisCode: 'DJF', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 512, brandSlug: 'dacia', slug: 'logan-mk3', name: 'Logan', chassisCode: 'DJF', yearStart: 2020, yearEnd: 2026, bodyType: 'sedan' },
  { id: 513, brandSlug: 'dacia', slug: 'duster-mk2', name: 'Duster', chassisCode: 'HJD', yearStart: 2017, yearEnd: 2024, bodyType: 'suv' },
  { id: 514, brandSlug: 'dacia', slug: 'duster-mk3', name: 'Duster', chassisCode: 'JJ', yearStart: 2024, yearEnd: 2026, bodyType: 'suv' },
  { id: 515, brandSlug: 'dacia', slug: 'jogger', name: 'Jogger', chassisCode: 'JJ', yearStart: 2022, yearEnd: 2026, bodyType: 'mpv' },
  { id: 516, brandSlug: 'dacia', slug: 'spring', name: 'Spring', chassisCode: 'BBG', yearStart: 2021, yearEnd: 2026, bodyType: 'hatchback' },

  // KIA ek
  { id: 525, brandSlug: 'kia', slug: 'picanto-ja', name: 'Picanto', chassisCode: 'JA', yearStart: 2017, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 527, brandSlug: 'kia', slug: 'ceed-cd-k', name: 'Ceed', chassisCode: 'CD-K', yearStart: 2018, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 528, brandSlug: 'kia', slug: 'stonic', name: 'Stonic', chassisCode: 'YB-CUV', yearStart: 2017, yearEnd: 2026, bodyType: 'crossover' },
  { id: 530, brandSlug: 'kia', slug: 'sportage-nq5-k', name: 'Sportage', chassisCode: 'NQ5-K', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 532, brandSlug: 'kia', slug: 'sorento-mq4', name: 'Sorento', chassisCode: 'MQ4', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 533, brandSlug: 'kia', slug: 'niro-sg2', name: 'Niro', chassisCode: 'SG2', yearStart: 2022, yearEnd: 2026, bodyType: 'crossover' },
  { id: 535, brandSlug: 'kia', slug: 'ev6', name: 'EV6', chassisCode: 'CV', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },

  // NISSAN ek
  { id: 546, brandSlug: 'nissan', slug: 'juke-f16', name: 'Juke', chassisCode: 'F16', yearStart: 2019, yearEnd: 2026, bodyType: 'crossover' },
  { id: 547, brandSlug: 'nissan', slug: 'qashqai-j11', name: 'Qashqai', chassisCode: 'J11', yearStart: 2014, yearEnd: 2021, bodyType: 'suv' },
  { id: 548, brandSlug: 'nissan', slug: 'qashqai-j12', name: 'Qashqai', chassisCode: 'J12', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 549, brandSlug: 'nissan', slug: 'x-trail-t33', name: 'X-Trail', chassisCode: 'T33', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },

  // CITROEN ek
  { id: 485, brandSlug: 'citroen', slug: 'c3-mk3-cit', name: 'C3', chassisCode: 'A51', yearStart: 2016, yearEnd: 2024, bodyType: 'hatchback' },
  { id: 487, brandSlug: 'citroen', slug: 'c4-mk3-cit', name: 'C4', chassisCode: 'C41', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 488, brandSlug: 'citroen', slug: 'c5-aircross', name: 'C5 Aircross', chassisCode: 'C84', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 490, brandSlug: 'citroen', slug: 'berlingo-mk3', name: 'Berlingo', chassisCode: 'K9', yearStart: 2018, yearEnd: 2026, bodyType: 'mpv' },

  // SEAT ek
  { id: 500, brandSlug: 'seat', slug: 'ibiza-mk5', name: 'Ibiza', chassisCode: 'KJ', yearStart: 2017, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 501, brandSlug: 'seat', slug: 'leon-mk4', name: 'Leon', chassisCode: 'KL', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 502, brandSlug: 'seat', slug: 'arona', name: 'Arona', chassisCode: 'KJ-SUV', yearStart: 2017, yearEnd: 2026, bodyType: 'crossover' },
  { id: 503, brandSlug: 'seat', slug: 'ateca', name: 'Ateca', chassisCode: '5FP', yearStart: 2016, yearEnd: 2026, bodyType: 'suv' },
  { id: 504, brandSlug: 'seat', slug: 'tarraco', name: 'Tarraco', chassisCode: 'KN', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },

  // CUPRA
  { id: 672, brandSlug: 'cupra', slug: 'leon-kl', name: 'Leon', chassisCode: 'KL-CP', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 673, brandSlug: 'cupra', slug: 'formentor', name: 'Formentor', chassisCode: 'KM', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 675, brandSlug: 'cupra', slug: 'born', name: 'Born', chassisCode: 'KL1', yearStart: 2021, yearEnd: 2026, bodyType: 'hatchback' },

  // MG
  { id: 660, brandSlug: 'mg', slug: 'mg3', name: 'MG3', chassisCode: 'SZP1', yearStart: 2024, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 661, brandSlug: 'mg', slug: 'mg4', name: 'MG4', chassisCode: 'EH32', yearStart: 2022, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 662, brandSlug: 'mg', slug: 'mg5', name: 'MG5', chassisCode: 'AP12', yearStart: 2020, yearEnd: 2026, bodyType: 'sedan' },
  { id: 663, brandSlug: 'mg', slug: 'zs', name: 'ZS', chassisCode: 'AZS1', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 664, brandSlug: 'mg', slug: 'zs-ev', name: 'ZS EV', chassisCode: 'AZS1E', yearStart: 2019, yearEnd: 2026, bodyType: 'suv' },
  { id: 665, brandSlug: 'mg', slug: 'hs', name: 'HS', chassisCode: 'AS23', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },

  // BYD
  { id: 685, brandSlug: 'byd', slug: 'atto-3-byd', name: 'Atto 3', chassisCode: 'EA1', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },
  { id: 686, brandSlug: 'byd', slug: 'dolphin', name: 'Dolphin', chassisCode: 'EA1-D', yearStart: 2021, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 687, brandSlug: 'byd', slug: 'seal', name: 'Seal', chassisCode: 'EA1-S', yearStart: 2022, yearEnd: 2026, bodyType: 'sedan' },
  { id: 688, brandSlug: 'byd', slug: 'seal-u', name: 'Seal U', chassisCode: 'EA1-U', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },

  // TESLA ek
  { id: 610, brandSlug: 'tesla', slug: 'model-3', name: 'Model 3', chassisCode: 'M3', yearStart: 2017, yearEnd: 2026, bodyType: 'sedan' },
  { id: 611, brandSlug: 'tesla', slug: 'model-y', name: 'Model Y', chassisCode: 'MY', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },

  // TOGG
  { id: 695, brandSlug: 'togg', slug: 't10x', name: 'T10X', chassisCode: 'T10X', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },
  { id: 696, brandSlug: 'togg', slug: 't10f', name: 'T10F', chassisCode: 'T10F', yearStart: 2025, yearEnd: 2026, bodyType: 'sedan' },

  // CHERY
  { id: 715, brandSlug: 'chery', slug: 'tiggo-7-pro', name: 'Tiggo 7 Pro', chassisCode: 'T1E', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 716, brandSlug: 'chery', slug: 'tiggo-8-pro', name: 'Tiggo 8 Pro', chassisCode: 'T18', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 717, brandSlug: 'chery', slug: 'tiggo-9', name: 'Tiggo 9', chassisCode: 'T2X', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },
  { id: 718, brandSlug: 'chery', slug: 'tiggo-2-pro', name: 'Tiggo 2 Pro', chassisCode: 'T1D', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },

  // HAVAL
  { id: 915, brandSlug: 'haval', slug: 'jolion', name: 'Jolion', chassisCode: 'B01', yearStart: 2020, yearEnd: 2026, bodyType: 'crossover' },
  { id: 916, brandSlug: 'haval', slug: 'h6', name: 'H6', chassisCode: 'B02', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 917, brandSlug: 'haval', slug: 'h9', name: 'H9', chassisCode: 'A01', yearStart: 2014, yearEnd: 2026, bodyType: 'suv' },

  // OMODA
  { id: 1005, brandSlug: 'omoda', slug: 'omoda-5', name: 'Omoda 5', chassisCode: 'FX-OM', yearStart: 2022, yearEnd: 2026, bodyType: 'crossover' },
  { id: 1006, brandSlug: 'omoda', slug: 'omoda-7', name: 'Omoda 7', chassisCode: 'FX7', yearStart: 2024, yearEnd: 2026, bodyType: 'suv' },

  // JAECOO
  { id: 1015, brandSlug: 'jaecoo', slug: 'j7', name: 'J7', chassisCode: 'J7', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },
  { id: 1016, brandSlug: 'jaecoo', slug: 'j8', name: 'J8', chassisCode: 'J8', yearStart: 2024, yearEnd: 2026, bodyType: 'suv' },

  // GEELY
  { id: 905, brandSlug: 'geely', slug: 'coolray', name: 'Coolray', chassisCode: 'SX11', yearStart: 2018, yearEnd: 2026, bodyType: 'crossover' },
  { id: 906, brandSlug: 'geely', slug: 'tugella', name: 'Tugella', chassisCode: 'FY11', yearStart: 2019, yearEnd: 2026, bodyType: 'coupe' },

  // TANK
  { id: 925, brandSlug: 'tank', slug: 'tank-300', name: 'Tank 300', chassisCode: 'P01', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 926, brandSlug: 'tank', slug: 'tank-500', name: 'Tank 500', chassisCode: 'P02', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },

  // HONDA ek
  { id: 440, brandSlug: 'honda', slug: 'jazz-gr', name: 'Jazz', chassisCode: 'GR', yearStart: 2020, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 441, brandSlug: 'honda', slug: 'civic-fk7', name: 'Civic', chassisCode: 'FK7', yearStart: 2016, yearEnd: 2021, bodyType: 'hatchback' },
  { id: 445, brandSlug: 'honda', slug: 'hr-v-rv', name: 'HR-V', chassisCode: 'RV-H', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },

  // VOLVO ek
  { id: 470, brandSlug: 'volvo', slug: 'xc40', name: 'XC40', chassisCode: '536', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 471, brandSlug: 'volvo', slug: 'xc60-mk2', name: 'XC60', chassisCode: '246', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 472, brandSlug: 'volvo', slug: 'xc90-mk2', name: 'XC90', chassisCode: '256', yearStart: 2014, yearEnd: 2026, bodyType: 'suv' },
  { id: 473, brandSlug: 'volvo', slug: 's60-mk3', name: 'S60', chassisCode: '224', yearStart: 2018, yearEnd: 2026, bodyType: 'sedan' },
  { id: 477, brandSlug: 'volvo', slug: 'ex30', name: 'EX30', chassisCode: '316', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },

  // SUZUKI
  { id: 620, brandSlug: 'suzuki', slug: 'swift-mk4', name: 'Swift', chassisCode: 'AZ', yearStart: 2017, yearEnd: 2024, bodyType: 'hatchback' },
  { id: 621, brandSlug: 'suzuki', slug: 'vitara', name: 'Vitara', chassisCode: 'LY', yearStart: 2015, yearEnd: 2026, bodyType: 'suv' },
  { id: 622, brandSlug: 'suzuki', slug: 's-cross', name: 'S-Cross', chassisCode: 'JY', yearStart: 2021, yearEnd: 2026, bodyType: 'crossover' },
  { id: 623, brandSlug: 'suzuki', slug: 'jimny-jb74', name: 'Jimny', chassisCode: 'JB74', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },

  // JEEP
  { id: 630, brandSlug: 'jeep', slug: 'renegade', name: 'Renegade', chassisCode: 'BU', yearStart: 2014, yearEnd: 2026, bodyType: 'suv' },
  { id: 632, brandSlug: 'jeep', slug: 'cherokee-kl', name: 'Cherokee', chassisCode: 'KL', yearStart: 2014, yearEnd: 2023, bodyType: 'suv' },
  { id: 633, brandSlug: 'jeep', slug: 'grand-cherokee-wl', name: 'Grand Cherokee', chassisCode: 'WL', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 634, brandSlug: 'jeep', slug: 'wrangler-jl', name: 'Wrangler', chassisCode: 'JL', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },
  { id: 635, brandSlug: 'jeep', slug: 'avenger', name: 'Avenger', chassisCode: 'J4U', yearStart: 2023, yearEnd: 2026, bodyType: 'suv' },

  // LAND ROVER
  { id: 640, brandSlug: 'landrover', slug: 'defender-l663', name: 'Defender', chassisCode: 'L663', yearStart: 2020, yearEnd: 2026, bodyType: 'suv' },
  { id: 643, brandSlug: 'landrover', slug: 'range-rover-l460', name: 'Range Rover', chassisCode: 'L460', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },
  { id: 644, brandSlug: 'landrover', slug: 'range-rover-sport-l461', name: 'Range Rover Sport', chassisCode: 'L461', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },
  { id: 645, brandSlug: 'landrover', slug: 'range-rover-velar-l560', name: 'Range Rover Velar', chassisCode: 'L560', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 646, brandSlug: 'landrover', slug: 'range-rover-evoque-l551', name: 'Range Rover Evoque', chassisCode: 'L551', yearStart: 2018, yearEnd: 2026, bodyType: 'suv' },

  // IVECO + ISUZU + COMMERCIAL
  { id: 700, brandSlug: 'iveco', slug: 'daily-mk6', name: 'Daily', chassisCode: 'MK6-IV', yearStart: 2014, yearEnd: 2026, bodyType: 'commercial' },
  { id: 705, brandSlug: 'isuzu', slug: 'd-max-rg', name: 'D-Max', chassisCode: 'RG', yearStart: 2020, yearEnd: 2026, bodyType: 'pickup' },

  // PORSCHE
  { id: 586, brandSlug: 'porsche', slug: 'cayenne-9ya', name: 'Cayenne', chassisCode: '9YA', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },
  { id: 587, brandSlug: 'porsche', slug: 'macan-95b', name: 'Macan', chassisCode: '95B', yearStart: 2014, yearEnd: 2026, bodyType: 'suv' },
  { id: 588, brandSlug: 'porsche', slug: 'panamera-971', name: 'Panamera', chassisCode: '971', yearStart: 2016, yearEnd: 2026, bodyType: 'sedan' },
  { id: 589, brandSlug: 'porsche', slug: 'taycan', name: 'Taycan', chassisCode: 'J1', yearStart: 2019, yearEnd: 2026, bodyType: 'sedan' },

  // LEXUS
  { id: 595, brandSlug: 'lexus', slug: 'ux-mxa10', name: 'UX', chassisCode: 'MXA10', yearStart: 2018, yearEnd: 2026, bodyType: 'crossover' },
  { id: 596, brandSlug: 'lexus', slug: 'nx-az20', name: 'NX', chassisCode: 'AZ20', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 597, brandSlug: 'lexus', slug: 'rx-al30', name: 'RX', chassisCode: 'AL30', yearStart: 2022, yearEnd: 2026, bodyType: 'suv' },

  // MITSUBISHI
  { id: 775, brandSlug: 'mitsubishi', slug: 'asx-ga', name: 'ASX', chassisCode: 'GA-M', yearStart: 2010, yearEnd: 2023, bodyType: 'crossover' },
  { id: 777, brandSlug: 'mitsubishi', slug: 'outlander-gn', name: 'Outlander', chassisCode: 'GN', yearStart: 2021, yearEnd: 2026, bodyType: 'suv' },
  { id: 778, brandSlug: 'mitsubishi', slug: 'l200-mk5', name: 'L200', chassisCode: 'MK5-M', yearStart: 2015, yearEnd: 2024, bodyType: 'pickup' },

  // MAZDA
  { id: 561, brandSlug: 'mazda', slug: 'mazda3-bp', name: 'Mazda3', chassisCode: 'BP', yearStart: 2019, yearEnd: 2026, bodyType: 'hatchback' },
  { id: 564, brandSlug: 'mazda', slug: 'cx-30', name: 'CX-30', chassisCode: 'DM', yearStart: 2019, yearEnd: 2026, bodyType: 'crossover' },
  { id: 565, brandSlug: 'mazda', slug: 'cx-5-kf', name: 'CX-5', chassisCode: 'KF', yearStart: 2017, yearEnd: 2026, bodyType: 'suv' },

  // TOFAS (eski/nostalji)
  { id: 1245, brandSlug: 'tofas', slug: 'sahin', name: 'Şahin', chassisCode: '131', yearStart: 1989, yearEnd: 2002, bodyType: 'sedan' },
  { id: 1246, brandSlug: 'tofas', slug: 'dogan', name: 'Doğan', chassisCode: '131D', yearStart: 1989, yearEnd: 2002, bodyType: 'sedan' },
  { id: 1247, brandSlug: 'tofas', slug: 'kartal', name: 'Kartal', chassisCode: 'K131', yearStart: 1990, yearEnd: 2002, bodyType: 'wagon' },

  // KARSAN
  { id: 1065, brandSlug: 'karsan', slug: 'jest', name: 'Jest', chassisCode: 'JEST', yearStart: 2013, yearEnd: 2026, bodyType: 'commercial' },
]
