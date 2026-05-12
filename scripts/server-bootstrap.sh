#!/usr/bin/env bash
#
# server-bootstrap.sh — Tek seferlik sunucu ayağa kaldırma + kalıcı sağlamlaştırma
#
# Kullanım (yerelden SSH üzerinden):
#   ssh root@185.255.95.111 'bash -s' < scripts/server-bootstrap.sh
# veya GitHub'dan:
#   ssh root@185.255.95.111 'curl -fsSL https://raw.githubusercontent.com/elkekoitan/paspasoto/main/scripts/server-bootstrap.sh | bash'
#
# Bu script:
#  1. Sistem sağlık raporu (disk/RAM/yük/network)
#  2. Acil temizlik (eğer disk doluysa Docker prune)
#  3. Docker + Coolify ayağa kaldırma
#  4. Tüm Coolify uygulamalarını başlatma
#  5. Kalıcı sağlamlaştırma:
#     - Docker daemon: live-restore + log limit
#     - Firewall (ufw) — sadece 22/80/443/8000
#     - Fail2ban — SSH brute force koruması
#     - Health monitor cron — Coolify + Docker auto-recovery
#     - Log rotation — disk dolmasın
#     - Auto-backup — Coolify volumes + /data günlük yedek
#     - Unattended-upgrades (security patches)
#     - Sysctl tuning — TCP/network limits

set -euo pipefail

# ANSI renkler
RED='\033[0;31m'; GRN='\033[0;32m'; YLW='\033[1;33m'; BLU='\033[0;34m'; NC='\033[0m'
log()  { echo -e "${BLU}[$(date +%H:%M:%S)]${NC} $*"; }
ok()   { echo -e "${GRN}✓${NC} $*"; }
warn() { echo -e "${YLW}⚠${NC} $*"; }
err()  { echo -e "${RED}✗${NC} $*"; }
section() { echo; echo -e "${BLU}━━━━━━ $* ━━━━━━${NC}"; }

if [[ "$EUID" -ne 0 ]]; then
  err "Bu script root olarak çalışmalıdır."
  exit 1
fi

# ─────────────────────────────────────────────────────────────
section "1. Sistem Sağlık Raporu"
# ─────────────────────────────────────────────────────────────

log "Kernel:    $(uname -rs)"
log "Uptime:    $(uptime -p)"
log "Yük:       $(awk '{print $1,$2,$3}' /proc/loadavg)"

echo
log "Disk Kullanımı:"
df -h / /var/lib/docker 2>/dev/null | head -10 || df -h /

echo
log "RAM:"
free -h | head -2

echo
log "Docker:"
if command -v docker &>/dev/null; then
  docker --version
  docker system df 2>/dev/null || warn "docker system df başarısız"
else
  warn "Docker kurulu değil!"
fi

# ─────────────────────────────────────────────────────────────
section "2. Acil Temizlik (eğer disk > %85)"
# ─────────────────────────────────────────────────────────────

DISK_USE=$(df / | awk 'NR==2 {gsub("%",""); print $5}')
log "Root disk kullanımı: ${DISK_USE}%"

