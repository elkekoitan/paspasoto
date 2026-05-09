#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────
# Coolify Env Yükleyici
# ─────────────────────────────────────────────────────────
# Bu script Coolify REST API üzerinden tek seferde birden fazla env değişkenini ekler/günceller.
#
# Kullanım:
#   1. Coolify panelinden API token al:
#      Settings → Keys & Tokens → "Create new token"
#      (read+write yetkili olmalı)
#   2. Bu shell oturumuna gir (token'ı dosyaya YAZMA):
#        export COOLIFY_API_URL="http://185.255.95.111:8000"
#        export COOLIFY_TOKEN="<panelden_aldigin_token>"
#        export COOLIFY_APP_UUID="kw1f0tskisx5pl6i5jw2tzgw"
#   3. Trendyol değerlerini de bu oturuma gir:
#        export TY_SUPPLIER_ID="..."
#        export TY_API_KEY="..."
#        export TY_API_SECRET="..."
#        export TY_INTEGRATION_REF="..."
#        export TY_WEBHOOK_SECRET="..."   # ileride üreteceğin random string
#   4. Script'i çalıştır:
#        bash scripts/coolify-set-env.sh
#
# Script hiçbir credential'ı diske yazmaz, sadece API'ye iletir.
# ─────────────────────────────────────────────────────────

set -euo pipefail

: "${COOLIFY_API_URL:?COOLIFY_API_URL set edilmemiş — örn: http://185.255.95.111:8000}"
: "${COOLIFY_TOKEN:?COOLIFY_TOKEN set edilmemiş}"
: "${COOLIFY_APP_UUID:?COOLIFY_APP_UUID set edilmemiş}"

# ─── Eklenecek env değişkenleri ───
# (Boş olanlar atlanır.)
declare -A ENVS=(
  [TRENDYOL_SUPPLIER_ID]="${TY_SUPPLIER_ID:-}"
  [TRENDYOL_API_KEY]="${TY_API_KEY:-}"
  [TRENDYOL_API_SECRET]="${TY_API_SECRET:-}"
  [TRENDYOL_INTEGRATION_REF]="${TY_INTEGRATION_REF:-}"
  [TRENDYOL_WEBHOOK_SECRET]="${TY_WEBHOOK_SECRET:-}"
  [TRENDYOL_BASE_URL]="${TY_BASE_URL:-https://apigw.trendyol.com}"
)

upsert_env() {
  local key="$1"
  local value="$2"

  if [ -z "$value" ]; then
    echo "  ⊘ $key (boş, atlandı)"
    return 0
  fi

  # Coolify API: PATCH ile upsert (yoksa oluştur, varsa güncelle)
  local payload
  payload=$(printf '{"key":"%s","value":%s,"is_preview":false,"is_build_time":false,"is_literal":false}' \
    "$key" "$(printf '%s' "$value" | jq -Rs .)")

  local code
  code=$(curl -s -o /tmp/coolify-resp.json -w "%{http_code}" \
    -X PATCH \
    -H "Authorization: Bearer $COOLIFY_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    "$COOLIFY_API_URL/api/v1/applications/$COOLIFY_APP_UUID/envs")

  if [ "$code" = "200" ] || [ "$code" = "201" ]; then
    echo "  ✓ $key (HTTP $code)"
  else
    echo "  ✗ $key (HTTP $code)"
    cat /tmp/coolify-resp.json
    echo
    return 1
  fi
}

echo "🔧 Coolify env yükleniyor:"
echo "   API   : $COOLIFY_API_URL"
echo "   App   : $COOLIFY_APP_UUID"
echo

if ! command -v jq >/dev/null 2>&1; then
  echo "⚠ jq bulunamadı. yükle: brew install jq | apt install jq | choco install jq"
  exit 1
fi

for key in "${!ENVS[@]}"; do
  upsert_env "$key" "${ENVS[$key]}"
done

echo
echo "✓ Tamamlandı. Application → Environment Variables sekmesinden doğrula."
echo "  Sonraki adım: Application → Redeploy (env build-time olmadığı için restart yeter)"
