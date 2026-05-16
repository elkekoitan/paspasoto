/**
 * CashRegisterPanel — Açık kasa için ana UI.
 *  - Kapalıysa: "Kasa Aç" formu (opening balance)
 *  - Açıksa: balans + hareketler + "+ Yeni Hareket" + "Kasa Kapat" butonu
 */
import { useState } from 'preact/hooks'
import { formatTRY, formatDateTime } from '../../lib/format'

interface CashSession {
  id: string
  openedBy: string
  openedAt: number
  openingBalance: number
  closedBy?: string
  closedAt?: number
  countedBalance?: number
  expectedBalance?: number
  diff?: number
  movements: CashMovement[]
  note?: string
}

interface CashMovement {
  id: string
  type: 'sale' | 'expense' | 'withdrawal' | 'deposit' | 'refund'
  amount: number
  reason: string
  orderNo?: string
  by: string
  at: number
}

const TYPE_META: Record<CashMovement['type'], { label: string; emoji: string; sign: '+' | '-'; class: string }> = {
  sale: { label: 'Satış', emoji: '💰', sign: '+', class: 'text-emerald-300' },
  deposit: { label: 'Yatırma', emoji: '⬇', sign: '+', class: 'text-emerald-300' },
  refund: { label: 'İade Geri', emoji: '↺', sign: '+', class: 'text-blue-300' },
  expense: { label: 'Gider', emoji: '🛒', sign: '-', class: 'text-amber-300' },
  withdrawal: { label: 'Çekme', emoji: '⬆', sign: '-', class: 'text-red-300' },
}

interface Props {
  initialOpen: { session: CashSession; expectedBalance: number } | null
  currentUser: string
}

export default function CashRegisterPanel({ initialOpen, currentUser }: Props) {
  const [state, setState] = useState(initialOpen)

  if (!state) {
    return <OpenSessionForm onOpened={(s) => setState({ session: s, expectedBalance: s.openingBalance })} />
  }

  return (
    <ActiveSessionView
      session={state.session}
      expectedBalance={state.expectedBalance}
      currentUser={currentUser}
      onUpdate={(s) => {
        // expectedBalance yeniden hesaplanır client-side
        let bal = s.openingBalance
        for (const m of s.movements) {
          if (m.type === 'sale' || m.type === 'deposit' || m.type === 'refund') bal += m.amount
          else if (m.type === 'expense' || m.type === 'withdrawal') bal -= m.amount
        }
        setState({ session: s, expectedBalance: bal })
      }}
      onClosed={() => setState(null)}
    />
  )
}

function OpenSessionForm({ onOpened }: { onOpened: (s: CashSession) => void }) {
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setSubmitting(true)
    setErr(null)
    const res = await fetch('/api/admin/cash/open', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ openingBalance, note: note || undefined }),
    })
    setSubmitting(false)
    if (res.ok) {
      const s = await res.json()
      onOpened(s)
    } else {
      const data = await res.json().catch(() => ({}))
      setErr(data?.error ?? 'Kasa açılamadı')
    }
  }

  return (
    <div class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-6 md:p-8 max-w-md mx-auto text-center">
      <div class="text-5xl mb-3">🔒</div>
      <h2 class="font-display text-xl font-bold mb-2">Kasa Kapalı</h2>
      <p class="text-sm text-[var(--color-text-muted)] mb-6">Bugünkü kasayı açmak için açılış tutarını girin.</p>

      <div class="space-y-3 text-left">
        <label class="block">
          <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">Açılış Tutarı (₺)</div>
          <input
            type="number"
            step="0.01"
            value={openingBalance}
            onInput={(e) => setOpeningBalance(parseFloat((e.target as HTMLInputElement).value) || 0)}
            class="w-full px-4 py-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-lg font-bold tabular-nums text-center"
            autoFocus
          />
        </label>
        <label class="block">
          <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">Not (opsiyonel)</div>
          <input
            type="text"
            value={note}
            onInput={(e) => setNote((e.target as HTMLInputElement).value)}
            placeholder="örn: 'Patron 200 TL bıraktı'"
            class="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm"
          />
        </label>
      </div>

      {err && <div class="mt-3 text-xs text-red-400">{err}</div>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        class="mt-6 w-full px-5 py-3 rounded-xl bg-[var(--color-primary)] text-black font-bold disabled:opacity-50"
      >
        {submitting ? 'Açılıyor…' : '🔓 Kasayı Aç'}
      </button>
    </div>
  )
}

