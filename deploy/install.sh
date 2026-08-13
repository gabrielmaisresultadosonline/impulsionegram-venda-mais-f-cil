#!/usr/bin/env bash
# =============================================================================
#  POPULAR / acessar.click — Instalador completo para VPS Ubuntu 24.04 LTS
# =============================================================================
set -Eeuo pipefail

# ----------------------------- Configuração ---------------------------------
APP_NAME="acessarclick"
APP_DIR="/var/www/${APP_NAME}"
APP_USER="${APP_NAME}"
APP_PORT="3009"
DOMAIN="acessar.click"
WWW_DOMAIN="www.acessar.click"
REPO_URL=""
LETSENCRYPT_EMAIL=""
ADMIN_EMAIL="mro@gmail.com"
ADMIN_PASSWORD=""
FB_PIXEL_ID="1055141180794602"
FB_CAPI_TOKEN=""
NODE_MAJOR="22"

# ----------------------------- Argumentos -----------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo)   REPO_URL="$2"; shift 2 ;;
    --port)   APP_PORT="$2"; shift 2 ;;
    --domain) DOMAIN="$2"; WWW_DOMAIN="www.$2"; shift 2 ;;
    --email)  LETSENCRYPT_EMAIL="$2"; shift 2 ;;
    --no-www) WWW_DOMAIN=""; shift ;;
    --admin-email) ADMIN_EMAIL="$2"; shift 2 ;;
    --admin-pass)  ADMIN_PASSWORD="$2"; shift 2 ;;
    --fb-pixel)    FB_PIXEL_ID="$2"; shift 2 ;;
    --fb-token)    FB_CAPI_TOKEN="$2"; shift 2 ;;
    *) echo "Argumento desconhecido: $1"; exit 1 ;;
  esac
