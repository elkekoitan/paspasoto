/**
 * UserManager — Patron'un personel hesabı yönetimi.
 * Personel ekle, şifre değiştir, pasifleştir.
 */
import { useEffect, useState } from 'preact/hooks'

interface User {
  id: string
  username: string
  displayName: string
  role: 'patron' | 'staff'
  active: boolean
  createdAt: number
  lastLoginAt?: number
}

export default function UserManager() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  // Add form state
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (!res.ok) throw new Error('Liste alınamadı')
      setUsers(await res.json())
    } catch (e: any) {
      setError(e?.message ?? 'Hata')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: Event) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Kullanıcı adı ve şifre zorunlu')
      return
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          displayName: displayName.trim() || username.trim(),
          password,
          role: 'staff',
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Eklenemedi')
      }
      setUsername(''); setDisplayName(''); setPassword('')
      setShowAdd(false)
      load()
    } catch (e: any) {
      setError(e?.message ?? 'Hata')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    if (currentActive && !confirm('Bu personeli pasifleştirmek istediğinize emin misiniz?')) return
    try {
      if (currentActive) {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      } else {
        await fetch(`/api/admin/users/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: true }),
        })
      }
      load()
    } catch {}
  }

  async function handleResetPassword(id: string, name: string) {
    const newPwd = prompt(`${name} için yeni şifre (en az 6 karakter):`)
    if (!newPwd || newPwd.length < 6) {
      if (newPwd) alert('Şifre en az 6 karakter olmalı')
      return
    }
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPwd }),
      })
      if (res.ok) alert('Şifre güncellendi')
      else alert('Güncellenemedi')
    } catch {}
  }

  const staffUsers = users.filter((u) => u.role === 'staff')
  const patronUser = users.find((u) => u.role === 'patron')

  return (
    <div class="space-y-6">
      {/* Patron */}
      {patronUser && (
        <section class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
          <h2 class="font-display text-base font-semibold mb-3 flex items-center gap-2">
            👑 Patron
          </h2>
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="font-semibold">{patronUser.displayName}</div>
              <div class="text-xs text-[var(--color-text-muted)]">@{patronUser.username}</div>
            </div>
            <button
              type="button"
              onClick={() => handleResetPassword(patronUser.id, patronUser.displayName)}
              class="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-[var(--color-text)]"
            >
              Şifre değiştir
            </button>
          </div>
        </section>
      )}

      {/* Personel */}
      <section class="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/60 p-5">
        <header class="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <h2 class="font-display text-base font-semibold flex items-center gap-2">
              👥 Personel ({staffUsers.length})
            </h2>
            <p class="text-xs text-[var(--color-text-muted)] mt-0.5">
              Dükkân kasası kullanıcıları
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(!showAdd)}
            class="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary)]/90"
          >
            {showAdd ? '× Kapat' : '+ Yeni Personel'}
          </button>
        </header>

        {/* Ekleme formu */}
        {showAdd && (
          <form onSubmit={handleAdd} class="mb-4 p-4 rounded-xl bg-[var(--color-surface-2)] grid sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-medium mb-1 text-[var(--color-text-soft)]">Kullanıcı Adı *</label>
              <input
                type="text"
                value={username}
                onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
                placeholder="ali"
                class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
                required
              />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-[var(--color-text-soft)]">Ad Soyad</label>
              <input
                type="text"
                value={displayName}
                onInput={(e) => setDisplayName((e.target as HTMLInputElement).value)}
                placeholder="Ali Yılmaz"
                class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
              />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1 text-[var(--color-text-soft)]">Şifre *</label>
              <input
                type="text"
                value={password}
                onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                placeholder="min 6 karakter"
                class="w-full px-3 py-2 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-sm"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              class="sm:col-span-3 px-4 py-2.5 rounded-lg bg-[var(--color-primary)] text-black font-semibold text-sm disabled:opacity-50"
            >
              {submitting ? 'Ekleniyor...' : 'Personeli Ekle'}
            </button>
          </form>
        )}

        {error && (
          <div class="mb-3 p-3 rounded-lg bg-[var(--color-danger)]/15 border border-[var(--color-danger)]/40 text-sm text-[var(--color-danger)]">
            {error}
          </div>
        )}

        {loading ? (
          <p class="text-sm text-[var(--color-text-muted)]">Yükleniyor...</p>
        ) : staffUsers.length === 0 ? (
          <p class="text-sm text-[var(--color-text-muted)] text-center py-4">
            Henüz personel eklenmedi. + Yeni Personel butonu ile başlayın.
          </p>
        ) : (
          <ul class="space-y-2">
            {staffUsers.map((u) => (
              <li class={`flex items-center justify-between gap-3 p-3 rounded-xl ${u.active ? 'bg-[var(--color-surface-2)]' : 'bg-[var(--color-surface-2)]/40 opacity-60'}`}>
                <div class="flex items-center gap-3 min-w-0">
                  <div class={`size-10 rounded-full grid place-items-center ${u.active ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]'}`}>
                    {u.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div class="min-w-0">
                    <div class="font-semibold text-sm truncate">
                      {u.displayName}
                      {!u.active && <span class="ml-2 text-[10px] text-[var(--color-text-muted)] font-normal">(pasif)</span>}
                    </div>
                    <div class="text-[11px] text-[var(--color-text-muted)]">
                      @{u.username}
                      {u.lastLoginAt && ` · son giriş: ${new Date(u.lastLoginAt).toLocaleDateString('tr-TR')}`}
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleResetPassword(u.id, u.displayName)}
                    class="px-3 py-1.5 rounded-lg text-[11px] bg-[var(--color-surface)] hover:bg-[var(--color-border)] text-[var(--color-text-soft)]"
                  >
                    Şifre
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(u.id, u.active)}
                    class={`px-3 py-1.5 rounded-lg text-[11px] font-medium ${u.active ? 'bg-[var(--color-danger)]/20 text-[var(--color-danger)] hover:bg-[var(--color-danger)]/30' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
                  >
                    {u.active ? 'Pasifleştir' : 'Aktifleştir'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
