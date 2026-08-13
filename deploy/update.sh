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

# Garantir que a configuração do Nginx seja reaplicada com isolamento de host
if [[ -f "/etc/nginx/sites-available/${APP_NAME}" ]]; then
  log "Reforçando isolamento de domínio no Nginx"
  # Captura o domínio principal do arquivo de serviço ou .env
  MAIN_DOMAIN="acessar.click"
  
  # Adiciona bloco de verificação de host se não existir
  if ! grep -q "if (\$host !=" "/etc/nginx/sites-available/${APP_NAME}"; then
    sed -i "/server_name/a \ \n    if (\$host != \"${MAIN_DOMAIN}\") {\n        return 444;\n    }" "/etc/nginx/sites-available/${APP_NAME}"
    nginx -t && systemctl reload nginx
  fi
fi

sleep 3
systemctl is-active --quiet "${APP_NAME}" && log "✅ Deploy concluído" \
  || { journalctl -u "${APP_NAME}" -n 40 --no-pager; exit 1; }
