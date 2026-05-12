/**
 * ssh-bootstrap.mjs — Sunucu açıldığında SSH ile bootstrap + deploy zinciri
 *
 * Önce dış HTTP kontrolü yapar, sunucu kapalıysa çıkar.
 * Açıksa:
 *   1. SSH ile server-bootstrap.sh çalıştırır (GitHub raw'dan curl ile fetch eder)
 *   2. Coolify deploy zincirini tetikler (coolify-redeploy.mjs)
 *
 * Çalıştırma (lokalden):
 *   SSHPASS='InfoMusicCoolify2026!' node scripts/ssh-bootstrap.mjs
 *
 * Gereksinim:
 *   - ssh client (Windows: Git Bash veya OpenSSH for Windows)
 *   - sshpass (Linux/Git Bash) VEYA SSH key auth
 *   - GitHub repo public erişilebilir olmalı (raw.githubusercontent.com)
 */
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const HOST = process.env.SSH_HOST ?? '185.255.95.111'
const USER = process.env.SSH_USER ?? 'root'
const PASS = process.env.SSHPASS ?? 'InfoMusicCoolify2026!'
const BOOTSTRAP_URL =
  process.env.BOOTSTRAP_URL ??
  'https://raw.githubusercontent.com/elkekoitan/paspasoto/main/scripts/server-bootstrap.sh'

const __dirname = dirname(fileURLToPath(import.meta.url))

function colored(c, msg) {
  const codes = { red: 31, green: 32, yellow: 33, blue: 34, gray: 90 }
  return `\x1b[${codes[c]}m${msg}\x1b[0m`
}

async function checkServerUp() {
  process.stdout.write('→ Sunucu HTTP kontrolü... ')
  const res = await fetch(`http://${HOST}:8000/`, { signal: AbortSignal.timeout(8000) }).catch(
    () => null,
  )
  const code = res?.status ?? 0
  if (code === 0) {
    console.log(colored('red', `kapalı (timeout)`))
    return false
  }
  console.log(colored('green', `HTTP ${code}`))
  return true
}

function sshRun(remoteCmd) {
  return new Promise((resolveP, reject) => {
    // sshpass mevcut mu kontrol et
    const useSshpass = !!PASS && process.platform !== 'win32' // sshpass Unix
    const cmd = useSshpass ? 'sshpass' : 'ssh'
    const args = useSshpass
      ? ['-p', PASS, 'ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null', `${USER}@${HOST}`, remoteCmd]
      : ['-o', 'StrictHostKeyChecking=no', '-o', 'UserKnownHostsFile=/dev/null', `${USER}@${HOST}`, remoteCmd]

    const child = spawn(cmd, args, { stdio: ['inherit', 'inherit', 'inherit'] })
    child.on('exit', (code) => (code === 0 ? resolveP(0) : reject(new Error(`ssh exit ${code}`))))
    child.on('error', (e) => reject(e))
  })
}

async function main() {
  console.log(colored('blue', `\nSSH Bootstrap — ${USER}@${HOST}\n`))

  if (!(await checkServerUp())) {
    console.error(colored('red', 'Sunucu hala kapalı. Önce Rabisu sorunu çözmeli.'))
    process.exit(1)
  }

  console.log(`\n${colored('blue', '━━ 1. server-bootstrap.sh çalıştırılıyor (SSH üzerinden) ━━')}`)
  console.log(colored('gray', `   Script kaynağı: ${BOOTSTRAP_URL}`))
  console.log(colored('gray', '   Bu 1-2 dk sürebilir (apt install, docker prune vb.)\n'))

  try {
    await sshRun(`curl -fsSL "${BOOTSTRAP_URL}" | bash`)
    console.log(colored('green', '\n✓ Bootstrap başarıyla tamamlandı'))
  } catch (e) {
    console.error(colored('red', `\n✗ Bootstrap başarısız: ${e.message}`))
    console.log(colored('yellow', '\nManuel çalıştırma:'))
    console.log(`   ssh ${USER}@${HOST}`)
    console.log(`   curl -fsSL ${BOOTSTRAP_URL} | bash`)
    process.exit(1)
  }

  console.log(`\n${colored('blue', '━━ 2. Coolify deploy zinciri ━━')}`)
  console.log(colored('gray', '   PaspasOto application için: port + healthcheck + env + volume + rebuild\n'))

  const { spawn: s } = await import('node:child_process')
  const redeployScript = resolve(__dirname, 'coolify-redeploy.mjs')
  await new Promise((res, rej) => {
    const c = s('node', [redeployScript], { stdio: 'inherit', env: { ...process.env } })
    c.on('exit', (code) => (code === 0 ? res() : rej(new Error(`redeploy exit ${code}`))))
  }).catch((e) => {
    console.error(colored('red', `Coolify deploy: ${e.message}`))
  })

  console.log(colored('green', '\n✓ Tüm zincir tamamlandı\n'))
}

main().catch((e) => {
  console.error(colored('red', '✗ ' + e.message))
  process.exit(1)
})
