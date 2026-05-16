/**
 * permissions.ts — RBAC izin sistemi.
 * Client + server'da paylaşılır. Permission listesi sabittir.
 */

export type Permission =
  // Sipariş
  | 'orders.view' | 'orders.view-own' | 'orders.create' | 'orders.edit' | 'orders.delete' | 'orders.bulk'
  // Müşteri
  | 'customers.view' | 'customers.note'
  // İçerik / Ürün
  | 'content.view' | 'content.edit-product' | 'content.create-product' | 'content.delete-product'
  | 'content.edit-swatch' | 'content.edit-hero'
  // Hammadde + Stok
  | 'materials.view' | 'materials.edit' | 'materials.delete'
  | 'stock.view' | 'stock.edit'
  // Kasa
  | 'cash.open' | 'cash.close' | 'cash.movement'
  // Kargo + Entegrasyonlar
  | 'shipping.create' | 'shipping.track'
  | 'integrations.view' | 'integrations.edit' | 'integrations.mapping'
  // Kullanıcı + Sistem
  | 'users.view' | 'users.manage'
  | 'reports.view' | 'reports.export'
  | 'audit.view'
  | 'templates.edit'

export const ALL_PERMISSIONS: Permission[] = [
  'orders.view', 'orders.view-own', 'orders.create', 'orders.edit', 'orders.delete', 'orders.bulk',
  'customers.view', 'customers.note',
  'content.view', 'content.edit-product', 'content.create-product', 'content.delete-product',
  'content.edit-swatch', 'content.edit-hero',
  'materials.view', 'materials.edit', 'materials.delete',
  'stock.view', 'stock.edit',
  'cash.open', 'cash.close', 'cash.movement',
  'shipping.create', 'shipping.track',
  'integrations.view', 'integrations.edit', 'integrations.mapping',
  'users.view', 'users.manage',
  'reports.view', 'reports.export',
  'audit.view',
  'templates.edit',
]

/** UI gruplama */
export const PERMISSION_GROUPS: Array<{ key: string; label: string; permissions: Permission[] }> = [
  { key: 'orders', label: 'Sipariş', permissions: ['orders.view', 'orders.view-own', 'orders.create', 'orders.edit', 'orders.delete', 'orders.bulk'] },
  { key: 'customers', label: 'Müşteri', permissions: ['customers.view', 'customers.note'] },
  { key: 'content', label: 'İçerik / Ürün', permissions: ['content.view', 'content.edit-product', 'content.create-product', 'content.delete-product', 'content.edit-swatch', 'content.edit-hero'] },
  { key: 'materials', label: 'Hammadde + Stok', permissions: ['materials.view', 'materials.edit', 'materials.delete', 'stock.view', 'stock.edit'] },
  { key: 'cash', label: 'Kasa', permissions: ['cash.open', 'cash.close', 'cash.movement'] },
  { key: 'shipping', label: 'Kargo + Entegrasyon', permissions: ['shipping.create', 'shipping.track', 'integrations.view', 'integrations.edit', 'integrations.mapping'] },
  { key: 'admin', label: 'Yönetim', permissions: ['users.view', 'users.manage', 'reports.view', 'reports.export', 'audit.view', 'templates.edit'] },
]

export const PERMISSION_LABELS: Record<Permission, string> = {
  'orders.view': 'Tüm siparişleri gör',
  'orders.view-own': 'Sadece kendi siparişlerini gör',
  'orders.create': 'Sipariş oluştur',
  'orders.edit': 'Sipariş düzenle',
  'orders.delete': 'Sipariş sil/iptal',
  'orders.bulk': 'Toplu işlem',
  'customers.view': 'Müşteri listesi',
  'customers.note': 'Müşteri notu',
  'content.view': 'İçerik görüntüle',
  'content.edit-product': 'Ürün düzenle',
  'content.create-product': 'Ürün ekle',
  'content.delete-product': 'Ürün sil',
  'content.edit-swatch': 'Konfigüratör swatch',
  'content.edit-hero': 'Ana sayfa hero',
  'materials.view': 'Hammadde görüntüle',
  'materials.edit': 'Hammadde düzenle',
  'materials.delete': 'Hammadde sil',
  'stock.view': 'Stok görüntüle',
  'stock.edit': 'Stok düzenle',
  'cash.open': 'Kasa aç',
  'cash.close': 'Kasa kapat',
  'cash.movement': 'Kasa hareketi',
  'shipping.create': 'Kargo barkodu',
  'shipping.track': 'Kargo takip',
  'integrations.view': 'Entegrasyon görüntüle',
  'integrations.edit': 'Entegrasyon düzenle',
  'integrations.mapping': 'Ürün eşleştirme',
  'users.view': 'Personel listesi',
  'users.manage': 'Personel yönetim',
  'reports.view': 'Rapor görüntüle',
  'reports.export': 'Rapor indir',
  'audit.view': 'Denetim kayıtları',
  'templates.edit': 'Mesaj şablonları',
}

/** Preset roller — tek tıkla uygula */
export const ROLE_PRESETS: Record<string, { label: string; permissions: Permission[] }> = {
  patron: {
    label: 'Patron (Tüm yetki)',
    permissions: ALL_PERMISSIONS, // gerçekte '*' kullanılır ama UI için tüm liste
  },
  workshop_chief: {
    label: 'Atölye Şefi',
    permissions: [
      'orders.view', 'orders.create', 'orders.edit', 'orders.bulk',
      'materials.view', 'materials.edit', 'stock.view', 'stock.edit',
      'customers.view', 'shipping.create', 'shipping.track',
      'content.view', 'reports.view',
    ],
  },
  shop_staff: {
    label: 'Mağaza Çalışanı',
    permissions: [
      'orders.view-own', 'orders.create',
      'customers.view',
      'cash.open', 'cash.close', 'cash.movement',
      'shipping.create',
    ],
  },
  order_only: {
    label: 'Sadece Sipariş',
    permissions: ['orders.view-own', 'orders.create', 'customers.view'],
  },
  read_only: {
    label: 'Salt Okur (Denetçi)',
    permissions: [
      'orders.view', 'customers.view', 'content.view', 'materials.view',
      'stock.view', 'integrations.view', 'reports.view', 'audit.view',
    ],
  },
}

/** Verilen permission'lara sahip mi kontrol et. Patron '*' her şeye sahip. */
export function hasPermission(userPerms: string[] | undefined, perm: Permission): boolean {
  if (!userPerms) return false
  if (userPerms.includes('*')) return true
  return userPerms.includes(perm)
}

/** Role default permissions — `permissions` boşsa kullanılır */
export function defaultPermissionsForRole(role: 'patron' | 'staff'): Permission[] {
  if (role === 'patron') return ALL_PERMISSIONS
  return ROLE_PRESETS.order_only.permissions
}
