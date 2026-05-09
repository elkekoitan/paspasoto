/**
 * Vehicle trim seed verisi.
 *
 * Türkiye pazarında en çok satılan ~12 modelin popüler donanım/motor
 * kombinasyonları. Verisi public spec sheet bilgisi (motor + paket adı).
 *
 * Paspas üretimi için trim seçimi opsiyonel — sadece UX'i zenginleştirir.
 * Order'a kayıt edildiğinde admin'in tam müşteri talebini görmesini sağlar.
 *
 * VehicleModel.id'ler için catalog.ts'i referans al.
 */

import type { VehicleTrim } from './catalog'

export const VEHICLE_TRIMS: VehicleTrim[] = [
  // ─── BMW 3 Serisi G20 (id 5) ───
  { id: 1, modelId: 5, name: '320i Sport Line', engine: '2.0 TwinPower', power: 184, fuel: 'benzin', transmission: 'otomatik', drive: 'rwd', package: 'Sport Line' },
  { id: 2, modelId: 5, name: '320d xDrive Sport Line', engine: '2.0 TDI', power: 190, fuel: 'dizel', transmission: 'otomatik', drive: 'awd', package: 'Sport Line' },
  { id: 3, modelId: 5, name: '330i M Sport', engine: '2.0 TwinPower', power: 258, fuel: 'benzin', transmission: 'otomatik', drive: 'rwd', package: 'M Sport' },
  { id: 4, modelId: 5, name: '330e M Sport (Plug-in)', engine: '2.0 + Elektrik', power: 292, fuel: 'phev', transmission: 'otomatik', drive: 'rwd', package: 'M Sport' },

  // ─── BMW 3 Serisi F30 (id 4) ───
  { id: 5, modelId: 4, name: '320i', engine: '2.0 TwinPower', power: 184, fuel: 'benzin', transmission: 'otomatik', drive: 'rwd' },
  { id: 6, modelId: 4, name: '320d', engine: '2.0 TDI', power: 190, fuel: 'dizel', transmission: 'otomatik', drive: 'rwd' },
  { id: 7, modelId: 4, name: '320d xDrive', engine: '2.0 TDI', power: 190, fuel: 'dizel', transmission: 'otomatik', drive: 'awd' },

  // ─── Audi A3 8Y (id 13) ───
  { id: 8, modelId: 13, name: '30 TFSI', engine: '1.0 TFSI', power: 110, fuel: 'benzin', transmission: 'manuel', drive: 'fwd' },
  { id: 9, modelId: 13, name: '35 TFSI S-Tronic Sport', engine: '1.5 TFSI', power: 150, fuel: 'benzin', transmission: 'dct', drive: 'fwd', package: 'Sport' },
  { id: 10, modelId: 13, name: '40 TDI quattro S-line', engine: '2.0 TDI', power: 200, fuel: 'dizel', transmission: 'dct', drive: 'awd', package: 'S-line' },

  // ─── Audi A4 B9 (id 15) ───
  { id: 11, modelId: 15, name: '2.0 TFSI Sport', engine: '2.0 TFSI', power: 190, fuel: 'benzin', transmission: 'otomatik', drive: 'fwd', package: 'Sport' },
  { id: 12, modelId: 15, name: '2.0 TDI quattro Premium', engine: '2.0 TDI', power: 190, fuel: 'dizel', transmission: 'otomatik', drive: 'awd', package: 'Premium' },

  // ─── VW Golf Mk7 (id 29) ───
  { id: 13, modelId: 29, name: '1.4 TSI Comfortline', engine: '1.4 TSI', power: 125, fuel: 'benzin', transmission: 'manuel', drive: 'fwd', package: 'Comfortline' },
  { id: 14, modelId: 29, name: '1.6 TDI DSG Highline', engine: '1.6 TDI', power: 115, fuel: 'dizel', transmission: 'dct', drive: 'fwd', package: 'Highline' },
  { id: 15, modelId: 29, name: '2.0 TSI GTI', engine: '2.0 TSI', power: 230, fuel: 'benzin', transmission: 'dct', drive: 'fwd', package: 'GTI' },

  // ─── VW Golf Mk8 (id 30) ───
  { id: 16, modelId: 30, name: '1.0 eTSI Life', engine: '1.0 eTSI', power: 110, fuel: 'hibrit', transmission: 'dct', drive: 'fwd', package: 'Life' },
  { id: 17, modelId: 30, name: '1.5 eTSI Style DSG', engine: '1.5 eTSI', power: 150, fuel: 'hibrit', transmission: 'dct', drive: 'fwd', package: 'Style' },
  { id: 18, modelId: 30, name: 'GTI 2.0 TSI', engine: '2.0 TSI', power: 245, fuel: 'benzin', transmission: 'dct', drive: 'fwd', package: 'GTI' },

  // ─── VW Passat B8 (id 32) ───
  { id: 19, modelId: 32, name: '1.6 TDI DSG Comfortline', engine: '1.6 TDI', power: 120, fuel: 'dizel', transmission: 'dct', drive: 'fwd', package: 'Comfortline' },
  { id: 20, modelId: 32, name: '2.0 TDI DSG Elegance', engine: '2.0 TDI', power: 190, fuel: 'dizel', transmission: 'dct', drive: 'fwd', package: 'Elegance' },

  // ─── Renault Clio Mk5 (id 55) ───
  { id: 21, modelId: 55, name: '1.0 SCe Joy', engine: '1.0 SCe', power: 75, fuel: 'benzin', transmission: 'manuel', drive: 'fwd', package: 'Joy' },
  { id: 22, modelId: 55, name: '1.0 TCe X-Tronic Touch', engine: '1.0 TCe', power: 90, fuel: 'benzin', transmission: 'cvt', drive: 'fwd', package: 'Touch' },
  { id: 23, modelId: 55, name: '1.5 dCi Icon', engine: '1.5 dCi', power: 95, fuel: 'dizel', transmission: 'manuel', drive: 'fwd', package: 'Icon' },
  { id: 24, modelId: 55, name: 'E-Tech Hybrid Iconic', engine: '1.6 + Elektrik', power: 145, fuel: 'hibrit', transmission: 'otomatik', drive: 'fwd', package: 'Iconic' },

  // ─── Renault Megane Mk4 (id 56) ───
  { id: 25, modelId: 56, name: '1.5 dCi EDC Icon', engine: '1.5 dCi', power: 110, fuel: 'dizel', transmission: 'dct', drive: 'fwd', package: 'Icon' },
  { id: 26, modelId: 56, name: '1.3 TCe EDC Iconic', engine: '1.3 TCe', power: 140, fuel: 'benzin', transmission: 'dct', drive: 'fwd', package: 'Iconic' },

  // ─── Fiat Egea Sedan (id 59) ───
  { id: 27, modelId: 59, name: '1.4 Fire Easy', engine: '1.4 Fire', power: 95, fuel: 'benzin', transmission: 'manuel', drive: 'fwd', package: 'Easy' },
  { id: 28, modelId: 59, name: '1.6 MultiJet Easy', engine: '1.6 MultiJet', power: 120, fuel: 'dizel', transmission: 'manuel', drive: 'fwd', package: 'Easy' },
  { id: 29, modelId: 59, name: '1.6 MultiJet DCT Lounge', engine: '1.6 MultiJet', power: 120, fuel: 'dizel', transmission: 'dct', drive: 'fwd', package: 'Lounge' },
  { id: 30, modelId: 59, name: '1.4 Fire Easy LPG', engine: '1.4 Fire LPG', power: 95, fuel: 'lpg', transmission: 'manuel', drive: 'fwd', package: 'Easy' },

  // ─── Fiat Egea Cross (id 60) ───
  { id: 31, modelId: 60, name: '1.3 MultiJet Cross', engine: '1.3 MultiJet', power: 95, fuel: 'dizel', transmission: 'manuel', drive: 'fwd', package: 'Cross' },
  { id: 32, modelId: 60, name: '1.6 MultiJet DCT Cross Plus', engine: '1.6 MultiJet', power: 120, fuel: 'dizel', transmission: 'dct', drive: 'fwd', package: 'Cross Plus' },

  // ─── Toyota Corolla E210 (id 62) ───
  { id: 33, modelId: 62, name: '1.6 Vision Multidrive S', engine: '1.6 Valvematic', power: 132, fuel: 'benzin', transmission: 'cvt', drive: 'fwd', package: 'Vision' },
  { id: 34, modelId: 62, name: '1.8 Hybrid e-CVT Flame', engine: '1.8 + Elektrik', power: 122, fuel: 'hibrit', transmission: 'cvt', drive: 'fwd', package: 'Flame' },
  { id: 35, modelId: 62, name: '1.8 Hybrid e-CVT Passion', engine: '1.8 + Elektrik', power: 122, fuel: 'hibrit', transmission: 'cvt', drive: 'fwd', package: 'Passion' },

  // ─── Ford Focus Mk4 (id 48) ───
  { id: 36, modelId: 48, name: '1.5 EcoBlue Trend', engine: '1.5 EcoBlue', power: 120, fuel: 'dizel', transmission: 'manuel', drive: 'fwd', package: 'Trend' },
  { id: 37, modelId: 48, name: '1.5 EcoBlue PowerShift Titanium', engine: '1.5 EcoBlue', power: 120, fuel: 'dizel', transmission: 'otomatik', drive: 'fwd', package: 'Titanium' },

  // ─── Hyundai i20 BC3 (id 42) ───
  { id: 38, modelId: 42, name: '1.4 MPI Style', engine: '1.4 MPI', power: 100, fuel: 'benzin', transmission: 'otomatik', drive: 'fwd', package: 'Style' },
  { id: 39, modelId: 42, name: '1.0 T-GDI Elite', engine: '1.0 T-GDI', power: 100, fuel: 'benzin', transmission: 'dct', drive: 'fwd', package: 'Elite' },

  // ─── Dacia Sandero Mk3 (id 72) ───
  { id: 40, modelId: 72, name: '1.0 SCe Essential', engine: '1.0 SCe', power: 65, fuel: 'benzin', transmission: 'manuel', drive: 'fwd', package: 'Essential' },
  { id: 41, modelId: 72, name: '1.0 TCe Comfort', engine: '1.0 TCe', power: 90, fuel: 'benzin', transmission: 'manuel', drive: 'fwd', package: 'Comfort' },
  { id: 42, modelId: 72, name: '1.0 ECO-G Comfort LPG', engine: '1.0 ECO-G', power: 100, fuel: 'lpg', transmission: 'manuel', drive: 'fwd', package: 'Comfort' },

  // ─── Mercedes A W177 (id 20) ───
  { id: 43, modelId: 20, name: 'A180 Style', engine: '1.3 turbo', power: 136, fuel: 'benzin', transmission: 'dct', drive: 'fwd', package: 'Style' },
  { id: 44, modelId: 20, name: 'A200 d Progressive', engine: '2.0 d', power: 150, fuel: 'dizel', transmission: 'dct', drive: 'fwd', package: 'Progressive' },
  { id: 45, modelId: 20, name: 'A250 e AMG Line (PHEV)', engine: '1.3 + Elektrik', power: 218, fuel: 'phev', transmission: 'dct', drive: 'fwd', package: 'AMG Line' },

  // ─── Mercedes C W206 (id 23) ───
  { id: 46, modelId: 23, name: 'C200 AMG Line', engine: '1.5 turbo + EQ', power: 204, fuel: 'hibrit', transmission: 'otomatik', drive: 'rwd', package: 'AMG Line' },
  { id: 47, modelId: 23, name: 'C220d Avantgarde', engine: '2.0 d', power: 200, fuel: 'dizel', transmission: 'otomatik', drive: 'rwd', package: 'Avantgarde' },

  // ─── Tesla Model 3 (id 78) ───
  { id: 48, modelId: 78, name: 'Standart Menzilli RWD', engine: 'Elektrik', power: 283, fuel: 'elektrik', transmission: 'otomatik', drive: 'rwd' },
  { id: 49, modelId: 78, name: 'Long Range AWD', engine: 'Elektrik (dual motor)', power: 498, fuel: 'elektrik', transmission: 'otomatik', drive: 'awd' },
  { id: 50, modelId: 78, name: 'Performance', engine: 'Elektrik (dual motor)', power: 510, fuel: 'elektrik', transmission: 'otomatik', drive: 'awd' },

  // ─── Tesla Model Y (id 79) ───
  { id: 51, modelId: 79, name: 'Standart Menzilli RWD', engine: 'Elektrik', power: 295, fuel: 'elektrik', transmission: 'otomatik', drive: 'rwd' },
  { id: 52, modelId: 79, name: 'Long Range AWD', engine: 'Elektrik', power: 384, fuel: 'elektrik', transmission: 'otomatik', drive: 'awd' },

  // ─── TOGG T10X (id 83) ───
  { id: 53, modelId: 83, name: 'V1 RWD Standart Menzil', engine: 'Elektrik', power: 218, fuel: 'elektrik', transmission: 'otomatik', drive: 'rwd', package: 'V1' },
  { id: 54, modelId: 83, name: 'V2 RWD Uzun Menzil', engine: 'Elektrik', power: 218, fuel: 'elektrik', transmission: 'otomatik', drive: 'rwd', package: 'V2' },

  // ─── Hyundai Tucson NX4 (id 44) ───
  { id: 55, modelId: 44, name: '1.6 T-GDI 7DCT Elite', engine: '1.6 T-GDI', power: 150, fuel: 'benzin', transmission: 'dct', drive: 'fwd', package: 'Elite' },
  { id: 56, modelId: 44, name: '1.6 T-GDI HEV Premium', engine: '1.6 + Elektrik', power: 230, fuel: 'hibrit', transmission: 'otomatik', drive: 'awd', package: 'Premium' },

  // ─── Skoda Octavia Mk4 (id 38) ───
  { id: 57, modelId: 38, name: '1.5 TSI Premium', engine: '1.5 TSI', power: 150, fuel: 'benzin', transmission: 'dct', drive: 'fwd', package: 'Premium' },
  { id: 58, modelId: 38, name: '2.0 TDI DSG Style', engine: '2.0 TDI', power: 150, fuel: 'dizel', transmission: 'dct', drive: 'fwd', package: 'Style' },
]

