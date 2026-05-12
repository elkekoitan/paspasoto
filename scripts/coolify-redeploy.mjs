/**
 * Coolify deploy zinciri — sunucu döndüğünde tek komutla:
 *   1. Application settings (ports, healthcheck, build pack, dockerfile path) güncelle
 *   2. Environment variables ekle (ADMIN_PASSWORD, SESSION_SECRET, DATA_DIR, PUBLIC_SITE_URL, PWA_DISABLED)
 *   3. Persistent storage mount ekle (/data)
 *   4. Force rebuild tetikle
 *   5. Build durumunu poll et (60s aralıkla, finished/failed'a kadar)
 *
 * Çalıştır: node scripts/coolify-redeploy.mjs
 *
 * Env (script'in ihtiyacı):
 *   COOLIFY_TOKEN — API token (default: hard-coded development token)
 *   COOLIFY_HOST  — http://185.255.95.111:8000 (default)
 *   APP_UUID      — kw1f0tskisx5pl6i5jw2tzgw (default)
 *   ADMIN_PASSWORD — atölye giriş şifresi (üret veya ayarla)
 *   SESSION_SECRET — 32+ karakter güvenli random
 */
import { randomBytes } from 'node:crypto'

const TOKEN = process.env.COOLIFY_TOKEN ?? '1|l0aDJB6GqSMlavK2yczWkUePScAo4Kwsff4KKgrx3a3f177d'
const HOST = process.env.COOLIFY_HOST ?? 'http://185.255.95.111:8000'
const APP_UUID = process.env.APP_UUID ?? 'kw1f0tskisx5pl6i5jw2tzgw'

// Üretim sırrı: env'den gelmiyorsa rastgele üret (her çalıştırmada yeni — production'da set edilmeli!)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'paspasoto2026'
const SESSION_SECRET = process.env.SESSION_SECRET ?? randomBytes(48).toString('base64url')

const api = async (path, init = {}) => {
  const res = await fetch(`${HOST}/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }
  return { ok: res.ok, status: res.status, body: json }
}

async function step(label, fn) {
  process.stdout.write(`→ ${label}... `)
  try {
    const r = await fn()
    console.log('✓')
    return r
  } catch (e) {
    console.log(`✗\n  ${e.message ?? e}`)
    throw e
  }
}

async function ping() {
  const r = await fetch(`${HOST}/api/v1/servers`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  }).catch(() => null)
  return r?.ok ?? false
}

async function main() {
  console.log(`Coolify host: ${HOST}`)
  console.log(`App uuid: ${APP_UUID}\n`)

  if (!(await ping())) {
    console.error('✗ Coolify erişilemez — sunucu hala down.')
    process.exit(1)
  }
  console.log('✓ Coolify erişilebilir\n')

  // 1) Application ayarları (port + healthcheck + dockerfile)
  await step('App ayarları güncelle (port 4321, healthcheck /health, dockerfile)', async () => {
    const r = await api(`/applications/${APP_UUID}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ports_exposes: '4321',
        health_check_enabled: true,
        health_check_path: '/health',
        health_check_port: '4321',
        health_check_method: 'GET',
        health_check_scheme: 'http',
        health_check_return_code: 200,
        health_check_interval: 30,
        health_check_timeout: 5,
        health_check_retries: 3,
        health_check_start_period: 15,
        dockerfile_location: '/apps/web/Dockerfile',
        base_directory: '/',
      }),
    })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${JSON.stringify(r.body)}`)
  })

  // 2) Environment variables
  const envs = {
    NODE_ENV: 'production',
    HOST: '0.0.0.0',
    PORT: '4321',
    DATA_DIR: '/data',
    PUBLIC_SITE_URL: 'https://paspasoto.com',
    PWA_DISABLED: 'false',
    ADMIN_PASSWORD,
    SESSION_SECRET,
  }

  for (const [key, value] of Object.entries(envs)) {
    await step(`env ${key}`, async () => {
      // İlk dene POST (yeni env), Coolify api format değişkenlik gösteriyor — minimal payload
      const r = await api(`/applications/${APP_UUID}/envs`, {
        method: 'POST',
        body: JSON.stringify({ key, value, is_preview: false, is_build_time: key.startsWith('PUBLIC_') }),
      })
      // 409 = zaten var → PATCH (is_build_time olmadan)
      if (r.status === 409 || r.status === 422) {
        const u = await api(`/applications/${APP_UUID}/envs`, {
          method: 'PATCH',
          body: JSON.stringify({ key, value, is_preview: false }),
        })
        if (!u.ok && u.status !== 422) {
          console.warn(`  (uyarı: ${key} update atlandı: HTTP ${u.status})`)
        }
      } else if (!r.ok) {
        console.warn(`  (uyarı: ${key} HTTP ${r.status} — atlandı)`)
      }
    })
  }

  // 3) Persistent storage (/data volume) — eğer yoksa ekle
  // Coolify API: POST /applications/{uuid}/storages
  await step('Persistent storage /data', async () => {
    const r = await api(`/applications/${APP_UUID}/storages`, {
      method: 'POST',
      body: JSON.stringify({
        name: 'data',
        mount_path: '/data',
        host_path: null, // null = anonymous (Coolify generate)
      }),
    }).catch((e) => ({ ok: false, status: 0, body: e.message }))
    if (!r.ok && r.status !== 409 && r.status !== 422) {
      console.warn(`  (uyarı: storage ekleme başarısız, manuel ekleme gerekebilir: ${r.status})`)
    }
  })

  // 4) Deploy tetikle
  const deployRes = await step('Deploy tetikle (force=true)', async () => {
    const r = await api(`/deploy?uuid=${APP_UUID}&force=true`, { method: 'POST' })
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${JSON.stringify(r.body)}`)
    return r.body
  })
  const deploymentUuid = deployRes?.deployments?.[0]?.deployment_uuid
  console.log(`  Deployment uuid: ${deploymentUuid}`)

  if (!deploymentUuid) {
    console.error('Deploy tetiklendi ama deployment uuid alınamadı.')
    return
  }

  // 5) Build poll
  console.log('\nBuild progress (60s aralıkla poll):')
  while (true) {
    await new Promise((r) => setTimeout(r, 60_000))
    const r = await api(`/deployments/${deploymentUuid}`)
    const status = r.body?.status ?? 'unknown'
    console.log(`  [${new Date().toLocaleTimeString('tr-TR')}] status=${status}`)
    if (['finished', 'failed', 'cancelled-by-user', 'error'].includes(status)) {
      console.log(`\nFinal: ${status}`)
      if (status !== 'finished') {
        console.log('Hata log için: GET /api/v1/deployments/' + deploymentUuid)
      } else {
        console.log(`\n✓ Canlı URL: http://${APP_UUID}.185.255.95.111.sslip.io`)
        console.log(`  Admin: http://${APP_UUID}.185.255.95.111.sslip.io/admin`)
        console.log(`  Admin şifresi: ${ADMIN_PASSWORD}`)
      }
      break
    }
  }
}

main().catch((e) => {
  console.error('\n✗ Hata:', e)
  process.exit(1)
})