if [[ "$DISK_USE" -ge 85 ]]; then
  warn "Disk %85 üstünde — Docker temizliği yapılıyor"
  docker system prune -af --volumes --filter "until=72h" 2>/dev/null || true
  journalctl --vacuum-time=7d 2>/dev/null || true
  apt-get clean 2>/dev/null || true
  rm -rf /tmp/* /var/tmp/* 2>/dev/null || true
  ok "Temizlik tamamlandı"
  df -h / | tail -1
else
  ok "Disk kullanımı normal seviyede"
fi

# ─────────────────────────────────────────────────────────────
section "3. Docker Daemon Ayarları (live-restore + log limit)"
# ─────────────────────────────────────────────────────────────

# Docker daemon.json — log boyut limiti + live-restore (Docker daemon restart edilirken container'lar çalışsın)
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "live-restore": true,
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "default-ulimits": {
    "nofile": {
      "Hard": 65536,
      "Name": "nofile",
      "Soft": 65536
    }
  }
}
EOF
ok "Docker daemon.json yazıldı (live-restore + log limit)"

systemctl daemon-reload
systemctl restart docker || { err "Docker restart başarısız"; systemctl status docker --no-pager | head -10; }
sleep 3
if systemctl is-active --quiet docker; then
  ok "Docker servisi aktif"
else
  err "Docker servisi başlamadı!"
fi

# ─────────────────────────────────────────────────────────────
section "4. Coolify Ayağa Kaldırma"
# ─────────────────────────────────────────────────────────────

COOLIFY_DIR="/data/coolify"
if [[ -d "$COOLIFY_DIR" ]]; then
  log "Coolify dizini: $COOLIFY_DIR"
  cd "$COOLIFY_DIR/source" 2>/dev/null || cd "$COOLIFY_DIR"

  # Coolify'ın kendisini başlat
  if [[ -f "docker-compose.yml" ]]; then
    docker compose up -d 2>/dev/null || docker-compose up -d
    ok "Coolify docker compose çalıştırıldı"
  else
    # Coolify kurulum scripti
    log "Compose dosyası yok, Coolify'ı systemctl ile deniyorum"
    systemctl restart coolify 2>/dev/null || true
  fi
else
  warn "$COOLIFY_DIR bulunamadı — Coolify standart kurulum dışında olabilir"
  log "Mevcut Docker container'ları:"
  docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}' 2>/dev/null | head -20
fi

sleep 5

# ─────────────────────────────────────────────────────────────
section "5. Tüm Container'ları (yeniden) Başlat"
# ─────────────────────────────────────────────────────────────

# Önce stopped olanları başlat
STOPPED=$(docker ps -aq --filter "status=exited" --filter "status=created" 2>/dev/null)
if [[ -n "$STOPPED" ]]; then
  log "Durmuş container'lar yeniden başlatılıyor:"
  docker start $STOPPED 2>&1 | head -10 || true
fi

# unhealthy olanları restart et
UNHEALTHY=$(docker ps --filter "health=unhealthy" -q 2>/dev/null)
if [[ -n "$UNHEALTHY" ]]; then
  warn "Sağlıksız container'lar restart ediliyor:"
  docker restart $UNHEALTHY 2>&1 | head -10
fi

sleep 5
log "Çalışan container'lar:"
docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null | head -30

# ─────────────────────────────────────────────────────────────
section "6. Firewall (UFW)"
# ─────────────────────────────────────────────────────────────

if ! command -v ufw &>/dev/null; then
  log "ufw kuruluyor..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y ufw 2>&1 | tail -3
fi

ufw --force reset >/dev/null 2>&1
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp comment 'SSH'
ufw allow 80/tcp comment 'HTTP (Coolify proxy)'
ufw allow 443/tcp comment 'HTTPS (Coolify proxy)'
ufw allow 8000/tcp comment 'Coolify dashboard'
ufw --force enable >/dev/null 2>&1
ok "UFW aktif: 22, 80, 443, 8000 açık"
ufw status numbered | head -15

# ─────────────────────────────────────────────────────────────
section "7. Fail2ban (SSH Brute Force Koruması)"
# ─────────────────────────────────────────────────────────────

if ! command -v fail2ban-client &>/dev/null; then
  log "fail2ban kuruluyor..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y fail2ban 2>&1 | tail -3
fi

cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
maxretry = 5
bantime = 24h
EOF

systemctl enable fail2ban >/dev/null 2>&1
systemctl restart fail2ban
ok "fail2ban aktif (SSH 5 hatalı denemede 24 saat ban)"

# ─────────────────────────────────────────────────────────────
section "8. Health Monitor Cron (5 dk'da bir kontrol)"
# ─────────────────────────────────────────────────────────────

mkdir -p /usr/local/bin /var/log/paspasoto
cat > /usr/local/bin/server-health-check.sh <<'HEALTH_EOF'
#!/usr/bin/env bash
# Coolify proxy 80 ve dashboard 8000 portlarını kontrol et,
# erişilemiyorsa Docker'ı yeniden başlat. Disk %90 üstündeyse Docker prune.
LOG=/var/log/paspasoto/health.log
exec >> "$LOG" 2>&1

echo "[$(date '+%F %T')] health-check"

# Disk kontrolü
DU=$(df / | awk 'NR==2 {gsub("%",""); print $5}')
if [[ "$DU" -ge 90 ]]; then
  echo "  disk %${DU} — prune"
  docker system prune -af --volumes --filter "until=72h" >/dev/null 2>&1
  journalctl --vacuum-time=3d >/dev/null 2>&1
fi

# RAM kontrolü
MEM_USED=$(free | awk '/Mem:/ {print int($3/$2*100)}')
if [[ "$MEM_USED" -ge 95 ]]; then
  echo "  ram %${MEM_USED} — uyarı"
fi

# Coolify dashboard kontrolü
if ! curl -fsS --max-time 5 http://127.0.0.1:8000/ >/dev/null 2>&1; then
  echo "  coolify 8000 down — restart"
  systemctl restart docker
  sleep 5
  # Coolify container'larını başlat
  cd /data/coolify/source 2>/dev/null && docker compose up -d 2>/dev/null || true
fi

# Reverse proxy (80) kontrolü
if ! curl -fsS --max-time 5 http://127.0.0.1/ >/dev/null 2>&1; then
  echo "  proxy 80 down — restart"
  PROXY=$(docker ps -q --filter "name=coolify-proxy" 2>/dev/null)
  [[ -n "$PROXY" ]] && docker restart "$PROXY" 2>/dev/null
fi

# Unhealthy container'ları restart
UNH=$(docker ps --filter "health=unhealthy" -q 2>/dev/null)
if [[ -n "$UNH" ]]; then
  echo "  unhealthy containers: $UNH — restart"
  docker restart $UNH 2>/dev/null
fi

# Exited (auto-restart politikasıyla başlamamış) container'ları
EX=$(docker ps -aq --filter "status=exited" --filter "label=coolify.managed=true" 2>/dev/null)
if [[ -n "$EX" ]]; then
  echo "  exited coolify containers: $EX — start"
  docker start $EX 2>/dev/null
fi
HEALTH_EOF

chmod +x /usr/local/bin/server-health-check.sh

# Cron kur
cat > /etc/cron.d/paspasoto-health <<'EOF'
# PaspasOto sunucu sağlık kontrolü — 5 dk'da bir
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
*/5 * * * * root /usr/local/bin/server-health-check.sh
EOF
ok "Health monitor cron kuruldu (5 dk aralık)"