done

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m[aviso] %s\033[0m\n' "$*"; }
die()  { printf '\033[1;31m[erro] %s\033[0m\n' "$*" >&2; exit 1; }

[[ "$(id -u)" -eq 0 ]] || die "Execute como root:  sudo bash install.sh"

[[ -n "${ADMIN_PASSWORD}" ]] || ADMIN_PASSWORD="$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-20)"

log "Verificando se a porta ${APP_PORT} está livre"
if ss -ltn "sport = :${APP_PORT}" 2>/dev/null | grep -q LISTEN; then
  die "A porta ${APP_PORT} já está em uso por outro projeto. Rode novamente com --port 3010 (ou outra livre)."
fi

log "Instalando dependências base (nginx, git, curl, certbot)"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg git ufw nginx certbot python3-certbot-nginx

log "Instalando Node.js ${NODE_MAJOR} (se necessário)"
if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" -lt 20 ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

log "Criando usuário de sistema e pasta ${APP_DIR}"
id -u "${APP_USER}" >/dev/null 2>&1 || useradd --system --create-home --shell /usr/sbin/nologin "${APP_USER}"
mkdir -p "${APP_DIR}"

if [[ -n "${REPO_URL}" ]]; then
  log "Clonando/atualizando código de ${REPO_URL}"
  if [[ -d "${APP_DIR}/.git" ]]; then
    git -C "${APP_DIR}" fetch --all --prune
    git -C "${APP_DIR}" reset --hard "origin/$(git -C "${APP_DIR}" symbolic-ref --short HEAD 2>/dev/null || echo main)"
  else
    rm -rf "${APP_DIR:?}"/* 2>/dev/null || true
    git clone "${REPO_URL}" "${APP_DIR}"
  fi
else
  [[ -f "${APP_DIR}/package.json" ]] || die "Sem --repo informado e ${APP_DIR}/package.json não existe."
fi

ENV_FILE="${APP_DIR}/.env"
if [[ ! -f "${ENV_FILE}" ]]; then
  log "Gerando ${ENV_FILE}"
  cat > "${ENV_FILE}" <<EOF
NODE_ENV=production
PORT=${APP_PORT}
HOST=127.0.0.1
ADMIN_EMAIL=${ADMIN_EMAIL}
ADMIN_LOGIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_PASSWORD=${ADMIN_PASSWORD}
FACEBOOK_PIXEL_ID=${FB_PIXEL_ID}
FACEBOOK_CAPI_TOKEN=${FB_CAPI_TOKEN}
EOF
  echo "  >>> LOGIN ADMIN: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}"
else
  log ".env já existe — atualizando chaves do Meta"
  sed -i '/^FACEBOOK_PIXEL_ID=/d;/^FACEBOOK_CAPI_TOKEN=/d' "${ENV_FILE}"
  {
    echo "FACEBOOK_PIXEL_ID=${FB_PIXEL_ID}"
    [[ -n "${FB_CAPI_TOKEN}" ]] && echo "FACEBOOK_CAPI_TOKEN=${FB_CAPI_TOKEN}"
  } >> "${ENV_FILE}"
fi
chmod 600 "${ENV_FILE}"

log "Instalando dependências e gerando build de produção"
cd "${APP_DIR}"
npm ci || npm install

NITRO_PRESET=node-server npm run build:node

[[ -f "${APP_DIR}/.output/server/index.mjs" ]] \
  || die "Build não gerou .output/server/index.mjs."

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

log "Criando serviço systemd ${APP_NAME}.service"
cat > "/etc/systemd/system/${APP_NAME}.service" <<EOF
[Unit]
Description=POPULAR (acessar.click)
After=network.target

[Service]
Type=simple
User=${APP_USER}
Group=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
Environment=NODE_ENV=production
ExecStart=/usr/bin/node ${APP_DIR}/.output/server/index.mjs
Restart=always
RestartSec=3
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=${APP_DIR}
StandardOutput=journal
StandardError=journal
SyslogIdentifier=${APP_NAME}

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable "${APP_NAME}"
systemctl restart "${APP_NAME}"
sleep 3
systemctl is-active --quiet "${APP_NAME}" \
  || { journalctl -u "${APP_NAME}" -n 40 --no-pager; die "Serviço não subiu."; }

log "Configurando nginx para ${DOMAIN}"
SERVER_NAMES="${DOMAIN}${WWW_DOMAIN:+ ${WWW_DOMAIN}}"
cat > "/etc/nginx/sites-available/${APP_NAME}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${SERVER_NAMES};

    client_max_body_size 20m;

    access_log /var/log/nginx/${APP_NAME}.access.log;
    error_log  /var/log/nginx/${APP_NAME}.error.log;

    location / {
        proxy_pass http://127.0.0.1:${APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }
}
EOF

ln -sfn "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
nginx -t
systemctl reload nginx

if ufw status | grep -q "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null 2>&1 || true
fi

log "Emitindo certificado SSL para ${SERVER_NAMES}"
CERTBOT_DOMAINS=(-d "${DOMAIN}")
[[ -n "${WWW_DOMAIN}" ]] && CERTBOT_DOMAINS+=(-d "${WWW_DOMAIN}")
EMAIL_ARG=(--register-unsafely-without-email)
[[ -n "${LETSENCRYPT_EMAIL}" ]] && EMAIL_ARG=(-m "${LETSENCRYPT_EMAIL}")

if certbot --nginx "${CERTBOT_DOMAINS[@]}" --agree-tos --redirect --non-interactive "${EMAIL_ARG[@]}"; then
  systemctl reload nginx
  log "SSL ativo — https://${DOMAIN}"
else
  warn "Certbot falhou."
fi

systemctl enable certbot.timer >/dev/null 2>&1 || true

cat <<EOF
============================================================
 INSTALAÇÃO CONCLUÍDA
============================================================
 Site        : https://${DOMAIN}
 Pasta       : ${APP_DIR}
 Admin       : https://${DOMAIN}/admin
============================================================
EOF
