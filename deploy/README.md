# Deploy no VPS Ubuntu 24.04 LTS (Hostinger) — acessar.click

Deploy **isolado**: nada de outros sites do VPS é alterado. Tudo fica em
`/var/www/acessarclick`, com serviço `acessarclick.service`, vhost nginx
`acessarclick` e porta local exclusiva `3009`.

---

## 1. Antes de começar

No painel DNS do domínio `acessar.click`, crie:

| Tipo | Nome | Valor            |
| ---- | ---- | ---------------- |
| A    | @    | IP_DO_SEU_VPS    |
| A    | www  | IP_DO_SEU_VPS    |

Aguarde a propagação (normalmente minutos). Sem isso o SSL falha.

---

## 2. Enviar o código para o VPS

**Opção A — via Git (recomendado):**

```bash
ssh root@SEU_IP
bash <(curl -fsSL https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/deploy/install.sh) \
  --repo https://github.com/SEU_USUARIO/SEU_REPO.git \
  --email seu@email.com
```

**Opção B — enviando os arquivos da sua máquina:**

```bash
# na sua máquina, dentro da pasta do projeto
ssh root@SEU_IP "mkdir -p /var/www/acessarclick"
rsync -av --exclude node_modules --exclude .output --exclude .git \
  ./ root@SEU_IP:/var/www/acessarclick/

ssh root@SEU_IP
cd /var/www/acessarclick
bash deploy/install.sh --email seu@email.com
```

---

## 3. O que o instalador faz

1. Confere se a porta `3009` está livre (aborta se outro projeto usa).
2. Instala nginx, git, certbot e Node.js 22 (só se ainda não existirem).
3. Cria o usuário de sistema `acessarclick` e a pasta `/var/www/acessarclick`.
4. Gera `.env` com `ADMIN_PASSWORD` aleatória (mostrada no fim da instalação).
5. Roda `npm ci` e o build de produção Node (`NITRO_PRESET=node-server`).
6. Cria o serviço systemd `acessarclick` (auto-restart e start no boot).
7. Cria **apenas** o vhost `acessarclick` no nginx e recarrega.
8. Emite SSL Let's Encrypt para `acessar.click` e `www.acessar.click`, com
   renovação automática via `certbot.timer`.

---

## 4. Comandos do dia a dia

```bash
systemctl status acessarclick        # estado do site
journalctl -u acessarclick -f        # logs em tempo real
systemctl restart acessarclick       # reiniciar
bash /var/www/acessarclick/deploy/update.sh   # publicar nova versão
nano /var/www/acessarclick/.env      # trocar a senha do admin
```

Após editar o `.env`, rode `systemctl restart acessarclick`.

---

## 5. Endereços

- Site: `https://acessar.click`
- Painel do cliente: `https://acessar.click/pedido`
- Admin: `https://acessar.click/admin`
- Webhook InfinitePay: `https://acessar.click/api/public/infinitepay/webhook`

---

## 6. Rodar outro projeto no mesmo VPS

Sem conflito: cada projeto usa sua própria porta e seu próprio vhost.
Para instalar uma segunda cópia, use `--port 3010 --domain outrodominio.com`.

## 7. Observação importante sobre os dados

Os pedidos/tickets hoje ficam em memória no processo Node — reiniciar o
serviço limpa o histórico. Para produção com histórico permanente, o passo
seguinte é ligar um banco de dados (PostgreSQL no próprio VPS ou Lovable
Cloud) e trocar `src/lib/orders-repo.server.ts` por queries reais.
