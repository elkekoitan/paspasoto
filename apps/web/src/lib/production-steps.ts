/**
 * Üretim adımları — paspas siparişleri için.
 * Client + server'da paylaşılır.
 */

export type ProductionStepKey = 'cutting' | 'sewing' | 'logo' | 'heel' | 'quality' | 'packaging'

export interface ProductionStepMeta {
  key: ProductionStepKey
  label: string
  emoji: string
  description: string
}

export const PRODUCTION_STEPS: ProductionStepMeta[] = [
  { key: 'cutting', label: 'Kesim', emoji: '✂', description: 'EVA foam ölçüye göre kesim' },
  { key: 'sewing', label: 'Dikim', emoji: '🪡', description: 'Kenarlık biye dikişi' },
  { key: 'logo', label: 'Logo İşleme', emoji: '🏷', description: 'Marka logo deri/plaka montajı (varsa)' },
  { key: 'heel', label: 'Topukluk', emoji: '👟', description: 'Topukluk pedi montajı (varsa)' },
  { key: 'quality', label: 'Kalite Kontrol', emoji: '✅', description: 'Final kalite kontrolü' },
  { key: 'packaging', label: 'Paketleme', emoji: '📦', description: 'Etiket + kargo paketi' },
]

export const PRODUCTION_STEPS_MAP: Record<ProductionStepKey, ProductionStepMeta> = Object.fromEntries(
  PRODUCTION_STEPS.map((s) => [s.key, s]),
) as Record<ProductionStepKey, ProductionStepMeta>

export function isStepRelevant(step: ProductionStepKey, hasLogo: boolean, hasHeel: boolean): boolean {
  if (step === 'logo' && !hasLogo) return false
  if (step === 'heel' && !hasHeel) return false
  return true
}