# ─────────────────────────────────────────────────────────────
section "9. Log Rotation"
# ─────────────────────────────────────────────────────────────

cat > /etc/logrotate.d/paspasoto <<'EOF'
/var/log/paspasoto/*.log {
  daily
  rotate 7
  compress
  missingok
  notifempty
  copytruncate
}
EOF
ok "Log rotation: /var/log/paspasoto 7 gün"

# Docker container loglarını da limitle (daemon.json zaten ayarladı — eski container'lar için manuel cleanup)
find /var/lib/docker/containers/ -name "*-json.log" -size +50M -exec truncate -s 0 {} \; 2>/dev/null || true

# ─────────────────────────────────────────────────────────────
section "10. Auto-backup (Günlük 03:30)"
# ─────────────────────────────────────────────────────────────

mkdir -p /var/backups/paspasoto

cat > /usr/local/bin/server-backup.sh <<'BACKUP_EOF'
#!/usr/bin/env bash
# Günlük yedek: Coolify db + persistent volumes + /data
DATE=$(date +%F)
DIR=/var/backups/paspasoto
mkdir -p "$DIR"
LOG=/var/log/paspasoto/backup.log
exec >> "$LOG" 2>&1
echo "[$(date '+%F %T')] backup $DATE start"

# Coolify postgres yedek (eğer container varsa)
COOLIFY_DB=$(docker ps -q --filter "name=coolify-db" 2>/dev/null | head -1)
if [[ -n "$COOLIFY_DB" ]]; then
  docker exec "$COOLIFY_DB" pg_dumpall -U postgres 2>/dev/null | gzip > "$DIR/coolify-db-$DATE.sql.gz"
  echo "  coolify-db yedek: $(du -h "$DIR/coolify-db-$DATE.sql.gz" | cut -f1)"
fi

# /data dizini (PaspasOto JSON + Coolify metadata)
if [[ -d /data ]]; then
  tar czf "$DIR/data-$DATE.tar.gz" -C / data 2>/dev/null --exclude='/data/coolify/source/.git'
  echo "  /data yedek: $(du -h "$DIR/data-$DATE.tar.gz" | cut -f1)"
fi

# Eski yedekleri sil (7 günden eski)
find "$DIR" -name "*.gz" -mtime +7 -delete 2>/dev/null

echo "[$(date '+%F %T')] backup $DATE end"
BACKUP_EOF

chmod +x /usr/local/bin/server-backup.sh

cat > /etc/cron.d/paspasoto-backup <<'EOF'
# Günlük yedek 03:30
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin
30 3 * * * root /usr/local/bin/server-backup.sh
EOF
ok "Backup cron kuruldu (günlük 03:30, 7 gün retention)"

# ─────────────────────────────────────────────────────────────
section "11. Sysctl Tuning (network/file limits)"
# ─────────────────────────────────────────────────────────────

cat > /etc/sysctl.d/99-paspasoto.conf <<'EOF'
# PaspasOto / Coolify production tuning

# Daha çok TCP backlog (bağlantı kuyruğu)
net.core.somaxconn = 4096
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 4096

# TIME_WAIT tuning
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_tw_reuse = 1

# Keep-alive
net.ipv4.tcp_keepalive_time = 600

# Daha fazla dosya descriptor
fs.file-max = 2097152

# Daha fazla inotify watch (Coolify file watching)
fs.inotify.max_user_watches = 524288
fs.inotify.max_user_instances = 8192

# vm.swappiness — RAM bol, swap'a düşmesin
vm.swappiness = 10

# overcommit — Redis vs. fork() için
vm.overcommit_memory = 1
EOF

sysctl -p /etc/sysctl.d/99-paspasoto.conf >/dev/null
ok "Sysctl tuning uygulandı"

# ulimit (systemd default)
mkdir -p /etc/systemd/system.conf.d
cat > /etc/systemd/system.conf.d/limits.conf <<'EOF'
[Manager]
DefaultLimitNOFILE=65536
DefaultLimitNPROC=32768
EOF
ok "Systemd ulimit yükseltildi"

# ─────────────────────────────────────────────────────────────
section "12. Unattended Upgrades (Otomatik Güvenlik Güncellemeleri)"
# ─────────────────────────────────────────────────────────────

if ! dpkg -l | grep -q unattended-upgrades; then
  log "unattended-upgrades kuruluyor..."
  DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades 2>&1 | tail -3
fi

cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF

cat > /etc/apt/apt.conf.d/50unattended-upgrades <<'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
ok "Sadece güvenlik güncellemeleri otomatik"

# ─────────────────────────────────────────────────────────────
section "13. Network / Connectivity Doğrulama"
# ─────────────────────────────────────────────────────────────

log "İnternet kontrolü:"
if curl -fsS --max-time 5 https://www.google.com/generate_204 >/dev/null 2>&1; then
  ok "Çıkış internet OK"
else
  err "Çıkış internet YOK — sağlayıcıya kontrol ettir"
fi

log "Yerel servis kontrolü:"
for port in 22 80 443 8000; do
  if ss -tln | awk '{print $4}' | grep -q ":$port\$"; then
    ok "Port $port dinleniyor"
  else
    warn "Port $port dinlenmiyor"
  fi
done

# ─────────────────────────────────────────────────────────────
section "14. Özet"
# ─────────────────────────────────────────────────────────────

cat <<EOF

  ${GRN}✓ Bootstrap tamamlandı${NC}

  Disk:        $(df -h / | awk 'NR==2 {print $5, "kullanımda, ", $4, "boş"}')
  RAM:         $(free -h | awk '/Mem:/ {print $3, "kullanımda /", $2, "toplam"}')
  Docker:      $(docker ps -q 2>/dev/null | wc -l) container çalışıyor
  Firewall:    UFW aktif (22/80/443/8000)
  Fail2ban:    SSH koruması aktif
  Cron'lar:    Health (5 dk), Backup (günlük 03:30)
  Backup:      /var/backups/paspasoto/ (7 gün retention)
  Loglar:      /var/log/paspasoto/

  Sonraki adımlar:
   1. Test:    curl -I http://localhost:8000/
   2. SSH:     yeni güçlü şifre belirle (passwd) veya SSH key kur
   3. PaspasOto deploy: Coolify dashboard'dan tetikle
EOF
