# Persistência em Nuvem (Lovable Cloud)

A aplicação está migrando de armazenamento local em arquivos JSON para um banco de dados relacional PostgreSQL via Lovable Cloud (Supabase). Isso garante que nenhum dado seja perdido durante atualizações do servidor ou deploys.

## Estrutura de Tabelas

### 1. `site_settings`
Armazena configurações globais como Pixel ID e chaves de IA.
- `key` (text, primary key)
- `value` (jsonb)

### 2. `signups`
Armazena leads capturados na landing page.
- `email` (text, primary key)
- `name` (text)
- `phone` (text)
- `source` (text)
- `attempts` (int)
- `profile_url` (text)
- `region` (text)
- `competitor` (text)
- `ad_link` (text)
- `created_at` (timestamptz)
- `last_seen_at` (timestamptz)
- `profile_saved_at` (timestamptz)

### 3. `orders`
Armazena pedidos e tentativas de compra.
- `order_nsu` (text, primary key)
- `status` (text) - tentativa, pago, entregue
- `plan_id` (text)
- `plan_name` (text)
- `price_cents` (int)
- `customer_name` (text)
- `customer_email` (text)
- `customer_phone` (text)
- `profile_url` (text)
- `region` (text)
- `competitor` (text)
- `turbinar_link` (text)
- `posts` (jsonb)
- `bumps` (jsonb)
- `source` (text)
- `created_at` (timestamptz)
- `paid_at` (timestamptz)
- `delivered_at` (timestamptz)
- `cancelled_at` (timestamptz)
- `receipt_url` (text)
- `transaction_nsu` (text)

### 4. `order_messages`
Mensagens do sistema de tickets vinculadas a pedidos.
- `id` (uuid, primary key)
- `order_nsu` (text, references orders)
- `author` (text)
- `text` (text)
- `read_by_admin` (boolean)
- `created_at` (timestamptz)

### 5. `visitor_chats` e `visitor_messages`
Histórico do chat flutuante da home.
- `email` (text, primary key)
- `name` (text)
- `phone` (text)
- `source` (text)
- `last_message_at` (timestamptz)

### 6. `email_logs`
Histórico de e-mails enviados.
- `id` (text, primary key)
- `order_nsu` (text)
- `customer_email` (text)
- `type` (text)
- `subject` (text)
- `content` (text)
- `sent_at` (timestamptz)

### 7. `followup_queue`
Fila de processamento de e-mails de acompanhamento.
- `order_nsu` (text, primary key)
- `next_followup_index` (int)
- `last_sent_at` (timestamptz)

## Plano de Implementação

1. **Schema**: Executar migração SQL para criar tabelas e RLS.
2. **Abstração**: Atualizar os repositórios `src/lib/*-repo.server.ts` para usar o cliente Supabase.
3. **Migração**: Script para ler os arquivos `.data/*.json` e inserir no banco.
4. **Verificação**: Testar fluxos de cadastro, pedido e admin.