function ActiveSessionView({ session, expectedBalance, currentUser, onUpdate, onClosed }: {
  session: CashSession
  expectedBalance: number
  currentUser: string
  onUpdate: (s: CashSession) => void
  onClosed: () => void
}) {
  const [showMov, setShowMov] = useState(false)
  const [showClose, setShowClose] = useState(false)

  const movements = [...session.movements].sort((a, b) => b.at - a.at)
  const totals = session.movements.reduce(
    (acc, m) => {
      if (m.type === 'sale') acc.sale += m.amount
      else if (m.type === 'expense') acc.expense += m.amount
      else if (m.type === 'withdrawal') acc.withdrawal += m.amount
      else if (m.type === 'deposit') acc.deposit += m.amount
      else if (m.type === 'refund') acc.refund += m.amount
      return acc
    },
    { sale: 0, expense: 0, withdrawal: 0, deposit: 0, refund: 0 },
  )

  return (
    <div class="space-y-5">
      {/* Üst kart */}
      <div class="rounded-2xl bg-gradient-to-br from-emerald-500/10 to-[var(--color-surface)] border border-emerald-500/30 p-5 md:p-6">
        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div class="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold">🔓 Açık Kasa</div>
            <div class="mt-2 font-display text-4xl md:text-5xl font-bold tabular-nums">{formatTRY(expectedBalance)}</div>
            <div class="text-xs text-[var(--color-text-muted)] mt-1">
              {session.openedBy} açtı · {formatDateTime(session.openedAt)} · Açılış: {formatTRY(session.openingBalance)}
            </div>
          </div>
          <div class="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => setShowMov(true)}
              class="px-5 py-2.5 rounded-xl bg-[var(--color-surface)] hover:bg-[var(--color-border)]/60 border border-[var(--color-border)] text-sm font-semibold"
            >
              + Hareket Ekle
            </button>
            <button
              type="button"
              onClick={() => setShowClose(true)}
              class="px-5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40 text-sm font-semibold"
            >
              🔒 Kasayı Kapat
            </button>
          </div>
        </div>

        {/* Hareket toplamları */}
        <div class="mt-5 grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
          {[
            { k: 'sale', label: '💰 Satış', val: totals.sale, color: 'text-emerald-400' },
            { k: 'deposit', label: '⬇ Yatırma', val: totals.deposit, color: 'text-emerald-400' },
            { k: 'expense', label: '🛒 Gider', val: totals.expense, color: 'text-amber-400' },
            { k: 'withdrawal', label: '⬆ Çekme', val: totals.withdrawal, color: 'text-red-400' },
            { k: 'refund', label: '↺ İade', val: totals.refund, color: 'text-blue-400' },
          ].map((c) => (
            <div class="p-2 rounded-lg bg-[var(--color-surface)]/60">
              <div class="text-[10px] text-[var(--color-text-muted)]">{c.label}</div>
              <div class={`mt-0.5 font-bold tabular-nums ${c.color}`}>{formatTRY(c.val)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Hareketler tablosu */}
      <section class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 overflow-hidden">
        <header class="px-5 py-3 border-b border-[var(--color-border)]/60 flex items-center justify-between">
          <h3 class="font-semibold text-sm">Hareketler ({movements.length})</h3>
        </header>
        {movements.length === 0 ? (
          <div class="p-8 text-center text-[var(--color-text-muted)] text-sm">
            Bu kasada henüz hareket yok.<br/>
            Elden satışlar otomatik gelir; manuel hareket için yukarıdan "Hareket Ekle".
          </div>
        ) : (
          <ul class="divide-y divide-[var(--color-border)]/30">
            {movements.map((m) => {
              const meta = TYPE_META[m.type]
              return (
                <li class="p-3 flex items-center gap-3">
                  <span class="text-xl shrink-0">{meta.emoji}</span>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-medium">{m.reason}</div>
                    <div class="text-[10px] text-[var(--color-text-muted)] flex items-center gap-2 mt-0.5">
                      <span>{meta.label}</span>
                      {m.orderNo && <a href={`/admin/orders/${m.orderNo}`} class="text-[var(--color-primary)] font-mono">{m.orderNo}</a>}
                      <span>· {m.by}</span>
                      <span>· {formatDateTime(m.at)}</span>
                    </div>
                  </div>
                  <span class={`font-bold tabular-nums shrink-0 ${meta.class}`}>
                    {meta.sign}{formatTRY(m.amount)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {showMov && (
        <MovementModal
          onClose={() => setShowMov(false)}
          onAdded={(updated) => { onUpdate(updated); setShowMov(false) }}
        />
      )}
      {showClose && (
        <CloseSessionModal
          expectedBalance={expectedBalance}
          onClose={() => setShowClose(false)}
          onClosed={() => { onClosed(); setShowClose(false) }}
        />
      )}
    </div>
  )
}

function MovementModal({ onClose, onAdded }: { onClose: () => void; onAdded: (s: CashSession) => void }) {
  const [type, setType] = useState<'expense' | 'withdrawal' | 'deposit' | 'refund'>('expense')
  const [amount, setAmount] = useState<number>(0)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    if (!reason.trim() || amount <= 0) { setErr('Tutar ve sebep zorunlu'); return }
    setSubmitting(true)
    setErr(null)
    const res = await fetch('/api/admin/cash/movement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, amount, reason: reason.trim() }),
    })
    setSubmitting(false)
    if (res.ok) onAdded(await res.json())
    else { const d = await res.json().catch(() => ({})); setErr(d?.error ?? 'Hata') }
  }

  return (
    <div class="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div class="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h2 class="font-display text-lg font-bold mb-4">+ Yeni Hareket</h2>
        <div class="space-y-3">
          <div>
            <div class="text-xs font-medium mb-2 text-[var(--color-text-soft)]">Tip</div>
            <div class="grid grid-cols-2 gap-2">
              {[
                { v: 'expense', label: '🛒 Gider', sub: 'Sarf, hammadde, vb.' },
                { v: 'withdrawal', label: '⬆ Çekme', sub: 'Patron çekti' },
                { v: 'deposit', label: '⬇ Yatırma', sub: 'Para eklendi' },
                { v: 'refund', label: '↺ İade Geri', sub: 'İade alındı' },
              ].map((opt) => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setType(opt.v as any)}
                  class={[
                    'p-3 rounded-lg border text-left transition-colors',
                    type === opt.v ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]',
                  ].join(' ')}
                >
                  <div class="font-semibold text-sm">{opt.label}</div>
                  <div class="text-[10px] text-[var(--color-text-muted)] mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>
          <label class="block">
            <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">Tutar (₺)</div>
            <input
              type="number" step="0.01" value={amount}
              onInput={(e) => setAmount(parseFloat((e.target as HTMLInputElement).value) || 0)}
              class="w-full px-4 py-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-lg font-bold tabular-nums text-center"
              autoFocus
            />
          </label>
          <label class="block">
            <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">Sebep</div>
            <input
              type="text" value={reason}
              onInput={(e) => setReason((e.target as HTMLInputElement).value)}
              placeholder="örn: 'Tedarikçi avansı', 'Yemek parası'"
              class="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm"
            />
          </label>
        </div>
        {err && <div class="mt-3 text-xs text-red-400">{err}</div>}
        <div class="mt-5 flex gap-2 justify-end">
          <button type="button" onClick={onClose} class="px-4 py-2 rounded-lg text-xs font-medium hover:bg-[var(--color-surface-2)]">İptal</button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !reason.trim() || amount <= 0}
            class="px-5 py-2 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-black disabled:opacity-50"
          >
            {submitting ? '...' : 'Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CloseSessionModal({ expectedBalance, onClose, onClosed }: { expectedBalance: number; onClose: () => void; onClosed: () => void }) {
  const [counted, setCounted] = useState<number>(expectedBalance)
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const diff = counted - expectedBalance

  async function submit() {
    setSubmitting(true)
    setErr(null)
    const res = await fetch('/api/admin/cash/close', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ countedBalance: counted, note: note || undefined }),
    })
    setSubmitting(false)
    if (res.ok) onClosed()
    else { const d = await res.json().catch(() => ({})); setErr(d?.error ?? 'Hata') }
  }

  return (
    <div class="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div class="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h2 class="font-display text-lg font-bold mb-2">🔒 Kasayı Kapat</h2>
        <p class="text-xs text-[var(--color-text-muted)] mb-4">Fiziki sayım sonrası kasada bulunan tutarı girin.</p>

        <div class="mb-3 p-3 rounded-lg bg-[var(--color-surface-2)]">
          <div class="text-[10px] uppercase text-[var(--color-text-muted)] font-semibold">Sistem Beklediği</div>
          <div class="text-xl font-bold tabular-nums mt-0.5">{formatTRY(expectedBalance)}</div>
        </div>

        <label class="block">
          <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">Fiziki Sayım (₺)</div>
          <input
            type="number" step="0.01" value={counted}
            onInput={(e) => setCounted(parseFloat((e.target as HTMLInputElement).value) || 0)}
            class="w-full px-4 py-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-2xl font-bold tabular-nums text-center"
            autoFocus
          />
        </label>

        {counted > 0 && (
          <div class={[
            'mt-3 p-3 rounded-lg text-sm font-bold text-center',
            diff === 0 ? 'bg-emerald-500/15 text-emerald-300' :
            diff > 0 ? 'bg-blue-500/15 text-blue-300' :
            'bg-red-500/15 text-red-300',
          ].join(' ')}>
            {diff === 0 ? '✓ Tam — fark yok' : diff > 0 ? `+${formatTRY(diff)} fazla` : `−${formatTRY(Math.abs(diff))} eksik`}
          </div>
        )}

        <label class="block mt-3">
          <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">Not (opsiyonel)</div>
          <textarea
            value={note}
            onInput={(e) => setNote((e.target as HTMLTextAreaElement).value)}
            rows={2}
            placeholder="Fark varsa açıklama"
            class="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-sm resize-none"
          />
        </label>

        {err && <div class="mt-3 text-xs text-red-400">{err}</div>}

        <div class="mt-5 flex gap-2 justify-end">
          <button type="button" onClick={onClose} class="px-4 py-2 rounded-lg text-xs font-medium hover:bg-[var(--color-surface-2)]">İptal</button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            class="px-5 py-2 rounded-lg text-xs font-bold bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/40 disabled:opacity-50"
          >
            {submitting ? '...' : '🔒 Kasayı Kapat'}
          </button>
        </div>
      </div>
    </div>
  )
}
