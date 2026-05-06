/**
 * Sepet store — localStorage tabanlı.
 * Strapi entegrasyonu eklenince server-side persistence'a geçilecek.
 */
import { atom, computed } from 'nanostores'

export type CartItem = {
  id: string
  brandSlug: string
  brandName: string
  modelSlug: string
  modelName: string
  modelChassis: string
  productSlug: string
  productName: string
  productParts: number
  matSlug: string
  matName: string
  matSwatchUrl: string
  borderSlug: string
  borderName: string
  borderSwatchUrl: string
  heelSlug: string
  heelName: string
  heelSwatchUrl: string
  heelPadPassenger: boolean
  logoBrandSlug: string | null
  logoQty: number
  unitPrice: number
  qty: number
  addedAt: number
}

const KEY = 'paspasoto:cart:v1'

function load(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

function save(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(KEY, JSON.stringify(items))
}

export const $cart = atom<CartItem[]>(load())

export const $cartCount = computed($cart, (items) => items.reduce((s, i) => s + i.qty, 0))
export const $cartTotal = computed($cart, (items) =>
  items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
)

export function addToCart(item: Omit<CartItem, 'id' | 'addedAt'>) {
  const next = [...$cart.get(), { ...item, id: crypto.randomUUID(), addedAt: Date.now() }]
  $cart.set(next)
  save(next)
}

export function updateQty(id: string, qty: number) {
  if (qty <= 0) {
    removeItem(id)
    return
  }
  const next = $cart.get().map((i) => (i.id === id ? { ...i, qty } : i))
  $cart.set(next)
  save(next)
}

export function removeItem(id: string) {
  const next = $cart.get().filter((i) => i.id !== id)
  $cart.set(next)
  save(next)
}

export function clearCart() {
  $cart.set([])
  save([])
}
