#!/usr/bin/env bash
# =============================================================================
#  Atualização do site acessar.click (não afeta outros projetos do VPS)
#  Uso:  bash /var/www/acessarclick/deploy/update.sh
# =============================================================================
set -Eeuo pipefail

APP_NAME="acessarclick"
APP_DIR="/var/www/${APP_NAME}"
APP_USER="${APP_NAME}"

log() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }

[[ "$(id -u)" -eq 0 ]] || { echo "Execute como root."; exit 1; }

cd "${APP_DIR}"

REPO_URL="${REPO_URL:-https://github.com/gabrielmaisresultadosonline/impulsionegram-venda-mais-f-cil.git}"

if [[ -d .git ]]; then
  log "Baixando última versão do repositório"
  git fetch --all --prune
  git reset --hard "origin/main" || git reset --hard "origin/$(git rev-parse --abbrev-ref HEAD)"
else
  log "Pasta sem git — sincronizando código do GitHub (preserva .env)"
  rm -rf /tmp/${APP_NAME}-src
  git clone --depth 1 "${REPO_URL}" /tmp/${APP_NAME}-src
  rsync -a --delete \
    --exclude .git --exclude node_modules --exclude .output --exclude .env --exclude .data \
    /tmp/${APP_NAME}-src/ "${APP_DIR}/"
  rm -rf /tmp/${APP_NAME}-src
fi

log "Instalando dependências"
npm install

log "Removendo Evolution API (se existir)"
if command -v docker >/dev/null 2>&1; then
  for container in "evolution-api" "evolution_api" "evolution_postgres" "evolution_redis"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
      log "Removendo container: ${container}..."
      docker stop "${container}" || true
      docker rm "${container}" || true
    fi
  done
  docker volume rm evolution_data || true
fi

log "Gerando build de produção"
NITRO_PRESET=node-server npm run build:node
[[ -f .output/server/index.mjs ]] || { echo "Build falhou."; exit 1; }

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

log "Reiniciando serviço"
systemctl restart "${APP_NAME}"

# Reescrever o vhost preservando o HTTPS (SSL) do domínio
MAIN_DOMAIN="acessar.click"
WWW_DOMAIN="www.acessar.click"
CERT_DIR="/etc/letsencrypt/live/${MAIN_DOMAIN}"

log "Aplicando vhost isolado (HTTP + HTTPS) para ${MAIN_DOMAIN}"

PROXY_BLOCK='    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:3009;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }'

if [[ -f "${CERT_DIR}/fullchain.pem" ]]; then
  cat > "/etc/nginx/sites-available/${APP_NAME}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${MAIN_DOMAIN} ${WWW_DOMAIN};

    location /.well-known/acme-challenge/ { root /var/www/html; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${MAIN_DOMAIN} ${WWW_DOMAIN};

    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    if (\$host !~* ^(${MAIN_DOMAIN}|${WWW_DOMAIN})\$) { return 444; }

${PROXY_BLOCK}
}
EOF
else
  cat > "/etc/nginx/sites-available/${APP_NAME}" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${MAIN_DOMAIN} ${WWW_DOMAIN};

    if (\$host !~* ^(${MAIN_DOMAIN}|${WWW_DOMAIN})\$) { return 444; }

${PROXY_BLOCK}
}
EOF
fi

ln -sfn "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-enabled/${APP_NAME}"
nginx -t && systemctl reload nginx

if [[ ! -f "${CERT_DIR}/fullchain.pem" ]]; then
  log "Sem certificado SSL — emitindo com certbot"
  if certbot --nginx -d "${MAIN_DOMAIN}" -d "${WWW_DOMAIN}" \
       --agree-tos --redirect --non-interactive --register-unsafely-without-email; then
    systemctl reload nginx
    log "SSL ativo — https://${MAIN_DOMAIN}"
  else
    log "⚠️  Certbot falhou (verifique o DNS). Site segue em HTTP."
  fi
fi


sleep 3
systemctl is-active --quiet "${APP_NAME}" && log "✅ Deploy concluído" \
  || { journalctl -u "${APP_NAME}" -n 40 --no-pager; exit 1; }
