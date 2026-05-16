/**
 * PersonnelEditor — Personel detay sayfası (3 tab: Kişisel + İş + Yetkiler)
 */
import { useState } from 'preact/hooks'
import ImageUploadField from './ImageUploadField'
import {
  ALL_PERMISSIONS, PERMISSION_GROUPS, PERMISSION_LABELS, ROLE_PRESETS,
  defaultPermissionsForRole, type Permission,
} from '../../lib/permissions'

interface UserDetail {
  id: string
  username: string
  displayName: string
  role: 'patron' | 'staff'
  active: boolean
  createdAt: number
  lastLoginAt?: number
  email?: string
  phone?: string
  avatar?: string
  position?: string
  startDate?: number
  birthDate?: number
  workingDays?: number[]
  monthlyTarget?: number
  commissionRate?: number
  permissions?: string[]
  internalNote?: string
}

type Tab = 'profile' | 'work' | 'permissions'

const DAYS = [
  { v: 1, label: 'Pzt' }, { v: 2, label: 'Sal' }, { v: 3, label: 'Çar' },
  { v: 4, label: 'Per' }, { v: 5, label: 'Cum' }, { v: 6, label: 'Cmt' },
  { v: 7, label: 'Paz' },
]

export default function PersonnelEditor({ initial }: { initial: UserDetail }) {
  const [tab, setTab] = useState<Tab>('profile')
  const [user, setUser] = useState<UserDetail>(initial)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const isPatron = user.role === 'patron'
  const effectivePerms = user.permissions ?? defaultPermissionsForRole(user.role)

  function update(patch: Partial<UserDetail>) {
    setUser((u) => ({ ...u, ...patch }))
  }

  async function save() {
    setSaving(true)
    setSaveMsg(null)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: user.username,
          displayName: user.displayName,
          email: user.email || null,
          phone: user.phone || null,
          avatar: user.avatar || null,
          position: user.position || null,
          startDate: user.startDate,
          birthDate: user.birthDate,
          workingDays: user.workingDays,
          monthlyTarget: user.monthlyTarget,
          commissionRate: user.commissionRate,
          permissions: user.permissions,
          internalNote: user.internalNote || null,
          active: user.active,
        }),
      })
      if (res.ok) {
        const updated = await res.json()
        setUser(updated)
        setSaveMsg({ kind: 'ok', text: '✓ Kaydedildi' })
      } else {
        const data = await res.json().catch(() => ({}))
        setSaveMsg({ kind: 'err', text: data?.error ?? 'Hata' })
      }
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(null), 3000)
    }
  }

  async function deleteUser() {
    if (isPatron) { alert('Patron hesabı silinemez'); return }
    if (!confirm(`${user.displayName} pasifleştirilsin mi? Veriler korunur ama personel sisteme giremez.`)) return
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
    if (res.ok) {
      window.location.href = '/admin/patron/personel'
    } else {
      alert('Pasifleştirilemedi')
    }
  }

  return (
    <div>
      <header class="mb-6 flex items-center gap-4 flex-wrap">
        <div class="size-20 rounded-full overflow-hidden ring-2 ring-[var(--color-border)] shrink-0 grid place-items-center bg-[var(--color-surface-2)]">
          {user.avatar ? (
            <img src={user.avatar} alt="" class="size-full object-cover" />
          ) : (
            <span class="text-3xl font-bold text-[var(--color-text-muted)]">
              {user.displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-xs uppercase tracking-[0.2em] text-[var(--color-primary)] font-semibold">
            {isPatron ? '👑 Patron' : '👤 Personel'}
          </p>
          <h1 class="mt-1 font-display text-2xl md:text-3xl font-bold">{user.displayName}</h1>
          <p class="text-sm text-[var(--color-text-soft)]">
            @{user.username}
            {user.position && <span class="ml-2 text-[var(--color-text-muted)]">· {user.position}</span>}
          </p>
        </div>
        <div class="text-right">
          <div class="text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] font-semibold">
            Durum
          </div>
          <span class={[
            'inline-block mt-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
            user.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300',
          ].join(' ')}>
            {user.active ? '✓ Aktif' : '✕ Pasif'}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div class="flex gap-2 mb-6 border-b border-[var(--color-border)]/60 overflow-x-auto">
        {[
          { key: 'profile', label: '👤 Kişisel Bilgi' },
          { key: 'work', label: '💼 İş Ayarları' },
          { key: 'permissions', label: '🔐 Yetkiler' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key as Tab)}
            class={[
              'px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap',
              tab === t.key
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <section class="space-y-4">
          <Field label="Foto (Avatar)">
            <ImageUploadField
              value={user.avatar ?? ''}
              onChange={(url) => update({ avatar: url })}
              aspect="square"
              previewSize={120}
            />
          </Field>
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Kullanıcı Adı *">
              <input type="text" value={user.username} onInput={(e) => update({ username: (e.target as HTMLInputElement).value })} class={inp} />
            </Field>
            <Field label="Ad Soyad *">
              <input type="text" value={user.displayName} onInput={(e) => update({ displayName: (e.target as HTMLInputElement).value })} class={inp} />
            </Field>
            <Field label="E-posta">
              <input type="email" value={user.email ?? ''} onInput={(e) => update({ email: (e.target as HTMLInputElement).value })} class={inp} />
            </Field>
            <Field label="Telefon">
              <input type="tel" value={user.phone ?? ''} onInput={(e) => update({ phone: (e.target as HTMLInputElement).value })} class={inp} />
            </Field>
            <Field label="Pozisyon">
              <input type="text" value={user.position ?? ''} onInput={(e) => update({ position: (e.target as HTMLInputElement).value })} placeholder="örn: Atölye Şefi, Kasiyer" class={inp} />
            </Field>
            <Field label="İşe Başlama Tarihi">
              <input
                type="date"
                value={user.startDate ? new Date(user.startDate).toISOString().slice(0, 10) : ''}
                onInput={(e) => update({ startDate: (e.target as HTMLInputElement).value ? new Date((e.target as HTMLInputElement).value).getTime() : undefined })}
                class={inp}
              />
            </Field>
            <Field label="Doğum Tarihi" class="sm:col-span-2">
              <input
                type="date"
                value={user.birthDate ? new Date(user.birthDate).toISOString().slice(0, 10) : ''}
                onInput={(e) => update({ birthDate: (e.target as HTMLInputElement).value ? new Date((e.target as HTMLInputElement).value).getTime() : undefined })}
                class={inp}
              />
            </Field>
          </div>
          <Field label="Çalışma Günleri">
            <div class="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const isOn = (user.workingDays ?? []).includes(d.v)
                return (
                  <button
                    key={d.v}
                    type="button"
                    onClick={() => {
                      const cur = user.workingDays ?? []
                      const next = isOn ? cur.filter((x) => x !== d.v) : [...cur, d.v].sort()
                      update({ workingDays: next })
                    }}
                    class={[
                      'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border',
                      isOn
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
                    ].join(' ')}
                  >
                    {d.label}
                  </button>
                )
              })}
            </div>
          </Field>
        </section>
      )}

      {tab === 'work' && (
        <section class="space-y-4">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Aylık Ciro Hedefi (₺)">
              <input type="number" value={user.monthlyTarget ?? ''} onInput={(e) => update({ monthlyTarget: parseFloat((e.target as HTMLInputElement).value) || undefined })} placeholder="örn: 25000" class={inp} />
            </Field>
            <Field label="Satış Komisyonu (%)">
              <input type="number" step="0.5" value={user.commissionRate ?? ''} onInput={(e) => update({ commissionRate: parseFloat((e.target as HTMLInputElement).value) || undefined })} placeholder="örn: 5" class={inp} />
            </Field>
          </div>
          <Field label="Aktif/Pasif Durumu">
            <label class="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={user.active} onChange={(e) => update({ active: (e.target as HTMLInputElement).checked })} class="size-4 accent-[var(--color-primary)]" />
              <span>Personel sisteme giriş yapabilir</span>
            </label>
          </Field>
          <Field label="İç Not (sadece patron görür)">
            <textarea value={user.internalNote ?? ''} onInput={(e) => update({ internalNote: (e.target as HTMLTextAreaElement).value })} rows={3} placeholder="İzin durumu, performans notları, vb." class={`${inp} resize-none`} />
          </Field>

          <div class="rounded-xl bg-[var(--color-surface-2)]/40 p-3 text-xs space-y-1 text-[var(--color-text-soft)]">
            <div><b>Oluşturulma:</b> {new Date(user.createdAt).toLocaleString('tr-TR')}</div>
            {user.lastLoginAt && <div><b>Son giriş:</b> {new Date(user.lastLoginAt).toLocaleString('tr-TR')}</div>}
          </div>
        </section>
      )}

      {tab === 'permissions' && (
        <section class="space-y-4">
          {isPatron ? (
            <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm">
              <strong>👑 Patron hesabı</strong> — tüm yetkilere sahiptir, değiştirilemez.
            </div>
          ) : (
            <>
              <div class="rounded-xl bg-[var(--color-surface-2)]/40 p-3">
                <div class="text-xs font-semibold mb-2">⚡ Hızlı Rol Şablonu</div>
                <div class="flex flex-wrap gap-2">
                  {Object.entries(ROLE_PRESETS).filter(([k]) => k !== 'patron').map(([k, preset]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => update({ permissions: preset.permissions as string[] })}
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-surface)] hover:bg-[var(--color-border)]/60 border border-[var(--color-border)]"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {PERMISSION_GROUPS.map((group) => (
                <div key={group.key} class="rounded-xl border border-[var(--color-border)]/60 bg-[var(--color-surface)] p-3">
                  <div class="flex items-center justify-between mb-2">
                    <h3 class="font-semibold text-sm">{group.label}</h3>
                    <div class="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const cur = new Set(user.permissions ?? [])
                          group.permissions.forEach((p) => cur.add(p))
                          update({ permissions: Array.from(cur) })
                        }}
                        class="px-2 py-0.5 rounded text-[10px] text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]"
                      >
                        Tümü
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const cur = new Set(user.permissions ?? [])
                          group.permissions.forEach((p) => cur.delete(p))
                          update({ permissions: Array.from(cur) })
                        }}
                        class="px-2 py-0.5 rounded text-[10px] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
                      >
                        Hiçbiri
                      </button>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {group.permissions.map((p) => {
                      const checked = effectivePerms.includes(p)
                      return (
                        <label key={p} class="flex items-center gap-2 text-xs cursor-pointer hover:bg-[var(--color-surface-2)]/50 rounded px-2 py-1">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const cur = new Set(user.permissions ?? [...effectivePerms])
                              if ((e.target as HTMLInputElement).checked) cur.add(p)
                              else cur.delete(p)
                              update({ permissions: Array.from(cur) })
                            }}
                            class="size-3.5 accent-[var(--color-primary)]"
                          />
                          <span class="font-mono text-[10px] text-[var(--color-text-muted)]">{p}</span>
                          <span class="text-[var(--color-text)]">{PERMISSION_LABELS[p as Permission]}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </section>
      )}

      {/* Footer — Save/Reset/Delete */}
      <div class="mt-8 pt-6 border-t border-[var(--color-border)]/60 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex gap-2">
          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40"
          >
            🔑 Şifre Sıfırla
          </button>
          {!isPatron && (
            <button
              type="button"
              onClick={deleteUser}
              class="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/40"
            >
              🗑 Pasifleştir
            </button>
          )}
        </div>
        <div class="flex items-center gap-3">
          {saveMsg && (
            <span class={['text-xs font-semibold', saveMsg.kind === 'ok' ? 'text-emerald-400' : 'text-red-400'].join(' ')}>
              {saveMsg.text}
            </span>
          )}
          <button
            type="button"
            onClick={save}
            disabled={saving}
            class="px-6 py-2.5 rounded-lg text-sm font-bold bg-[var(--color-primary)] text-black disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor…' : '💾 Kaydet'}
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <PasswordResetModal
          userId={user.id}
          displayName={user.displayName}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  )
}

