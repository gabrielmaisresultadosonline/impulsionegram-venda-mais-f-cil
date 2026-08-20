#!/bin/bash

# Configurações
DATA_DIR=".data"
BACKUP_DIR=".backup_data_$(date +%Y%m%d_%H%M%S)"

echo "--- Iniciando atualização do projeto ---"

# 1. Preservar dados existentes
if [ -d "$DATA_DIR" ]; then
    echo "Fazendo backup de segurança dos dados atuais em $BACKUP_DIR..."
    cp -r "$DATA_DIR" "$BACKUP_DIR"
else
    echo "Pasta $DATA_DIR não encontrada. Criando para persistência."
    mkdir -p "$DATA_DIR"
fi

# 2. Atualizar dependências (se houver novo package.json)
# npm install --no-save

# 3. Limpeza de builds antigos
# rm -rf dist .output

echo "--- Atualização concluída com sucesso ---"
echo "Nota: A pasta $DATA_DIR foi preservada e um backup criado em $BACKUP_DIR."