/* ─────────────────────────────────────────────────────────
   Helper'lar
   ───────────────────────────────────────────────────────── */

/** Bir model için tanımlı trim listesini döner. Boşsa, model'in trim'i yok. */
export function getTrimsForModel(modelId: number): VehicleTrim[] {
  return VEHICLE_TRIMS.filter((t) => t.modelId === modelId)
}

/** Trim id ile tek trim'i bul */
export function getTrimById(id: number): VehicleTrim | undefined {
  return VEHICLE_TRIMS.find((t) => t.id === id)
}

/** Yakıt tipi label (UI için) */
export const FUEL_LABEL: Record<string, string> = {
  benzin: 'Benzin',
  dizel: 'Dizel',
  lpg: 'LPG',
  hibrit: 'Hibrit',
  phev: 'Plug-in Hibrit',
  elektrik: 'Elektrik',
  cng: 'CNG',
}

/** Şanzıman label */
export const TRANSMISSION_LABEL: Record<string, string> = {
  manuel: 'Manuel',
  otomatik: 'Otomatik',
  'yari-otomatik': 'Yarı Otomatik',
  cvt: 'CVT',
  dct: 'DCT (Çift Kavrama)',
}

/** Çekiş label */
export const DRIVE_LABEL: Record<string, string> = {
  fwd: 'Önden Çekiş (FWD)',
  rwd: 'Arkadan İtiş (RWD)',
  awd: 'Tam Zamanlı 4×4 (AWD)',
  '4wd': 'Yarı Zamanlı 4×4',
}
