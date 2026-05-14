/**
 * Sepet store — nanostores/persistent ile localStorage tabanlı.
 * SSR'da boş array (server'da localStorage yok), client mount'ta hidrate olur.
 *
 * Sepet line tipleri:
 *   - 'simple'      → catalog-extra.ts'den (parfüm, çanta, kimya, ekran koruyucu)
 *   - 'mat-config'  → paspas konfigüratör çıktısı
 *   - 'seat-config' → koltuk kılıfı konfig (Yakında)
 *   - 'steering-config' → direksiyon kılıfı konfig (Yakında)
 *
 * Konfigüratör line'ları için `config` alanında ham seçim payload'u durur
 * (server checkout'ta tekrar fiyatlanır + Order.items'a expand edilir).
 */

import { persistentAtom } from '@nanostores/persistent'

export type CartLineKind = 'mat-config' | 'seat-config' | 'steering-config' | 'simple'

export interface CartLine {
  lineId: string
  kind: CartLineKind
  productId?: string
  slug?: string
  name: string
  image?: string
  unitPrice: number
  quantity: number
  /** Konfigüratör çıktısı (mat/seat/steering line'lar için) */
  config?: Record<string, unknown>
  /** UI'da görünen ek bilgi (renk, doku, vb.) */
  attributes?: Record<string, string>
}

/** Persistent store — 'carmat:cart-v1' key'i ile localStorage'a yazılır */
export const cartStore = persistentAtom<CartLine[]>('carmat:cart-v1', [], {
  encode: JSON.stringify,
  decode: (raw) => {
    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
})

/** UUID üretimi — crypto.randomUUID Safari 15+'tan beri var, fallback kısa hex */
function makeLineId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

export function addLine(input: Omit<CartLine, 'lineId'>): CartLine {
  const line: CartLine = { ...input, lineId: makeLineId() }
  // Aynı simple ürün (productId) varsa qty arttır
  if (line.kind === 'simple' && line.productId) {
    const existing = cartStore.get().find(
      (l) => l.kind === 'simple' && l.productId === line.productId,
    )
    if (existing) {
      updateQty(existing.lineId, existing.quantity + line.quantity)
      return existing
    }
  }
  cartStore.set([...cartStore.get(), line])
  return line
}

export function updateQty(lineId: string, quantity: number): void {
  if (quantity <= 0) {
    removeLine(lineId)
    return
  }
  cartStore.set(
    cartStore.get().map((l) => (l.lineId === lineId ? { ...l, quantity } : l)),
  )
}

export function removeLine(lineId: string): void {
  cartStore.set(cartStore.get().filter((l) => l.lineId !== lineId))
}

export function clearCart(): void {
  cartStore.set([])
}

export function cartTotal(lines: CartLine[] = cartStore.get()): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0)
}

export function cartCount(lines: CartLine[] = cartStore.get()): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0)
}

/** Sepet özetini sade JSON olarak çıkar — admin'e gönderim için */
export function cartSummary(): { lines: CartLine[]; total: number; count: number } {
  const lines = cartStore.get()
  return { lines, total: cartTotal(lines), count: cartCount(lines) }
}
