# ============================================================================
# polofio-analytics: remote deploy (run from ANY machine that can reach the VPS)
#
# One-command deploy:
#   powershell -ExecutionPolicy Bypass -File deploy-remote.ps1
#
# What it does:
#   1. Creates a dedicated SSH key (~/.ssh/polofio_deploy) if missing
#   2. Installs the key on the VPS (prompts for the root password ONCE,
#      nothing is stored on disk)
#   3. Uploads analytics/ (secrets stripped) and runs analytics/deploy.sh,
#      which generates fresh admin/session secrets on the server (0600 .env)
#   4. Installs nginx + certbot, sets up the reverse proxy
#   5. Waits for the DNS record (add it in Vercel while it polls),
#      then issues a Let's Encrypt cert
#   6. Verifies HTTPS health, tracking, dashboard auth end-to-end
#
# Idempotent: safe to re-run at any point.
# ============================================================================

param(
  [string]$VpsHost   = '207.148.78.192',
  [string]$VpsUser   = 'root',
  [string]$Domain    = 'analytics.hoangvuvan.xyz',
  [string]$CertbotEmail = 'admin@hoangvuvan.xyz',
  [int]$DnsWaitMinutes = 10
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$remote = "$VpsUser@$VpsHost"
$keyPriv = Join-Path $HOME '.ssh\polofio_deploy'
$keyPub  = "$keyPriv.pub"

function Write-Step([string]$msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Invoke-Remote([string]$cmd) {
  & ssh -i $keyPriv -o BatchMode=yes -o ConnectTimeout=20 $remote $cmd
  if ($LASTEXITCODE -ne 0) { throw "SSH command failed (exit $LASTEXITCODE): $cmd" }
}

# --- 1. prereqs -------------------------------------------------------------
Write-Step 'Prereq checks (ssh, scp, tar, curl, ssh-keygen)'
foreach ($c in 'ssh','scp','tar','curl') {
  if (-not (Get-Command $c -ErrorAction SilentlyContinue)) {
    throw "Missing required tool: $c"
  }
}

# --- 2. deploy key ----------------------------------------------------------
if (-not (Test-Path $keyPriv)) {
  Write-Step "Generating deploy SSH key: $keyPriv"
  & ssh-keygen -t ed25519 -N '""' -f $keyPriv | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'ssh-keygen failed' }
}

$keyInstalled = $false
if (Test-Path $keyPub) {
  try {
    Invoke-Remote 'true' | Out-Null
    $keyInstalled = $true
  } catch { $keyInstalled = $false }
}

if (-not $keyInstalled) {
  Write-Step "Installing SSH key on $remote (enter the root password when prompted)"
  Get-Content -Raw $keyPub | & ssh -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 $remote `
    "mkdir -p ~/.ssh && chmod 700 ~/.ssh && tr -d '\r' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && echo KEY_INSTALLED"
  if ($LASTEXITCODE -ne 0) { throw 'Key install failed' }
  try { Invoke-Remote 'echo KEY_OK' | Out-Null } catch { throw 'Key was not accepted by the server' }
}

# --- 3. upload app ----------------------------------------------------------
Write-Step 'Uploading analytics/ (local .env, data, node_modules stripped)'
$stage = Join-Path $env:TEMP ("polofio-analytics-stage-" + [guid]::NewGuid().ToString('N'))
$tgz   = Join-Path $env:TEMP 'polofio-analytics.tgz'
New-Item -ItemType Directory -Path $stage | Out-Null
Copy-Item -Recurse -Force (Join-Path $PSScriptRoot 'analytics\*') $stage
foreach ($ex in '.env','data','node_modules') {
  Remove-Item -Recurse -Force (Join-Path $stage $ex) -ErrorAction SilentlyContinue
}
Remove-Item $tgz -Force -ErrorAction SilentlyContinue
& tar -czf $tgz -C $stage .
if ($LASTEXITCODE -ne 0) { throw 'tar failed' }
& scp -i $keyPriv -o BatchMode=yes -o ConnectTimeout=20 $tgz "${remote}:/root/polofio-analytics.tgz"
if ($LASTEXITCODE -ne 0) { throw 'scp upload failed' }
Invoke-Remote "rm -rf /root/polofio-analytics && mkdir -p /root/polofio-analytics && tar -xzf /root/polofio-analytics.tgz -C /root/polofio-analytics && rm -f /root/polofio-analytics.tgz"

# --- 4. run server installer (generates fresh secrets, systemd service) -----
Write-Step 'Running analytics/deploy.sh on the VPS (first run generates the admin password below - SAVE IT)'
Invoke-Remote 'bash /root/polofio-analytics/deploy.sh'

# --- 5. nginx + certbot -----------------------------------------------------
Write-Step 'Installing nginx + certbot'
Invoke-Remote "DEBIAN_FRONTEND=noninteractive apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nginx certbot python3-certbot-nginx"

Write-Step 'Configuring nginx reverse proxy'
Invoke-Remote "install -m 0644 /root/polofio-analytics/nginx-analytics.conf /etc/nginx/sites-available/polofio-analytics.conf && ln -sf /etc/nginx/sites-available/polofio-analytics.conf /etc/nginx/sites-enabled/polofio-analytics.conf && rm -f /etc/nginx/sites-enabled/default && nginx -t && systemctl reload nginx"

# --- 6. wait for DNS --------------------------------------------------------
Write-Step "Waiting for DNS: $Domain -> $VpsHost (up to $DnsWaitMinutes min)"
Write-Host '  If you have not added the record yet, add it NOW in Vercel:'
Write-Host "    Type A, Name: analytics, Value: $VpsHost" -ForegroundColor Yellow
$deadline = (Get-Date).AddMinutes($DnsWaitMinutes)
$dnsOk = $false
while ((Get-Date) -lt $deadline) {
  $ips = @(Resolve-DnsName $Domain -Type A -ErrorAction SilentlyContinue |
    Where-Object { $_.IPAddress } | ForEach-Object { $_.IPAddress })
  if ($ips -contains $VpsHost) { $dnsOk = $true; break }
  Write-Host "  DNS not ready: $Domain = $($ips -join ', ') (still waiting...)" -ForegroundColor DarkGray
  Start-Sleep -Seconds 15
}
if (-not $dnsOk) {
  throw "DNS for $Domain does not point to $VpsHost yet. Add the A record in Vercel, then re-run this script (idempotent)."
}
Write-Host "  DNS OK: $Domain -> $VpsHost" -ForegroundColor Green

# --- 7. Let's Encrypt -------------------------------------------------------
Write-Step "Issuing Let's Encrypt certificate for $Domain"
Invoke-Remote "certbot --nginx -d $Domain --redirect --non-interactive --agree-tos -m $CertbotEmail"

# --- 8. verify end-to-end ---------------------------------------------------
Write-Step 'Verifying production endpoints'
function Check([string]$name, [string]$url, [string]$method, [string]$headers, [string]$bodyFile, [string]$expect) {
  $curlArgs = @('-s','-o','NUL','-w','%{http_code}','--connect-timeout','20')
  if ($method) { $curlArgs += @('-X',$method) }
  if ($headers) { $curlArgs += @('-H',$headers) }
  if ($bodyFile) { $curlArgs += @('--data-binary',("@$bodyFile")) }
  $curlArgs += $url
  $code = & curl.exe @curlArgs
  $ok = ($code -eq $expect)
  Write-Host ("  {0,-30} -> {1} (expected {2}) {3}" -f $name, $code, $expect, $(if ($ok) {'PASS'} else {'FAIL'})) -ForegroundColor $(if ($ok) {'Green'} else {'Red'})
  if (-not $ok) { throw "Verification failed: $name" }
}
$trackBody = Join-Path $env:TEMP 'polofio-track.json'
Set-Content -Path $trackBody -Value '{"event":"session","sid":"deploy-check","now":1234567890,"page":"/deploy-check","cid":"deploy-check"}' -Encoding Ascii
Check 'health'        "https://$Domain/api/health" '' '' '' '200'
Check 'unauth stats'  "https://$Domain/api/stats" '' '' '' '401'
Check 'dashboard (auth redirect)' "https://$Domain/analytics/" '' '' '' '302'
Check 'track (portfolio origin)' "https://$Domain/api/track" 'POST' 'Content-Type: application/json' $trackBody '204'

Write-Step 'Fetching admin password for the dashboard (save it in your password manager)'
Invoke-Remote "grep -E '^ANALYTICS_ADMIN_PASSWORD=' /opt/polofio-analytics/.env | cut -d= -f2-"

Write-Step 'Confirming data is persisting'
Invoke-Remote "ls -la /opt/polofio-analytics/data/ && tail -1 /opt/polofio-analytics/data/sessions.jsonl 2>/dev/null"

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host '  DONE - analytics is live at https://analytics.hoangvuvan.xyz/analytics' -ForegroundColor Green
Write-Host '  Dashboard: https://analytics.hoangvuvan.xyz/analytics' 
Write-Host "  Tracking URL (set on the portfolio): $Domain"
Write-Host '==============================================================='
Write-Host ''
Write-Host 'REMAINING MANUAL STEP (Vercel, requires your Vercel access):' -ForegroundColor Yellow
Write-Host '  Set the env var on the portfolio project:' -ForegroundColor Yellow
Write-Host '    PUBLIC_ANALYTICS_URL = https://analytics.hoangvuvan.xyz' -ForegroundColor Yellow
Write-Host '  and redeploy. The local dist/ is already built with that URL.' -ForegroundColor Yellow
