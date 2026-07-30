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
  # Garante que usamos a branch main do GitHub (o repositório remoto usa main, não master).
  git reset --hard "origin/main" || git reset --hard "origin/$(git rev-parse --abbrev-ref HEAD)"
else
  log "Pasta sem git — sincronizando código do GitHub (preserva .env)"
  rm -rf /tmp/${APP_NAME}-src
  git clone --depth 1 "${REPO_URL}" /tmp/${APP_NAME}-src
  rsync -a --delete \
    --exclude .git --exclude node_modules --exclude .output --exclude .env \
    /tmp/${APP_NAME}-src/ "${APP_DIR}/"
  rm -rf /tmp/${APP_NAME}-src
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
