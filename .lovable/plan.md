# Plano de Implementação - Isolamento da Evolution API

Este plano visa garantir que a instalação da Evolution API no servidor Hostinger (VPS) seja isolada exclusivamente para o domínio `acessar.click`, evitando interferências em outros domínios hospedados na mesma máquina.

## Alterações Técnicas

### 1. Script de Deploy (`deploy/update.sh`)
- Modificar o comando `docker run` da Evolution API para vincular a porta `18080` exclusivamente ao endereço de loopback (`127.0.0.1`).
- Isso impede que a porta fique exposta publicamente no IP do servidor, tornando-a acessível apenas para o site `acessar.click` que roda no mesmo host.
- Adicionar comentários explicativos sobre o isolamento no script.

### 2. Interface Administrativa
- Atualizar o componente `EvolutionConfig.tsx` para incluir informações claras sobre o isolamento e o procedimento de instalação via terminal.
- Adicionar avisos no Painel Admin reforçando que a instalação é segura e não afeta outros projetos no VPS.

### 3. Configuração de Nginx (Conceitual)
- O script `install.sh` já cria um vhost isolado para `acessar.click`. O isolamento da porta no Docker complementa essa segurança ao nível de rede local.

## Usuário e Experiência
- O administrador terá a garantia visual e técnica de que a ferramenta de automação do WhatsApp está confinada ao seu projeto.
- Instruções no dashboard guiarão o usuário sobre como rodar o comando de atualização no terminal caso necessário.

---
**Observação:** O comando exato para atualização no terminal é:
`bash /var/www/acessarclick/deploy/update.sh`
