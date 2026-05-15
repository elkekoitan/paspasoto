#!/bin/bash
# Carmat veri yedekleme scripti — sunucuda çalıştırılır.
#
# Kullanım:
#   ./backup-data.sh [hedef-klasör]
#
# Default hedef: /root/backups
# tar.gz olarak tarihli isimle yedek alır, 30 günden eski yedekleri siler.

set -euo pipefail

DEST="${1:-/root/backups}"
DATE=$(date +%Y%m%d-%H%M)

# Coolify Docker volume yolu — uygulamanın DATA_DIR mount'una göre
# (Coolify panele bakıp gerçek volume UUID'sini al, aşağıya yaz)
DATA_DIR="${DATA_DIR:-/data}"

if [ ! -d "$DATA_DIR" ]; then
  echo "Hata: DATA_DIR bulunamadı: $DATA_DIR"
  echo "Coolify panelinden volume UUID'sini bul, DATA_DIR env ile ver:"
  echo "  DATA_DIR=/var/lib/docker/volumes/<uuid>/_data ./backup-data.sh"
  exit 1
fi

mkdir -p "$DEST"

ARCHIVE="$DEST/carmat-$DATE.tar.gz"
tar -czf "$ARCHIVE" -C "$DATA_DIR" . 2>/dev/null

SIZE=$(du -h "$ARCHIVE" | cut -f1)
echo "✓ Yedek oluşturuldu: $ARCHIVE ($SIZE)"

# 30 günden eski yedekleri sil
DELETED=$(find "$DEST" -name "carmat-*.tar.gz" -mtime +30 -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "  $DELETED adet 30+ günlük eski yedek silindi"
fi

# İçerik listesi (kontrol için)
echo ""
echo "İçerik:"
tar -tzf "$ARCHIVE" | head -20
