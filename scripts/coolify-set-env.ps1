# ─────────────────────────────────────────────────────────
# Coolify Env Yükleyici (PowerShell)
# ─────────────────────────────────────────────────────────
# Bu script Coolify REST API üzerinden Trendyol env değişkenlerini ekler/günceller.
#
# Kullanım (PowerShell terminalde):
#   1. Coolify panelinden API token al:
#      Settings → Keys & Tokens → "Create new token" (read+write)
#   2. Token + Trendyol bilgilerini bu oturuma gir (DİSKE YAZMA):
#        $env:COOLIFY_API_URL  = "http://185.255.95.111:8000"
#        $env:COOLIFY_TOKEN    = "<panelden_aldigin_token>"
#        $env:COOLIFY_APP_UUID = "kw1f0tskisx5pl6i5jw2tzgw"
#        $env:TY_SUPPLIER_ID   = "669085"
#        $env:TY_API_KEY       = "<rotate_edilmis_yeni_key>"
#        $env:TY_API_SECRET    = "<rotate_edilmis_yeni_secret>"
#        $env:TY_INTEGRATION_REF = "645c0a65-62f6-4865-bafe-f98455f0b0c9"
#        $env:TY_WEBHOOK_SECRET  = "<random_uretilmis_webhook_secret>"
#   3. Çalıştır:
#        pwsh scripts/coolify-set-env.ps1
#        # veya
#        powershell -ExecutionPolicy Bypass -File scripts/coolify-set-env.ps1
#
# Script hiçbir credential'ı diske yazmaz — sadece env'den okuyup API'ye gönderir.
# ─────────────────────────────────────────────────────────

$ErrorActionPreference = 'Stop'

function Require-Env($name) {
  $val = [Environment]::GetEnvironmentVariable($name, 'Process')
  if ([string]::IsNullOrEmpty($val)) {
    throw "$name set edilmemiş — kullanım talimatına bak."
  }
  return $val
}

$api  = Require-Env 'COOLIFY_API_URL'
$tok  = Require-Env 'COOLIFY_TOKEN'
$uuid = Require-Env 'COOLIFY_APP_UUID'

# Eklenecek env değişkenleri (boş olanlar atlanır)
$envs = [ordered]@{
  TRENDYOL_SUPPLIER_ID     = $env:TY_SUPPLIER_ID
  TRENDYOL_API_KEY         = $env:TY_API_KEY
  TRENDYOL_API_SECRET      = $env:TY_API_SECRET
  TRENDYOL_INTEGRATION_REF = $env:TY_INTEGRATION_REF
  TRENDYOL_WEBHOOK_SECRET  = $env:TY_WEBHOOK_SECRET
  TRENDYOL_BASE_URL        = if ($env:TY_BASE_URL) { $env:TY_BASE_URL } else { 'https://apigw.trendyol.com' }
}

Write-Host "Coolify env yukleniyor:" -ForegroundColor Cyan
Write-Host "  API : $api"
Write-Host "  App : $uuid"
Write-Host ""

$headers = @{
  'Authorization' = "Bearer $tok"
  'Content-Type'  = 'application/json'
}

foreach ($key in $envs.Keys) {
  $value = $envs[$key]
  if ([string]::IsNullOrEmpty($value)) {
    Write-Host "  - $key (bos, atlandi)" -ForegroundColor DarkGray
    continue
  }

  $body = @{
    key            = $key
    value          = $value
    is_preview     = $false
    is_build_time  = $false
    is_literal     = $false
  } | ConvertTo-Json -Compress

  try {
    Invoke-RestMethod -Method Patch `
      -Uri "$api/api/v1/applications/$uuid/envs" `
      -Headers $headers `
      -Body $body `
      -TimeoutSec 30 | Out-Null
    Write-Host "  + $key" -ForegroundColor Green
  } catch {
    $code = $_.Exception.Response.StatusCode.value__
    Write-Host "  ! $key (HTTP $code)" -ForegroundColor Red
    Write-Host "     $($_.Exception.Message)" -ForegroundColor DarkRed
  }
}

Write-Host ""
Write-Host "Tamamlandi. Coolify panelinde Application -> Environment Variables sekmesini ac." -ForegroundColor Cyan
Write-Host "Sonraki adim: Application -> Redeploy (env runtime ise restart yeter)." -ForegroundColor Cyan
