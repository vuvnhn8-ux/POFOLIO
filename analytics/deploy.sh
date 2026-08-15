#!/usr/bin/env bash
# polofio-analytics production installer (run on the VPS as root).
# Idempotent: safe to re-run. Secrets are generated on first run and kept in
# /opt/polofio-analytics/.env (mode 0600). The admin password is printed once
# at first install — store it in your password manager.
#
# Usage:
#   sudo bash deploy.sh
#
# Expects this folder (server.js, public/, package.json, analytics.service)
# to already be on the server, e.g.:
#   scp -r analytics root@YOUR_VPS:/root/polofio-analytics

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/polofio-analytics}"
SERVICE="polofio-analytics"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8787}"
BIND_HOST="${BIND_HOST:-127.0.0.1}"

# 1. Node.js 18+ (Ubuntu/Debian)
if ! command -v node >/dev/null 2>&1; then
  echo "[deploy] installing Node.js..."
  if command -v apt-get >/dev/null 2>&1; then
    apt-get update -qq
    apt-get install -y -qq curl ca-certificates nodejs npm
  else
    echo "[deploy] ERROR: no apt-get. Install Node.js 18+ manually, then re-run." >&2
    exit 1
  fi
fi
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "[deploy] ERROR: Node.js $NODE_MAJOR < 18. Upgrade Node.js, then re-run." >&2
  exit 1
fi

# 2. Service user (dedicated, least-privilege)
if ! id -u polofio >/dev/null 2>&1; then
  useradd --system --home-dir "$APP_DIR" --shell /usr/sbin/nologin polofio
fi

# 3. App files
install -d -o polofio -g polofio "$APP_DIR"
install -m 0644 -o polofio -g polofio "$SRC_DIR/server.js" "$APP_DIR/server.js"
install -m 0644 -o polofio -g polofio "$SRC_DIR/package.json" "$APP_DIR/package.json"
install -d -o polofio -g polofio "$APP_DIR/public"
cp -r "$SRC_DIR/public/." "$APP_DIR/public/"
chown -R polofio:polofio "$APP_DIR"

# 4. Environment file (secrets generated once)
if [ ! -f "$APP_DIR/.env" ]; then
  umask 077
  ADMIN_PASSWORD="$(openssl rand -hex 16)"
  SESSION_SECRET="$(openssl rand -hex 32)"
  cat > "$APP_DIR/.env" <<EOF
ANALYTICS_ADMIN_PASSWORD=$ADMIN_PASSWORD
ANALYTICS_SESSION_SECRET=$SESSION_SECRET
ANALYTICS_ALLOWED_ORIGINS=https://portfolio.hoangvuvan.xyz,http://localhost:4321
ANALYTICS_TRUST_PROXY=1
ANALYTICS_GEO_MODE=auto
ANALYTICS_RETENTION_DAYS=365
ANALYTICS_SECURE_COOKIE=1
PORT=$PORT
HOST=$BIND_HOST
EOF
  chown polofio:polofio "$APP_DIR/.env"
  chmod 600 "$APP_DIR/.env"
  echo "============================================================"
  echo "[deploy] FIRST INSTALL — analytics admin password:"
  echo "          $ADMIN_PASSWORD"
  echo "  (saved in $APP_DIR/.env; keep it private)"
  echo "============================================================"
fi

# 5. systemd unit
install -m 0644 "$SRC_DIR/analytics.service" /etc/systemd/system/$SERVICE.service
sed -i "s|^WorkingDirectory=.*|WorkingDirectory=$APP_DIR|" /etc/systemd/system/$SERVICE.service
sed -i "s|^EnvironmentFile=.*|EnvironmentFile=$APP_DIR/.env|" /etc/systemd/system/$SERVICE.service

systemctl daemon-reload
systemctl enable --now $SERVICE
systemctl restart $SERVICE
sleep 2

# 6. Health check (local only)
if ! curl -fsS "http://${BIND_HOST}:${PORT}/api/health" >/dev/null 2>&1; then
  echo "[deploy] ERROR: health check failed. Check: journalctl -u $SERVICE" >&2
  systemctl --no-pager --full status $SERVICE || true
  exit 1
fi

echo "[deploy] OK — $SERVICE running on http://${BIND_HOST}:${PORT}"
echo "[deploy] Dashboard: https://analytics.hoangvuvan.xyz/analytics"
echo "[deploy] Data:      $APP_DIR/data (bind it to a non-ephemeral disk if needed)"
