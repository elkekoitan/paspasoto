#!/bin/sh
# Carmat container entrypoint.
#
# Coolify persistent volume'u host'tan root:root mount edebiliyor — bu durumda
# node user (UID 1000) /data altına yazamıyor (EACCES).
# Bu script root olarak başlar, /data ownership'ini düzeltir, sonra su-exec ile
# uygulamayı node user'la çalıştırır.

set -e

# /data klasörü mount edilmiş olabilir — yoksa oluştur, varsa node:node yap
mkdir -p /data
chown -R node:node /data 2>/dev/null || true
chmod -R u+rwX,g+rX /data 2>/dev/null || true

# /app klasörü her durumda node:node olmalı (image içinde zaten öyle ama yedek)
chown -R node:node /app 2>/dev/null || true

# Uygulamayı node user (UID 1000) ile çalıştır
exec su-exec node:node "$@"
