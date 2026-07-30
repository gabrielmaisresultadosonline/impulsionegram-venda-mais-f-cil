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

if [[ -d .git ]]; then
  log "Baixando última versão do repositório"
  git fetch --all --prune
  git reset --hard "origin/$(git rev-parse --abbrev-ref HEAD)"
fi

log "Instalando dependências"
npm ci || npm install

log "Gerando build de produção"
NITRO_PRESET=node-server npm run build:node
[[ -f .output/server/index.mjs ]] || { echo "Build falhou."; exit 1; }

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

log "Reiniciando serviço"
systemctl restart "${APP_NAME}"
sleep 3
systemctl is-active --quiet "${APP_NAME}" && log "Site atualizado com sucesso." \
  || { journalctl -u "${APP_NAME}" -n 40 --no-pager; exit 1; }
