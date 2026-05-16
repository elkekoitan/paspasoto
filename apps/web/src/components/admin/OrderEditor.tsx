import { useState, useEffect } from 'preact/hooks'
import { formatTRY, formatDateTime } from '../../lib/format'
import { buildProductionStartedWaUrl, buildReadyWaUrl } from '../../lib/whatsapp'
import type { Order, OrderStatus } from '../../server/db'
import type { MessageTemplate, TemplateKey } from '../../lib/template-types'
import { renderTemplate, TEMPLATE_META } from '../../lib/template-types'
import { PRODUCTION_STEPS as MAT_PRODUCTION_STEPS, isStepRelevant, type ProductionStepKey } from '../../lib/production-steps'

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
  const [shipping, setShipping] = useState(false)
  const [shippingMsg, setShippingMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [notifyOpen, setNotifyOpen] = useState(false)

  async function createShipment() {
    if (!confirm(`Kargo barkodu oluşturulsun mu?\n\nSipariş: ${order.orderNo}\nAlıcı: ${order.shippingAddress.fullName}\n${order.shippingAddress.city} / ${order.shippingAddress.district}`)) return
    setShipping(true)
    setShippingMsg(null)
    try {
      const res = await fetch('/api/shipping/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo: order.orderNo }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.status === 503) {
        setShippingMsg({ kind: 'err', text: `Kargo entegrasyonu yapılandırılmamış (${data.provider ?? 'bilinmiyor'}). Coolify env değişkenlerini ekleyin.` })
        return
      }
      if (!res.ok || data.status !== 'ok') {
        setShippingMsg({ kind: 'err', text: data.message ?? data.error ?? `Hata (${res.status})` })
        return
      }
      setShippingMsg({ kind: 'ok', text: `✓ Barkod oluşturuldu: ${data.trackingNumber} (${data.provider})` })
      // Sunucu zaten Order'ı güncelledi; biz de UI'da senkronize edelim
      const refreshed = await fetch(`/api/orders/${order.orderNo}`).then((r) => r.json()).catch(() => null)
      if (refreshed) setOrder(refreshed)
    } catch (e: any) {
      setShippingMsg({ kind: 'err', text: e?.message ?? 'Bağlantı hatası' })
    } finally {
      setShipping(false)
    }
  }

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
              <a
                href={`/admin/orders/${order.orderNo}/fatura`}
                target="_blank"
                rel="noopener"
                class="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-border)]/60 text-[var(--color-text)] inline-flex items-center gap-1.5"
                title="Fatura yazdır / PDF olarak kaydet"
              >
                📄 Fatura
              </a>
              <a
                href={`/admin/orders/${order.orderNo}/etiket`}
                target="_blank"
                rel="noopener"
                class="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--color-surface-2)] hover:bg-[var(--color-border)]/60 text-[var(--color-text)] inline-flex items-center gap-1.5"
                title="Kargo etiketi yazdır"
              >
                🏷 Etiket
              </a>
              <button
                onClick={copyTrack}
                class="px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-text-muted)]"
              >
                {copied ? '✓ Kopyalandı' : '🔗 Takip linki'}
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

              {/* WhatsApp ile takip linki — sipariş üretimde veya sonraki adımlarda görünür */}
              {(order.productionStatus === 'in_production' || order.productionStatus === 'ready') && order.customer.phone && (
                <a
                  href={
                    order.productionStatus === 'ready'
                      ? buildReadyWaUrl(order)
                      : buildProductionStartedWaUrl(order)
                  }
                  target="_blank"
                  rel="noopener"
                  class="mt-2 flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.16 5.335 5.495 0 12.05 0c3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414 0 6.557-5.336 11.892-11.893 11.892-1.99 0-3.951-.5-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                  </svg>
                  <span>
                    {order.productionStatus === 'ready'
                      ? '📲 Hazır — WhatsApp ile Müşteriye Bildir'
                      : '📲 Üretime Alındı — WhatsApp ile Takip Linki Gönder'}
                  </span>
                </a>
              )}

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
            <div class="mt-4 space-y-3">
              <div class="grid sm:grid-cols-2 gap-3">
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

              {/* Otomatik kargo barkodu butonu */}
              <div class="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3 flex flex-wrap items-center justify-between gap-3">
                <div class="text-xs">
                  <div class="font-semibold">Otomatik Kargo Barkodu</div>
                  <div class="text-[var(--color-text-muted)] mt-0.5">
                    Yapılandırılmış kargo sağlayıcısı üzerinden anında tracking no üretir.
                  </div>
                </div>
                <button
                  type="button"
                  disabled={shipping}
                  onClick={createShipment}
                  class="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {shipping ? 'Oluşturuluyor…' : (order.cargoTrackingNo ? '↻ Yeniden Oluştur' : '📦 Kargo Barkodu Oluştur')}
                </button>
              </div>
              {shippingMsg && (
                <div class={[
                  'text-xs px-3 py-2 rounded-lg border',
                  shippingMsg.kind === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                    : 'bg-red-500/10 border-red-500/40 text-red-300',
                ].join(' ')}>
                  {shippingMsg.text}
                </div>
              )}
            </div>
          )}
          {(order.deliveryMethod === 'pickup') && order.productionStatus === 'ready' && (
            <div class="mt-4 p-3 rounded-lg bg-[var(--color-primary-soft)]/40 border border-[var(--color-primary)]/30 text-xs">
              📍 Müşteri atölyeye gelip teslim alacak. Hazır olduğu için müşteri takip ekranında bilgilendirme görüntüleniyor.
            </div>
          )}
        </Section>

        {/* Üretim Aşamaları — sadece paspas siparişleri (mat) için */}
        {order.items[0]?.category === 'mat' && order.productionStatus !== 'cancelled' && (
          <ProductionStepsSection
            order={order}
            onUpdate={setOrder}
          />
        )}

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
                <option value="iyzico">Online Kart (iyzico)</option>
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

          {/* İade akışı — paymentStatus='iade' iken not + onay */}
          {order.paymentStatus === 'iade' && (
            <div class="mt-4 p-4 rounded-xl border border-red-500/40 bg-red-500/5 space-y-3">
              <div class="flex items-start gap-2">
                <span class="text-lg">↩</span>
                <div>
                  <div class="font-semibold text-sm text-red-300">İade Kaydı</div>
                  <div class="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    Bu sipariş "iade" olarak işaretlendi. iyzico ödemesi varsa iyzico panelden refund'u manuel olarak da işlemeniz gerekir (otomatik refund henüz yok).
                  </div>
                </div>
              </div>
              <Field label="İade Notu (atölye için)">
                <textarea
                  defaultValue={order.internalNote ?? ''}
                  onBlur={(e) => patch({ internalNote: (e.target as HTMLTextAreaElement).value })}
                  rows={2}
                  placeholder="İade nedeni, müşteriyle yapılan görüşme..."
                  class={`${inp} resize-none`}
                />
              </Field>
              {order.paymentMethod === 'iyzico' && (
                <a
                  href="https://merchant.iyzipay.com/transaction"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 text-xs font-medium text-red-300 hover:text-red-200"
                >
                  → iyzico panelinde refund işle
                </a>
              )}
            </div>
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

        {/* Üretim Reçetesi — atölyenin ustasına yazdırılabilir özet */}
        <Section title="Üretim Reçetesi">
          <ProductionRecipe order={order} />
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
            {(order.shippingAddress as any)?.geo && (
              <div class="mt-2 text-[10px] text-[var(--color-primary)] flex items-center gap-1">
                <span>📍</span>
                <span>Konum işaretli ({((order.shippingAddress as any).geo.lat).toFixed(5)}, {((order.shippingAddress as any).geo.lng).toFixed(5)})</span>
              </div>
            )}
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <a
              href={(order.shippingAddress as any)?.geo
                ? `https://www.google.com/maps?q=${(order.shippingAddress as any).geo.lat},${(order.shippingAddress as any).geo.lng}`
                : `https://www.google.com/maps?q=${encodeURIComponent(
                    `${order.shippingAddress.addressLine}, ${order.shippingAddress.district}, ${order.shippingAddress.city}`,
                  )}`}
              target="_blank"
              rel="noopener"
              class="text-center px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              🗺 Haritada Göster
            </a>
            <a
              href={(order.shippingAddress as any)?.geo
                ? `https://www.google.com/maps/dir/?api=1&destination=${(order.shippingAddress as any).geo.lat},${(order.shippingAddress as any).geo.lng}`
                : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    `${order.shippingAddress.addressLine}, ${order.shippingAddress.district}, ${order.shippingAddress.city}`,
                  )}`}
              target="_blank"
              rel="noopener"
              class="text-center px-3 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              🚗 Yol Tarifi
            </a>
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

        {/* Müşteri bildirim */}
        <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h3 class="font-display text-base font-semibold mb-3">📨 Müşteri Bildirim</h3>
          <button
            type="button"
            onClick={() => setNotifyOpen(true)}
            class="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40"
          >
            📱 WhatsApp / E-posta Şablonu Seç
          </button>
          <p class="text-[10px] text-[var(--color-text-muted)] mt-2 leading-relaxed">
            Hazır şablonlardan birini seçip kişiselleştirilmiş halini gönderin.
          </p>
        </div>

        {/* Notlar (thread) */}
        <NotesPanel
          orderNo={order.orderNo}
          notes={order.notes ?? []}
          onUpdate={(notes) => setOrder({ ...order, notes })}
        />

        {notifyOpen && (
          <NotifyModal
            order={order}
            onClose={() => setNotifyOpen(false)}
            onSent={(template, channel) => {
              setNotifyOpen(false)
            }}
          />
        )}

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

const PLACEMENT_LABEL_TR: Record<string, string> = {
  'top-left': 'Üst Sol',
  'top-center': 'Üst Orta',
  'top-right': 'Üst Sağ',
  'middle-left': 'Orta Sol',
  'middle-center': 'Orta',
  'middle-right': 'Orta Sağ',
  'bottom-left': 'Alt Sol',
  'bottom-center': 'Alt Orta',
  'bottom-right': 'Alt Sağ',
  top: 'Üst',
  middle: 'Orta',
  bottom: 'Alt',
}

const POSITION_LABEL_TR: Record<string, string> = {
  driver: 'Sürücü',
  passenger: 'Yolcu',
  leftRear: 'Sol Arka',
  rightRear: 'Sağ Arka',
  trunk: 'Bagaj',
}

function ProductionRecipe({ order }: { order: Order }) {
  const [open, setOpen] = useState(false)
  const i = order.items[0] as Record<string, any> | undefined
  if (!i) return null

  const heelPos = i.heelPosition === 'both'
    ? 'Sürücü + Yolcu'
    : i.heelPosition === 'driver-only'
      ? 'Sürücü'
      : i.heelPosition === 'passenger-only'
        ? 'Yolcu'
        : i.heelPosition === 'none'
          ? 'İstemiyor'
          : (i.heelPadPassenger ? 'Sürücü + Yolcu' : 'Sürücü')

  const logos: Array<{ position: string; brandSlug: string | null; placement: string }> =
    Array.isArray(i.logos) ? i.logos.filter((l: any) => l && l.brandSlug) : []

  function print() {
    if (typeof window === 'undefined') return
    const w = window.open('', '_blank', 'width=800,height=900')
    if (!w) return
    w.document.write(`<!doctype html><meta charset="utf-8"><title>Üretim Reçetesi · ${order.orderNo}</title>
<style>
  body { font: 14px -apple-system, Segoe UI, sans-serif; padding: 32px; color: #111; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th, td { text-align: left; padding: 8px 12px; border-bottom: 1px solid #eee; vertical-align: top; }
  th { background: #f7f7f7; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #555; width: 30%; }
  td { font-weight: 500; }
  .footer { margin-top: 32px; font-size: 11px; color: #999; }
  @media print { body { padding: 16px; } }
</style>
<h1>Üretim Reçetesi</h1>
<div class="meta">Sipariş #${order.orderNo} · ${new Date(order.createdAt).toLocaleString('tr-TR')}</div>
<table>
  <tr><th>Müşteri</th><td>${order.customer.fullName} · ${order.customer.phone}</td></tr>
  <tr><th>Araç</th><td>${i.brandName ?? ''} ${i.modelName ?? ''} ${i.modelChassis ?? ''}</td></tr>
  <tr><th>Set Tipi</th><td>${i.productName ?? ''} (${i.productParts ?? '?'} parça)</td></tr>
  <tr><th>Mat Rengi</th><td>${i.matName ?? ''}</td></tr>
  <tr><th>Kenarlık</th><td>${i.borderName ?? ''}</td></tr>
  <tr><th>Topukluk</th><td>${i.heelName ?? '-'} · ${heelPos}</td></tr>
  <tr><th>Logo</th><td>${
    logos.length === 0
      ? 'Yok'
      : logos.map((l) => `${POSITION_LABEL_TR[l.position] ?? l.position}: ${l.brandSlug} (${PLACEMENT_LABEL_TR[l.placement] ?? l.placement})`).join('<br>')
  }</td></tr>
  ${i.trimName ? `<tr><th>Donanım</th><td>${i.trimName} · ${i.trimEngine ?? ''} · ${i.trimFuel ?? ''} · ${i.trimTransmission ?? ''}</td></tr>` : ''}
  <tr><th>Adres</th><td>${order.shippingAddress.addressLine}<br>${order.shippingAddress.district} / ${order.shippingAddress.city}</td></tr>
</table>
<div class="footer">Carmat — Fevzi Çakmak Mah. 10733. Sk. No: 1, Karatay / Konya · ${new Date().toLocaleDateString('tr-TR')}</div>
<script>window.print()</script>`)
    w.document.close()
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        class="w-full flex items-center justify-between gap-2 text-left text-sm font-medium text-[var(--color-text-soft)] hover:text-[var(--color-text)]"
      >
        <span>{open ? '▾' : '▸'} Reçeteyi {open ? 'gizle' : 'aç'}</span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); print() }}
          class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90"
        >
          Yazdır
        </button>
      </button>

      {open && (
        <dl class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Row label="Araç" value={`${i.brandName ?? ''} ${i.modelName ?? ''} ${i.modelChassis ?? ''}`} />
          <Row label="Set" value={`${i.productName ?? ''} · ${i.productParts ?? '?'} parça`} />
          <Row label="Mat Rengi" value={i.matName ?? '-'} />
          <Row label="Kenarlık" value={i.borderName ?? '-'} />
          <Row label="Topukluk" value={`${i.heelName ?? '-'} · ${heelPos}`} />
          <Row
            label="Logo"
            value={
              logos.length === 0
                ? 'Yok'
                : logos
                    .map((l) => `${POSITION_LABEL_TR[l.position] ?? l.position} → ${l.brandSlug} (${PLACEMENT_LABEL_TR[l.placement] ?? l.placement})`)
                    .join(', ')
            }
          />
          {i.trimName && <Row label="Donanım" value={`${i.trimName} · ${i.trimEngine ?? ''} ${i.trimFuel ?? ''} ${i.trimTransmission ?? ''}`} />}
          {i.previewUrl && (
            <div class="col-span-full mt-2">
              <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold mb-1.5">
                Konfigüratör Önizleme
              </div>
              <img
                src={i.previewUrl}
                alt="Tasarım önizleme"
                class="max-w-sm rounded-lg border border-[var(--color-border)]/60"
                loading="lazy"
              />
            </div>
          )}
        </dl>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-bold">{label}</dt>
      <dd class="font-medium">{value}</dd>
    </div>
  )
}

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

/* ---------------- Notes Panel ---------------- */

interface OrderNote {
  id: string
  kind: 'internal' | 'customer-visible'
  body: string
  by: string
  at: number
}

function NotesPanel({ orderNo, notes, onUpdate }: { orderNo: string; notes: OrderNote[]; onUpdate: (n: OrderNote[]) => void }) {
  const [open, setOpen] = useState(true)
  const [kind, setKind] = useState<'internal' | 'customer-visible'>('internal')
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)

  async function addNote() {
    const text = body.trim()
    if (!text) return
    setSaving(true)
    const res = await fetch(`/api/orders/${orderNo}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, body: text }),
    })
    setSaving(false)
    if (res.ok) {
      const note = await res.json()
      onUpdate([...notes, note])
      setBody('')
    }
  }

  async function removeNote(id: string) {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/orders/${orderNo}/notes?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) onUpdate(notes.filter((n) => n.id !== id))
  }

  const sorted = [...notes].sort((a, b) => b.at - a.at)

  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
      <button type="button" onClick={() => setOpen(!open)} class="w-full flex items-center justify-between gap-2 text-left">
        <h3 class="font-display text-base font-semibold flex items-center gap-2">
          💬 Notlar
          {notes.length > 0 && (
            <span class="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold">
              {notes.length}
            </span>
          )}
        </h3>
        <span class="text-xs text-[var(--color-text-muted)]">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div class="mt-3 space-y-3">
          <div class="rounded-lg bg-[var(--color-surface-2)]/40 p-3 space-y-2">
            <div class="flex gap-2">
              <button
                type="button"
                onClick={() => setKind('internal')}
                class={[
                  'px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors',
                  kind === 'internal'
                    ? 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
                ].join(' ')}
              >
                🔒 İç Not
              </button>
              <button
                type="button"
                onClick={() => setKind('customer-visible')}
                class={[
                  'px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors',
                  kind === 'customer-visible'
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]',
                ].join(' ')}
              >
                👁 Müşteri Görür
              </button>
            </div>
            <textarea
              value={body}
              onInput={(e) => setBody((e.target as HTMLTextAreaElement).value)}
              placeholder={kind === 'internal' ? 'İç not (sadece personel görür)…' : 'Müşteri görecek bir mesaj yaz…'}
              rows={2}
              class="w-full px-2.5 py-1.5 rounded-md bg-[var(--color-surface)] border border-[var(--color-border)] text-xs resize-none"
            />
            <button
              type="button"
              onClick={addNote}
              disabled={saving || !body.trim()}
              class="w-full px-3 py-1.5 rounded-md bg-[var(--color-primary)] text-black text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Kaydediliyor…' : '+ Not Ekle'}
            </button>
          </div>

          {sorted.length === 0 ? (
            <p class="text-xs text-[var(--color-text-muted)] text-center py-3">Henüz not yok.</p>
          ) : (
            <ul class="space-y-2">
              {sorted.map((n) => (
                <li
                  class={[
                    'rounded-lg p-2.5 text-xs',
                    n.kind === 'customer-visible'
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-amber-500/10 border border-amber-500/30',
                  ].join(' ')}
                >
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class={[
                      'text-[9px] font-bold uppercase tracking-wider',
                      n.kind === 'customer-visible' ? 'text-emerald-300' : 'text-amber-300',
                    ].join(' ')}>
                      {n.kind === 'customer-visible' ? '👁 Müşteri Görür' : '🔒 İç Not'}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeNote(n.id)}
                      class="text-[10px] text-[var(--color-text-muted)] hover:text-red-400"
                      title="Sil"
                    >
                      ✕
                    </button>
                  </div>
                  <p class="whitespace-pre-wrap break-words leading-relaxed">{n.body}</p>
                  <div class="mt-1.5 text-[10px] text-[var(--color-text-muted)]">
                    {n.by} · {formatDateTime(n.at)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/* ---------------- Notify Modal ---------------- */

function NotifyModal({ order, onClose, onSent }: { order: Order; onClose: () => void; onSent: (template: TemplateKey, channel: 'whatsapp' | 'email') => void }) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [selectedKey, setSelectedKey] = useState<TemplateKey | ''>('')
  const [channel, setChannel] = useState<'whatsapp' | 'email'>('whatsapp')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/templates')
      .then((r) => r.json())
      .then((data: MessageTemplate[]) => {
        setTemplates(data)
        // Mevcut productionStatus'a göre önerilen şablonu otomatik seç
        const statusToKey: Record<string, TemplateKey> = {
          received: 'order_received',
          in_production: 'production_started',
          ready: order.deliveryMethod === 'pickup' ? 'ready_pickup' : 'ready_cargo',
          delivered: 'delivered',
        }
        const suggested = statusToKey[order.productionStatus]
        if (suggested) setSelectedKey(suggested)
        else if (data[0]) setSelectedKey(data[0].key)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const selected = templates.find((t) => t.key === selectedKey)

  const vars: Record<string, string> = {
    customerName: order.customer.fullName.split(' ')[0] ?? order.customer.fullName,
    orderNo: order.orderNo,
    trackingNo: order.cargoTrackingNo ?? '—',
    total: formatTRY(order.total).replace(/\s/g, ' '),
    shippingCity: order.shippingAddress.city,
    brand: order.items[0]?.brandName ?? '',
    model: order.items[0]?.modelName ?? '',
  }

  const previewText = selected
    ? channel === 'whatsapp'
      ? renderTemplate(selected.variants.whatsapp ?? '', vars)
      : renderTemplate(selected.variants.email?.body ?? '', vars)
    : ''

  function sendNow() {
    if (!selected) return
    const phone = order.customer.phone.replace(/\D/g, '')
    if (channel === 'whatsapp') {
      const url = `https://wa.me/${phone.startsWith('0') ? '9' + phone : phone}?text=${encodeURIComponent(previewText)}`
      window.open(url, '_blank')
    } else {
      const subject = renderTemplate(selected.variants.email?.subject ?? '', vars)
      const body = previewText
      window.location.href = `mailto:${order.customer.email ?? ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }

    // Audit: order events'e bildirim eklemek opsiyonel (PATCH ile event push)
    fetch(`/api/orders/${order.orderNo}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'internal',
        body: `📨 ${selected.label} bildirimi (${channel}) gönderildi → ${order.customer.fullName}`,
      }),
    }).catch(() => {})

    onSent(selected.key, channel)
  }

  const recommendedKey = order.productionStatus === 'ready' && order.deliveryMethod === 'cargo' ? 'ready_cargo' :
    order.productionStatus === 'ready' && order.deliveryMethod === 'pickup' ? 'ready_pickup' :
    order.productionStatus === 'in_production' ? 'production_started' :
    order.productionStatus === 'received' ? 'order_received' :
    order.productionStatus === 'delivered' ? 'delivered' : null

  return (
    <div class="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div class="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div class="p-5 border-b border-[var(--color-border)]/60 flex items-center justify-between gap-3">
          <div>
            <h2 class="font-display text-lg font-bold">📨 Müşteriye Bildirim</h2>
            <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
              {order.customer.fullName} · {order.customer.phone}
            </p>
          </div>
          <button onClick={onClose} class="size-9 grid place-items-center rounded-lg hover:bg-[var(--color-surface-2)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {loading ? (
          <div class="p-8 text-center text-[var(--color-text-muted)]">Şablonlar yükleniyor…</div>
        ) : (
          <div class="p-5 space-y-4">
            {/* Şablon seç */}
            <div>
              <div class="text-xs font-medium mb-2 text-[var(--color-text-soft)]">Şablon</div>
              <div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {templates.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setSelectedKey(t.key)}
                    class={[
                      'text-left p-2.5 rounded-lg border transition-colors text-xs',
                      selectedKey === t.key
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/40'
                        : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
                    ].join(' ')}
                  >
                    <div class="font-semibold flex items-center gap-1">
                      {t.label}
                      {recommendedKey === t.key && <span class="text-[8px] px-1 rounded bg-emerald-500/30 text-emerald-300">ÖNERİLEN</span>}
                    </div>
                    <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5">{t.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Kanal seç */}
            <div>
              <div class="text-xs font-medium mb-2 text-[var(--color-text-soft)]">Kanal</div>
              <div class="flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('whatsapp')}
                  class={[
                    'flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    channel === 'whatsapp'
                      ? 'bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/40'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                  ].join(' ')}
                >
                  💬 WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  disabled={!order.customer.email}
                  class={[
                    'flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                    channel === 'email'
                      ? 'bg-blue-500/20 text-blue-300 ring-2 ring-blue-500/40'
                      : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                    !order.customer.email && 'opacity-40 cursor-not-allowed',
                  ].join(' ')}
                >
                  ✉ E-posta {!order.customer.email && '(yok)'}
                </button>
              </div>
            </div>

            {/* Önizleme */}
            {selected && (
              <div>
                <div class="text-xs font-medium mb-2 text-[var(--color-text-soft)]">Mesaj Önizleme</div>
                <div class="rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] p-3 text-sm whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {previewText}
                </div>
                <p class="text-[10px] text-[var(--color-text-muted)] mt-1">Yer tutucular doldurulmuş halidir. Şablonu düzenlemek için <a href="/admin/sablonlar" class="underline">sablon yönetimi</a>'na gidin.</p>
              </div>
            )}

            {/* Gönder */}
            <button
              type="button"
              onClick={sendNow}
              disabled={!selected || (channel === 'email' && !order.customer.email)}
              class="w-full px-5 py-3 rounded-lg bg-[var(--color-primary)] text-black font-bold text-sm disabled:opacity-50"
            >
              {channel === 'whatsapp' ? '💬 WhatsApp\'ta Aç ve Gönder' : '✉ E-posta İstemcisini Aç'}
            </button>
            <p class="text-[10px] text-[var(--color-text-muted)] text-center">
              Hazır mesaj yeni sekmede açılır, son onay sizde. Bildirim "iç not" olarak siparişe işlenir.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------------- Production Steps Section ---------------- */

function ProductionStepsSection({ order, onUpdate }: { order: Order; onUpdate: (o: Order) => void }) {
  const [saving, setSaving] = useState<ProductionStepKey | null>(null)
  const it = order.items[0]
  const hasLogo = !!(it?.logoBrandSlug)
  const hasHeel = !!(it?.heelSlug && it.heelSlug !== '-')

  const relevant = MAT_PRODUCTION_STEPS.filter((s) => isStepRelevant(s.key, hasLogo, hasHeel))
  const stepsByKey = new Map((order.productionSteps ?? []).map((s) => [s.step, s]))

  async function toggleStep(step: ProductionStepKey) {
    const current = stepsByKey.get(step)
    const wasComplete = !!current?.completedAt
    setSaving(step)
    try {
      const res = await fetch(`/api/orders/${order.orderNo}/production-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step, completed: !wasComplete }),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
      }
    } finally {
      setSaving(null)
    }
  }

  const completedCount = relevant.filter((s) => stepsByKey.get(s.key)?.completedAt).length
  const totalCount = relevant.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div class="mb-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 overflow-hidden">
      <div class="p-5 border-b border-[var(--color-border)]/40">
        <div class="flex items-center justify-between gap-3">
          <h3 class="font-display text-base font-semibold">🔨 Üretim Aşamaları</h3>
          <span class={[
            'text-xs font-bold tabular-nums px-2 py-0.5 rounded-full',
            percent === 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
          ].join(' ')}>
            {completedCount}/{totalCount} · %{percent}
          </span>
        </div>
        <div class="mt-2 h-1.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-[var(--color-primary)] to-emerald-500 transition-all duration-300"
            style={`width: ${percent}%`}
          ></div>
        </div>
      </div>
      <ol class="divide-y divide-[var(--color-border)]/30">
        {relevant.map((step, idx) => {
          const state = stepsByKey.get(step.key)
          const done = !!state?.completedAt
          const isLoading = saving === step.key
          return (
            <li class={['p-3 md:p-4 flex items-center gap-3 hover:bg-[var(--color-surface-2)]/40 transition-colors', done && 'bg-emerald-500/5'].filter(Boolean).join(' ')}>
              <button
                type="button"
                onClick={() => toggleStep(step.key)}
                disabled={isLoading}
                class={[
                  'size-9 rounded-full grid place-items-center font-bold text-sm transition-all shrink-0',
                  done ? 'bg-emerald-500 text-white' : 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:bg-[var(--color-primary-soft)]',
                  isLoading && 'opacity-50',
                ].join(' ')}
                title={done ? 'Geri al' : 'Tamamlandı işaretle'}
              >
                {isLoading ? '…' : done ? '✓' : idx + 1}
              </button>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-base">{step.emoji}</span>
                  <span class={['font-semibold text-sm', done && 'text-emerald-300 line-through opacity-80'].filter(Boolean).join(' ')}>
                    {step.label}
                  </span>
                </div>
                <div class="text-[11px] text-[var(--color-text-muted)] mt-0.5">{step.description}</div>
                {done && state && (
                  <div class="text-[10px] text-emerald-400 mt-1">
                    ✓ {state.completedBy} · {formatDateTime(state.completedAt!)}
                  </div>
                )}
              </div>
            </li>
          )
        })}
      </ol>
      {percent === 100 && (
        <div class="p-3 bg-emerald-500/10 border-t border-emerald-500/30 text-xs text-emerald-300 font-semibold">
          ✓ Tüm üretim aşamaları tamamlandı. Sipariş otomatik "Hazır" durumuna geçti.
          {order.deliveryMethod === 'cargo' && !order.cargoTrackingNo && (
            <span> Kargo barkodu oluşturmak için yukarıdaki butonu kullanın.</span>
          )}
        </div>
      )}
    </div>
  )
}