function PasswordResetModal({ userId, displayName, onClose }: { userId: string; displayName: string; onClose: () => void }) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function validate(pwd: string): string | null {
    if (pwd.length < 8) return 'Şifre en az 8 karakter olmalı'
    if (!/[0-9]/.test(pwd)) return 'Şifre en az 1 sayı içermeli'
    if (!/[a-zA-Z]/.test(pwd)) return 'Şifre en az 1 harf içermeli'
    return null
  }

  async function submit() {
    const v = validate(password)
    if (v) { setErr(v); return }
    setSubmitting(true)
    setErr(null)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        alert(`✓ ${displayName} kullanıcısının şifresi güncellendi.\n\nYeni şifre: ${password}\n\nPersonelle paylaşın.`)
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        setErr(data?.error ?? 'Güncellenemedi')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div class="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm grid place-items-center p-4" onClick={onClose}>
      <div class="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()}>
        <h2 class="font-display text-lg font-bold mb-1">🔑 Şifre Sıfırla</h2>
        <p class="text-xs text-[var(--color-text-muted)] mb-4">
          <strong>{displayName}</strong> için yeni şifre belirleyin.
        </p>
        <input
          type="text"
          value={password}
          onInput={(e) => { setPassword((e.target as HTMLInputElement).value); setErr(null) }}
          placeholder="Min 8 karakter, 1 sayı, 1 harf"
          class="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-mono"
          autoFocus
        />
        {err && <div class="mt-2 text-[11px] text-red-400">{err}</div>}
        <p class="text-[10px] text-[var(--color-text-muted)] mt-2">
          Şifre güvenli kanaldan personele iletilmeli.
        </p>
        <div class="mt-4 flex gap-2 justify-end">
          <button type="button" onClick={onClose} class="px-4 py-2 rounded-lg text-xs font-medium hover:bg-[var(--color-surface-2)]">
            İptal
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !password}
            class="px-5 py-2 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-black disabled:opacity-50"
          >
            {submitting ? '...' : 'Güncelle'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-sm'

function Field({ label, class: cls, children }: { label: string; class?: string; children: any }) {
  return (
    <label class={cls ?? 'block'}>
      <div class="text-xs font-medium mb-1.5 text-[var(--color-text-soft)]">{label}</div>
      {children}
    </label>
  )
}
