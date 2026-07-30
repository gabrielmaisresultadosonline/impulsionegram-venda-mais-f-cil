# Deploy POPULAR — acessar.click (VPS Ubuntu 24.04 LTS)

Instalação **isolada**: nada de outros sites do mesmo VPS é tocado.

| Recurso | Valor |
|---|---|
| Pasta | `/var/www/acessarclick` |
| Usuário do sistema | `acessarclick` |
| Serviço systemd | `acessarclick.service` |
| Vhost nginx | `/etc/nginx/sites-available/acessarclick` |
| Porta local | `127.0.0.1:3009` (exclusiva) |
| Domínios | `acessar.click` + `www.acessar.click` |

O script **não** mexe em `nginx.conf` global, nem no `default`, nem em outros
vhosts, serviços, certificados ou portas. Se a porta 3009 já estiver ocupada
ele aborta antes de qualquer alteração — basta rodar de novo com `--port 3010`.

---

## Passo 1 — DNS (Hostinger / registrador)

| Tipo | Nome | Valor |
|---|---|---|
| A | `@` | `167.88.42.133` |
| A | `www` | `167.88.42.133` |

Aguarde a propagação. Confira com:

```bash
dig +short acessar.click
```

Precisa retornar `167.88.42.133` antes do SSL.

---

## Passo 2 — Instalação (opção A: direto do GitHub — recomendado)

Um único bloco, colado no terminal da sua máquina:

```bash
ssh root@167.88.42.133 'bash -s' <<'REMOTO'
set -e
mkdir -p /var/www/acessarclick
apt-get update -y && apt-get install -y git
git clone https://github.com/gabrielmaisresultadosonline/impulsionegram-venda-mais-f-cil.git /tmp/popular-src
rsync -a --delete --exclude .git /tmp/popular-src/ /var/www/acessarclick/
rm -rf /tmp/popular-src
cd /var/www/acessarclick
bash deploy/install.sh \
  --domain acessar.click \
  --port 3009 \
  --email gabriel@seuemail.com \
  --admin-email mro@gmail.com \
  --admin-pass 'Ga145523@'
REMOTO
```

Troque `--email` pelo seu e-mail real (é o que o Let's Encrypt usa para avisar
de expiração).

### Opção B: enviando o código da sua máquina

```bash
ssh root@167.88.42.133 "mkdir -p /var/www/acessarclick"

rsync -av --exclude node_modules --exclude .output --exclude .git \
  ./ root@167.88.42.133:/var/www/acessarclick/

ssh root@167.88.42.133
cd /var/www/acessarclick
bash deploy/install.sh \
  --domain acessar.click --port 3009 \
  --email gabriel@seuemail.com \
  --admin-email mro@gmail.com --admin-pass 'Ga145523@'
```

---

## O que o instalador faz

1. Confere se a porta está livre (aborta se houver conflito).
2. Instala nginx, git, certbot e Node.js 22 (só se ainda não existirem).
3. Cria o usuário de sistema `acessarclick` e a pasta do projeto.
4. Gera `/var/www/acessarclick/.env` (permissão `600`) com o login do admin.
5. `npm ci` + build de produção Nitro (`node-server`).
6. Cria o serviço systemd com isolamento (`ProtectSystem`, `PrivateTmp`,
   `ReadWritePaths` só na própria pasta).
7. Cria o vhost nginx exclusivo fazendo proxy para `127.0.0.1:3009`.
8. Emite o SSL Let's Encrypt apenas para `acessar.click` e `www`, com renovação
   automática via `certbot.timer`.

---

## Depois de instalado

```bash
systemctl status acessarclick      # estado do serviço
journalctl -u acessarclick -f      # logs em tempo real
systemctl restart acessarclick     # reiniciar
```

**Atualizar o site após mudar o código:**

```bash
cd /var/www/acessarclick && bash deploy/update.sh
```

**Endereços:**

- Site: `https://acessar.click`
- Painel do cliente: `https://acessar.click/painel`
- Admin: `https://acessar.click/admin` → `mro@gmail.com` / `Ga145523@`
- Webhook InfinitePay: `https://acessar.click/api/public/infinitepay/webhook`

---

## Trocar a senha do admin depois

```bash
nano /var/www/acessarclick/.env      # edite ADMIN_LOGIN_PASSWORD e ADMIN_PASSWORD
systemctl restart acessarclick
```

---

## Se o SSL falhar

Quase sempre é DNS ainda não propagado. O site continua no ar em HTTP. Rode
depois:

```bash
certbot --nginx -d acessar.click -d www.acessar.click --agree-tos --redirect
systemctl reload nginx
```

---

## Remover completamente (sem afetar os outros sites)

```bash
systemctl disable --now acessarclick
rm -f /etc/systemd/system/acessarclick.service
systemctl daemon-reload
rm -f /etc/nginx/sites-enabled/acessarclick /etc/nginx/sites-available/acessarclick
nginx -t && systemctl reload nginx
rm -rf /var/www/acessarclick
userdel -r acessarclick 2>/dev/null || true
```

---

## Importante sobre os dados

Pedidos, tickets e configuração do Pixel ficam **em memória** do processo. Um
`systemctl restart` limpa tudo. Para persistência real é necessário adicionar
um PostgreSQL — me avise que eu implemento a camada de banco.
