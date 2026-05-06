import { useState } from 'preact/hooks'
import { formatTRY, formatDateTime } from '../../lib/format'
import type { Order, OrderStatus } from '../../server/db'

const PRODUCTION_STEPS: { value: OrderStatus; label: string }[] = [
  { value: 'received', label: 'Sipariş Alındı' },
  { value: 'payment_confirmed', label: 'Ödeme Onaylandı' },
  { value: 'production_started', label: 'Kalıp Hazırlanıyor' },
  { value: 'production_cutting', label: 'Kesim' },
  { value: 'production_sewing', label: 'Dikim & Montaj' },
  { value: 'quality_check', label: 'Kalite Kontrol' },
  { value: 'shipped', label: 'Kargoya Verildi' },
  { value: 'delivered', label: 'Teslim Edildi' },
  { value: 'cancelled', label: 'İptal Edildi' },
]

export default function OrderEditor({ initial }: { initial: Order }) {
  const [order, setOrder] = useState<Order>(initial)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const trackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/siparis-takip/detay?t=${order.accessToken}`

  async function patch(body: Record<string, any>) {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/orders/${order.orderNo}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setOrder(updated)
    } catch (e: any) {
      setError(e.message ?? 'Hata')
    } finally {
      setSaving(false)
    }
  }

  function copyTrack() {
    navigator.clipboard?.writeText(trackUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div class="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)] gap-6">
      <div class="space-y-6">
        {/* Üst banner */}
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div class="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] font-semibold">
                Sipariş No
              </div>
              <div class="font-mono text-xl font-semibold">{order.orderNo}</div>
              <div class="text-xs text-[var(--color-text-muted)] mt-0.5">
                {formatDateTime(order.createdAt)}
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button
                onClick={copyTrack}
                class="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
              >
                {copied ? '✓ Kopyalandı' : 'Takip linki kopyala'}
              </button>
              <a
                href={trackUrl}
                target="_blank"
                rel="noopener"
                class="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
              >
                Müşteri görünümü ↗
              </a>
            </div>
          </div>
        </div>

        {/* Üretim durumu */}
        <Section title="Üretim Durumu">
          <div class="grid sm:grid-cols-2 gap-3">
            <select
              value={order.productionStatus}
              onChange={(e) => patch({ productionStatus: (e.target as HTMLSelectElement).value })}
              disabled={saving}
              class={inp}
            >
              {PRODUCTION_STEPS.map((s) => (
                <option value={s.value}>{s.label}</option>
              ))}
            </select>
            {order.productionStatus !== 'cancelled' && (
              <button
                onClick={() => {
                  const idx = PRODUCTION_STEPS.findIndex((s) => s.value === order.productionStatus)
                  const next = PRODUCTION_STEPS[idx + 1]
                  if (next && next.value !== 'cancelled') patch({ productionStatus: next.value })
                }}
                disabled={saving || order.productionStatus === 'delivered'}
                class="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] disabled:opacity-30"
              >
                Bir sonraki aşamaya geç →
              </button>
            )}
          </div>

          {/* Kargo bilgisi */}
          {(order.productionStatus === 'shipped' || order.productionStatus === 'delivered') && (
            <div class="mt-4 grid sm:grid-cols-2 gap-3">
              <Field label="Kargo Firma">
                <select
                  value={order.cargoCompany ?? ''}
                  onChange={(e) => patch({ cargoCompany: (e.target as HTMLSelectElement).value })}
                  class={inp}
                >
                  <option value="">Seçin...</option>
                  <option value="yurtici">Yurtiçi Kargo</option>
                  <option value="aras">Aras Kargo</option>
                  <option value="mng">MNG Kargo</option>
                  <option value="ptt">PTT Kargo</option>
                  <option value="surat">Sürat Kargo</option>
                </select>
              </Field>
              <Field label="Takip Numarası">
                <input
                  defaultValue={order.cargoTrackingNo ?? ''}
                  onBlur={(e) => patch({ cargoTrackingNo: (e.target as HTMLInputElement).value })}
                  placeholder="Kargo takip no"
                  class={inp}
                />
              </Field>
            </div>
          )}
        </Section>

        {/* Ödeme durumu */}
        <Section title="Ödeme Durumu">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Ödeme Durumu">
              <select
                value={order.paymentStatus}
                onChange={(e) => patch({ paymentStatus: (e.target as HTMLSelectElement).value })}
                class={inp}
              >
                <option value="bekliyor">Beklemede</option>
                <option value="kismi">Kısmi</option>
                <option value="tamamlandi">Tamamlandı</option>
                <option value="iade">İade Edildi</option>
              </select>
            </Field>
            <Field label="Tahsil Edilen (₺)">
              <input
                type="number"
                defaultValue={order.paidAmount}
                onBlur={(e) => patch({ paidAmount: parseFloat((e.target as HTMLInputElement).value) || 0 })}
                class={inp}
              />
            </Field>
            <Field label="Ödeme Yöntemi" class="sm:col-span-2">
              <select
                value={order.paymentMethod}
                onChange={(e) => patch({ paymentMethod: (e.target as HTMLSelectElement).value })}
                class={inp}
              >
                <option value="havale">Banka Havalesi / EFT</option>
                <option value="kapida">Kapıda</option>
                <option value="nakit">Nakit</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Ürünler */}
        <Section title="Sipariş İçeriği">
          <div class="space-y-3">
            {order.items.map((i) => (
              <div class="flex items-start gap-3 p-3 rounded-xl bg-[var(--color-surface-2)]">
                <div class="size-16 shrink-0 rounded-lg overflow-hidden ring-1 ring-[var(--color-border)] relative">
                  <img src={i.borderSwatchUrl} alt="" class="absolute inset-0 size-full object-cover" />
                  <div class="absolute inset-[14%] rounded-sm overflow-hidden">
                    <img src={i.matSwatchUrl} alt="" class="size-full object-cover" />
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm">
                    {i.brandName} {i.modelName} {i.modelChassis}
                  </div>
                  <div class="text-xs text-[var(--color-text-muted)] mt-0.5">{i.productName}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mt-1">
                    {i.matName} · {i.borderName} · {i.heelName}
                    {i.heelPadPassenger ? ' (yolcu+sürücü)' : ''}
                    {i.logoBrandSlug ? ` · ${i.brandName} amblem ×${i.logoQty}` : ''}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold tabular-nums">{formatTRY(i.unitPrice * i.qty)}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)]">×{i.qty}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Notlar */}
        <Section title="Atölye İç Notu">
          <textarea
            defaultValue={order.internalNote ?? ''}
            onBlur={(e) => patch({ internalNote: (e.target as HTMLTextAreaElement).value })}
            rows={3}
            placeholder="Sadece atölye görür"
            class={`${inp} resize-none`}
          ></textarea>
        </Section>

        {error && <p class="text-sm text-[var(--color-danger)]">{error}</p>}
        {saving && <p class="text-xs text-[var(--color-text-muted)]">Kaydediliyor...</p>}
      </div>

      <aside class="space-y-4">
        {/* Müşteri */}
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold mb-3">Müşteri</h3>
          <div class="space-y-1.5 text-sm">
            <div class="font-medium">{order.customer.fullName}</div>
            <a href={`tel:${order.customer.phone}`} class="block text-[var(--color-text-soft)] hover:text-[var(--color-primary)]">
              {order.customer.phone}
            </a>
            {order.customer.email && (
              <a href={`mailto:${order.customer.email}`} class="block text-[var(--color-text-soft)] hover:text-[var(--color-primary)]">
                {order.customer.email}
              </a>
            )}
            <a
              href={`https://wa.me/${order.customer.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener"
              class="block mt-3 text-center px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-success)]/40 text-[var(--color-success)] hover:bg-[var(--color-success)]/10"
            >
              💬 WhatsApp ile mesaj gönder
            </a>
          </div>
        </div>

        {/* Adres */}
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold mb-3">Teslimat</h3>
          <div class="text-sm text-[var(--color-text-soft)]">
            <div class="font-medium text-[var(--color-text)]">{order.shippingAddress.fullName}</div>
            <div class="text-xs text-[var(--color-text-muted)] mt-0.5">{order.shippingAddress.phone}</div>
            <div class="mt-2">
              {order.shippingAddress.addressLine}
              <br />
              {order.shippingAddress.district} / {order.shippingAddress.city}
            </div>
          </div>
        </div>

        {/* Toplam */}
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold mb-3">Tutar</h3>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-[var(--color-text-muted)]">Toplam</dt>
              <dd class="tabular-nums font-semibold">{formatTRY(order.total)}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-[var(--color-text-muted)]">Tahsil edilen</dt>
              <dd class="tabular-nums text-[var(--color-success)]">{formatTRY(order.paidAmount)}</dd>
            </div>
            <div class="flex justify-between pt-2 border-t border-[var(--color-border)]/60 text-base font-semibold">
              <dt>Bakiye</dt>
              <dd class={`tabular-nums ${order.total - order.paidAmount === 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                {formatTRY(order.total - order.paidAmount)}
              </dd>
            </div>
          </dl>
        </div>

        {/* Olay geçmişi */}
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold mb-3">Olay Geçmişi</h3>
          <ol class="space-y-2 text-xs">
            {order.events.slice().reverse().map((e) => {
              const label = PRODUCTION_STEPS.find((s) => s.value === e.status)?.label ?? e.status
              return (
                <li class="flex gap-2 pb-2 border-b border-[var(--color-border)]/30 last:border-0">
                  <span class="text-[var(--color-text-muted)]">{formatDateTime(e.at)}</span>
                  <span class="font-medium">{label}</span>
                </li>
              )
            })}
          </ol>
        </div>
      </aside>
    </div>
  )
}

const inp =
  'w-full px-3 py-2 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm'

function Section({ title, children }: { title: string; children: any }) {
  return (
    <section class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
      <h2 class="font-display text-base font-semibold mb-4">{title}</h2>
      {children}
    </section>
  )
}

function Field({ label, class: cls, children }: { label: string; class?: string; children: any }) {
  return (
    <label class={cls ?? ''}>
      <div class="text-xs font-medium mb-1 text-[var(--color-text-soft)]">{label}</div>
      {children}
    </label>
  )
}
