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
    --exclude .git --exclude node_modules --exclude .output --exclude .env --exclude .data \
    /tmp/${APP_NAME}-src/ "${APP_DIR}/"
  rm -rf /tmp/${APP_NAME}-src
fi

log "Instalando dependências"
npm ci || npm install

log "Verificando dependência Evolution API (Docker)"
if command -v docker >/dev/null 2>&1; then
  # Limpeza total de containers antigos que possam conflitar
  for container in "evolution-api" "evolution_api" "evolution_postgres" "evolution_redis"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
      log "Removendo container antigo: ${container}..."
      docker stop "${container}" || true
      docker rm "${container}" || true
    fi
  done

  # Tenta liberar a porta 8080 caso algo esteja usando (ex: Nginx ou processo órfão)
  if command -v fuser >/dev/null 2>&1; then
    fuser -k 8080/tcp || true
  fi

  log "Instalando Evolution API v2 via Docker (Porta 8080)..."
  # Usamos a imagem que já existe no seu servidor para evitar erro de download
  IMAGE_NAME="evoapicloud/evolution-api:latest"
  
  docker run -d --name evolution-api \
    --restart always \
    -p 8080:8080 \
    -e AUTHENTICATION_TYPE=apikey \
    -e AUTHENTICATION_API_KEY=popular-key-auto \
    -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
    -e DATABASE_ENABLED=false \
    -e DATABASE_PROVIDER=sqlite \
    -e STORE_MESSAGES=true \
    -e STORE_MESSAGE_UP=true \
    -e STORE_CONTACTS=true \
    -e STORE_CHATS=true \
    $IMAGE_NAME

  # Aguarda a API subir
  log "Aguardando Evolution API inicializar na porta 8080..."
  for i in {1..30}; do
    if curl -s -o /dev/null http://localhost:8080/instance/fetchInstances -H "apikey: popular-key-auto"; then
      log "Evolution API está online e respondendo na porta 8080."
      break
    fi
    sleep 2
  done
else
  log "DOCKER NÃO ENCONTRADO! A Evolution API não poderá ser instalada automaticamente."
fi

log "Gerando build de produção"
NITRO_PRESET=node-server npm run build:node
[[ -f .output/server/index.mjs ]] || { echo "Build falhou."; exit 1; }

chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"

log "Reiniciando serviço"
systemctl restart "${APP_NAME}"
sleep 3
systemctl is-active --quiet "${APP_NAME}" && log "Site atualizado com sucesso." \
  || { journalctl -u "${APP_NAME}" -n 40 --no-pager; exit 1; }
