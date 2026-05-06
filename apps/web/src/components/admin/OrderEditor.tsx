import { useState } from 'preact/hooks'
import { formatTRY, formatDateTime } from '../../lib/format'
import type { Order, OrderStatus } from '../../server/db'

const PRODUCTION_STEPS: { value: OrderStatus; label: string }[] = [
  { value: 'received', label: 'Sipariş Alındı' },
  { value: 'in_production', label: 'Üretimde' },
  { value: 'ready', label: 'Hazır' },
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
        <div class={[
          'rounded-2xl border p-5 transition-colors',
          order.productionStatus === 'delivered'
            ? 'bg-gradient-to-br from-emerald-500/15 to-[var(--color-surface)] border-emerald-500/40'
            : order.productionStatus === 'cancelled'
            ? 'bg-gradient-to-br from-red-500/15 to-[var(--color-surface)] border-red-500/40'
            : 'bg-[var(--color-surface)] border-[var(--color-border)]/60',
        ].join(' ')}>
          <div class="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div class="text-[10px] uppercase tracking-[0.2em] font-semibold flex items-center gap-2">
                <span class={order.productionStatus === 'delivered' ? 'text-emerald-400' : order.productionStatus === 'cancelled' ? 'text-red-400' : 'text-[var(--color-text-muted)]'}>
                  Sipariş No
                </span>
                {order.kind === 'quote' && (
                  <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500 text-black">Ön Talep</span>
                )}
                {order.productionStatus === 'delivered' && (
                  <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500 text-white">✓ Tamamlandı</span>
                )}
                {order.productionStatus === 'cancelled' && (
                  <span class="px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-red-500 text-white">İptal</span>
                )}
              </div>
              <div class="font-mono text-xl font-semibold mt-0.5">{order.orderNo}</div>
              <div class="text-xs text-[var(--color-text-muted)] mt-0.5">
                {formatDateTime(order.createdAt)}
                {order.deliveredAt && order.productionStatus === 'delivered' && (
                  <span class="ml-2 text-emerald-400">· Teslim: {formatDateTime(order.deliveredAt)}</span>
                )}
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
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
        <Section title="Sipariş Durumu">
          {order.productionStatus === 'delivered' ? (
            <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
              <div class="size-10 rounded-full bg-emerald-500 grid place-items-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
              <div class="flex-1">
                <div class="font-semibold text-emerald-400">Sipariş Tamamlandı</div>
                <div class="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {order.deliveredAt ? formatDateTime(order.deliveredAt) : 'Müşteri teslim aldı'}
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Sipariş durumunu geri al? (Tamamlandı → Hazır)')) patch({ productionStatus: 'ready' })
                }}
                class="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] self-center"
              >
                Geri Al
              </button>
            </div>
          ) : order.productionStatus === 'cancelled' ? (
            <div class="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <div class="size-10 rounded-full bg-red-500 grid place-items-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </div>
              <div class="flex-1">
                <div class="font-semibold text-red-400">Sipariş İptal Edildi</div>
              </div>
              <button
                onClick={() => { if (confirm('İptal kaldırılsın mı?')) patch({ productionStatus: 'received' }) }}
                class="px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] self-center"
              >
                Geri Al
              </button>
            </div>
          ) : (
            <>
              <div class="grid sm:grid-cols-[1fr_auto] gap-3 items-center">
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
                <button
                  onClick={() => {
                    const idx = PRODUCTION_STEPS.findIndex((s) => s.value === order.productionStatus)
                    const next = PRODUCTION_STEPS[idx + 1]
                    if (next && next.value !== 'cancelled') patch({ productionStatus: next.value })
                  }}
                  disabled={saving}
                  class="px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-bg)] disabled:opacity-30 whitespace-nowrap"
                >
                  Durumu İlerlet →
                </button>
              </div>

              {/* Hazır durumdaysa "Tamamlandı olarak işaretle" hızlı butonu */}
              {order.productionStatus === 'ready' && (
                <button
                  onClick={() => {
                    if (confirm('Sipariş tamamlandı olarak işaretlensin mi? (Müşteriye teslim edildi)')) {
                      patch({ productionStatus: 'delivered' })
                    }
                  }}
                  disabled={saving}
                  class="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 text-white transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  Sipariş Tamamlandı Olarak İşaretle
                </button>
              )}
            </>
          )}

          {/* Teslimat Yöntemi */}
          <div class="mt-4">
            <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold mb-2">Teslimat Yöntemi</div>
            <div class="grid grid-cols-2 gap-2">
              {([
                { v: 'cargo', label: 'Kargo ile Gönder', icon: '📦', desc: 'Kargoya verilecek' },
                { v: 'pickup', label: 'Dükkandan Teslim', icon: '🏪', desc: 'Müşteri gelecek' },
              ] as const).map((opt) => {
                const active = (order.deliveryMethod ?? 'cargo') === opt.v
                return (
                  <button
                    type="button"
                    onClick={() => patch({ deliveryMethod: opt.v })}
                    class={[
                      'p-3 rounded-lg border text-left transition-all',
                      active
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]'
                        : 'border-[var(--color-border)]/60 bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)]',
                    ].join(' ')}
                  >
                    <div class="flex items-center gap-2">
                      <span class="text-xl">{opt.icon}</span>
                      <div>
                        <div class="font-semibold text-sm">{opt.label}</div>
                        <div class="text-[10px] text-[var(--color-text-muted)]">{opt.desc}</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Kargo bilgisi (sadece kargo ile gönderim) */}
          {(order.deliveryMethod ?? 'cargo') === 'cargo' && (order.productionStatus === 'ready' || order.productionStatus === 'delivered') && (
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
          {(order.deliveryMethod === 'pickup') && order.productionStatus === 'ready' && (
            <div class="mt-4 p-3 rounded-lg bg-[var(--color-primary-soft)]/40 border border-[var(--color-primary)]/30 text-xs">
              📍 Müşteri atölyeye gelip teslim alacak. Hazır olduğu için müşteri takip ekranında bilgilendirme görüntüleniyor.
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
                <option value="elden-nakit">Elden — Nakit</option>
                <option value="elden-kart">Elden — Kredi Kartı (POS)</option>
                <option value="havale">Banka Havalesi / EFT</option>
                <option value="kapida">Kapıda</option>
                <option value="sonra">Sonra Ödenecek</option>
                <option value="taksit">Parçalı / Taksit</option>
              </select>
            </Field>
          </div>

          {/* Taksit / Parçalı tahsilat planı */}
          {order.paymentMethod === 'taksit' && (
            <InstallmentManager
              order={order}
              onUpdate={(installments) => patch({ paymentInstallments: installments })}
            />
          )}
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
            {(order.subtotal ?? order.total) !== order.total && (
              <div class="flex justify-between">
                <dt class="text-[var(--color-text-muted)]">Ara Toplam</dt>
                <dd class="tabular-nums">{formatTRY(order.subtotal ?? order.total)}</dd>
              </div>
            )}
            {order.discount && order.discount > 0 ? (
              <div class="flex justify-between text-[var(--color-warning)]">
                <dt>İndirim</dt>
                <dd class="tabular-nums">−{formatTRY(order.discount)}</dd>
              </div>
            ) : null}
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

/* -------- Taksit Yöneticisi -------- */
function InstallmentManager({
  order,
  onUpdate,
}: {
  order: Order
  onUpdate: (list: any[]) => void | Promise<void>
}) {
  const list = order.paymentInstallments ?? []
  const planned = list.reduce((s, i) => s + (i.amount || 0), 0)
  const collected = list.filter((i) => i.status === 'odendi').reduce((s, i) => s + (i.amount || 0), 0)

  function add() {
    const remaining = Math.max(0, order.total - planned)
    const due = new Date()
    due.setMonth(due.getMonth() + list.length + 1)
    const next = [
      ...list,
      {
        id: `inst-${Date.now()}`,
        dueAt: due.getTime(),
        amount: Math.round(remaining / 2) || 0,
        method: 'havale',
        status: 'planlandi',
      },
    ]
    onUpdate(next)
  }
  function update(idx: number, patch: any) {
    const next = list.map((it, i) => (i === idx ? { ...it, ...patch } : it))
    onUpdate(next)
  }
  function remove(idx: number) {
    onUpdate(list.filter((_, i) => i !== idx))
  }

  return (
    <div class="mt-4 pt-4 border-t border-[var(--color-border)]/60">
      <div class="flex items-center justify-between mb-3">
        <div>
          <h4 class="text-sm font-semibold">Taksit Planı</h4>
          <p class="text-[10px] text-[var(--color-text-muted)] mt-0.5">
            Toplam {formatTRY(order.total)} · Planlandı {formatTRY(planned)} · Tahsil {formatTRY(collected)}
          </p>
        </div>
        <button onClick={add} class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-[var(--color-bg)] hover:bg-[var(--color-primary-hover)]">
          + Taksit
        </button>
      </div>
      {list.length === 0 ? (
        <p class="text-xs text-[var(--color-text-muted)] py-3 text-center">Henüz taksit planlanmadı.</p>
      ) : (
        <div class="space-y-2">
          {list.map((it, idx) => (
            <div class="grid grid-cols-[110px_1fr_120px_120px_auto] gap-2 items-center text-xs">
              <input
                type="date"
                value={new Date(it.dueAt).toISOString().slice(0, 10)}
                onBlur={(e) => update(idx, { dueAt: new Date((e.target as HTMLInputElement).value).getTime() })}
                class={inp}
              />
              <input
                type="number"
                min="0"
                defaultValue={it.amount}
                onBlur={(e) => update(idx, { amount: parseFloat((e.target as HTMLInputElement).value) || 0 })}
                class={inp}
              />
              <select value={it.method} onChange={(e) => update(idx, { method: (e.target as HTMLSelectElement).value })} class={inp}>
                <option value="elden-nakit">Nakit</option>
                <option value="elden-kart">POS</option>
                <option value="havale">Havale</option>
              </select>
              <select value={it.status} onChange={(e) => update(idx, { status: (e.target as HTMLSelectElement).value, paidAt: (e.target as HTMLSelectElement).value === 'odendi' ? Date.now() : undefined })} class={inp}>
                <option value="planlandi">Planlandı</option>
                <option value="odendi">Ödendi</option>
                <option value="gecikti">Gecikti</option>
                <option value="iptal">İptal</option>
              </select>
              <button onClick={() => remove(idx)} class="px-2 py-1.5 rounded-lg text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10" title="Sil">
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
