param(
  [string]$Model = "gemini-3.6-flash",
  [switch]$Native
)

$ErrorActionPreference = "Stop"
if (-not $env:GEMINI_API_KEY) { Write-Host "GEMINI_API_KEY not set"; exit 2 }

if ($Native) {
  $url = "https://generativelanguage.googleapis.com/v1beta/models/$($Model):generateContent"
  $body = @{
    contents           = @(@{ parts = @(@{ text = "hello" }) })
    generationConfig   = @{ maxOutputTokens = 16; temperature = 0.7 }
  } | ConvertTo-Json -Depth 6
  $authHeader = "x-goog-api-key: $($env:GEMINI_API_KEY)"
}
else {
  $url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
  $body = @{
    model       = $Model
    messages    = @(
      @{ role = "user"; content = "hello" }
    )
    max_tokens  = 16
    temperature = 0.7
    stream      = $true
  } | ConvertTo-Json -Depth 6
  $authHeader = "Authorization: Bearer $($env:GEMINI_API_KEY)"
}

$out = Join-Path $PSScriptRoot "gemini-last-body.txt"
$bodyFile = Join-Path $PSScriptRoot "gemini-request-body.json"
$body | Set-Content -LiteralPath $bodyFile -NoNewline -Encoding UTF8
$code = & curl.exe -s -o $out -w "%{http_code}" -X POST $url -H $authHeader -H "Content-Type: application/json" --data-binary "@$bodyFile"

Write-Host "model=$Model native=$([bool]$Native) HTTP=$code"
if ($code -eq "403") {
  Write-Host "RED: reproduced 403"
  $json = Get-Content $out -Raw
  try {
    $parsed = $json | ConvertFrom-Json
    Write-Host ("error.status=" + $parsed.error.status)
    Write-Host ("error.domain=" + $parsed.error.domain)
    Write-Host ("error.reason=" + $parsed.error.details[0].reason)
    Write-Host ("error.quotaMetric=" + $parsed.error.details[0].quotaMetric)
    Write-Host ("error.message=" + ($parsed.error.message -replace $env:GEMINI_API_KEY, "REDACTED"))
  }
  catch {
    Write-Host ($json -replace $env:GEMINI_API_KEY, "REDACTED")
  }
  exit 1
}
else {
  Write-Host "GREEN: no 403 (HTTP $code)"
  Write-Host ("body(first 300 chars, key redacted): " + ((Get-Content $out -Raw).Substring(0, [Math]::Min(300, (Get-Content $out -Raw).Length)) -replace $env:GEMINI_API_KEY, "REDACTED"))
  exit 0
}
